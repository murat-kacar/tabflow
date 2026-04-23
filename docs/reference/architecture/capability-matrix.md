# Capability Matrix

This matrix is the current implementation status summary for the repository.

| Capability | Status | Notes |
| --- | --- | --- |
| Platform tenant registry API | Implemented | Create, list, get, status update, regional settings, runtime visibility, and job visibility endpoints are active. |
| Platform admin auth and audit | Implemented | Bootstrap owner, login, role checks, preference update, and audit rows exist. |
| Platform runtime visibility | Implemented | Runtime summaries derive from provisioning output and health probing. |
| Platform worker provisioning | Implemented | Polls `tenant.create` jobs, writes runtime artifacts, and coordinates host/runtime activation. |
| Tenant schema bootstrap | Implemented | Tenant migration execution and base seed run on startup. |
| Public catalog and session bootstrap | Implemented | Catalog, tables, token verify, session status, and session logout endpoints are active. |
| Customer order and open bill flow | Implemented | Orders bind to table session and roll up into open bills. |
| Tenant admin catalog, tables, stations, kitchen, and devices | Implemented | Protected admin endpoints exist with API key and forwarded admin identity validation. |
| Device WebSocket token push | Implemented | Device auth, token push, manual refresh, and ping/pong are active. |
| Dedicated waiter/mobile workflow UI | Implemented baseline | `/pda` supports authenticated table selection, mobile order composition, item notes, and admin-created table orders. |
| Floor and cash workspace | Implemented baseline | `/service` exposes floor state, open checks, payment queue, close, move, merge, and split workflows. |
| Station board | Implemented baseline | `/stations` and `/stations/[stationCode]` expose station-scoped fulfillment views. |
| Firmware generation | Implemented baseline | Table creation and provisioning can produce per-table ready-to-flash firmware sketches containing runtime config. |
| Advanced payment lifecycle | Planned | Richer payment metadata, payment methods, and reconciliation flows remain future work. |
| Production secret management automation | Out of scope for repository | Source documents secret boundaries, but host secret automation remains outside the repo. |
| Fully generalized runtime packaging and host automation | Out of scope for repository | Current host shape is documented; generalized packaging automation is not maintained in this source tree. |
