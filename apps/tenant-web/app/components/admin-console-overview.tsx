"use client";

import type {
  AdminDevice,
  AdminTableSummary,
  CustomerBillSummary,
  ServiceStation,
  TenantCatalog
} from "@tabflow/shared-ts";
import Link from "next/link";
import type { Dictionary } from "../i18n/server";
import { formatMoney } from "../lib/format";

type ConsoleCopy = Dictionary["console"];
type CommonCopy = Dictionary["common"];

function toneForTable(
  table: AdminTableSummary,
  t: ConsoleCopy
): {
  label: string;
  tone: string;
} {
  if (!table.isActive) {
    return { label: t.tableToneInactive, tone: "border-stone-300 bg-stone-100 text-stone-700" };
  }

  if (!table.deviceOnline) {
    return { label: t.tableToneDeviceOffline, tone: "border-rose-200 bg-rose-100 text-rose-700" };
  }

  if (table.readyOrderCount > 0) {
    return {
      label: t.tableToneServiceWaiting,
      tone: "border-emerald-200 bg-emerald-100 text-emerald-800"
    };
  }

  if (table.preparingOrderCount > 0 || table.submittedOrderCount > 0) {
    return { label: t.tableToneActiveOrder, tone: "border-amber-200 bg-amber-100 text-amber-800" };
  }

  if (table.openBillId) {
    return { label: t.tableToneOpenBill, tone: "border-stone-300 bg-stone-200 text-stone-800" };
  }

  return { label: t.tableToneQuiet, tone: "border-stone-200 bg-stone-50 text-stone-600" };
}

function MetricCard({
  label,
  value,
  detail
}: {
  detail: string;
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white/95 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{value}</p>
      <p className="mt-2 text-sm text-stone-600">{detail}</p>
    </article>
  );
}

