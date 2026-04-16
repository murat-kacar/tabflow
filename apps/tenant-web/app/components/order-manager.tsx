"use client";

import type { CustomerOrderSummary } from "@tabflow/shared-ts";
import { useActionState } from "react";
import { type TenantAdminActionState, updateOrderStatusAction } from "../auth-actions";
import { formatDateTime } from "../lib/format";

const initialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

function formatMoney(minor: number, currencyCode: string): string {
  return `${(minor / 100).toFixed(2)} ${currencyCode}`;
}

function statusTone(status: CustomerOrderSummary["status"]): string {
  switch (status) {
    case "submitted":
      return "bg-amber-100 text-amber-800";
    case "preparing":
      return "bg-sky-100 text-sky-800";
    case "ready":
      return "bg-emerald-100 text-emerald-800";
    case "served":
      return "bg-stone-200 text-stone-700";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function OrderCard({ order }: { order: CustomerOrderSummary }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, initialState);

  return (
    <article className="rounded-2xl border border-stone-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-stone-950">Siparis #{order.id.slice(0, 8)}</p>
          <p className="mt-1 text-sm text-stone-600">
            {order.tableNumber
              ? `Masa ${order.tableNumber.toString().padStart(3, "0")}`
              : "Masa yok"}
            {order.tableName ? ` • ${order.tableName}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-stone-600">
        <p>Tutar: {formatMoney(order.subtotalMinor, order.currencyCode)}</p>
        <p>Hesap: {order.billId ? `#${order.billId.slice(0, 8)}` : "Bagli degil"}</p>
        <p>Guncellendi: {formatDateTime(order.updatedAt)}</p>
      </div>

      {order.allowedNextStatuses.length > 0 ? (
        <form action={action} className="mt-4 flex flex-wrap gap-2">
          <input name="orderId" type="hidden" value={order.id} />
          {order.allowedNextStatuses.map((status) => (
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              disabled={pending}
              key={status}
              name="status"
              type="submit"
              value={status}
            >
              {status}
            </button>
          ))}
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

export function OrderManager({ orders }: { orders: CustomerOrderSummary[] }) {
  return (
    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Orders</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Siparis operasyon akisi</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Henuz siparis yok.
          </p>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}
