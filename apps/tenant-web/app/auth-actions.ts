"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDictionary } from "./i18n/server";
import {
  closeTenantBill,
  createAdminOrder,
  createAdminTable,
  createMenuCategory,
  createMenuItem,
  createStation,
  deleteAdminTable,
  deleteStation,
  mergeTenantBill,
  moveTenantBill,
  refreshDeviceToken,
  saveAdminTableLayouts,
  saveFloorLayoutDocument,
  splitTenantBill,
  updateFirmwareDefaults,
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
};

export type TenantAdminActionState = {
  ok: boolean;
  message: string;
};

export type TenantPdaOrderActionState = {
  ok: boolean;
  message: string;
  createdOrderId?: string;
};

export type TenantTableActionState = {
  ok: boolean;
  message: string;
  firmwareSketch?: string;
  firmwareFileName?: string;
  rawDeviceKey?: string;
};

export type TenantFirmwareDefaultsActionState = {
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
  const t = await getDictionary();

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
      message: error instanceof Error ? error.message : t.messages.loginFailed
    };
  }

  redirect("/console");
}

export async function tenantBootstrapAction(
  _previousState: TenantLoginActionState,
  formData: FormData
): Promise<TenantLoginActionState> {
  const t = await getDictionary();

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
      message: error instanceof Error ? error.message : t.messages.bootstrapFailed
    };
  }

  redirect("/console");
}

export async function changeTenantPasswordAction(
  _previousState: TenantLoginActionState,
  formData: FormData
): Promise<TenantLoginActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      message: t.messages.passwordMismatch
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
      message: error instanceof Error ? error.message : t.messages.passwordChangeFailed
    };
  }

  redirect("/console");
}

export async function tenantLogoutAction(): Promise<void> {
  await clearTenantSessionCookie();
  redirect("/login");
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    throw new Error(t.messages.sessionMissing);
  }

  await createMenuCategory(session, {
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    stationId: String(formData.get("stationId") ?? "") || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.get("isActive") === "on"
  });

  revalidatePath("/console");
}

export async function createItemAction(formData: FormData): Promise<void> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    throw new Error(t.messages.sessionMissing);
  }

  await createMenuItem(session, {
    categoryId: String(formData.get("categoryId") ?? ""),
    stationId: String(formData.get("stationId") ?? "") || null,
    sku: String(formData.get("sku") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceMinor: Number(formData.get("priceMinor") ?? 0),
    currencyCode: String(formData.get("currencyCode") ?? "GBP"),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isAvailable: formData.get("isAvailable") === "on"
  });

  revalidatePath("/console");
}

export async function refreshDeviceTokenAction(
  _previousState: TenantDeviceActionState,
  formData: FormData
): Promise<TenantDeviceActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  try {
    const result = await refreshDeviceToken(session, String(formData.get("tableId") ?? ""));
    revalidatePath("/console");

    return {
      ok: true,
      message: `${t.messages.deviceTokenSent} ${result.ttlSeconds}s`
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.deviceTokenSendFailed
    };
  }
}

export async function closeBillAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  try {
    await closeTenantBill(session, String(formData.get("billId") ?? ""));
    revalidatePath("/console");

    return {
      ok: true,
      message: t.messages.billClosed
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.billCloseFailed
    };
  }
}

export async function moveBillAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  try {
    await moveTenantBill(session, String(formData.get("billId") ?? ""), {
      targetTableId: String(formData.get("targetTableId") ?? "")
    });
    revalidatePath("/service");
    revalidatePath("/console");
    return {
      ok: true,
      message: t.messages.billMoved
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.billMoveFailed
    };
  }
}

export async function mergeBillAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  try {
    await mergeTenantBill(session, String(formData.get("targetBillId") ?? ""), {
      sourceBillId: String(formData.get("sourceBillId") ?? "")
    });
    revalidatePath("/service");
    revalidatePath("/console");
    return {
      ok: true,
      message: t.messages.billsMerged
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.billsMergeFailed
    };
  }
}

