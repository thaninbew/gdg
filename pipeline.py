"""
Owner: Aayush (integration). Connects the four stages.
Each stage uses the real module once it's ready and falls back to mocks until then.
Force a mock with an env var, e.g.:  MOCK=draft,retrieve uv run python -m ui.app
"""
import os
import time

from shared import mocks
from shared.contracts import Draft

FORCE_MOCK = {s.strip() for s in os.getenv("MOCK", "").split(",") if s.strip()}


def _load(module, name):
    try:
        return getattr(__import__(module, fromlist=[name]), name)
    except ImportError as e:
        print(f"[pipeline] {module} unavailable ({e}); using mock")
        return None


REAL = {
    "triage": _load("triage.classifier", "triage"),
    "retrieve": _load("retrieval.retriever", "retrieve"),
    "gate": _load("gate.gate", "gate"),
    "draft": _load("drafting.drafter", "draft"),
}


def _call(stage, *args):
    fn = REAL[stage]
    if fn is not None and stage not in FORCE_MOCK:
        try:
            return fn(*args), "real"
        except NotImplementedError:
            pass
    return getattr(mocks, stage)(*args), "mock"


def run(subject, body):
    subject, body = (subject or "").strip(), (body or "").strip()
    if not body:
        raise ValueError("The ticket body is empty. Paste the customer's message to triage it.")
    ms, src = {}, {}

    t = time.perf_counter()
    tri, src["triage"] = _call("triage", subject, body)
    ms["triage_ms"] = (time.perf_counter() - t) * 1000

    t = time.perf_counter()
    precs, src["retrieve"] = _call("retrieve", subject, body)
    ms["retrieval_ms"] = (time.perf_counter() - t) * 1000

    t = time.perf_counter()
    decision, src["gate"] = _call("gate", tri, precs, subject, body)
    ms["gate_ms"] = (time.perf_counter() - t) * 1000

    t = time.perf_counter()
    try:
        draft, src["draft"] = _call("draft", subject, body, tri.language, precs)
    except Exception as e:  # fail closed: no trustworthy draft means escalate
        draft, src["draft"] = Draft(reply="", grounded=False, issues=[f"Drafting failed: {e}"]), "error"
    ms["draft_ms"] = (time.perf_counter() - t) * 1000

    reasons = list(decision.reasons)
    if not draft.grounded:
        reasons.append("Draft failed the grounding check: " + "; ".join(draft.issues))
    ms["total_ms"] = sum(ms.values())
    return {
        "triage": tri.model_dump(),
        "precedents": [p.model_dump() for p in precs],
        "escalate": bool(reasons),
        "reasons": reasons,
        "draft": draft.model_dump(),
        "timings_ms": ms,
        "sources": src,
    }
