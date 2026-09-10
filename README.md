````markdown
# SANKET ML

Trained YOLOv5 models for the SANKET emergency-assistance system.

This package contains two visual detection models:

- Burn classification
- Wound classification

The models provide AI-assisted visual signals for the SANKET backend. Their predictions are not definitive medical diagnoses. Final emergency guidance should be handled by the SANKET reasoning/guidance system using appropriate medical sources and safety rules.

---

## 1. Package Structure

The `SANKET_ML` folder should look like this:

```text
SANKET_ML/
│
├── inference.py
├── requirements.txt
├── README.md
│
└── models/
    ├── burn/
    │   └── best.pt
    │
    └── wound/
        └── best.pt
````

The YOLOv5 repository must exist beside the `SANKET_ML` folder:

```text
Project/
│
├── yolov5/
│   ├── train.py
│   ├── val.py
│   └── ...
│
└── SANKET_ML/
    ├── inference.py
    ├── requirements.txt
    ├── README.md
    └── models/
        ├── burn/
        │   └── best.pt
        └── wound/
            └── best.pt
```

---

# 2. Requirements

## Python

Development and testing were performed with:

```text
Python 3.13.15
```

## Hardware

An NVIDIA GPU is recommended for faster inference.

The development machine used:

```text
GPU: NVIDIA GeForce RTX 4050 Laptop GPU
CUDA: 13.0
PyTorch: 2.14.0+cu130
```

CPU inference may also work, but it will be slower.

---

# 3. Setup

Follow these steps in order.

## Step 1: Check Git

Make sure Git is installed:

```powershell
git --version
```

If Git is available, continue.

---

## Step 2: Clone YOLOv5

Go to the folder where you want to keep the project:

```powershell
cd "C:\path\where\you\want\the\project"
```

Clone YOLOv5:

```powershell
git clone https://github.com/ultralytics/yolov5.git
```

This creates:

```text
project/
└── yolov5/
```

---

## Step 3: Install YOLOv5 Dependencies

Enter the YOLOv5 folder:

```powershell
cd yolov5
```

Install its dependencies:

```powershell
pip install -r requirements.txt
```

---

## Step 4: Add the SANKET_ML Folder

Place the `SANKET_ML` folder beside `yolov5`.

The final structure should be:

```text
project/
│
├── yolov5/
│
└── SANKET_ML/
```

---

## Step 5: Install PyTorch with NVIDIA GPU Support

If an NVIDIA GPU is available, install a CUDA-enabled PyTorch build appropriate for the system.

After installation, verify it:

```powershell
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

A working NVIDIA setup should report something similar to:

```text
CUDA available: True
GPU: NVIDIA ...
```

If CUDA is not available, the model can still potentially run on CPU, but inference will be slower.

---

## Step 6: Install SANKET ML Dependencies

Go into the `SANKET_ML` folder:

```powershell
cd ..\SANKET_ML
```

Install the requirements:

```powershell
pip install -r requirements.txt
```

---

# 4. Models

## Burn Model

Location:

```text
models/burn/best.pt
```

Model:

```text
YOLOv5s
```

Training configuration:

```text
Image size: 640x640
Epochs: 50
```

### Burn Classes

```text
0 = first_degree_burn
1 = second_degree_burn
2 = third_degree_burn
```

The model returns:

* Detected burn class
* Confidence score
* Bounding box

---

## Wound Model

Location:

```text
models/wound/best.pt
```

Model:

```text
YOLOv5s
```

Training configuration:

```text
Image size: 640x640
Epochs: 50
```

### Wound Classes

```text
0 = Abrasion_Wound
1 = Bruises_Wound
2 = Brun_Wound
3 = Cut_Wound
4 = Diabetic_Wound
5 = Laseration_Wound
6 = Normal
7 = Pressure_Wound
8 = Surgical_Wound
9 = Venous_Wound
```

The class names above preserve the original dataset labels, including the spellings:

```text
Brun_Wound
Laseration_Wound
```

Do not change the class IDs when integrating with the backend.

---

# 5. Run Inference

All inference is performed through:

```text
inference.py
```

The script supports two models:

```text
burn
wound
```

---

## Burn Detection

From inside the `SANKET_ML` folder:

```powershell
python inference.py --image "PATH_TO_IMAGE" --model burn
```

Example:

```powershell
python inference.py --image "C:\path\to\burn_image.jpg" --model burn
```

---

## Wound Detection

```powershell
python inference.py --image "PATH_TO_IMAGE" --model wound
```

Example:

```powershell
python inference.py --image "C:\path\to\wound_image.jpg" --model wound
```

---

# 6. Detection Settings

The current inference configuration is:

```text
Image size: 640
Confidence threshold: 0.25
IoU threshold: 0.45
Maximum detections: 20
```

These values are defined inside `inference.py`.

---

