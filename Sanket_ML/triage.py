"""
Conservative, rule-based triage interpretation.

Turns a YOLO detection (a class + a confidence number) into an urgency
signal WITHOUT inventing a numeric severity score. Model confidence is
never treated as clinical severity — see README §4 of the integration
brief this file implements.

Burn degree comes directly from the model, so it drives a baseline
urgency. Wound *type* does not carry inherent urgency on its own — the
model was trained to classify what kind of wound it is, not how severe
it is — so wound urgency is only escalated when supported by an
explicit answer to a follow-up question (bleeding / consciousness /
breathing / size / location), never invented from the class name alone.
"""

from typing import Optional, TypedDict

from labels import triage_labels


class Answers(TypedDict, total=False):
    heavy_bleeding: Optional[bool]
    conscious: Optional[bool]
    breathing_normal: Optional[bool]
    large_area: Optional[bool]
    critical_location: Optional[bool]
    cause: Optional[str]


# Ordered so the UI can ask a couple at a time, most decision-relevant first.
FOLLOW_UP_QUESTIONS = [
    {
        "key": "heavy_bleeding",
        "text": "Is there heavy or uncontrolled bleeding?",
        "type": "yes_no",
    },
    {
        "key": "conscious",
        "text": "Is the person conscious and responsive?",
        "type": "yes_no",
    },
    {
        "key": "breathing_normal",
        "text": "Are they breathing normally?",
        "type": "yes_no",
    },
    {
        "key": "large_area",
        "text": "Is the affected area larger than the person's palm?",
        "type": "yes_no",
    },
    {
        "key": "critical_location",
        "text": "Is it on the face, neck, joints, hands, or genitals?",
        "type": "yes_no",
    },
    {
        "key": "cause",
        "text": "What caused it?",
        "type": "text",
    },
]

# Ask this many at a time so the person isn't hit with a long form
# while they're dealing with an emergency.
QUESTIONS_PER_ROUND = 2

BURN_CLASS_BASELINE = {
    "first_degree_burn": "low",
    "second_degree_burn": "medium",
    "third_degree_burn": "high",
}

_URGENCY_RANK = {"unable_to_determine": 0, "low": 1, "medium": 2, "high": 3}


def _escalate(current: str, candidate: str) -> str:
    if _URGENCY_RANK[candidate] > _URGENCY_RANK[current]:
        return candidate
    return current


def _red_flags_from_answers(answers: Answers, lang: str = "en") -> list[str]:
    L = triage_labels(lang)
    flags = []
    if answers.get("heavy_bleeding") is True:
        flags.append(L["red_flag_heavy_bleeding"])
    if answers.get("conscious") is False:
        flags.append(L["red_flag_unconscious"])
    if answers.get("breathing_normal") is False:
        flags.append(L["red_flag_breathing"])
    return flags


def next_questions(answers: Answers, lang: str = "en") -> list[dict]:
    """Which follow-up questions still need an answer, next round only."""
    texts = triage_labels(lang)["questions"]
    unanswered = [q for q in FOLLOW_UP_QUESTIONS if answers.get(q["key"]) is None]
    return [dict(q, text=texts.get(q["key"], q["text"])) for q in unanswered[:QUESTIONS_PER_ROUND]]


def assess(model_type: str, class_name: Optional[str], confidence: Optional[float],
           answers: Optional[Answers] = None, lang: str = "en") -> dict:
    """
    Returns:
        {
          "urgency": "unable_to_determine" | "low" | "medium" | "high",
          "basis": [str, ...]          -- which rules fired, for transparency
          "red_flags": [str, ...],
          "disclaimer": str,
          "pending_questions": [ {key, text, type}, ... ]  -- ask next, if any
        }
    """
    answers = answers or {}
    urgency = "unable_to_determine"
    basis = []

    if class_name is None:
        basis.append("No detection above the confidence threshold — no visual basis for triage.")
    elif model_type == "burn":
        baseline = BURN_CLASS_BASELINE.get(class_name)
        if baseline:
            urgency = baseline
            basis.append(f"Detected class '{class_name}' maps to baseline urgency '{baseline}'.")
        else:
            basis.append(f"Unrecognized burn class '{class_name}' — no baseline rule.")
    elif model_type == "wound":
        # Deliberately no class->urgency table: the wound model classifies
        # wound *type*, not clinical severity. Urgency here comes only from
        # explicit answers (below) or, later, retrieved medical guidance.
        basis.append(
            f"Detected wound type '{class_name}'. Wound type alone does not "
            "determine urgency — waiting on follow-up answers."
        )

    red_flags = _red_flags_from_answers(answers, lang)
    if red_flags:
        urgency = _escalate(urgency, "high")
        basis.append("Escalated to 'high' due to reported red flag(s).")

    if answers.get("large_area") is True or answers.get("critical_location") is True:
        # One step up, never invented past what the burn baseline already implies.
        step_up = {"unable_to_determine": "medium", "low": "medium", "medium": "high", "high": "high"}
        urgency = _escalate(urgency, step_up[urgency])
        basis.append("Escalated one level: large area or a critical body location was reported.")

    pending = next_questions(answers, lang)

    return {
        "urgency": urgency,
        "basis": basis,
        "red_flags": red_flags,
        "disclaimer": triage_labels(lang)["disclaimer"],
        "pending_questions": pending,
    }
