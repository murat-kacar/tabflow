# Refactor Roadmap

This document records the structural refactor decisions that have already been
applied and the smaller follow-up items that still remain.

## Applied Structure

The repository now uses:

```text
tabflow/
  src/
    apps/
    packages/
    infra/
  docs/
  scripts/
```

Current source roots:

- `src/apps/platform-api`
- `src/apps/platform-worker`
- `src/apps/platform-web`
- `src/apps/tenant-api`
- `src/apps/tenant-web`
- `src/packages/shared-dotnet`
- `src/packages/shared-ts`
- `src/packages/firmware`
- `src/infra/postgres`

## Applied Refactor Waves

### Wave 1

- renamed source path `platform-operator` -> `platform-worker`
- renamed the worker project to `TabFlow.Platform.Worker.csproj`
- introduced `src/packages/shared-ts/src/generated/` for future generated contracts

### Wave 2

- moved `apps`, `packages`, and `infra` under `src/`
- updated solution paths and repo-relative test fixtures
- updated workspace and script scan roots
- updated runtime source defaults that referenced `/opt/tabflow/apps/...`
- rebuilt `.NET` solution and web builds against the new tree

## Why `src/infra/postgres` Stays In `src/infra`

`postgres` migrations are infrastructure assets, not runnable apps and not
reusable library packages. They belong under:

```text
src/infra/postgres
```

and should not move under `src/apps/` or `src/packages/`.

## Important Runtime Note

The source tree moved under `src/`, but Next.js standalone output still
materializes its runtime app folder as:

```text
.next/standalone/src/apps/tenant-web/server.js
```

and similarly for `platform-web`.

That standalone internal layout is expected and should not be rewritten
mechanically just because the source repo now lives under `src/`.

## Remaining Follow-Up Items

1. decide whether `src/packages/firmware` should remain a package or become a
   resource/template area such as `resources/firmware`
2. decide whether `src/infra/` should be subdivided further:

```text
src/infra/
  postgres/
  nginx/
  systemd/
  terraform/   (future)
```

3. align host deployment scripts and live systemd environment defaults with the
   new source root if those scripts are reintroduced into the repository later

## Conventions Locked In

The current source layout also locks in the following repository conventions.

### Test Convention

- backend and shared `.NET` code use sibling `tests/` directories
- frontend and shared TypeScript code use co-located `*.test.*` files
- frontend app harness/setup files may live in app-local `test/` directories

This means the repository does not need a separate root `tests/` tree.

### Artifact Convention

- Next.js outputs stay in `.next/`
- TypeScript package outputs stay in local tool-owned paths such as `dist/`
- .NET outputs stay in `bin/` and `obj/`

The repository intentionally does not introduce a synthetic root `build/` or
`out/` directory just to normalize tool outputs.

### Tooling Convention

`src/` is the canonical source root for repository tooling.

That means current and future workspace-aware tooling should resolve source code
from:

- `src/apps/*`
- `src/packages/*`
- `src/infra/*` when infrastructure tooling is added

## Explicit Non-Goals

This structural refactor does not automatically include:

- runtime service renames
- nginx/systemd contract redesign
- auth/session model redesign
- API contract redesign
- firmware lifecycle redesign