# 7. Output Format

The script returns JSON containing:

```text
model
image
detections
```

Each detection contains:

```text
class_id
class_name
confidence
bbox
```

where `bbox` contains:

```text
x1
y1
x2
y2
```

---

## Example: Burn Output

```json
{
    "model": "burn",
    "image": "burn_image.jpg",
    "detections": [
        {
            "class_id": 0,
            "class_name": "first_degree_burn",
            "confidence": 0.6014,
            "bbox": {
                "x1": 0.11,
                "y1": 4.46,
                "x2": 640.0,
                "y2": 639.55
            }
        }
    ]
}
```

---

## Example: Wound Output

```json
{
    "model": "wound",
    "image": "wound_image.jpg",
    "detections": [
        {
            "class_id": 4,
            "class_name": "Diabetic_Wound",
            "confidence": 0.8339,
            "bbox": {
                "x1": 140.84,
                "y1": 191.71,
                "x2": 338.82,
                "y2": 313.01
            }
        }
    ]
}
```

---

# 8. Backend Integration

The main function in `inference.py` is:

```python
predict(image_path, model_type)
```

The backend can import and call this function directly.

## Burn Example

```python
from inference import predict

result = predict(
    "path/to/image.jpg",
    "burn"
)

print(result)
```

## Wound Example

```python
from inference import predict

result = predict(
    "path/to/image.jpg",
    "wound"
)

print(result)
```

The returned object can then be converted to JSON and passed to the rest of the SANKET backend.

---

# 9. Recommended SANKET Flow

```text
User uploads image
        |
        v
      Backend
        |
        v
 Select model type
      /     \
   burn     wound
    |         |
    v         v
Burn YOLOv5  Wound YOLOv5
    |         |
    +----+----+
         |
         v
      Detection
         |
         v
Class + Confidence + Bounding Box
         |
         v
SANKET Reasoning / Guidance System
         |
         v
      Dashboard
```

The ML package is responsible for the visual detection stage.

The downstream SANKET system is responsible for using those results appropriately.

---

# 10. Testing

Both models were tested locally using held-out test images.

The inference script was successfully verified for:

### Burn

Example detected class:

```text
first_degree_burn
confidence: 0.6014
```

### Wound

Example detected class:

```text
Diabetic_Wound
confidence: 0.8339
```

These examples demonstrate that both trained `.pt` models load correctly and produce predictions through `inference.py`.

---

# 11. Development Environment

The models were developed and tested using:

```text
Python: 3.13.15
PyTorch: 2.14.0+cu130
CUDA: 13.0
GPU: NVIDIA GeForce RTX 4050 Laptop GPU
YOLOv5
Image size: 640x640
Training epochs: 50
```

---

# 12. Important Integration Notes

### 1. Keep `yolov5` beside `SANKET_ML`

The current `inference.py` expects the YOLOv5 repository to be one directory above `SANKET_ML`.

Correct:

```text
Project/
├── yolov5/
└── SANKET_ML/
```

Incorrect:

```text
Project/
└── SANKET_ML/
    └── yolov5/
```

---

### 2. Do not rename the model files

Keep:

```text
models/burn/best.pt
models/wound/best.pt
```

---

### 3. Do not change class IDs

The backend should use the class mapping exactly as defined in this README.

---

### 4. Model predictions are visual AI signals

The model output should not be presented as a definitive medical diagnosis.

The output should be passed into the broader SANKET emergency-assistance pipeline, where appropriate medical guidance and safety rules are applied.

---

# 13. Quick Start

For someone who already has Git and Python installed:

```powershell
git clone https://github.com/ultralytics/yolov5.git
cd yolov5
pip install -r requirements.txt
```

Place `SANKET_ML` beside `yolov5`, then:

```powershell
cd ..\SANKET_ML
pip install -r requirements.txt
```

Check CUDA:

```powershell
python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

Run burn detection:

```powershell
python inference.py --image "PATH_TO_IMAGE" --model burn
```

Run wound detection:

```powershell
python inference.py --image "PATH_TO_IMAGE" --model wound
```

---

# 14. Final Package

The complete ML handoff consists of:

```text
SANKET_ML/
│
├── inference.py
├── requirements.txt
├── README.md
│
└── models/
    ├── burn/
    │   └── best.pt
    │
    └── wound/
        └── best.pt
```

The YOLOv5 repository is a separate dependency:

```text
yolov5/
```

This package contains the trained burn and wound models and the inference interface required for backend integration.

```

One thing I deliberately removed from the old version is the repeated setup/inference material. Your previous README had the same instructions appearing in multiple sections, plus a teammate message embedded inside the documentation, which is how documentation slowly turns into a junk drawer. The version above has one clean path: **structure → requirements → clone YOLOv5 → install → models → run → output → backend integration → testing**. :contentReference[oaicite:1]{index=1}
```
