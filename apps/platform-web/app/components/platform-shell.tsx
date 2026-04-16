import type { ReactNode } from "react";
import { logoutAction } from "../auth-actions";

export function PlatformShell({ children, email }: { children: ReactNode; email: string }) {
  return (
    <>
      <header className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">
              Yenicafe Platform
            </p>
            <p className="mt-1 text-sm text-stone-700">{email}</p>
          </div>
          <form action={logoutAction}>
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
              type="submit"
            >
              Cikis yap
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
