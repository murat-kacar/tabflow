import type {
  AdminDevice,
  AdminTableSummary,
  CustomerBillSummary,
  CustomerOrderSummary,
  ServiceStation,
  TenantCatalog
} from "@yenicafe/shared-ts";
import { BillManager } from "./bill-manager";
import { CatalogManager } from "./catalog-manager";
import { DeviceManager } from "./device-manager";
import { OrderManager } from "./order-manager";
import { StationManager } from "./station-manager";
import { TableOperationsBoard } from "./table-operations-board";

export function TenantAdminDashboard({
  catalog,
  bills,
  devices,
  email,
  orders,
  stations,
  tables
}: {
  catalog: TenantCatalog;
  bills: CustomerBillSummary[];
  devices: AdminDevice[];
  email: string;
  orders: CustomerOrderSummary[];
  stations: ServiceStation[];
  tables: AdminTableSummary[];
}) {
  const openBillCount = tables.filter((table) => table.openBillId).length;
  const offlineDeviceCount = tables.filter((table) => table.isActive && !table.deviceOnline).length;
  const hotTableCount = tables.filter(
    (table) => table.submittedOrderCount + table.preparingOrderCount + table.readyOrderCount > 0
  ).length;
  const readyOrderCount = tables.reduce((total, table) => total + table.readyOrderCount, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#efe2c4,transparent_32rem),linear-gradient(135deg,#f8f5ed,#e5ece7)] px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-black/10 bg-white/70 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
            Tenant Control
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Masa plani merkezli operasyon ekrani
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-stone-700">
                Isletmenin canli nabzini masalar uzerinden izle. Yogun masalari, acik hesaplari,
                hazir siparisleri ve offline cihazlari tek bakista gor.
              </p>
            </div>
            <div className="rounded-2xl bg-stone-950 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Aktif admin</p>
              <p className="mt-1 text-sm">{email}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Aktif masa
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{tables.length}</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Acik hesap
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{openBillCount}</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Hazir siparis
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
              {readyOrderCount}
            </p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
              Offline cihaz
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
              {offlineDeviceCount}
            </p>
          </article>
        </section>

        <section className="mt-6 rounded-[2rem] border border-stone-200 bg-[#17231e] px-6 py-5 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
                Operasyon notu
              </p>
              <p className="mt-2 text-lg text-stone-100">
                Su anda {hotTableCount} masa uzerinde aktif siparis akisi var. Hazir siparis sayisi{" "}
                {readyOrderCount}, cihaz takibi gereken masa sayisi {offlineDeviceCount}.
              </p>
            </div>
          </div>
        </section>

        <TableOperationsBoard bills={bills} devices={devices} orders={orders} tables={tables} />
        <OrderManager orders={orders} />
        <StationManager stations={stations} />
        <CatalogManager catalog={catalog} stations={stations} />
        <BillManager bills={bills} />
        <DeviceManager devices={devices} />
      </section>
    </main>
  );
}
