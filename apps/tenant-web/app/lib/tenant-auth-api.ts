import {
  platformProblemSchema,
  type TenantAdminBootstrapStatus,
  type TenantAdminProfile,
  tenantAdminBootstrapStatusSchema,
  tenantAdminProfileSchema
} from "@tabflow/shared-ts";

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

export async function getTenantBootstrapStatus(): Promise<TenantAdminBootstrapStatus> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/bootstrap-status`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantAdminBootstrapStatusSchema.parse(await response.json());
}

export async function bootstrapTenantAdmin(input: {
  email: string;
  password: string;
}): Promise<TenantAdminProfile> {
  const bootstrapToken = process.env.TENANT_BOOTSTRAP_TOKEN;
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/bootstrap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bootstrapToken ? { "X-Tenant-Bootstrap-Token": bootstrapToken } : {})
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return tenantAdminProfileSchema.parse(await response.json());
}

export async function loginTenantAdmin(input: {
  email: string;
  password: string;
}): Promise<TenantAdminProfile> {
  const response = await fetch(`${tenantApiBaseUrl()}/api/admin/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Email veya sifre hatali.");
    }

    throw new Error(await readProblem(response));
  }

  return tenantAdminProfileSchema.parse(await response.json());
}
