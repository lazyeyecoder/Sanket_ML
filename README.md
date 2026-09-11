# SANKET App

AI-powered first-aid and emergency-response app. Two roles share one app:

- **Citizens** report an emergency, photograph a burn/wound for AI visual
  triage, and get grounded, source-cited first-aid guidance (with TTS).
- **Medical officers / responders** get verified, then see and accept
  nearby open incidents on a map.

This is the mobile/frontend + Convex backend half of the SANKET project.
The trained vision models, and the triage/RAG/SLM guidance pipeline they
feed into, live in the sibling **`Sanket_ML/`** package — see
[`../Sanket_ML/README.md`](../Sanket_ML/README.md) for that side.

---

## 1. Tech stack

| Layer | What |
|---|---|
| App | Expo Router (file-based routing) + React Native, TypeScript |
| Backend | [Convex](https://convex.dev) — auth, `incidents`, `responders`, `users` |
| Maps | OpenStreetMap via `components/OSMMap.tsx` (no API key needed) |
| Visual AI + guidance | A separate local Python service in `../Sanket_ML/service/` (YOLOv5 burn/wound detection → conservative triage → local RAG → local/optional SLM). The app calls it **directly over the LAN**, not through Convex — see §4. |
| TTS | `expo-speech` |

---

## 2. Project structure

```
src/app/
├── (auth)/          sign-in, sign-up, role-picker
├── (citizen)/
│   ├── index.tsx           home: report / injury guidance / CPR / nearby map
│   ├── cpr.tsx              CPR guide
│   ├── profile.tsx
│   └── report/
│       ├── index.tsx        pick emergency type
│       ├── capture.tsx      camera capture (burn / injury / bleeding only)
│       ├── result.tsx       visual result + triage + follow-up questions
│       ├── classify.tsx     mocked classification (choking / cardiac / general only)
│       ├── first-aid.tsx    step-by-step guidance (real for burn/wound, static for the rest)
│       └── map.tsx          nearby incident on OSM
└── (responder)/
    ├── index.tsx
    ├── verification.tsx     license photo upload (demo: auto-approves after a delay)
    └── profile.tsx

convex/          auth.ts, users.ts, incidents.ts, responders.ts, geo.ts, schema.ts
src/lib/         convex-client.ts, secure-store-adapter.ts, ml-client.ts (talks to Sanket_ML's service)
src/components/ui/   Button, Card, TextField, ScreenHeader — shared UI kit, reused everywhere
```

Only `burn`, `injury`, and `bleeding` currently route through the real
camera → YOLO → RAG → SLM pipeline (`report/capture.tsx` → `result.tsx`).
`choking` / `cardiac` / `general` still use the original mocked
`classify.tsx` keyword-matching flow — that was out of scope for the ML
integration and hasn't been touched.

---

## 3. Setup

```powershell
npm install
```

### Convex

```powershell
npx convex dev
```

First run prompts you to log in / pick a Convex project, then writes
`.env.local` with `CONVEX_DEPLOYMENT`, `EXPO_PUBLIC_CONVEX_URL`, and
`EXPO_PUBLIC_CONVEX_SITE_URL`. Leave this running in its own terminal
during development — it pushes `convex/*.ts` changes live.

### ML service (burn/wound detection + first-aid guidance)

This is a separate process, not something `npm install` sets up. In
`../Sanket_ML/`:

```powershell
cd ../Sanket_ML
pip install -r requirements.txt
python -m rag.build_index
python -m uvicorn service.app:app --host 0.0.0.0 --port 8000
```

Then add to `.env.local` (create it if `npx convex dev` hasn't run yet):

```
EXPO_PUBLIC_ML_SERVICE_URL=http://<this-machine's-LAN-IP>:8000
```

Find your LAN IP with `ipconfig` (the Wi-Fi/Ethernet adapter's IPv4
address — not a VirtualBox/VMware virtual adapter). Whatever device or
emulator runs the app must be able to reach that IP and port. Full
details, troubleshooting, and the RAG/SLM internals are in
[`Sanket_ML/README.md §15`](../Sanket_ML/README.md#15-ml-service-camera--yolo--triage--rag--slm).

If this variable isn't set, or the service isn't reachable, the
burn/wound capture flow shows a clear inline error and lets you retake
the photo — it doesn't crash the app, and it never falls back to
inventing first-aid advice.

### Run the app

```powershell
npx expo start
```

Then open on an Android emulator, iOS simulator, a physical device via
Expo Go, or press `w` for web. `npm run android` / `npm run ios` /
`npm run web` are shortcuts for the same.

---

## 4. App flow

```
Sign in / sign up → pick role (citizen / medical officer)
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                    ▼
     CITIZEN                             RESPONDER
        │                                    │
Report an Emergency                   License verification
        │                              (demo: auto-approves
   choose type                          after a short delay)
    /        \                                │
burn/injury   choking/cardiac/general    Home → nearby open
/bleeding          │                     incidents on map
    │         (mocked classify,
    │          unchanged)
    ▼
 Camera capture
    │
 POST /predict  ───────►  Sanket_ML service: YOLOv5 (burn or wound model,
    │                     loaded once, cached) → class + confidence + bbox
    ▼
 Visual result screen
   - image + bounding box
   - "Detected: X" / "Model confidence: Y%" (never shown as severity)
   - 1-2 follow-up questions at a time (bleeding? conscious? breathing?
     large area? critical location?) → live POST /triage after each answer
   - "Do you have a first-aid kit?"
    │
 "Get First-Aid Instructions"
    │
 POST /guidance ───────►  triage → RAG (local FAISS over cited WHO/Red
    │                     Cross/Mayo/NHS excerpts) → SLM (Ollama if
    │                     installed, else a zero-generation template
    │                     composer) → structured, source-cited steps
    ▼
 (best-effort, non-blocking: still files the incident via the existing
  createIncident Convex mutation, same as the rest of the report flow)
    │
 First-aid steps screen
   - one step at a time, with its source shown
   - ▶ Play button per step → real TTS (expo-speech)
   - red-flag banner if any were raised
   - "View on Map" / "Done"
```

The visual-triage + RAG/SLM guidance pipeline works even if Convex is
unreachable (it's a direct app → Python-service call) — only the
best-effort incident filing needs Convex. This matches the offline-first
intent behind the ML service being a separate local process rather than
a Convex cloud function (Convex can't run Python/torch/FAISS/an LLM).

---

## 5. Testing

```powershell
npx tsc --noEmit      # type-check
npx expo lint         # lint
npx expo start --web  # quick sanity check the app boots/bundles
```

For the camera → guidance flow specifically, you need the ML service
running (§3) and reachable from your device — see
[`Sanket_ML/README.md §17`](../Sanket_ML/README.md) for how to test the
Python side directly (curl / real burn & wound photos) before testing it
through the app.

---

## 6. Known demo stubs

These are intentional, labeled in the code, and out of scope for the ML
integration work:

- `report/classify.tsx` (choking / cardiac / general only) — mocked
  keyword classification, not a model.
- `(responder)/verification.tsx` — auto-approves the uploaded license
  photo after a few seconds instead of a real back-office review.
  `convex/users.ts`'s `approveVerification` mutation has no server-side
  check, so treat this build as a demo, not production-ready for
  responder verification.

---

## Learn more (Expo defaults)

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)
- [Convex documentation](https://docs.convex.dev/)
