"use client";

import type { KitchenStationBoard } from "@yenicafe/shared-ts";
import { useActionState } from "react";
import { type TenantAdminActionState, updateKitchenItemStatusAction } from "../auth-actions";

const initialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

function KitchenCard({ item }: { item: KitchenStationBoard["items"][number] }) {
  const [state, action, pending] = useActionState(updateKitchenItemStatusAction, initialState);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {item.tableNumber ? `Masa ${item.tableNumber.toString().padStart(3, "0")}` : "Masa yok"}
          </p>
          <p className="text-xs text-stone-300">Siparis #{item.orderId.slice(0, 8)}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-100">
          {item.itemStatus}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-lg font-bold text-white">
          {item.quantity}x {item.itemName}
        </p>
        {item.itemNote ? <p className="mt-1 text-sm text-amber-200">Not: {item.itemNote}</p> : null}
        {item.orderNote ? (
          <p className="mt-1 text-sm text-stone-300">Siparis notu: {item.orderNote}</p>
        ) : null}
      </div>

      <form action={action} className="mt-4 flex flex-wrap gap-2">
        <input name="orderItemId" type="hidden" value={item.orderItemId} />
        {item.itemStatus === "submitted" ? (
          <button
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
            disabled={pending}
            name="status"
            type="submit"
            value="preparing"
          >
            Hazirlamaya al
          </button>
        ) : null}
        {item.itemStatus === "preparing" ? (
          <button
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            disabled={pending}
            name="status"
            type="submit"
            value="ready"
          >
            Hazir yap
          </button>
        ) : null}
        {item.itemStatus === "ready" ? (
          <button
            className="rounded-full border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-100"
            disabled={pending}
            name="status"
            type="submit"
            value="preparing"
          >
            Tekrar hazirla
          </button>
        ) : null}
        {item.itemStatus !== "ready" ? (
          <button
            className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-200"
            disabled={pending}
            name="status"
            type="submit"
            value="cancelled"
          >
            Iptal
          </button>
        ) : null}
      </form>
      {state.message ? (
        <p className={`mt-3 text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      ) : null}
    </article>
  );
}

export function KitchenBoard({ boards }: { boards: KitchenStationBoard[] }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#101817,#1c2725)] px-6 py-8 text-white">
      <section className="mx-auto max-w-[1600px]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Kitchen
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Istasyon bazli mutfak ekrani</h1>
        </div>

        <section className="mt-8 grid gap-5 xl:grid-cols-3">
          {boards.map((board) => (
            <section
              className="rounded-[2rem] border border-white/10 p-5 shadow-sm"
              key={board.stationCode}
              style={{ backgroundColor: `${board.colorHex}22` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: board.colorHex }}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-300">
                    {board.stationCode}
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">{board.stationName}</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {board.items.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-stone-300">
                    Bu istasyonda aktif ticket yok.
                  </p>
                ) : (
                  board.items.map((item) => <KitchenCard item={item} key={item.orderItemId} />)
                )}
              </div>
            </section>
          ))}
        </section>
      </section>
    </main>
  );
}
