"""
SANKET ML service.

A thin FastAPI wrapper around inference.py's predict() function, so the
burn/wound YOLOv5 models are loaded once (at process startup) and reused
across requests instead of being reloaded from disk on every call.

This process is meant to run on the same machine/LAN as the SANKET app
during development, so the mobile app can call it directly without
routing model inference through Convex (which cannot run Python/torch).

Run with:
    uvicorn service.app:app --host 0.0.0.0 --port 8000
(from inside the Sanket_ML directory, so the `inference` module resolves)
"""

import base64
import binascii
import sys
import tempfile
import traceback
from pathlib import Path
from typing import Optional

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import inference  # noqa: E402  (Sanket_ML/inference.py, unmodified predict() logic)
import triage  # noqa: E402
import composer  # noqa: E402
from labels import CLASS_QUERY  # noqa: E402
from rag.retriever import retrieve as rag_retrieve, doc_chunks, RetrievalUnavailable  # noqa: E402

app = FastAPI(title="SANKET ML Service")

# Local dev server reachable from a phone/emulator on the same LAN —
# CORS is wide open here deliberately; this is not meant to be exposed
# publicly. Tighten if this service is ever deployed beyond a LAN.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _load_models_on_startup():
    """Load both models once so the first real request isn't slow."""
    for model_type in ("burn", "wound"):
        try:
            inference.get_model(model_type)
        except Exception:
            # Don't crash the service if a model/yolov5 checkout is
            # missing — /health will report it, and /predict will
            # return a clear error for that model_type.
            traceback.print_exc()


class PredictRequest(BaseModel):
    model_type: str = Field(..., description="'burn' or 'wound'")
    image_base64: str = Field(..., description="Base64-encoded JPEG/PNG image data")


class PredictError(BaseModel):
    error: str


@app.get("/health")
def health():
    loaded = list(inference._model_cache.keys())
    return {
        "status": "ok",
        "cuda_available": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "models_loaded": loaded,
    }


@app.post("/predict")
def predict(req: PredictRequest):
    if req.model_type not in ("burn", "wound"):
        return {"error": "model_type must be 'burn' or 'wound'"}

    try:
        image_bytes = base64.b64decode(req.image_base64, validate=True)
    except (binascii.Error, ValueError):
        return {"error": "image_base64 is not valid base64 data"}

    if not image_bytes:
        return {"error": "image_base64 decoded to an empty file"}

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = Path(tmp.name)

        result = inference.predict(tmp_path, req.model_type)
        return result

    except FileNotFoundError as exc:
        return {"error": str(exc)}
    except Exception as exc:  # noqa: BLE001 — surface as a typed error, not a 500 crash
        traceback.print_exc()
        return {"error": f"Inference failed: {exc}"}
    finally:
        if tmp_path is not None:
            tmp_path.unlink(missing_ok=True)


def _build_rag_query(model_type: str, class_name: Optional[str], answers: dict) -> str:
    """English retrieval query (the index is English-only)."""
    parts = [CLASS_QUERY.get(class_name or "", f"first aid for a {model_type} injury")]
    if answers.get("heavy_bleeding"):
        parts.append("heavy bleeding press firmly")
    elif answers.get("heavy_bleeding") is False and class_name in ("Cut_Wound", "Laseration_Wound"):
        parts.append("minor wound rinse and clean")
    if answers.get("conscious") is False or answers.get("breathing_normal") is False:
        parts.append("unconscious not breathing call emergency services")
    return " ".join(parts)


SUPPORTED_LANGUAGES = ("en", "hi", "mr")


class TriageRequest(BaseModel):
    model_type: str
    class_name: str | None = None
    confidence: float | None = None
    answers: dict = Field(default_factory=dict)
    language: str = "en"


@app.post("/triage")
def triage_endpoint(req: TriageRequest):
    if req.model_type not in ("burn", "wound"):
        return {"error": "model_type must be 'burn' or 'wound'"}
    try:
        lang = req.language if req.language in SUPPORTED_LANGUAGES else "en"
        return triage.assess(req.model_type, req.class_name, req.confidence, req.answers, lang)
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        return {"error": f"Triage failed: {exc}"}


class GuidanceRequest(BaseModel):
    model_type: str
    class_name: str | None = None
    confidence: float | None = None
    answers: dict = Field(default_factory=dict)
    kit_available: bool | None = None
    language: str = "en"


@app.post("/guidance")
def guidance_endpoint(req: GuidanceRequest):
    """
    visual result + answers + kit availability -> triage -> retrieval ->
    template composer -> structured guidance. No language model is in
    the loop: every step is a bullet from a retrieved, cited document
    chunk (see composer.py). Each stage degrades to the safe
    "seek professional medical help" response instead of guessing.
    """
    if req.model_type not in ("burn", "wound"):
        return {"error": "model_type must be 'burn' or 'wound'"}
    lang = req.language if req.language in SUPPORTED_LANGUAGES else "en"

    try:
        triage_result = triage.assess(req.model_type, req.class_name, req.confidence, req.answers, lang)
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        return {"error": f"Triage failed: {exc}"}

    def respond(guidance: dict):
        return {
            "triage": triage_result,
            "guidance": guidance,
            "pending_questions": triage_result["pending_questions"],
        }

    def fallback(reason: str):
        return respond(composer.safe_fallback(
            lang, reason, urgency=triage_result["urgency"], red_flags=triage_result["red_flags"]))

    try:
        if req.class_name is None:
            # nothing detected: general, sourced safety guidance
            chunks = [dict(c, score=1.0) for c in doc_chunks("general_emergency", lang)]
        else:
            chunks = rag_retrieve(_build_rag_query(req.model_type, req.class_name, req.answers), k=8, lang=lang)
    except RetrievalUnavailable:
        return fallback("no_index")
    except Exception:  # noqa: BLE001
        traceback.print_exc()
        return fallback("error")

    try:
        guidance = composer.compose_guidance(
            req.class_name, triage_result, chunks,
            lambda doc: doc_chunks(doc, lang), req.kit_available, lang)
    except Exception:  # noqa: BLE001
        traceback.print_exc()
        return fallback("error")

    return respond(guidance)
