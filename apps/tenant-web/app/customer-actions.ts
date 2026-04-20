"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "./i18n/server";
import { clearCustomerSessionCookie, getCustomerSession } from "./lib/customer-session";
import { createCustomerOrder, logoutCustomerSession } from "./lib/tenant-api";

export type CustomerOrderActionState = {
  ok: boolean;
  message: string;
};

export async function submitCustomerOrderAction(
  _previousState: CustomerOrderActionState,
  formData: FormData
): Promise<CustomerOrderActionState> {
  const [session, t] = await Promise.all([getCustomerSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.qrSessionMissing
    };
  }

  const items = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("qty-"))
    .map(([key, value]) => ({
      menuItemId: key.slice(4),
      quantity: Number(value),
      note: String(formData.get(`note-${key.slice(4)}`) ?? "")
    }))
    .filter((item) => item.quantity > 0);

  if (items.length === 0) {
    return {
      ok: false,
      message: t.messages.orderRequiresItem
    };
  }

  try {
    await createCustomerOrder({
      sessionToken: session.backendSessionToken,
      note: String(formData.get("orderNote") ?? ""),
      items
    });
    revalidatePath("/menu");

    return {
      ok: true,
      message: t.messages.customerOrderSent
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.customerOrderFailed
    };
  }
}

export async function leaveCustomerSessionAction(): Promise<void> {
  const session = await getCustomerSession();

  if (session) {
    try {
      await logoutCustomerSession(session.backendSessionToken);
    } catch {}
  }

  await clearCustomerSessionCookie();
  redirect("/");
}
