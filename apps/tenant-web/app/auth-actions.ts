"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  closeTenantBill,
  createAdminTable,
  createMenuCategory,
  createMenuItem,
  createStation,
  deleteAdminTable,
  deleteStation,
  refreshDeviceToken,
  rotateDeviceKey,
  updateAdminTable,
  updateKitchenItemStatus,
  updateStation,
  updateTenantOrderStatus
} from "./lib/tenant-api";
import { bootstrapTenantAdmin, loginTenantAdmin } from "./lib/tenant-auth-api";
import {
  clearTenantSessionCookie,
  createTenantSessionToken,
  getTenantSession,
  setTenantSessionCookie
} from "./lib/tenant-session";

export type TenantLoginActionState = {
  ok: boolean;
  message: string;
};

export type TenantDeviceActionState = {
  ok: boolean;
  message: string;
  firmwareConfig?: string;
  rawDeviceKey?: string;
};

export type TenantAdminActionState = {
  ok: boolean;
  message: string;
};

export type TenantTableActionState = {
  ok: boolean;
  message: string;
};

export type TenantStationActionState = {
  ok: boolean;
  message: string;
};

async function establishSession(
  email: string,
  password: string,
  bootstrap: boolean
): Promise<void> {
  const profile = bootstrap
    ? await bootstrapTenantAdmin({ email, password })
    : await loginTenantAdmin({ email, password });

  const { token, session } = createTenantSessionToken({
    adminId: profile.id,
    email: profile.email,
    mustChangePassword: profile.mustChangePassword
  });

  await setTenantSessionCookie(token, session.expiresAt);
}

export async function tenantLoginAction(
  _previousState: TenantLoginActionState,
  formData: FormData
): Promise<TenantLoginActionState> {
  try {
    await establishSession(
      String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      String(formData.get("password") ?? ""),
      false
    );
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Giris yapilamadi."
    };
  }

  redirect("/admin");
}

export async function tenantBootstrapAction(
  _previousState: TenantLoginActionState,
  formData: FormData
): Promise<TenantLoginActionState> {
  try {
    await establishSession(
      String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      String(formData.get("password") ?? ""),
      true
    );
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Ilk admin olusturulamadi."
    };
  }

  redirect("/admin");
}

export async function changeTenantPasswordAction(
  _previousState: TenantLoginActionState,
  formData: FormData
): Promise<TenantLoginActionState> {
  const session = await getTenantSession();

  if (!session) {
    return {
      ok: false,
      message: "Oturum bulunamadi."
    };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      message: "Yeni sifre ve tekrar alani ayni olmali."
    };
  }

  try {
    const { changeTenantAdminPassword } = await import("./lib/tenant-auth-api");
    const profile = await changeTenantAdminPassword(session, {
      currentPassword,
      newPassword
    });

    const { token, session: nextSession } = createTenantSessionToken({
      adminId: profile.id,
      email: profile.email,
      mustChangePassword: profile.mustChangePassword
    });

    await setTenantSessionCookie(token, nextSession.expiresAt);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Sifre degistirilemedi."
    };
  }

  redirect("/admin");
}

export async function tenantLogoutAction(): Promise<void> {
  await clearTenantSessionCookie();
  redirect("/admin/login");
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const session = await getTenantSession();

  if (!session) {
    throw new Error("Oturum bulunamadi.");
  }

  await createMenuCategory(session, {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    stationId: String(formData.get("stationId") ?? "") || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on"
  });

  revalidatePath("/admin");
}

export async function createItemAction(formData: FormData): Promise<void> {
  const session = await getTenantSession();

  if (!session) {
    throw new Error("Oturum bulunamadi.");
  }

  await createMenuItem(session, {
    categoryId: String(formData.get("categoryId") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceMinor: Number(formData.get("priceMinor") ?? 0),
    currencyCode: String(formData.get("currencyCode") ?? "GBP"),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isAvailable: formData.get("isAvailable") === "on"
  });

  revalidatePath("/admin");
}

export async function rotateDeviceKeyAction(
  _previousState: TenantDeviceActionState,
  formData: FormData
): Promise<TenantDeviceActionState> {
  const session = await getTenantSession();

  if (!session) {
    return {
      ok: false,
      message: "Oturum bulunamadi."
    };
  }

  try {
    const result = await rotateDeviceKey(session, String(formData.get("tableId") ?? ""));
    revalidatePath("/admin");

    return {
      ok: true,
      message: "Cihaz anahtari yenilendi.",
      firmwareConfig: result.firmwareConfig,
      rawDeviceKey: result.rawDeviceKey
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Cihaz anahtari yenilenemedi."
    };
  }
}

export async function refreshDeviceTokenAction(
  _previousState: TenantDeviceActionState,
  formData: FormData
): Promise<TenantDeviceActionState> {
  const session = await getTenantSession();

  if (!session) {
    return {
      ok: false,
      message: "Oturum bulunamadi."
    };
  }

  try {
    const result = await refreshDeviceToken(session, String(formData.get("tableId") ?? ""));
    revalidatePath("/admin");

    return {
      ok: true,
      message: `Yeni token gonderildi. TTL ${result.ttlSeconds}s`
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Token gonderilemedi."
    };
  }
}

export async function closeBillAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const session = await getTenantSession();

  if (!session) {
    return {
      ok: false,
      message: "Oturum bulunamadi."
    };
  }

  try {
    await closeTenantBill(session, String(formData.get("billId") ?? ""));
    revalidatePath("/admin");

    return {
      ok: true,
      message: "Acik hesap kapatildi."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Hesap kapatilamadi."
    };
  }
}

