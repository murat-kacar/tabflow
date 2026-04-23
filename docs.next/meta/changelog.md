# Docs Changelog

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

## 2026-04-22

- Rebuilt the documentation tree around a Diátaxis-inspired hierarchy.
- Created a fresh documentation skeleton instead of mechanically renaming
  old files.
- Consolidated the remaining firmware, surface-design, floor-model, and
  host-operations material into the active docs tree.
- Tightened section README navigation so the docs tree is easier to scan.
