"use client";

import type { KitchenStationBoard } from "@tabflow/shared-ts";
import Link from "next/link";
import { useActionState } from "react";
import { type TenantAdminActionState, updateKitchenItemStatusAction } from "../auth-actions";

const initialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

type StationVariant = {
  actionLabel: string;
  boardLabel: string;
  boardTone: string;
  emptyLabel: string;
  heroCopy: string;
};

function stationVariant(stationCode: string): StationVariant {
  switch (stationCode) {
    case "barista":
      return {
        actionLabel: "Bardağa al",
        boardLabel: "Barista Board",
        boardTone: "from-[#2d1f17] via-[#4a3124] to-[#1b1512]",
        emptyLabel: "Barista kuyruğu sakin.",
        heroCopy: "Kahve ve sicak icecek akisi hizli ritimle ilerlemeli."
      };
    case "bar":
      return {
        actionLabel: "Shaker'a al",
        boardLabel: "Bar Board",
        boardTone: "from-[#1b2233] via-[#20294a] to-[#131826]",
        emptyLabel: "Bar kuyruğunda bekleyen ticket yok.",
        heroCopy: "Bar hattında servis temposu ve sunum hızı kritik."
      };
    case "hookah":
    case "nargile":
      return {
        actionLabel: "Hazirlamaya basla",
        boardLabel: "Hookah Board",
        boardTone: "from-[#2d2232] via-[#442d52] to-[#1d1822]",
        emptyLabel: "Nargile hattı şu an sakin.",
        heroCopy: "Nargile akışında hazırlık, teslim ve takip daha uzun çevrimlidir."
      };
    case "fastfood":
      return {
        actionLabel: "Hatta al",
        boardLabel: "Fastfood Board",
        boardTone: "from-[#332316] via-[#5c3420] to-[#23170f]",
        emptyLabel: "Fastfood hattında açık ticket yok.",
        heroCopy: "Hız, sıralama ve sıcak teslim bu istasyonun ana KPI'ı."
      };
    case "dispatch":
      return {
        actionLabel: "Paketlemeye al",
        boardLabel: "Dispatch Board",
        boardTone: "from-[#1c2830] via-[#1e3a46] to-[#152026]",
        emptyLabel: "Paketleme hattı boş.",
        heroCopy: "Paketleme ve devir teslim akışı burada kapanır."
      };
    default:
      return {
        actionLabel: "Hazirlamaya al",
        boardLabel: "Station Board",
        boardTone: "from-[#143328] via-[#1b2d29] to-[#0d1413]",
        emptyLabel: "Bu kolon için aktif ticket yok.",
        heroCopy: "Istasyon akışını tek bakışta gör, sırayı bozma, hattı temiz tut."
      };
  }
}

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

function urgencyForItem(item: KitchenStationBoard["items"][number]) {
  const createdAt = new Date(item.createdAt).getTime();
  const elapsedMinutes = Number.isFinite(createdAt)
    ? Math.max(0, Math.floor((Date.now() - createdAt) / 60000))
    : 0;

  if (elapsedMinutes >= 7) {
    return {
      elapsedMinutes,
      label: "Urgent",
      tone: "bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/30"
    };
  }

  if (elapsedMinutes >= 3) {
    return {
      elapsedMinutes,
      label: "Warning",
      tone: "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30"
    };
  }

  return {
    elapsedMinutes,
    label: "Fresh",
    tone: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30"
  };
}

