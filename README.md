# SANKET

AI-powered real-time first-aid guidance for medical emergencies — a
B.Tech final-year project (Thakur College of Engineering & Technology).
Full pitch/architecture deck: [`docs/SANKET-project-ppt.pdf`](docs/SANKET-project-ppt.pdf).

Camera → YOLOv5 burn/wound detection → conservative triage → local RAG
over cited first-aid sources → local SLM → grounded, source-attributed
step-by-step guidance, surfaced in the existing SANKET app.

## Layout

| Folder | What | Setup guide |
|---|---|---|
| [`Sanket_ML/`](Sanket_ML/) | Trained YOLOv5 burn/wound models, the inference CLI, and the FastAPI service that adds triage + local RAG + SLM on top | [`Sanket_ML/README.md`](Sanket_ML/README.md) |
| [`sanket-app/`](sanket-app/) | The Expo/React Native app (citizen + medical-officer roles) and its Convex backend | [`sanket-app/README.md`](sanket-app/README.md) |
| [`test_images/`](test_images/) | Real, sourced burn/wound photos for manually testing the ML service outside its training data | [`test_images/SOURCES.md`](test_images/SOURCES.md) |
| [`docs/`](docs/) | Project deck | — |

`yolov5/` (the upstream [Ultralytics](https://github.com/ultralytics/yolov5)
checkout `Sanket_ML/inference.py` depends on) is **not** part of this repo —
clone it yourself as a sibling of `Sanket_ML/`, per that README's setup steps.

## Quick start

Two independent processes, both documented in detail in their own README:

```powershell
# 1) ML service (Sanket_ML/README.md §3, §15)
cd Sanket_ML
pip install -r requirements.txt
python -m rag.build_index
python -m uvicorn service.app:app --host 0.0.0.0 --port 8000

# 2) App (sanket-app/README.md §3), in another terminal
cd sanket-app
npm install
npx convex dev          # first run: sets up your Convex project + .env.local
# then add EXPO_PUBLIC_ML_SERVICE_URL=http://<this-machine's-LAN-IP>:8000 to .env.local
npx expo start
```

Why two processes instead of one: the app's existing backend (Convex)
can't run Python/torch/FAISS/an LLM, and routing the vision + RAG + SLM
pipeline through a cloud function would make first-aid guidance depend
on connectivity — the opposite of this project's offline-first design.
The app talks to the ML service directly over the LAN; Convex still
handles auth, incident dispatch, and the responder map as before.

## Status

Working local prototype: real YOLOv5 detections, rule-based triage (no
invented severity scores), a real local RAG index over cited Red
Cross/Mayo Clinic/NHS excerpts, and a grounded SLM step (Ollama if
installed, otherwise a zero-generation template fallback — no
hallucinated advice either way). On-device model quantization/export,
the 2GB mobile RAM budget, AR overlay, and multilingual RAG from the
project deck's roadmap are future work, not yet implemented.
