"""
Builds the local FAISS retrieval index from Sanket_ML/rag/docs/*.md.

Doc format (one chunk per "## " heading):

    ## Heading [reference]        <- "[reference]" = background only, never
                                     turned into steps
    Summary: one plain sentence.
    - bullet step                 <- each bullet is one instruction step
    - bullet step
    Source: where this comes from

Tags: "[reference]" = background only, never turned into steps;
"[urgent]" = a "call for help" chunk that leads the guidance when triage
urgency is high. Reference chunks have prose lines instead of bullets. Every chunk gets a
stable `key` ("<doc>:<n>", n = position within its doc) so translated
copies in docs_hi/ and docs_mr/ can be matched to the English chunk
1:1 — retrieval always runs on the English index, and the translated
text of the matching chunk is served (see rag/retriever.py).

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

RAG_DIR = Path(__file__).resolve().parent
DOCS_DIR = RAG_DIR / "docs"
INDEX_DIR = RAG_DIR / "index"
TRANSLATION_DIRS = {"hi": RAG_DIR / "docs_hi", "mr": RAG_DIR / "docs_mr"}
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

SECTION_RE = re.compile(r"^##\s+(.+)$", re.MULTILINE)


def parse_doc_dir(docs_dir: Path) -> list[dict]:
    chunks = []
    for md_path in sorted(docs_dir.glob("*.md")):
        text = md_path.read_text(encoding="utf-8")
        headings = list(SECTION_RE.finditer(text))
        for n, m in enumerate(headings):
            heading = m.group(1).strip()
            # trailing [tags]: [reference] (background only), [urgent] ("call for help" chunk)
            tags = set(re.findall(r"\[(\w+)\]", heading))
            heading = re.sub(r"\s*\[\w+\]", "", heading).strip()
            kind = "reference" if "reference" in tags else "action"
            urgent = "urgent" in tags

            end = headings[n + 1].start() if n + 1 < len(headings) else len(text)
            body = text[m.end():end].strip()

            summary = ""
            source = "Unknown source"
            bullets: list[str] = []
            prose: list[str] = []
            for line in body.splitlines():
                line = line.strip()
                if not line:
                    continue
                if line.startswith("Summary:"):
                    summary = line[len("Summary:"):].strip()
                elif line.startswith("Source:"):
                    source = line[len("Source:"):].strip()
                elif line.startswith("- "):
                    bullets.append(line[2:].strip())
                else:
                    prose.append(line)

            chunks.append({
                "key": f"{md_path.stem}:{n}",
                "doc": md_path.stem,
                "heading": heading,
                "kind": kind,
                "urgent": urgent,
                "summary": summary,
                "bullets": bullets,
                "text": " ".join(prose) if prose else " ".join(bullets),
                "source": source,
                "position": n,
            })
    return chunks


def attach_translations(chunks: list[dict]) -> None:
    """
    Attach docs_hi/ and docs_mr/ text to the matching English chunk by
    key. Retrieval only ever runs on the English index, so a translation
    must be a strict 1:1 mirror: same chunk keys, same tags, same number
    of bullet steps, same source line. Anything else fails the build —
    a silently dropped or extra step in another language would be a
    medical-content bug.
    """
    by_key = {c["key"]: c for c in chunks}
    problems = []
    for lang, folder in TRANSLATION_DIRS.items():
        if not folder.exists():
            continue
        translated = parse_doc_dir(folder)
        tkeys = {t["key"] for t in translated}
        for k in sorted(set(by_key) - tkeys):
            problems.append(f"[{lang}] missing translation for {k}")
        for k in sorted(tkeys - set(by_key)):
            problems.append(f"[{lang}] {k} has no English counterpart")
        for t in translated:
            en = by_key.get(t["key"])
            if en is None:
                continue
            k = t["key"]
            if (t["kind"], t["urgent"]) != (en["kind"], en["urgent"]):
                problems.append(f"[{lang}] {k}: tags differ from English ([reference]/[urgent])")
            if len(t["bullets"]) != len(en["bullets"]):
                problems.append(f"[{lang}] {k}: {len(t['bullets'])} bullets vs {len(en['bullets'])} in English")
            if t["source"] != en["source"]:
                problems.append(f"[{lang}] {k}: Source line differs from English")
            if not t["summary"]:
                problems.append(f"[{lang}] {k}: missing Summary")
            if not t["heading"]:
                problems.append(f"[{lang}] {k}: missing heading")
            en.setdefault("translations", {})[lang] = {
                "heading": t["heading"],
                "summary": t["summary"],
                "bullets": t["bullets"],
                "text": t["text"],
            }
        print(f"  [{lang}] {len(translated)} translated chunks, "
              f"{sum(len(t['bullets']) for t in translated)} bullet steps")
    if problems:
        raise RuntimeError("Translation parity problems:\n  " + "\n  ".join(problems))


def build():
    chunks = parse_doc_dir(DOCS_DIR)
    if not chunks:
        raise RuntimeError(f"No chunks found under {DOCS_DIR} — nothing to index.")

    problems = []
    for c in chunks:
        if not c["summary"]:
            problems.append(f"{c['key']}: missing Summary")
        if c["kind"] == "action" and not c["bullets"]:
            problems.append(f"{c['key']}: action chunk has no bullet steps")
        if c["source"] == "Unknown source":
            problems.append(f"{c['key']}: missing Source")
    if problems:
        raise RuntimeError("Doc format problems:\n  " + "\n  ".join(problems))

    print(f"Parsed {len(chunks)} chunks from {len({c['doc'] for c in chunks})} documents "
          f"({sum(len(c['bullets']) for c in chunks)} bullet steps).")

    attach_translations(chunks)

    model = SentenceTransformer(EMBEDDING_MODEL)
    texts = [f"{c['heading']}. {c['summary']} {c['text']}" for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    embeddings = np.asarray(embeddings, dtype="float32")

    index = faiss.IndexFlatIP(embeddings.shape[1])  # cosine via normalized vectors
    index.add(embeddings)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_DIR / "docs.faiss"))
    (INDEX_DIR / "metadata.json").write_text(
        json.dumps({"model": EMBEDDING_MODEL, "chunks": chunks}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote index + metadata for {len(chunks)} chunks to {INDEX_DIR}")


if __name__ == "__main__":
    build()
