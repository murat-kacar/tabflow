import { updatePlatformLanguageAction } from "../actions";
import type { Locale } from "../i18n/locales";
import type { Dictionary } from "../i18n/server";

export function LanguageSwitcher({ locale, t }: { locale: Locale; t: Dictionary["language"] }) {
  return (
    <form
      action={updatePlatformLanguageAction}
      className="inline-flex rounded-full border border-black/10 bg-white/80 p-1 shadow-sm"
    >
      <span className="sr-only">{t.label}</span>
      <button
        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
          locale === "en" ? "bg-stone-950 text-white" : "text-stone-600"
        }`}
        name="locale"
        type="submit"
        value="en"
      >
        EN
      </button>
      <button
        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
          locale === "tr" ? "bg-stone-950 text-white" : "text-stone-600"
        }`}
        name="locale"
        type="submit"
        value="tr"
      >
        TR
      </button>
    </form>
  );
}
