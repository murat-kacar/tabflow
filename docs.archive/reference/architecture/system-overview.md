# System Overview

TabFlow is a multi-tenant cafe operations platform with a strict split between
the platform control plane and tenant runtimes.

This document is the primary architecture snapshot for the repository.

## Scope

This document covers:

- source tree shape
- application and package boundaries
- platform vs tenant responsibilities
- data ownership boundaries
- runtime packaging boundary at a high level

This document does not replace host-specific runbooks or deployment steps.

## Stack

TabFlow uses:

- ASP.NET Core on .NET 10 for backend APIs and worker processes
- Next.js with TypeScript for web applications
- Tailwind CSS 4 for UI styling
- PostgreSQL 17 for data storage

## Source Tree

Current canonical source roots:

```text
src/apps/
  platform-api
  platform-worker
  platform-web
  tenant-api
  tenant-web

src/packages/
  shared-dotnet
  shared-ts
  firmware

src/infra/
  postgres
```

Repository support roots:

```text
docs/
```

`src/` is the canonical source root for workspace-aware tooling.

## Application Boundaries

### `src/apps/platform-api`

The control-plane API.

Owns:

- platform admin auth bootstrap and login baseline
- tenant registry
- tenant domains
- tenant status changes
- provisioning job creation and visibility
- platform-side audit surface

It is not a tenant runtime API.

### `src/apps/platform-worker`

The background worker that watches provisioning jobs and performs platform-side
tenant lifecycle orchestration.

Owns:

- provisioning job pickup and retry behavior
- runtime artifact preparation
- host/runtime metadata orchestration
- tenant runtime activation path coordination

### `src/apps/platform-web`

The platform admin web application.

Owns:

- platform admin login UX
- tenant create/update views
- provisioning visibility
- control-plane operational surfaces

### `src/apps/tenant-api`

The runtime backend for one tenant.

Owns:

- tenant schema bootstrap
- tenant profile and catalog contracts
- table and device state
- QR token lifecycle
- customer access/session bootstrap
- orders, bills, and station/kitchen flows
- tenant admin runtime operations

### `src/apps/tenant-web`

The runtime frontend for one tenant.

Owns:

- customer menu surface
- tenant admin surface
- floor/cash operations surface
- station and kitchen-facing surfaces

## Operational Surface Set

The current tenant-facing operational surface family is:

1. customer menu
2. tenant admin console
3. floor and cash workspace
4. station board
5. waiter/mobile PDA workspace

These surfaces should share one runtime contract and one operational language
while still feeling purpose-built for their user role.

For the deeper surface rationale and role split, see:

- [`../../explanation/concepts/operational-surfaces.md`](../../explanation/concepts/operational-surfaces.md)
- [`./runtime-surfaces.md`](./runtime-surfaces.md)

## Runtime Operational Principles

### Station-First Fulfillment

TabFlow uses a station-first model rather than a kitchen-only model.

That means:

- products route to stations
- stations are the fulfillment unit
- the same order may split operationally across different stations
- admins can view all stations, while operators can be scoped to the stations
  that matter to them

### Shared Status Language

All major tenant runtime surfaces should speak the same order-state language:

- `submitted`
- `preparing`
- `ready`
- `served`
- `cancelled`

And they should share the same mental anchors:

- table number
- order id
- item name
- quantity
- notes
- station
- open check status
- device or QR health
- timing or elapsed time

## Package Boundaries

### `src/packages/shared-dotnet`

Shared backend primitives and reusable platform/worker core.

### `src/packages/shared-ts`

Shared TypeScript schemas, validation helpers, and typed client helpers.

### `src/packages/firmware`

ESP32 firmware source and generation inputs for per-table runtime artifacts.

## Platform And Tenant Split

The platform is not a tenant.

The platform owns control-plane state and lifecycle orchestration. Tenants own
runtime business state.

This split is intentional and should remain explicit in code, docs, and runtime
operations.

## Data Ownership

### Platform Database Owns

- platform admins
- tenant registry
- tenant domains
- provisioning jobs
- platform audit logs
- secret references and registry metadata

### Tenant Databases Own

- tenant profile
- menu categories and items
- tables
- device keys
- QR token and table/session lifecycle
- orders and bills
- tenant-local admin users
- station and kitchen-local operational state

The platform should not depend on tenant business tables for normal control
plane operation.

## Runtime Model

The repository is source-first.

High-level runtime split:

- source code remains in `/opt/tabflow`
- published backend artifacts live under `/opt/tabflow-deploy/...`
- host-managed environment/config lives under `/etc/tabflow`
- generated runtime artifacts live outside the source tree

Web applications currently run from Next.js standalone output generated from the
repository build tree.

## Provisioning Principle

Creating a tenant is a job-oriented control-plane action.

Expected shape:

1. reserve tenant registry state
2. create a provisioning job
3. let the worker perform runtime orchestration
4. make lifecycle state visible and retryable

Infrastructure side effects should not be hidden inside frontend request
handlers.

For lifecycle reasoning, see:

- [`../../explanation/concepts/tenant-lifecycle.md`](../../explanation/concepts/tenant-lifecycle.md)

## Current Capability Snapshot

Implemented:

- platform tenant registry API
- platform admin auth baseline and audit trail
- platform runtime visibility
- provisioning worker baseline
- tenant schema bootstrap
- public catalog and session bootstrap
- customer order and open bill baseline
- tenant admin catalog, table, station, kitchen, and device operations
- device WebSocket token push
- baseline waiter/mobile workflow UI

Planned:

- advanced payment lifecycle and richer bill operations

Out of scope for the current repository:

- production secret management automation
- fully generalized runtime packaging/host automation inside the repo

## Non-Functional Baseline

Current quality targets:

- platform API availability target: `99.9%`
- tenant API availability target: `99.9%`
- public catalog latency target: `p95 < 300 ms`
- admin mutation latency target: `p95 < 500 ms`
- successful tenant provisioning ratio target: `> 99%`

Current observability direction:

- structured logs with request id, tenant code when available, actor identity
  when available, and endpoint context
- step-level provisioning visibility
- metrics and tracing are expected but not fully established in-repo yet

Current security direction:

- no secrets in source control
- app-to-app auth should move toward short-lived internal identity
- admin and device credentials must remain rotatable
- raw secret material should only be shown at creation/rotation time

## Testing And Tooling Conventions

### Test Layout

- backend and shared `.NET` code use sibling `tests/` directories
- frontend and shared TypeScript code use co-located `*.test.*` files
- frontend app harness files may live in app-local `test/` directories

### Build Artifacts

Tool-native output locations remain intact:

- Next.js: `.next/`
- TypeScript packages: `dist/` where applicable
- .NET: `bin/` and `obj/`

The repository intentionally does not impose a synthetic root build directory.
