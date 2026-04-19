"use client";

import type {
  AdminDevice,
  AdminTableSummary,
  CustomerBillSummary,
  CustomerOrderSummary
} from "@tabflow/shared-ts";
import { useActionState, useMemo, useState } from "react";
import { closeBillAction, type TenantAdminActionState } from "../auth-actions";
import { formatDateTime } from "../lib/format";

const initialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

type FloorCashView = "floor" | "open-checks" | "payment-queue" | "closed-checks";
type PaymentMethod = "nakit" | "kart" | "transfer" | "diger";
type FloorZoneKey = "salon" | "balkon" | "paket";

function formatMoney(minor: number, currencyCode: string | null): string {
  if (!currencyCode) {
    return "-";
  }

  return `${(minor / 100).toFixed(2)} ${currencyCode}`;
}

function statusBadge(table: AdminTableSummary) {
  if (!table.isActive) {
    return { label: "Pasif", tone: "bg-stone-200 text-stone-700" };
  }

  if (!table.deviceOnline) {
    return { label: "Offline", tone: "bg-rose-100 text-rose-700" };
  }

  if (table.readyOrderCount > 0) {
    return { label: "Hazir servis", tone: "bg-emerald-100 text-emerald-800" };
  }

  if (table.submittedOrderCount + table.preparingOrderCount > 0) {
    return { label: "Aktif siparis", tone: "bg-amber-100 text-amber-800" };
  }

  if (table.openBillId) {
    return { label: "Acik hesap", tone: "bg-stone-200 text-stone-800" };
  }

  return { label: "Bos", tone: "bg-stone-100 text-stone-600" };
}

function tableUrgency(table: AdminTableSummary) {
  if (!table.deviceOnline) {
    return { label: "Cihaz problemi", tone: "bg-rose-100 text-rose-700" };
  }

  if (table.readyOrderCount > 0) {
    return { label: "Servis cikmali", tone: "bg-emerald-100 text-emerald-800" };
  }

  if (table.preparingOrderCount + table.submittedOrderCount >= 3) {
    return { label: "Yogun masa", tone: "bg-amber-100 text-amber-800" };
  }

  if (table.openBillId) {
    return { label: "Kapanis bekliyor", tone: "bg-stone-200 text-stone-800" };
  }

  return { label: "Sakin", tone: "bg-stone-100 text-stone-600" };
}

function inferZone(table: AdminTableSummary): FloorZoneKey {
  const source = `${table.name} ${table.serviceNote ?? ""}`.toLowerCase();

  if (source.includes("balkon") || source.includes("teras")) {
    return "balkon";
  }

  if (source.includes("paket") || source.includes("kurye") || source.includes("takeaway")) {
    return "paket";
  }

  return "salon";
}

function zoneMeta(zone: FloorZoneKey) {
  switch (zone) {
    case "balkon":
      return {
        label: "Balkon",
        tone: "bg-[#87a9d8] text-white",
        panel: "border-[#87a9d8]/40 bg-[linear-gradient(180deg,#e8f0ff,#dbe8fb)]"
      };
    case "paket":
      return {
        label: "Paket",
        tone: "bg-[#506c84] text-white",
        panel: "border-[#506c84]/40 bg-[linear-gradient(180deg,#ebeff3,#d8e0e8)]"
      };
    default:
      return {
        label: "Salon",
        tone: "bg-[#5f8ec9] text-white",
        panel: "border-[#d8c85f]/40 bg-[linear-gradient(180deg,#fff7a8,#f6e980)]"
      };
  }
}

