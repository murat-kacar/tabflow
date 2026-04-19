import { redirect } from "next/navigation";
import { CatalogManager } from "../../components/catalog-manager";
import { TenantAdminShell } from "../../components/tenant-admin-shell";
import { getAdminCatalog, listStations } from "../../lib/tenant-api";
import { getTenantSession } from "../../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantCatalogPage() {
  const session = await getTenantSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  const [catalog, stations] = await Promise.all([
    getAdminCatalog(session),
    listStations(session)
  ]);

  return (
    <TenantAdminShell email={session.email}>
      <CatalogManager catalog={catalog} stations={stations} />
    </TenantAdminShell>
  );
}
