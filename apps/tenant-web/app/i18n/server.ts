import { getTenantProfile } from "../lib/tenant-api";
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
    const profile = await getTenantProfile();
    return normalizeLocale(profile.languageCode);
  } catch {
    return normalizeLocale(undefined);
  }
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
