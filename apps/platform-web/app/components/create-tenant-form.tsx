"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTenantAction, type TenantActionState } from "../actions";

const initialState: TenantActionState = {
  ok: false,
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Olusturuluyor..." : "Tenant olustur"}
    </button>
  );
}

export function CreateTenantForm({ canManage }: { canManage: boolean }) {
  const [state, formAction] = useActionState(createTenantAction, initialState);

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
          Yeni Tenant
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">Isletme olustur</h2>
        <p className="mt-2 text-sm text-stone-600">
          Bu adim tenant kaydini rezerve eder ve provisioning job olusturur. Container, TLS ve
          firmware uretimi sonraki worker adiminda calisacak. Ilk admin e-postasi otomatik
          olarak <span className="font-semibold">admin@&lt;tenant-kodu&gt;.tabflow.uk</span>
          seklinde atanir.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Tenant kodu
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="code"
            placeholder="moda"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Gorunen ad
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="displayName"
            placeholder="Moda Cafe"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Primary domain
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white"
            name="primaryDomain"
            placeholder="demo.example.com"
            required
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {canManage ? (
          <SubmitButton />
        ) : (
          <p className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-600">
            Viewer rolu tenant olusturamaz.
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
