"use client";

import type {
  AdminDevice,
  AdminTableSummary,
  CustomerBillSummary,
  CustomerOrderSummary
} from "@tabflow/shared-ts";
import { useActionState, useMemo, useState } from "react";
import {
  closeBillAction,
  createTableAction,
  deleteTableAction,
  refreshDeviceTokenAction,
  rotateDeviceKeyAction,
  type TenantAdminActionState,
  type TenantDeviceActionState,
  type TenantTableActionState,
  updateOrderStatusAction,
  updateTableAction
} from "../auth-actions";
import { formatDateTime } from "../lib/format";

const tableActionInitialState: TenantTableActionState = {
  ok: false,
  message: ""
};

const adminActionInitialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

const deviceActionInitialState: TenantDeviceActionState = {
  ok: false,
  message: ""
};

function formatMoney(minor: number, currencyCode: string | null): string {
  if (!currencyCode) {
    return "-";
  }

  return `${(minor / 100).toFixed(2)} ${currencyCode}`;
}

function resolveStatus(table: AdminTableSummary): {
  label: string;
  tone: string;
} {
  if (!table.isActive) {
    return { label: "Pasif", tone: "bg-stone-200 text-stone-700" };
  }

  if (!table.deviceOnline) {
    return { label: "Cihaz offline", tone: "bg-rose-100 text-rose-700" };
  }

  if (table.readyOrderCount > 0) {
    return { label: "Servise hazir", tone: "bg-emerald-100 text-emerald-700" };
  }

  if (table.preparingOrderCount > 0) {
    return { label: "Hazirlaniyor", tone: "bg-sky-100 text-sky-700" };
  }

  if (table.submittedOrderCount > 0) {
    return { label: "Yeni siparis", tone: "bg-amber-100 text-amber-800" };
  }

  if (table.openBillId) {
    return { label: "Acik hesap", tone: "bg-violet-100 text-violet-700" };
  }

  return { label: "Bos", tone: "bg-stone-100 text-stone-700" };
}

