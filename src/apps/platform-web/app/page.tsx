import { redirect } from "next/navigation";
import { PlatformShell } from "./components/platform-shell";
import { TenantDashboard } from "./components/tenant-dashboard";
import { getDictionary } from "./i18n/server";
import {
  listAuditLogs,
  listProvisionJobs,
  listTenantRuntimes,
  listTenants
} from "./lib/platform-api";
import { getPlatformSession } from "./lib/platform-session";

export const dynamic = "force-dynamic";

export default async function PlatformHome() {
  const session = await getPlatformSession();

  if (!session) {
    redirect("/login");
  }

  try {
    const [tenants, jobs, auditLogs, runtimes, t] = await Promise.all([
      listTenants(session),
      listProvisionJobs(session),
      listAuditLogs(session),
      listTenantRuntimes(session),
      getDictionary()
    ]);

    return (
      <PlatformShell email={session.email}>
        <TenantDashboard
          auditLogs={auditLogs}
          jobs={jobs}
          runtimes={runtimes}
          session={session}
          t={t}
          tenants={tenants}
        />
      </PlatformShell>
    );
  } catch (error) {
    const t = await getDictionary();

    return (
      <PlatformShell email={session.email}>
        <TenantDashboard
          auditLogs={[]}
          error={error instanceof Error ? error.message : t.dashboard.apiConnectionFailed}
          jobs={[]}
          runtimes={[]}
          session={session}
          t={t}
          tenants={[]}
        />
      </PlatformShell>
    );
  }
}
