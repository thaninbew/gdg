"""
Owner: retrieval (Aayush until the 5th teammate joins).
Build the index once from the repo root:
    uv run python -m retrieval.retriever 20000    # fast first pass
    uv run python -m retrieval.retriever          # full KB
Only kb_train is indexed. Never index test.parquet (disqualification rule).
"""
import sys
from pathlib import Path

import chromadb
import pandas as pd
from sentence_transformers import SentenceTransformer

from shared.contracts import Precedent

DATA = Path(__file__).resolve().parents[1] / "data"
DB_PATH = Path(__file__).parent / "chroma"
COLLECTION = "kb_train"
# One embedding space for English and German, so a German ticket can match an English precedent
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

_model = None
_col = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def ticket_text(subject, body):
    return f"{subject or ''}\n{body or ''}".strip()


def build_index(limit=None):
    kb = pd.read_parquet(DATA / "kb_train.parquet").fillna("")
    if limit:
        kb = kb.head(limit)
    texts = [ticket_text(s, b) for s, b in zip(kb["subject"], kb["body"])]
    emb = _get_model().encode(texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
    client = chromadb.PersistentClient(path=str(DB_PATH))
    try:
        client.delete_collection(COLLECTION)
    except Exception:
        pass
    col = client.create_collection(COLLECTION, metadata={"hnsw:space": "cosine"})
    step = 5000
    for i in range(0, len(kb), step):
        part = kb.iloc[i:i + step]
        col.add(
            ids=part["ticket_id"].tolist(),
            embeddings=emb[i:i + step].tolist(),
            documents=texts[i:i + step],
            metadatas=[{"subject": str(s)[:300], "answer": str(a)[:1500], "language": str(l)}
                       for s, a, l in zip(part["subject"], part["answer"], part["language"])],
        )
    print(f"indexed {len(kb)} KB tickets into {DB_PATH}")


def _get_col():
    global _col
    if _col is None:
        if not DB_PATH.exists():
            raise NotImplementedError("No index yet: run `uv run python -m retrieval.retriever 20000`")
        _col = chromadb.PersistentClient(path=str(DB_PATH)).get_collection(COLLECTION)
    return _col


def retrieve(subject, body, k=5):
    col = _get_col()
    q = _get_model().encode([ticket_text(subject, body)], normalize_embeddings=True).tolist()
    res = col.query(query_embeddings=q, n_results=k)
    return [
        Precedent(ticket_id=tid, similarity=round(1 - dist, 3), subject=meta.get("subject", ""),
                  body_snippet=doc[:300], answer_snippet=meta.get("answer", "")[:800],
                  language=meta.get("language", ""))
        for tid, dist, meta, doc in zip(res["ids"][0], res["distances"][0],
                                        res["metadatas"][0], res["documents"][0])
    ]


if __name__ == "__main__":
    build_index(int(sys.argv[1]) if len(sys.argv) > 1 else None)
