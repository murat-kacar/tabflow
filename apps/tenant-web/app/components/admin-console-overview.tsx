"use client";

import type {
  AdminDevice,
  AdminTableSummary,
  CustomerBillSummary,
  ServiceStation,
  TenantCatalog
} from "@tabflow/shared-ts";
import Link from "next/link";

function toneForTable(table: AdminTableSummary): {
  label: string;
  tone: string;
} {
  if (!table.isActive) {
    return { label: "Pasif masa", tone: "border-stone-300 bg-stone-100 text-stone-700" };
  }

  if (!table.deviceOnline) {
    return { label: "Cihaz offline", tone: "border-rose-200 bg-rose-100 text-rose-700" };
  }

  if (table.readyOrderCount > 0) {
    return { label: "Servis bekliyor", tone: "border-emerald-200 bg-emerald-100 text-emerald-800" };
  }

  if (table.preparingOrderCount > 0 || table.submittedOrderCount > 0) {
    return { label: "Aktif siparis", tone: "border-amber-200 bg-amber-100 text-amber-800" };
  }

  if (table.openBillId) {
    return { label: "Acik hesap", tone: "border-stone-300 bg-stone-200 text-stone-800" };
  }

  return { label: "Sakin", tone: "border-stone-200 bg-stone-50 text-stone-600" };
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

function AttentionCard({
  detail,
  label,
  tone
}: {
  detail: string;
  label: string;
  tone: string;
}) {
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
    <Link className={`block rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${tone}`} href={href}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm opacity-90">{detail}</p>
    </Link>
  );
}

