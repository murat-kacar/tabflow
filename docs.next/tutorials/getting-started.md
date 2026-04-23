# Getting Started

This is the fastest path to understanding and running the TabFlow source
tree after Refactor 3.

## 1. Understand The Big Split

TabFlow has two host shapes:

- **Platform host** — control plane for tenant registry, provisioning, and
  platform audit.
- **Tenant host** — runtime for one cafe.

Both are ASP.NET Core 10 apps that run Blazor Web App. Start with:

- [`../reference/architecture/system-overview.md`](../reference/architecture/system-overview.md)
- [`../explanation/concepts/multi-tenancy.md`](../explanation/concepts/multi-tenancy.md)

## 2. Learn The Source Tree

```text
src/apps/
  platform                    ASP.NET Core host, platform control plane
  platform-worker             Background worker, provisioning jobs
  tenant                      ASP.NET Core host, one tenant runtime

src/packages/
  shared-dotnet               Shared domain, application service code
  firmware                    ESP32 firmware source and generation inputs

src/infra/
  postgres                    EF Core migrations and database assets
```

Read:

- [`../reference/architecture/system-overview.md`](../reference/architecture/system-overview.md)
- [`../reference/architecture/runtime-surfaces.md`](../reference/architecture/runtime-surfaces.md)

## 3. Build

```bash
dotnet restore TabFlow.sln
dotnet build TabFlow.sln
dotnet test TabFlow.sln --no-restore
```

## 4. Run Locally

A local PostgreSQL 17 instance reachable with the connection string in
`appsettings.Development.json` is required.

```bash
dotnet run --project src/apps/platform
dotnet run --project src/apps/platform-worker
dotnet run --project src/apps/tenant
```

The platform host serves the control plane on its configured port. The
tenant host serves the first tenant loaded through the local tenant
context.

## 5. Learn The Runtime Surfaces

Read:

- [`../explanation/concepts/operational-surfaces.md`](../explanation/concepts/operational-surfaces.md)
- [`../reference/architecture/runtime-surfaces.md`](../reference/architecture/runtime-surfaces.md)
- [`../reference/architecture/render-modes.md`](../reference/architecture/render-modes.md)

## 6. Learn Tenant Provisioning

Read:

- [`../how-to/provision-tenant.md`](../how-to/provision-tenant.md)
- [`../explanation/concepts/tenant-lifecycle.md`](../explanation/concepts/tenant-lifecycle.md)

## 7. Learn Authentication And Roles

Read:

- [`../explanation/concepts/authorization.md`](../explanation/concepts/authorization.md)
- [`../explanation/concepts/customer-session-model.md`](../explanation/concepts/customer-session-model.md)

## 8. Learn The Device Contract

Read:

- [`../reference/firmware.md`](../reference/firmware.md)
- [`../reference/api/tenant-api.md`](../reference/api/tenant-api.md)
