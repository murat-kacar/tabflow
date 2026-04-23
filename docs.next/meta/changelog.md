# Docs Changelog

This changelog tracks the evolution of the documentation tree only.
Product release notes live in the repo-root
[`../../CHANGELOG.md`](../../CHANGELOG.md) and are kept separate from
this file. See
[`./contributing.md`](./contributing.md) for the split rationale.

## Unreleased — Refactor 3 (Blazor unification)

- Reset architecture decisions as AD-0001..AD-0008 in
  `reference/architecture/decisions.md`.
- Replaced the Next.js plus shared-TypeScript stack with a unified
  ASP.NET Core 10 and Blazor Web App stack (AD-0002).
- Collapsed per-side API and web processes into a single host process per
  side (AD-0003).
- Adopted mixed render modes: Static SSR for public customer surfaces,
  Interactive Server for staff surfaces (AD-0004).
- Replaced handwritten HMAC cookie sessions and forwarded actor headers
  with ASP.NET Core Identity (AD-0005).
- Adopted in-process `System.Threading.Channels` as the real-time event
  bus for staff surfaces (AD-0006).
- Adopted EF Core as the authoritative migration path (AD-0008).
- Added `reference/architecture/render-modes.md` and
  `explanation/concepts/authorization.md`.
- Added `explanation/decisions/why-blazor-unified.md`.
- Rewrote `how-to/deploy-to-production.md` for the single-host-per-side
  deployment shape.
- Rewrote `how-to/provision-tenant.md`: initial owner password is now
  generated once and shown once, replacing the previous fixed baseline.
- Rewrote `tutorials/getting-started.md`: dropped the pnpm step set.
- Reset `reference/architecture/capability-matrix.md` against the
  Refactor 3 target.
- Rewrote `reference/api/tenant-api.md` to the remaining external HTTP
  surface only; retired `reference/api/platform-api.md`.
- Updated every concept document that referenced a hard-coded parent
  domain so the platform does not impose a specific domain choice.
- Added the operational how-to set:
  `how-to/local-development.md`, `how-to/ci.md`,
  `how-to/restart-tenant.md`, `how-to/inspect-provisioning-job.md`,
  `how-to/backup-and-restore.md`, `how-to/rotate-secrets.md`.
- Added `reference/glossary.md` as the canonical term index.
- Added `reference/architecture/slos.md` as the single SLI, SLO, and
  error-budget reference.
- Added a deployment and flow diagram to
  `reference/architecture/system-overview.md`.
- Consolidated route map, role matrix, render mode, ticket-card
  anchors, and urgency bands into
  `reference/architecture/runtime-surfaces.md` as the single
  authority. Removed the duplicated tables from
  `reference/architecture/decisions.md`,
  `reference/architecture/render-modes.md`,
  `reference/architecture/system-overview.md`, and
  `explanation/concepts/operational-surfaces.md`.
- Renumbered tenant route IDs sequentially as T-01..T-16 within their
  surface families; renumbered the ESP32 device WebSocket as D-01.
- Renamed the device WebSocket path from the Turkish-language
  `/ws/masa/{tableNumber}?anahtar=...` to the English
  `/ws/tables/{tableNumber}?deviceKey=...`.
- Removed the `POST /api/public/token/verify` and
  `POST /api/public/session/logout` endpoints; join runs inside the
  Static SSR `/g/{token}` page and checkout-proof validation is
  inlined into `POST /api/public/orders`.
- Reordered the station-device auth candidates in
  `explanation/concepts/authorization.md` so the
  hardware-independent pairing-code path is the safe default until a
  station hardware choice locks.
- Expanded `meta/contributing.md` with the docs-first workflow
  principles and the swap-commit checklist.

## 2026-04-22

- Rebuilt the documentation tree around a Diátaxis-inspired hierarchy.
- Created a fresh documentation skeleton instead of mechanically renaming
  old files.
- Consolidated the remaining firmware, surface-design, floor-model, and
  host-operations material into the active docs tree.
- Tightened section README navigation so the docs tree is easier to scan.
