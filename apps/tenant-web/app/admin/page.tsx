import { redirect } from "next/navigation";
import { AdminConsoleOverview } from "../components/admin-console-overview";
import { TenantAdminShell } from "../components/tenant-admin-shell";
import {
  getAdminCatalog,
  listAdminDevices,
  listAdminTables,
  listStations,
  listTenantBills
} from "../lib/tenant-api";
import { getTenantSession } from "../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantAdminPage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.mustChangePassword) {
    redirect("/admin/change-password");
  }

  const [catalog, devices, bills, tables, stations] = await Promise.all([
    getAdminCatalog(session),
    listAdminDevices(session),
    listTenantBills(session),
    listAdminTables(session),
    listStations(session)
  ]);

  return (
    <TenantAdminShell email={session.email}>
      <AdminConsoleOverview
        catalog={catalog}
        bills={bills}
        devices={devices}
        stations={stations}
        tables={tables}
      />
    </TenantAdminShell>
  );
}
