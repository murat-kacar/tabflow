import { redirect } from "next/navigation";
import { CustomerMenu } from "../components/customer-menu";
import { getDictionary } from "../i18n/server";
import { getCustomerSession } from "../lib/customer-session";
import { getCustomerSessionStatus, getPublicCatalog } from "../lib/tenant-api";

export const dynamic = "force-dynamic";

export default async function CustomerMenuPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/");
  }

  try {
    await getCustomerSessionStatus(session.backendSessionToken);
  } catch {
    redirect("/");
  }

  const [catalog, t] = await Promise.all([getPublicCatalog(), getDictionary()]);

  return <CustomerMenu catalog={catalog} session={session} t={t.customerMenu} />;
}
