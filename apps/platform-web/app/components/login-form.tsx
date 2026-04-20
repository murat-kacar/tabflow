"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type LoginActionState, loginAction } from "../auth-actions";
import type { Dictionary } from "../i18n/server";

const initialState: LoginActionState = {
  ok: false,
  message: ""
};

function LoginButton({ pendingLabel, submitLabel }: { pendingLabel: string; submitLabel: string }) {
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

export function LoginForm({ bootstrapRequired, t }: { bootstrapRequired: boolean; t: Dictionary }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form
      action={formAction}
      className="rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-xl backdrop-blur"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
        {t.login.formEyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{t.login.formTitle}</h1>
      <p className="mt-3 text-sm text-stone-600">{t.login.formBody}</p>

      {bootstrapRequired ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.login.bootstrapNotice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.common.email}
          <input
            autoComplete="email"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="email"
            placeholder={t.login.emailPlaceholder}
            required
            type="email"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          {t.common.password}
          <input
            autoComplete="current-password"
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="password"
            required
            type="password"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <LoginButton pendingLabel={t.login.pending} submitLabel={t.login.submit} />
        {state.message ? <p className="text-sm font-medium text-red-700">{state.message}</p> : null}
      </div>
    </form>
  );
}
