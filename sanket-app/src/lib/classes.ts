/**
 * Class id -> name maps for the two YOLOv5 models. MUST stay identical to
 * Sanket_ML/inference.py (BURN_CLASSES / WOUND_CLASSES) — the ids are baked
 * into the trained weights and never change (spellings included).
 */
export const BURN_CLASSES: Record<number, string> = {
  0: "first_degree_burn",
  1: "second_degree_burn",
  2: "third_degree_burn",
};

export const WOUND_CLASSES: Record<number, string> = {
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
};
