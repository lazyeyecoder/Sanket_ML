"""
Local semantic retrieval over the SANKET first-aid document corpus.

Loads the FAISS index + metadata built by build_index.py once (module-
level cache) and exposes retrieve(query, k) for the RAG step in slm.py.
"""

import json
from pathlib import Path
from typing import Optional

INDEX_DIR = Path(__file__).resolve().parent / "index"

_state = {"index": None, "chunks": None, "model": None, "embedder": None}


class RetrievalUnavailable(Exception):
    """Raised when the index/docs are missing so callers can fail safely."""


def _ensure_loaded():
    if _state["index"] is not None:
        return

    index_path = INDEX_DIR / "docs.faiss"
    meta_path = INDEX_DIR / "metadata.json"
    if not index_path.exists() or not meta_path.exists():
        raise RetrievalUnavailable(
            f"RAG index not found at {INDEX_DIR}. Run "
            "`python -m rag.build_index` from the Sanket_ML directory first."
        )

    import faiss  # local import: keep this optional dependency out of inference.py's path

    from rag._torchaudio_shim import ensure_importable
    ensure_importable()
    from sentence_transformers import SentenceTransformer

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    _state["index"] = faiss.read_index(str(index_path))
    _state["chunks"] = meta["chunks"]
    _state["model"] = meta["model"]
    _state["embedder"] = SentenceTransformer(meta["model"])


def retrieve(query: str, k: int = 4, min_score: float = 0.15) -> list[dict]:
    """
    Returns up to k chunks: [{doc, heading, text, source, score}, ...],
    filtered to a minimum cosine-similarity score so an unrelated query
    doesn't pull back irrelevant chunks just to fill k slots.
    """
    _ensure_loaded()

    import numpy as np

    query_vec = _state["embedder"].encode([query], normalize_embeddings=True)
    query_vec = np.asarray(query_vec, dtype="float32")

    scores, indices = _state["index"].search(query_vec, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        if score < min_score:
            continue
        chunk = dict(_state["chunks"][idx])
        chunk["score"] = float(score)
        results.append(chunk)
    return results


def is_ready() -> bool:
    try:
        _ensure_loaded()
        return True
    except RetrievalUnavailable:
        return False
