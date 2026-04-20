"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTenantAction, type TenantActionState } from "../actions";
import type { Dictionary } from "../i18n/server";

const initialState: TenantActionState = {
  ok: false,
  message: ""
};

function SubmitButton({
  pendingLabel,
  submitLabel
}: {
  pendingLabel: string;
  submitLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : submitLabel}
    </button>
  );
}

export function CreateTenantForm({
  canManage,
  t
}: {
  canManage: boolean;
  t: Dictionary["createTenant"];
}) {
  const [state, formAction] = useActionState(createTenantAction, initialState);

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
          {t.eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">{t.title}</h2>
        <p className="mt-2 text-sm text-stone-600">
          {t.bodyPrefix} <span className="font-semibold">admin@&lt;tenant-code&gt;.tabflow.uk</span>{" "}
          {t.bodySuffix}
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.code}
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="code"
            placeholder={t.codePlaceholder}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.displayName}
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="displayName"
            placeholder={t.displayNamePlaceholder}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.primaryDomain}
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="primaryDomain"
            placeholder={t.primaryDomainPlaceholder}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.language}
          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="languageCode"
            required
          >
            <option value="en">{t.languages.en}</option>
            <option value="tr">{t.languages.tr}</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.currency}
          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="currencyCode"
            required
          >
            <option value="GBP">GBP</option>
            <option value="TRY">TRY</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.timeZone}
          <select
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="timeZone"
            required
          >
            <option value="Europe/London">Europe/London</option>
            <option value="Europe/Istanbul">Europe/Istanbul</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {canManage ? (
          <SubmitButton pendingLabel={t.pending} submitLabel={t.submit} />
        ) : (
          <p className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600">
            {t.viewerBlocked}
          </p>
        )}
        {state.message ? (
          <p
            className={
              state.ok ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-red-700"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