function AttentionCard({ detail, label, tone }: { detail: string; label: string; tone: string }) {
  return (
    <article className={`rounded-[1.5rem] border p-4 ${tone}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm opacity-90">{detail}</p>
    </article>
  );
}

function QuickActionCard({
  detail,
  href,
  title,
  tone
}: {
  detail: string;
  href: string;
  title: string;
  tone: string;
}) {
  return (
    <Link
      className={`block rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${tone}`}
      href={href}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm opacity-90">{detail}</p>
    </Link>
  );
}

function SetupWorkspace({
  activeTableCount,
  activeStations,
  mappedCatalogItems,
  t
}: {
  activeTableCount: number;
  activeStations: number;
  mappedCatalogItems: number;
  t: ConsoleCopy;
}) {
  const steps = [
    {
      href: "/service",
      label: t.setupFloorPlan,
      detail: `${activeTableCount} ${t.setupFloorPlanDetail}`,
      cta: t.setupFloorPlanCta
    },
    {
      href: "/console/stations",
      label: t.setupStations,
      detail: `${activeStations} ${t.setupStationsDetail}`,
      cta: t.setupStationsCta
    },
    {
      href: "/console/catalog",
      label: t.setupCatalog,
      detail: `${mappedCatalogItems} ${t.setupCatalogDetail}`,
      cta: t.setupCatalogCta
    }
  ];

  return (
    <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            {t.setupWorkspaceEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{t.setupWorkspaceTitle}</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (
          <Link
            className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-sm"
            href={step.href}
            key={step.label}
          >
            <p className="text-lg font-bold tracking-tight text-stone-950">{step.label}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">{step.detail}</p>
            <span className="mt-4 inline-flex rounded-full bg-[#16392e] px-4 py-2 text-sm font-semibold text-white">
              {step.cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SetupPulse({
  activeStations,
  fallbackLikeStations,
  mappedCatalogItems,
  offlineDeviceCount,
  common,
  t
}: {
  activeStations: number;
  fallbackLikeStations: number;
  mappedCatalogItems: number;
  offlineDeviceCount: number;
  common: CommonCopy;
  t: ConsoleCopy;
}) {
  const checks = [
    {
      label: t.checkStationStructure,
      ok: activeStations > 0,
      detail:
        activeStations > 0 ? `${activeStations} ${t.checkStationReady}` : t.checkStationMissing
    },
    {
      label: t.checkFallback,
      ok: fallbackLikeStations > 0,
      detail: fallbackLikeStations > 0 ? t.checkFallbackReady : t.checkFallbackMissing
    },
    {
      label: t.catalogCoverageTitle,
      ok: mappedCatalogItems > 0,
      detail:
        mappedCatalogItems > 0
          ? `${mappedCatalogItems} ${t.checkCatalogReady}`
          : t.checkCatalogMissing
    },
    {
      label: t.checkDeviceTrust,
      ok: offlineDeviceCount === 0,
      detail:
        offlineDeviceCount === 0
          ? t.checkDeviceReady
          : `${offlineDeviceCount} ${t.checkDeviceMissing}`
    }
  ];

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        {t.setupPulseEyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">{t.setupPulseTitle}</h2>
      <div className="mt-5 grid gap-3">
        {checks.map((check) => (
          <article
            className={`rounded-[1.4rem] border px-4 py-4 ${
              check.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
            key={check.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{check.label}</p>
                <p className="mt-1 text-sm opacity-90">{check.detail}</p>
              </div>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
                {check.ok ? common.setupComplete : common.setupRequired}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminConsoleOverview({
  catalog,
  bills,
  devices,
  stations,
  tables,
  t
}: {
  bills: CustomerBillSummary[];
  catalog: TenantCatalog;
  devices: AdminDevice[];
  stations: ServiceStation[];
  tables: AdminTableSummary[];
  t: Dictionary;
}) {
  const activeTableCount = tables.filter((table) => table.isActive).length;
  const openBillCount = bills.filter((bill) => bill.status === "open").length;
  const readyOrderCount = tables.reduce((sum, table) => sum + table.readyOrderCount, 0);
  const offlineDeviceCount = devices.filter((device) => !device.deviceOnline).length;
  const fallbackLikeStations = stations.filter((station) => station.code === "general").length;
  const hotTables = tables
    .filter(
      (table) =>
        table.readyOrderCount > 0 ||
        !table.deviceOnline ||
        table.submittedOrderCount + table.preparingOrderCount > 0
    )
    .slice(0, 6);
  const activeStations = stations.filter((station) => station.isActive).length;
  const mappedCatalogItems = catalog.categories.reduce(
    (sum, category) => sum + category.items.length,
    0
  );
  const totalSubmitted = tables.reduce((sum, table) => sum + table.submittedOrderCount, 0);
  const totalPreparing = tables.reduce((sum, table) => sum + table.preparingOrderCount, 0);
  const totalOpenRevenue = bills
    .filter((bill) => bill.status === "open")
    .reduce((sum, bill) => sum + bill.subtotalMinor, 0);
  const currencyCode = bills[0]?.currencyCode ?? "GBP";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f3e5c8,transparent_28rem),radial-gradient(circle_at_bottom_right,#dce9df,transparent_30rem),linear-gradient(135deg,#f7f3ec,#ebe5d8)] px-6 py-8 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-[2rem] border border-black/10 bg-[#19352d] p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">
              {t.console.heroEyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight">
              {t.console.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50/85">
              {t.console.heroBody}
            </p>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.console.setupSummaryEyebrow}
            </p>
            <div className="mt-4 grid gap-3 text-sm text-stone-700">
              <div className="rounded-2xl bg-stone-50 px-4 py-4">
                <p className="font-semibold text-stone-950">{t.console.activeStationsTitle}</p>
                <p className="mt-1">
                  {activeStations} {t.console.activeStationsDetail}
                </p>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-4">
                <p className="font-semibold text-stone-950">{t.console.catalogCoverageTitle}</p>
                <p className="mt-1">
                  {mappedCatalogItems} {t.console.catalogCoverageDetail}
                </p>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-4">
                <p className="font-semibold text-stone-950">{t.console.fallbackStatusTitle}</p>
                <p className="mt-1">
                  {fallbackLikeStations > 0 ? t.console.fallbackReady : t.console.fallbackMissing}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={t.console.metricActiveTablesDetail}
            label={t.console.metricActiveTables}
            value={activeTableCount}
          />
          <MetricCard
            detail={t.console.metricOpenBillsDetail}
            label={t.console.metricOpenBills}
            value={openBillCount}
          />
          <MetricCard
            detail={t.console.metricReadyOrdersDetail}
            label={t.console.metricReadyOrders}
            value={readyOrderCount}
          />
          <MetricCard
            detail={t.console.metricOfflineDevicesDetail}
            label={t.console.metricOfflineDevices}
            value={offlineDeviceCount}
          />
        </section>

        <SetupWorkspace
          activeStations={activeStations}
          activeTableCount={activeTableCount}
          mappedCatalogItems={mappedCatalogItems}
          t={t.console}
        />

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                  {t.console.attentionEyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {t.console.attentionTitle}
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {readyOrderCount > 0 ? (
                <AttentionCard
                  detail={`${readyOrderCount} ${t.console.attentionReadyDetail}`}
                  label={t.console.attentionReadyLabel}
                  tone="border-emerald-200 bg-emerald-50 text-emerald-900"
                />
              ) : null}
              {offlineDeviceCount > 0 ? (
                <AttentionCard
                  detail={`${offlineDeviceCount} ${t.console.attentionOfflineDetail}`}
                  label={t.console.attentionOfflineLabel}
                  tone="border-rose-200 bg-rose-50 text-rose-900"
                />
              ) : null}
              {openBillCount > 0 ? (
                <AttentionCard
                  detail={`${openBillCount} ${t.console.attentionOpenBillDetail}`}
                  label={t.console.attentionOpenBillLabel}
                  tone="border-amber-200 bg-amber-50 text-amber-900"
                />
              ) : null}
              {fallbackLikeStations === 0 ? (
                <AttentionCard
                  detail={t.console.attentionFallbackDetail}
                  label={t.console.attentionFallbackLabel}
                  tone="border-stone-300 bg-stone-100 text-stone-900"
                />
              ) : null}
            </div>
          </section>

          <SetupPulse
            activeStations={activeStations}
            common={t.common}
            fallbackLikeStations={fallbackLikeStations}
            mappedCatalogItems={mappedCatalogItems}
            offlineDeviceCount={offlineDeviceCount}
            t={t.console}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.console.quickActionsEyebrow}
            </p>
            <div className="mt-5 grid gap-3">
              <QuickActionCard
                detail={`${offlineDeviceCount} ${t.console.quickDeviceDetail}`}
                href="/service"
                title={t.console.quickDeviceTitle}
                tone="border-rose-200 bg-rose-50 text-rose-900"
              />
              <QuickActionCard
                detail={`${totalSubmitted} / ${totalPreparing} ${t.console.quickStationDetail}`}
                href="/stations"
                title={t.console.quickStationTitle}
                tone="border-amber-200 bg-amber-50 text-amber-900"
              />
              <QuickActionCard
                detail={`${formatMoney(totalOpenRevenue, currencyCode)} ${t.console.quickCashDetail}`}
                href="/service"
                title={t.console.quickCashTitle}
                tone="border-emerald-200 bg-emerald-50 text-emerald-900"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                  {t.console.hotTablesEyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {t.console.hotTablesTitle}
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {hotTables.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
                  {t.console.hotTablesEmpty}
                </p>
              ) : (
                hotTables.map((table) => {
                  const tone = toneForTable(table, t.console);

                  return (
                    <article
                      className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5"
                      key={table.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            {t.console.tableLabel} {table.number.toString().padStart(3, "0")}
                          </p>
                          <p className="mt-2 text-xl font-bold tracking-tight text-stone-950">
                            {table.name}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.tone}`}
                        >
                          {tone.label}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-stone-500">{t.console.readyShort}</p>
                          <p className="mt-1 text-lg font-semibold text-stone-950">
                            {table.readyOrderCount}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-stone-500">{t.console.openBillShort}</p>
                          <p className="mt-1 text-lg font-semibold text-stone-950">
                            {table.openBillId ? t.common.yes : t.common.no}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </section>

        <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                {t.console.stationHealthEyebrow}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {t.console.stationHealthTitle}
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stations.length === 0 ? (
              <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
                {t.console.stationHealthEmpty}
              </p>
            ) : (
              stations.map((station) => (
                <article
                  className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5"
                  key={station.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: station.colorHex }}
                      />
                      <div>
                        <p className="font-semibold text-stone-950">{station.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                          {station.code}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        station.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {station.isActive ? t.common.active : t.common.passive}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-stone-500">{t.console.sortOrder}</p>
                      <p className="mt-1 font-semibold text-stone-950">{station.sortOrder}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-stone-500">{t.console.role}</p>
                      <p className="mt-1 font-semibold text-stone-950">
                        {station.code === "general" ? t.common.fallback : t.common.production}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
