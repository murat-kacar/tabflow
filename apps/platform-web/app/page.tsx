import { redirect } from "next/navigation";
import { PlatformShell } from "./components/platform-shell";
import { TenantDashboard } from "./components/tenant-dashboard";
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
    const [tenants, jobs, auditLogs, runtimes] = await Promise.all([
      listTenants(session),
      listProvisionJobs(session),
      listAuditLogs(session),
      listTenantRuntimes(session)
    ]);

    return (
      <PlatformShell email={session.email}>
        <TenantDashboard
          auditLogs={auditLogs}
          jobs={jobs}
          runtimes={runtimes}
          session={session}
          tenants={tenants}
        />
      </PlatformShell>
    );
  } catch (error) {
    return (
      <PlatformShell email={session.email}>
        <TenantDashboard
          auditLogs={[]}
          error={error instanceof Error ? error.message : "Platform API baglantisi kurulamadi."}
          jobs={[]}
          runtimes={[]}
          session={session}
          tenants={[]}
        />
      </PlatformShell>
    );
  }
}
