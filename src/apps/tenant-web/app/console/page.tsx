import { redirect } from "next/navigation";
import { AdminConsoleOverview } from "../components/admin-console-overview";
import { TenantAdminShell } from "../components/tenant-admin-shell";
import { getDictionary } from "../i18n/server";
import {
  getAdminCatalog,
  listAdminDevices,
  listAdminTables,
  listStations,
  listTenantBills
} from "../lib/tenant-api";
import { getTenantSession } from "../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantConsolePage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  const [catalog, devices, bills, tables, stations, t] = await Promise.all([
    getAdminCatalog(session),
    listAdminDevices(session),
    listTenantBills(session),
    listAdminTables(session),
    listStations(session),
    getDictionary()
  ]);

  return (
    <TenantAdminShell email={session.email}>
      <AdminConsoleOverview
        catalog={catalog}
        bills={bills}
        devices={devices}
        stations={stations}
        tables={tables}
        t={t}
      />
    </TenantAdminShell>
  );
}
