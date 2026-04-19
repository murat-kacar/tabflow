import { redirect } from "next/navigation";
import { FloorCashWorkspace } from "../../components/floor-cash-workspace";
import { TenantAdminShell } from "../../components/tenant-admin-shell";
import {
  listAdminDevices,
  listAdminTables,
  listTenantBills,
  listTenantOrders
} from "../../lib/tenant-api";
import { getTenantSession } from "../../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantFloorPage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.mustChangePassword) {
    redirect("/admin/change-password");
  }

  const [orders, bills, tables, devices] = await Promise.all([
    listTenantOrders(session),
    listTenantBills(session),
    listAdminTables(session),
    listAdminDevices(session)
  ]);

  return (
    <TenantAdminShell email={session.email}>
      <FloorCashWorkspace bills={bills} devices={devices} orders={orders} tables={tables} />
    </TenantAdminShell>
  );
}
