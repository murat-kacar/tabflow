import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const customerSessionCookieName = "tabflow_customer_session";

export type CustomerSession = {
  backendSessionId: string;
  backendSessionToken: string;
  tableId: string;
  tableNumber: number;
  tableName: string;
  tenantCode: string;
  tenantDisplayName: string;
  tenantPrimaryDomain: string;
  expiresAt: string;
};

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

function isCustomerSession(value: unknown): value is CustomerSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<CustomerSession>;
  return (
    typeof session.backendSessionId === "string" &&
    typeof session.backendSessionToken === "string" &&
    typeof session.tableId === "string" &&
    typeof session.tableNumber === "number" &&
    typeof session.tableName === "string" &&
    typeof session.tenantCode === "string" &&
    typeof session.tenantDisplayName === "string" &&
    typeof session.tenantPrimaryDomain === "string" &&
    typeof session.expiresAt === "string"
  );
}

export function createCustomerSessionToken(
  input: Omit<CustomerSession, "expiresAt"> & {
    expiresAt: string;
  }
): {
  token: string;
  session: CustomerSession;
} {
  const session: CustomerSession = {
    ...input
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload);

  return {
    token: `${payload}.${signature}`,
    session
  };
}

export function readCustomerSessionToken(token: string): CustomerSession | null {
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

  if (!isCustomerSession(session)) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return session;
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(customerSessionCookieName)?.value;

  return token ? readCustomerSessionToken(token) : null;
}

export async function setCustomerSessionCookie(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(customerSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearCustomerSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(customerSessionCookieName);
}