function orderStatusTone(status: CustomerOrderSummary["status"]): string {
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

function TableCard({
  isSelected,
  onSelect,
  table
}: {
  isSelected: boolean;
  onSelect: () => void;
  table: AdminTableSummary;
}) {
  const status = resolveStatus(table);

  return (
    <button
      className={`rounded-[1.75rem] border p-5 text-left shadow-sm transition ${
        isSelected
          ? "border-stone-950 bg-stone-950 text-white"
          : "border-stone-200 bg-white text-stone-950 hover:border-stone-400"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.24em] ${
              isSelected ? "text-stone-300" : "text-stone-500"
            }`}
          >
            Masa {table.number.toString().padStart(3, "0")}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">{table.name}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isSelected ? "bg-white/10 text-white" : status.tone
          }`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isSelected ? "bg-white/10 text-white" : "bg-stone-50 text-stone-900"
          }`}
        >
          <p className={isSelected ? "text-stone-300" : "text-stone-500"}>Aktif oturum</p>
          <p className="mt-1 text-lg font-semibold">{table.activeSessionCount}</p>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isSelected ? "bg-white/10 text-white" : "bg-stone-50 text-stone-900"
          }`}
        >
          <p className={isSelected ? "text-stone-300" : "text-stone-500"}>Acik hesap</p>
          <p className="mt-1 text-lg font-semibold">
            {formatMoney(table.openBillSubtotalMinor, table.openBillCurrencyCode)}
          </p>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isSelected ? "bg-white/10 text-white" : "bg-stone-50 text-stone-900"
          }`}
        >
          <p className={isSelected ? "text-stone-300" : "text-stone-500"}>Yeni siparis</p>
          <p className="mt-1 text-lg font-semibold">{table.submittedOrderCount}</p>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isSelected ? "bg-white/10 text-white" : "bg-stone-50 text-stone-900"
          }`}
        >
          <p className={isSelected ? "text-stone-300" : "text-stone-500"}>Hazirlanan / Hazir</p>
          <p className="mt-1 text-lg font-semibold">
            {table.preparingOrderCount} / {table.readyOrderCount}
          </p>
        </div>
      </div>
    </button>
  );
}

function TableQuickEdit({ table }: { table: AdminTableSummary }) {
  const [serviceNote, setServiceNote] = useState(table.serviceNote);
  const [updateState, updateAction, updatePending] = useActionState(
    updateTableAction,
    tableActionInitialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTableAction,
    tableActionInitialState
  );

  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Masa ayari
          </p>
          <h3 className="mt-1 text-lg font-bold text-stone-950">Kimlik ve kullanim durumu</h3>
        </div>
      </div>

      <form action={updateAction} className="mt-4 grid gap-3">
        <input name="tableId" type="hidden" value={table.id} />
        <input
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950"
          defaultValue={table.number}
          min={1}
          name="number"
          type="number"
        />
        <input
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950"
          defaultValue={table.name}
          name="name"
          placeholder="Masa adi"
        />
        <div className="grid gap-2">
          <textarea
            className="min-h-28 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-950"
            maxLength={1200}
            name="serviceNote"
            onChange={(event) => setServiceNote(event.target.value)}
            placeholder="Servis notu, alerji uyarisi, oturum aliskanligi..."
            value={serviceNote}
          />
          <div className="flex flex-wrap gap-2">
            {[
              "Alerji sorulsun",
              "Cocuk sandalyesi hazirla",
              "Dogum gunu servisi var",
              "Sessiz servis tercih ediyor"
            ].map((preset) => (
              <button
                className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
                key={preset}
                onClick={() =>
                  setServiceNote((current) => {
                    if (!current.trim()) {
                      return preset;
                    }

                    return current.includes(preset) ? current : `${current.trim()}\n${preset}`;
                  })
                }
                type="button"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input defaultChecked={table.isActive} name="isActive" type="checkbox" />
          Masayi aktif tut
        </label>
        <button
          className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
          disabled={updatePending}
          type="submit"
        >
          Guncelle
        </button>
      </form>

      <form action={deleteAction} className="mt-3">
        <input name="tableId" type="hidden" value={table.id} />
        <button
          className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700"
          disabled={deletePending}
          type="submit"
        >
          Sil
        </button>
      </form>

      {updateState.message ? (
        <p className={`mt-3 text-sm ${updateState.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {updateState.message}
        </p>
      ) : null}

      {deleteState.message ? (
        <p className={`mt-3 text-sm ${deleteState.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {deleteState.message}
        </p>
      ) : null}
    </section>
  );
}

type TableTimelineEvent = {
  id: string;
  label: string;
  detail: string;
  time: string;
  tone: string;
};

function TableDevicePanel({ device }: { device: AdminDevice | undefined }) {
  const [refreshState, refreshAction, refreshPending] = useActionState(
    refreshDeviceTokenAction,
    deviceActionInitialState
  );
  const [rotateState, rotateAction, rotatePending] = useActionState(
    rotateDeviceKeyAction,
    deviceActionInitialState
  );

  if (!device) {
    return (
      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Cihaz</p>
        <p className="mt-3 text-sm text-stone-600">Bu masa icin tanimli cihaz kaydi bulunmuyor.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Cihaz</p>
          <h3 className="mt-1 text-lg font-bold text-stone-950">Ekran ve anahtar durumu</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            device.deviceOnline ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
          }`}
        >
          {device.deviceOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-stone-600">
        <p>Anahtar ipucu: {device.activeKey?.keyHint ?? "Henuz yok"}</p>
        <p>Son gorulme: {formatDateTime(device.activeKey?.lastSeenAt)}</p>
        <p>Aktif token TTL: {device.activeToken?.ttlSeconds ?? 0}s</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={refreshAction}>
          <input name="tableId" type="hidden" value={device.tableId} />
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            disabled={refreshPending}
            type="submit"
          >
            Token gonder
          </button>
        </form>
        <form action={rotateAction}>
          <input name="tableId" type="hidden" value={device.tableId} />
          <button
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            disabled={rotatePending}
            type="submit"
          >
            Key rotate et
          </button>
        </form>
      </div>

      {refreshState.message ? (
        <p className={`mt-3 text-sm ${refreshState.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {refreshState.message}
        </p>
      ) : null}

      {rotateState.message ? (
        <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-4">
          <p className={`text-sm ${rotateState.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {rotateState.message}
          </p>
          {rotateState.rawDeviceKey ? (
            <p className="font-mono text-xs text-stone-700">{rotateState.rawDeviceKey}</p>
          ) : null}
          {rotateState.firmwareConfig ? (
            <pre className="overflow-x-auto rounded-2xl bg-stone-950 p-4 text-xs text-stone-100">
              {rotateState.firmwareConfig}
            </pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TableBillPanel({ bill }: { bill: CustomerBillSummary | undefined }) {
  const [state, action, pending] = useActionState(closeBillAction, adminActionInitialState);

  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Hesap</p>
      {bill ? (
        <>
          <div className="mt-3 grid gap-2 text-sm text-stone-600">
            <p>Tutar: {formatMoney(bill.subtotalMinor, bill.currencyCode)}</p>
            <p>Siparis sayisi: {bill.orderCount}</p>
            <p>Acilis: {formatDateTime(bill.openedAt)}</p>
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
        </>
      ) : (
        <p className="mt-3 text-sm text-stone-600">Bu masa icin acik hesap bulunmuyor.</p>
      )}
    </section>
  );
}

function TableTimelinePanel({ events }: { events: TableTimelineEvent[] }) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Servis zamani
          </p>
          <h3 className="mt-1 text-lg font-bold text-stone-950">Masanin canli akisi</h3>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Bu masa icin henuz olay akisi olusmadi.
          </p>
        ) : (
          events.map((event) => (
            <div className="flex gap-3" key={event.id}>
              <div className={`mt-1 h-3 w-3 rounded-full ${event.tone}`} />
              <div className="min-w-0 flex-1 rounded-2xl bg-stone-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">{event.label}</p>
                  <span className="text-xs text-stone-500">{event.time}</span>
                </div>
                <p className="mt-1 text-sm text-stone-600">{event.detail}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function TableOrdersPanel({ orders }: { orders: CustomerOrderSummary[] }) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Siparis akisi
          </p>
          <h3 className="mt-1 text-lg font-bold text-stone-950">Masaya bagli canli siparisler</h3>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {orders.length} kayit
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {orders.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Bu masa icin henuz siparis kaydi yok.
          </p>
        ) : (
          orders.map((order) => <TableOrderCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}

function TableOrderCard({ order }: { order: CustomerOrderSummary }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, adminActionInitialState);

  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-stone-950">Siparis #{order.id.slice(0, 8)}</p>
          <p className="mt-1 text-sm text-stone-600">
            Tutar {formatMoney(order.subtotalMinor, order.currencyCode)} •{" "}
            {formatDateTime(order.updatedAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusTone(order.status)}`}
        >
          {order.status}
        </span>
      </div>

      {order.note ? (
        <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-stone-700">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Siparis notu
          </p>
          <p className="mt-2">{order.note}</p>
        </div>
      ) : null}

      <div className="mt-3 space-y-2">
        {order.items.map((item) => (
          <div
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
            key={item.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-stone-950">
                {item.quantity}x {item.itemName}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${orderStatusTone(
                  item.status
                )}`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-1 text-stone-600">
              {formatMoney(item.lineTotalMinor, order.currencyCode)}
            </p>
            {item.note ? <p className="mt-2 text-stone-600">Not: {item.note}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-stone-700">
          {order.items.length} kalem
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-stone-700">
          {order.billId ? `Hesap #${order.billId.slice(0, 8)}` : "Hesaba baglanmadi"}
        </span>
      </div>

      {order.allowedNextStatuses.length > 0 ? (
        <form action={action} className="mt-4 flex flex-wrap gap-2">
          <input name="orderId" type="hidden" value={order.id} />
          {order.allowedNextStatuses.map((status) => (
            <button
              className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700"
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

export function TableOperationsBoard({
  bills,
  devices,
  orders,
  tables
}: {
  bills: CustomerBillSummary[];
  devices: AdminDevice[];
  orders: CustomerOrderSummary[];
  tables: AdminTableSummary[];
}) {
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id ?? "");
  const [createState, createAction, createPending] = useActionState(
    createTableAction,
    tableActionInitialState
  );

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? tables[0],
    [selectedTableId, tables]
  );

  const selectedOrders = useMemo(
    () =>
      selectedTable
        ? orders
            .filter((order) => order.tableId === selectedTable.id)
            .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
        : [],
    [orders, selectedTable]
  );

  const selectedBill = useMemo(
    () => (selectedTable ? bills.find((bill) => bill.tableId === selectedTable.id) : undefined),
    [bills, selectedTable]
  );

  const selectedDevice = useMemo(
    () =>
      selectedTable ? devices.find((device) => device.tableId === selectedTable.id) : undefined,
    [devices, selectedTable]
  );

  const selectedBillOrders = useMemo(
    () => (selectedBill ? selectedOrders.filter((order) => order.billId === selectedBill.id) : []),
    [selectedBill, selectedOrders]
  );

  const timelineEvents = useMemo(() => {
    if (!selectedTable) {
      return [] as TableTimelineEvent[];
    }

    const events: TableTimelineEvent[] = [
      {
        id: `table-${selectedTable.id}`,
        label: "Masa durumu guncellendi",
        detail: selectedTable.serviceNote
          ? `Servis notu aktif. ${selectedTable.serviceNote}`
          : "Masa operasyon durumu yenilendi.",
        time: selectedTable.updatedAt,
        tone: "bg-stone-400"
      }
    ];

    if (selectedBill) {
      events.push({
        id: `bill-${selectedBill.id}`,
        label: "Acik hesap basladi",
        detail: `${selectedBill.orderCount} siparis bagli. Toplam ${formatMoney(
          selectedBill.subtotalMinor,
          selectedBill.currencyCode
        )}`,
        time: selectedBill.openedAt,
        tone: "bg-violet-500"
      });
    }

    if (selectedDevice?.activeKey?.lastSeenAt) {
      events.push({
        id: `device-${selectedDevice.tableId}`,
        label: selectedDevice.deviceOnline ? "Cihaz online goruldu" : "Cihaz son gorulme",
        detail: selectedDevice.activeKey.keyHint
          ? `Anahtar ${selectedDevice.activeKey.keyHint}`
          : "Masa cihazindan heartbeat alindi.",
        time: selectedDevice.activeKey.lastSeenAt,
        tone: selectedDevice.deviceOnline ? "bg-emerald-500" : "bg-rose-400"
      });
    }

    for (const order of selectedOrders) {
      events.push({
        id: `order-${order.id}`,
        label: `Siparis #${order.id.slice(0, 8)} ${order.status}`,
        detail: `${order.items.length} kalem • ${formatMoney(
          order.subtotalMinor,
          order.currencyCode
        )}${order.note ? ` • ${order.note}` : ""}`,
        time: order.updatedAt,
        tone:
          order.status === "ready"
            ? "bg-emerald-500"
            : order.status === "preparing"
              ? "bg-sky-500"
              : order.status === "cancelled"
                ? "bg-rose-500"
                : "bg-amber-500"
      });
    }

    return events.sort((left, right) => Date.parse(right.time) - Date.parse(left.time));
  }, [selectedBill, selectedDevice, selectedOrders, selectedTable]);

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              Floor
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
              Masa plani ve operasyon durumu
            </h2>
          </div>
          <p className="max-w-md text-sm text-stone-600">
            Kartlardan birini sec, sag panelde o masanin siparis, hesap ve cihaz aksiyonlarini tek
            yerde yonet.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {tables.map((table) => (
            <TableCard
              isSelected={selectedTable?.id === table.id}
              key={table.id}
              onSelect={() => setSelectedTableId(table.id)}
              table={table}
            />
          ))}
        </div>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-[2rem] border border-stone-200 bg-[#15231c] p-6 text-stone-50 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
            Masa ekle
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">Yeni alan veya masa ac</h3>
          <form action={createAction} className="mt-5 grid gap-3">
            <input
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-stone-300"
              min={1}
              name="number"
              placeholder="Masa numarasi"
              type="number"
            />
            <input
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-stone-300"
              name="name"
              placeholder="Orn. Teras 12"
            />
            <textarea
              className="min-h-24 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-stone-300"
              maxLength={1200}
              name="serviceNote"
              placeholder="Opsiyonel servis notu"
            />
            <label className="flex items-center gap-2 text-sm text-stone-200">
              <input defaultChecked name="isActive" type="checkbox" />
              Hemen aktif olsun
            </label>
            <button
              className="rounded-full bg-[#d7f266] px-5 py-3 text-sm font-semibold text-stone-950"
              disabled={createPending}
              type="submit"
            >
              Masa ekle
            </button>
          </form>
          {createState.message ? (
            <p className={`mt-4 text-sm ${createState.ok ? "text-emerald-200" : "text-rose-200"}`}>
              {createState.message}
            </p>
          ) : null}
        </section>

        {selectedTable ? (
          <>
            <section className="rounded-[2rem] border border-stone-200 bg-[#f6f3ea] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                    Secili masa
                  </p>
                  <h3 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
                    {selectedTable.name}
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">
                    Masa {selectedTable.number.toString().padStart(3, "0")} • son guncelleme{" "}
                    {formatDateTime(selectedTable.updatedAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    resolveStatus(selectedTable).tone
                  }`}
                >
                  {resolveStatus(selectedTable).label}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-stone-500">Aktif oturum</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">
                    {selectedTable.activeSessionCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-stone-500">Yeni siparis</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">
                    {selectedTable.submittedOrderCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-stone-500">Hazirlaniyor</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">
                    {selectedTable.preparingOrderCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-stone-500">Hazir</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">
                    {selectedTable.readyOrderCount}
                  </p>
                </div>
              </div>
              {selectedTable.serviceNote ? (
                <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Servis notu
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                    {selectedTable.serviceNote}
                  </p>
                </div>
              ) : null}
            </section>

            <TableOrdersPanel orders={selectedOrders} />
            <TableBillPanel bill={selectedBill} />
            {selectedBillOrders.length > 0 ? (
              <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Hesaba bagli siparisler
                </p>
                <div className="mt-4 grid gap-2">
                  {selectedBillOrders.map((order) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"
                      key={order.id}
                    >
                      <div>
                        <p className="font-semibold text-stone-950">#{order.id.slice(0, 8)}</p>
                        <p className="mt-1 text-sm text-stone-600">
                          {order.items.length} kalem •{" "}
                          {formatMoney(order.subtotalMinor, order.currencyCode)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusTone(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            <TableTimelinePanel events={timelineEvents} />
            <TableDevicePanel device={selectedDevice} />
            <TableQuickEdit key={selectedTable.id} table={selectedTable} />
          </>
        ) : null}
      </aside>
    </section>
  );
}
