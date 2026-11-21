"""
Deterministic escalation rules. Every escalation comes with a human-readable reason.
"""
import json
import re
from pathlib import Path

from langdetect import DetectorFactory, detect_langs

from shared.contracts import GateDecision

DetectorFactory.seed = 0
CONF_MIN = 0.35    # round 2 (was 0.45), tuned on the red-team set; escalate if unsure about type or priority (queue has ~50 classes, so it's left out)
SIM_MIN = 0.40     # round 2 (was 0.55), tuned on the red-team set; escalate if no close historical precedent exists
HISTORY_MIN = 3    # escalate if this many of the 5 similar past tickets were urgent incidents

KEYWORDS_FILE = Path(__file__).resolve().parents[1] / "eval" / "safety_keywords.json"
DEFAULT_KEYWORDS = {
    "outage": ["outage", "is down", "went down", "offline", "ausfall", "ausgefallen", "störung"],
    "security": ["breach", "hacked", "unauthorized access", "data leak", "ransomware",
                 "sicherheitsvorfall", "datenleck", "gehackt"],
    "critical_service": ["hospital", "patient", "patients", "emr", "telemedicine",
                         "krankenhaus", "patienten", "telemedizin"],
}

# Gemini-remap high is the agreed criticality proxy. These phrases and stems meet
# the 90% / 25-match cutoff on tickets not already caught by the existing security cues.
REMAP_HIGH_SECURITY = re.compile(
    r"\b(?:phishing|security incident|outdated security|access attempts?|"
    r"unauthori[sz]ed(?: access)?|sicherheitsverletzung\w*|sicherheitslücke\w*|"
    r"datenschutzverletzung\w*|schwachstell\w*|zugriffsversuch\w*|angriff\w*|"
    r"unautorisier\w*|access logs|veraltete sicherheitsprotokolle)\b", re.IGNORECASE)

# Commitments the AI must never make on its own (English + German)
RISKY = re.compile(
    r"refund|reimburs|compensat|lawsuit|legal|lawyer|guarantee|discount|price|pricing|\bSLA\b"
    r"|erstatt|rückerstatt|entschädig|anwalt|klage|rechtlich|garantie|rabatt|preis",
    re.IGNORECASE)

# Text trying to steer the AI instead of describing a problem
INJECTION = re.compile(
    r"ignore (all |any |the )?(previous|prior|above|your) (instructions|rules)|disregard (all|previous|your)"
    r"|system prompt|you are now|act as|pretend to be|ignoriere (alle|deine|die vorherigen)|vergiss (alle|deine)",
    re.IGNORECASE)


def _load_urgent_terms():
    data = dict(DEFAULT_KEYWORDS)
    try:  # the data teammate's list, if it's on main yet
        data.update(json.loads(KEYWORDS_FILE.read_text()))
    except Exception:
        pass
    terms = []
    for key in ("outage", "security", "critical_service"):
        values = data.get(key, [])
        if isinstance(values, list):
            terms += [t.lower() for t in values if isinstance(t, str) and t.strip()]
    return sorted(set(terms))


URGENT_TERMS = _load_urgent_terms()


def _unsupported_language(text):
    if len(text.split()) < 4:  # too short to judge reliably
        return None
    try:
        best = detect_langs(text)[0]
    except Exception:
        return None
    return best.lang if best.lang not in ("en", "de") and best.prob >= 0.9 else None


def gate(triage_result, precedents, subject, body):
    text = f"{subject or ''} {body or ''}"
    lowered = text.lower()
    reasons = []
    is_hp_incident = triage_result.priority == "high" and triage_result.type == "Incident"

    if is_hp_incident:
        reasons.append("High-priority incident: page the on-call engineer")

    low = min(triage_result.type_conf, triage_result.priority_conf)
    if low < CONF_MIN:
        reasons.append(f"Low classifier confidence ({low:.0%})")

    top = max((p.similarity for p in precedents), default=0.0)
    if top < SIM_MIN:
        reasons.append(f"No close historical precedent (best match {top:.0%})")

    # Second opinion: what did similar past tickets turn out to be?
    nearest = precedents[:5]
    urgent_history = sum(1 for p in nearest
                         if p.priority.lower() in ("high", "critical") and p.type == "Incident")
    if urgent_history >= HISTORY_MIN and triage_result.priority != "high":
        reasons.append(f"Similar past tickets were urgent incidents ({urgent_history} of {len(nearest)})")

    # Safety override: the dataset labels some real emergencies as medium/low
    hits = {t for t in URGENT_TERMS if re.search(rf"\b{re.escape(t)}\b", lowered)}
    hits.update(m.group(0).lower() for m in REMAP_HIGH_SECURITY.finditer(lowered))
    hits = sorted(hits)
    if hits and not is_hp_incident:
        reasons.append("Mentions an outage, security issue or critical service: " + ", ".join(hits[:3]))

    lang = _unsupported_language(text)
    if lang:
        reasons.append(f"Unsupported language ({lang}): only English and German are handled")

    if INJECTION.search(text):
        reasons.append("Possible prompt injection in the ticket")

    if RISKY.search(text) and not any(RISKY.search(p.answer_snippet) for p in precedents):
        reasons.append("Asks for a refund, legal or pricing commitment that past resolutions don't support")

    return GateDecision(escalate=bool(reasons), reasons=reasons)
