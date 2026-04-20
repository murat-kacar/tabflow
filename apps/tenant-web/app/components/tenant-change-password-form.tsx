"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changeTenantPasswordAction, type TenantLoginActionState } from "../auth-actions";
import type { Dictionary } from "../i18n/server";

const initialState: TenantLoginActionState = {
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

export function TenantChangePasswordForm({ t }: { t: Dictionary["changePassword"] }) {
  const [state, formAction] = useActionState(changeTenantPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-stone-700">
        {t.currentPassword}
        <input
          autoComplete="current-password"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
          name="currentPassword"
          required
          type="password"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-700">
        {t.newPassword}
        <input
          autoComplete="new-password"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
          minLength={10}
          name="newPassword"
          required
          type="password"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-700">
        {t.confirmPassword}
        <input
          autoComplete="new-password"
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
          minLength={10}
          name="confirmPassword"
          required
          type="password"
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel={t.pending} submitLabel={t.submit} />
        {state.message ? <p className="text-sm font-medium text-red-700">{state.message}</p> : null}
      </div>
    </form>
  );
}
