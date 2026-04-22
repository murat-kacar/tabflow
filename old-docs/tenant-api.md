# Tenant API

Scope: Source Baseline

Status Snapshot: 2026-04-17

The Tenant API is the runtime backend for one business tenant.

Base behavior today:

- initializes tenant schema from `src/infra/postgres/migrations/tenant/0001_initial.sql`
- seeds tenant profile, starter tables `000` and `999`, and starter menu catalog on empty databases
- seeds a default tenant admin on empty databases
- optionally seeds initial per-table device keys from configuration
- exposes read-oriented tenant and catalog endpoints
- supports tenant admin login verification plus first-login password rotation
- supports protected tenant admin catalog read and create/update operations
- supports protected tenant admin device listing, key rotation, and manual token refresh
- accepts device WebSocket connections on `/ws/masa/{tableNumber}`
- supports customer QR token verification for session bootstrap
- supports persisted customer session status and logout
- supports public customer order submission
- supports table-bound open bill lifecycle
- supports protected tenant admin order listing through forwarded admin session identity
- supports protected tenant admin table summary and table CRUD operations
- supports protected tenant admin service station CRUD operations
- supports an admin kitchen board grouped by station
- supports per-order-item kitchen status progression

## Configuration

Environment/config values used today:

- `ConnectionStrings:TenantDatabase`
- `Tenant:Code`
- `Tenant:DisplayName`
- `Tenant:BaseUrl`
- `Tenant:BootstrapToken`
- `Tenant:CurrencyCode`
- `Tenant:LanguageCode`
- `Tenant:TimeZone`
- `Tenant:InitialTableCount`
  note: current bootstrap convention always seeds exactly two test tables, `000` and `999`
- `Tenant:DeviceTokenTtlSeconds`
- `Tenant:DeviceKeySeedJson`
- `Tenant:CustomerSessionTtlMinutes`
- `Tenant:InitialAdminEmail`
- `TENANT_SESSION_SECRET` on the tenant web side for signed admin cookies
- `TENANT_ADMIN_API_KEY` on the tenant web side for server-to-server admin API calls
- `TenantAdmin:ApiKey` on the tenant API side for protected admin endpoints

The tenant API should receive these from the selected runtime configuration
layer. This source-only baseline does not prescribe the packaging mechanism.

Contract governance:

- current contract generation/publish rules live in `docs/api-governance.md`
- current baseline contract version is `v1` semantics on unversioned paths

## Endpoints

### Health

```http
GET /health
GET /health/live
GET /health/ready
```

`GET /health` returns service metadata. `GET /health/live` is a process liveness
probe. `GET /health/ready` also checks tenant database connectivity.

### Tenant Profile

```http
GET /api/tenant/profile
```

Returns basic tenant identity:

- code
- display name
- primary domain
- currency
- language
- time zone

### Public Catalog

```http
GET /api/public/catalog
```

Returns:

- tenant profile summary
- active menu categories
- available menu items

### Active Tables

```http
GET /api/public/tables
```

Returns active service tables ordered by table number.

### QR Token Verify

```http
POST /api/public/token/verify
Content-Type: application/json

{
  "token": "F6F83B6A11653E"
}
```

Current behavior:

- verifies a still-active unconsumed table token
- marks the token as consumed
- creates or joins the live table session model described in `docs/customer-sessionization.md`
- issues a browser-scoped access ticket for the joining browser
- returns tenant + table identity plus backend session token so tenant web can open a signed customer session cookie
- tenant web uses this behind `/g/{token}` and redirects the user to `/menu`

Target behavior:

- the scanned QR is only a short-lived join proof
- the browser cookie represents a browser-scoped access ticket, not a physical device identity
- repeated order submission must not rely on the long-lived browser cookie alone
- final order submission should require a fresh QR checkout proof

### Customer Session Status

```http
GET /api/public/session
POST /api/public/session/logout
X-Customer-Session-Token: <session-token>
```

Current behavior:

- active session status returns table identity and expiry timestamps
- logout closes the backend session
- order creation accepts the same session header and binds the order to that session's table and open bill

Direction of travel:

- the current customer session record is an intermediate baseline
- the final model should distinguish:
  - canonical live table session
  - browser-scoped access ticket
  - fresh checkout proof for order submission
- when the open bill closes, all linked customer-facing access must become invalid

