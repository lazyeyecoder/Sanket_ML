"""
Local semantic retrieval over the SANKET first-aid document corpus.

Loads the FAISS index + metadata built by build_index.py once
(module-level cache). Retrieval ALWAYS runs on the English index —
the embedding model is English-only — and, when a language other than
"en" is requested, the matching translated chunk (same `key`, built
from docs_hi/ / docs_mr/) is served instead of the English text.
Ranking is therefore identical across languages.
"""

import json
from pathlib import Path

INDEX_DIR = Path(__file__).resolve().parent / "index"

_state = {"index": None, "chunks": None, "model": None, "embedder": None}

# fields replaced by the translated chunk when lang != "en"
_LOCALIZED_FIELDS = ("heading", "summary", "bullets", "text")


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


def _localize(chunk: dict, lang: str) -> dict:
    out = dict(chunk)
    out.pop("translations", None)
    if lang != "en":
        tr = chunk.get("translations", {}).get(lang)
        if tr:
            for f in _LOCALIZED_FIELDS:
                if f in tr:
                    out[f] = tr[f]
    return out


def retrieve(query: str, k: int = 4, min_score: float = 0.15, lang: str = "en") -> list[dict]:
    """
    Up to k chunks, best first: [{key, doc, heading, kind, urgent, summary,
    bullets, text, source, position, score}, ...] filtered to a minimum
    cosine similarity so an unrelated query doesn't return filler.
    """
    _ensure_loaded()

    import numpy as np

    query_vec = _state["embedder"].encode([query], normalize_embeddings=True)
    query_vec = np.asarray(query_vec, dtype="float32")

    scores, indices = _state["index"].search(query_vec, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or score < min_score:
            continue
        chunk = _localize(_state["chunks"][idx], lang)
        chunk["score"] = float(score)
        results.append(chunk)
    return results


def doc_chunks(doc: str, lang: str = "en") -> list[dict]:
    """All chunks of one document, in authored order (score not set)."""
    _ensure_loaded()
    found = [c for c in _state["chunks"] if c["doc"] == doc]
    return [_localize(c, lang) for c in sorted(found, key=lambda c: c["position"])]


def is_ready() -> bool:
    try:
        _ensure_loaded()
        return True
    except RetrievalUnavailable:
        return False
