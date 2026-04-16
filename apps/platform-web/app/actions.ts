"use server";

import { revalidatePath } from "next/cache";
import { createTenant, updateTenantStatus } from "./lib/platform-api";
import { getPlatformSession } from "./lib/platform-session";

export type TenantActionState = {
  ok: boolean;
  message: string;
};

const initialErrorState: TenantActionState = {
  ok: false,
  message: ""
};

export async function createTenantAction(
  _previousState: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  try {
    const session = await getPlatformSession();

    if (!session) {
      throw new Error("Oturum bulunamadi.");
    }

    await createTenant(
      {
        code: String(formData.get("code") ?? ""),
        displayName: String(formData.get("displayName") ?? ""),
        primaryDomain: String(formData.get("primaryDomain") ?? ""),
        initialAdminEmail: String(formData.get("initialAdminEmail") ?? "") || null
      },
      session
    );
    revalidatePath("/");

    return {
      ok: true,
      message: "Tenant kaydi olusturuldu. Provisioning job siraya alindi."
    };
  } catch (error) {
    return {
      ...initialErrorState,
      message: error instanceof Error ? error.message : "Tenant olusturulamadi."
    };
  }
}

export async function setTenantStatusAction(formData: FormData): Promise<void> {
  const session = await getPlatformSession();

  if (!session) {
    throw new Error("Oturum bulunamadi.");
  }

  await updateTenantStatus(
    String(formData.get("id") ?? ""),
    String(formData.get("status") ?? "suspended") as "active" | "suspended" | "archived",
    session
  );
  revalidatePath("/");
}