### Tenant Admin Bootstrap Status

```http
GET /api/admin/bootstrap-status
```

Returns whether the tenant has any active admin user.
Current baseline also returns the suggested default admin email.

### Tenant Admin Bootstrap

```http
POST /api/admin/bootstrap
Content-Type: application/json

{
  "email": "admin@tenant.example.com",
  "password": "CHANGE_ME"
}
```

Creates the first active tenant admin only when none exists yet.
When `Tenant:InitialAdminEmail` is configured, the bootstrap email must match it.
When `Tenant:BootstrapToken` is configured, callers must send
`X-Tenant-Bootstrap-Token`. Production runtimes should configure at least one of
these guards.

Current runtime baseline now prefers automatic first-admin seeding during tenant
startup. On empty tenant databases:

- a default admin is created automatically
- email resolves to `Tenant:InitialAdminEmail` when configured
- otherwise email falls back to `admin@<tenant-code>.tabflow.uk`
- default password is `TabFlow123.`
- the seeded admin must change password on first login

### Tenant Admin Login

```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@tenant.example.com",
  "password": "CHANGE_ME"
}
```

Current baseline returns the matching admin profile when credentials are valid.
Tenant web currently converts this into a signed `httpOnly` session cookie and
forwards admin identity server-side to protected tenant admin endpoints.

The login payload now also carries `mustChangePassword`. When true, tenant web
must redirect the admin to a forced password-change screen before allowing
access to the main admin surfaces.

### Tenant Admin Password Change

```http
POST /api/admin/auth/change-password
Content-Type: application/json
X-Tenant-Admin-Key: <secret>
X-Tenant-Admin-Id: <tenant admin guid>
X-Tenant-Admin-Email: <tenant admin email>

{
  "currentPassword": "TabFlow123.",
  "newPassword": "a-new-password"
}
```

Current behavior:

- validates current password against the active tenant admin
- requires a non-empty new password with a minimum baseline length
- clears the `mustChangePassword` flag after success

## Tenant Admin Auth Headers

Protected tenant admin endpoints under `/api/admin/*` (except `bootstrap-status`,
`bootstrap`, and `auth/login`) require all of the following headers:

```http
X-Tenant-Admin-Key: <secret>
X-Tenant-Admin-Id: <tenant admin guid>
X-Tenant-Admin-Email: <tenant admin email>
```

Current behavior:

- `X-Tenant-Admin-Key` must match `TenantAdmin:ApiKey` on tenant API
- admin id/email pair must match one active `tenant_admins` row
- missing or invalid headers return `401`

### Customer Order Create

```http
POST /api/public/orders
X-Customer-Session-Token: <session-token>
Content-Type: application/json

{
  "note": "Az sekerli",
  "items": [
    {
      "menuItemId": "018f6f12-37b6-7cc2-9d37-d49943f7b7a7",
      "quantity": 2,
      "note": ""
    }
  ]
}
```

Creates a submitted customer order and returns calculated line totals plus subtotal.

Current behavior:

- active customer session is required
- order table binding is derived from the validated session, not from request body input

Current bill behavior:

- first table-bound order opens a bill automatically
- subsequent table orders attach to the same open bill
- bill subtotal is recalculated from attached non-cancelled orders

### Order Summary List

```http
GET /api/admin/orders
POST /api/admin/orders
```

This endpoint is now protected by tenant admin actor validation.

Current behavior:

- returns latest orders with table identity when present
- includes allowed next statuses for admin workflow actions
- tenant admin can create a table-bound order without a customer QR session for Garson PDA Web
- admin-created orders open or reuse the selected table's open bill
- admin-created orders use the same item validation, subtotal calculation, and station routing model as customer QR orders

Admin order create payload:

```json
{
  "tableId": "00000000-0000-0000-0000-000000000000",
  "note": "Once icecekler",
  "items": [
    {
      "menuItemId": "00000000-0000-0000-0000-000000000000",
      "quantity": 2,
      "note": "Az sekerli"
    }
  ]
}
```

### Order Status Update

```http
POST /api/admin/orders/{orderId}/status
Content-Type: application/json

{
  "status": "preparing"
}
```

Current behavior:

- only valid forward transitions are accepted
- cancelling an order recalculates the attached bill subtotal
- served and cancelled orders are terminal

