"""Fake outputs that match the contracts, so everyone can build before the real parts exist."""
from shared.contracts import Draft, GateDecision, Precedent, SentenceCheck, TriageResult


def triage(subject, body):
    lang = "de" if any(w in f" {body.lower()} " for w in (" ich ", " und ", " nicht ", " bitte ")) else "en"
    return TriageResult(type="Incident", type_conf=0.81, queue="Technical Support", queue_conf=0.74,
                        priority="high", priority_conf=0.69, language=lang,
                        key_terms=["vpn", "offline", "all doctors", "urgent"])


def retrieve(subject, body, k=5):
    return [
        Precedent(ticket_id=f"TKT-{i:05d}", similarity=round(0.88 - 0.06 * i, 2),
                  subject="VPN connection drops for remote staff",
                  answer_snippet="We restarted the VPN gateway service and reissued client certificates.",
                  language="en" if i % 2 == 0 else "de",
                  type="Incident", queue="Technical Support", priority="high" if i < 3 else "medium")
        for i in range(k)
    ]


def gate(triage_result, precedents, subject, body):
    reasons = []
    if triage_result.priority == "high" and triage_result.type == "Incident":
        reasons.append("High-priority incident (mock rule)")
    return GateDecision(escalate=bool(reasons), reasons=reasons)


def draft(subject, body, language, precedents):
    ids = [p.ticket_id for p in precedents[:2]]
    sentences = [
        SentenceCheck(text="Thank you for reaching out.", supported=True, source_ticket_id=None, score=1.0),
        SentenceCheck(text=f"Restarting the VPN gateway service resolved this in a similar case [{ids[0]}].",
                      supported=True, source_ticket_id=ids[0], score=0.83),
        SentenceCheck(text="We will also give you a free month of service.",
                      supported=False, source_ticket_id=None, score=0.21),
    ]
    return Draft(reply=" ".join(s.text for s in sentences), cited_ticket_ids=ids, grounded=False,
                 issues=["1 sentence not backed by any past ticket"], sentences=sentences)
