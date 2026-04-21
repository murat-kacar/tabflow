"use client";

import type { MenuCategorySummary, MenuItemSummary, TenantCatalog } from "@tabflow/shared-ts";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  type CustomerOrderActionState,
  leaveCustomerSessionAction,
  submitCustomerOrderAction
} from "../customer-actions";
import type { Locale } from "../i18n/locales";
import type { Dictionary } from "../i18n/server";
import type { CustomerSession } from "../lib/customer-session";
import { formatMoney } from "../lib/format";

const initialState: CustomerOrderActionState = {
  ok: false,
  message: ""
};

type CustomerMenuCopy = Dictionary["customerMenu"];
type ThemeMode = "night" | "day";
const localeCookieName = "tabflow_customer_menu_locale";
const themeCookieName = "tabflow_customer_menu_theme";

const categoryThemes = [
  "from-amber-500/30 via-orange-400/10 to-transparent",
  "from-emerald-500/30 via-lime-400/10 to-transparent",
  "from-sky-500/30 via-cyan-400/10 to-transparent",
  "from-rose-500/30 via-fuchsia-400/10 to-transparent",
  "from-violet-500/30 via-indigo-400/10 to-transparent",
  "from-red-500/30 via-pink-400/10 to-transparent"
];

function categoryTheme(index: number): string {
  return categoryThemes[index % categoryThemes.length] ?? categoryThemes[0];
}

function itemTheme(index: number): string {
  return categoryThemes[(index + 2) % categoryThemes.length] ?? categoryThemes[0];
}

function categoryInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function itemPreviewLabel(item: MenuItemSummary): string {
  if (item.stationName) {
    return item.stationName;
  }

  if (item.description.trim().length > 0) {
    return item.description.trim().slice(0, 42);
  }

  return item.sku;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function detectLocale(initialLocale: Locale): Locale {
  const cookieValue = readCookie(localeCookieName);
  if (cookieValue === "tr" || cookieValue === "en") {
    return cookieValue;
  }

  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("tr")) {
    return "tr";
  }

  return initialLocale;
}

function detectTheme(): ThemeMode {
  const cookieValue = readCookie(themeCookieName);
  if (cookieValue === "night" || cookieValue === "day") {
    return cookieValue;
  }

  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "night";
  }

  return "day";
}

