# Refactor Roadmap

This document records the agreed sequencing for structural refactors so we can
improve repo semantics without destabilizing the live system.

## Applied First Wave

- renamed source path `apps/platform-operator` -> `apps/platform-worker`
- renamed worker project file to `TabFlow.Platform.Worker.csproj`
- updated solution and source documentation to match the new worker wording
- prepared `packages/shared-ts/src/generated/` for future machine-generated contracts

Intentional non-change:

- runtime unit name stays `tabflow-platform-operator.service` for now
- `infra/postgres` stays under `infra/`
- the repo root is not moved under `src/` yet

## Why `infra/postgres` Stays in `infra`

`postgres` migrations are infrastructure assets, not app entrypoints and not
reusable library packages. Because of that they should remain under:

```text
infra/postgres
```

and should not move under `apps/` or `packages/`.

## Next Safe Wave

1. add `generated` usage rules to shared TypeScript contract workflows
2. decide whether `packages/firmware` remains a package or becomes a
   `resources/firmware` template area
3. introduce clearer infra subdomains if needed, for example:

```text
infra/
  postgres/
  nginx/
  systemd/
  terraform/   (future)
```

## Deferred Heavy Wave

The larger structural move to:

```text
tabflow/
  src/
    apps/
    packages/
    infra/
  docs/
  scripts/
```

is intentionally deferred.

Before that move we need a full path dependency audit covering:

- `.sln` and `.csproj` references
- embedded SQL resources
- `pnpm-workspace.yaml`
- root scripts and build tooling
- Next standalone runtime assumptions
- host deploy paths and manual ops commands
- repository-relative docs links

That large move should happen only after the audit is complete and the runtime
surface has dedicated verification steps.

## Path Dependency Audit For `src/` Move

The deferred move to:

```text
tabflow/
  src/
    apps/
    packages/
    infra/
  docs/
  scripts/
```

will break more than naming. The following dependency groups must be updated
in one coordinated wave.

### 1. Solution and .NET Project Paths

Hard references exist in:

- `TabFlow.sln`
- `apps/platform-api/tests/TabFlow.Platform.Api.Tests/TabFlow.Platform.Api.Tests.csproj`
- `apps/platform-worker/src/TabFlow.Platform.Worker/TabFlow.Platform.Worker.csproj`
- `apps/tenant-api/src/TabFlow.Tenant.Api/TabFlow.Tenant.Api.csproj`

Critical examples:

- solution entries point to `apps/...` and `packages/...`
- `Tenant.Api.csproj` embeds:
  - `../../../../infra/postgres/migrations/tenant/0001_initial.sql`
  - `../../../../packages/firmware/arduino/tabflow-table-display/firmware.ino`
- test projects read source files using repo-relative paths

### 2. Workspace and TypeScript Tooling

Hard references exist in:

- `pnpm-workspace.yaml`
- `package.json`
- `tsconfig.base.json`
- `turbo.json`
- app/package `package.json` files
- `pnpm-lock.yaml`

Critical examples:

- workspace globs currently include:
  - `apps/*`
  - `packages/shared-ts`
  - `packages/firmware`
- root script `i18n:audit` points to `scripts/audit-i18n-visible-text.mjs`
- lockfile stores package link locations relative to current app/package layout

### 3. Runtime and Deployment Assumptions

Source references exist in docs and code, and host/runtime assumptions exist in
templates and live operations.

Critical examples:

- Next runtime uses source-root build outputs under `apps/tenant-web`
- platform provisioning templates in
  `packages/shared-dotnet/src/TabFlow.Platform/Tenants/ProvisioningService.cs`
  hardcode:
  - `{{options.TenantWebRoot}}/.next/standalone/apps/tenant-web/server.js`
  - `{{options.TenantWebRoot}}/.next/static`
- host docs refer to source paths like `apps/platform-worker`
- any future move under `src/` must keep systemd/deploy commands aligned

### 4. Scripts and Documentation Links

Hard references exist in:

- `README.md`
- `SOURCE_BASELINE.md`
- `docs/*.md`
- `scripts/audit-i18n-visible-text.mjs`

Critical examples:

- docs currently reference `apps/...`, `packages/...`, `infra/postgres/...`
- script scan roots currently assume:
  - `apps/tenant-web/app`
  - `apps/platform-web/app`

### 5. Test Fixtures and Convention Tests

Several tests intentionally read files by repo-relative path and will break
immediately if the tree moves.

Examples:

- `apps/platform-api/tests/.../PlatformMigrationSqlTests.cs`
- `apps/platform-api/tests/.../ProvisioningServiceSqlTests.cs`
- `apps/platform-api/tests/.../PlatformNamespaceConventionTests.cs`
- `apps/tenant-api/tests/.../TenantBootstrapSecurityTests.cs`

## Recommended Execution Order For The Heavy Move

1. update solution and `.csproj` paths
2. update embedded resource paths
3. update `pnpm-workspace.yaml`, TS configs, and root scripts
4. move `apps`, `packages`, and `infra` under `src/`
5. regenerate lockfile and rebuild TS workspaces
6. run full `.NET` solution build and tests
7. run tenant/platform web builds
8. update docs and script scan roots
9. re-verify tenant web standalone runtime assumptions before any deploy

## Explicit Non-Goals For The Heavy Move

To keep risk bounded, the `src/` move should not be mixed with:

- runtime service renames
- nginx/systemd contract changes
- auth/session model changes
- API contract changes
- firmware lifecycle redesign
