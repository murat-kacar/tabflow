import { describe, expect, it } from "vitest";
import {
  adminDeviceSchema,
  adminTableSummarySchema,
  bootstrapStatusSchema,
  createAdminOrderInputSchema,
  createTenantInputSchema,
  customerBillSummarySchema,
  customerOrderDetailSchema,
  customerOrderSummarySchema,
  customerSessionStatusSchema,
  deviceTokenSummarySchema,
  healthResponseSchema,
  kitchenStationBoardSchema,
  platformAdminProfileSchema,
  platformAuditLogSchema,
  provisionJobSchema,
  rotateDeviceKeyResponseSchema,
  serviceStationSchema,
  serviceTableSchema,
  tenantAdminBootstrapStatusSchema,
  tenantAdminProfileSchema,
  tenantCatalogSchema,
  tenantProfileSchema,
  tenantRuntimeSummarySchema,
  tenantSchema,
  upsertMenuCategoryInputSchema,
  upsertMenuItemInputSchema,
  upsertServiceStationInputSchema,
  upsertServiceTableInputSchema,
  verifiedCustomerSessionSchema
} from "./index";

describe("healthResponseSchema", () => {
  it("accepts a valid health response", () => {
    const parsed = healthResponseSchema.parse({
      status: "ok",
      service: "platform-api",
      time: "2026-04-15T00:00:00.000Z",
      environment: "Testing"
    });

    expect(parsed.service).toBe("platform-api");
  });

  it("rejects missing service metadata", () => {
    expect(() => healthResponseSchema.parse({ status: "ok" })).toThrow();
  });
});

describe("tenantSchema", () => {
  it("accepts a valid platform tenant response", () => {
    const tenant = tenantSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      code: "moda",
      displayName: "Moda Cafe",
      initialAdminEmail: "admin@moda.example.com",
      status: "provisioning",
      primaryDomain: "moda.example.com",
      createdAt: "2026-04-15T00:00:00.000Z",
      updatedAt: "2026-04-15T00:00:00.000Z"
    });

    expect(tenant.code).toBe("moda");
  });
});

describe("createTenantInputSchema", () => {
  it("normalizes tenant domains", () => {
    const input = createTenantInputSchema.parse({
      code: "moda",
      displayName: "Moda Cafe",
      primaryDomain: "MODA.EXAMPLE.COM.",
      initialAdminEmail: "ADMIN@MODA.EXAMPLE.COM"
    });

    expect(input.primaryDomain).toBe("moda.example.com");
    expect(input.initialAdminEmail).toBe("ADMIN@MODA.EXAMPLE.COM");
  });

  it("rejects unsafe tenant codes", () => {
    expect(() =>
      createTenantInputSchema.parse({
        code: "Moda Cafe",
        displayName: "Moda Cafe",
        primaryDomain: "moda.example.com"
      })
    ).toThrow();
  });
});

