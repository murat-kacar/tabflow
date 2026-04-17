"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { type TenantLoginActionState, tenantLoginAction } from "../auth-actions";

const initialState: TenantLoginActionState = {
  ok: false,
  message: ""
};

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function TenantLoginForm({
  bootstrapRequired,
  suggestedAdminEmail
}: {
  bootstrapRequired: boolean;
  suggestedAdminEmail: string | null;
}) {
  const [loginState, loginAction] = useActionState(tenantLoginAction, initialState);

  return (
    <div className="grid gap-6">
      <form
        action={loginAction}
        className="rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-xl backdrop-blur"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
          Tenant Admin
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-950">Isletme girisi</h1>
        <p className="mt-3 text-sm text-stone-600">
          Siparisleri, katalogu ve tenant ayarlarini yonetmek icin admin girisi yap.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Email
            <input
              autoComplete="email"
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Sifre
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
          <SubmitButton idleLabel="Giris yap" pendingLabel="Kontrol ediliyor..." />
          {loginState.message ? (
            <p className="text-sm font-medium text-red-700">{loginState.message}</p>
          ) : null}
        </div>
      </form>

      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
          Varsayilan Admin
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-amber-950">
          Tenant olusurken ilk admin otomatik hazirlanir
        </h2>
        <p className="mt-3 text-sm text-amber-900">
          Varsayilan sifre <span className="font-semibold">TabFlow123.</span> olarak atanir ve
          ilk giriste degistirilmesi zorunludur.
        </p>
        {suggestedAdminEmail ? (
          <p className="mt-2 text-sm text-amber-950">
            Varsayilan admin email: <span className="font-semibold">{suggestedAdminEmail}</span>
          </p>
        ) : null}
        {bootstrapRequired ? (
          <p className="mt-2 text-sm text-amber-950">
            Ilk admin olusumu bir sonraki tenant runtime baslangicinda otomatik tamamlanir.
          </p>
        ) : null}
      </div>
    </div>
  );
}
