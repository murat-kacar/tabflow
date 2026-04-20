import { redirect } from "next/navigation";
import { KitchenBoard } from "../components/kitchen-board";
import { getDictionary } from "../i18n/server";
import { getKitchenBoard } from "../lib/tenant-api";
import { getTenantSession } from "../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantStationsPage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  const [boards, t] = await Promise.all([getKitchenBoard(session), getDictionary()]);
  return <KitchenBoard boards={boards} t={t.kitchenBoard} />;
}
