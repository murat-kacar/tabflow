import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const platformSessionCookieName = "tabflow_platform_session";

export type PlatformSession = {
  adminId: string;
  email: string;
  languageCode: "en" | "tr";
  role: "viewer" | "admin" | "owner";
  expiresAt: string;
};

const sessionDurationMs = 1000 * 60 * 60 * 12;

function sessionSecret(): string {
  const secret = process.env.PLATFORM_SESSION_SECRET;

  if (!secret) {
    throw new Error("PLATFORM_SESSION_SECRET is not configured.");
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function isPlatformSession(value: unknown): value is PlatformSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<PlatformSession>;
  return (
    typeof session.adminId === "string" &&
    typeof session.email === "string" &&
    (session.languageCode === "en" || session.languageCode === "tr") &&
    (session.role === "viewer" || session.role === "admin" || session.role === "owner") &&
    typeof session.expiresAt === "string"
  );
}

export function createPlatformSessionToken(input: {
  adminId: string;
  email: string;
  languageCode: "en" | "tr";
  role: "viewer" | "admin" | "owner";
}): {
  token: string;
  session: PlatformSession;
} {
  const session: PlatformSession = {
    adminId: input.adminId,
    email: input.email,
    languageCode: input.languageCode,
    role: input.role,
    expiresAt: new Date(Date.now() + sessionDurationMs).toISOString()
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload);

  return {
    token: `${payload}.${signature}`,
    session
  };
}

export function readPlatformSessionToken(token: string): PlatformSession | null {
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

  if (!isPlatformSession(session)) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return session;
}

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const store = await cookies();
  const token = store.get(platformSessionCookieName)?.value;

  return token ? readPlatformSessionToken(token) : null;
}

export async function setPlatformSessionCookie(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(platformSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearPlatformSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(platformSessionCookieName);
}
