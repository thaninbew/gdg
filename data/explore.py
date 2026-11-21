"""
Owner: Person 1 (data).
Run:  uv run python -m data.explore
Prints the facts the team needs: class balance, empty subjects, language mix,
how rare high-priority incidents are, and near-duplicates between KB and test.
"""
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

D = Path(__file__).parent
kb = pd.read_parquet(D / "kb_train.parquet")
test = pd.read_parquet(D / "test.parquet")
print(f"KB {len(kb)} rows | test {len(test)} rows")

for col in ["type", "queue", "priority", "language"]:
    print(f"\n{col}:\n{kb[col].value_counts(normalize=True).round(3).to_string()}")

print(f"\nEmpty subjects: {(kb['subject'].fillna('').str.strip() == '').mean():.1%}")
hp = ((kb["priority"] == "high") & (kb["type"] == "Incident")).mean()
print(f"High-priority incidents: {hp:.1%} of tickets")

exact = test["body"].isin(set(kb["body"])).mean()
print(f"\nTest bodies that appear word-for-word in the KB: {exact:.1%}")

sample = test.sample(min(2000, len(test)), random_state=0)
vec = TfidfVectorizer(min_df=2, max_features=100_000, sublinear_tf=True).fit(kb["body"].fillna(""))
nn = NearestNeighbors(n_neighbors=1, metric="cosine").fit(vec.transform(kb["body"].fillna("")))
dist, _ = nn.kneighbors(vec.transform(sample["body"].fillna("")))
sim = 1 - dist[:, 0]
for t in (0.8, 0.9, 0.95):
    print(f"Test tickets with a near-duplicate in the KB (cosine >= {t}): {(sim >= t).mean():.1%}")
