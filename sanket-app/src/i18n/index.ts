export type Language = "en" | "hi" | "mr";

export const languages: { id: Language; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "mr", label: "Marathi", native: "मराठी" },
];

const strings = {
  en: {
    profile: "Profile",
    language: "Language",
    signOut: "Sign Out",
    role: "Role",
  },
  hi: {
    profile: "प्रोफ़ाइल",
    language: "भाषा",
    signOut: "साइन आउट",
    role: "भूमिका",
  },
  mr: {
    profile: "प्रोफाइल",
    language: "भाषा",
    signOut: "साइन आउट",
    role: "भूमिका",
  },
} as const;

export function t(language: Language, key: keyof (typeof strings)["en"]) {
  return strings[language]?.[key] ?? strings.en[key];
}
