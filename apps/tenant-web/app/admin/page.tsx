import { redirect } from "next/navigation";
import { TenantAdminDashboard } from "../components/tenant-admin-dashboard";
import { TenantAdminShell } from "../components/tenant-admin-shell";
import {
  getAdminCatalog,
  listAdminDevices,
  listAdminTables,
  listStations,
  listTenantBills,
  listTenantOrders
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

  const [orders, catalog, devices, bills, tables, stations] = await Promise.all([
    listTenantOrders(session),
    getAdminCatalog(session),
    listAdminDevices(session),
    listTenantBills(session),
    listAdminTables(session),
    listStations(session)
  ]);

  return (
    <TenantAdminShell email={session.email}>
      <TenantAdminDashboard
        catalog={catalog}
        bills={bills}
        devices={devices}
        email={session.email}
        orders={orders}
        stations={stations}
        tables={tables}
      />
    </TenantAdminShell>
  );
}
