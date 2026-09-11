/**
 * Client for the local SANKET ML service (Sanket_ML/service/app.py).
 *
 * This talks directly to the Python service over the LAN, not through
 * Convex — Convex has no Python/torch runtime and can't host YOLO/RAG/
 * an SLM, and routing this through a cloud function would make the core
 * medical guidance depend on connectivity, which is exactly what the
 * offline-first design is meant to avoid. Convex is still used as
 * normal for auth/incidents elsewhere in the app.
 *
 * Every function here returns a typed { ok, ... } result and never
 * throws — callers render an error state instead of crashing.
 */

const BASE_URL = process.env.EXPO_PUBLIC_ML_SERVICE_URL;

export type ModelType = "burn" | "wound";

export type Detection = {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
};

export type PredictResponse = {
  model: string;
  image: string;
  detections: Detection[];
};

export type Answers = Partial<{
  heavy_bleeding: boolean;
  conscious: boolean;
  breathing_normal: boolean;
  large_area: boolean;
  critical_location: boolean;
  cause: string;
}>;

export type FollowUpQuestion = {
  key: keyof Answers;
  text: string;
  type: "yes_no" | "text";
};

export type TriageResult = {
  urgency: "unable_to_determine" | "low" | "medium" | "high";
  basis: string[];
  red_flags: string[];
  disclaimer: string;
  pending_questions: FollowUpQuestion[];
};

export type GuidanceStep = { step: number; instruction: string; source: string };

export type Guidance = {
  title: string;
  urgency: string;
  summary: string;
  steps: GuidanceStep[];
  red_flags: string[];
  sources: string[];
  grounded: boolean;
  generated_by: string;
};

export type GuidanceResponse = {
  triage: TriageResult;
  guidance: Guidance;
  pending_questions: FollowUpQuestion[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function isMlServiceConfigured(): boolean {
  return Boolean(BASE_URL);
}

async function post<T>(path: string, body: unknown): Promise<Result<T>> {
  if (!BASE_URL) {
    return {
      ok: false,
      error:
        "ML service isn't configured (EXPO_PUBLIC_ML_SERVICE_URL is not set). " +
        "See Sanket_ML/README.md §15 for how to run it.",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      error: `Couldn't reach the ML service at ${BASE_URL}. Is it running and on the same network?`,
    };
  }

  let json: any;
  try {
    json = await response.json();
  } catch {
    return { ok: false, error: `ML service returned an invalid response (status ${response.status}).` };
  }

  if (!response.ok || json?.error) {
    return { ok: false, error: json?.error ?? `Request failed (status ${response.status}).` };
  }

  return { ok: true, data: json as T };
}

export function analyzeImage(imageBase64: string, modelType: ModelType) {
  return post<PredictResponse>("/predict", { model_type: modelType, image_base64: imageBase64 });
}

export function getTriage(
  modelType: ModelType,
  className: string | null,
  confidence: number | null,
  answers: Answers,
) {
  return post<TriageResult>("/triage", {
    model_type: modelType,
    class_name: className,
    confidence,
    answers,
  });
}

export function getGuidance(
  modelType: ModelType,
  className: string | null,
  confidence: number | null,
  answers: Answers,
  kitAvailable: boolean | null,
) {
  return post<GuidanceResponse>("/guidance", {
    model_type: modelType,
    class_name: className,
    confidence,
    answers,
    kit_available: kitAvailable,
  });
}
