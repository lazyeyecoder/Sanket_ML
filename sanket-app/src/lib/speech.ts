import * as Speech from "expo-speech";

import { Language, speechLocales } from "@/i18n";

export type SpeechChoice = {
  /** BCP-47 locale to pass to Speech.speak (or undefined = engine default). */
  locale: string | undefined;
  /** True when we couldn't get the user's language and settled for another. */
  fellBack: boolean;
  /** What the device actually offers, for debugging (empty = unknown). */
  voiceCount: number;
};

const norm = (l: string) => l.replace("_", "-").toLowerCase();

/**
 * Pick a TTS locale for `language`, checking which voices the device
 * really has. Chain: exact locale (hi-IN) -> same base language (hi-*) ->
 * for Marathi, Hindi (same script, mutually intelligible for reading
 * simple instructions) -> Indian English -> any English -> engine default.
 *
 * Never throws: if the voice list can't be read (some engines return an
 * empty list until first use, notably desktop Chrome) we just try the
 * wanted locale and let the engine do its best.
 */
export async function pickSpeechLocale(language: Language): Promise<SpeechChoice> {
  const wanted = speechLocales[language];

  let voices: Speech.Voice[] = [];
  try {
    voices = await Speech.getAvailableVoicesAsync();
  } catch {
    voices = [];
  }
  if (voices.length === 0) {
    return { locale: wanted, fellBack: false, voiceCount: 0 };
  }

  const langs = voices.map((v) => norm(v.language));
  const find = (pred: (l: string) => boolean) => {
    const i = langs.findIndex(pred);
    return i >= 0 ? voices[i].language : undefined;
  };

  const base = norm(wanted).split("-")[0];
  const exact = find((l) => l === norm(wanted));
  if (exact) return { locale: exact, fellBack: false, voiceCount: voices.length };
  const sameBase = find((l) => l.startsWith(base));
  if (sameBase) return { locale: sameBase, fellBack: false, voiceCount: voices.length };

  const fallbacks: string[] = language === "mr" ? ["hi", "en"] : ["en"];
  for (const fb of fallbacks) {
    const hit = find((l) => l === `${fb}-in`) ?? find((l) => l.startsWith(fb));
    if (hit) return { locale: hit, fellBack: true, voiceCount: voices.length };
  }
  return { locale: undefined, fellBack: true, voiceCount: voices.length };
}
