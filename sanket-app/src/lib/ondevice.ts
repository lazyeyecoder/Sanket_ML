/**
 * On-device burn/wound detection (Android/iOS): TFLite models bundled in
 * the app run through react-native-fast-tflite — no network involved.
 *
 * Pipeline: native resize (EXIF-corrected, longest side 640) -> JPEG decode
 * -> letterbox to a 640x640 float tensor -> TFLite -> decode + NMS -> boxes
 * mapped back onto the original photo. The result has the same shape the
 * server's /predict returns, so triage/guidance downstream are unchanged.
 *
 * Web uses ondevice.web.ts (a stub): the native module doesn't exist there.
 */
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { loadTensorflowModel } from "react-native-fast-tflite";
import jpeg from "jpeg-js";

import { BURN_CLASSES, WOUND_CLASSES } from "@/lib/classes";
import type { Detection, ModelType } from "@/lib/ml-client";
import {
  decodeDetections,
  INPUT_SIZE,
  letterboxToTensor,
  toOriginalCoords,
} from "@/lib/yolo";

export const ON_DEVICE_SUPPORTED = true;

type Model = Awaited<ReturnType<typeof loadTensorflowModel>>;

// Metro bundles model files via require(); there is no import syntax for assets.
const MODEL_SOURCES: Record<ModelType, number> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  burn: require("../../assets/models/burn.tflite"),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  wound: require("../../assets/models/wound.tflite"),
};
const CLASSES: Record<ModelType, Record<number, string>> = {
  burn: BURN_CLASSES,
  wound: WOUND_CLASSES,
};

// Load each model once and reuse it (loading is the slow part).
const loaded: Partial<Record<ModelType, Promise<Model>>> = {};
function getModel(modelType: ModelType): Promise<Model> {
  if (!loaded[modelType]) {
    const p = loadTensorflowModel(MODEL_SOURCES[modelType], []);
    // don't cache a failure — let the next attempt retry
    p.catch(() => {
      delete loaded[modelType];
    });
    loaded[modelType] = p;
  }
  return loaded[modelType]!;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export type OnDeviceResult = {
  detections: Detection[];
  /** Size of the photo the boxes refer to (after EXIF rotation). */
  width: number;
  height: number;
  /** Wall-clock milliseconds for the whole on-device pipeline. */
  totalMs: number;
  inferenceMs: number;
};

export async function detectOnDevice(uri: string, modelType: ModelType): Promise<OnDeviceResult> {
  const t0 = Date.now();

  // 1) actual (EXIF-corrected) size, then resize so the longest side is 640
  const base = await ImageManipulator.manipulate(uri).renderAsync();
  const width = base.width;
  const height = base.height;
  const r = Math.min(INPUT_SIZE / width, INPUT_SIZE / height);
  const resized = await ImageManipulator.manipulate(base)
    .resize({ width: Math.round(width * r), height: Math.round(height * r) })
    .renderAsync();
  const saved = await resized.saveAsync({ format: SaveFormat.JPEG, compress: 1, base64: true });
  if (!saved.base64) throw new Error("on-device: resize produced no data");

  // 2) pixels -> letterboxed float tensor
  const decoded = jpeg.decode(base64ToBytes(saved.base64), { useTArray: true, formatAsRGBA: true });
  const { tensor, info } = letterboxToTensor(decoded.data, decoded.width, decoded.height);

  // 3) model
  const model = await getModel(modelType);
  const t1 = Date.now();
  const outputs = await model.run([tensor.buffer as ArrayBuffer]);
  const inferenceMs = Date.now() - t1;

  // 4) decode + NMS + back to original coordinates
  const numClasses = Object.keys(CLASSES[modelType]).length;
  const boxes = decodeDetections(new Float32Array(outputs[0]), numClasses).map((b) =>
    toOriginalCoords(b, info, width, height),
  );

  const round2 = (v: number) => Math.round(v * 100) / 100;
  const detections: Detection[] = boxes.map((b) => ({
    class_id: b.classId,
    class_name: CLASSES[modelType][b.classId] ?? `class${b.classId}`,
    confidence: Math.round(b.confidence * 10000) / 10000,
    bbox: { x1: round2(b.x1), y1: round2(b.y1), x2: round2(b.x2), y2: round2(b.y2) },
  }));

  return { detections, width, height, totalMs: Date.now() - t0, inferenceMs };
}
