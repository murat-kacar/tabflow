# Tenant API Reference

The tenant API is the externally visible HTTP surface of a tenant host.

After Refactor 3 the tenant host runs a Blazor Web App. Most server work
happens through Razor components and dependency-injected application
services, not through an internal HTTP layer. This document covers only
the HTTP endpoints that remain in the external contract: the health
probes, the customer-facing public endpoints, and the ESP32 device
WebSocket.

Administrative and staff surfaces do not appear in this reference. They
interact with the domain directly through Blazor components. See
[`../architecture/runtime-surfaces.md`](../architecture/runtime-surfaces.md).

## Base

Each tenant host serves on its own domain. Example:

```text
https://<tenant-domain>/
```

All listed endpoints are relative to that host.

## Health

```http
GET /health
GET /health/live
GET /health/ready
```

- `/health` returns service metadata.
- `/health/live` returns liveness without external dependency checks.
- `/health/ready` additionally checks tenant database readiness.

Responses are plain JSON. Probes are unauthenticated.

## Public Endpoints

These endpoints serve the customer-facing flow on top of the Static SSR
menu surface. They are HTTP endpoints because HTTP is the natural
contract for the device-agnostic customer browser.

QR-token join does not appear here. The join flow is owned by the
Static SSR page at `/g/{token}` (route T-03 in
[`../architecture/runtime-surfaces.md`](../architecture/runtime-surfaces.md)):
the page GET validates the token, opens the table session, issues the
access cookie, and redirects to `/menu` in one round trip. There is no
separate HTTP endpoint that duplicates that work.

### Tenant Profile

```http
GET /api/public/profile
```

Returns:

- `code`
- `displayName`
- `primaryDomain`
- `languageCode`
- `currencyCode`
- `timeZone`

Anonymous. Safe to cache per tenant host.

### Public Catalog

```http
GET /api/public/catalog
```

Returns:

- Tenant summary
- Active categories
- Available menu items

Anonymous. The payload is scoped to customer-relevant fields only.
Internal routing and pricing-construction fields stay server-side.

### Customer Session

```http
GET /api/public/session
```

Returns the current session state for the cookie-bearing browser,
including the active table label and the current cart summary.

A customer-initiated logout endpoint is intentionally not exposed.
Access tickets become invalid automatically when the parent table
session closes; a browser-side logout would not add operational value.

### Customer Order Submission

```http
POST /api/public/orders
```

Body includes the order items assembled from the server-side cart and a
fresh QR checkout-proof token produced by a second scan of the current
table QR at submit time.

Behavior:

- Verifies that the access ticket belongs to the still-open table
  session.
- Verifies and consumes the fresh QR checkout proof from the request
  body.
- Atomically converts the cart into an order and order items.
- Publishes `order.submitted` on the in-process event bus so the floor
  and cash workspace and the relevant station boards react immediately.

Checkout-proof verification is inlined into this endpoint rather than
split into a separate `verify` call. Submission is the only place a
checkout proof is meaningful, so colocating the check keeps the protocol
single-round-trip and avoids duplicated verify plumbing.

## Device WebSocket

```text
wss://<tenant-domain>/ws/tables/{tableNumber}?deviceKey={deviceKey}
```

Authentication:

- `{deviceKey}` is compared with the stored `device_key_hash` for the
  table using a constant-time comparison.
- Only one device connection is accepted per table.

Message flow:

- Server sends `auth_ok` on successful handshake.
- Server sends `new_token` payloads when the current QR token rotates.
- Server sends `refresh` when operational state invalidates the current
  QR.
- Client sends `ping`; server replies with `pong`.

Token payload fields:

- `url`
- `ttl_seconds`
- `expires_at`
- `qr_side`
- `qr_bits_hex`

The payload is backend-produced. Firmware does not generate QR codes
locally. Details live in [`../firmware.md`](../firmware.md).

Refactor 3 replaced the legacy Turkish-language path
`/ws/masa/{tableNumber}?anahtar={deviceKey}` with the English-language
path above. Firmware releases that predate that rename must be upgraded
before they can connect to a Refactor 3 tenant host.

## Error Rules

- Validation errors return `400` with a problem-details body.
- Missing or expired session returns `401`.
- Authorization failures return `403`.
- Missing resources return `404`.
- Rate-limit-exceeded responses return `429`.
- Provisioning or runtime infrastructure problems surface through
  `/health` and provisioning job state, not through customer-facing
  endpoints.

## Absent Surfaces

The following endpoint families are not part of the external tenant API:

- `/api/admin/**` was removed with Refactor 3. Admin and staff surfaces
  interact with the domain through Blazor components, not through an
  internal HTTP layer.
- `/api/public/token/verify` was removed with Refactor 3. Token join
  runs inside the `/g/{token}` Static SSR page; checkout proof is
  inlined into `POST /api/public/orders`.
- `/api/public/session/logout` was removed with Refactor 3; see
  [Customer Session](#customer-session) for the rationale.
- Tenant-side audit log export is not an external endpoint today. Audit
  review runs inside the tenant admin console.

## Versioning

Public customer endpoints stay unversioned on the current major.
Additive, non-breaking changes are allowed. A breaking change introduces
a new major surface in parallel, for example `/api/v2/public/**`. See
[`./README.md`](./README.md).

## Related

- [`../architecture/runtime-surfaces.md`](../architecture/runtime-surfaces.md)
- [`../architecture/system-overview.md`](../architecture/system-overview.md)
- [`../firmware.md`](../firmware.md)
- [`../../explanation/concepts/customer-session-model.md`](../../explanation/concepts/customer-session-model.md)
