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
import slm  # noqa: E402
from rag.retriever import retrieve as rag_retrieve, RetrievalUnavailable  # noqa: E402

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
    parts = []
    if class_name:
        parts.append(f"first aid steps for {class_name.replace('_', ' ').lower()}")
    else:
        parts.append(f"first aid for a {model_type} injury, no clear detection")
    cause = answers.get("cause")
    if cause:
        parts.append(f"caused by {cause}")
    if answers.get("heavy_bleeding"):
        parts.append("heavy bleeding")
    if answers.get("conscious") is False or answers.get("breathing_normal") is False:
        parts.append("unconscious or not breathing normally, shock")
    return " ".join(parts)


class TriageRequest(BaseModel):
    model_type: str
    class_name: str | None = None
    confidence: float | None = None
    answers: dict = Field(default_factory=dict)


@app.post("/triage")
def triage_endpoint(req: TriageRequest):
    if req.model_type not in ("burn", "wound"):
        return {"error": "model_type must be 'burn' or 'wound'"}
    try:
        return triage.assess(req.model_type, req.class_name, req.confidence, req.answers)
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        return {"error": f"Triage failed: {exc}"}


class GuidanceRequest(BaseModel):
    model_type: str
    class_name: str | None = None
    confidence: float | None = None
    answers: dict = Field(default_factory=dict)
    kit_available: bool | None = None


@app.post("/guidance")
def guidance_endpoint(req: GuidanceRequest):
    """
    visual result + answers + kit availability -> triage -> RAG -> SLM
    -> structured guidance (README §5/§8). Each stage is isolated so a
    failure in one degrades gracefully instead of crashing the request
    (README §11): RAG failure or an empty index -> safe fallback
    message, never fabricated advice; SLM failure -> the grounded
    template steps are shown instead (handled inside slm.py already).
    """
    if req.model_type not in ("burn", "wound"):
        return {"error": "model_type must be 'burn' or 'wound'"}

    try:
        triage_result = triage.assess(req.model_type, req.class_name, req.confidence, req.answers)
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        return {"error": f"Triage failed: {exc}"}

    query = _build_rag_query(req.model_type, req.class_name, req.answers)

    try:
        chunks = rag_retrieve(query, k=5)
    except RetrievalUnavailable as exc:
        # No local index / docs — do NOT let the SLM guess (§7/§11).
        guidance = dict(slm.SAFE_FALLBACK)
        guidance["summary"] = f"Local medical reference index is unavailable ({exc}). Seek professional medical help."
        guidance["urgency"] = triage_result["urgency"]
        guidance["red_flags"] = triage_result["red_flags"]
        return {"triage": triage_result, "guidance": guidance, "pending_questions": triage_result["pending_questions"]}
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        guidance = dict(slm.SAFE_FALLBACK)
        guidance["summary"] = "Retrieval failed unexpectedly. Seek professional medical help."
        guidance["urgency"] = triage_result["urgency"]
        return {"triage": triage_result, "guidance": guidance, "pending_questions": triage_result["pending_questions"]}

    title = (req.class_name or f"{req.model_type} injury").replace("_", " ").title()
    try:
        guidance = slm.compose_guidance(title, triage_result, chunks, req.kit_available)
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        guidance = dict(slm.SAFE_FALLBACK)
        guidance["summary"] = "Guidance generation failed unexpectedly. Seek professional medical help."
        guidance["urgency"] = triage_result["urgency"]

    return {
        "triage": triage_result,
        "guidance": guidance,
        "pending_questions": triage_result["pending_questions"],
    }
