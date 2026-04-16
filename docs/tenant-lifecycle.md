# Tenant Lifecycle

Tenant lifecycle operations are platform jobs.

The tenant lifecycle is documentation-led because mistakes here create expensive
production cleanup. The UI may ask for a tenant, but infrastructure changes must
remain observable jobs.

## Tenant Identity

Tenant code:

- lowercase `a-z`, `0-9`, and hyphen
- 3 to 63 characters
- no leading or trailing hyphen
- globally unique in the platform database

Primary domain:

- normalized to lowercase
- no scheme
- no trailing dot
- globally unique in the platform database

Examples:

- `moda` -> `moda.example.com`
- `besiktas` -> `besiktas.example.com`
- `demo` -> `demo.example.com`

## Create

1. Validate tenant code and domain.
2. Optionally capture the intended first tenant admin email.
3. Reserve tenant code and primary domain in the platform database.
4. Create a `tenant.create` provision job.
5. Allocate runtime identifiers such as database name, database user, and ports.
6. Prepare tenant runtime configuration.
7. Generate per-table firmware config artifacts.
8. Create tenant database and database user.
9. Apply tenant migrations.
10. Seed initial tenant data, including the default table count.
11. Verify tenant API health.
12. Mark tenant active.

Each step needs a compensation step or a clear retry state.

Current implementation status:

- steps 1 to 7 exist today
- tenant-api now owns the first real tenant schema, startup migration execution,
  default table seed, and starter catalog seed
- job status, retryability, and visibility already exist in the platform registry
- runtime packaging and host automation are outside this source-only baseline

## Platform Registry API

The platform API owns tenant registry state. Runtime provisioning should be a job
that reacts to this registry, not a side effect hidden inside the web UI.

Tenant registry endpoints require the server-side `X-Platform-Admin-Key` header.
The browser should not hold this key.

Current platform web behavior:

- human admin logs in with email/password
- platform web stores signed session cookie
- platform web talks to platform API server-side
- platform API validates forwarded actor identity and role
- tenant create and status change actions are audit logged

- `GET /api/platform/tenants` lists tenants with their primary domain.
- `GET /api/platform/tenants/{id}` returns one tenant.
- `POST /api/platform/tenants` validates and reserves a tenant code and primary domain, and can carry the intended first tenant admin email.
- `PATCH /api/platform/tenants/{id}/status` changes platform exposure state.

Tenant codes are lowercase `a-z`, `0-9`, and hyphen only. Domains are normalized to
lowercase hostnames without scheme or trailing dot.

## Collision Handling

Tenant creation must fail safely when:

- tenant code already exists
- primary domain already exists
- generated database name already exists
- generated database user already exists

The current Platform API already rejects tenant code/domain collisions with `409`.
Runtime setup collisions belong in provisioning job failure details and must be
retryable after correction.

## Archive

Archive stops tenant runtime use but keeps data.

Expected archive behavior:

- tenant status becomes `archived`
- database remains
- firmware/device keys remain in database but devices can no longer receive tokens

## Delete

Delete is destructive and requires a second confirmation step.

Expected cleanup:

- tenant database and user
- platform registry rows

Deletion must not be the default path for unhappy tenants. Prefer archive first.

## Firmware Artifacts

Tenant creation should prepare a tenant firmware base artifact. Table creation
should prepare per-table `config.h` artifacts containing:

- backend host
- table id
- device key
- hardware profile identifier

Generated firmware config files contain secrets and must not be committed.
