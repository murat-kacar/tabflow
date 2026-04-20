"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "./i18n/server";
import { createTenant, updateTenantRegionalSettings, updateTenantStatus } from "./lib/platform-api";
import { updatePlatformAdminPreferences } from "./lib/platform-auth-api";
import {
  createPlatformSessionToken,
  getPlatformSession,
  setPlatformSessionCookie
} from "./lib/platform-session";

export type TenantActionState = {
  ok: boolean;
  message: string;
};

const initialErrorState: TenantActionState = {
  ok: false,
  message: ""
};

export async function createTenantAction(
  _previousState: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  const t = await getDictionary();

  try {
    const session = await getPlatformSession();

    if (!session) {
      throw new Error(t.messages.sessionMissing);
    }

    await createTenant(
      {
        code: String(formData.get("code") ?? ""),
        displayName: String(formData.get("displayName") ?? ""),
        primaryDomain: String(formData.get("primaryDomain") ?? ""),
        initialAdminEmail: null,
        languageCode: String(formData.get("languageCode") ?? "en") as "en" | "tr",
        currencyCode: String(formData.get("currencyCode") ?? "GBP") as
          | "GBP"
          | "TRY"
          | "EUR"
          | "USD",
        timeZone: String(formData.get("timeZone") ?? "Europe/London") as
          | "Europe/London"
          | "Europe/Istanbul"
          | "UTC"
      },
      session
    );
    revalidatePath("/");

    return {
      ok: true,
      message: t.messages.tenantCreated
    };
  } catch (error) {
    return {
      ...initialErrorState,
      message: error instanceof Error ? error.message : t.messages.tenantCreateFailed
    };
  }
}

export async function updateTenantRegionalSettingsAction(formData: FormData): Promise<void> {
  const session = await getPlatformSession();

  if (!session) {
    const t = await getDictionary();
    throw new Error(t.messages.sessionMissing);
  }

  await updateTenantRegionalSettings(
    String(formData.get("id") ?? ""),
    {
      languageCode: String(formData.get("languageCode") ?? "en") as "en" | "tr",
      currencyCode: String(formData.get("currencyCode") ?? "GBP") as "GBP" | "TRY" | "EUR" | "USD",
      timeZone: String(formData.get("timeZone") ?? "Europe/London") as
        | "Europe/London"
        | "Europe/Istanbul"
        | "UTC"
    },
    session
  );
  revalidatePath("/");
}

export async function updatePlatformLanguageAction(formData: FormData): Promise<void> {
  const session = await getPlatformSession();

  if (!session) {
    const t = await getDictionary();
    throw new Error(t.messages.sessionMissing);
  }

  const profile = await updatePlatformAdminPreferences(
    {
      languageCode: String(formData.get("locale") ?? "en") as "en" | "tr"
    },
    session
  );

  const { token, session: nextSession } = createPlatformSessionToken({
    adminId: profile.id,
    email: profile.email,
    languageCode: profile.languageCode,
    role: profile.role
  });

  await setPlatformSessionCookie(token, nextSession.expiresAt);
  revalidatePath("/", "layout");
}

export async function setTenantStatusAction(formData: FormData): Promise<void> {
  const session = await getPlatformSession();

  if (!session) {
    const t = await getDictionary();
    throw new Error(t.messages.sessionMissing);
  }

  await updateTenantStatus(
    String(formData.get("id") ?? ""),
    String(formData.get("status") ?? "suspended") as "active" | "suspended" | "archived",
    session
  );
  revalidatePath("/");
}
