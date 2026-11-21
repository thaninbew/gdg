"""Fake outputs that match the contracts, so everyone can build before the real parts exist."""
from shared.contracts import Draft, GateDecision, Precedent, TriageResult


def triage(subject, body):
    lang = "de" if any(w in f" {body.lower()} " for w in (" ich ", " und ", " nicht ", " bitte ")) else "en"
    return TriageResult(type="Incident", type_conf=0.81, queue="Technical Support", queue_conf=0.74,
                        priority="high", priority_conf=0.69, language=lang)


def retrieve(subject, body, k=5):
    return [
        Precedent(ticket_id=f"TKT-{i:05d}", similarity=round(0.88 - 0.06 * i, 2),
                  subject="VPN connection drops for remote staff",
                  answer_snippet="We restarted the VPN gateway service and reissued client certificates.",
                  language="en")
        for i in range(k)
    ]


def gate(triage_result, precedents, subject, body):
    reasons = []
    if triage_result.priority == "high" and triage_result.type == "Incident":
        reasons.append("High-priority incident (mock rule)")
    return GateDecision(escalate=bool(reasons), reasons=reasons)


def draft(subject, body, language, precedents):
    ids = [p.ticket_id for p in precedents[:2]]
    return Draft(reply=f"(mock draft) Thank you for reaching out. Based on similar past cases [{', '.join(ids)}], "
                       "we recommend restarting the VPN client. A specialist will follow up.",
                 cited_ticket_ids=ids)
