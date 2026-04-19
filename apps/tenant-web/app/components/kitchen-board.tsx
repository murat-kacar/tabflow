"use client";

import type { KitchenStationBoard } from "@tabflow/shared-ts";
import { useActionState } from "react";
import { type TenantAdminActionState, updateKitchenItemStatusAction } from "../auth-actions";

const initialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

function elapsedTone(status: KitchenStationBoard["items"][number]["itemStatus"]) {
  switch (status) {
    case "submitted":
      return "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30";
    case "preparing":
      return "bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/30";
    case "ready":
      return "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30";
    default:
      return "bg-white/10 text-stone-200";
  }
}

function statusLabel(status: KitchenStationBoard["items"][number]["itemStatus"]) {
  switch (status) {
    case "submitted":
      return "Yeni";
    case "preparing":
      return "Hazirlaniyor";
    case "ready":
      return "Hazir";
    default:
      return status;
  }
}

function KitchenCard({ item }: { item: KitchenStationBoard["items"][number] }) {
  const [state, action, pending] = useActionState(updateKitchenItemStatusAction, initialState);

  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {item.tableNumber ? `Masa ${item.tableNumber.toString().padStart(3, "0")}` : "Masa yok"}
          </p>
          <p className="text-xs text-stone-300">Siparis #{item.orderId.slice(0, 8)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${elapsedTone(item.itemStatus)}`}>
          {statusLabel(item.itemStatus)}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xl font-bold text-white">
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

function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-stone-400">
      {label} kolonunda aktif ticket yok.
    </div>
  );
}

export function KitchenBoard({ boards }: { boards: KitchenStationBoard[] }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#143328,transparent_26rem),linear-gradient(135deg,#0d1413,#17211f)] px-6 py-8 text-white">
      <section className="mx-auto max-w-[1600px]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Station Board
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Istasyon bazli uretim panosu</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-300">
            Her istasyon kendi ticket akisina odaklanir. Supervisor tum istasyonlari ayni panoda
            gorebilir; operator ise sadece kendi hattini net ve hizli sekilde yonetir.
          </p>
        </div>

        <section className="mt-8 grid gap-5">
          {boards.map((board) => (
            <section
              className="rounded-[2rem] border border-white/10 p-5 shadow-sm"
              key={board.stationCode}
              style={{ backgroundColor: `${board.colorHex}18` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
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
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-100">
                    Toplam {board.items.length}
                  </span>
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100">
                    Yeni {board.items.filter((item) => item.itemStatus === "submitted").length}
                  </span>
                  <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-100">
                    Hazirlaniyor {board.items.filter((item) => item.itemStatus === "preparing").length}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                    Hazir {board.items.filter((item) => item.itemStatus === "ready").length}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                {[
                  { id: "submitted", label: "Yeni" },
                  { id: "preparing", label: "Hazirlaniyor" },
                  { id: "ready", label: "Hazir" }
                ].map((column) => {
                  const items = board.items.filter((item) => item.itemStatus === column.id);

                  return (
                    <section
                      className="rounded-[1.6rem] border border-white/10 bg-black/15 p-4"
                      key={column.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold tracking-tight text-white">{column.label}</h3>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-stone-200">
                          {items.length}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4">
                        {items.length === 0 ? (
                          <EmptyColumn label={column.label} />
                        ) : (
                          items.map((item) => <KitchenCard item={item} key={item.orderItemId} />)
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      </section>
    </main>
  );
}
