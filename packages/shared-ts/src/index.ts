import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  time: z.string(),
  environment: z.string()
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const tenantStatusSchema = z.enum(["provisioning", "active", "suspended", "archived"]);

export type TenantStatus = z.infer<typeof tenantStatusSchema>;

export const tenantSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  displayName: z.string(),
  initialAdminEmail: z.email().nullable(),
  status: tenantStatusSchema,
  primaryDomain: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Tenant = z.infer<typeof tenantSchema>;

export const tenantListSchema = z.array(tenantSchema);

export const createTenantInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/),
  displayName: z.string().trim().min(2).max(160),
  primaryDomain: z
    .string()
    .trim()
    .transform((value) => value.replace(/\.$/, "").toLowerCase())
    .pipe(z.string().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/)),
  initialAdminEmail: z
    .email()
    .nullable()
    .optional()
    .transform((value) => value ?? null)
});

export type CreateTenantInput = z.infer<typeof createTenantInputSchema>;

export const platformProblemSchema = z
  .object({
    title: z.string().optional(),
    detail: z.string().optional(),
    message: z.string().optional(),
    errors: z.record(z.string(), z.array(z.string())).optional()
  })
  .passthrough();

export const platformAdminProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: z.enum(["viewer", "admin", "owner"]),
  createdAt: z.string()
});

export type PlatformAdminProfile = z.infer<typeof platformAdminProfileSchema>;

export const bootstrapStatusSchema = z.object({
  bootstrapRequired: z.boolean()
});

export type BootstrapStatus = z.infer<typeof bootstrapStatusSchema>;

export const provisionJobStatusSchema = z.enum([
  "pending",
  "running",
  "succeeded",
  "failed",
  "cancelled"
]);
export type ProvisionJobStatus = z.infer<typeof provisionJobStatusSchema>;

export const provisionJobSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  type: z.string(),
  status: provisionJobStatusSchema,
  attemptCount: z.number(),
  currentStep: z.string(),
  payloadJson: z.string(),
  resultJson: z.string(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  updatedAt: z.string()
});

export type ProvisionJob = z.infer<typeof provisionJobSchema>;
export const provisionJobListSchema = z.array(provisionJobSchema);

export const tenantRuntimeSummarySchema = z.object({
  tenantId: z.uuid(),
  tenantCode: z.string(),
  baseUrl: z.string().nullable(),
  healthStatus: z.string().nullable(),
  healthUrl: z.string().nullable(),
  healthCheckedAt: z.string().nullable(),
  exposureStatus: z.string().nullable(),
  exposureUrl: z.string().nullable(),
  exposureCheckedAt: z.string().nullable(),
  exposureError: z.string().nullable(),
  backendPort: z.number().int().nullable(),
  webPort: z.number().int().nullable(),
  databaseName: z.string().nullable(),
  databaseUser: z.string().nullable(),
  artifactRoot: z.string().nullable(),
  latestJobId: z.uuid().nullable(),
  latestJobStatus: provisionJobStatusSchema.nullable(),
  latestJobStep: z.string().nullable(),
  latestJobUpdatedAt: z.string().nullable(),
  latestJobError: z.string().nullable()
});

export type TenantRuntimeSummary = z.infer<typeof tenantRuntimeSummarySchema>;
export const tenantRuntimeSummaryListSchema = z.array(tenantRuntimeSummarySchema);

export const platformAuditLogSchema = z.object({
  id: z.uuid(),
  actorAdminId: z.uuid().nullable(),
  actorEmail: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  payloadJson: z.string(),
  createdAt: z.string()
});

export type PlatformAuditLog = z.infer<typeof platformAuditLogSchema>;
export const platformAuditLogListSchema = z.array(platformAuditLogSchema);

export const tenantProfileSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  displayName: z.string(),
  primaryDomain: z.string(),
  currencyCode: z.string().length(3)
});

export type TenantProfile = z.infer<typeof tenantProfileSchema>;

export const serviceTableSchema = z.object({
  id: z.uuid(),
  number: z.number().int(),
  name: z.string()
});

export type ServiceTable = z.infer<typeof serviceTableSchema>;
export const serviceTableListSchema = z.array(serviceTableSchema);

export const adminTableSummarySchema = z.object({
  id: z.uuid(),
  number: z.number().int().positive(),
  name: z.string(),
  serviceNote: z.string(),
  layoutCode: z.string(),
  layoutX: z.number().int(),
  layoutY: z.number().int(),
  isActive: z.boolean(),
  deviceOnline: z.boolean(),
  activeSessionCount: z.number().int().nonnegative(),
  submittedOrderCount: z.number().int().nonnegative(),
  preparingOrderCount: z.number().int().nonnegative(),
  readyOrderCount: z.number().int().nonnegative(),
  openBillId: z.uuid().nullable(),
  openBillSubtotalMinor: z.number().int().nonnegative(),
  openBillCurrencyCode: z.string().nullable(),
  updatedAt: z.string()
});

export type AdminTableSummary = z.infer<typeof adminTableSummarySchema>;
export const adminTableSummaryListSchema = z.array(adminTableSummarySchema);

