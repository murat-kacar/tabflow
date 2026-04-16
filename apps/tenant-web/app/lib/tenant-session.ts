import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const tenantSessionCookieName = "tabflow_tenant_admin_session";

export type TenantSession = {
  adminId: string;
  email: string;
  expiresAt: string;
};

const sessionDurationMs = 1000 * 60 * 60 * 12;

function sessionSecret(): string {
  const secret = process.env.TENANT_SESSION_SECRET;

  if (!secret) {
    throw new Error("TENANT_SESSION_SECRET is not configured.");
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function isTenantSession(value: unknown): value is TenantSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<TenantSession>;
  return (
    typeof session.adminId === "string" &&
    typeof session.email === "string" &&
    typeof session.expiresAt === "string"
  );
}

export function createTenantSessionToken(input: { adminId: string; email: string }): {
  token: string;
  session: TenantSession;
} {
  const session: TenantSession = {
    adminId: input.adminId,
    email: input.email,
    expiresAt: new Date(Date.now() + sessionDurationMs).toISOString()
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload);

  return {
    token: `${payload}.${signature}`,
    session
  };
}

export function readTenantSessionToken(token: string): TenantSession | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  let session: unknown;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!isTenantSession(session)) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return session;
}

export async function getTenantSession(): Promise<TenantSession | null> {
  const store = await cookies();
  const token = store.get(tenantSessionCookieName)?.value;

  return token ? readTenantSessionToken(token) : null;
}

export async function setTenantSessionCookie(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(tenantSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearTenantSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(tenantSessionCookieName);
}
