"""
Guidance composer: retrieved evidence -> structured, source-cited steps.

Deliberately NOT a generative model. Every step is a bullet taken
verbatim from a retrieved document chunk, and carries that chunk's
source. Nothing is generated, paraphrased or inferred at runtime, so
the output cannot contain a medical claim that isn't in the corpus —
zero hallucination by construction. (Wording was authored into the docs
ahead of time; see rag/docs/*.md and, for Hindi/Marathi, docs_hi/ /
docs_mr/.)

If retrieval finds nothing relevant enough, the composer refuses to
guess and returns the localized "seek professional medical help"
response instead.
"""

import re
from typing import Callable, Optional

from labels import CLASS_QUERY, labels  # noqa: F401  (CLASS_QUERY re-exported for app.py)

# Below this best-match cosine score, retrieval is treated as "nothing
# relevant" rather than showing loosely-related text.
MIN_TOP_SCORE = 0.30
# A second document contributes only if it scores this close to the best.
SECONDARY_RELATIVE_CUTOFF = 0.85
SECONDARY_BULLETS = 3
MAX_STEPS = 14


def safe_fallback(lang: str = "en", reason: str = "no_evidence", urgency: str = "unable_to_determine",
                  red_flags: Optional[list] = None) -> dict:
    L = labels(lang)
    summary_key = {
        "no_evidence": "safe_summary",
        "no_index": "safe_summary_no_index",
        "error": "safe_summary_error",
    }.get(reason, "safe_summary")
    return {
        "title": L["safe_title"],
        "urgency": urgency,
        "summary": L[summary_key],
        "steps": [],
        "red_flags": red_flags or [],
        "sources": [],
        "grounded": False,
        "generation_method": "safety_fallback",
        "language": lang,
    }


def _norm(text: str) -> str:
    return re.sub(r"\W+", " ", text.lower()).strip()


def _select(retrieved: list[dict], doc_lookup: Callable[[str], list[dict]], urgency: str):
    """
    Returns [(chunk, bullets_to_use), ...] in the order steps should appear.

    Primary document (best match): all its action chunks, in the
    document's authored order — that order IS the procedure (e.g. cool ->
    don't-use-ice -> cover -> seek help). When urgency is high, the
    single most important "call for help" bullet is lifted to the very
    top, and the rest of the doc keeps its authored order (duplicates
    are dropped later). A second document only contributes if it scores
    close to the best.
    """
    ranked = sorted(retrieved, key=lambda c: c["score"], reverse=True)
    top = ranked[0]
    primary_doc = top["doc"]

    primary = [c for c in doc_lookup(primary_doc) if c["kind"] == "action"]
    if not primary:
        return []

    selected = []
    if urgency == "high":
        urgent = [c for c in primary if c.get("urgent")]
        if urgent:
            selected.append((urgent[0], urgent[0]["bullets"][:1]))
        elif primary_doc != "general_emergency":
            # this doc has no "call for help" chunk — lead with the general one
            selected += [(c, c["bullets"]) for c in doc_lookup("general_emergency") if c.get("urgent")]
    selected += [(c, c["bullets"]) for c in primary]

    seen_docs = {primary_doc}
    for c in ranked:
        if c["doc"] in seen_docs or c["kind"] != "action":
            continue
        if c["score"] >= SECONDARY_RELATIVE_CUTOFF * top["score"]:
            selected.append((c, c["bullets"][:SECONDARY_BULLETS]))
            seen_docs.add(c["doc"])
    return selected


def compose_guidance(
    class_name: Optional[str],
    triage: dict,
    retrieved: list[dict],
    doc_lookup: Callable[[str], list[dict]],
    kit_available: Optional[bool] = None,
    lang: str = "en",
) -> dict:
    """Never raises for empty/weak retrieval — returns the safe fallback."""
    L = labels(lang)
    urgency = triage.get("urgency", "unable_to_determine")
    red_flags = triage.get("red_flags", [])

    if class_name == "Normal":
        out = safe_fallback(lang, urgency=urgency, red_flags=red_flags)
        out.update(title=L["no_wound_title"], summary=L["no_wound_summary"], generation_method="no_detection")
        return out

    if not retrieved or max(c["score"] for c in retrieved) < MIN_TOP_SCORE:
        return safe_fallback(lang, urgency=urgency, red_flags=red_flags)

    selected = _select(retrieved, doc_lookup, urgency)
    if not selected:
        return safe_fallback(lang, urgency=urgency, red_flags=red_flags)

    steps, sources, seen = [], [], set()
    for chunk, bullets in selected:
        for bullet in bullets:
            key = _norm(bullet)
            if key in seen:
                continue
            seen.add(key)
            steps.append({"step": len(steps) + 1, "instruction": bullet, "source": chunk["source"]})
            if chunk["source"] not in sources:
                sources.append(chunk["source"])
            if len(steps) >= MAX_STEPS:
                break
        if len(steps) >= MAX_STEPS:
            break

    if kit_available is False:
        steps.append({"step": len(steps) + 1, "instruction": L["kit_note"], "source": L["kit_source"]})

    title = L["general_title"] if class_name is None else f"{L['classes'].get(class_name, class_name)} - {L['title_suffix']}"

    return {
        "title": title,
        "urgency": urgency,
        "summary": selected[0][0]["summary"],
        "steps": steps,
        "red_flags": red_flags,
        "sources": sources,
        "grounded": True,
        "generation_method": "retrieval+template",
        "language": lang,
    }
