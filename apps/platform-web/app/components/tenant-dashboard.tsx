"use client";

import type {
  PlatformAuditLog,
  ProvisionJob,
  Tenant,
  TenantRuntimeSummary
} from "@tabflow/shared-ts";
import { useMemo, useState } from "react";
import { setTenantStatusAction, updateTenantRegionalSettingsAction } from "../actions";
import type { Dictionary } from "../i18n/server";
import { formatDateTime } from "../lib/format";
import type { PlatformSession } from "../lib/platform-session";
import { CreateTenantForm } from "./create-tenant-form";

type TenantDashboardProps = {
  auditLogs: PlatformAuditLog[];
  jobs: ProvisionJob[];
  runtimes: TenantRuntimeSummary[];
  session: PlatformSession;
  t: Dictionary;
  tenants: Tenant[];
  error?: string;
};

const statusClasses: Record<Tenant["status"], string> = {
  provisioning: "bg-amber-100 text-amber-900 ring-amber-200",
  active: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  suspended: "bg-stone-200 text-stone-800 ring-stone-300",
  archived: "bg-red-100 text-red-900 ring-red-200"
};

function roleLabel(role: PlatformSession["role"]) {
  return role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Viewer";
}

function canManage(role: PlatformSession["role"]) {
  return role === "admin" || role === "owner";
}

function jobStatusClass(status: ProvisionJob["status"]) {
  if (status === "succeeded") return "bg-emerald-100 text-emerald-900 ring-emerald-200";
  if (status === "running") return "bg-amber-100 text-amber-900 ring-amber-200";
  if (status === "failed") return "bg-red-100 text-red-900 ring-red-200";
  if (status === "cancelled") return "bg-stone-200 text-stone-800 ring-stone-300";
  return "bg-sky-100 text-sky-900 ring-sky-200";
}

function statusSummary(tenants: Tenant[]) {
  return {
    active: tenants.filter((tenant) => tenant.status === "active").length,
    provisioning: tenants.filter((tenant) => tenant.status === "provisioning").length,
    suspended: tenants.filter((tenant) => tenant.status === "suspended").length,
    archived: tenants.filter((tenant) => tenant.status === "archived").length
  };
}

