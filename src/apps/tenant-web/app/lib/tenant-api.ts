import {
  type AdminDevice,
  type AdminTableSummary,
  adminDeviceListSchema,
  adminTableSummaryListSchema,
  type CreateAdminOrderInput,
  type CreatedServiceTableResponse,
  type CustomerBillSummary,
  type CustomerOrderDetail,
  type CustomerOrderSummary,
  type CustomerSessionStatus,
  createAdminOrderInputSchema,
  createdServiceTableResponseSchema,
  customerBillSummaryListSchema,
  customerOrderDetailSchema,
  customerOrderSummaryListSchema,
  customerSessionStatusSchema,
  deviceTokenSummarySchema,
  kitchenStationBoardListSchema,
  type MergeBillInput,
  type MoveBillInput,
  mergeBillInputSchema,
  moveBillInputSchema,
  platformProblemSchema,
  type ServiceStation,
  type SplitBillInput,
  serviceStationListSchema,
  splitBillInputSchema,
  type TenantCatalog,
  type TenantProfile,
  tenantCatalogSchema,
  tenantProfileSchema,
  type UpdateFirmwareDefaultsInput,
  type UpdateTableLayoutEntry,
  type UpsertMenuCategoryInput,
  type UpsertMenuItemInput,
  type UpsertServiceStationInput,
  type UpsertServiceTableInput,
  updateFirmwareDefaultsInputSchema,
  updateTableLayoutEntryListSchema,
  upsertMenuCategoryInputSchema,
  upsertMenuItemInputSchema,
  upsertServiceStationInputSchema,
  upsertServiceTableInputSchema,
  type VerifiedCustomerSession,
  verifiedCustomerSessionSchema
} from "@tabflow/shared-ts";
import type { TenantSession } from "./tenant-session";

const defaultTenantApiBaseUrl = "http://127.0.0.1:8100";

function tenantApiBaseUrl(): string {
  return (
    process.env.TENANT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_TENANT_API_BASE_URL ??
    defaultTenantApiBaseUrl
  ).replace(/\/$/, "");
}

async function readProblem(response: Response): Promise<string> {
  const fallback = `Tenant API returned ${response.status}`;

  try {
    const payload: unknown = await response.json();
    const problem = platformProblemSchema.safeParse(payload);

    if (!problem.success) {
      return fallback;
    }

    return problem.data.detail ?? problem.data.message ?? problem.data.title ?? fallback;
  } catch {
    return fallback;
  }
}

function tenantAdminHeaders(session: TenantSession): HeadersInit {
  const apiKey = tenantAdminApiKey();

  return {
    "X-Tenant-Admin-Key": apiKey,
    "X-Tenant-Admin-Email": session.email,
    "X-Tenant-Admin-Id": session.adminId
  };
}

function tenantAdminApiKey(): string {
  const apiKey = process.env.TENANT_ADMIN_API_KEY;

  if (!apiKey) {
    throw new Error("TENANT_ADMIN_API_KEY is not configured.");
  }

  return apiKey;
}

export async function listTenantOrders(session: TenantSession): Promise<CustomerOrderSummary[]> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/orders`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return customerOrderSummaryListSchema.parse(await response.json());
}

export async function createAdminOrder(
  session: TenantSession,
  input: CreateAdminOrderInput
): Promise<CustomerOrderDetail> {
  const payload = createAdminOrderInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/orders`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return customerOrderDetailSchema.parse(await response.json());
}

