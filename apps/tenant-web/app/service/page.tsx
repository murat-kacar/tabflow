import { redirect } from "next/navigation";
import { FloorCashWorkspace } from "../components/floor-cash-workspace";
import { TenantAdminShell } from "../components/tenant-admin-shell";
import { getDictionary } from "../i18n/server";
import {
  getFloorLayoutDocument,
  listAdminDevices,
  listAdminTables,
  listTenantBills,
  listTenantOrders
} from "../lib/tenant-api";
import { getTenantSession } from "../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantServicePage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  const [orders, bills, tables, devices, floorLayoutJson, t] = await Promise.all([
    listTenantOrders(session),
    listTenantBills(session),
    listAdminTables(session),
    listAdminDevices(session),
    getFloorLayoutDocument(session),
    getDictionary()
  ]);

  return (
    <TenantAdminShell email={session.email}>
      <FloorCashWorkspace
        bills={bills}
        devices={devices}
        floorLayoutJson={floorLayoutJson}
        orders={orders}
        t={t.floorCash}
        tables={tables}
      />
    </TenantAdminShell>
  );
}
