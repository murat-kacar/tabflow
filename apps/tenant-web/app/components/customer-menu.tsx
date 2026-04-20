"use client";

import type { TenantCatalog } from "@tabflow/shared-ts";
import { useActionState } from "react";
import {
  type CustomerOrderActionState,
  leaveCustomerSessionAction,
  submitCustomerOrderAction
} from "../customer-actions";
import type { Dictionary } from "../i18n/server";
import type { CustomerSession } from "../lib/customer-session";
import { formatMoney } from "../lib/format";

const initialState: CustomerOrderActionState = {
  ok: false,
  message: ""
};

export function CustomerMenu({
  catalog,
  session,
  t
}: {
  catalog: TenantCatalog;
  session: CustomerSession;
  t: Dictionary["customerMenu"];
}) {
  const [orderState, submitAction, pending] = useActionState(
    submitCustomerOrderAction,
    initialState
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#efe2c4,transparent_28rem),linear-gradient(135deg,#f8f5ed,#e5ece7)] px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
                {session.tenantDisplayName}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                {t.title} {session.tableNumber.toString().padStart(3, "0")}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-stone-700">
                {t.bodyPrefix} {session.tableName}.
              </p>
            </div>
            <form action={leaveCustomerSessionAction}>
              <button
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
                type="submit"
              >
                {t.leaveSession}
              </button>
            </form>
          </div>
        </div>

        <form action={submitAction} className="mt-8 grid gap-6">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.orderEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{t.chooseItems}</h2>
            <div className="mt-5 space-y-6">
              {catalog.categories.map((category) => (
                <article className="rounded-2xl border border-stone-200 p-4" key={category.id}>
                  <h3 className="text-xl font-semibold text-stone-950">{category.name}</h3>
                  <div className="mt-4 grid gap-3">
                    {category.items.map((item) => (
                      <div
                        className="grid gap-3 rounded-2xl bg-stone-50 p-4 lg:grid-cols-[1fr_8rem_8rem]"
                        key={item.id}
                      >
                        <div>
                          <p className="font-semibold text-stone-900">{item.name}</p>
                          <p className="mt-1 text-sm text-stone-600">{item.description}</p>
                          <p className="mt-2 text-sm font-semibold text-stone-700">
                            {formatMoney(item.priceMinor, item.currencyCode)}
                          </p>
                        </div>
                        <input
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950"
                          defaultValue={0}
                          min={0}
                          name={`qty-${item.id}`}
                          type="number"
                        />
                        <input
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950"
                          name={`note-${item.id}`}
                          placeholder={t.notePlaceholder}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <label className="block">
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                {t.generalNote}
              </span>
              <textarea
                className="mt-3 min-h-28 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
                name="orderNote"
                placeholder={t.generalNotePlaceholder}
              />
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white"
                disabled={pending}
                type="submit"
              >
                {t.sendOrder}
              </button>
              {orderState.message ? (
                <p className={`text-sm ${orderState.ok ? "text-emerald-700" : "text-rose-700"}`}>
                  {orderState.message}
                </p>
              ) : null}
            </div>
          </section>
        </form>
      </section>
    </main>
  );
}
