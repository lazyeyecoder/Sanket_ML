from pathlib import Path
import argparse
import json
import torch


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

BURN_MODEL = BASE_DIR / "models" / "burn" / "best.pt"
WOUND_MODEL = BASE_DIR / "models" / "wound" / "best.pt"

# YOLOv5 repository is one level above SANKET_ML
YOLOV5_DIR = BASE_DIR.parent / "yolov5"


# ============================================================
# CLASS NAMES
# ============================================================

BURN_CLASSES = {
    0: "first_degree_burn",
    1: "second_degree_burn",
    2: "third_degree_burn",
}

WOUND_CLASSES = {
    0: "Abrasion_Wound",
    1: "Bruises_Wound",
    2: "Brun_Wound",
    3: "Cut_Wound",
    4: "Diabetic_Wound",
    5: "Laseration_Wound",
    6: "Normal",
    7: "Pressure_Wound",
    8: "Surgical_Wound",
    9: "Venous_Wound",
}


# ============================================================
# LOAD MODEL
# ============================================================

def load_model(model_path):

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found:\n{model_path}"
        )

    if not YOLOV5_DIR.exists():
        raise FileNotFoundError(
            f"YOLOv5 directory not found:\n{YOLOV5_DIR}"
        )

    model = torch.hub.load(
        str(YOLOV5_DIR),
        "custom",
        path=str(model_path),
        source="local"
    )

    # Detection thresholds
    model.conf = 0.25
    model.iou = 0.45
    model.max_det = 20

    return model


# ============================================================
# MODEL CACHE
# ============================================================
# Loading a YOLOv5 model via torch.hub is expensive (seconds).
# The CLI below only ever predicts once per process, so it never
# needed a cache. A long-lived service (see service/app.py) calls
# predict() many times, so we cache the loaded model per model_type
# and reuse it — this does not change model weights or behavior,
# only how often load_model() runs.

_model_cache = {}


def get_model(model_type):

    if model_type in _model_cache:
        return _model_cache[model_type]

    if model_type == "burn":
        model = load_model(BURN_MODEL)
    elif model_type == "wound":
        model = load_model(WOUND_MODEL)
    else:
        raise ValueError(
            "model_type must be 'burn' or 'wound'"
        )

    _model_cache[model_type] = model
    return model


# ============================================================
# RUN INFERENCE
# ============================================================

def predict(image_path, model_type):

    image_path = Path(image_path)

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found:\n{image_path}"
        )

    if model_type == "burn":
        class_names = BURN_CLASSES

    elif model_type == "wound":
        class_names = WOUND_CLASSES

    else:
        raise ValueError(
            "model_type must be 'burn' or 'wound'"
        )

    # Load model (cached after the first call — see get_model())
    model = get_model(model_type)

    # Run YOLO inference
    results = model(
        str(image_path),
        size=640
    )

    predictions = []

    # x1, y1, x2, y2, confidence, class
    detections = results.xyxy[0].cpu().numpy()

    for detection in detections:

        x1, y1, x2, y2, confidence, class_id = detection

        class_id = int(class_id)

        predictions.append({
            "class_id": class_id,
            "class_name": class_names[class_id],
            "confidence": round(float(confidence), 4),
            "bbox": {
                "x1": round(float(x1), 2),
                "y1": round(float(y1), 2),
                "x2": round(float(x2), 2),
                "y2": round(float(y2), 2)
            }
        })

    return {
        "model": model_type,
        "image": str(image_path),
        "detections": predictions
    }


# ============================================================
# COMMAND LINE
# ============================================================

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="SANKET YOLOv5 inference"
    )

    parser.add_argument(
        "--image",
        required=True,
        help="Path to input image"
    )

    parser.add_argument(
        "--model",
        required=True,
        choices=["burn", "wound"],
        help="Model to use"
    )

    args = parser.parse_args()

    result = predict(
        args.image,
        args.model
    )

    print("\nSANKET DETECTION")
    print("=" * 50)

    print(
        json.dumps(
            result,
            indent=4
        )
    )