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
apps/platform-api
  Platform admin API, tenant registry, lifecycle job records, tenant state,
  platform admin auth, and future provisioning orchestration.

apps/platform-operator
  Background worker source that watches platform provisioning jobs and performs
  tenant setup orchestration through explicit application services.

apps/platform-web
  Platform admin UI for managing cafes, domains, tenant state, and provisioning.

apps/tenant-api
  Tenant business API, tenant schema bootstrap, catalog/tables read API,
  QR token lifecycle, device WebSocket API, order, bill, auth, service station,
  and kitchen fulfillment flows.

apps/tenant-web
  Customer menu UI plus tenant admin and kitchen/KDS operational surfaces.
```

The platform is not a tenant. It must not serve tenant storefront pages, and
tenant runtime concerns must remain separate from platform admin concerns.

## Package Boundary

```text
packages/shared-dotnet
  Shared backend contracts, primitives, and reusable platform core.

packages/shared-ts
  Shared frontend contracts, validation schemas, and typed clients.

packages/firmware
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
- platform-operator watches pending jobs and prepares tenant runtime metadata
- tenant-api owns tenant schema initialization and runtime seed data
- runtime packaging and host automation are intentionally outside this source baseline

## Testing Boundary

- .NET unit and API-level tests use xUnit.
- TypeScript package tests use Vitest.
- React component tests use Vitest + Testing Library + jsdom.
- E2E browser tests are intentionally deferred until real user flows exist.
