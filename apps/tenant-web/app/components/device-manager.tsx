"use client";

import type { AdminDevice } from "@yenicafe/shared-ts";
import { useActionState } from "react";
import {
  refreshDeviceTokenAction,
  rotateDeviceKeyAction,
  type TenantDeviceActionState
} from "../auth-actions";

const initialState: TenantDeviceActionState = {
  ok: false,
  message: ""
};

function DeviceActions({ device }: { device: AdminDevice }) {
  const [rotateState, rotateAction, rotatePending] = useActionState(
    rotateDeviceKeyAction,
    initialState
  );
  const [refreshState, refreshAction, refreshPending] = useActionState(
    refreshDeviceTokenAction,
    initialState
  );

  return (
    <article className="rounded-2xl border border-stone-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-950">
            Masa {device.tableNumber.toString().padStart(3, "0")}
          </h3>
          <p className="text-sm text-stone-600">{device.tableName}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            device.deviceOnline ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"
          }`}
        >
          {device.deviceOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-stone-600">
        <p>Anahtar ipucu: {device.activeKey?.keyHint ?? "Henuz yok"}</p>
        <p>Son gorulme: {device.activeKey?.lastSeenAt ?? "-"}</p>
        <p>Aktif token TTL: {device.activeToken?.ttlSeconds ?? 0}s</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={refreshAction}>
          <input name="tableId" type="hidden" value={device.tableId} />
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            disabled={refreshPending}
            type="submit"
          >
            Token gonder
          </button>
        </form>
        <form action={rotateAction}>
          <input name="tableId" type="hidden" value={device.tableId} />
          <button
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            disabled={rotatePending}
            type="submit"
          >
            Key rotate et
          </button>
        </form>
      </div>

      {refreshState.message ? (
        <p className={`mt-3 text-sm ${refreshState.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {refreshState.message}
        </p>
      ) : null}

      {rotateState.message ? (
        <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 p-4">
          <p className={`text-sm ${rotateState.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {rotateState.message}
          </p>
          {rotateState.rawDeviceKey ? (
            <p className="font-mono text-xs text-stone-700">{rotateState.rawDeviceKey}</p>
          ) : null}
          {rotateState.firmwareConfig ? (
            <pre className="overflow-x-auto rounded-2xl bg-stone-950 p-4 text-xs text-stone-100">
              {rotateState.firmwareConfig}
            </pre>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function DeviceManager({ devices }: { devices: AdminDevice[] }) {
  return (
    <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Devices</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Masa cihazlari</h2>
      <div className="mt-5 grid gap-4">
        {devices.map((device) => (
          <DeviceActions device={device} key={device.tableId} />
        ))}
      </div>
    </section>
  );
}