### Tenant Admin Bills

```http
GET /api/admin/bills
POST /api/admin/bills/{billId}/close
```

Current behavior:

- admin can list the most recent bills with table identity and totals
- closing a bill marks it closed and force-closes active customer sessions on the same table

### Tenant Admin Catalog

```http
GET /api/admin/catalog
POST /api/admin/catalog/categories
PUT /api/admin/catalog/categories/{categoryId}
POST /api/admin/catalog/items
PUT /api/admin/catalog/items/{itemId}
```

These endpoints are protected by tenant admin actor validation.

Current behavior:

- admin catalog returns all categories and items, not only public active entries
- category create/update validates normalized slug uniqueness
- item create/update validates category existence, positive price, and unique SKU
- category create/update can optionally assign one service station
- item create/update can optionally assign one service station
- item station overrides category station for Station Board routing
- tenant web `/console/catalog` uses these endpoints for category and item creation

### Tenant Admin Stations

```http
GET /api/admin/stations
POST /api/admin/stations
PUT /api/admin/stations/{stationId}
DELETE /api/admin/stations/{stationId}
```

Current behavior:

- stations represent bar, kitchen, dessert, and similar fulfillment lanes
- deleting a station is blocked while categories still reference it

### Tenant Admin Kitchen

```http
GET /api/admin/kitchen
POST /api/admin/kitchen/items/{orderItemId}/status
```

Current behavior:

- kitchen board groups active order items by item station first, then category station
- item status is tracked independently from the whole order
- item cancellation updates order subtotal and bill subtotal
- order status is projected from item status progression

### Tenant Admin Tables

```http
GET /api/admin/tables
POST /api/admin/tables
PUT /api/admin/tables/{tableId}
DELETE /api/admin/tables/{tableId}
```

These endpoints are protected by tenant admin actor validation.

Current behavior:

- admin table list is designed for the main operations screen
- each table summary includes device health, live session count, live order counts, and open bill state
- table create/update includes a persisted `serviceNote` for floor and waiter context
- table delete is allowed only when the table has no operational history
- tables with history should be deactivated instead of hard deleted

### Tenant Admin Devices

```http
GET /api/admin/devices
POST /api/admin/devices/{tableId}/refresh-token
```

These endpoints are protected by tenant admin actor validation.

Current behavior:

- device listing returns table identity, online state, active key hint, and active token expiry
- table creation generates an active device key immediately and returns a ready-to-flash single-file ESP32 `.ino`
- generated firmware sketch includes tenant host, tenant Wi-Fi defaults, table id, device key, locked TFT pin map, and timing constants
- manual token refresh pushes a new token to any connected device for that table

### Device WebSocket

```http
GET /ws/masa/{tableNumber}?anahtar=<device-key>
```

Current behavior:

- query auth or first-message JSON auth is accepted
- valid device receives `auth_ok`
- backend immediately creates a new table token and sends `new_token`
- `new_token` now contains real `qr_side` and packed `qr_bits_hex`
- `ping` -> `pong`
- `refresh` generates and pushes a replacement token

Naming convention and compatibility:

- canonical domain names in docs/code are `tableNumber` and `deviceKey`
- current wire path/query names (`/ws/masa/...` and `anahtar`) are treated as compatibility surface
- new endpoint designs should prefer canonical English names while preserving existing compatibility routes

## Current Schema Baseline

Tenant migration now creates:

- `tenant_profile`
- `tenant_admins`
- `service_tables`
- `device_keys`
- `table_tokens`
- `customer_sessions`
- `customer_bills`
- `menu_categories`
- `service_stations`
- `menu_items`
- `customer_orders`
- `customer_order_items`

Schema initialization is intentionally idempotent for both fresh tenants and
older tenant databases. Additive columns must be created before any index or
constraint that references them, so partially upgraded tenants can restart
safely.

## Known Gaps

Not built yet:

- deeper bill operations such as split/merge/reassign and payment closure metadata
- tenant admin session-backed edit/delete UI for categories and items
Direction of travel:

- menu browsing and check visibility may continue while the table session is open
- `POST /api/public/orders` should become checkout-gated
- a fresh QR proof should be required for every order submission
- orders should remain attributable to the browser access ticket that created them

See `docs/customer-sessionization.md` for the full target model.
