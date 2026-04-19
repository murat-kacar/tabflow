import Link from "next/link";
import type { ReactNode } from "react";
import { tenantLogoutAction } from "../auth-actions";

export function TenantAdminShell({ children, email }: { children: ReactNode; email: string }) {
  return (
    <>
      <header className="border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">
              Tenant Admin
            </p>
            <p className="mt-1 text-sm text-stone-700">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
              href="/admin"
            >
              Overview
            </Link>
            <Link
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
              href="/admin/floor"
            >
              Masa + Kasa
            </Link>
            <Link
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
              href="/admin/kitchen"
            >
              Station Board
            </Link>
            <form action={tenantLogoutAction}>
              <button
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
                type="submit"
              >
                Cikis yap
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
