"""
Owner: Person 1 (after data exploration).
Run from the repo root:
    uv run python -m eval.evaluate            # full holdout
    uv run python -m eval.evaluate 3000       # quicker sample
Reports holdout macro-F1, calibration (ECE), High-Priority Incident Recall across
thresholds, and triage latency. Test labels are read ONLY to score predictions.
"""
import sys
import time

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score

from triage.classifier import DATA, _load, predict_priority, ticket_text


def ece(conf, correct, bins=10):
    """Expected calibration error: 0 means '80% confident' really is right 80% of the time."""
    conf, correct = np.asarray(conf), np.asarray(correct, dtype=float)
    edges, total = np.linspace(0, 1, bins + 1), 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            total += m.mean() * abs(conf[m].mean() - correct[m].mean())
    return total


def main(n=None):
    test = pd.read_parquet(DATA / "test.parquet")
    if n:
        test = test.sample(n, random_state=0)
    X = [ticket_text(s, b) for s, b in zip(test["subject"], test["body"])]
    models = _load()

    t0 = time.perf_counter()
    probs = {t: models[t].predict_proba(X) for t in models}
    per_ticket = (time.perf_counter() - t0) * 1000 / len(X)
    print(f"{len(X)} holdout tickets | triage latency ~{per_ticket:.2f} ms per ticket\n")

    for t in ("type", "queue"):
        classes = models[t].classes_
        pred = classes[probs[t].argmax(1)]
        y = test[t].astype(str).values
        print(f"{t:8s} macro-F1 {f1_score(y, pred, average='macro'):.3f} | ECE {ece(probs[t].max(1), pred == y):.3f}")

    y_pri = test["priority"].astype(str).values
    hp_incident = (y_pri == "high") & (test["type"].astype(str).values == "Incident")
    classes = models["priority"].classes_
    print("\npriority threshold sweep (predict 'high' when P(high) >= threshold)")
    print("threshold | macro-F1 | high-priority incident recall | share flagged high")
    for thr in (0.20, 0.25, 0.30, 0.35, 0.40, 0.50):
        pred = np.array([predict_priority(p, classes, thr)[0] for p in probs["priority"]])
        recall = (pred[hp_incident] == "high").mean() if hp_incident.any() else float("nan")
        print(f"   {thr:.2f}   |  {f1_score(y_pri, pred, average='macro'):.3f}  |"
              f"            {recall:.3f}             |      {(pred == 'high').mean():.3f}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else None)
