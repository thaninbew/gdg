"""
Owner: retrieval (Aayush until the 5th teammate joins).
Build the index once from the repo root:
    uv run python -m retrieval.retriever 20000    # fast first pass
    uv run python -m retrieval.retriever          # full KB
Only kb_train is indexed. Never index test.parquet (disqualification rule).
Only English and German tickets with a non-empty answer are indexed.
"""
import re
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
LANGUAGES = ("en", "de")
CANDIDATES = 20        # how many neighbours to fetch before de-duplicating
DUP_THRESHOLD = 0.8    # word-set Jaccard at or above this means "same answer"

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
    kb = kb[kb["language"].str.lower().isin(LANGUAGES)]
    # ~21% of rows have no answer (an off-domain subset); they cannot ground a draft
    kb = kb[kb["answer"].str.strip() != ""]
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
            metadatas=[{"subject": str(r.subject)[:300], "answer": str(r.answer)[:1500],
                        "language": str(r.language).lower(), "type": str(r.type),
                        "queue": str(r.queue), "priority": str(r.priority)}
                       for r in part.itertuples(index=False)],
        )
    print(f"indexed {len(kb)} KB tickets ({', '.join(LANGUAGES)}) into {DB_PATH}")


def _get_col():
    global _col
    if _col is None:
        if not DB_PATH.exists():
            raise NotImplementedError("No index yet: run `uv run python -m retrieval.retriever 20000`")
        _col = chromadb.PersistentClient(path=str(DB_PATH)).get_collection(COLLECTION)
    return _col


def _words(text):
    return frozenset(re.findall(r"\w+", text.lower()))


def _is_near_dup(words, kept):
    for other in kept:
        union = words | other
        if union and len(words & other) / len(union) >= DUP_THRESHOLD:
            return True
    return False


def retrieve(subject, body, k=5):
    col = _get_col()
    q = _get_model().encode([ticket_text(subject, body)], normalize_embeddings=True).tolist()
    res = col.query(query_embeddings=q, n_results=CANDIDATES)
    out, kept = [], []
    for tid, dist, meta, doc in zip(res["ids"][0], res["distances"][0],
                                    res["metadatas"][0], res["documents"][0]):
        answer = meta.get("answer", "")
        words = _words(answer)
        if _is_near_dup(words, kept):
            continue
        kept.append(words)
        out.append(Precedent(
            ticket_id=tid, similarity=round(1 - dist, 3), subject=meta.get("subject", ""),
            body_snippet=doc[:300], answer_snippet=answer[:800], language=meta.get("language", ""),
            type=meta.get("type", ""), queue=meta.get("queue", ""), priority=meta.get("priority", ""),
        ))
        if len(out) == k:
            break
    return out


if __name__ == "__main__":
    build_index(int(sys.argv[1]) if len(sys.argv) > 1 else None)