export async function listTenantBills(session: TenantSession): Promise<CustomerBillSummary[]> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/bills`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return customerBillSummaryListSchema.parse(await response.json());
}

export async function closeTenantBill(session: TenantSession, billId: string): Promise<void> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/bills/${billId}/close`, {
    method: "POST",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function moveTenantBill(
  session: TenantSession,
  billId: string,
  input: MoveBillInput
): Promise<void> {
  const payload = moveBillInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/bills/${billId}/move`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function mergeTenantBill(
  session: TenantSession,
  targetBillId: string,
  input: MergeBillInput
): Promise<void> {
  const payload = mergeBillInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/bills/${targetBillId}/merge`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function splitTenantBill(
  session: TenantSession,
  sourceBillId: string,
  input: SplitBillInput
): Promise<void> {
  const payload = splitBillInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/bills/${sourceBillId}/split`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function updateTenantOrderStatus(
  session: TenantSession,
  orderId: string,
  status: CustomerOrderSummary["status"]
): Promise<void> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/orders/${orderId}/status`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function getAdminCatalog(session: TenantSession): Promise<TenantCatalog> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/catalog`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantCatalogSchema.parse(await response.json());
}

export async function listStations(session: TenantSession): Promise<ServiceStation[]> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/stations`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return serviceStationListSchema.parse(await response.json());
}

export async function createStation(
  session: TenantSession,
  input: UpsertServiceStationInput
): Promise<void> {
  const payload = upsertServiceStationInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/stations`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function updateStation(
  session: TenantSession,
  stationId: string,
  input: UpsertServiceStationInput
): Promise<void> {
  const payload = upsertServiceStationInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/stations/${stationId}`, {
    method: "PUT",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function deleteStation(session: TenantSession, stationId: string): Promise<void> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/stations/${stationId}`, {
    method: "DELETE",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function getKitchenBoard(session: TenantSession) {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/kitchen`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return kitchenStationBoardListSchema.parse(await response.json());
}

export async function updateKitchenItemStatus(
  session: TenantSession,
  orderItemId: string,
  status: "preparing" | "ready" | "cancelled"
): Promise<void> {
  const response = await fetch(
    `${tenantApiBaseUrl()}/api/admin/kitchen/items/${orderItemId}/status`,
    {
      method: "POST",
      headers: {
        ...tenantAdminHeaders(session),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    }
  );

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function listAdminTables(session: TenantSession): Promise<AdminTableSummary[]> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/tables`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return adminTableSummaryListSchema.parse(await response.json());
}

export async function createAdminTable(
  session: TenantSession,
  input: UpsertServiceTableInput
): Promise<CreatedServiceTableResponse> {
  const payload = upsertServiceTableInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/tables`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return createdServiceTableResponseSchema.parse(await response.json());
}

export async function updateAdminTable(
  session: TenantSession,
  tableId: string,
  input: UpsertServiceTableInput
): Promise<void> {
  const payload = upsertServiceTableInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/tables/${tableId}`, {
    method: "PUT",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function saveAdminTableLayouts(
  session: TenantSession,
  entries: UpdateTableLayoutEntry[]
): Promise<void> {
  const payload = updateTableLayoutEntryListSchema.parse(entries);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/tables/layouts`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function saveFloorLayoutDocument(
  session: TenantSession,
  floorLayoutJson: string
): Promise<void> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/floor-layout`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ floorLayoutJson })
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function updateFirmwareDefaults(
  session: TenantSession,
  input: UpdateFirmwareDefaultsInput
): Promise<TenantProfile> {
  const payload = updateFirmwareDefaultsInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/tenant/firmware-defaults`, {
    method: "PUT",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantProfileSchema.parse(await response.json());
}

export async function getFloorLayoutDocument(session: TenantSession): Promise<string> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/floor-layout`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  const payload = (await response.json()) as { floorLayoutJson?: unknown };
  return typeof payload.floorLayoutJson === "string" ? payload.floorLayoutJson : "{}";
}

export async function deleteAdminTable(session: TenantSession, tableId: string): Promise<void> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/tables/${tableId}`, {
    method: "DELETE",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function createMenuCategory(
  session: TenantSession,
  input: UpsertMenuCategoryInput
): Promise<void> {
  const payload = upsertMenuCategoryInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/catalog/categories`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function createMenuItem(
  session: TenantSession,
  input: UpsertMenuItemInput
): Promise<void> {
  const payload = upsertMenuItemInputSchema.parse(input);
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/catalog/items`, {
    method: "POST",
    headers: {
      ...tenantAdminHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}

export async function listAdminDevices(session: TenantSession): Promise<AdminDevice[]> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/devices`, {
    cache: "no-store",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return adminDeviceListSchema.parse(await response.json());
}

export async function refreshDeviceToken(
  session: TenantSession,
  tableId: string
): Promise<{ expiresAt: string; ttlSeconds: number; url: string }> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/devices/${tableId}/refresh-token`, {
    method: "POST",
    headers: tenantAdminHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return deviceTokenSummarySchema.parse(await response.json());
}

export async function getPublicCatalog(): Promise<TenantCatalog> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/public/catalog`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantCatalogSchema.parse(await response.json());
}

export async function getTenantProfile(): Promise<TenantProfile> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/tenant/profile`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantProfileSchema.parse(await response.json());
}

export async function verifyTableToken(token: string): Promise<VerifiedCustomerSession> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/public/token/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return verifiedCustomerSessionSchema.parse(await response.json());
}

export async function createCustomerOrder(input: {
  sessionToken: string;
  note: string;
  items: Array<{ menuItemId: string; note: string; quantity: number }>;
  checkoutToken: string;
}): Promise<CustomerOrderDetail> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/public/orders`, {
    method: "POST",
    headers: {
      "X-Customer-Session-Token": input.sessionToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      note: input.note,
      items: input.items,
      checkoutToken: input.checkoutToken
    })
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return customerOrderDetailSchema.parse(await response.json());
}

export async function getCustomerSessionStatus(
  sessionToken: string
): Promise<CustomerSessionStatus> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/public/session`, {
    cache: "no-store",
    headers: {
      "X-Customer-Session-Token": sessionToken
    }
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return customerSessionStatusSchema.parse(await response.json());
}

export async function logoutCustomerSession(sessionToken: string): Promise<void> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/public/session/logout`, {
    method: "POST",
    headers: {
      "X-Customer-Session-Token": sessionToken
    }
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }
}