function SetupWorkspace({
  activeTableCount,
  activeStations,
  mappedCatalogItems
}: {
  activeTableCount: number;
  activeStations: number;
  mappedCatalogItems: number;
}) {
  const steps = [
    {
      href: "/service",
      label: "Masa ve kat plani",
      detail: `${activeTableCount} masa icin yerlesim, zone ve sabit obje duzenini ac.`,
      cta: "Masa + Kasa'ya git"
    },
    {
      href: "/console/stations",
      label: "Istasyon kurulumu",
      detail: `${activeStations} aktif istasyon var. Barista, bar, nargile ve mutfak hatlarini yonet.`,
      cta: "Istasyonlari yonet"
    },
    {
      href: "/console",
      label: "Katalog kapsami",
      detail: `${mappedCatalogItems} urun operasyon modelinde. Urun sihirbazi sonraki sertlestirme turunda ayrilacak.`,
      cta: "Console'da kal"
    }
  ];

  return (
    <section className="mt-6 rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            Kurulum Alani
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Isletme yapisini buradan sertlestir
          </h2>
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
  offlineDeviceCount
}: {
  activeStations: number;
  fallbackLikeStations: number;
  mappedCatalogItems: number;
  offlineDeviceCount: number;
}) {
  const checks = [
    {
      label: "Istasyon yapisi",
      ok: activeStations > 0,
      detail: activeStations > 0 ? `${activeStations} aktif istasyon tanimli.` : "En az bir aktif istasyon gerekli."
    },
    {
      label: "Fallback guvencesi",
      ok: fallbackLikeStations > 0,
      detail:
        fallbackLikeStations > 0
          ? "Genel fallback istasyonu hazir."
          : "Urunlerin bosluga dusmemesi icin fallback station tanimlanmali."
    },
    {
      label: "Katalog kapsami",
      ok: mappedCatalogItems > 0,
      detail:
        mappedCatalogItems > 0
          ? `${mappedCatalogItems} urun operasyon modeline bagli.`
          : "Henuz urun baglantisi yok."
    },
    {
      label: "Cihaz guveni",
      ok: offlineDeviceCount === 0,
      detail:
        offlineDeviceCount === 0
          ? "Tum masa cihazlari online."
          : `${offlineDeviceCount} cihaz icin saha takibi gerekli.`
    }
  ];

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        Setup Pulse
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Kurulumun zayif halkalari</h2>
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
                {check.ok ? "Tamam" : "Takip"}
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
  tables
}: {
  bills: CustomerBillSummary[];
  catalog: TenantCatalog;
  devices: AdminDevice[];
  stations: ServiceStation[];
  tables: AdminTableSummary[];
}) {
  const activeTableCount = tables.filter((table) => table.isActive).length;
  const openBillCount = bills.filter((bill) => bill.status === "open").length;
  const readyOrderCount = tables.reduce((sum, table) => sum + table.readyOrderCount, 0);
  const offlineDeviceCount = devices.filter((device) => !device.deviceOnline).length;
  const fallbackLikeStations = stations.filter((station) => station.code === "general").length;
  const hotTables = tables
    .filter(
      (table) =>
        table.readyOrderCount > 0 || !table.deviceOnline || table.submittedOrderCount + table.preparingOrderCount > 0
    )
    .slice(0, 6);
  const activeStations = stations.filter((station) => station.isActive).length;
  const mappedCatalogItems = catalog.categories.reduce((sum, category) => sum + category.items.length, 0);
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
              Admin Console
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight">
              Isletmenin canli akisina yukaridan bakan yonetim merkezi
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50/85">
              Masa ve kasa operasyonu ayri akarken, burada istasyon sagligi, cihaz guveni,
              fallback durumu ve kurulum aksiyonlari tek yerde gorunur.
            </p>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              Kurulum Nabzi
            </p>
            <div className="mt-4 grid gap-3 text-sm text-stone-700">
              <div className="rounded-2xl bg-stone-50 px-4 py-4">
                <p className="font-semibold text-stone-950">Aktif istasyon</p>
                <p className="mt-1">{activeStations} istasyon canli akisa dahil.</p>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-4">
                <p className="font-semibold text-stone-950">Katalog kapsami</p>
                <p className="mt-1">{mappedCatalogItems} urun istasyon mantigiyla yonetiliyor.</p>
              </div>
              <div className="rounded-2xl bg-stone-50 px-4 py-4">
                <p className="font-semibold text-stone-950">Fallback durumu</p>
                <p className="mt-1">
                  {fallbackLikeStations > 0
                    ? "Genel fallback istasyonu tanimli."
                    : "Fallback istasyonu henuz tanimli degil."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Servise acik masalar"
            label="Aktif masa"
            value={activeTableCount}
          />
          <MetricCard detail="Kapanmamis hesap kayitlari" label="Acik hesap" value={openBillCount} />
          <MetricCard
            detail="Istasyonlardan servise hazir donen urunler"
            label="Hazir siparis"
            value={readyOrderCount}
          />
          <MetricCard
            detail="Takip gerektiren QR/PDA cihazlari"
            label="Offline cihaz"
            value={offlineDeviceCount}
          />
        </section>

        <SetupWorkspace
          activeStations={activeStations}
          activeTableCount={activeTableCount}
          mappedCatalogItems={mappedCatalogItems}
        />

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Dikkat Kuyrugu
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Hemen bakilmasi gereken durumlar
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {readyOrderCount > 0 ? (
                <AttentionCard
                  detail={`${readyOrderCount} kalem urun servise cikmayi bekliyor.`}
                  label="Hazir urun bekliyor"
                  tone="border-emerald-200 bg-emerald-50 text-emerald-900"
                />
              ) : null}
              {offlineDeviceCount > 0 ? (
                <AttentionCard
                  detail={`${offlineDeviceCount} masa cihazinda baglanti problemi var.`}
                  label="Offline cihaz var"
                  tone="border-rose-200 bg-rose-50 text-rose-900"
                />
              ) : null}
              {openBillCount > 0 ? (
                <AttentionCard
                  detail={`${openBillCount} hesap acik durumda ve kasa takibi gerektiriyor.`}
                  label="Acik hesap takibi"
                  tone="border-amber-200 bg-amber-50 text-amber-900"
                />
              ) : null}
              {fallbackLikeStations === 0 ? (
                <AttentionCard
                  detail="Urunlerin boslukta kalmamasi icin bir fallback station tanimlanmali."
                  label="Fallback eksik"
                  tone="border-stone-300 bg-stone-100 text-stone-900"
                />
              ) : null}
            </div>
          </section>

          <SetupPulse
            activeStations={activeStations}
            fallbackLikeStations={fallbackLikeStations}
            mappedCatalogItems={mappedCatalogItems}
            offlineDeviceCount={offlineDeviceCount}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              Quick Actions
            </p>
            <div className="mt-5 grid gap-3">
              <QuickActionCard
                detail={`${offlineDeviceCount} cihaz saha kontrolu bekliyor. Device rail sonraki sprintte ayrisacak.`}
                href="/service"
                title="Device health takip et"
                tone="border-rose-200 bg-rose-50 text-rose-900"
              />
              <QuickActionCard
                detail={`${totalSubmitted} yeni ve ${totalPreparing} hazirlanan kalem station board ile birlikte kapanacak.`}
                href="/stations"
                title="Istasyon yogunlugunu incele"
                tone="border-amber-200 bg-amber-50 text-amber-900"
              />
              <QuickActionCard
                detail={`${(totalOpenRevenue / 100).toFixed(2)} ${currencyCode} acik ciro service yuzeyinde kasaya aktarilmayi bekliyor.`}
                href="/service"
                title="Masa + Kasa kuyruğunu ac"
                tone="border-emerald-200 bg-emerald-50 text-emerald-900"
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Sicak Masalar
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  En cok dikkat isteyen masa akislari
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {hotTables.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
                  Su an dikkat gerektiren masa yok.
                </p>
              ) : (
                hotTables.map((table) => {
                  const tone = toneForTable(table);

                  return (
                    <article
                      className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5"
                      key={table.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                            Masa {table.number.toString().padStart(3, "0")}
                          </p>
                          <p className="mt-2 text-xl font-bold tracking-tight text-stone-950">
                            {table.name}
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.tone}`}>
                          {tone.label}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-stone-500">Hazir</p>
                          <p className="mt-1 text-lg font-semibold text-stone-950">
                            {table.readyOrderCount}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-stone-500">Acik hesap</p>
                          <p className="mt-1 text-lg font-semibold text-stone-950">
                            {table.openBillId ? "Var" : "Yok"}
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
                Istasyon Sagligi
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Uretim hatlarinin canli durumu
              </h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stations.length === 0 ? (
              <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
                Henuz istasyon tanimi yok.
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
                      {station.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-stone-500">Sira</p>
                      <p className="mt-1 font-semibold text-stone-950">{station.sortOrder}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-stone-500">Rol</p>
                      <p className="mt-1 font-semibold text-stone-950">
                        {station.code === "general" ? "Fallback" : "Uretim"}
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
