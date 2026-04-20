import { redirect } from "next/navigation";
import { PdaOrderWorkspace } from "../components/pda-order-workspace";
import { getDictionary } from "../i18n/server";
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

  const [t, catalog, tables, bills, orders] = await Promise.all([
    getDictionary(),
    getAdminCatalog(session),
    listAdminTables(session),
    listTenantBills(session),
    listTenantOrders(session)
  ]);

  return (
    <PdaOrderWorkspace bills={bills} catalog={catalog} orders={orders} tables={tables} t={t} />
  );
}
