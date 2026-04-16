import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TenantDashboard } from "./components/tenant-dashboard";

describe("TenantDashboard", () => {
  it("renders the tenant registry empty state", () => {
    render(
      <TenantDashboard
        auditLogs={[]}
        jobs={[]}
        runtimes={[]}
        session={{
          adminId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
          email: "admin@example.com",
          role: "owner",
          expiresAt: "2026-04-15T01:00:00.000Z"
        }}
        tenants={[]}
      />
    );

    expect(screen.getByRole("heading", { name: "TabFlow Super Admin" })).toBeInTheDocument();
    expect(screen.getByText(/henuz tenant yok/i)).toBeInTheDocument();
  });

  it("renders tenant rows", () => {
    render(
      <TenantDashboard
        auditLogs={[]}
        jobs={[]}
        runtimes={[
          {
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
          }
        ]}
        session={{
          adminId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
          email: "admin@example.com",
          role: "owner",
          expiresAt: "2026-04-15T01:00:00.000Z"
        }}
        tenants={[
          {
            id: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
            code: "moda",
            displayName: "Moda Cafe",
            initialAdminEmail: "admin@moda.example.com",
            status: "active",
            primaryDomain: "moda.example.com",
            createdAt: "2026-04-15T00:00:00.000Z",
            updatedAt: "2026-04-15T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(screen.getAllByText("Moda Cafe").length).toBeGreaterThan(0);
    expect(screen.getByText("moda.example.com")).toBeInTheDocument();
    expect(screen.getByText(/runtime gorunurlugu/i)).toBeInTheDocument();
  });
});
