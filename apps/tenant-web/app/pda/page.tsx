import { redirect } from "next/navigation";
import { getTenantSession } from "../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantPdaPage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f3e5c8,transparent_28rem),linear-gradient(135deg,#f8f4ea,#e9ece7)] px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
          Garson PDA Web
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Mobil servis akisi sonraki sprintte</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">
          Route omurgasi hazir. Bu yuzey bir sonraki dalgada masa secimi, siparis girisi ve servis
          aksiyonlari icin mobil web-view olarak tasarlanacak.
        </p>
      </section>
    </main>
  );
}
