"""
Turns retrieved evidence chunks into a structured, grounded first-aid
instruction set (the schema in README §8 of the integration brief).

Two paths, in order:

1. Ollama (if installed and running locally) with a small instruct model,
   strictly prompted to use ONLY the provided evidence — no pretrained
   medical knowledge, no invented steps, no dosages. Its JSON output is
   validated; anything that doesn't parse or isn't grounded falls
   through to path 2.

2. A deterministic template composer: no generation at all, just
   formats the retrieved chunks directly into numbered steps. Zero
   hallucination risk by construction. This is also the required
   fallback per README §11 ("If SLM fails but retrieved guidance
   exists, show the grounded retrieved instructions directly").

If retrieval itself found nothing relevant, neither path guesses —
both return the safe "seek professional help" response (README §7).
"""

import json
import re
import textwrap
from typing import Optional

import requests

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5:1.5b-instruct"
OLLAMA_TIMEOUT_S = 25

SAFE_FALLBACK = {
    "title": "Seek professional medical help",
    "urgency": "unable_to_determine",
    "summary": (
        "There isn't enough verified guidance available locally to give "
        "specific first-aid steps for this. Please seek professional "
        "medical help rather than guessing."
    ),
    "steps": [],
    "red_flags": [],
    "sources": [],
    "grounded": False,
    "generated_by": "safety_fallback",
}


def _split_sentences(text: str) -> list[str]:
    # Good enough for our short, well-punctuated corpus sentences.
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def _order_for_steps(chunks: list[dict]) -> list[dict]:
    """
    Order retrieved chunks into a sensible instruction sequence:

    1. Actionable chunks before reference/background chunks (a burn's
       severity taxonomy isn't a "step").
    2. Group actionable chunks by source document, most-relevant
       document group first (by its best individual retrieval score) —
       but WITHIN a document, keep the author's original order (e.g.
       burns.md is written cool -> cover -> seek-help -> don't-do-this),
       since retrieval score alone doesn't know that "cool the burn"
       has to come before "don't use ice", it just knows both chunks
       are about burns.
    """
    action = [c for c in chunks if c.get("kind", "action") == "action"]
    reference = [c for c in chunks if c.get("kind") == "reference"]

    by_doc: dict[str, list[dict]] = {}
    for c in action:
        by_doc.setdefault(c["doc"], []).append(c)

    doc_order = sorted(
        by_doc.keys(),
        key=lambda d: max(c.get("score", 0.0) for c in by_doc[d]),
        reverse=True,
    )

    ordered_action = []
    for doc in doc_order:
        ordered_action.extend(sorted(by_doc[doc], key=lambda c: c.get("position", 0)))

    return ordered_action + reference


def _template_compose(query_title: str, triage: dict, chunks: list[dict],
                       kit_available: Optional[bool]) -> dict:
    if not chunks:
        return dict(SAFE_FALLBACK)

    chunks = _order_for_steps(chunks)
    steps = []
    step_no = 1
    seen_sources = []
    for chunk in chunks:
        for sentence in _split_sentences(chunk["text"]):
            steps.append({"step": step_no, "instruction": sentence, "source": chunk["source"]})
            step_no += 1
        if chunk["source"] not in seen_sources:
            seen_sources.append(chunk["source"])

    if kit_available is False:
        steps.append({
            "step": step_no,
            "instruction": (
                "No first-aid kit is required for the steps above — use the "
                "cleanest cloth, water, and pressure you have on hand. If "
                "specialized supplies (sterile dressing, gloves) happen to "
                "be available, use them, but do not wait for them."
            ),
            "source": "SANKET guidance policy (no-kit mode) — not a medical source",
        })

    return {
        "title": query_title,
        "urgency": triage.get("urgency", "unable_to_determine"),
        "summary": (
            "Grounded, source-backed steps retrieved from the local first-aid corpus. "
            "This is compiled directly from the sources below — no content was generated."
        ),
        "steps": steps,
        "red_flags": triage.get("red_flags", []),
        "sources": seen_sources,
        "grounded": True,
        "generated_by": "template",
    }


def _ollama_available() -> bool:
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        return resp.status_code == 200
    except requests.RequestException:
        return False


_PROMPT_TEMPLATE = """You are a first-aid instruction formatter for an emergency app. You must follow these rules exactly:

- Use ONLY the EVIDENCE below. Do not use any medical knowledge from your training.
- Do NOT invent steps, facts, or medication/dosage information not present in the evidence.
- Do NOT claim a definitive diagnosis.
- Write short, simple, one-action-per-step instructions. Prioritize the most urgent action first.
- Assume the user may NOT have a first-aid kit. If the evidence mentions optional equipment, phrase it as "If available...".
- If the evidence does not actually answer the situation, respond with exactly: INSUFFICIENT_EVIDENCE

Respond with ONLY valid JSON, no other text, matching this exact shape:
{{
  "title": "short title",
  "summary": "one or two sentence summary",
  "steps": [{{"step": 1, "instruction": "...", "source": "the matching evidence source"}}],
  "red_flags": ["..."]
}}

SITUATION: {situation}

EVIDENCE:
{evidence}
"""


def _ollama_compose(query_title: str, triage: dict, chunks: list[dict],
                     kit_available: Optional[bool]) -> Optional[dict]:
    chunks = _order_for_steps(chunks)
    evidence_blocks = []
    for i, c in enumerate(chunks):
        evidence_blocks.append(f"[{i+1}] ({c['source']})\n{c['text']}")
    evidence_text = "\n\n".join(evidence_blocks)

    situation = query_title
    if kit_available is False:
        situation += " (no first-aid kit available)"

    prompt = _PROMPT_TEMPLATE.format(situation=situation, evidence=evidence_text)

    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.1},
            },
            timeout=OLLAMA_TIMEOUT_S,
        )
        if resp.status_code != 200:
            return None
        raw = resp.json().get("response", "").strip()
    except (requests.RequestException, ValueError):
        return None

    if raw == "INSUFFICIENT_EVIDENCE" or "INSUFFICIENT_EVIDENCE" in raw[:40]:
        return dict(SAFE_FALLBACK)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None  # fall through to template

    if not isinstance(parsed, dict) or "steps" not in parsed:
        return None

    # Ground-check: every step's source must be one we actually retrieved.
    # This is what keeps the SLM from silently drifting off its evidence.
    known_sources = {c["source"] for c in chunks}
    valid_steps = []
    for step in parsed.get("steps", []):
        src = step.get("source", "")
        if src in known_sources:
            valid_steps.append(step)
    if not valid_steps:
        return None

    return {
        "title": parsed.get("title", query_title),
        "urgency": triage.get("urgency", "unable_to_determine"),
        "summary": parsed.get("summary", ""),
        "steps": valid_steps,
        "red_flags": list(set(parsed.get("red_flags", []) + triage.get("red_flags", []))),
        "sources": sorted(known_sources),
        "grounded": True,
        "generated_by": f"ollama:{OLLAMA_MODEL}",
    }


def compose_guidance(query_title: str, triage: dict, chunks: list[dict],
                      kit_available: Optional[bool] = None) -> dict:
    """
    Main entry point. Never raises — always returns a valid structured
    guidance dict, falling back to the safe message if there's nothing
    grounded to say.
    """
    if not chunks:
        return dict(SAFE_FALLBACK)

    if _ollama_available():
        result = _ollama_compose(query_title, triage, chunks, kit_available)
        if result is not None:
            return result
        # Ollama ran but produced nothing usable — fall through, don't fail the request.

    return _template_compose(query_title, triage, chunks, kit_available)
