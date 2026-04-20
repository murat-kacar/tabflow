import { redirect } from "next/navigation";
import { TenantChangePasswordForm } from "../components/tenant-change-password-form";
import { getDictionary } from "../i18n/server";
import { getTenantSession } from "../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantChangePasswordPage() {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    redirect("/login");
  }

  if (!session.mustChangePassword) {
    redirect("/console");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe7c2,transparent_28rem),radial-gradient(circle_at_bottom_right,#dce8ff,transparent_30rem),linear-gradient(135deg,#f7f3ec,#ece7dd)] px-6 py-10">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-black/10 bg-white/90 p-8 shadow-xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
          {t.changePassword.eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
          {t.changePassword.title}
        </h1>
        <p className="mt-3 text-sm text-stone-600">{t.changePassword.body}</p>
        <TenantChangePasswordForm t={t.changePassword} />
      </section>
    </main>
  );
}
