# TabFlow Source

Copyright (c) 2026 Murat Kacar. All rights reserved.

TabFlow is proprietary software. See [LICENSE](LICENSE) for the full
rights reservation and usage restrictions.

Source-code-only product foundation for a generic multi-tenant cafe
ordering platform.

This repository is documentation-led. Architecture and operations
documents are expected to describe the intended shape before
implementation fills it in. When code and docs disagree, treat that as
a bug.

Current source targets:

- Runtime: .NET 10
- UI: Blazor Web App (mixed Static SSR and Interactive Server render
  modes)
- Database: PostgreSQL 17 with EF Core 10 migrations

The repository keeps source, documentation, and stable project
configuration in Git. Runtime state, deployment output, host-owned
configuration, and secrets stay outside the repository tree.

## Layout

```text
src/apps/
  platform/           ASP.NET Core host, platform control plane
  platform-worker/    Background worker, provisioning jobs
  tenant/             ASP.NET Core host, one tenant runtime
src/packages/
  shared-dotnet/      Shared domain and application service code
  firmware/           ESP32 firmware source and config generator
src/infra/
  postgres/           EF Core migrations and database assets
docs/                 Architecture and operations documentation
docs.archive/         Prior documentation tree retained for history
```

The platform host and the platform worker share the platform database.
Each tenant host is one process bound to one tenant database. The full
shape lives in
[docs/reference/architecture/system-overview.md](docs/reference/architecture/system-overview.md).

## Conventions

Test layout:

- backend and shared `.NET` code use sibling `tests/` directories
- .NET outputs stay in `bin/` and `obj/`
- this repository intentionally does not impose a synthetic root
  `build/` directory

Tooling root:

- `src/` is the canonical source root for workspace and monorepo
  tooling
- repo tooling should point at `src/apps/*` and `src/packages/*`

## Design Rules

- No hard-coded production domain.
- No secrets in source code.
- Tenant data is isolated by database and database user.
- Schema changes are migrations, not runtime ad-hoc table creation.
- Generated firmware artifacts are secrets.
- Runtime packaging and host automation are separate layers, not
  source requirements.

## Development Commands

```bash
dotnet restore TabFlow.sln
dotnet build TabFlow.sln
dotnet test TabFlow.sln --collect:"XPlat Code Coverage"
dotnet format --verify-no-changes
```

See [docs/how-to/local-development.md](docs/how-to/local-development.md)
for the full local workflow and
[docs/how-to/ci.md](docs/how-to/ci.md) for the CI check set.

## Documentation Map

- [docs/README.md](docs/README.md): documentation entrypoint.
- [docs/tutorials/getting-started.md](docs/tutorials/getting-started.md):
  contributor onboarding path.
- [docs/reference/architecture/system-overview.md](docs/reference/architecture/system-overview.md):
  source tree, boundaries, runtime model, and capability snapshot.
- [docs/reference/architecture/runtime-surfaces.md](docs/reference/architecture/runtime-surfaces.md):
  route map, role matrix, render mode per surface.
- [docs/reference/architecture/decisions.md](docs/reference/architecture/decisions.md):
  active architectural decision records (AD-0001..AD-0008).
- [docs/reference/architecture/slos.md](docs/reference/architecture/slos.md):
  service-level indicators, objectives, and error-budget policy.
- [docs/reference/architecture/capability-matrix.md](docs/reference/architecture/capability-matrix.md):
  implementation status matrix.
- [docs/reference/api/README.md](docs/reference/api/README.md): API
  governance and API reference entrypoint.
- [docs/reference/database/schema.md](docs/reference/database/schema.md):
  platform and tenant database ownership.
- [docs/reference/firmware.md](docs/reference/firmware.md): ESP32
  firmware hardware profile, runtime contract, and generated artifact
  ownership.
- [docs/reference/glossary.md](docs/reference/glossary.md): canonical
  term index.
- [docs/explanation/concepts/tenant-lifecycle.md](docs/explanation/concepts/tenant-lifecycle.md):
  tenant lifecycle model.
- [docs/explanation/concepts/customer-session-model.md](docs/explanation/concepts/customer-session-model.md):
  QR, table session, access ticket, and checkout proof model.
- [docs/explanation/concepts/authorization.md](docs/explanation/concepts/authorization.md):
  Identity, roles, and policy model.
- [docs/how-to/local-development.md](docs/how-to/local-development.md):
  local development workflow.
- [docs/how-to/deploy-to-production.md](docs/how-to/deploy-to-production.md):
  host-side deployment shape.
- [docs/meta/changelog.md](docs/meta/changelog.md): documentation
  changelog.
- [CHANGELOG.md](CHANGELOG.md): product release notes (starts with the
  first post-Refactor-3 release).
