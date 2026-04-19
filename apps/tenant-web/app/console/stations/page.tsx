import { redirect } from "next/navigation";
import { StationManager } from "../../components/station-manager";
import { TenantAdminShell } from "../../components/tenant-admin-shell";
import { listStations } from "../../lib/tenant-api";
import { getTenantSession } from "../../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantConsoleStationsPage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  const stations = await listStations(session);

  return (
    <TenantAdminShell email={session.email}>
      <StationManager stations={stations} />
    </TenantAdminShell>
  );
}
