import {
  type BootstrapStatus,
  bootstrapStatusSchema,
  type PlatformAdminProfile,
  platformAdminProfileSchema,
  platformProblemSchema
} from "@tabflow/shared-ts";

const defaultPlatformApiBaseUrl = "http://127.0.0.1:8200";

function platformApiBaseUrl(): string {
  return (
    process.env.PLATFORM_API_BASE_URL ??
    process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL ??
    defaultPlatformApiBaseUrl
  ).replace(/\/$/, "");
}

async function readProblem(response: Response): Promise<string> {
  const fallback = `Platform API returned ${response.status}`;

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

export async function getBootstrapStatus(): Promise<BootstrapStatus> {
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/auth/bootstrap-status`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return bootstrapStatusSchema.parse(await response.json());
}

export async function loginPlatformAdmin(input: {
  email: string;
  password: string;
}): Promise<PlatformAdminProfile> {
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/auth/login`, {
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

  return platformAdminProfileSchema.parse(await response.json());
}

export async function updatePlatformAdminPreferences(
  input: { languageCode: "en" | "tr" },
  session: {
    adminId: string;
    email: string;
    role: "viewer" | "admin" | "owner";
  }
): Promise<PlatformAdminProfile> {
  const apiKey = process.env.PLATFORM_ADMIN_API_KEY;
  const response = await fetch(`${platformApiBaseUrl()}/api/platform/auth/profile/preferences`, {
    method: "PATCH",
    headers: {
      ...(apiKey ? { "X-Platform-Admin-Key": apiKey } : {}),
      "Content-Type": "application/json",
      "X-Platform-Actor-Email": session.email,
      "X-Platform-Actor-Id": session.adminId,
      "X-Platform-Actor-Role": session.role
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await readProblem(response));
  }

  return platformAdminProfileSchema.parse(await response.json());
}
