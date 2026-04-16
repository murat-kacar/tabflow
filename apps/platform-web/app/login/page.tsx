import { redirect } from "next/navigation";
import { LoginForm } from "../components/login-form";
import { getBootstrapStatus } from "../lib/platform-auth-api";
import { getPlatformSession } from "../lib/platform-session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getPlatformSession();

  if (session) {
    redirect("/");
  }

  const bootstrapStatus = await getBootstrapStatus();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffedcf,transparent_28rem),radial-gradient(circle_at_bottom_right,#dce8ff,transparent_30rem),linear-gradient(135deg,#f8f4ec,#ece8df)] px-6 py-10">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_28rem] lg:items-center">
        <div className="rounded-[2rem] border border-black/10 bg-stone-950 p-8 text-stone-50 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-400">
            Control Plane
          </p>
          <h2 className="mt-4 text-5xl font-bold tracking-tight">
            Tenantlar, domainler ve lifecycle tek ekranda.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-300">
            Platform login akisi aktif. Buradan sonra tenant yaratma, durdurma, arsivleme ve daha
            sonra provisioning gozlemi tek bir super admin deneyimine baglanacak.
          </p>
        </div>
        <LoginForm bootstrapRequired={bootstrapStatus.bootstrapRequired} />
      </section>
    </main>
  );
}
