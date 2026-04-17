# TabFlow Source

Copyright (c) 2026 Murat Kacar. All rights reserved.

TabFlow is proprietary software. See [LICENSE](LICENSE) for the full rights
reservation and usage restrictions.

Source-code-only product foundation for a generic multi-tenant cafe ordering
platform.

This repository is documentation-led. Architecture and operations documents are
expected to describe the intended shape before implementation fills it in. When
code and docs disagree, treat that as a bug.

This source baseline targets:

- Backend: ASP.NET Core on .NET 10
- Frontend: Next.js + TypeScript + Tailwind CSS 4
- Database: PostgreSQL 17

This directory intentionally excludes deployment, VPS, Docker, operating-system,
Nginx, Certbot, CI, Git metadata, runtime state, and secret-management layers.
Those concerns should be reintroduced later as explicit, generic layers after
the source architecture is stable.

## Layout

```text
apps/
  platform-api/   Platform admin API and tenant provisioning
  platform-operator/ Provisioning worker source
  platform-web/   Platform admin web app
  tenant-api/     Tenant runtime API and device WebSocket API
  tenant-web/     Customer menu and tenant admin web app
packages/
  shared-dotnet/  Shared .NET primitives, contracts, and platform core
  shared-ts/      Shared TypeScript schemas and client helpers
  firmware/       ESP32 firmware source and config generator
infra/
  postgres/       Platform and tenant migrations
docs/             Architecture and operations documentation
```

## Design Rules

- No hard-coded production domain.
- No secrets in source code.
- Tenant data is isolated by database and database user.
- Schema changes are migrations, not runtime ad-hoc table creation.
- Generated firmware config files are secrets.
- Runtime packaging and host automation are separate layers, not source
  requirements.

## Current Baseline

Implemented:

- Platform API health endpoint.
- Platform tenant registry API.
- Server-side platform API key guard for tenant registry endpoints.
- Platform Web tenant list/create/status management screen.
- Platform Web selected-tenant operations panel with tenant-scoped provisioning/audit context.
- Platform runtime visibility summary from latest provisioning result and runtime health probe.
- Platform admin login page with signed httpOnly session cookie.
- First admin bootstrap from configuration when no admin exists.
- Platform admin role model with endpoint-level authorization.
- Platform audit log for login and tenant lifecycle actions.
- Tenant create flow can capture the intended first tenant admin email.
- Platform PostgreSQL initial migration for tenants, domains, admins, and jobs.
- Background provisioning worker that processes queued tenant jobs.
- Generated per-table firmware `config.h` outputs.
- Separate `platform-operator` worker process for host-level provisioning execution.
- Platform Web provisioning and audit visibility panels.
- Next.js platform and tenant web shells.
- Shared TypeScript package and shared .NET platform core package.
- Tenant runtime schema, startup initializer, public catalog endpoints, QR token verify plus persisted customer session baseline, table-bound open bill lifecycle, admin bootstrap/login plus session guard baseline, protected admin catalog/device/bill management API, device websocket auth/token push baseline, table-centric tenant operations dashboard, waiter-style per-table action panel, service station CRUD, kitchen/KDS board, order create flow, and tenant tests.
- Firmware package skeleton.
- Lint, typecheck, unit/component test tooling.

Not implemented yet:

- Deeper bill operations, payment lifecycle flows, and a dedicated waiter workflow surface.
- Runtime packaging.
- Production secret management.
- Fine-grained multi-role management UI and audit exploration screens.

## Development Commands

```bash
dotnet restore TabFlow.sln
dotnet build TabFlow.sln
dotnet test TabFlow.sln --collect:"XPlat Code Coverage"

pnpm install
pnpm lint
pnpm typecheck
pnpm test:ts
pnpm --filter @tabflow/platform-web build
pnpm --filter @tabflow/tenant-web build
```

## Documentation Map

- `SOURCE_BASELINE.md`: what this source-only baseline includes and excludes.
- `docs/architecture.md`: service, package, and data boundaries.
- `docs/tenant-lifecycle.md`: tenant create/archive/delete lifecycle.
- `docs/platform-api.md`: current platform API contract.
- `docs/tenant-api.md`: current tenant API baseline.
- `docs/firmware.md`: ESP32 device architecture and hardware lock.
- `docs/adr-0001-stack.md`: stack decision record.
- `docs/host-operations.md`: host-specific operational reference (not a source baseline contract).
