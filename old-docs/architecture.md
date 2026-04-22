# Architecture

Scope: Source Baseline

Status Snapshot: 2026-04-17

This document describes the intended long-term shape of TabFlow. Code should
move toward this shape in small, tested increments.

## State Split

Implemented (as of snapshot date):

- service boundaries between `platform-*` and `tenant-*` apps
- shared backend/frontend package boundaries
- separate platform and tenant databases
- job-based tenant provisioning entrypoint

Planned:

- stronger internal trust boundary between web and APIs
- explicit runtime packaging and host automation layer

Out of scope for this repo:

- production deployment topology and OS-level runbooks

## Stack Decision

TabFlow uses a .NET + TypeScript architecture:

- ASP.NET Core for backend APIs
- Next.js with TypeScript for web applications
- Tailwind CSS 4 for styling
- PostgreSQL 17 for data

## Application Boundary

```text
src/apps/platform-api
  Platform admin API, tenant registry, lifecycle job records, tenant state,
  platform admin auth, and future provisioning orchestration.

src/apps/platform-worker
  Background worker source that watches platform provisioning jobs and performs
  tenant setup orchestration through explicit application services.

src/apps/platform-web
  Platform admin UI for managing cafes, domains, tenant state, and provisioning.

src/apps/tenant-api
  Tenant business API, tenant schema bootstrap, catalog/tables read API,
  QR token lifecycle, device WebSocket API, order, bill, auth, service station,
  and kitchen fulfillment flows.

src/apps/tenant-web
  Customer menu UI plus tenant admin and kitchen/KDS operational surfaces.
```

The platform is not a tenant. It must not serve tenant storefront pages, and
tenant runtime concerns must remain separate from platform admin concerns.

## Package Boundary

```text
src/packages/shared-dotnet
  Shared backend contracts, primitives, and reusable platform core.

src/packages/shared-ts
  Shared frontend contracts, validation schemas, and typed clients.

src/packages/firmware
  ESP32 firmware source and per-table config generation tools.
```

## Data Boundary

Platform data and tenant data are separate.

Platform database stores tenant registry and provisioning state. Tenant
databases store cafe business data. The platform should not depend on tenant
business tables for normal operation.

Platform database owns:

- platform admins
- tenant registry
- tenant domains
- provisioning jobs
- secret references, not raw secrets where avoidable

Tenant databases own:

- menu categories and products
- tables
- device keys
- QR token/session lifecycle
- orders and bills
- tenant-local admin users

Tenant runtime UX principle:

- the primary admin surface is table-centric, not report-centric
- operators should understand floor state, open bills, live orders, and device health at a glance
- order, bill, and device actions should be reachable from the same operations surface
- kitchen work should be station-based and optimized for glanceable ticket handling
- kitchen and floor views can be separate surfaces, but they must share one tenant runtime contract

## Provisioning Principle

Creating a tenant in the UI should reserve registry state and create a provisioning
job. Runtime setup work should be handled by a job/worker path with clear status,
logs, retry behavior, and compensation steps.

Do not hide infrastructure side effects inside a frontend request handler.

Current execution split:

- platform-api owns registry state and provisioning job creation
- platform-worker watches pending jobs and prepares tenant runtime metadata
- tenant-api owns tenant schema initialization and runtime seed data
- runtime packaging and host automation are intentionally outside this source baseline

## Testing Boundary

- .NET unit and API-level tests use xUnit.
- TypeScript package tests use Vitest.
- React component tests use Vitest + Testing Library + jsdom.
- E2E browser tests are intentionally deferred until real user flows exist.

Current test directory convention:

- backend and shared `.NET` code use sibling `tests/` directories next to the
  source-bearing app or package
- frontend and shared TypeScript code prefer co-located test files such as
  `*.test.ts` and `*.test.tsx`
- frontend app-level test harness files may live under app-local `test/`
  directories such as `src/apps/tenant-web/test/`

Examples:

- `src/apps/platform-api/tests`
- `src/apps/tenant-api/tests`
- `src/packages/shared-dotnet/tests`
- `src/apps/platform-web/app/page.test.tsx`
- `src/apps/tenant-web/test/setup.ts`

## Build Artifact Boundary

TabFlow keeps build artifacts in the natural output directory of each toolchain
instead of forcing a synthetic repository-wide `build/` root.

Current convention:

- Next.js apps emit `.next/`
- TypeScript package builds may emit `dist/`
- .NET projects emit `bin/` and `obj/`
- deployment publish outputs are environment-owned and live outside the source
  tree

This keeps tool defaults intact and reduces custom build indirection. Artifact
paths must remain covered by `.gitignore`.

## Tooling Root Convention

`src/` is the canonical source root for monorepo tooling.

That means repository tooling should resolve source-bearing workspaces from:

- `src/apps/*`
- `src/packages/*`
- `src/infra/*` when infrastructure tooling is introduced

Current repository tooling already follows this root convention for:

- `pnpm-workspace.yaml`
- TypeScript config inheritance
- source-aware audit scripts

Future tooling such as Turborepo or Nx should adopt `src/` as the source root
instead of introducing a competing root layout.