function FloorTableCard({
  isSelected,
  onSelect,
  table,
  zone
}: {
  isSelected: boolean;
  onSelect: () => void;
  table: AdminTableSummary;
  zone: FloorZoneKey;
}) {
  const badge = statusBadge(table);
  const zoneDetails = zoneMeta(zone);
  const shapeClass =
    zone === "salon"
      ? "aspect-square rounded-[1.8rem]"
      : zone === "balkon"
        ? "aspect-square rounded-[999px]"
        : "aspect-[1.25/1] rounded-[1rem]";

  return (
    <button
      className={`${shapeClass} relative border-[3px] p-4 text-left shadow-sm transition ${
        isSelected
          ? "border-[#16392e] bg-[#ff6e70] text-stone-950"
          : zone === "salon"
            ? "border-[#534449] bg-[#fffdf4] text-stone-950 hover:border-[#263e73]"
            : zone === "balkon"
              ? "border-[#534449] bg-[#f8ae2f] text-stone-950 hover:border-[#263e73]"
              : "border-[#534449] bg-[#f6f6f4] text-stone-950 hover:border-[#263e73]"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.22em] ${
              isSelected ? "text-stone-800/70" : "text-stone-500"
            }`}
          >
            {zoneDetails.label}
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-tight">
            {table.name || `M.${table.number.toString().padStart(2, "0")}`}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isSelected ? "bg-stone-950/10 text-stone-950" : badge.tone
          }`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className={`rounded-2xl px-3 py-2 ${isSelected ? "bg-stone-950/10" : "bg-black/5"}`}>
          <p className={isSelected ? "text-stone-800/70" : "text-stone-500"}>Hesap</p>
          <p className="mt-1 text-base font-bold">
            {table.openBillId ? formatMoney(table.openBillSubtotalMinor, table.openBillCurrencyCode) : "-"}
          </p>
        </div>
        <div className={`rounded-2xl px-3 py-2 ${isSelected ? "bg-stone-950/10" : "bg-black/5"}`}>
          <p className={isSelected ? "text-stone-800/70" : "text-stone-500"}>Hazir / Yeni</p>
          <p className="mt-1 text-base font-bold">
            {table.readyOrderCount} / {table.submittedOrderCount + table.preparingOrderCount}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${tableUrgency(table).tone} ${
            isSelected ? "bg-stone-950/10 text-stone-950" : ""
          }`}
        >
          {tableUrgency(table).label}
        </span>
        {table.openBillId ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? "bg-white/10 text-white" : "bg-stone-100 text-stone-700"}`}>
            Hesap acik
          </span>
        ) : null}
      </div>
      </div>
    </button>
  );
}

function FloorZoneTabs({
  current,
  onChange,
  zoneCounts
}: {
  current: FloorZoneKey | "all" | "open";
  onChange: (value: FloorZoneKey | "all" | "open") => void;
  zoneCounts: Record<FloorZoneKey, number>;
}) {
  const tabs: Array<{ id: FloorZoneKey | "all" | "open"; label: string }> = [
    { id: "balkon", label: "Balkon" },
    { id: "salon", label: "Salon" },
    { id: "open", label: "Acik Masalar" },
    { id: "all", label: "Hepsi" }
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          className={`rounded-sm border px-4 py-2 text-sm font-bold transition ${
            current === tab.id
              ? "border-[#3d5f9c] bg-[#7ca4d8] text-white"
              : "border-[#9eb8d6] bg-[#dce7f5] text-[#21406f]"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
          {tab.id === "salon" || tab.id === "balkon" ? ` (${zoneCounts[tab.id]})` : ""}
        </button>
      ))}
    </div>
  );
}

