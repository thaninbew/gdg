"""
"Plain RAG" baseline for comparison with SentinelDesk.
Same retriever, same past tickets, same model (gemma4:e4b via Ollama), but:
no safety rules, no escalation gate and no sentence-level grounding checks.

    uv run python -m eval.baseline "VPN broken" "I can't connect to the VPN since this morning."
"""
import sys
import time

import ollama

from retrieval.retriever import retrieve

MODEL = "gemma4:e4b"
PROMPT = (
    "You are a helpful IT support agent. Answer the customer's ticket using the past tickets below.\n\n"
    "PAST TICKETS:\n{context}\n\nCUSTOMER TICKET:\nSubject: {subject}\n{body}\n\nYour reply to the customer:"
)


def answer(subject, body, precedents=None):
    """Returns {"reply", "precedents", "escalate": False, "latency_ms"}."""
    t = time.perf_counter()
    if precedents is None:
        precedents = retrieve(subject, body)
    context = "\n\n".join(f"[{p.ticket_id}]\nSubject: {p.subject}\nResolution: {p.answer_snippet}"
                          for p in precedents)
    resp = ollama.chat(model=MODEL, think=False, options={"temperature": 0.2, "num_ctx": 8192},
                       messages=[{"role": "user", "content": PROMPT.format(
                           context=context, subject=subject or "", body=body or "")}])
    return {
        "reply": (resp.message.content or "").strip(),
        "precedents": [p.model_dump() for p in precedents],
        "escalate": False,  # the baseline has no gate: every reply goes to the customer
        "latency_ms": (time.perf_counter() - t) * 1000,
    }


if __name__ == "__main__":
    out = answer(sys.argv[1], sys.argv[2])
    print(out["reply"])