describe("platform auth schemas", () => {
  it("accepts a platform admin profile response", () => {
    const profile = platformAdminProfileSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      email: "admin@example.com",
      role: "owner",
      createdAt: "2026-04-15T00:00:00.000Z"
    });

    expect(profile.email).toBe("admin@example.com");
  });

  it("accepts bootstrap status response", () => {
    const status = bootstrapStatusSchema.parse({
      bootstrapRequired: true
    });

    expect(status.bootstrapRequired).toBe(true);
  });

  it("accepts a provision job response", () => {
    const job = provisionJobSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      tenantId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a7",
      type: "tenant.create",
      status: "running",
      attemptCount: 1,
      currentStep: "writing_artifacts",
      payloadJson: "{}",
      resultJson: "{}",
      errorMessage: null,
      createdAt: "2026-04-15T00:00:00.000Z",
      startedAt: "2026-04-15T00:00:01.000Z",
      completedAt: null,
      updatedAt: "2026-04-15T00:00:02.000Z"
    });

    expect(job.status).toBe("running");
  });

  it("accepts a tenant runtime summary response", () => {
    const runtime = tenantRuntimeSummarySchema.parse({
      tenantId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      tenantCode: "moda",
      baseUrl: "https://moda.example.com",
      healthStatus: "healthy",
      healthUrl: "https://moda.example.com/health",
      healthCheckedAt: "2026-04-15T00:02:00.000Z",
      exposureStatus: "healthy",
      exposureUrl: "https://moda.example.com/health",
      exposureCheckedAt: "2026-04-15T00:02:10.000Z",
      exposureError: null,
      backendPort: 8101,
      webPort: 3101,
      databaseName: "tabflow_tenant_moda",
      databaseUser: "tabflow_moda",
      artifactRoot: "/srv/generated/tenants/moda",
      latestJobId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a8",
      latestJobStatus: "succeeded",
      latestJobStep: "completed",
      latestJobUpdatedAt: "2026-04-15T00:03:00.000Z",
      latestJobError: null
    });

    expect(runtime.healthStatus).toBe("healthy");
  });

  it("accepts an audit log response", () => {
    const log = platformAuditLogSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      actorAdminId: null,
      actorEmail: "system",
      action: "tenant.create_requested",
      entityType: "tenant",
      entityId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      payloadJson: "{}",
      createdAt: "2026-04-15T00:00:02.000Z"
    });

    expect(log.actorEmail).toBe("system");
  });
});

