# API Reference

This folder is the source of truth for externally relevant API contracts inside
the repository documentation tree.

Split documents by surface only when the API domains are truly separate.

## Governance Baseline

Current contract baseline:

- APIs are currently unversioned on their runtime paths
- current semantics are treated as `v1`
- additive non-breaking changes are allowed within the current major
- breaking changes should introduce a new major surface in parallel

Planned majoring direction:

- `platform-api`: `/api/v2/platform/...`
- `tenant-api`: `/api/v2/public/...` and `/api/v2/admin/...`

## OpenAPI Publication Direction

Current source baseline:

- OpenAPI is exposed for local/development use
- stable repository-hosted artifacts are a planned next step

Expected future artifact shape:

- `docs/openapi/platform-api-v1.json`
- `docs/openapi/tenant-api-v1.json`

## Deprecation Rule

Deprecated endpoints or fields should be documented with:

- deprecation date
- replacement contract
- sunset date

Current API references:

- [platform-api.md](./platform-api.md)
- [tenant-api.md](./tenant-api.md)