export async function updateOrderStatusAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const session = await getTenantSession();

  if (!session) {
    return {
      ok: false,
      message: "Oturum bulunamadi."
    };
  }

  try {
    await updateTenantOrderStatus(
      session,
      String(formData.get("orderId") ?? ""),
      String(formData.get("status") ?? "") as never
    );
    revalidatePath("/admin");

    return {
      ok: true,
      message: "Siparis durumu guncellendi."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Siparis durumu guncellenemedi."
    };
  }
}

export async function createTableAction(
  _previousState: TenantTableActionState,
  formData: FormData
): Promise<TenantTableActionState> {
  const session = await getTenantSession();

  if (!session) {
    return { ok: false, message: "Oturum bulunamadi." };
  }

  try {
    await createAdminTable(session, {
      number: Number(formData.get("number") ?? 0),
      name: String(formData.get("name") ?? ""),
      serviceNote: String(formData.get("serviceNote") ?? ""),
      isActive: formData.get("isActive") === "on"
    });
    revalidatePath("/admin");
    return { ok: true, message: "Masa eklendi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Masa eklenemedi."
    };
  }
}

export async function updateTableAction(
  _previousState: TenantTableActionState,
  formData: FormData
): Promise<TenantTableActionState> {
  const session = await getTenantSession();

  if (!session) {
    return { ok: false, message: "Oturum bulunamadi." };
  }

  try {
    await updateAdminTable(session, String(formData.get("tableId") ?? ""), {
      number: Number(formData.get("number") ?? 0),
      name: String(formData.get("name") ?? ""),
      serviceNote: String(formData.get("serviceNote") ?? ""),
      isActive: formData.get("isActive") === "on"
    });
    revalidatePath("/admin");
    return { ok: true, message: "Masa guncellendi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Masa guncellenemedi."
    };
  }
}

export async function deleteTableAction(
  _previousState: TenantTableActionState,
  formData: FormData
): Promise<TenantTableActionState> {
  const session = await getTenantSession();

  if (!session) {
    return { ok: false, message: "Oturum bulunamadi." };
  }

  try {
    await deleteAdminTable(session, String(formData.get("tableId") ?? ""));
    revalidatePath("/admin");
    return { ok: true, message: "Masa silindi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Masa silinemedi."
    };
  }
}

export async function createStationAction(
  _previousState: TenantStationActionState,
  formData: FormData
): Promise<TenantStationActionState> {
  const session = await getTenantSession();

  if (!session) {
    return { ok: false, message: "Oturum bulunamadi." };
  }

  try {
    await createStation(session, {
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      colorHex: String(formData.get("colorHex") ?? "#64748b"),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      isActive: formData.get("isActive") === "on"
    });
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true, message: "Istasyon eklendi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Istasyon eklenemedi."
    };
  }
}

export async function updateStationAction(
  _previousState: TenantStationActionState,
  formData: FormData
): Promise<TenantStationActionState> {
  const session = await getTenantSession();

  if (!session) {
    return { ok: false, message: "Oturum bulunamadi." };
  }

  try {
    await updateStation(session, String(formData.get("stationId") ?? ""), {
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      colorHex: String(formData.get("colorHex") ?? "#64748b"),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      isActive: formData.get("isActive") === "on"
    });
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true, message: "Istasyon guncellendi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Istasyon guncellenemedi."
    };
  }
}

export async function deleteStationAction(
  _previousState: TenantStationActionState,
  formData: FormData
): Promise<TenantStationActionState> {
  const session = await getTenantSession();

  if (!session) {
    return { ok: false, message: "Oturum bulunamadi." };
  }

  try {
    await deleteStation(session, String(formData.get("stationId") ?? ""));
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true, message: "Istasyon silindi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Istasyon silinemedi."
    };
  }
}

export async function updateKitchenItemStatusAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const session = await getTenantSession();

  if (!session) {
    return { ok: false, message: "Oturum bulunamadi." };
  }

  try {
    await updateKitchenItemStatus(
      session,
      String(formData.get("orderItemId") ?? ""),
      String(formData.get("status") ?? "") as "preparing" | "ready" | "cancelled"
    );
    revalidatePath("/admin");
    revalidatePath("/admin/kitchen");
    return { ok: true, message: "Mutfak kalemi guncellendi." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Mutfak kalemi guncellenemedi."
    };
  }
}
