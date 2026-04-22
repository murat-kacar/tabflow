import Link from "next/link";
import { getDictionary } from "./i18n/server";
import { getCustomerSession } from "./lib/customer-session";

export const dynamic = "force-dynamic";

export default async function TenantHome() {
  const [t, session] = await Promise.all([getDictionary(), getCustomerSession()]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#efe2c4,transparent_28rem),linear-gradient(135deg,#f8f5ed,#e5ece7)] px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
          {t.common.tenant}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">{t.home.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-700">{t.home.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {session ? (
            <Link
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
              href="/menu"
            >
              {t.home.returnToMenu}
            </Link>
          ) : (
            <div className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900">
              {t.home.scanQrPrompt}
            </div>
          )}
          <Link
            className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
            href="/login"
          >
            {t.home.tenantAdmin}
          </Link>
        </div>
      </section>
    </main>
  );
}
