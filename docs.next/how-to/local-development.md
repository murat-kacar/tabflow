# Local Development

This guide gets a TabFlow working copy running on a developer machine.
It targets the Refactor 3 stack: .NET 10, PostgreSQL 17, Blazor Web App.

## Prerequisites

- .NET 10 SDK
- PostgreSQL 17, reachable from the machine
- Git

No Node.js or pnpm toolchain is required; the old Next.js tree has been
retired (see
[`../reference/architecture/decisions.md`](../reference/architecture/decisions.md),
AD-0001).

## 1. PostgreSQL

Start a PostgreSQL 17 instance locally. Either run it directly or bring
up the repo-committed development stack:

```bash
docker compose -f src/infra/postgres/docker-compose.dev.yml up -d
```

The default development superuser is `tabflow` with password `tabflow`.
The platform database is created by the first migration run; tenant
databases are created on demand by the platform worker.

Adjust `appsettings.Development.json` in each host if the local
PostgreSQL is on a non-default port.

## 2. Migrations

Run platform migrations:

```bash
dotnet ef database update \
    --project src/apps/platform \
    --startup-project src/apps/platform
```

Tenant migrations run per tenant database. For a first local tenant,
use the platform host provisioning flow or the platform worker CLI (see
[`./provision-tenant.md`](./provision-tenant.md)).

## 3. Build And Test

```bash
dotnet restore TabFlow.sln
dotnet build TabFlow.sln
dotnet test TabFlow.sln --no-restore
```

## 4. Run The Hosts

Open three terminals:

```bash
dotnet run --project src/apps/platform
dotnet run --project src/apps/platform-worker
dotnet run --project src/apps/tenant
```

The platform host serves the control plane. The platform worker claims
provisioning jobs from the platform database. The tenant host serves
the default local tenant loaded from `appsettings.Development.json`.

## 5. Seed A Local Tenant

Use the platform admin console (`P-02` in
[`../reference/architecture/runtime-surfaces.md`](../reference/architecture/runtime-surfaces.md))
to enqueue a `tenant.create` job, then watch the job progress in
`P-03`. The platform worker creates the tenant database and seeds the
default admin user.

## 6. Default Credentials

Local development seeds:

- A platform admin at `admin@local` with a generated password printed
  once to the platform host console.
- A tenant owner for each created tenant, with a generated password
  printed once to the platform worker console.

Generated passwords are never written to source. Rotate them from the
respective console surfaces if needed.

## 7. Hot Reload

`dotnet watch` works for both hosts:

```bash
dotnet watch --project src/apps/platform
dotnet watch --project src/apps/tenant
```

Razor component changes are picked up without a full rebuild.

## Related

- [`../tutorials/getting-started.md`](../tutorials/getting-started.md)
- [`./provision-tenant.md`](./provision-tenant.md)
- [`../reference/architecture/system-overview.md`](../reference/architecture/system-overview.md)
