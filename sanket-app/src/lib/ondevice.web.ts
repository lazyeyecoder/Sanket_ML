/**
 * Web stub: the TFLite native module only exists in native builds, so on
 * web the app always uses the ML server for detection (see ondevice.ts).
 */
import type { Detection, ModelType } from "@/lib/ml-client";

export const ON_DEVICE_SUPPORTED = false;

export type OnDeviceResult = {
  detections: Detection[];
  width: number;
  height: number;
  totalMs: number;
  inferenceMs: number;
};

export async function detectOnDevice(_uri: string, _modelType: ModelType): Promise<OnDeviceResult> {
  throw new Error("On-device detection is not available on web");
}
