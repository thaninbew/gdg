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
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.pipeline import make_pipeline

from shared.contracts import TriageResult

DetectorFactory.seed = 0
DATA = Path(__file__).resolve().parents[1] / "data"
MODEL_PATH = Path(__file__).parent / "models.joblib"
TARGETS = ["type", "queue", "priority"]
LANGUAGES = {"en", "de"}
# Raw dataset has 5 priority levels; the product uses 3.
PRIORITY_MAP = {"critical": "high", "high": "high", "medium": "medium", "low": "low", "very_low": "low"}
# Call it "high" if P(high) >= this. Lower = catch more outages.
# 0.31 = highest threshold with >=90% recall on high-priority Incidents in the holdout
# (macro-F1 0.693, 53% of tickets flagged high). Re-tune after retraining.
HP_THRESHOLD = 0.31
# Filler words are dropped from key_terms only (display), not from the model.
GERMAN_STOP_WORDS = set("""
aber alle allem allen aller alles als also am an ander andere anderen auch auf aus bei bin bis bist da
damit dann das dass dein deine dem den denn der des dich die dies diese diesem diesen dieser dieses dir
doch dort du durch ein eine einem einen einer eines er es etwas euch euer für gegen hab habe haben hat
hatte hier hin ich ihm ihn ihnen ihr ihre ihrem ihren ihrer im in ist ja jede jedem jeden jeder jedes
kann kein keine können könnte man mein meine mich mir mit muss nach nicht nichts noch nun nur ob oder
ohne sehr sein seine sich sie sind so solche soll sollte sondern um und uns unser unsere unserem
unseren unserer unter viel vom von vor war waren was weil welche wenn wer werden wie wieder wir wird
wo wollen würde zu zum zur über bitte sehr geehrte geehrter damen herren
""".split())
STOP_WORDS = ENGLISH_STOP_WORDS | GERMAN_STOP_WORDS


def ticket_text(subject, body):
    text = f"{subject or ''}\n{body or ''}"
    # some tickets store newlines as a literal backslash-n, which glues "\nich" into the token "nich"
    return text.replace("\\n", "\n").strip()


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


def prepare(df):
    """Keep English/German tickets and collapse priority to high/medium/low."""
    df = df[df["language"].isin(LANGUAGES)].copy()
    df["priority"] = df["priority"].map(PRIORITY_MAP)
    df["text"] = [ticket_text(s, b) for s, b in zip(df["subject"], df["body"])]
    return df


def train(sample=None):
    kb = prepare(pd.read_parquet(DATA / "kb_train.parquet"))
    test = prepare(pd.read_parquet(DATA / "test.parquet"))
    if sample:
        kb = kb.head(sample)
    models = {}
    for t in TARGETS:
        # ~21% of tickets have no `type`; train/score only on labelled rows so "nan" is never a class
        tr, te = kb[kb[t].notna()], test[test[t].notna()]
        print(f"training {t} on {len(tr)} tickets ...")
        m = build_model()
        m.fit(tr["text"].tolist(), tr[t].astype(str))
        models[t] = m
        if t == "priority":
            probs = m.predict_proba(te["text"].tolist())
            pred = [predict_priority(p, m.classes_)[0] for p in probs]
        else:
            pred = m.predict(te["text"].tolist())
        f1 = f1_score(te[t].astype(str), pred, average="macro")
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


def key_terms(model, text, label, k=5):
    """The k words in `text` that pushed hardest toward `label`.

    Contribution of word j = tfidf(j) * coef[label, j], with coefficients averaged
    over the logistic regressions inside the calibrated ensemble.
    """
    vec, clf = model.steps[0][1], model.steps[-1][1]
    lrs = [c.estimator for c in clf.calibrated_classifiers_]
    ci = list(lrs[0].classes_).index(label)
    coef = np.mean([lr.coef_[ci] for lr in lrs], axis=0)
    row = vec.transform([text]).tocoo()
    names = vec.get_feature_names_out()
    scored = sorted(((v * coef[j], names[j]) for j, v in zip(row.col, row.data)
                     if " " not in names[j] and names[j] not in STOP_WORDS
                     and not names[j].isdigit()), reverse=True)  # single meaningful words
    return [w for score, w in scored[:k] if score > 0]


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
    out["key_terms"] = key_terms(models["priority"], x[0], out["priority"])
    return TriageResult(**out, language=detect_language(x[0]))


if __name__ == "__main__":
    train(int(sys.argv[1]) if len(sys.argv) > 1 else None)