export async function splitBillAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  try {
    await splitTenantBill(session, String(formData.get("sourceBillId") ?? ""), {
      targetTableId: String(formData.get("targetTableId") ?? ""),
      orderIds: formData.getAll("orderIds").map(String)
    });
    revalidatePath("/service");
    revalidatePath("/console");
    return {
      ok: true,
      message: t.messages.billSplit
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.billSplitFailed
    };
  }
}

export async function updateOrderStatusAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  try {
    await updateTenantOrderStatus(
      session,
      String(formData.get("orderId") ?? ""),
      String(formData.get("status") ?? "") as never
    );
    revalidatePath("/console");

    return {
      ok: true,
      message: t.messages.orderStatusUpdated
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.orderStatusUpdateFailed
    };
  }
}

export async function createPdaOrderAction(
  _previousState: TenantPdaOrderActionState,
  formData: FormData
): Promise<TenantPdaOrderActionState> {
  const t = await getDictionary();
  const session = await getTenantSession();

  if (!session) {
    return {
      ok: false,
      message: t.messages.sessionMissing
    };
  }

  const items = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("qty-"))
    .map(([key, value]) => {
      const menuItemId = key.slice(4);
      return {
        menuItemId,
        quantity: Number(value),
        note: String(formData.get(`note-${menuItemId}`) ?? "")
      };
    })
    .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);

  if (items.length === 0) {
    return {
      ok: false,
      message: t.messages.orderRequiresItem
    };
  }

  try {
    const order = await createAdminOrder(session, {
      tableId: String(formData.get("tableId") ?? ""),
      note: String(formData.get("orderNote") ?? ""),
      items
    });
    revalidatePath("/pda");
    revalidatePath("/service");
    revalidatePath("/stations");
    revalidatePath("/console");

    return {
      ok: true,
      message: `${t.messages.pdaOrderSent} #${order.id.slice(0, 8)}`,
      createdOrderId: order.id
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.pdaOrderFailed
    };
  }
}

export async function createTableAction(
  _previousState: TenantTableActionState,
  formData: FormData
): Promise<TenantTableActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    const result = await createAdminTable(session, {
      number: Number(formData.get("number") ?? 0),
      name: String(formData.get("name") ?? ""),
      serviceNote: String(formData.get("serviceNote") ?? ""),
      layoutCode: "ana-kat",
      layoutX: 0,
      layoutY: 0,
      isActive: formData.get("isActive") === "on",
      firmwareWifiSsidOverride: String(formData.get("firmwareWifiSsidOverride") ?? "").trim() || null,
      firmwareWifiPasswordOverride:
        String(formData.get("firmwareWifiPasswordOverride") ?? "").trim() || null
    });
    revalidatePath("/console");
    return {
      ok: true,
      message: t.messages.tableCreated,
      firmwareSketch: result.firmwareSketch,
      firmwareFileName: result.firmwareFileName,
      rawDeviceKey: result.rawDeviceKey
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.tableCreateFailed
    };
  }
}

export async function updateTableAction(
  _previousState: TenantTableActionState,
  formData: FormData
): Promise<TenantTableActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    await updateAdminTable(session, String(formData.get("tableId") ?? ""), {
      number: Number(formData.get("number") ?? 0),
      name: String(formData.get("name") ?? ""),
      serviceNote: String(formData.get("serviceNote") ?? ""),
      layoutCode: String(formData.get("layoutCode") ?? "ana-kat"),
      layoutX: Number(formData.get("layoutX") ?? 0),
      layoutY: Number(formData.get("layoutY") ?? 0),
      isActive: formData.get("isActive") === "on",
      firmwareWifiSsidOverride: String(formData.get("firmwareWifiSsidOverride") ?? "").trim() || null,
      firmwareWifiPasswordOverride:
        String(formData.get("firmwareWifiPasswordOverride") ?? "").trim() || null
    });
    revalidatePath("/console");
    return { ok: true, message: t.messages.tableUpdated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.tableUpdateFailed
    };
  }
}