export const serviceStationSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  colorHex: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean()
});

export type ServiceStation = z.infer<typeof serviceStationSchema>;
export const serviceStationListSchema = z.array(serviceStationSchema);

export const menuItemSummarySchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  stationId: z.uuid().nullable(),
  stationName: z.string().nullable(),
  priceMinor: z.number().int(),
  currencyCode: z.string().length(3),
  sortOrder: z.number().int()
});

export type MenuItemSummary = z.infer<typeof menuItemSummarySchema>;

export const menuCategorySummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  stationId: z.uuid().nullable(),
  stationName: z.string().nullable(),
  sortOrder: z.number().int(),
  items: z.array(menuItemSummarySchema)
});

export type MenuCategorySummary = z.infer<typeof menuCategorySummarySchema>;

export const tenantCatalogSchema = z.object({
  tenant: tenantProfileSchema,
  categories: z.array(menuCategorySummarySchema)
});

export type TenantCatalog = z.infer<typeof tenantCatalogSchema>;

export const deviceTokenSummarySchema = z.object({
  url: z.string(),
  ttlSeconds: z.number().int(),
  expiresAt: z.string()
});

export type DeviceTokenSummary = z.infer<typeof deviceTokenSummarySchema>;

export const deviceKeySummarySchema = z.object({
  id: z.uuid(),
  keyHint: z.string(),
  isActive: z.boolean(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string()
});

export type DeviceKeySummary = z.infer<typeof deviceKeySummarySchema>;

export const adminDeviceSchema = z.object({
  tableId: z.uuid(),
  tableNumber: z.number().int(),
  tableName: z.string(),
  tableIsActive: z.boolean(),
  deviceOnline: z.boolean(),
  activeKey: deviceKeySummarySchema.nullable(),
  activeToken: deviceTokenSummarySchema.nullable()
});

export type AdminDevice = z.infer<typeof adminDeviceSchema>;
export const adminDeviceListSchema = z.array(adminDeviceSchema);

export const rotateDeviceKeyResponseSchema = z.object({
  device: adminDeviceSchema,
  rawDeviceKey: z.string(),
  firmwareConfig: z.string()
});

export type RotateDeviceKeyResponse = z.infer<typeof rotateDeviceKeyResponseSchema>;

export const tenantAdminProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  createdAt: z.string(),
  mustChangePassword: z.boolean()
});

export type TenantAdminProfile = z.infer<typeof tenantAdminProfileSchema>;

export const tenantAdminBootstrapStatusSchema = z.object({
  bootstrapRequired: z.boolean(),
  suggestedAdminEmail: z.email().nullable()
});

export type TenantAdminBootstrapStatus = z.infer<typeof tenantAdminBootstrapStatusSchema>;

export const verifiedCustomerSessionSchema = z.object({
  sessionId: z.uuid(),
  sessionToken: z.string(),
  tableId: z.uuid(),
  tableNumber: z.number().int(),
  tableName: z.string(),
  tenantCode: z.string(),
  tenantDisplayName: z.string(),
  tenantPrimaryDomain: z.string(),
  sessionExpiresAt: z.string()
});

export type VerifiedCustomerSession = z.infer<typeof verifiedCustomerSessionSchema>;

export const customerSessionStatusSchema = z.object({
  sessionId: z.uuid(),
  tableId: z.uuid(),
  tableNumber: z.number().int(),
  tableName: z.string(),
  openedAt: z.string(),
  expiresAt: z.string(),
  lastSeenAt: z.string()
});

export type CustomerSessionStatus = z.infer<typeof customerSessionStatusSchema>;

export const customerOrderStatusSchema = z.enum([
  "pending",
  "submitted",
  "preparing",
  "ready",
  "served",
  "cancelled"
]);

export type CustomerOrderStatus = z.infer<typeof customerOrderStatusSchema>;

export const customerOrderSummarySchema = z.object({
  id: z.uuid(),
  billId: z.uuid().nullable(),
  tableId: z.uuid().nullable(),
  tableNumber: z.number().int().nullable(),
  tableName: z.string().nullable(),
  status: customerOrderStatusSchema,
  allowedNextStatuses: z.array(customerOrderStatusSchema),
  note: z.string(),
  subtotalMinor: z.number().int(),
  currencyCode: z.string().length(3),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(
    z.object({
      id: z.uuid(),
      menuItemId: z.uuid(),
      itemName: z.string(),
      status: customerOrderStatusSchema,
      quantity: z.number().int(),
      unitPriceMinor: z.number().int(),
      lineTotalMinor: z.number().int(),
      note: z.string()
    })
  )
});

export type CustomerOrderSummary = z.infer<typeof customerOrderSummarySchema>;
export const customerOrderSummaryListSchema = z.array(customerOrderSummarySchema);

export const customerBillStatusSchema = z.enum(["open", "closed"]);

export type CustomerBillStatus = z.infer<typeof customerBillStatusSchema>;

