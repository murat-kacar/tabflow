import { redirect } from "next/navigation";
import { KitchenBoard } from "../components/kitchen-board";
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

  const boards = await getKitchenBoard(session);
  return <KitchenBoard boards={boards} />;
}
