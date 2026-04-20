import { redirect } from "next/navigation";
import { TenantLoginForm } from "../components/tenant-login-form";
import { getDictionary } from "../i18n/server";
import { getTenantBootstrapStatus } from "../lib/tenant-auth-api";
import { getTenantSession } from "../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantLoginPage() {
  const [t, session] = await Promise.all([getDictionary(), getTenantSession()]);

  if (session) {
    redirect(session.mustChangePassword ? "/change-password" : "/console");
  }

  const bootstrapStatus = await getTenantBootstrapStatus();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe7c2,transparent_28rem),radial-gradient(circle_at_bottom_right,#dce8ff,transparent_30rem),linear-gradient(135deg,#f7f3ec,#ece7dd)] px-6 py-10">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_30rem] lg:items-start">
        <div className="rounded-[2rem] border border-black/10 bg-stone-950 p-8 text-stone-50 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-400">
            {t.login.eyebrow}
          </p>
          <h2 className="mt-4 text-5xl font-bold tracking-tight">{t.login.title}</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-300">{t.login.body}</p>
        </div>
        <TenantLoginForm
          bootstrapRequired={bootstrapStatus.bootstrapRequired}
          suggestedAdminEmail={bootstrapStatus.suggestedAdminEmail}
          t={t}
        />
      </section>
    </main>
  );
}
