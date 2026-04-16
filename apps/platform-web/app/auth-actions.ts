"use server";

import { redirect } from "next/navigation";
import { loginPlatformAdmin } from "./lib/platform-auth-api";
import {
  clearPlatformSessionCookie,
  createPlatformSessionToken,
  setPlatformSessionCookie
} from "./lib/platform-session";

export type LoginActionState = {
  ok: boolean;
  message: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  try {
    const profile = await loginPlatformAdmin({
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password: String(formData.get("password") ?? "")
    });

    const { token, session } = createPlatformSessionToken({
      adminId: profile.id,
      email: profile.email,
      role: profile.role
    });

    await setPlatformSessionCookie(token, session.expiresAt);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Giris yapilamadi."
    };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearPlatformSessionCookie();
  redirect("/login");
}
