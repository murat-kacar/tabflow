# Capability Matrix

Scope: Source Baseline

Status Snapshot: 2026-04-17

Use this matrix as the canonical status summary for the source baseline.

| Capability | Status | Notes |
| --- | --- | --- |
| Platform tenant registry API | Implemented | Create/list/get/update status and job visibility endpoints are active. |
| Platform admin auth + audit | Implemented | Bootstrap owner, login, role checks, and audit rows exist. |
| Platform runtime visibility | Implemented | Runtime summary derives from latest provisioning result and health probing. |
| Platform operator worker | Implemented | Polls `tenant.create` jobs and writes runtime artifacts. |
| Tenant schema bootstrap | Implemented | Tenant migration execution and base seed run on startup. |
| Public catalog + session bootstrap | Implemented | Catalog/tables/token verify/session endpoints are active. |
| Customer order + open bill baseline | Implemented | Orders bind to table session and roll up into open bill. |
| Tenant admin catalog/tables/stations/kitchen/devices | Implemented | Protected admin endpoints exist with actor + API key validation. |
| Device WebSocket token push | Implemented | Device auth, token push, refresh, and ping/pong are active. |
| Payment lifecycle and advanced bill operations | Planned | Split/merge/reassign/payment closure metadata are pending. |
| Dedicated waiter workflow UI | Implemented baseline | `/pda` supports authenticated table selection, mobile order composition, item notes, and admin-created table orders. |
| Runtime packaging and host automation | Out of scope | Explicitly excluded from source-only baseline. |
| Production secret management and rotation automation | Out of scope | Source baseline documents contracts but not production secret infra. |
