import { redirect } from "next/navigation";
import { TenantChangePasswordForm } from "../../components/tenant-change-password-form";
import { getTenantSession } from "../../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantChangePasswordPage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.mustChangePassword) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe7c2,transparent_28rem),radial-gradient(circle_at_bottom_right,#dce8ff,transparent_30rem),linear-gradient(135deg,#f7f3ec,#ece7dd)] px-6 py-10">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-black/10 bg-white/90 p-8 shadow-xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
          Ilk Giris
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
          Varsayilan sifreni degistir
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          Guvenlik geregi varsayilan sifre ile devam edemezsin. Yeni sifreni belirle ve
          admin paneline devam et.
        </p>
        <TenantChangePasswordForm />
      </section>
    </main>
  );
}
