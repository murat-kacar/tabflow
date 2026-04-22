# Source Baseline

Scope: Source Baseline

Status Snapshot: 2026-04-17

This directory is a source-only working baseline for rebuilding TabFlow without
old VPS runtime state.

Included:

- Application source under `src/apps/`
- Shared packages under `src/packages/`
- Product and architecture documentation under `docs/`
- PostgreSQL schema migrations under `src/infra/postgres/migrations/`
- Root build and workspace configuration files

Intentionally excluded:

- Git metadata and CI configuration
- Dockerfiles, Docker Compose, Nginx, systemd, deploy scripts, inventory files,
  and VPS/operating-system runbooks
- Local IDE state such as `.vs/` and launch settings
- Installed dependencies such as `node_modules/`
- Generated build output such as `.next/`, `bin/`, `obj/`, `dist/`, coverage,
  `TestResults/`, and `*.tsbuildinfo`
- Runtime data, generated tenant artifacts, backups, inventory files, and
  secrets

Use this baseline to make the product code buildable and reviewable first.
Reintroduce Docker, deployment automation, operating-system runbooks, and Git
history later as explicit layers after the source architecture is stable.
