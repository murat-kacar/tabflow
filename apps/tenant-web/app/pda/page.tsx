import { redirect } from "next/navigation";
import { PdaOrderWorkspace } from "../components/pda-order-workspace";
import {
  getAdminCatalog,
  listAdminTables,
  listTenantBills,
  listTenantOrders
} from "../lib/tenant-api";
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

  const [catalog, tables, bills, orders] = await Promise.all([
    getAdminCatalog(session),
    listAdminTables(session),
    listTenantBills(session),
    listTenantOrders(session)
  ]);

  return <PdaOrderWorkspace bills={bills} catalog={catalog} orders={orders} tables={tables} />;
}
