"""
Builds the local FAISS retrieval index from Sanket_ML/rag/docs/*.md.

Chunking: each "## " heading in a doc is treated as one chunk (these
source documents were deliberately written as short, atomic passages —
roughly 100-250 words each, in the same ballpark as the ~300-token
chunking the project's reference literature uses). Each chunk keeps its
own "Source:" line as citation metadata.

Run from the Sanket_ML directory:
    python -m rag.build_index
"""

import json
import re
from pathlib import Path

import faiss
import numpy as np

from rag._torchaudio_shim import ensure_importable

ensure_importable()
from sentence_transformers import SentenceTransformer  # noqa: E402

DOCS_DIR = Path(__file__).resolve().parent / "docs"
INDEX_DIR = Path(__file__).resolve().parent / "index"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

SECTION_RE = re.compile(r"^##\s+(.+)$", re.MULTILINE)


def parse_chunks():
    chunks = []
    for md_path in sorted(DOCS_DIR.glob("*.md")):
        text = md_path.read_text(encoding="utf-8")
        headings = list(SECTION_RE.finditer(text))
        for i, m in enumerate(headings):
            heading = m.group(1).strip()
            kind = "action"
            if heading.endswith("[reference]"):
                kind = "reference"
                heading = heading[: -len("[reference]")].strip()

            start = m.end()
            end = headings[i + 1].start() if i + 1 < len(headings) else len(text)
            body = text[start:end].strip()

            source_match = re.search(r"^Source:\s*(.+)$", body, re.MULTILINE)
            source = source_match.group(1).strip() if source_match else "Unknown source"
            body_wo_source = re.sub(r"^Source:.*$", "", body, flags=re.MULTILINE).strip()

            chunks.append({
                "doc": md_path.stem,
                "heading": heading,
                "text": body_wo_source,
                "source": source,
                "kind": kind,  # "action" -> can become a numbered step; "reference" -> context only
                "position": len(chunks),  # position within its source doc (docs are authored in procedural order)
            })
    return chunks


def build():
    chunks = parse_chunks()
    if not chunks:
        raise RuntimeError(f"No chunks found under {DOCS_DIR} — nothing to index.")

    print(f"Parsed {len(chunks)} chunks from {len(list(DOCS_DIR.glob('*.md')))} documents.")

    model = SentenceTransformer(EMBEDDING_MODEL)
    texts = [f"{c['heading']}. {c['text']}" for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)
    embeddings = np.asarray(embeddings, dtype="float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # cosine similarity via normalized vectors
    index.add(embeddings)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_DIR / "docs.faiss"))
    (INDEX_DIR / "metadata.json").write_text(
        json.dumps({"model": EMBEDDING_MODEL, "chunks": chunks}, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote index + metadata for {len(chunks)} chunks to {INDEX_DIR}")


if __name__ == "__main__":
    build()
