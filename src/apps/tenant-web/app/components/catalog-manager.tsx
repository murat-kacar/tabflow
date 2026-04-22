import type { MenuCategorySummary, ServiceStation, TenantCatalog } from "@tabflow/shared-ts";
import { createCategoryAction, createItemAction } from "../auth-actions";
import type { Dictionary } from "../i18n/server";
import { formatMoney } from "../lib/format";

function stationName(
  stations: ServiceStation[],
  stationId: string | null,
  fallbackLabel: string
): string {
  return stations.find((station) => station.id === stationId)?.name ?? fallbackLabel;
}

function StationCoverage({
  catalog,
  stations,
  t
}: {
  catalog: TenantCatalog;
  stations: ServiceStation[];
  t: Dictionary["catalogManager"];
}) {
  const items = catalog.categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryName: category.name,
      effectiveStationId: item.stationId ?? category.stationId,
      effectiveStationName: item.stationName ?? category.stationName
    }))
  );
  const fallbackItems = items.filter((item) => !item.effectiveStationId);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        {t.stationCoverageEyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">{t.stationCoverageTitle}</h2>
      <div className="mt-5 grid gap-3">
        {stations.map((station) => {
          const stationItems = items.filter((item) => item.effectiveStationId === station.id);
          return (
            <article
              className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4"
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
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">
                      {station.code}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                  {stationItems.length} {t.itemCount}
                </span>
              </div>
            </article>
          );
        })}
        <article
          className={`rounded-[1.4rem] border p-4 ${
            fallbackItems.length > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t.fallbackLabel}</p>
              <p className="mt-1 text-sm opacity-90">
                {fallbackItems.length > 0 ? t.fallbackNeedsRouting : t.fallbackComplete}
              </p>
            </div>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
              {fallbackItems.length}
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  stations,
  t
}: {
  category: MenuCategorySummary;
  stations: ServiceStation[];
  t: Dictionary["catalogManager"];
}) {
  return (
    <article
      className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
      key={category.id}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-stone-950">{category.name}</h3>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-stone-500">
            {category.slug}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {t.categoryDefaultStation} {category.stationName ?? t.none}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {category.items.length} {t.itemCount}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {category.items.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            {t.emptyCategory}
          </p>
        ) : (
          category.items.map((item) => (
            <div
              className="grid gap-3 rounded-2xl bg-stone-50 px-4 py-3 sm:grid-cols-[1fr_auto]"
              key={item.id}
            >
              <div>
                <p className="font-semibold text-stone-950">{item.name}</p>
                <p className="mt-1 text-xs text-stone-500">{item.sku}</p>
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                  {t.stationLabel}{" "}
                  {item.stationName ?? stationName(stations, category.stationId, t.stationFallback)}
                </p>
              </div>
              <p className="text-sm font-bold text-stone-800">
                {formatMoney(item.priceMinor, item.currencyCode)}
              </p>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

export function CatalogManager({
  catalog,
  stations,
  t
}: {
  catalog: TenantCatalog;
  stations: ServiceStation[];
  t: Dictionary;
}) {
  const itemCount = catalog.categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f3e5c8,transparent_28rem),radial-gradient(circle_at_bottom_right,#dbe9ef,transparent_30rem),linear-gradient(135deg,#f7f3ec,#ebe5d8)] px-6 py-8 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-black/10 bg-[#19352d] p-8 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">
            {t.catalogManager.heroEyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight">
            {t.catalogManager.heroTitle}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-emerald-50/85">
            {t.catalogManager.heroBody}
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.catalogManager.categoryMetric}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
              {catalog.categories.length}
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.catalogManager.itemMetric}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{itemCount}</p>
          </article>
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.catalogManager.stationMetric}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
              {stations.length}
            </p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_25rem]">
          <div className="grid gap-4">
            {catalog.categories.map((category) => (
              <CategoryCard
                category={category}
                key={category.id}
                stations={stations}
                t={t.catalogManager}
              />
            ))}
          </div>
          <StationCoverage catalog={catalog} stations={stations} t={t.catalogManager} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <form
            action={createCategoryAction}
            className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.catalogManager.categoryWizardEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {t.catalogManager.categoryWizardTitle}
            </h2>
            <div className="mt-5 grid gap-3">
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                name="name"
                placeholder={t.catalogManager.categoryNamePlaceholder}
                required
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                name="slug"
                placeholder={t.catalogManager.categorySlugPlaceholder}
                required
              />
              <select
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                defaultValue=""
                name="stationId"
              >
                <option value="">{t.catalogManager.defaultStationOption}</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                defaultValue={0}
                name="sortOrder"
                type="number"
              />
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input defaultChecked name="isActive" type="checkbox" />
                {t.common.active}
              </label>
            </div>
            <button
              className="mt-5 rounded-full bg-[#16392e] px-5 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              {t.catalogManager.addCategory}
            </button>
          </form>

          <form
            action={createItemAction}
            className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.catalogManager.itemWizardEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {t.catalogManager.itemWizardTitle}
            </h2>
            <div className="mt-5 grid gap-3">
              <select
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                name="categoryId"
                required
              >
                {catalog.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                defaultValue=""
                name="stationId"
              >
                <option value="">{t.catalogManager.useCategoryStationOption}</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                name="name"
                placeholder={t.catalogManager.itemNamePlaceholder}
                required
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                name="sku"
                placeholder={t.catalogManager.itemSkuPlaceholder}
                required
              />
              <textarea
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                name="description"
                placeholder={t.catalogManager.itemDescriptionPlaceholder}
                rows={3}
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                defaultValue={1000}
                name="priceMinor"
                type="number"
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                defaultValue="GBP"
                maxLength={3}
                name="currencyCode"
                required
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                defaultValue={0}
                name="sortOrder"
                type="number"
              />
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input defaultChecked name="isAvailable" type="checkbox" />
                {t.catalogManager.available}
              </label>
            </div>
            <button
              className="mt-5 rounded-full bg-[#16392e] px-5 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              {t.catalogManager.addItem}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
