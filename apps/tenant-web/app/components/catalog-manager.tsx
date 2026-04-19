import type { MenuCategorySummary, ServiceStation, TenantCatalog } from "@tabflow/shared-ts";
import { createCategoryAction, createItemAction } from "../auth-actions";

function formatMoney(minor: number, currencyCode: string): string {
  return `${(minor / 100).toFixed(2)} ${currencyCode}`;
}

function stationName(stations: ServiceStation[], stationId: string | null): string {
  return stations.find((station) => station.id === stationId)?.name ?? "Fallback / kategori";
}

function StationCoverage({
  catalog,
  stations
}: {
  catalog: TenantCatalog;
  stations: ServiceStation[];
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
        Station Coverage
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Urunlerin üretim hatlarına dağılımı</h2>
      <div className="mt-5 grid gap-3">
        {stations.map((station) => {
          const stationItems = items.filter((item) => item.effectiveStationId === station.id);
          return (
            <article className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4" key={station.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: station.colorHex }} />
                  <div>
                    <p className="font-semibold text-stone-950">{station.name}</p>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">
                      {station.code}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                  {stationItems.length} ürün
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
              <p className="font-semibold">Fallback / atanmamış</p>
              <p className="mt-1 text-sm opacity-90">
                {fallbackItems.length > 0
                  ? "Bu ürünler Station Board routing için netleştirilmeli."
                  : "Tüm ürünler bir istasyona bağlanmış görünüyor."}
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
  stations
}: {
  category: MenuCategorySummary;
  stations: ServiceStation[];
}) {
  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm" key={category.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-stone-950">{category.name}</h3>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-stone-500">{category.slug}</p>
          <p className="mt-2 text-sm text-stone-600">
            Kategori default istasyonu: {category.stationName ?? "Yok"}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {category.items.length} ürün
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {category.items.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Bu kategoride ürün yok.
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
                  İstasyon: {item.stationName ?? stationName(stations, category.stationId)}
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
  stations
}: {
  catalog: TenantCatalog;
  stations: ServiceStation[];
}) {
  const itemCount = catalog.categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f3e5c8,transparent_28rem),radial-gradient(circle_at_bottom_right,#dbe9ef,transparent_30rem),linear-gradient(135deg,#f7f3ec,#ebe5d8)] px-6 py-8 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-black/10 bg-[#19352d] p-8 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">
            Catalog
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight">
            Ürünleri doğrudan istasyon akışına bağlayan katalog sihirbazı
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-emerald-50/85">
            Ürün eklerken hangi üretim hattına düşeceği net seçilir. Kategori istasyonu default
            kapsama sağlar, ürün istasyonu ise Station Board routing için asıl karardır.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Kategori</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{catalog.categories.length}</p>
          </article>
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Ürün</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{itemCount}</p>
          </article>
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">İstasyon</p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">{stations.length}</p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_25rem]">
          <div className="grid gap-4">
            {catalog.categories.map((category) => (
              <CategoryCard category={category} key={category.id} stations={stations} />
            ))}
          </div>
          <StationCoverage catalog={catalog} stations={stations} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <form
            action={createCategoryAction}
            className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              Kategori sihirbazı
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Default istasyon kapsaması</h2>
            <div className="mt-5 grid gap-3">
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" name="name" placeholder="Kategori adı" required />
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" name="slug" placeholder="kategori-slug" required />
              <select className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" defaultValue="" name="stationId">
                <option value="">Default istasyon seç</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" defaultValue={0} name="sortOrder" type="number" />
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input defaultChecked name="isActive" type="checkbox" />
                Aktif
              </label>
            </div>
            <button className="mt-5 rounded-full bg-[#16392e] px-5 py-3 text-sm font-semibold text-white" type="submit">
              Kategori ekle
            </button>
          </form>

          <form
            action={createItemAction}
            className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              Ürün sihirbazı
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Ürün &gt; istasyon routing</h2>
            <div className="mt-5 grid gap-3">
              <select className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" name="categoryId" required>
                {catalog.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" defaultValue="" name="stationId">
                <option value="">Kategori default istasyonunu kullan</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" name="name" placeholder="Ürün adı" required />
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" name="sku" placeholder="urun-sku" required />
              <textarea className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" name="description" placeholder="Açıklama" rows={3} />
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" defaultValue={1000} name="priceMinor" type="number" />
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" defaultValue="GBP" maxLength={3} name="currencyCode" required />
              <input className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3" defaultValue={0} name="sortOrder" type="number" />
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input defaultChecked name="isAvailable" type="checkbox" />
                Mevcut
              </label>
            </div>
            <button className="mt-5 rounded-full bg-[#16392e] px-5 py-3 text-sm font-semibold text-white" type="submit">
              Ürün ekle
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
