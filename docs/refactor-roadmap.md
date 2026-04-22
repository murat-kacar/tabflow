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
