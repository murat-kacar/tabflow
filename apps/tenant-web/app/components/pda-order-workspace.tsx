"use client";

import type {
  AdminTableSummary,
  CustomerBillSummary,
  CustomerOrderSummary,
  TenantCatalog
} from "@tabflow/shared-ts";
import { useActionState, useEffect, useState } from "react";
import { createPdaOrderAction, type TenantPdaOrderActionState } from "../auth-actions";

type CartLine = {
  menuItemId: string;
  note: string;
  quantity: number;
};

const initialState: TenantPdaOrderActionState = {
  ok: false,
  message: ""
};

const quickNotes = ["Az sekerli", "Sogansiz", "Acisiz", "Paket", "Onden gelsin"];

function formatMoney(amountMinor: number, currencyCode: string): string {
  return new Intl.NumberFormat("tr-TR", {
    currency: currencyCode,
    style: "currency"
  }).format(amountMinor / 100);
}

function statusLabel(table: AdminTableSummary): string {
  if (!table.isActive) return "Kapali";
  if (table.readyOrderCount > 0) return "Servis bekliyor";
  if (table.openBillId) return "Acik hesap";
  if (table.activeSessionCount > 0) return "Misafir aktif";
  return "Bos";
}

function tableTone(table: AdminTableSummary): string {
  if (!table.isActive) return "border-stone-200 bg-stone-100 text-stone-400";
  if (table.readyOrderCount > 0) return "border-emerald-300 bg-emerald-100 text-emerald-950";
  if (table.openBillId) return "border-amber-300 bg-amber-100 text-amber-950";
  if (table.activeSessionCount > 0) return "border-sky-300 bg-sky-100 text-sky-950";
  return "border-white/40 bg-white text-stone-950";
}

