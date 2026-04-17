# API Governance

Scope: Source Baseline

Status Snapshot: 2026-04-17

This document defines API contract governance for `platform-api` and `tenant-api`.

## Implemented (As Of Snapshot Date)

- Both APIs register OpenAPI services and expose OpenAPI JSON only in
  development environments.
- Runtime endpoints are currently unversioned (`/api/platform/...`,
  `/api/public/...`, `/api/admin/...`).

## Versioning Policy

- Current contract major version is `v1` semantics on existing unversioned paths.
- Additive non-breaking changes are allowed within the current major.
- Breaking changes require a new major surface, published in parallel.
- Existing major contracts should not be removed until a published sunset date is reached.

Planned concrete majoring shape:

- `platform-api`: `/api/v2/platform/...`
- `tenant-api`: `/api/v2/public/...` and `/api/v2/admin/...`

## OpenAPI Publication Policy

- Development runtime publication: enabled through `MapOpenApi` for local use.
- Stable publication target: repository-hosted static artifacts per API and major version.
- Planned artifact naming:
  - `docs/openapi/platform-api-v1.json`
  - `docs/openapi/tenant-api-v1.json`

Until CI automation is added, OpenAPI snapshots should be regenerated manually
whenever endpoint signatures change.

## Deprecation Policy

- Every deprecated endpoint/field must be marked in docs with:
  - deprecation date
  - replacement contract
  - sunset date
- Sunset windows should be long enough for platform-web, tenant-web, and
  firmware upgrade cycles to complete safely.

## Out Of Scope

- Public developer portal tooling and API monetization concerns.
- External third-party API partner policies.
