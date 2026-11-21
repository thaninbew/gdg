"""
Owner: Person 1 (data).
Run ONCE from the repo root:  uv run python -m data.split
Creates data/kb_train.parquet (80%, allowed for training + retrieval)
and data/test.parquet (20% holdout, ONLY for scoring). Same seed as the official doc.
"""
from pathlib import Path

from datasets import load_dataset

OUT = Path(__file__).parent

ds = load_dataset("Tobi-Bueck/customer-support-tickets")
df = ds["train"].to_pandas()
df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
df["ticket_id"] = [f"TKT-{i:05d}" for i in range(len(df))]
df["subject"] = df["subject"].fillna("")

split_idx = int(len(df) * 0.8)
kb = df.iloc[:split_idx].copy()
test = df.iloc[split_idx:].copy()

kb.to_parquet(OUT / "kb_train.parquet", index=False)
test.to_parquet(OUT / "test.parquet", index=False)
print(f"kb_train: {len(kb)} rows | test: {len(test)} rows | columns: {list(df.columns)}")
