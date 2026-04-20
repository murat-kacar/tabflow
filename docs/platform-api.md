# Platform API

Scope: Source Baseline

Status Snapshot: 2026-04-17

The Platform API manages the product control plane. It is not a tenant runtime API.

Base path:

```text
/api/platform
```

Contract governance:

- current contract generation/publish rules live in `docs/api-governance.md`
- current baseline contract version is `v1` semantics on unversioned paths

## Health

```http
GET /health
GET /health/live
GET /health/ready
```

`GET /health` returns service metadata. `GET /health/live` is intended for simple
container/process liveness checks. `GET /health/ready` checks platform database
connectivity for readiness.

## Tenants

All tenant registry endpoints require:

```http
X-Platform-Admin-Key: <secret>
```

The platform web app sends this header server-side from `PLATFORM_ADMIN_API_KEY`.
Do not expose this key to browser code.

These endpoints also require forwarded actor context from the platform web:

```http
X-Platform-Actor-Id: <platform admin guid>
X-Platform-Actor-Email: <platform admin email>
X-Platform-Actor-Role: viewer|admin|owner
```

The platform API validates this actor against `platform_admins` before executing
role-protected actions.

### List Tenants

```http
GET /api/platform/tenants
```

Returns tenants ordered by tenant code.

### Get Tenant

```http
GET /api/platform/tenants/{id}
```

Returns `404` when the tenant does not exist.

### List Tenant Runtimes

```http
GET /api/platform/tenants/runtimes
```

Returns one runtime visibility summary per tenant, derived from the latest
provisioning result.

Current behavior:

- exposes internal runtime readiness from host-local health probing
- exposes external/public reachability as a separate visibility signal
- does not expose raw database passwords

### Get Tenant Runtime

```http
GET /api/platform/tenants/{id}/runtime
```

Returns one tenant runtime visibility summary or `404`.

### List Jobs

```http
GET /api/platform/tenants/jobs
```

Returns the 50 most recent provision jobs.

### Get Job

```http
GET /api/platform/tenants/jobs/{jobId}
```

Returns a single provision job or `404`.

### List Tenant Jobs

```http
GET /api/platform/tenants/{id}/jobs
```

Returns jobs for one tenant ordered newest-first.

### Create Tenant

```http
POST /api/platform/tenants
Content-Type: application/json

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

Current behavior:

- normalizes `code`
- normalizes `primaryDomain`
- accepts optional `initialAdminEmail` for the tenant's first runtime admin intent
- requires tenant-scoped language, currency, and time zone settings
- validates safe tenant code format
- validates hostname format
- validates email format when an initial admin email is provided
- rejects tenant code/domain collision with `409`
- creates tenant with `provisioning` status
- creates primary domain row
- creates pending `tenant.create` provision job
- stores the intended first tenant admin email as registry metadata
- stores language, currency, and time zone as tenant regional settings

### Update Tenant Regional Settings

```http
PATCH /api/platform/tenants/{id}/regional-settings
```

```json
{
  "languageCode": "tr",
  "currencyCode": "TRY",
  "timeZone": "Europe/Istanbul"
}
```

Updates the platform registry source of truth for tenant language, currency, and
time zone. The platform also queues a `tenant.settings.update` provisioning job
so the operator can rewrite runtime env files and restart tenant API/Web.

Provisioning is intentionally not executed inline.

Required role:

- `admin`
- `owner`

### Update Tenant Status

```http
PATCH /api/platform/tenants/{id}/status
Content-Type: application/json

{
  "status": "active"
}
```

Known statuses:

- `provisioning`
- `active`
- `suspended`
- `archived`

Required role:

- `admin`
- `owner`

### List Audit Logs

```http
GET /api/platform/tenants/audit
```

Returns the 100 most recent audit rows.

Required role:

- `admin`
- `owner`

## Authentication

Current baseline uses two layers:

- tenant registry endpoints require the server-to-server `X-Platform-Admin-Key`
- platform admins log into the platform web through `/api/platform/auth/login`
- platform web forwards validated actor context for role-aware authorization

Auth endpoints:

```http
GET /api/platform/auth/bootstrap-status
POST /api/platform/auth/login
```

The platform web stores a signed httpOnly session cookie and continues to call
tenant registry endpoints from the server side using the admin API key. This is
an intentional control-plane step: it keeps browser code away from infrastructure
credentials while still allowing endpoint-level authorization and audit logging.

Bootstrap behavior:

- if `platform_admins` is empty
- and `PlatformAdmin:BootstrapEmail` plus `PlatformAdmin:BootstrapPassword` are set
- the first admin row is created during platform API startup

Implemented today:

- role-aware authorization for mutable tenant actions
- audit log for login and tenant lifecycle actions
- bootstrap owner creation when the platform has no admins

Still pending:

- admin management endpoints
- replacing the shared API key gate with a dedicated internal trust boundary
- richer audit filtering and export

## Error Rules

- validation errors return `400` with validation details
- duplicate tenant code/domain returns `409`
- missing records return `404`
- infrastructure/provisioning failures belong to provision job status, not hidden
  frontend errors

## Provisioning Worker

Current worker behavior:

- creates provisioning jobs and exposes their state
- allocates runtime metadata for tenant creation
- records provisioning progress and failures in the platform database
- keeps long-running lifecycle work outside frontend request handlers

## Platform Operator

`apps/platform-operator` is the worker responsible for:

- polling pending or failed `tenant.create` jobs
- allocating deterministic runtime metadata such as DB name, DB user, and ports
- writing per-table firmware `config.h` files for the configured initial table count
- generating per-tenant secret material for runtime configuration
- creating the tenant PostgreSQL database when it does not already exist
- writing tenant API and tenant web environment files under `/etc/tabflow/tenants`
- materializing templated `systemd` tenant units when they are missing
- generating and enabling a per-tenant Nginx virtual host
- obtaining a Let's Encrypt certificate through Certbot
- starting per-tenant API and web instances through `tabflow-tenant-api@<code>` and `tabflow-tenant-web@<code>`
- verifying internal and external runtime health before marking the tenant `active`
- marking the tenant `suspended` only after terminal provisioning failure

Current limitation:

- platform core now lives in the shared backend package, but endpoint/auth concerns
  still live in `platform-api`; future cleanup can split auth/application services
  even more explicitly if needed
