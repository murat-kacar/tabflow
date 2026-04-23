# Glossary

This glossary defines the durable terms used across TabFlow
documentation. When a doc says "access ticket" or "checkout proof" it
means the exact concept defined here.

Terms are grouped by domain. Cross-references point to the canonical
reference or explanation document for each term.

## Hosting And Tenancy

### Platform Host
The single Blazor Web App process that serves the platform control
plane: tenant registry, platform admin users, provisioning jobs, and
platform audit review. One instance for the whole deployment. See
[`./architecture/system-overview.md`](./architecture/system-overview.md).

### Platform Worker
The background service that claims `tenant.create` jobs from the
platform database and orchestrates tenant runtime setup. Runs as its
own process; shares the platform database with the platform host.

### Tenant Host
One Blazor Web App process per cafe. Bound to exactly one tenant
database. Serves the customer menu, the admin console, the floor and
cash workspace, the waiter PDA, and the station boards.

### Tenant
A single cafe's runtime: one tenant database, one tenant host process,
one primary domain. Created by the platform; its lifecycle is described
in
[`../explanation/concepts/tenant-lifecycle.md`](../explanation/concepts/tenant-lifecycle.md).

### Tenant Code
Stable, short identifier for a tenant (for example `demo-cafe`). Used
as the suffix for the tenant database name and as a routing key in
platform administration.

## Runtime Surfaces And Identities

### Runtime Surface
A family of related screens (for example the admin console or the
station board). The full list and per-surface render mode live in
[`./architecture/runtime-surfaces.md`](./architecture/runtime-surfaces.md).

### Render Mode
The Blazor mode a component uses: Static SSR or Interactive Server.
Reasoning lives in
[`./architecture/render-modes.md`](./architecture/render-modes.md).

### Platform User
An ASP.NET Core Identity user that authenticates against the platform
host. Platform users have platform-level roles and do not exist in any
tenant database.

### Tenant User
An ASP.NET Core Identity user that authenticates against a specific
tenant host. Has one tenant role: `owner`, `manager`, `cashier`, or
`waiter`. Lives only in that tenant's database.

### Station Device Identity
A non-Identity identity type used by station boards. The concrete auth
mechanism is deferred until hardware selection; see
[`../explanation/concepts/authorization.md`](../explanation/concepts/authorization.md).

## Customer Session Model

### QR Token
A short-lived, single-use join proof embedded in the table QR code.
Becomes invalid the moment it is consumed. Details in
[`../explanation/concepts/customer-session-model.md`](../explanation/concepts/customer-session-model.md).

### Table Session
The canonical live customer session for one table. Starts when the
first fresh QR is consumed; ends when the store closes the check.
Multiple browsers may attach to one table session.

### Access Ticket
One browser participant's attachment to a table session. Carried in a
first-party `httpOnly` cookie. Not a hard device identity; refresh and
private tabs can produce new access tickets.

### Server-Side Cart
The customer's current cart lines, stored in
`customer_session_cart_items` and bound to an access ticket and table
session. Not stored in `localStorage` or the access cookie.

### Checkout Proof
A second, fresh QR token that must accompany every order submission.
Verified and consumed inside `POST /api/public/orders`; there is no
separate verify endpoint.

## Catalog And Fulfillment

### Station
A fulfillment unit (kitchen, bar, barista, hookah, dessert, dispatch).
Products route to stations; one order may split across several
stations.

### Fallback Station
The one station every tenant must declare as the catch-all when product
routing does not resolve explicitly. Ensures items never disappear
operationally because of a routing gap.

### Order
The submitted result of converting a server-side cart into persisted
order lines, attributed to a table session and an access ticket.
Carries an `order.submitted` event on the in-process event bus so staff
surfaces react immediately.

### Bill
The open or closed customer check for a table session. Supports move,
merge, split, and close actions from the floor and cash workspace.

## Device Layer

### Table Device
The ESP32 display at each table that renders the current QR matrix.
Connects to the tenant host over the device WebSocket. Described in
[`./firmware.md`](./firmware.md).

### Device Key
The long-lived shared secret stored on a table device. Compared against
the tenant's stored `device_key_hash` using constant-time comparison.
Rotatable.

### Device WebSocket
`wss://<tenant-domain>/ws/tables/{tableNumber}?deviceKey=...`. One
connection per table. Delivers `new_token`, `refresh`, and heartbeat
messages to the device.

## Infrastructure

### In-Process Event Bus
A `Channel<T>`-backed publish and subscribe mechanism inside a tenant
host. Used for events such as `order.submitted`,
`order.status_changed`, and `bill.mutated`. Scoped to one tenant host
process; no cross-host broker is used.

### Provisioning Job
A row in the platform database that represents an ongoing tenant
lifecycle operation such as `tenant.create`. Claimed and advanced by
the platform worker; visible from the platform admin console.

### Tenant Audit Log
A per-tenant append-only log of significant actions (login, role
changes, bill mutations, station device pair and revoke events).
Stored in `{tenant}_audit_log`; reviewable from the tenant admin
console.

### Platform Audit Log
The platform-level equivalent: records tenant CRUD, platform user
changes, and provisioning job triggers.

## Documentation

### ADR
Architectural Decision Record. Each ADR has an ID (`AD-0001`,
`AD-0002`, …) and states context, decision, and consequences. The
current set lives in
[`./architecture/decisions.md`](./architecture/decisions.md).

### Surface ID
The stable identifier for a runtime surface used across documents.
Platform surfaces use `P-##`; tenant surfaces use `T-##`; device
endpoints use `D-##`. Declared in
[`./architecture/runtime-surfaces.md`](./architecture/runtime-surfaces.md).

### SLI / SLO
Service-Level Indicator (a measurable signal) and Service-Level
Objective (a target over a rolling window). Targets live in
[`./architecture/slos.md`](./architecture/slos.md).

## Related

- [`./architecture/runtime-surfaces.md`](./architecture/runtime-surfaces.md)
- [`./architecture/system-overview.md`](./architecture/system-overview.md)
- [`./architecture/decisions.md`](./architecture/decisions.md)
- [`./database/schema.md`](./database/schema.md)
