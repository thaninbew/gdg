"""
Owner: Aayush (moves to Person 1 once data work is done, since thresholds come from eval).
Deterministic escalation rules. Every escalation comes with a human-readable reason.
"""
import re

from shared.contracts import GateDecision

CONF_MIN = 0.45   # escalate if the classifier is unsure (tune with eval)
SIM_MIN = 0.55    # escalate if no close historical precedent exists (tune with eval)

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


def gate(triage_result, precedents, subject, body):
    text = f"{subject or ''} {body or ''}"
    reasons = []
    if triage_result.priority == "high" and triage_result.type == "Incident":
        reasons.append("High-priority incident: page the on-call engineer")
    low = min(triage_result.type_conf, triage_result.queue_conf, triage_result.priority_conf)
    if low < CONF_MIN:
        reasons.append(f"Low classifier confidence ({low:.0%})")
    top = max((p.similarity for p in precedents), default=0.0)
    if top < SIM_MIN:
        reasons.append(f"No close historical precedent (best match {top:.0%})")
    if INJECTION.search(text):
        reasons.append("Possible prompt injection in the ticket")
    if RISKY.search(text) and not any(RISKY.search(p.answer_snippet) for p in precedents):
        reasons.append("Asks for a refund, legal or pricing commitment that past resolutions don't support")
    return GateDecision(escalate=bool(reasons), reasons=reasons)
