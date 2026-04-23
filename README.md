# TabFlow Source

Copyright (c) 2026 Murat Kacar. All rights reserved.

TabFlow is proprietary software. See [LICENSE](LICENSE) for the full rights
reservation and usage restrictions.

Source-code-only product foundation for a generic multi-tenant cafe ordering
platform.

This repository is documentation-led. Architecture and operations documents are
expected to describe the intended shape before implementation fills it in. When
code and docs disagree, treat that as a bug.

Current source targets:

- Backend: ASP.NET Core on .NET 10
- Frontend: Next.js + TypeScript + Tailwind CSS 4
- Database: PostgreSQL 17

The repository keeps source, documentation, and stable project configuration in
Git. Runtime state, deployment output, host-owned configuration, and secrets
stay outside the repository tree.

## Layout

```text
src/apps/
  platform-api/   Platform admin API and tenant provisioning
  platform-worker/   Provisioning worker source
  platform-web/   Platform admin web app
  tenant-api/     Tenant runtime API and device WebSocket API
  tenant-web/     Customer menu and tenant admin web app
src/packages/
  shared-dotnet/  Shared .NET primitives, contracts, and platform core
  shared-ts/      Shared TypeScript schemas and client helpers
  firmware/       ESP32 firmware source and config generator
src/infra/
  postgres/       Platform and tenant migrations
docs/             Architecture and operations documentation
```

## Conventions

Test layout:

- backend and shared `.NET` code use sibling `tests/` directories
- frontend and shared TypeScript code use co-located `*.test.*` files
- frontend app harness/setup files may live in app-local `test/` directories

Build artifact layout:

- Next.js apps keep `.next/`
- TypeScript package outputs stay tool-local such as `dist/`
- .NET outputs stay in `bin/` and `obj/`
- this repository intentionally does not impose a synthetic root `build/`
  directory

Tooling root:

- `src/` is the canonical source root for workspace and monorepo tooling
- repo tooling should point at `src/apps/*` and `src/packages/*`

## Design Rules

- No hard-coded production domain.
- No secrets in source code.
- Tenant data is isolated by database and database user.
- Schema changes are migrations, not runtime ad-hoc table creation.
- Generated firmware artifacts are secrets.
- Runtime packaging and host automation are separate layers, not source
  requirements.

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

- [docs/README.md](docs/README.md): documentation entrypoint.
- [docs/tutorials/getting-started.md](docs/tutorials/getting-started.md):
  contributor onboarding path.
- [docs/reference/architecture/system-overview.md](docs/reference/architecture/system-overview.md):
  source tree, boundaries, runtime model, and capability snapshot.
- [docs/reference/architecture/capability-matrix.md](docs/reference/architecture/capability-matrix.md):
  implementation status matrix.
- [docs/reference/api/README.md](docs/reference/api/README.md): API governance
  and API reference entrypoint.
- [docs/reference/database/schema.md](docs/reference/database/schema.md):
  platform and tenant database ownership.
- [docs/reference/firmware.md](docs/reference/firmware.md): ESP32 firmware
  hardware profile, runtime contract, and generated artifact ownership.
- [docs/explanation/concepts/tenant-lifecycle.md](docs/explanation/concepts/tenant-lifecycle.md):
  tenant lifecycle model.
- [docs/explanation/concepts/customer-session-model.md](docs/explanation/concepts/customer-session-model.md):
  QR, table session, access ticket, and checkout proof model.
- [docs/how-to/deploy-to-production.md](docs/how-to/deploy-to-production.md):
  current host-side deployment shape.
