# Capability Matrix

This matrix is the current implementation status for the repository against
the Refactor 3 target architecture.

Refactor 3 is the Blazor unification refactor: platform and tenant hosts
collapse from per-side web and API processes into one ASP.NET Core host
each, with Blazor Web App mixed render modes, ASP.NET Core Identity, and an
in-process event bus. The legacy Next.js-backed implementation is treated as
pre-refactor history and is not listed as implemented capability here.

Status values:

- `Target` — the capability is part of the Refactor 3 baseline and is
  pending implementation.
- `In progress` — implementation has started on the Refactor 3 branch.
- `Implemented` — the capability is live on the Refactor 3 implementation
  and has at least one automated test covering it.
- `Deferred` — the capability is intentionally not part of Refactor 3 and
  will land later.

| Capability | Status | Notes |
| --- | --- | --- |
| Platform host unified Blazor project | Target | Single ASP.NET Core host replaces platform-api + platform-web split. |
| Tenant host unified Blazor project | Target | Single ASP.NET Core host per tenant replaces tenant-api + tenant-web split. |
| Platform Identity store | Target | ASP.NET Core Identity replaces handwritten HMAC cookie for platform admins. |
| Tenant Identity store | Target | ASP.NET Core Identity per tenant database for owner, manager, cashier, and station_device. |
| Tenant role matrix (owner, manager, cashier, station_device) | Target | Schema present; seeded on tenant bootstrap. |
| Platform admin console surfaces | Target | `/`, `/tenants`, `/tenants/new`, `/tenants/{id}`, `/jobs`, `/audit`, `/login`, `/change-password`. |
| Tenant admin console surfaces | Target | `/console`, `/console/catalog`, `/console/stations`, `/console/tables`, `/console/users`, `/console/firmware`, `/console/audit`. |
| Tenant customer surfaces (Static SSR) | Target | `/`, `/g/{token}`, `/menu`, `/login`, `/change-password`. |
| Tenant floor and cash workspace | Target | `/service` on Interactive Server with server push. |
| Tenant waiter PDA | Target | `/pda` on Interactive Server. |
| Tenant station board | Target | `/stations`, `/stations/{stationCode}` on Interactive Server with server push. |
| Platform tenant registry | Target | Create, list, get, status update, regional settings, runtime visibility, jobs. |
| Platform provisioning worker | Target | Polls `tenant.create` jobs, writes runtime artifacts, coordinates host and runtime activation. |
| Tenant schema via EF Core migrations | Target | Replaces embedded SQL plus idempotent ALTER. |
| Customer session with server-side cart | Target | `customer_sessions`, `customer_access_tickets`, `customer_session_cart_items`, `qr_tokens`. |
| Fresh-QR checkout proof on submit | Target | Required for every order submission. |
| In-process event bus for real-time surfaces | Target | Channel-backed dispatcher for `order.*`, `bill.*`, `table.*`, `device.*`. |
| Tenant audit log | Target | `tenant_audit_log` with the shared audit schema. |
| Device WebSocket token push | Target | ESP32 firmware contract is unchanged. |
| Firmware generation per table | Target | Produces flash-ready single-file sketches with tenant-specific defines. |
| Station device authentication mechanism | Deferred | Depends on station hardware choice; placeholder `StationDevice` policy is in place so the rest of the stack is not blocked. |
| Advanced payment lifecycle | Deferred | Richer payment metadata and reconciliation flows remain future work. |
| Native mobile or third-party external API | Deferred | AD-0003 accepts that a second host project is added when a concrete need appears. |

The Refactor 3 pull request will update rows to `In progress` and then
`Implemented` as each capability lands.
