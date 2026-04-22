"use client";

import type { ServiceStation } from "@tabflow/shared-ts";
import { useActionState } from "react";
import {
  createStationAction,
  deleteStationAction,
  type TenantStationActionState,
  updateStationAction
} from "../auth-actions";
import type { Dictionary } from "../i18n/server";

const initialState: TenantStationActionState = {
  ok: false,
  message: ""
};

function StationCard({
  common,
  station,
  t
}: {
  common: Dictionary["common"];
  station: ServiceStation;
  t: Dictionary["stationsManager"];
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateStationAction,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStationAction,
    initialState
  );

  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: station.colorHex }} />
          <div>
            <p className="text-lg font-bold tracking-tight text-stone-950">{station.name}</p>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-stone-500">
              {station.code}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            station.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
          }`}
        >
          {station.isActive ? common.active : common.passive}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-stone-50 px-4 py-3">
          <p className="text-stone-500">{t.sortOrder}</p>
          <p className="mt-1 font-semibold text-stone-950">{station.sortOrder}</p>
        </div>
        <div className="rounded-2xl bg-stone-50 px-4 py-3">
          <p className="text-stone-500">{t.color}</p>
          <p className="mt-1 font-mono font-semibold text-stone-950">{station.colorHex}</p>
        </div>
      </div>

      <form action={updateAction} className="mt-4 grid gap-3">
        <input name="stationId" type="hidden" value={station.id} />
        <input
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
          defaultValue={station.name}
          name="name"
        />
        <input
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono"
          defaultValue={station.code}
          name="code"
        />
        <input
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono"
          defaultValue={station.colorHex}
          name="colorHex"
        />
        <input
          className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
          defaultValue={station.sortOrder}
          name="sortOrder"
          type="number"
        />
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input defaultChecked={station.isActive} name="isActive" type="checkbox" />
          {t.active}
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[#16392e] px-4 py-2 text-sm font-semibold text-white"
            disabled={updatePending}
            type="submit"
          >
            {t.update}
          </button>
        </div>
      </form>
      <form action={deleteAction} className="mt-3">
        <input name="stationId" type="hidden" value={station.id} />
        <button
          className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700"
          disabled={deletePending}
          type="submit"
        >
          {t.delete}
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
    </article>
  );
}

export function StationManager({ stations, t }: { stations: ServiceStation[]; t: Dictionary }) {
  const [createState, createAction, createPending] = useActionState(
    createStationAction,
    initialState
  );
  const activeStations = stations.filter((station) => station.isActive).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f3e5c8,transparent_28rem),radial-gradient(circle_at_bottom_right,#d9e8de,transparent_30rem),linear-gradient(135deg,#f7f3ec,#ebe5d8)] px-6 py-8 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-black/10 bg-[#19352d] p-8 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200">
            {t.stationsManager.heroEyebrow}
          </p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight">{t.stationsManager.heroTitle}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-emerald-50/85">
            {t.stationsManager.heroBody}
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.stationsManager.totalStations}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
              {stations.length}
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.stationsManager.activeStations}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
              {activeStations}
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.stationsManager.fallbackCandidates}
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-stone-950">
              {stations.filter((station) => station.code === "general").length}
            </p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.stationsManager.gridEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {t.stationsManager.gridTitle}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {stations.map((station) => (
                <StationCard
                  common={t.common}
                  key={station.id}
                  station={station}
                  t={t.stationsManager}
                />
              ))}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              {t.stationsManager.newStationEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {t.stationsManager.wizardTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">{t.stationsManager.wizardBody}</p>
            <form action={createAction} className="mt-5 grid gap-3">
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                name="name"
                placeholder={t.stationsManager.namePlaceholder}
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono"
                name="code"
                placeholder={t.stationsManager.codePlaceholder}
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono"
                defaultValue="#64748b"
                name="colorHex"
              />
              <input
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
                defaultValue={0}
                name="sortOrder"
                type="number"
              />
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input defaultChecked name="isActive" type="checkbox" />
                {t.stationsManager.active}
              </label>
              <button
                className="rounded-full bg-[#16392e] px-5 py-3 text-sm font-semibold text-white"
                disabled={createPending}
                type="submit"
              >
                {t.stationsManager.create}
              </button>
            </form>
            {createState.message ? (
              <p
                className={`mt-3 text-sm ${createState.ok ? "text-emerald-700" : "text-rose-700"}`}
              >
                {createState.message}
              </p>
            ) : null}
          </aside>
        </section>
      </section>
    </main>
  );
}
