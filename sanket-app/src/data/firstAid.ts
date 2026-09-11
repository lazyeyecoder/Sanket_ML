export type EmergencyType =
  | "injury"
  | "burn"
  | "choking"
  | "bleeding"
  | "cardiac"
  | "general";

export const emergencyTypes: { id: EmergencyType; label: string; emoji: string }[] = [
  { id: "injury", label: "Injury / Fall", emoji: "🤕" },
  { id: "bleeding", label: "Bleeding", emoji: "🩸" },
  { id: "burn", label: "Burn", emoji: "🔥" },
  { id: "choking", label: "Choking", emoji: "😮" },
  { id: "cardiac", label: "Cardiac / Chest Pain", emoji: "❤️" },
  { id: "general", label: "Other", emoji: "🚨" },
];

export const firstAidSteps: Record<EmergencyType, string[]> = {
  injury: [
    "Keep the person still and calm.",
    "Do not move them unless there is immediate danger.",
    "Check for visible deformities or swelling.",
    "Immobilize the injured area if possible.",
    "Apply a cold pack to reduce swelling.",
    "Wait for responders — avoid giving food or water.",
  ],
  bleeding: [
    "Apply firm, direct pressure to the wound with a clean cloth.",
    "Keep the injured area raised above heart level if possible.",
    "Do not remove the cloth if it soaks through — add more on top.",
    "Maintain pressure until help arrives.",
    "Watch for signs of shock: pale skin, rapid breathing.",
  ],
  burn: [
    "Cool the burn under running water for 10–20 minutes.",
    "Remove nearby jewelry or tight clothing before swelling starts.",
    "Do not apply ice, butter, or ointments.",
    "Cover loosely with a clean, non-stick cloth.",
    "Seek medical help for burns larger than a palm or on the face/hands.",
  ],
  choking: [
    "Ask 'Are you choking?' — if they can't speak, act immediately.",
    "Give 5 sharp back blows between the shoulder blades.",
    "If unresolved, give 5 abdominal thrusts (Heimlich maneuver).",
    "Alternate back blows and abdominal thrusts.",
    "If they become unresponsive, begin CPR and call for help.",
  ],
  cardiac: [
    "Call for emergency help immediately.",
    "Have the person sit down and stay calm.",
    "Loosen tight clothing around the neck and chest.",
    "If they become unresponsive and stop breathing normally, start CPR.",
    "Use an AED if available.",
  ],
  general: [
    "Ensure the scene is safe before approaching.",
    "Check for responsiveness and breathing.",
    "Call for emergency help.",
    "Keep the person calm and comfortable.",
    "Monitor their condition until responders arrive.",
  ],
};

export function classifyEmergency(type: string, description: string): {
  emergencyType: EmergencyType;
  severity: "low" | "medium" | "high";
} {
  const known = emergencyTypes.find((t) => t.id === type);
  const emergencyType = (known?.id ?? "general") as EmergencyType;

  const text = description.toLowerCase();
  let severity: "low" | "medium" | "high" = "medium";
  if (/unconscious|not breathing|severe|heavy bleeding|chest pain/.test(text)) {
    severity = "high";
  } else if (/minor|small|slight/.test(text)) {
    severity = "low";
  }
  if (emergencyType === "cardiac" || emergencyType === "choking") {
    severity = severity === "low" ? "medium" : severity;
  }

  return { emergencyType, severity };
}