export function TenantDashboard({
  tenants,
  jobs,
  auditLogs,
  runtimes,
  error,
  session,
  t
}: TenantDashboardProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id ?? "");

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? tenants[0],
    [selectedTenantId, tenants]
  );

  const selectedJobs = useMemo(
    () => (selectedTenant ? jobs.filter((job) => job.tenantId === selectedTenant.id) : jobs),
    [jobs, selectedTenant]
  );

  const selectedAuditLogs = useMemo(
    () =>
      selectedTenant
        ? auditLogs.filter(
            (log) =>
              log.entityId === selectedTenant.id ||
              log.payloadJson.includes(selectedTenant.code) ||
              (selectedTenant.primaryDomain
                ? log.payloadJson.includes(selectedTenant.primaryDomain)
                : false)
          )
        : auditLogs,
    [auditLogs, selectedTenant]
  );

  const selectedRuntime = useMemo(
    () =>
      selectedTenant
        ? runtimes.find((runtime) => runtime.tenantId === selectedTenant.id)
        : undefined,
    [runtimes, selectedTenant]
  );

  const counts = statusSummary(tenants);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f3efe6,transparent_36rem),linear-gradient(135deg,#f8f5ed,#e9f0ec)] px-6 py-10 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-black/10 bg-white/70 p-8 shadow-sm backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
            {t.dashboard.eyebrow}
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{t.dashboard.title}</h1>
              <p className="mt-4 max-w-3xl text-lg text-stone-700">{t.dashboard.body}</p>
            </div>
            <div className="rounded-2xl bg-stone-950 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                {t.dashboard.totalTenants}
              </p>
              <p className="mt-1 text-3xl font-bold">{tenants.length}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-700">
            <span className="rounded-full bg-white/70 px-3 py-1">
              {t.dashboard.role}: {roleLabel(session.role)}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1">
              {t.dashboard.active}: {counts.active}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1">
              Provisioning: {counts.provisioning}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1">
              {t.dashboard.passive}: {counts.suspended}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1">
              {t.dashboard.auditRecords}: {auditLogs.length}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
                  {t.dashboard.tenantsEyebrow}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {t.dashboard.tenantRecords}
                </h2>
              </div>
              {error ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {tenants.length === 0 ? (
                <div className="rounded-2xl bg-stone-50 px-5 py-10 text-center text-stone-600 md:col-span-2">
                  {t.dashboard.emptyTenants}
                </div>
              ) : (
                tenants.map((tenant) => (
                  <button
                    className={`rounded-[1.75rem] border p-5 text-left shadow-sm transition ${
                      selectedTenant?.id === tenant.id
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-200 bg-white text-stone-950 hover:border-stone-400"
                    }`}
                    key={tenant.id}
                    onClick={() => setSelectedTenantId(tenant.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold">{tenant.displayName}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          selectedTenant?.id === tenant.id
                            ? "border-white/10 bg-white/10 text-white ring-white/10"
                            : statusClasses[tenant.status]
                        }`}
                      >
                        {t.dashboard.statuses[tenant.status]}
                      </span>
                    </div>
                    <dl
                      className={`mt-4 grid gap-2 text-sm ${
                        selectedTenant?.id === tenant.id ? "text-stone-200" : "text-stone-600"
                      }`}
                    >
                      <div>
                        <dt
                          className={
                            selectedTenant?.id === tenant.id ? "text-stone-400" : "text-stone-500"
                          }
                        >
                          {t.dashboard.code}
                        </dt>
                        <dd className="font-mono">{tenant.code}</dd>
                      </div>
                      <div>
                        <dt
                          className={
                            selectedTenant?.id === tenant.id ? "text-stone-400" : "text-stone-500"
                          }
                        >
                          {t.dashboard.domain}
                        </dt>
                        <dd className="font-mono break-all">{tenant.primaryDomain ?? "-"}</dd>
                      </div>
                      <div>
                        <dt
                          className={
                            selectedTenant?.id === tenant.id ? "text-stone-400" : "text-stone-500"
                          }
                        >
                          {t.dashboard.firstAdmin}
                        </dt>
                        <dd className="break-all">
                          {tenant.initialAdminEmail ?? t.dashboard.notSpecified}
                        </dd>
                      </div>
                    </dl>
                  </button>
                ))
              )}
            </div>
          </section>

          <div className="space-y-6">
            <CreateTenantForm canManage={canManage(session.role)} t={t.createTenant} />

            {selectedTenant ? (
              <section className="rounded-3xl border border-stone-200 bg-[#17231e] p-6 text-white shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  {t.dashboard.selectedTenant}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  {selectedTenant.displayName}
                </h2>
                <div className="mt-5 grid gap-3 text-sm text-stone-100">
                  <p>
                    {t.dashboard.code}: {selectedTenant.code}
                  </p>
                  <p>
                    {t.dashboard.domain}: {selectedTenant.primaryDomain ?? "-"}
                  </p>
                  <p>
                    {t.dashboard.firstAdminEmail}: {selectedTenant.initialAdminEmail ?? "-"}
                  </p>
                  <p>
                    {t.dashboard.language}: {selectedTenant.languageCode}
                  </p>
                  <p>
                    {t.dashboard.currency}: {selectedTenant.currencyCode}
                  </p>
                  <p>
                    {t.dashboard.timeZone}: {selectedTenant.timeZone}
                  </p>
                  <p>
                    {t.dashboard.createdAt}: {formatDateTime(selectedTenant.createdAt)}
                  </p>
                  <p>
                    {t.dashboard.updatedAt}: {formatDateTime(selectedTenant.updatedAt)}
                  </p>
                </div>
                <form
                  action={updateTenantRegionalSettingsAction}
                  className="mt-5 grid gap-3 rounded-2xl bg-white/10 p-4 text-sm text-stone-100"
                >
                  <input name="id" type="hidden" value={selectedTenant.id} />
                  <p className="font-semibold">{t.dashboard.regionalSettings}</p>
                  <label className="grid gap-1">
                    {t.dashboard.language}
                    <select
                      className="rounded-xl border border-white/20 bg-stone-950 px-3 py-2 text-white"
                      defaultValue={selectedTenant.languageCode}
                      name="languageCode"
                    >
                      <option value="en">{t.dashboard.languages.en}</option>
                      <option value="tr">{t.dashboard.languages.tr}</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    {t.dashboard.currency}
                    <select
                      className="rounded-xl border border-white/20 bg-stone-950 px-3 py-2 text-white"
                      defaultValue={selectedTenant.currencyCode}
                      name="currencyCode"
                    >
                      <option value="GBP">GBP</option>
                      <option value="TRY">TRY</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    {t.dashboard.timeZone}
                    <select
                      className="rounded-xl border border-white/20 bg-stone-950 px-3 py-2 text-white"
                      defaultValue={selectedTenant.timeZone}
                      name="timeZone"
                    >
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Istanbul">Europe/Istanbul</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </label>
                  {canManage(session.role) ? (
                    <button
                      className="rounded-full bg-white px-4 py-2 font-semibold text-stone-950"
                      type="submit"
                    >
                      {t.dashboard.saveRegionalSettings}
                    </button>
                  ) : null}
                </form>
                {selectedRuntime ? (
                  <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-stone-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{t.dashboard.runtimeVisibility}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedRuntime.healthStatus === "healthy"
                            ? "bg-emerald-200 text-emerald-950"
                            : "bg-stone-200 text-stone-900"
                        }`}
                      >
                        {selectedRuntime.healthStatus ?? t.dashboard.unknown}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <p>Base URL: {selectedRuntime.baseUrl ?? "-"}</p>
                      <p>
                        {t.dashboard.internalHealth}: {selectedRuntime.healthStatus ?? "-"} /{" "}
                        {formatDateTime(selectedRuntime.healthCheckedAt)}
                      </p>
                      <p>
                        {t.dashboard.externalExposure}: {selectedRuntime.exposureStatus ?? "-"} /{" "}
                        {formatDateTime(selectedRuntime.exposureCheckedAt)}
                      </p>
                      <p>
                        {t.dashboard.ports}: API {selectedRuntime.backendPort ?? "-"} / Web{" "}
                        {selectedRuntime.webPort ?? "-"}
                      </p>
                      <p>
                        DB: {selectedRuntime.databaseName ?? "-"} /{" "}
                        {selectedRuntime.databaseUser ?? "-"}
                      </p>
                      <p>Artifact root: {selectedRuntime.artifactRoot ?? "-"}</p>
                      {selectedRuntime.exposureError ? (
                        <p>
                          {t.dashboard.exposureError}: {selectedRuntime.exposureError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {canManage(session.role) ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusButton
                      id={selectedTenant.id}
                      label={t.dashboard.activate}
                      status="active"
                    />
                    <StatusButton
                      id={selectedTenant.id}
                      label={t.dashboard.suspend}
                      status="suspended"
                    />
                    <StatusButton
                      id={selectedTenant.id}
                      label={t.dashboard.archive}
                      status="archived"
                    />
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              Provisioning
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {selectedTenant
                ? `${selectedTenant.displayName} ${t.dashboard.tenantJobsSuffix}`
                : t.dashboard.latestJobs}
            </h2>
            <div className="mt-5 space-y-3">
              {selectedJobs.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
                  {t.dashboard.noProvisionJobs}
                </p>
              ) : (
                selectedJobs.slice(0, 10).map((job) => (
                  <article className="rounded-2xl border border-stone-200 p-4" key={job.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-stone-950">{job.type}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${jobStatusClass(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {t.dashboard.step}: {job.currentStep}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {t.dashboard.attempt}: {job.attemptCount}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {t.dashboard.createdAt}: {formatDateTime(job.createdAt)}
                    </p>
                    {selectedRuntime?.latestJobId === job.id ? (
                      <p className="mt-1 text-sm text-stone-600">
                        Runtime health: {selectedRuntime.healthStatus ?? t.dashboard.unknown}
                      </p>
                    ) : null}
                    {job.errorMessage ? (
                      <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                        {job.errorMessage}
                      </p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              Audit
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {selectedTenant
                ? `${selectedTenant.displayName} ${t.dashboard.tenantActivitySuffix}`
                : t.dashboard.latestActivity}
            </h2>
            <div className="mt-5 space-y-3">
              {selectedAuditLogs.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
                  {t.dashboard.noAuditRecords}
                </p>
              ) : (
                selectedAuditLogs.slice(0, 10).map((log) => (
                  <article className="rounded-2xl border border-stone-200 p-4" key={log.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-stone-950">{log.action}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">{log.actorEmail}</p>
                    <p className="mt-1 break-all rounded-xl bg-stone-50 px-3 py-2 font-mono text-xs text-stone-500">
                      {log.payloadJson}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatusButton({
  id,
  label,
  status
}: {
  id: string;
  label: string;
  status: "active" | "suspended" | "archived";
}) {
  return (
    <form action={setTenantStatusAction}>
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={status} />
      <button
        className="rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950"
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