export async function saveFloorLayoutAction(
  _previousState: TenantTableActionState,
  formData: FormData
): Promise<TenantTableActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    const raw = String(formData.get("layoutPayload") ?? "[]");
    const entries = JSON.parse(raw) as Array<{
      tableId: string;
      layoutCode: string;
      layoutX: number;
      layoutY: number;
    }>;
    const floorLayoutJson = String(formData.get("floorLayoutJson") ?? "{}");

    await saveAdminTableLayouts(session, entries);
    await saveFloorLayoutDocument(session, floorLayoutJson);
    revalidatePath("/service");
    revalidatePath("/console");
    return { ok: true, message: t.messages.floorLayoutSaved };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.floorLayoutSaveFailed
    };
  }
}

export async function updateFirmwareDefaultsAction(
  _previousState: TenantFirmwareDefaultsActionState,
  formData: FormData
): Promise<TenantFirmwareDefaultsActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    await updateFirmwareDefaults(session, {
      wifiSsid: String(formData.get("wifiSsid") ?? ""),
      wifiPassword: String(formData.get("wifiPassword") ?? "")
    });
    revalidatePath("/service");
    revalidatePath("/console");
    return { ok: true, message: t.messages.firmwareDefaultsSaved };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.firmwareDefaultsSaveFailed
    };
  }
}

export async function deleteTableAction(
  _previousState: TenantTableActionState,
  formData: FormData
): Promise<TenantTableActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    await deleteAdminTable(session, String(formData.get("tableId") ?? ""));
    revalidatePath("/console");
    revalidatePath("/service");
    return { ok: true, message: t.messages.tableDeleted };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.tableDeleteFailed
    };
  }
}

export async function createStationAction(
  _previousState: TenantStationActionState,
  formData: FormData
): Promise<TenantStationActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    await createStation(session, {
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      colorHex: String(formData.get("colorHex") ?? "#64748b"),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      isActive: formData.get("isActive") === "on"
    });
    revalidatePath("/console");
    revalidatePath("/console/stations");
    revalidatePath("/stations");
    return { ok: true, message: t.messages.stationCreated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.stationCreateFailed
    };
  }
}

export async function updateStationAction(
  _previousState: TenantStationActionState,
  formData: FormData
): Promise<TenantStationActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    await updateStation(session, String(formData.get("stationId") ?? ""), {
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      colorHex: String(formData.get("colorHex") ?? "#64748b"),
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      isActive: formData.get("isActive") === "on"
    });
    revalidatePath("/console");
    revalidatePath("/console/stations");
    revalidatePath("/stations");
    return { ok: true, message: t.messages.stationUpdated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.stationUpdateFailed
    };
  }
}

export async function deleteStationAction(
  _previousState: TenantStationActionState,
  formData: FormData
): Promise<TenantStationActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    await deleteStation(session, String(formData.get("stationId") ?? ""));
    revalidatePath("/console");
    revalidatePath("/console/stations");
    revalidatePath("/stations");
    return { ok: true, message: t.messages.stationDeleted };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.stationDeleteFailed
    };
  }
}

export async function updateKitchenItemStatusAction(
  _previousState: TenantAdminActionState,
  formData: FormData
): Promise<TenantAdminActionState> {
  const [session, t] = await Promise.all([getTenantSession(), getDictionary()]);

  if (!session) {
    return { ok: false, message: t.messages.sessionMissing };
  }

  try {
    await updateKitchenItemStatus(
      session,
      String(formData.get("orderItemId") ?? ""),
      String(formData.get("status") ?? "") as "preparing" | "ready" | "cancelled"
    );
    revalidatePath("/console");
    revalidatePath("/stations");
    return { ok: true, message: t.messages.kitchenItemUpdated };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.kitchenItemUpdateFailed
    };
  }
}
