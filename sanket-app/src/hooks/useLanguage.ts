import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { Language } from "@/i18n";

/** The signed-in user's chosen language (Profile screen), "en" until it loads. */
export function useLanguage(): Language {
  const currentUser = useQuery(api.users.currentUser);
  return (currentUser?.language ?? "en") as Language;
}