export function PdaOrderWorkspace({
  bills,
  catalog,
  orders,
  tables
}: {
  bills: CustomerBillSummary[];
  catalog: TenantCatalog;
  orders: CustomerOrderSummary[];
  tables: AdminTableSummary[];
}) {
  const activeTables = tables.filter((table) => table.isActive);
  const [selectedTableId, setSelectedTableId] = useState(activeTables[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(catalog.categories[0]?.id ?? "");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [tableQuery, setTableQuery] = useState("");
  const [state, action, pending] = useActionState(createPdaOrderAction, initialState);
  const normalizedTableQuery = tableQuery.trim().toLowerCase();
  const visibleTables = activeTables.filter((table) => {
    if (!normalizedTableQuery) return true;
    return (
      table.name.toLowerCase().includes(normalizedTableQuery) ||
      table.number.toString().includes(normalizedTableQuery) ||
      table.layoutCode.toLowerCase().includes(normalizedTableQuery)
    );
  });

  const selectedTable =
    activeTables.find((table) => table.id === selectedTableId) ?? activeTables[0];
  const selectedBill = bills.find(
    (bill) => bill.tableId === selectedTable?.id && bill.status === "open"
  );
  const selectedOrders = orders.filter((order) => order.tableId === selectedTable?.id).slice(0, 4);
  const selectedCategory =
    catalog.categories.find((category) => category.id === selectedCategoryId) ??
    catalog.categories[0];
  const cartLines = Object.values(cart).filter((line) => line.quantity > 0);
  const allItems = catalog.categories.flatMap((category) => category.items);
  const cartTotal = cartLines.reduce((total, line) => {
    const item = allItems.find((current) => current.id === line.menuItemId);
    return total + (item?.priceMinor ?? 0) * line.quantity;
  }, 0);
  const currencyCode = allItems[0]?.currencyCode ?? "GBP";

  useEffect(() => {
    if (state.ok) {
      setCart({});
    }
  }, [state.ok]);

  function increment(menuItemId: string) {
    setCart((current) => {
      const existing = current[menuItemId];
      return {
        ...current,
        [menuItemId]: {
          menuItemId,
          note: existing?.note ?? "",
          quantity: (existing?.quantity ?? 0) + 1
        }
      };
    });
  }

  function decrement(menuItemId: string) {
    setCart((current) => {
      const existing = current[menuItemId];
      if (!existing || existing.quantity <= 1) {
        const next = { ...current };
        delete next[menuItemId];
        return next;
      }

      return {
        ...current,
        [menuItemId]: {
          ...existing,
          quantity: existing.quantity - 1
        }
      };
    });
  }

  function updateNote(menuItemId: string, note: string) {
    setCart((current) => {
      const existing = current[menuItemId] ?? { menuItemId, note: "", quantity: 1 };
      return {
        ...current,
        [menuItemId]: {
          ...existing,
          note
        }
      };
    });
  }

  function appendQuickNote(menuItemId: string, note: string) {
    setCart((current) => {
      const existing = current[menuItemId] ?? { menuItemId, note: "", quantity: 1 };
      const notes = existing.note
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      const nextNote = notes.includes(note) ? existing.note : [...notes, note].join(", ");
      return {
        ...current,
        [menuItemId]: {
          ...existing,
          note: nextNote
        }
      };
    });
  }

  return (
    <main className="min-h-screen bg-[#15110d] text-stone-50">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-4 px-3 py-4 md:grid-cols-[18rem_1fr_20rem] md:px-5">
        <aside className="rounded-[2rem] border border-white/10 bg-[#201911] p-4 shadow-2xl shadow-black/30">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            Garson PDA
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Masa sec</h1>
          <input
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white placeholder:text-stone-500"
            onChange={(event) => setTableQuery(event.target.value)}
            placeholder="Masa ara: 5, balkon, salon..."
            type="search"
            value={tableQuery}
          />
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
            {visibleTables.map((table) => (
              <button
                className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
                  selectedTable?.id === table.id ? "ring-2 ring-amber-300" : ""
                } ${tableTone(table)}`}
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                type="button"
              >
                <span className="block text-lg font-black">
                  M{table.number.toString().padStart(2, "0")}
                </span>
                <span className="mt-1 block text-xs font-bold uppercase tracking-[0.16em] opacity-70">
                  {statusLabel(table)}
                </span>
                <span className="mt-2 block text-sm font-semibold">{table.name}</span>
              </button>
            ))}
            {visibleTables.length === 0 ? (
              <p className="col-span-2 rounded-2xl bg-white/5 p-4 text-sm text-stone-300 md:col-span-1">
                Bu aramayla masa bulunamadi.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-[#f4ead7] p-4 text-stone-950 shadow-2xl shadow-black/30">
          <div className="rounded-[1.5rem] bg-[#2f2619] p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Siparis olustur
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  {selectedTable
                    ? `Masa ${selectedTable.number.toString().padStart(2, "0")}`
                    : "Aktif masa yok"}
                </h2>
                <p className="mt-1 text-sm text-stone-300">
                  Urunleri sec, notu gir, tek dokunusla istasyonlara gonder.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-300 px-4 py-3 text-right text-stone-950">
                <p className="text-xs font-black uppercase tracking-[0.18em]">Sepet</p>
                <p className="text-xl font-black">{formatMoney(cartTotal, currencyCode)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {catalog.categories.map((category) => (
              <button
                className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-black ${
                  selectedCategory?.id === category.id
                    ? "bg-stone-950 text-white"
                    : "bg-white text-stone-700"
                }`}
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                type="button"
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(selectedCategory?.items ?? []).map((item) => {
              const line = cart[item.id];
              return (
                <article className="rounded-[1.5rem] bg-white p-4 shadow-sm" key={item.id}>
                  <div className="min-h-24">
                    <p className="text-lg font-black">{item.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{item.description}</p>
                    <p className="mt-3 text-base font-black text-stone-950">
                      {formatMoney(item.priceMinor, item.currencyCode)}
                    </p>
                    {item.stationName ? (
                      <p className="mt-2 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                        {item.stationName}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-stone-100 p-2">
                    <button
                      className="h-12 w-12 rounded-2xl bg-white text-2xl font-black"
                      onClick={() => decrement(item.id)}
                      type="button"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black">{line?.quantity ?? 0}</span>
                    <button
                      className="h-12 w-12 rounded-2xl bg-stone-950 text-2xl font-black text-white"
                      onClick={() => increment(item.id)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  {line ? (
                    <div className="mt-3 space-y-2">
                      <input
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                        onChange={(event) => updateNote(item.id, event.target.value)}
                        placeholder="Urun notu"
                        value={line.note}
                      />
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {quickNotes.map((note) => (
                          <button
                            className="whitespace-nowrap rounded-full bg-amber-100 px-3 py-2 text-xs font-black text-amber-950"
                            key={note}
                            onClick={() => appendQuickNote(item.id, note)}
                            type="button"
                          >
                            {note}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="rounded-[2rem] border border-white/10 bg-[#201911] p-4 shadow-2xl shadow-black/30">
          <form action={action}>
            <input name="tableId" type="hidden" value={selectedTable?.id ?? ""} />
            {cartLines.map((line) => (
              <div key={line.menuItemId}>
                <input name={`qty-${line.menuItemId}`} type="hidden" value={line.quantity} />
                <input name={`note-${line.menuItemId}`} type="hidden" value={line.note} />
              </div>
            ))}

            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
              Aktif sepet
            </p>
            {cartLines.length > 0 ? (
              <button
                className="mt-3 rounded-full border border-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-stone-300"
                onClick={() => setCart({})}
                type="button"
              >
                Sepeti temizle
              </button>
            ) : null}
            <div className="mt-4 space-y-3">
              {cartLines.length === 0 ? (
                <p className="rounded-2xl bg-white/5 p-4 text-sm text-stone-300">
                  Urun ekleyince burada gonderim ozeti olusur.
                </p>
              ) : (
                cartLines.map((line) => {
                  const item = allItems.find((current) => current.id === line.menuItemId);
                  return (
                    <div className="rounded-2xl bg-white p-3 text-stone-950" key={line.menuItemId}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black">{item?.name ?? "Urun"}</p>
                        <p className="rounded-full bg-stone-950 px-3 py-1 text-sm font-black text-white">
                          x{line.quantity}
                        </p>
                      </div>
                      {line.note ? (
                        <p className="mt-2 text-xs text-stone-600">{line.note}</p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
                Genel not
              </span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-stone-500"
                name="orderNote"
                placeholder="Orn: once icecekler, alerji, servis notu..."
              />
            </label>

            <button
              className="mt-4 w-full rounded-2xl bg-amber-300 px-5 py-4 text-base font-black text-stone-950 disabled:opacity-50"
              disabled={pending || cartLines.length === 0 || !selectedTable}
              type="submit"
            >
              {pending ? "Gonderiliyor..." : "Siparisi gonder"}
            </button>
            {state.message ? (
              <p
                className={`mt-3 text-sm font-semibold ${state.ok ? "text-emerald-300" : "text-rose-300"}`}
              >
                {state.message}
              </p>
            ) : null}
          </form>

          <section className="mt-5 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Acik hesap
            </p>
            <p className="mt-2 text-2xl font-black">
              {selectedBill
                ? formatMoney(selectedBill.subtotalMinor, selectedBill.currencyCode)
                : "Hesap yok"}
            </p>
            <p className="mt-1 text-sm text-stone-400">
              {selectedBill
                ? `${selectedBill.orderCount} siparis kaydi`
                : "Ilk siparis hesabi acar."}
            </p>
          </section>

          <section className="mt-4 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
              Son hareketler
            </p>
            <div className="mt-3 space-y-2">
              {selectedOrders.length === 0 ? (
                <p className="text-sm text-stone-400">Bu masa icin henuz siparis yok.</p>
              ) : (
                selectedOrders.map((order) => (
                  <div className="rounded-xl bg-black/20 p-3" key={order.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">#{order.id.slice(0, 8)}</p>
                      <p className="rounded-full bg-white/10 px-2 py-1 text-xs font-black uppercase">
                        {order.status}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-stone-300">
                      {formatMoney(order.subtotalMinor, order.currencyCode)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
