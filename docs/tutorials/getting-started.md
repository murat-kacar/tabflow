# Getting Started

This is the fastest path to understanding and running the TabFlow source tree.

## 1. Understand The Big Split

TabFlow has two major sides:

- `platform`: control plane, tenant registry, provisioning visibility
- `tenant`: business runtime for one cafe

Start with:

- [`reference/architecture/system-overview.md`](../reference/architecture/system-overview.md)
- [`explanation/concepts/multi-tenancy.md`](../explanation/concepts/multi-tenancy.md)

## 2. Learn The Source Tree

Canonical source roots:

```text
src/apps/
src/packages/
src/infra/
```

Read:

- [`reference/architecture/system-overview.md`](../reference/architecture/system-overview.md)

## 3. Build The Backend

```bash
dotnet restore TabFlow.sln
dotnet build TabFlow.sln
dotnet test TabFlow.sln --no-restore
```

## 4. Build The Web Apps

```bash
pnpm install
pnpm --filter @tabflow/platform-web test
pnpm --filter @tabflow/tenant-web test
pnpm --filter @tabflow/platform-web build
pnpm --filter @tabflow/tenant-web build
```

## 5. Learn The Main Runtime Surfaces

Read:

- [`../explanation/concepts/operational-surfaces.md`](../explanation/concepts/operational-surfaces.md)
- [`../reference/api/tenant-api.md`](../reference/api/tenant-api.md)

## 6. Learn Tenant Provisioning

Read:

- [`../how-to/provision-tenant.md`](../how-to/provision-tenant.md)
- [`../reference/api/platform-api.md`](../reference/api/platform-api.md)

## 7. Legacy Material

If you need older notes while the new docs tree is still being consolidated,
use [`old-docs/`](../../old-docs/) as source material rather than as the active
source of truth.
