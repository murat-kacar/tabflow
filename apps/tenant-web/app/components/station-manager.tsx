"use client";

import type { ServiceStation } from "@yenicafe/shared-ts";
import { useActionState } from "react";
import {
  createStationAction,
  deleteStationAction,
  type TenantStationActionState,
  updateStationAction
} from "../auth-actions";

const initialState: TenantStationActionState = {
  ok: false,
  message: ""
};

function StationCard({ station }: { station: ServiceStation }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateStationAction,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStationAction,
    initialState
  );

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: station.colorHex }} />
          <div>
            <p className="font-semibold text-stone-950">{station.name}</p>
            <p className="font-mono text-xs text-stone-500">{station.code}</p>
          </div>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {station.isActive ? "Aktif" : "Pasif"}
        </span>
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
          Aktif
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            disabled={updatePending}
            type="submit"
          >
            Guncelle
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
    </article>
  );
}

export function StationManager({ stations }: { stations: ServiceStation[] }) {
  const [createState, createAction, createPending] = useActionState(
    createStationAction,
    initialState
  );

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Stations</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Istasyon duzeni</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      </div>
      <aside className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
          Yeni istasyon
        </p>
        <form action={createAction} className="mt-4 grid gap-3">
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
            name="name"
            placeholder="Bar"
          />
          <input
            className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono"
            name="code"
            placeholder="bar"
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
            Aktif
          </label>
          <button
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
            disabled={createPending}
            type="submit"
          >
            Istasyon ekle
          </button>
        </form>
        {createState.message ? (
          <p className={`mt-3 text-sm ${createState.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {createState.message}
          </p>
        ) : null}
      </aside>
    </section>
  );
}
