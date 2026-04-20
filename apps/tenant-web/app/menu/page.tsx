import { redirect } from "next/navigation";
import { CustomerMenu } from "../components/customer-menu";
import { en } from "../i18n/dictionaries/en";
import { tr } from "../i18n/dictionaries/tr";
import { getLocale } from "../i18n/server";
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

  const [catalog, locale] = await Promise.all([getPublicCatalog(), getLocale()]);

  return (
    <CustomerMenu
      catalog={catalog}
      initialLocale={locale}
      session={session}
      translations={{ en: en.customerMenu, tr: tr.customerMenu }}
    />
  );
}
