"""
Owner: Person 3 (triage classifier).
Train + quick score from the repo root:
    uv run python -m triage.classifier            # full KB
    uv run python -m triage.classifier 20000      # faster first run on 20k rows
Saves triage/models.joblib, which triage() loads.
"""
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from langdetect import DetectorFactory, detect
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.pipeline import make_pipeline

from shared.contracts import TriageResult

DetectorFactory.seed = 0
DATA = Path(__file__).resolve().parents[1] / "data"
MODEL_PATH = Path(__file__).parent / "models.joblib"
TARGETS = ["type", "queue", "priority"]
HP_THRESHOLD = 0.35  # call it "high" if P(high) >= this. Lower = catch more outages. Tune with eval.


def ticket_text(subject, body):
    return f"{subject or ''}\n{body or ''}".strip()


def build_model():
    return make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=150_000, sublinear_tf=True),
        CalibratedClassifierCV(  # turns raw scores into trustworthy probabilities
            LogisticRegression(max_iter=2000, C=2.0, class_weight="balanced"),
            method="sigmoid", cv=3),
    )


def predict_priority(probs, classes, threshold=HP_THRESHOLD):
    classes = list(classes)
    if "high" in classes and probs[classes.index("high")] >= threshold:
        i = classes.index("high")
    else:
        i = int(np.argmax(probs))
    return classes[i], float(probs[i])


def train(sample=None):
    kb = pd.read_parquet(DATA / "kb_train.parquet")
    test = pd.read_parquet(DATA / "test.parquet")
    if sample:
        kb = kb.head(sample)
    X = [ticket_text(s, b) for s, b in zip(kb["subject"], kb["body"])]
    Xt = [ticket_text(s, b) for s, b in zip(test["subject"], test["body"])]
    models = {}
    for t in TARGETS:
        print(f"training {t} on {len(X)} tickets ...")
        m = build_model()
        m.fit(X, kb[t].astype(str))
        models[t] = m
        f1 = f1_score(test[t].astype(str), m.predict(Xt), average="macro")
        print(f"  {t}: holdout macro-F1 = {f1:.3f}")
    joblib.dump(models, MODEL_PATH)
    print(f"saved {MODEL_PATH}")


_models = None


def _load():
    global _models
    if _models is None:
        if not MODEL_PATH.exists():
            raise NotImplementedError("No trained model yet: run `uv run python -m triage.classifier`")
        _models = joblib.load(MODEL_PATH)
    return _models


def detect_language(text):
    try:
        return "de" if detect(text) == "de" else "en"
    except Exception:
        return "en"


def triage(subject, body):
    models = _load()
    x = [ticket_text(subject, body)]
    out = {}
    for t in TARGETS:
        probs = models[t].predict_proba(x)[0]
        classes = models[t].classes_
        if t == "priority":
            label, conf = predict_priority(probs, classes)
        else:
            i = int(np.argmax(probs))
            label, conf = classes[i], float(probs[i])
        out[t], out[f"{t}_conf"] = str(label), round(conf, 3)
    return TriageResult(**out, language=detect_language(x[0]))


if __name__ == "__main__":
    train(int(sys.argv[1]) if len(sys.argv) > 1 else None)
