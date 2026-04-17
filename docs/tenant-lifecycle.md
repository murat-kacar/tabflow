# Tenant Lifecycle

Scope: Source Baseline

Status Snapshot: 2026-04-17

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

## Idempotency And Compensation Matrix

| Step | Current source-baseline state | Idempotency key/input | Retry behavior | Compensation or rollback | Terminal failure rule |
| --- | --- | --- | --- | --- | --- |
| Validate tenant code/domain/email | Implemented | normalized tenant code + normalized domain | Safe to retry inline | none | invalid input stays failed until corrected |
| Reserve tenant + primary domain | Implemented | unique code/domain constraints | retry on transient DB faults | no partial side effects beyond one transaction | unique conflict fails fast with `409` |
| Create `tenant.create` job | Implemented | tenant id + job type | one pending job per requested operation | cancel job row if explicit abort is requested | repeated create should not spawn duplicate active jobs |
| Allocate runtime identifiers | Implemented | tenant code deterministic naming rules | retry in worker lease window | release reserved metadata on compensation | collision enters failed job state with corrective action required |
| Write runtime artifacts | Implemented | job id + output path | safe to retry by overwriting same files | delete tenant output folder on compensation | filesystem permission errors after max attempts |
| Create tenant DB/user | Planned (operational layer) | runtime metadata | retry with bounded attempts | drop created DB/user when later steps fail | collision/privilege errors become terminal until operator fix |
| Apply tenant migrations | Planned (operational layer) | migration history in tenant DB | retry is safe when migrations are idempotent | drop tenant DB if provisioning is rolled back | non-retryable SQL errors become terminal |
| Seed tenant defaults | Planned (operational layer) | tenant profile singleton + table number uniqueness | retry should be upsert-style | remove seeded rows only during full rollback | invariant violations become terminal |
| Health verify (`/health/ready`) | Planned (operational layer) | tenant runtime endpoint | retry with backoff | keep tenant in `provisioning` if probe fails | max-attempt exhaustion marks job failed |
| Mark tenant active | Planned (operational layer) | tenant id + final successful job | single status transition guard | set tenant `suspended` on terminal provisioning failure | active transition blocked if prerequisites are incomplete |

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

Tenant provisioning should prepare per-table `config.h` artifacts containing:

- backend host
- table id
- device key
- hardware profile identifier

Generated firmware config files contain secrets and must not be committed.
