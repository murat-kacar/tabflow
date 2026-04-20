import { getPlatformSession } from "../lib/platform-session";
import { en } from "./dictionaries/en";
import { tr } from "./dictionaries/tr";
import { type Locale, normalizeLocale } from "./locales";

const dictionaries = {
  en,
  tr
};

export type Dictionary = typeof en;

export async function getLocale(): Promise<Locale> {
  try {
    const session = await getPlatformSession();
    return normalizeLocale(session?.languageCode);
  } catch {
    return normalizeLocale(undefined);
  }
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