export function CustomerMenu({
  catalog,
  session,
  initialLocale,
  translations
}: {
  catalog: TenantCatalog;
  session: CustomerSession;
  initialLocale: Locale;
  translations: Record<Locale, CustomerMenuCopy>;
}) {
  const [orderState, submitAction, pending] = useActionState(submitCustomerOrderAction, initialState);
  const [locale, setLocale] = useState<Locale>(() => detectLocale(initialLocale));
  const [theme, setTheme] = useState<ThemeMode>(() => detectTheme());
  const [activeView, setActiveView] = useState<"menu" | "info">("menu");
  const [activeCategoryId, setActiveCategoryId] = useState<string>(catalog.categories[0]?.id ?? "");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [orderNote, setOrderNote] = useState("");
  const [checkoutToken, setCheckoutToken] = useState("");

  const t = translations[locale];
  const categories = catalog.categories;
  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? categories[0];
  const flatItems = useMemo(() => categories.flatMap((category) => category.items), [categories]);
  const selectedItem = flatItems.find((item) => item.id === selectedItemId) ?? null;
  const cartEntries = flatItems.filter((item) => (quantities[item.id] ?? 0) > 0);
  const totalMinor = cartEntries.reduce(
    (sum, item) => sum + item.priceMinor * (quantities[item.id] ?? 0),
    0
  );
  const currentCurrency = cartEntries[0]?.currencyCode ?? catalog.tenant.currencyCode;
  const heroCategoryCount = categories.length;
  const heroItemCount = flatItems.length;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.menuTheme = theme;
    return () => {
      delete root.dataset.menuTheme;
    };
  }, [theme]);

  useEffect(() => {
    writeCookie(localeCookieName, locale);
  }, [locale]);

  useEffect(() => {
    writeCookie(themeCookieName, theme);
  }, [theme]);

  const shellClass =
    theme === "night"
      ? "bg-[#111111] text-[#efe5d1]"
      : "bg-[#f6f0e1] text-[#241c12]";
  const panelClass =
    theme === "night"
      ? "border border-white/10 bg-[#1a1a1a]/90 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
      : "border border-[#dccfb8] bg-white/90 shadow-[0_20px_80px_rgba(98,74,37,0.15)]";
  const mutedClass = theme === "night" ? "text-[#b6aa92]" : "text-[#6e5a3f]";
  const softClass = theme === "night" ? "bg-white/5" : "bg-[#f4ead6]";
  const borderClass = theme === "night" ? "border-white/10" : "border-[#dccfb8]";
  const accentButtonClass =
    theme === "night"
      ? "bg-[#c9a84c] text-[#19130a] hover:bg-[#d8b55a]"
      : "bg-[#241c12] text-[#f5ecda] hover:bg-[#3a2c18]";
  const subtleButtonClass =
    theme === "night"
      ? "border border-white/10 bg-white/5 text-[#efe5d1] hover:bg-white/10"
      : "border border-[#d9c7aa] bg-white text-[#241c12] hover:bg-[#f7efe0]";

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${shellClass}`}
      style={{
        backgroundImage:
          theme === "night"
            ? "radial-gradient(circle at top left, rgba(201,168,76,0.18), transparent 26rem), linear-gradient(180deg, #121212 0%, #191919 48%, #101010 100%)"
            : "radial-gradient(circle at top left, rgba(201,168,76,0.18), transparent 24rem), linear-gradient(180deg, #fbf4e6 0%, #f3ead8 48%, #efe3cf 100%)"
      }}
    >
      <form action={submitAction}>
        <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-6 px-4 py-4 pb-28 sm:px-6 lg:px-8 lg:py-6 lg:pb-10">
          <header className={`overflow-hidden rounded-[2rem] ${panelClass}`}>
            <div className="grid gap-6 px-5 py-5 sm:px-8 sm:py-7 lg:grid-cols-[1.35fr_0.9fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] ${
                      theme === "night" ? "bg-white/8 text-[#c9a84c]" : "bg-[#efe2c4] text-[#8b6825]"
                    }`}
                  >
                    {session.tenantDisplayName}
                  </span>
                  <span className={`text-xs font-medium uppercase tracking-[0.24em] ${mutedClass}`}>
                    {t.sessionLabel} {session.tableNumber.toString().padStart(3, "0")}
                  </span>
                </div>
                <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
                  {t.heroTitlePrefix} {session.tableName}
                </h1>
                <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${mutedClass}`}>
                  {t.heroBody
                    .replace("{{tenant}}", session.tenantDisplayName)
                    .replace("{{table}}", session.tableName)}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${accentButtonClass}`}
                    onClick={() => setActiveView("menu")}
                    type="button"
                  >
                    {t.menuTab}
                  </button>
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${subtleButtonClass}`}
                    onClick={() => setActiveView("info")}
                    type="button"
                  >
                    {t.infoTab}
                  </button>
                  <button
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${subtleButtonClass}`}
                    formAction={leaveCustomerSessionAction}
                    type="submit"
                  >
                    {t.leaveSession}
                  </button>
                </div>
              </div>

              <div className={`grid gap-4 rounded-[1.5rem] p-4 ${softClass}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-[1.25rem] p-4 ${theme === "night" ? "bg-black/20" : "bg-white"}`}>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                      {t.metrics.categories}
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{heroCategoryCount}</p>
                  </div>
                  <div className={`rounded-[1.25rem] p-4 ${theme === "night" ? "bg-black/20" : "bg-white"}`}>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                      {t.metrics.items}
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{heroItemCount}</p>
                  </div>
                </div>
                <div className={`rounded-[1.25rem] p-4 ${theme === "night" ? "bg-black/20" : "bg-white"}`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                    {t.preferenceCardTitle}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {locale === "tr" ? t.turkish : t.english} • {theme === "night" ? t.nightMode : t.dayMode}
                  </p>
                  <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>{t.preferenceCardBody}</p>
                </div>
              </div>
            </div>
          </header>

          {activeView === "menu" ? (
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
              <aside className={`overflow-hidden rounded-[2rem] ${panelClass}`}>
                <div className={`border-b px-5 py-4 ${borderClass}`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                    {t.categoriesEyebrow}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">{t.categoriesTitle}</h2>
                </div>
                <div className="flex max-h-[70vh] flex-row gap-3 overflow-x-auto p-4 lg:flex-col lg:overflow-y-auto">
                  {categories.map((category, index) => {
                    const isActive = activeCategory?.id === category.id;
                    return (
                      <button
                        className={`group relative min-w-[138px] overflow-hidden rounded-[1.5rem] border p-3 text-left transition lg:min-w-0 ${
                          isActive
                            ? theme === "night"
                              ? "border-[#c9a84c] bg-white/8"
                              : "border-[#b99147] bg-[#fff6e5]"
                            : `${borderClass} ${theme === "night" ? "bg-white/5 hover:bg-white/8" : "bg-white hover:bg-[#fff9ef]"}`
                        }`}
                        key={category.id}
                        onClick={() => setActiveCategoryId(category.id)}
                        type="button"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${categoryTheme(index)} opacity-80`} />
                        <div className="relative">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold ${
                              theme === "night" ? "bg-black/30 text-[#f8edd4]" : "bg-white/80 text-[#6c4d18]"
                            }`}
                          >
                            {categoryInitials(category.name)}
                          </div>
                          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em]">
                            {category.name}
                          </p>
                          <p className={`mt-1 text-xs ${mutedClass}`}>{category.items.length} {t.itemsCount}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className={`overflow-hidden rounded-[2rem] ${panelClass}`}>
                <div className={`border-b px-5 py-4 sm:px-7 ${borderClass}`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                    {t.featuredEyebrow}
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-3xl font-semibold">{activeCategory?.name}</h2>
                      <p className={`mt-2 text-sm ${mutedClass}`}>
                        {t.categoryBody.replace("{{count}}", String(activeCategory?.items.length ?? 0))}
                      </p>
                    </div>
                    <div className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${softClass}`}>
                      {activeCategory?.stationName ?? t.stationFallback}
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                  {activeCategory?.items.map((item, index) => {
                    const quantity = quantities[item.id] ?? 0;
                    return (
                      <article
                        className={`overflow-hidden rounded-[1.75rem] border transition ${borderClass} ${
                          theme === "night" ? "bg-white/5" : "bg-white"
                        }`}
                        key={item.id}
                      >
                        <button
                          className={`relative flex h-44 w-full items-end overflow-hidden bg-gradient-to-br ${itemTheme(index)} p-4 text-left`}
                          onClick={() => setSelectedItemId(item.id)}
                          type="button"
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_10rem)]" />
                          <div
                            className={`relative inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              theme === "night" ? "bg-black/25 text-[#f7ebd0]" : "bg-white/80 text-[#6c4d18]"
                            }`}
                          >
                            {itemPreviewLabel(item)}
                          </div>
                        </button>
                        <div className="space-y-4 p-4">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-lg font-semibold">{item.name}</h3>
                              <span className="text-sm font-semibold">
                                {formatMoney(item.priceMinor, item.currencyCode)}
                              </span>
                            </div>
                            <p className={`mt-2 line-clamp-3 text-sm leading-6 ${mutedClass}`}>
                              {item.description || t.itemDescriptionFallback}
                            </p>
                          </div>
                          <div className="grid gap-3">
                            <input
                              className={`rounded-2xl border px-4 py-3 text-sm outline-none transition ${borderClass} ${
                                theme === "night"
                                  ? "bg-black/20 text-[#f3e7d3] placeholder:text-[#7f725f]"
                                  : "bg-[#fcf7ef] text-[#241c12] placeholder:text-[#8d7756]"
                              }`}
                              onChange={(event) =>
                                setNotes((current) => ({ ...current, [item.id]: event.target.value }))
                              }
                              placeholder={t.notePlaceholder}
                              value={notes[item.id] ?? ""}
                            />
                            <div className="flex items-center justify-between gap-3">
                              <div className={`inline-flex items-center gap-2 rounded-full px-2 py-2 ${softClass}`}>
                                <button
                                  className={`h-9 w-9 rounded-full text-lg font-semibold transition ${subtleButtonClass}`}
                                  onClick={() =>
                                    setQuantities((current) => ({
                                      ...current,
                                      [item.id]: Math.max(0, (current[item.id] ?? 0) - 1)
                                    }))
                                  }
                                  type="button"
                                >
                                  -
                                </button>
                                <span className="min-w-8 text-center text-sm font-semibold">{quantity}</span>
                                <button
                                  className={`h-9 w-9 rounded-full text-lg font-semibold transition ${subtleButtonClass}`}
                                  onClick={() =>
                                    setQuantities((current) => ({
                                      ...current,
                                      [item.id]: (current[item.id] ?? 0) + 1
                                    }))
                                  }
                                  type="button"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${accentButtonClass}`}
                                onClick={() =>
                                  setQuantities((current) => ({
                                    ...current,
                                    [item.id]: Math.max(1, (current[item.id] ?? 0) + 1)
                                  }))
                                }
                                type="button"
                              >
                                {quantity > 0 ? t.addOneMore : t.addToOrder}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className={`overflow-hidden rounded-[2rem] ${panelClass}`}>
                <div className={`border-b px-5 py-4 ${borderClass}`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                    {t.cartEyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">{t.cartTitle}</h2>
                </div>
                <div className="space-y-5 p-5">
                  <div className={`rounded-[1.5rem] p-4 ${softClass}`}>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                      {t.sessionBadge}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {session.tableName} #{session.tableNumber.toString().padStart(3, "0")}
                    </p>
                    <p className={`mt-2 text-sm ${mutedClass}`}>{t.tableOnlyHint}</p>
                  </div>

                  <div className="space-y-3">
                    {cartEntries.length === 0 ? (
                      <div className={`rounded-[1.5rem] border border-dashed p-4 text-sm ${borderClass} ${mutedClass}`}>
                        {t.emptyCart}
                      </div>
                    ) : (
                      cartEntries.map((item) => (
                        <div className={`rounded-[1.5rem] p-4 ${softClass}`} key={item.id}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className={`mt-1 text-sm ${mutedClass}`}>
                                {quantities[item.id]} x {formatMoney(item.priceMinor, item.currencyCode)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatMoney(item.priceMinor * (quantities[item.id] ?? 0), item.currencyCode)}
                            </p>
                          </div>
                          {notes[item.id] ? (
                            <p className={`mt-2 text-sm ${mutedClass}`}>{notes[item.id]}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  <div className={`rounded-[1.5rem] p-4 ${softClass}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                        {t.totalLabel}
                      </p>
                      <p className="text-2xl font-semibold">{formatMoney(totalMinor, currentCurrency)}</p>
                    </div>
                    <label className="mt-4 block">
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                        {t.generalNote}
                      </span>
                      <textarea
                        className={`mt-3 min-h-28 w-full rounded-[1.25rem] border px-4 py-3 text-sm outline-none transition ${borderClass} ${
                          theme === "night"
                            ? "bg-black/20 text-[#f3e7d3] placeholder:text-[#7f725f]"
                            : "bg-[#fcf7ef] text-[#241c12] placeholder:text-[#8d7756]"
                        }`}
                        onChange={(event) => setOrderNote(event.target.value)}
                        placeholder={t.generalNotePlaceholder}
                        value={orderNote}
                      />
                    </label>
                    <label className="mt-4 block">
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                        {t.checkoutProofLabel}
                      </span>
                      <input
                        className={`mt-3 w-full rounded-[1.25rem] border px-4 py-3 text-sm outline-none transition ${borderClass} ${
                          theme === "night"
                            ? "bg-black/20 text-[#f3e7d3] placeholder:text-[#7f725f]"
                            : "bg-[#fcf7ef] text-[#241c12] placeholder:text-[#8d7756]"
                        }`}
                        onChange={(event) => setCheckoutToken(event.target.value)}
                        placeholder={t.checkoutProofPlaceholder}
                        value={checkoutToken}
                      />
                      <p className={`mt-2 text-xs leading-5 ${mutedClass}`}>{t.checkoutProofHint}</p>
                    </label>
                  </div>

                  {flatItems.map((item) => (
                    <div key={item.id}>
                      <input name={`qty-${item.id}`} type="hidden" value={quantities[item.id] ?? 0} />
                      <input name={`note-${item.id}`} type="hidden" value={notes[item.id] ?? ""} />
                    </div>
                  ))}
                  <input name="orderNote" type="hidden" value={orderNote} />
                  <input name="checkoutToken" type="hidden" value={checkoutToken} />

                  <button
                    className={`w-full rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${accentButtonClass}`}
                    disabled={pending || checkoutToken.trim().length === 0}
                    type="submit"
                  >
                    {pending ? t.sending : t.sendOrder}
                  </button>
                  {orderState.message ? (
                    <p className={`text-sm ${orderState.ok ? "text-emerald-500" : "text-rose-500"}`}>
                      {orderState.message}
                    </p>
                  ) : null}
                </div>
              </aside>
            </div>
          ) : (
            <section className={`overflow-hidden rounded-[2rem] ${panelClass}`}>
              <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                    {t.infoEyebrow}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold">{t.infoTitle}</h2>
                  <p className={`mt-4 max-w-2xl text-sm leading-7 ${mutedClass}`}>
                    {t.infoBody.replace("{{tenant}}", session.tenantDisplayName)}
                  </p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className={`rounded-[1.5rem] p-5 ${softClass}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                        {t.wifiCardTitle}
                      </p>
                      <p className="mt-3 text-lg font-semibold">{t.wifiPendingTitle}</p>
                      <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>{t.wifiPendingBody}</p>
                    </div>
                    <div className={`rounded-[1.5rem] p-5 ${softClass}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                        {t.contactCardTitle}
                      </p>
                      <p className="mt-3 text-lg font-semibold">{session.tenantDisplayName}</p>
                      <p className={`mt-2 text-sm leading-6 ${mutedClass}`}>{session.tenantPrimaryDomain}</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-[1.75rem] p-6 ${softClass}`}>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedClass}`}>
                    {t.infoPanelTitle}
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className={`rounded-[1.25rem] p-4 ${theme === "night" ? "bg-black/20" : "bg-white"}`}>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClass}`}>
                        {t.infoRows.tenant}
                      </p>
                      <p className="mt-2 text-base font-semibold">{session.tenantDisplayName}</p>
                    </div>
                    <div className={`rounded-[1.25rem] p-4 ${theme === "night" ? "bg-black/20" : "bg-white"}`}>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClass}`}>
                        {t.infoRows.table}
                      </p>
                      <p className="mt-2 text-base font-semibold">
                        {session.tableName} #{session.tableNumber.toString().padStart(3, "0")}
                      </p>
                    </div>
                    <div className={`rounded-[1.25rem] p-4 ${theme === "night" ? "bg-black/20" : "bg-white"}`}>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mutedClass}`}>
                        {t.infoRows.domain}
                      </p>
                      <p className="mt-2 text-base font-semibold">{session.tenantPrimaryDomain}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </form>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={() => setSelectedItemId(null)}
        >
          <div
            className={`w-full max-w-xl overflow-hidden rounded-[2rem] ${panelClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`relative h-52 bg-gradient-to-br ${itemTheme(2)} p-5`}>
              <button
                className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full ${subtleButtonClass}`}
                onClick={() => setSelectedItemId(null)}
                type="button"
              >
                ×
              </button>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_10rem)]" />
              <div className="relative mt-20 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] bg-white/75 text-[#6c4d18]">
                {selectedItem.stationName ?? t.stationFallback}
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">{selectedItem.name}</h3>
                  <p className={`mt-2 text-sm leading-7 ${mutedClass}`}>
                    {selectedItem.description || t.itemDescriptionFallback}
                  </p>
                </div>
                <span className="text-lg font-semibold">
                  {formatMoney(selectedItem.priceMinor, selectedItem.currencyCode)}
                </span>
              </div>
              <button
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${accentButtonClass}`}
                onClick={() => {
                  setQuantities((current) => ({
                    ...current,
                    [selectedItem.id]: Math.max(1, (current[selectedItem.id] ?? 0) + 1)
                  }));
                  setSelectedItemId(null);
                }}
                type="button"
              >
                {t.addToOrder}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className={`fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border px-3 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur xl:hidden ${
          theme === "night"
            ? "border-white/10 bg-[#171717]/92 text-[#efe5d1]"
            : "border-[#dccfb8] bg-white/94 text-[#241c12]"
        }`}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="flex items-center justify-between gap-3 rounded-full px-2 py-1">
            <span className={`pl-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>
              {t.languageLabel}
            </span>
            <div className="flex rounded-full p-1 shadow-inner">
              {(["tr", "en"] as Locale[]).map((option) => (
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    locale === option
                      ? theme === "night"
                        ? "bg-[#c9a84c] text-[#20170b]"
                        : "bg-[#241c12] text-[#f5ecda]"
                      : mutedClass
                  }`}
                  key={option}
                  onClick={() => setLocale(option)}
                  type="button"
                >
                  {option === "tr" ? t.turkish : t.english}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-full px-2 py-1">
            <span className={`pl-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedClass}`}>
              {t.themeLabel}
            </span>
            <div className="flex rounded-full p-1 shadow-inner">
              {(["night", "day"] as ThemeMode[]).map((option) => (
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    theme === option
                      ? theme === "night"
                        ? "bg-[#c9a84c] text-[#20170b]"
                        : "bg-[#241c12] text-[#f5ecda]"
                      : mutedClass
                  }`}
                  key={option}
                  onClick={() => setTheme(option)}
                  type="button"
                >
                  {option === "night" ? t.nightMode : t.dayMode}
                </button>
              ))}
            </div>
          </div>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${accentButtonClass}`}
            onClick={() => setActiveView(activeView === "menu" ? "info" : "menu")}
            type="button"
          >
            {activeView === "menu" ? t.infoTab : t.menuTab}
          </button>
        </div>
      </nav>
    </main>
  );
}
