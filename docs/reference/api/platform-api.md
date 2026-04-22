# Platform API Reference

The platform API is the control-plane API for TabFlow.

Base path:

```text
/api/platform
```

It is not a tenant runtime API.

## Health

```http
GET /health
GET /health/live
GET /health/ready
```

`GET /health` returns service metadata. `GET /health/ready` additionally checks
platform database readiness.

## Authentication Model

Current baseline:

- platform admins authenticate through the platform web
- platform web stores an `httpOnly` signed session cookie
- platform web calls platform API server-side
- registry endpoints require a server-side admin key header
- mutable actions also validate forwarded actor identity and role

Current sensitive headers:

```http
X-Platform-Admin-Key: <secret>
X-Platform-Actor-Id: <guid>
X-Platform-Actor-Email: <email>
X-Platform-Actor-Role: viewer|admin|owner
```

The browser must not hold the platform admin API key.

## Main Endpoint Groups

### Tenant Registry

```http
GET    /api/platform/tenants
GET    /api/platform/tenants/{id}
POST   /api/platform/tenants
PATCH  /api/platform/tenants/{id}/status
PATCH  /api/platform/tenants/{id}/regional-settings
```

Create tenant payload baseline:

```json
{
  "code": "moda",
  "displayName": "Moda Cafe",
  "primaryDomain": "moda.example.com",
  "initialAdminEmail": "admin@moda.example.com",
  "languageCode": "en",
  "currencyCode": "GBP",
  "timeZone": "Europe/London"
}
```

Current create behavior:

- normalizes tenant code and primary domain
- validates regional settings
- optionally accepts intended first runtime admin email
- rejects code/domain collisions with `409`
- creates tenant registry state in `provisioning`
- creates a pending `tenant.create` provisioning job

### Runtime Visibility

```http
GET /api/platform/tenants/runtimes
GET /api/platform/tenants/{id}/runtime
```

Returns runtime visibility summaries derived from latest provisioning and health
signals.

### Provisioning Jobs

```http
GET /api/platform/tenants/jobs
GET /api/platform/tenants/jobs/{jobId}
GET /api/platform/tenants/{id}/jobs
```

### Audit Surface

```http
GET /api/platform/tenants/audit
```

### Auth Surface

```http
GET  /api/platform/auth/bootstrap-status
POST /api/platform/auth/login
PATCH /api/platform/auth/profile/preferences
```

Bootstrap owner creation may happen at startup when no platform admins exist and
bootstrap credentials are configured.

Profile preference updates are called by platform web with the current actor
context and currently cover admin-facing UI preferences such as locale.

## Status Model

Known registry statuses:

- `provisioning`
- `active`
- `suspended`
- `archived`

## Error Rules

- validation errors return `400`
- duplicate tenant code/domain returns `409`
- missing records return `404`
- provisioning failures belong to job state and job details, not silent frontend
  behavior
