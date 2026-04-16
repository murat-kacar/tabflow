"use client";

import type { CustomerBillSummary } from "@tabflow/shared-ts";
import { useActionState } from "react";
import { closeBillAction, type TenantAdminActionState } from "../auth-actions";
import { formatDateTime } from "../lib/format";

const initialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

function formatMoney(minor: number, currencyCode: string): string {
  return `${(minor / 100).toFixed(2)} ${currencyCode}`;
}

function BillCard({ bill }: { bill: CustomerBillSummary }) {
  const [state, action, pending] = useActionState(closeBillAction, initialState);

  return (
    <article className="rounded-2xl border border-stone-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-950">
            Masa {bill.tableNumber.toString().padStart(3, "0")}
          </h3>
          <p className="text-sm text-stone-600">{bill.tableName}</p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {bill.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-stone-600">
        <p>Tutar: {formatMoney(bill.subtotalMinor, bill.currencyCode)}</p>
        <p>Siparis sayisi: {bill.orderCount}</p>
        <p>Acilis: {formatDateTime(bill.openedAt)}</p>
        <p>Kapanis: {formatDateTime(bill.closedAt)}</p>
      </div>

      {bill.status === "open" ? (
        <form action={action} className="mt-4">
          <input name="billId" type="hidden" value={bill.id} />
          <button
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            disabled={pending}
            type="submit"
          >
            Hesabi kapat
          </button>
        </form>
      ) : null}

      {state.message ? (
        <p className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}
    </article>
  );
}

export function BillManager({ bills }: { bills: CustomerBillSummary[] }) {
  return (
    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Bills</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Acik ve kapanan hesaplar</h2>
      <div className="mt-5 grid gap-4">
        {bills.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Henuz hesap yok.
          </p>
        ) : (
          bills.map((bill) => <BillCard bill={bill} key={bill.id} />)
        )}
      </div>
    </section>
  );
}