describe("tenant runtime schemas", () => {
  it("accepts a tenant profile response", () => {
    const profile = tenantProfileSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      code: "moda",
      displayName: "Moda Cafe",
      primaryDomain: "moda.example.com",
      currencyCode: "GBP"
    });

    expect(profile.code).toBe("moda");
  });

  it("accepts a catalog response", () => {
    const catalog = tenantCatalogSchema.parse({
      tenant: {
        id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
        code: "moda",
        displayName: "Moda Cafe",
        primaryDomain: "moda.example.com",
        currencyCode: "GBP"
      },
      categories: [
        {
          id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a7",
          slug: "hot-drinks",
          name: "Hot Drinks",
          stationId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
          stationName: "Bar",
          sortOrder: 10,
          items: [
            {
              id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a8",
              sku: "espresso",
              name: "Espresso",
              description: "Single shot",
              stationId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
              stationName: "Bar",
              priceMinor: 900,
              currencyCode: "GBP",
              sortOrder: 10
            }
          ]
        }
      ]
    });

    expect(catalog.categories).toHaveLength(1);
  });

  it("accepts a service table response", () => {
    const table = serviceTableSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a9",
      number: 1,
      name: "Masa 001"
    });

    expect(table.number).toBe(1);
  });

  it("accepts an admin table summary response", () => {
    const summary = adminTableSummarySchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7b0",
      number: 4,
      name: "Bahce 4",
      serviceNote: "Alerji notu sorulsun",
      layoutCode: "balkon",
      layoutX: 24,
      layoutY: 18,
      isActive: true,
      deviceOnline: true,
      activeSessionCount: 1,
      submittedOrderCount: 1,
      preparingOrderCount: 2,
      readyOrderCount: 0,
      openBillId: "018f6f12-37b6-7cc2-9d37-d49943f7b7b1",
      openBillSubtotalMinor: 4200,
      openBillCurrencyCode: "GBP",
      updatedAt: "2026-04-15T00:01:00.000Z"
    });

    expect(summary.openBillSubtotalMinor).toBe(4200);
  });

  it("accepts a tenant admin auth response", () => {
    const profile = tenantAdminProfileSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7aa",
      email: "admin@moda.example.com",
      createdAt: "2026-04-15T00:00:00.000Z",
      mustChangePassword: true
    });
    const status = tenantAdminBootstrapStatusSchema.parse({
      bootstrapRequired: true,
      suggestedAdminEmail: "admin@moda.example.com"
    });

    expect(profile.email).toContain("@");
    expect(profile.mustChangePassword).toBe(true);
    expect(status.bootstrapRequired).toBe(true);
  });

  it("accepts customer order responses", () => {
    const summary = customerOrderSummarySchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7ab",
      billId: "018f6f12-37b6-7cc2-9d37-d49943f7b7af",
      tableId: null,
      tableNumber: null,
      tableName: null,
      status: "submitted",
      allowedNextStatuses: ["preparing", "cancelled"],
      note: "No sugar",
      subtotalMinor: 3000,
      currencyCode: "GBP",
      createdAt: "2026-04-15T00:00:00.000Z",
      updatedAt: "2026-04-15T00:01:00.000Z",
      items: [
        {
          id: "018f6f12-37b6-7cc2-9d37-d49943f7b7ac",
          menuItemId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ad",
          itemName: "Latte",
          status: "submitted",
          quantity: 2,
          unitPriceMinor: 900,
          lineTotalMinor: 1800,
          note: ""
        }
      ]
    });
    const detail = customerOrderDetailSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7ab",
      billId: "018f6f12-37b6-7cc2-9d37-d49943f7b7af",
      tableId: null,
      tableNumber: null,
      tableName: null,
      status: "submitted",
      note: "No sugar",
      subtotalMinor: 3000,
      currencyCode: "GBP",
      createdAt: "2026-04-15T00:00:00.000Z",
      updatedAt: "2026-04-15T00:01:00.000Z",
      items: [
        {
          id: "018f6f12-37b6-7cc2-9d37-d49943f7b7ac",
          menuItemId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ad",
          itemName: "Latte",
          status: "submitted",
          quantity: 2,
          unitPriceMinor: 900,
          lineTotalMinor: 1800,
          note: ""
        }
      ]
    });

    expect(summary.status).toBe("submitted");
    expect(summary.items[0]?.itemName).toBe("Latte");
    expect(detail.items).toHaveLength(1);
  });

  it("accepts admin-created PDA order input", () => {
    const input = createAdminOrderInputSchema.parse({
      tableId: "018f6f12-37b6-7cc2-9d37-d49943f7b7aa",
      note: "Once icecekler",
      items: [
        {
          menuItemId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ad",
          quantity: 2,
          note: "Az sekerli"
        }
      ]
    });

    expect(input.items[0]?.quantity).toBe(2);
  });

  it("accepts customer bill summaries", () => {
    const bill = customerBillSummarySchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7af",
      tableId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ab",
      tableNumber: 4,
      tableName: "Masa 004",
      status: "open",
      orderCount: 3,
      subtotalMinor: 3000,
      currencyCode: "GBP",
      openedAt: "2026-04-15T00:00:00.000Z",
      closedAt: null,
      updatedAt: "2026-04-15T00:03:00.000Z"
    });

    expect(bill.status).toBe("open");
  });

  it("accepts verified customer session payloads", () => {
    const session = verifiedCustomerSessionSchema.parse({
      sessionId: "018f6f12-37b6-7cc2-9d37-d49943f7b7af",
      sessionToken: "abc123",
      tableId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ab",
      tableNumber: 4,
      tableName: "Masa 004",
      tenantCode: "moda",
      tenantDisplayName: "Moda Cafe",
      tenantPrimaryDomain: "moda.example.com",
      sessionExpiresAt: "2026-04-15T00:01:00.000Z"
    });

    expect(session.tableNumber).toBe(4);
  });

  it("accepts customer session status payloads", () => {
    const session = customerSessionStatusSchema.parse({
      sessionId: "018f6f12-37b6-7cc2-9d37-d49943f7b7af",
      tableId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ab",
      tableNumber: 4,
      tableName: "Masa 004",
      openedAt: "2026-04-15T00:00:00.000Z",
      expiresAt: "2026-04-15T02:00:00.000Z",
      lastSeenAt: "2026-04-15T00:10:00.000Z"
    });

    expect(session.tableName).toContain("Masa");
  });

  it("accepts tenant catalog upsert payloads", () => {
    const category = upsertMenuCategoryInputSchema.parse({
      slug: "hot-drinks",
      name: "Hot Drinks",
      stationId: null,
      sortOrder: 10,
      isActive: true
    });
    const item = upsertMenuItemInputSchema.parse({
      categoryId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      stationId: null,
      sku: "latte",
      name: "Latte",
      description: "Velvety milk",
      priceMinor: 1200,
      currencyCode: "GBP",
      sortOrder: 20,
      isAvailable: true
    });

    expect(category.slug).toBe("hot-drinks");
    expect(item.sku).toBe("latte");
  });

  it("accepts service table upsert payloads", () => {
    const table = upsertServiceTableInputSchema.parse({
      number: 12,
      name: "Teras 12",
      serviceNote: "Mum servisi acilis sonrasi",
      layoutCode: "balkon",
      layoutX: 22,
      layoutY: 14,
      isActive: false
    });

    expect(table.number).toBe(12);
  });

  it("accepts service station payloads", () => {
    const station = serviceStationSchema.parse({
      id: "018f6f12-37b6-7cc2-9d37-d49943f7b7c0",
      code: "bar",
      name: "Bar",
      colorHex: "#2563eb",
      sortOrder: 10,
      isActive: true
    });
    const upsert = upsertServiceStationInputSchema.parse({
      code: "dessert",
      name: "Tatli",
      colorHex: "#db2777",
      sortOrder: 20,
      isActive: true
    });

    expect(station.code).toBe("bar");
    expect(upsert.colorHex).toBe("#db2777");
  });

  it("accepts kitchen board payloads", () => {
    const board = kitchenStationBoardSchema.parse({
      stationId: "018f6f12-37b6-7cc2-9d37-d49943f7b7c0",
      stationCode: "bar",
      stationName: "Bar",
      colorHex: "#2563eb",
      items: [
        {
          orderItemId: "018f6f12-37b6-7cc2-9d37-d49943f7b7c1",
          orderId: "018f6f12-37b6-7cc2-9d37-d49943f7b7c2",
          orderStatus: "preparing",
          itemStatus: "preparing",
          tableId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ab",
          tableNumber: 4,
          tableName: "Masa 004",
          menuItemId: "018f6f12-37b6-7cc2-9d37-d49943f7b7ad",
          itemName: "Latte",
          quantity: 2,
          itemNote: "Sicak",
          orderNote: "Acele",
          createdAt: "2026-04-15T00:00:00.000Z"
        }
      ]
    });

    expect(board.items[0]?.itemName).toBe("Latte");
  });

  it("accepts tenant device management payloads", () => {
    const token = deviceTokenSummarySchema.parse({
      url: "https://moda.example.com/g/F6F83B6A11653E",
      ttlSeconds: 60,
      expiresAt: "2026-04-15T00:01:00.000Z"
    });
    const device = adminDeviceSchema.parse({
      tableId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      tableNumber: 1,
      tableName: "Masa 001",
      tableIsActive: true,
      deviceOnline: true,
      activeKey: {
        id: "018f6f12-37b6-7cc2-9d37-d49943f7b7aa",
        keyHint: "ab12cd34-masa001",
        isActive: true,
        lastSeenAt: "2026-04-15T00:00:00.000Z",
        createdAt: "2026-04-15T00:00:00.000Z"
      },
      activeToken: token
    });
    const rotated = rotateDeviceKeyResponseSchema.parse({
      device,
      rawDeviceKey: "a1b2c3d4e5f6-masa001",
      firmwareConfig: "#pragma once"
    });

    expect(rotated.device.deviceOnline).toBe(true);
    expect(rotated.rawDeviceKey).toContain("masa001");
  });
});
