import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createPlatformSessionToken, readPlatformSessionToken } from "./platform-session";

describe("platform session token", () => {
  it("round-trips a valid session token", () => {
    vi.stubEnv("PLATFORM_SESSION_SECRET", "test-session-secret");

    const { token } = createPlatformSessionToken({
      adminId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      email: "admin@example.com",
      role: "owner"
    });

    const session = readPlatformSessionToken(token);

    expect(session?.email).toBe("admin@example.com");
    vi.unstubAllEnvs();
  });

  it("rejects a tampered token", () => {
    vi.stubEnv("PLATFORM_SESSION_SECRET", "test-session-secret");

    const { token } = createPlatformSessionToken({
      adminId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
      email: "admin@example.com",
      role: "owner"
    });

    expect(readPlatformSessionToken(`${token}oops`)).toBeNull();
    vi.unstubAllEnvs();
  });

  it("rejects a signed token with malformed json", () => {
    vi.stubEnv("PLATFORM_SESSION_SECRET", "test-session-secret");

    const payload = Buffer.from("{not-json").toString("base64url");
    const signature = createHmac("sha256", "test-session-secret")
      .update(payload)
      .digest("base64url");

    expect(readPlatformSessionToken(`${payload}.${signature}`)).toBeNull();
    vi.unstubAllEnvs();
  });

  it("rejects a signed token with an invalid session shape", () => {
    vi.stubEnv("PLATFORM_SESSION_SECRET", "test-session-secret");

    const payload = Buffer.from(
      JSON.stringify({
        adminId: "018f6f12-37b6-7cc2-9d37-d49943f7b7a6",
        email: "admin@example.com",
        expiresAt: new Date(Date.now() + 60_000).toISOString()
      })
    ).toString("base64url");
    const signature = createHmac("sha256", "test-session-secret")
      .update(payload)
      .digest("base64url");

    expect(readPlatformSessionToken(`${payload}.${signature}`)).toBeNull();
    vi.unstubAllEnvs();
  });
});
