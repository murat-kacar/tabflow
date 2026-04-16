import {
  type CreateTenantInput,
  createTenantInputSchema,
  type PlatformAuditLog,
  type ProvisionJob,
  platformAuditLogListSchema,
  platformProblemSchema,
  provisionJobListSchema,
  type Tenant,
  type TenantRuntimeSummary,
  tenantListSchema,
  tenantRuntimeSummaryListSchema,
  tenantSchema,
  tenantStatusSchema
} from "@yenicafe/shared-ts";
import type { PlatformSession } from "./platform-session";

const defaultPlatformApiBaseUrl = "http://127.0.0.1:8200";

function platformApiBaseUrl(): string {
  return (
    process.env.PLATFORM_API_BASE_URL ??
    process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL ??
    defaultPlatformApiBaseUrl
  ).replace(/\/$/, "");
}

function platformApiHeaders(session: PlatformSession): HeadersInit {
  const apiKey = process.env.PLATFORM_ADMIN_API_KEY;

  return {
    ...(apiKey
      ? {
          "X-Platform-Admin-Key": apiKey
        }
      : {}),
    "X-Platform-Actor-Email": session.email,
    "X-Platform-Actor-Id": session.adminId,
    "X-Platform-Actor-Role": session.role
  };
}

async function readProblem(response: Response): Promise<string> {
  const fallback = `Platform API returned ${response.status}`;

  try {
    const payload: unknown = await response.json();
    const problem = platformProblemSchema.safeParse(payload);

    if (!problem.success) {
      return fallback;
    }

    if (problem.data.message) {
      return problem.data.message;
    }

    if (problem.data.detail) {
      return problem.data.detail;
    }

    if (problem.data.errors) {
      return Object.entries(problem.data.errors)
        .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
        .join(" ");
    }

    return problem.data.title ?? fallback;
  } catch {
    return fallback;
  }
}

export async function listTenants(session: PlatformSession): Promise<Tenant[]> {
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/tenants`, {
    cache: "no-store",
    headers: platformApiHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantListSchema.parse(await response.json());
}

export async function createTenant(
  input: CreateTenantInput,
  session: PlatformSession
): Promise<Tenant> {
  const payload = createTenantInputSchema.parse(input);
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/tenants`, {
    method: "POST",
    headers: {
      ...platformApiHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantSchema.parse(await response.json());
}

export async function updateTenantStatus(
  id: string,
  status: "active" | "suspended" | "archived",
  session: PlatformSession
): Promise<Tenant> {
  const parsedStatus = tenantStatusSchema.parse(status);
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/tenants/${id}/status`, {
    method: "PATCH",
    headers: {
      ...platformApiHeaders(session),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status: parsedStatus })
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantSchema.parse(await response.json());
}

export async function listProvisionJobs(session: PlatformSession): Promise<ProvisionJob[]> {
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/tenants/jobs`, {
    cache: "no-store",
    headers: platformApiHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return provisionJobListSchema.parse(await response.json());
}

export async function listAuditLogs(session: PlatformSession): Promise<PlatformAuditLog[]> {
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/tenants/audit`, {
    cache: "no-store",
    headers: platformApiHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return platformAuditLogListSchema.parse(await response.json());
}

export async function listTenantRuntimes(
  session: PlatformSession
): Promise<TenantRuntimeSummary[]> {
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/tenants/runtimes`, {
    cache: "no-store",
    headers: platformApiHeaders(session)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantRuntimeSummaryListSchema.parse(await response.json());
}
