"use server";

import { redirect } from "next/navigation";
import { getDictionary } from "./i18n/server";
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
      languageCode: profile.languageCode,
      role: profile.role
    });

    await setPlatformSessionCookie(token, session.expiresAt);
  } catch (error) {
    const t = await getDictionary();
    return {
      ok: false,
      message: error instanceof Error ? error.message : t.messages.loginFailed
    };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await clearPlatformSessionCookie();
  redirect("/login");
}