function KitchenCard({
  item,
  prepareLabel
}: {
  item: KitchenStationBoard["items"][number];
  prepareLabel: string;
}) {
  const [state, action, pending] = useActionState(updateKitchenItemStatusAction, initialState);
  const urgency = urgencyForItem(item);

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

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${urgency.tone}`}>
          {urgency.label} • {urgency.elapsedMinutes} dk
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
            {prepareLabel}
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

function EmptyColumn({ label, emptyLabel }: { label: string; emptyLabel: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-stone-400">
      {label === "Yeni" ? emptyLabel : `${label} kolonunda aktif ticket yok.`}
    </div>
  );
}

function StationPulse({ board }: { board: KitchenStationBoard }) {
  const urgentItems = board.items.filter((item) => urgencyForItem(item).label === "Urgent").length;
  const warningItems = board.items.filter((item) => urgencyForItem(item).label === "Warning").length;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <article className="rounded-[1.4rem] border border-white/10 bg-black/15 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Hat kimligi</p>
        <p className="mt-2 text-lg font-bold text-white">{board.stationName}</p>
        <p className="mt-1 text-sm text-stone-300">{board.stationCode} uretim akisi canli.</p>
      </article>
      <article className="rounded-[1.4rem] border border-white/10 bg-black/15 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Warning</p>
        <p className="mt-2 text-lg font-bold text-amber-100">{warningItems}</p>
        <p className="mt-1 text-sm text-stone-300">3 dakika uzerine cikan ticket sayisi.</p>
      </article>
      <article className="rounded-[1.4rem] border border-white/10 bg-black/15 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Urgent</p>
        <p className="mt-2 text-lg font-bold text-rose-100">{urgentItems}</p>
        <p className="mt-1 text-sm text-stone-300">7 dakika ve uzeri ticket baskisi.</p>
      </article>
    </div>
  );
}

function QueueFocus({
  board,
  focused
}: {
  board: KitchenStationBoard;
  focused: boolean;
}) {
  const submitted = board.items.filter((item) => item.itemStatus === "submitted").length;
  const preparing = board.items.filter((item) => item.itemStatus === "preparing").length;
  const ready = board.items.filter((item) => item.itemStatus === "ready").length;
  const urgent = board.items.filter((item) => urgencyForItem(item).label === "Urgent").length;

  return (
    <section
      className={`rounded-[1.6rem] border px-4 py-4 transition ${
        focused
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/10 bg-black/15 text-stone-300 hover:border-white/20 hover:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: board.colorHex }} />
          <div>
            <p className="text-sm font-semibold">{board.stationName}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">{board.stationCode}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          {board.items.length}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-black/20 px-2 py-3">
          <p className="text-stone-400">Yeni</p>
          <p className="mt-1 text-sm font-bold text-white">{submitted}</p>
        </div>
        <div className="rounded-2xl bg-black/20 px-2 py-3">
          <p className="text-stone-400">Haz.</p>
          <p className="mt-1 text-sm font-bold text-white">{preparing}</p>
        </div>
        <div className="rounded-2xl bg-black/20 px-2 py-3">
          <p className="text-stone-400">Ready</p>
          <p className="mt-1 text-sm font-bold text-white">{ready}</p>
        </div>
        <div className="rounded-2xl bg-black/20 px-2 py-3">
          <p className="text-stone-400">Urgent</p>
          <p className="mt-1 text-sm font-bold text-white">{urgent}</p>
        </div>
      </div>
    </section>
  );
}

export function KitchenBoard({
  boards,
  focusedStationCode
}: {
  boards: KitchenStationBoard[];
  focusedStationCode?: string;
}) {
  const singleStationMode = boards.length === 1;
  const heroVariant = stationVariant(boards[0]?.stationCode ?? "general");

  return (
    <main
      className={`min-h-screen bg-[radial-gradient(circle_at_top_left,#143328,transparent_26rem),linear-gradient(135deg,#0d1413,#17211f)] px-6 py-8 text-white ${
        singleStationMode ? `bg-gradient-to-br ${heroVariant.boardTone}` : ""
      }`}
    >
      <section className="mx-auto max-w-[1600px]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Station Board
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            {singleStationMode
              ? `${boards[0]?.stationName ?? "Istasyon"} • ${heroVariant.boardLabel}`
              : "Istasyon bazli uretim panosu"}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-300">
            {singleStationMode
              ? heroVariant.heroCopy
              : "Her istasyon kendi ticket akisina odaklanir. Supervisor tum istasyonlari ayni panoda gorebilir; operator ise sadece kendi hattini net ve hizli sekilde yonetir."}
          </p>
          {singleStationMode ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30"
                href="/stations"
              >
                Tum istasyonlara don
              </Link>
              <Link
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30"
                href="/service"
              >
                Masa + Kasa
              </Link>
            </div>
          ) : null}
        </div>

        <section className="mt-6">
          <div
            className={`grid gap-3 ${
              singleStationMode ? "md:grid-cols-1" : "md:grid-cols-2 xl:grid-cols-4"
            }`}
          >
            {boards.map((board) => (
              <Link
                href={`/stations/${board.stationCode}`}
                key={board.stationCode}
                className="block"
              >
                <QueueFocus
                  board={board}
                  focused={focusedStationCode === board.stationCode || (singleStationMode && boards.length === 1)}
                />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5">
          {boards.map((board) => (
            (() => {
              const variant = stationVariant(board.stationCode);
              return (
            <section
              className={`rounded-[2rem] border p-5 shadow-sm ${
                singleStationMode ? "border-white/15 bg-white/[0.04]" : "border-white/10"
              }`}
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

              <div className="mt-5">
                <StationPulse board={board} />
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
                          <EmptyColumn emptyLabel={variant.emptyLabel} label={column.label} />
                        ) : (
                          items.map((item) => (
                            <KitchenCard
                              item={item}
                              key={item.orderItemId}
                              prepareLabel={variant.actionLabel}
                            />
                          ))
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
              );
            })()
          ))}
        </section>
      </section>
    </main>
  );
}
