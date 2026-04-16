import { NextResponse } from "next/server";
import { createCustomerSessionToken, setCustomerSessionCookie } from "../../lib/customer-session";
import { verifyTableToken } from "../../lib/tenant-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
): Promise<Response> {
  const { token } = await context.params;

  try {
    const verified = await verifyTableToken(token);
    const { token: sessionToken, session } = createCustomerSessionToken({
      backendSessionId: verified.sessionId,
      backendSessionToken: verified.sessionToken,
      tableId: verified.tableId,
      tableNumber: verified.tableNumber,
      tableName: verified.tableName,
      tenantCode: verified.tenantCode,
      tenantDisplayName: verified.tenantDisplayName,
      tenantPrimaryDomain: verified.tenantPrimaryDomain,
      expiresAt: verified.sessionExpiresAt
    });

    await setCustomerSessionCookie(sessionToken, session.expiresAt);

    return NextResponse.redirect(new URL("/menu", request.url));
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
