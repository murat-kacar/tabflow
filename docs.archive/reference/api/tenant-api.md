# Tenant API Reference

The tenant API is the runtime backend for one business tenant.

## Baseline Responsibilities

The tenant API currently owns:

- tenant schema bootstrap
- tenant profile and public catalog contracts
- table and device state
- QR token lifecycle
- customer access/session bootstrap
- orders and bills
- tenant admin auth baseline
- tenant admin operational CRUD surfaces
- station and kitchen-facing runtime flows

## Health

```http
GET /health
GET /health/live
GET /health/ready
```

## Core Public Endpoints

### Tenant Profile

```http
GET /api/tenant/profile
```

Returns tenant identity such as:

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

- tenant summary
- active categories
- available menu items

### Public Tables

```http
GET /api/public/tables
```

### QR Token Verification

```http
POST /api/public/token/verify
Content-Type: application/json

{
  "token": "F6F83B6A11653E"
}
```

Current behavior:

- verifies a still-active, unused table token
- consumes the token
- creates or joins the live table session model
- issues a browser-scoped access ticket
- allows tenant web to open a signed customer-facing session cookie

### Customer Session Status

```http
GET  /api/public/session
POST /api/public/session/logout
X-Customer-Session-Token: <session-token>
```

Direction of travel:

- current model is an intermediate baseline
- target model separates:
  - canonical table session
  - browser-scoped access ticket
  - fresh checkout proof

### Public Order Create

```http
POST /api/public/orders
X-Customer-Session-Token: <session-token>
```

Runtime security direction:

- browsing and read flows may remain lightweight
- final order submission is the critical security boundary
- order submit should require a fresh QR checkout proof

## Tenant Admin Surface

### Bootstrap And Login

```http
GET  /api/admin/bootstrap-status
POST /api/admin/bootstrap
POST /api/admin/auth/login
POST /api/admin/auth/change-password
```

Current default admin baseline on empty tenant databases:

- default email: `admin@<tenant-code>.tabflow.uk`
- runtime may override with `initialAdminEmail`
- default password: `TabFlow123.`
- first login must force password change

### Protected Admin Headers

Protected `/api/admin/*` endpoints currently use:

```http
X-Tenant-Admin-Key: <secret>
X-Tenant-Admin-Id: <guid>
X-Tenant-Admin-Email: <email>
```

### Current Admin Capability Areas

The current runtime baseline includes protected tenant admin flows for:

- catalog management
- table CRUD and summaries
- device listing and key/token operations
- order visibility
- station management
- kitchen/station board workflows

## WebSocket Surface

Devices connect through:

```text
/ws/masa/{tableNumber}
```

This is used for device-side QR/token refresh and live device/runtime coupling.

## Device And Firmware Baseline

Committed firmware source lives under:

```text
src/packages/firmware/arduino/tabflow-table-display/
```

Current locked hardware profile:

- ESP32-C3 Super Mini V1.6.0.1
- 1.8 inch TFT SPI 128x160 V1.1
- Adafruit GFX
- Adafruit ST7735/ST7789

Current prototype pin map:

```text
TFT SCK/SCLK -> GPIO0
TFT SDA/MOSI -> GPIO1
TFT A0/DC    -> GPIO2
TFT RESET    -> GPIO3
TFT CS       -> GPIO4
```

Pins intentionally avoided:

- GPIO8 and GPIO9 because of boot/strapping risk
- GPIO20 and GPIO21 to avoid USB/serial interference

Current prototype caveat:

- GPIO2 is accepted today for TFT A0/DC because of current physical wiring
- if boot instability appears, firmware generation and the committed firmware
  baseline should move A0/DC to a safer free GPIO together

The tenant runtime owns QR generation and delivery. Firmware does not generate
QR codes locally.

### Runtime Contract

Device config currently carries:

- table id
- backend host and port
- device key
- Wi-Fi credentials for the physical site
- display pin constants
- firmware timing constants

Device behavior baseline:

- join Wi-Fi
- sync time for TLS
- open a WebSocket to the tenant runtime
- receive fresh token payloads
- render backend-produced QR matrix data

Current runtime direction:

- device join/auth should stay backend-owned
- QR/token generation should stay in tenant runtime
- generated firmware should stay a table-specific single-file artifact rather
  than a manually edited source fork

Expected message types include:

- `auth_ok`
- `new_token`

Current token payload baseline includes:

- `url`
- `ttl_seconds`
- `expires_at`
- `qr_side`
- `qr_bits_hex`

### Generated Artifacts

Tenant runtime provisioning generates per-table flash-ready `.ino` artifacts.

Rules:

- generated `.ino` files contain secrets
- they are runtime outputs and must not be committed
- committed source stays under `src/packages/firmware`
- generated artifacts belong in runtime-owned output roots

Reference output layout:

```text
runtime/generated/tenants/<tenant-code>/firmware/
  masa-000.ino
  masa-999.ino
  masa-balkon-003.ino
```

Naming rule:

- generated filename should come from the current table label
- the result should be slugged into a flash-ready single sketch name

Output-root rule:

- local defaults may place generated artifacts under a repo-adjacent runtime
  tree
- production deployments should point provisioning output at a restricted host
  runtime directory outside the source tree
