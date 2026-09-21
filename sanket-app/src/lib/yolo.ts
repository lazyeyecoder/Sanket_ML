/**
 * Pure (no React Native imports) YOLOv5 pre/post-processing for the
 * on-device TFLite models, mirroring what Sanket_ML does on the server:
 *
 *   letterbox (pad to 640x640 with grey 114)  ->  model  ->  decode +
 *   class-aware NMS (conf 0.25, IoU 0.45, max 20)  ->  original-image boxes
 *
 * The math follows yolov5's `letterbox()` and `non_max_suppression()` with
 * multi_label=False. It is verified against Python ground truth (real
 * TFLite tensors + YOLOv5's own NMS) — see the test notes in the PR/README.
 */

export const INPUT_SIZE = 640;
export const CONF_THRES = 0.25;
export const IOU_THRES = 0.45;
export const MAX_DET = 20;

export type LetterboxInfo = {
  /** padding added on the left/top of the 640x640 canvas, in pixels */
  left: number;
  top: number;
  /** size of the (already-resized) image that was pasted in */
  width: number;
  height: number;
};

export type Box = {
  classId: number;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

/**
 * Paste an already-resized RGBA image (longest side == 640, as produced by
 * the native resize step) into a 640x640 grey canvas and return the
 * NHWC float32 [1,640,640,3] tensor in 0..1 that the model expects.
 */
export function letterboxToTensor(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
): { tensor: Float32Array; info: LetterboxInfo } {
  if (width > INPUT_SIZE || height > INPUT_SIZE) {
    throw new Error(`letterbox: image ${width}x${height} is larger than ${INPUT_SIZE}`);
  }
  const dw = (INPUT_SIZE - width) / 2;
  const dh = (INPUT_SIZE - height) / 2;
  // same rounding as yolov5's copyMakeBorder call
  const left = Math.round(dw - 0.1);
  const top = Math.round(dh - 0.1);

  const tensor = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3).fill(114 / 255);
  for (let y = 0; y < height; y++) {
    let src = y * width * 4;
    let dst = ((y + top) * INPUT_SIZE + left) * 3;
    for (let x = 0; x < width; x++) {
      tensor[dst] = rgba[src] / 255;
      tensor[dst + 1] = rgba[src + 1] / 255;
      tensor[dst + 2] = rgba[src + 2] / 255;
      src += 4;
      dst += 3;
    }
  }
  return { tensor, info: { left, top, width, height } };
}

function iou(a: Box, b: Box): number {
  const ix1 = Math.max(a.x1, b.x1);
  const iy1 = Math.max(a.y1, b.y1);
  const ix2 = Math.min(a.x2, b.x2);
  const iy2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter);
}

/**
 * Model output [1, N, 5+nc] (normalized cx,cy,w,h, objectness, class
 * scores) -> boxes in 640x640 letterbox pixels, after confidence
 * filtering and class-aware NMS, best first.
 */
export function decodeDetections(
  output: Float32Array,
  numClasses: number,
  confThres = CONF_THRES,
  iouThres = IOU_THRES,
  maxDet = MAX_DET,
): Box[] {
  const stride = 5 + numClasses;
  const rows = Math.floor(output.length / stride);
  const candidates: Box[] = [];

  for (let i = 0; i < rows; i++) {
    const o = i * stride;
    const obj = output[o + 4];
    if (obj <= confThres) continue; // yolov5's pre-filter on objectness

    let best = -1;
    let bestScore = 0;
    for (let c = 0; c < numClasses; c++) {
      const s = output[o + 5 + c] * obj;
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    if (best < 0 || bestScore <= confThres) continue;

    const cx = output[o] * INPUT_SIZE;
    const cy = output[o + 1] * INPUT_SIZE;
    const w = output[o + 2] * INPUT_SIZE;
    const h = output[o + 3] * INPUT_SIZE;
    candidates.push({
      classId: best,
      confidence: bestScore,
      x1: cx - w / 2,
      y1: cy - h / 2,
      x2: cx + w / 2,
      y2: cy + h / 2,
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  // class-aware NMS: boxes of different classes never suppress each other
  const kept: Box[] = [];
  for (const cand of candidates) {
    let suppressed = false;
    for (const k of kept) {
      if (k.classId === cand.classId && iou(k, cand) > iouThres) {
        suppressed = true;
        break;
      }
    }
    if (!suppressed) {
      kept.push(cand);
      if (kept.length >= maxDet) break;
    }
  }
  return kept;
}

/** Map a 640x640-letterbox box back onto the ORIGINAL photo's pixels. */
export function toOriginalCoords(
  box: Box,
  info: LetterboxInfo,
  originalWidth: number,
  originalHeight: number,
): Box {
  // separate x/y scales: the native resize may round each side differently
  const sx = info.width / originalWidth;
  const sy = info.height / originalHeight;
  const clampX = (v: number) => Math.min(originalWidth, Math.max(0, v));
  const clampY = (v: number) => Math.min(originalHeight, Math.max(0, v));
  return {
    classId: box.classId,
    confidence: box.confidence,
    x1: clampX((box.x1 - info.left) / sx),
    y1: clampY((box.y1 - info.top) / sy),
    x2: clampX((box.x2 - info.left) / sx),
    y2: clampY((box.y2 - info.top) / sy),
  };
}