function FloorPlanBoard({
  selectedTable,
  selectedZone,
  setSelectedTableId,
  setSelectedZone,
  tables
}: {
  selectedTable?: AdminTableSummary;
  selectedZone: FloorZoneKey | "all" | "open";
  setSelectedTableId: (value: string) => void;
  setSelectedZone: (value: FloorZoneKey | "all" | "open") => void;
  tables: AdminTableSummary[];
}) {
  const zoneCounts = tables.reduce<Record<FloorZoneKey, number>>(
    (acc, table) => {
      acc[inferZone(table)] += 1;
      return acc;
    },
    { salon: 0, balkon: 0, paket: 0 }
  );

  const filteredTables = tables.filter((table) => {
    if (selectedZone === "all") {
      return true;
    }
    if (selectedZone === "open") {
      return Boolean(table.openBillId);
    }
    return inferZone(table) === selectedZone;
  });

  const grouped = {
    salon: filteredTables.filter((table) => inferZone(table) === "salon"),
    balkon: filteredTables.filter((table) => inferZone(table) === "balkon"),
    paket: filteredTables.filter((table) => inferZone(table) === "paket")
  };

  const sections: FloorZoneKey[] =
    selectedZone === "all" || selectedZone === "open"
      ? ["balkon", "salon", "paket"]
      : [selectedZone];

  return (
    <section className="rounded-[1.25rem] border border-[#9eb8d6] bg-[#edf3fb] p-3 shadow-sm">
      <div className="border border-[#7ca4d8] bg-[#7ca4d8] px-3 py-2 text-sm font-bold text-white">
        Masalar
      </div>
      <FloorZoneTabs current={selectedZone} onChange={setSelectedZone} zoneCounts={zoneCounts} />
      <div className="mt-3 space-y-4">
        {sections.map((section) => {
          const meta = zoneMeta(section);
          const sectionTables = grouped[section];

          return (
            <section className={`rounded-md border p-4 ${meta.panel}`} key={section}>
              <div className="flex items-center justify-between gap-3">
                <div className={`rounded-sm px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${meta.tone}`}>
                  {meta.label}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                  {sectionTables.length} masa
                </p>
              </div>
              <div
                className={`mt-4 grid gap-4 ${
                  section === "salon"
                    ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-2 md:grid-cols-3"
                }`}
              >
                {sectionTables.length === 0 ? (
                  <div className="rounded-md border border-dashed border-stone-400/40 bg-white/40 px-4 py-8 text-center text-sm text-stone-600">
                    Bu alanda gorunecek masa yok.
                  </div>
                ) : (
                  sectionTables.map((table) => (
                    <FloorTableCard
                      isSelected={selectedTable?.id === table.id}
                      key={table.id}
                      onSelect={() => setSelectedTableId(table.id)}
                      table={table}
                      zone={section}
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
}

function ShiftSnapshot({
  bills,
  tables
}: {
  bills: CustomerBillSummary[];
  tables: AdminTableSummary[];
}) {
  const activeTables = tables.filter((table) => table.isActive).length;
  const urgentTables = tables.filter(
    (table) => table.readyOrderCount > 0 || !table.deviceOnline
  ).length;
  const grossMinor = bills
    .filter((bill) => bill.status === "open")
    .reduce((sum, bill) => sum + bill.subtotalMinor, 0);

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-4">
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Serviste masa</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">{activeTables}</p>
      </article>
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Acil masa</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">{urgentTables}</p>
      </article>
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Acik hesap</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">
          {bills.filter((bill) => bill.status === "open").length}
        </p>
      </article>
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Acik ciro</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">
          {formatMoney(grossMinor, bills[0]?.currencyCode ?? "GBP")}
        </p>
      </article>
    </section>
  );
}

function PaymentQueue({
  bills
}: {
  bills: CustomerBillSummary[];
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        Payment Queue
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Kapatilmaya hazir hesaplar</h2>
      <div className="mt-5 grid gap-3">
        {bills.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Acik hesap kuyrugu bos.
          </p>
        ) : (
          bills.map((bill) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-4"
              key={bill.id}
            >
              <div>
                <p className="font-semibold text-stone-950">
                  Masa {bill.tableNumber.toString().padStart(3, "0")} • {bill.tableName}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {formatMoney(bill.subtotalMinor, bill.currencyCode)} • {bill.orderCount} siparis
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                {bill.status}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FloorCashTabs({
  current,
  onChange
}: {
  current: FloorCashView;
  onChange: (view: FloorCashView) => void;
}) {
  const tabs: Array<{ id: FloorCashView; label: string }> = [
    { id: "floor", label: "Floor" },
    { id: "open-checks", label: "Open Checks" },
    { id: "payment-queue", label: "Payment Queue" },
    { id: "closed-checks", label: "Closed Checks" }
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            current === tab.id
              ? "bg-[#16392e] text-white"
              : "border border-stone-300 bg-white text-stone-700 hover:border-stone-950 hover:text-stone-950"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ChecksPanel({
  bills,
  mode
}: {
  bills: CustomerBillSummary[];
  mode: "open" | "closed";
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        {mode === "open" ? "Open Checks" : "Closed Checks"}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        {mode === "open" ? "Acilik ve kapanis bekleyen hesaplar" : "Kapanan hesap gecmisi"}
      </h2>
      <div className="mt-5 grid gap-3">
        {bills.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            {mode === "open" ? "Acik hesap yok." : "Kapanmis hesap kaydi yok."}
          </p>
        ) : (
          bills.map((bill) => (
            <article
              className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4"
              key={bill.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-950">
                    Masa {bill.tableNumber.toString().padStart(3, "0")} • {bill.tableName}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {formatMoney(bill.subtotalMinor, bill.currencyCode)} • {bill.orderCount} siparis
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    mode === "open"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {bill.status}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-3">
                <p>Acilis: {formatDateTime(bill.openedAt)}</p>
                <p>Kapanis: {formatDateTime(bill.closedAt)}</p>
                <p>Kayit: #{bill.id.slice(0, 8)}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function MoveMergePanel({ table }: { table: AdminTableSummary }) {
  return (
    <section className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        Masa Hareketleri
      </p>
      <p className="mt-2 text-sm text-stone-700">
        Masa {table.number.toString().padStart(3, "0")} icin tasima ve birlestirme akisi bu sprintte
        gorunur hale getirildi. Bir sonraki backend adiminda secili hedef masa ile islenecek.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
          type="button"
        >
          Masayi tasi
        </button>
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
          type="button"
        >
          Masalari birlestir
        </button>
      </div>
    </section>
  );
}

function ActionRail({
  queueBills,
  tables
}: {
  queueBills: CustomerBillSummary[];
  tables: AdminTableSummary[];
}) {
  const urgentTables = tables.filter((table) => table.readyOrderCount > 0 || !table.deviceOnline);

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            Operasyon Nabzi
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Hemen aksiyon gerektirenler</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-950">Servis / cihaz aksiyonu</p>
          <div className="mt-3 grid gap-2">
            {urgentTables.length === 0 ? (
              <p className="text-sm text-stone-600">Acil masa yok.</p>
            ) : (
              urgentTables.slice(0, 5).map((table) => (
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3" key={table.id}>
                  <div>
                    <p className="font-semibold text-stone-950">
                      Masa {table.number.toString().padStart(3, "0")} • {table.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">{tableUrgency(table).label}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tableUrgency(table).tone}`}>
                    Aksiyon
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-950">Kapanis kuyrugu</p>
          <div className="mt-3 grid gap-2">
            {queueBills.length === 0 ? (
              <p className="text-sm text-stone-600">Kapanisa hazir hesap yok.</p>
            ) : (
              queueBills.slice(0, 5).map((bill) => (
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3" key={bill.id}>
                  <div>
                    <p className="font-semibold text-stone-950">
                      Masa {bill.tableNumber.toString().padStart(3, "0")} • {bill.tableName}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {formatMoney(bill.subtotalMinor, bill.currencyCode)} • {bill.orderCount} siparis
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Tahsilat
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedTablePanel({
  bill,
  device,
  orders,
  table
}: {
  bill?: CustomerBillSummary;
  device?: AdminDevice;
  orders: CustomerOrderSummary[];
  table: AdminTableSummary;
}) {
  const [state, action, pending] = useActionState(closeBillAction, initialState);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("nakit");

  return (
    <aside className="rounded-[0.75rem] border border-[#9eb8d6] bg-[#eef4fb] p-3 shadow-sm">
      <div className="border border-[#7ca4d8] bg-[#7ca4d8] px-3 py-2 text-sm font-bold text-white">
        Adisyon
      </div>
      <div className="mt-3 rounded-md border border-[#c7d7eb] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Secili masa
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
            Masa {table.number.toString().padStart(3, "0")}
          </h2>
          <p className="mt-2 text-sm text-stone-600">{table.name}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(table).tone}`}>
          {statusBadge(table).label}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Acik adisyon</p>
          <p className="mt-1 text-lg font-bold text-stone-950">
            {bill ? formatMoney(bill.subtotalMinor, bill.currencyCode) : "Yok"}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {bill ? `${bill.orderCount} siparis • ${formatDateTime(bill.openedAt)}` : "Bu masada acik hesap yok."}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Cihaz / QR durumu</p>
          <p className="mt-1 text-sm text-stone-600">
            {device
              ? device.deviceOnline
                ? "Cihaz online, masa QR akisi canli."
                : "Cihaz offline, takip gerektiriyor."
              : "Bu masa icin cihaz kaydi bulunmuyor."}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Odeme durumu</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Durum
              </p>
              <p className="mt-1 text-sm text-stone-700">
                {bill ? "Tahsilat bekliyor" : "Kapanacak hesap yok"}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Yontem
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["nakit", "kart", "transfer", "diger"] as PaymentMethod[]).map((option) => (
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      paymentMethod === option
                        ? "bg-[#16392e] text-white"
                        : "bg-stone-100 text-stone-700"
                    }`}
                    key={option}
                    onClick={() => setPaymentMethod(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Odeme yontemi simdilik operasyon notu niteliginde. Tahsilat manuel alinip hesap kapatilir.
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Canli siparisler</p>
          <div className="mt-3 grid gap-2">
            {orders.length === 0 ? (
              <p className="text-sm text-stone-600">Bu masaya bagli canli siparis yok.</p>
            ) : (
              orders.slice(0, 4).map((order) => (
                <div className="rounded-2xl bg-white px-4 py-3" key={order.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-stone-950">Siparis #{order.id.slice(0, 8)}</p>
                    <span className="text-xs text-stone-500">{order.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {formatMoney(order.subtotalMinor, order.currencyCode)} • {formatDateTime(order.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <MoveMergePanel table={table} />

        {bill ? (
          <form action={action}>
            <input name="billId" type="hidden" value={bill.id} />
            <div className="grid gap-3">
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-semibold text-emerald-900">Kapanis ozetı</p>
                <p className="mt-2 text-sm text-emerald-900">
                  {formatMoney(bill.subtotalMinor, bill.currencyCode)} tutarli hesap manuel olarak{" "}
                  <span className="font-semibold">{paymentMethod}</span> ile tahsil edildi olarak kapanacak.
                </p>
              </div>
              <button
                className="w-full rounded-full bg-[#16392e] px-4 py-3 text-sm font-semibold text-white"
                disabled={pending}
                type="submit"
              >
                Odeme alindi ve hesap kapat
              </button>
            </div>
          </form>
        ) : null}

        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
      </div>
    </aside>
  );
}

export function FloorCashWorkspace({
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
  const [selectedTableId, setSelectedTableId] = useState<string | null>(tables[0]?.id ?? null);
  const [view, setView] = useState<FloorCashView>("floor");
  const [selectedZone, setSelectedZone] = useState<FloorZoneKey | "all" | "open">("all");

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? tables[0];
  const selectedBill = bills.find((bill) => bill.tableId === selectedTable?.id && bill.status === "open");
  const selectedDevice = devices.find((device) => device.tableId === selectedTable?.id);
  const selectedOrders = useMemo(
    () => orders.filter((order) => order.tableId === selectedTable?.id),
    [orders, selectedTable?.id]
  );
  const openBills = bills.filter((bill) => bill.status === "open");
  const closedBills = bills.filter((bill) => bill.status !== "open");
  const queueBills = [...openBills].sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  const floorTables = [...tables].sort((a, b) => {
    const score = (table: AdminTableSummary) =>
      Number(!table.deviceOnline) * 5 +
      Number(table.readyOrderCount > 0) * 4 +
      (table.preparingOrderCount + table.submittedOrderCount > 0 ? 3 : 0) +
      Number(Boolean(table.openBillId));
    return score(b) - score(a) || a.number - b.number;
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f0e0bd,transparent_28rem),radial-gradient(circle_at_bottom_right,#dce7f0,transparent_30rem),linear-gradient(135deg,#f6f1e7,#e6e1d6)] px-6 py-8 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <section className="rounded-[0.75rem] border border-[#8fb0db] bg-[linear-gradient(180deg,#7ea8d9,#6492cb)] p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-100">
            Masa + Kasa
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Masa duzeni, adisyon ve kasa akisi</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-blue-50">
            AKINSOFT benzeri masa plani mantigini modern operasyon paneline ceviriyoruz:
            salon sekmeleri, masa yerlesimi, sag adisyon alani ve altta kapanis takibi.
          </p>
        </section>

        <ShiftSnapshot bills={bills} tables={tables} />

        <FloorCashTabs current={view} onChange={setView} />

        {view === "floor" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.78fr]">
            <FloorPlanBoard
              selectedTable={selectedTable}
              selectedZone={selectedZone}
              setSelectedTableId={setSelectedTableId}
              setSelectedZone={setSelectedZone}
              tables={floorTables}
            />

            {selectedTable ? (
              <SelectedTablePanel
                bill={selectedBill}
                device={selectedDevice}
                orders={selectedOrders}
                table={selectedTable}
              />
            ) : null}
          </section>
        ) : null}

        {view === "floor" ? (
          <section className="mt-6">
            <ActionRail queueBills={queueBills} tables={tables} />
          </section>
        ) : null}

        {view === "open-checks" ? (
          <section className="mt-6">
            <ChecksPanel bills={openBills} mode="open" />
          </section>
        ) : null}

        {view === "payment-queue" ? (
          <section className="mt-6">
            <PaymentQueue bills={queueBills} />
          </section>
        ) : null}

        {view === "closed-checks" ? (
          <section className="mt-6">
            <ChecksPanel bills={closedBills} mode="closed" />
          </section>
        ) : null}
      </section>
    </main>
  );
}
