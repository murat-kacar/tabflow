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

## Documentation Scope

Every document should declare one scope line near the top:

- `Scope: Source Baseline` for source-owned contracts and architecture.
- `Scope: Operational Reference` for environment-specific runtime runbooks.

This repository currently ships only source-baseline docs.

## Current Baseline

Use [docs/capability-matrix.md](docs/capability-matrix.md) as the single
feature status reference instead of duplicating a long list in this README.

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
- `docs/capability-matrix.md`: implemented/partial/planned capability matrix.
- `docs/architecture.md`: service, package, and data boundaries.
- `docs/api-governance.md`: API versioning and OpenAPI publication policy.
- `docs/tenant-lifecycle.md`: tenant create/archive/delete lifecycle.
- `docs/platform-api.md`: current platform API contract.
- `docs/tenant-api.md`: current tenant API baseline.
- `docs/firmware.md`: ESP32 device architecture and hardware lock.
- `docs/nfr-baseline.md`: non-functional baseline and operational targets.
- `docs/adr-0001-stack.md`: stack decision record.
- `docs/adr-0002-internal-trust-boundary.md`: planned internal auth boundary evolution.