export const customerBillSummarySchema = z.object({
  id: z.uuid(),
  tableId: z.uuid(),
  tableNumber: z.number().int(),
  tableName: z.string(),
  status: customerBillStatusSchema,
  orderCount: z.number().int().nonnegative(),
  subtotalMinor: z.number().int(),
  currencyCode: z.string().length(3),
  openedAt: z.string(),
  closedAt: z.string().nullable(),
  updatedAt: z.string()
});

export type CustomerBillSummary = z.infer<typeof customerBillSummarySchema>;
export const customerBillSummaryListSchema = z.array(customerBillSummarySchema);

export const customerOrderItemSchema = z.object({
  id: z.uuid(),
  menuItemId: z.uuid(),
  itemName: z.string(),
  status: customerOrderStatusSchema,
  quantity: z.number().int(),
  unitPriceMinor: z.number().int(),
  lineTotalMinor: z.number().int(),
  note: z.string()
});

export type CustomerOrderItem = z.infer<typeof customerOrderItemSchema>;

export const customerOrderDetailSchema = z.object({
  id: z.uuid(),
  billId: z.uuid().nullable(),
  tableId: z.uuid().nullable(),
  tableNumber: z.number().int().nullable(),
  tableName: z.string().nullable(),
  status: customerOrderStatusSchema,
  note: z.string(),
  subtotalMinor: z.number().int(),
  currencyCode: z.string().length(3),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(customerOrderItemSchema)
});

export type CustomerOrderDetail = z.infer<typeof customerOrderDetailSchema>;

export const createAdminOrderItemInputSchema = z.object({
  menuItemId: z.uuid(),
  quantity: z.number().int().positive(),
  note: z.string()
});

export const createAdminOrderInputSchema = z.object({
  tableId: z.uuid(),
  note: z.string(),
  items: z.array(createAdminOrderItemInputSchema).min(1)
});

export type CreateAdminOrderInput = z.infer<typeof createAdminOrderInputSchema>;

export const kitchenTicketItemSchema = z.object({
  orderItemId: z.uuid(),
  orderId: z.uuid(),
  orderStatus: customerOrderStatusSchema,
  itemStatus: customerOrderStatusSchema,
  tableId: z.uuid().nullable(),
  tableNumber: z.number().int().nullable(),
  tableName: z.string().nullable(),
  menuItemId: z.uuid(),
  itemName: z.string(),
  quantity: z.number().int().positive(),
  itemNote: z.string(),
  orderNote: z.string(),
  createdAt: z.string()
});

export type KitchenTicketItem = z.infer<typeof kitchenTicketItemSchema>;

export const kitchenStationBoardSchema = z.object({
  stationId: z.uuid().nullable(),
  stationCode: z.string(),
  stationName: z.string(),
  colorHex: z.string(),
  items: z.array(kitchenTicketItemSchema)
});

export type KitchenStationBoard = z.infer<typeof kitchenStationBoardSchema>;
export const kitchenStationBoardListSchema = z.array(kitchenStationBoardSchema);

export const upsertMenuCategoryInputSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  stationId: z.uuid().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean()
});

export type UpsertMenuCategoryInput = z.infer<typeof upsertMenuCategoryInputSchema>;

export const upsertServiceStationInputSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sortOrder: z.number().int(),
  isActive: z.boolean()
});

export type UpsertServiceStationInput = z.infer<typeof upsertServiceStationInputSchema>;

export const upsertServiceTableInputSchema = z.object({
  number: z.number().int().positive(),
  name: z.string().trim().min(1),
  serviceNote: z.string().max(1200),
  layoutCode: z.string().trim().min(1).max(63),
  layoutX: z.number().int(),
  layoutY: z.number().int(),
  isActive: z.boolean()
});

export type UpsertServiceTableInput = z.infer<typeof upsertServiceTableInputSchema>;

export const updateTableLayoutEntrySchema = z.object({
  tableId: z.uuid(),
  layoutCode: z.string().trim().min(1).max(63),
  layoutX: z.number().int(),
  layoutY: z.number().int()
});

export type UpdateTableLayoutEntry = z.infer<typeof updateTableLayoutEntrySchema>;
export const updateTableLayoutEntryListSchema = z.array(updateTableLayoutEntrySchema);

export const moveBillInputSchema = z.object({
  targetTableId: z.uuid()
});

export type MoveBillInput = z.infer<typeof moveBillInputSchema>;

export const mergeBillInputSchema = z.object({
  sourceBillId: z.uuid()
});

export type MergeBillInput = z.infer<typeof mergeBillInputSchema>;

export const splitBillInputSchema = z.object({
  targetTableId: z.uuid(),
  orderIds: z.array(z.uuid()).min(1)
});

export type SplitBillInput = z.infer<typeof splitBillInputSchema>;

export const upsertMenuItemInputSchema = z.object({
  categoryId: z.uuid(),
  stationId: z.uuid().nullable(),
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string(),
  priceMinor: z.number().int().positive(),
  currencyCode: z.string().length(3),
  sortOrder: z.number().int(),
  isAvailable: z.boolean()
});

export type UpsertMenuItemInput = z.infer<typeof upsertMenuItemInputSchema>;
