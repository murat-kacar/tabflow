import type { ServiceStation, TenantCatalog } from "@tabflow/shared-ts";
import { createCategoryAction, createItemAction } from "../auth-actions";

function formatMoney(minor: number, currencyCode: string): string {
  return `${(minor / 100).toFixed(2)} ${currencyCode}`;
}

export function CatalogManager({
  catalog,
  stations
}: {
  catalog: TenantCatalog;
  stations: ServiceStation[];
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_26rem]">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Catalog</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Kategori ve urunler</h2>
        <div className="mt-5 space-y-4">
          {catalog.categories.map((category) => (
            <article className="rounded-2xl border border-stone-200 p-4" key={category.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-stone-950">{category.name}</h3>
                  <p className="font-mono text-xs text-stone-500">{category.slug}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Istasyon: {category.stationName ?? "Atanmamis"}
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                  {category.items.length} urun
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {category.items.map((item) => (
                  <div
                    className="flex flex-wrap items-center justify-between rounded-xl bg-stone-50 px-3 py-2"
                    key={item.id}
                  >
                    <div>
                      <p className="font-medium text-stone-900">{item.name}</p>
                      <p className="text-xs text-stone-500">{item.sku}</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-700">
                      {formatMoney(item.priceMinor, item.currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        <form
          action={createCategoryAction}
          className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            New Category
          </p>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              name="name"
              placeholder="Kategori adi"
              required
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              name="slug"
              placeholder="kategori-slug"
              required
            />
            <select
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              defaultValue=""
              name="stationId"
            >
              <option value="">Istasyon atama</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              defaultValue={0}
              name="sortOrder"
              type="number"
            />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input defaultChecked name="isActive" type="checkbox" />
              Aktif
            </label>
          </div>
          <button
            className="mt-4 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Kategori ekle
          </button>
        </form>

        <form
          action={createItemAction}
          className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            New Item
          </p>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              name="categoryId"
              required
            >
              {catalog.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              name="name"
              placeholder="Urun adi"
              required
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              name="sku"
              placeholder="urun-sku"
              required
            />
            <textarea
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              name="description"
              placeholder="Aciklama"
              rows={3}
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              defaultValue={1000}
              name="priceMinor"
              type="number"
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              defaultValue="GBP"
              maxLength={3}
              name="currencyCode"
              required
            />
            <input
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950"
              defaultValue={0}
              name="sortOrder"
              type="number"
            />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input defaultChecked name="isAvailable" type="checkbox" />
              Mevcut
            </label>
          </div>
          <button
            className="mt-4 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Urun ekle
          </button>
        </form>
      </div>
    </section>
  );
}
