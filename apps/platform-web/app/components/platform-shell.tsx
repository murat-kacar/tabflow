import type { ReactNode } from "react";
import { logoutAction } from "../auth-actions";
import { getDictionary, getLocale } from "../i18n/server";
import { LanguageSwitcher } from "./language-switcher";

export async function PlatformShell({ children, email }: { children: ReactNode; email: string }) {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <>
      <header className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">
              TabFlow Platform
            </p>
            <p className="mt-1 text-sm text-stone-700">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} t={t.language} />
            <form action={logoutAction}>
              <button
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                type="submit"
              >
                {t.shell.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
