# Provision A Tenant

This guide describes the canonical tenant provisioning flow from the platform
control plane perspective.

## Inputs

Required:

- tenant code
- display name
- primary domain
- language
- currency
- time zone

Optional:

- intended first tenant admin email

## Flow

1. Validate tenant code and primary domain.
2. Capture tenant regional settings.
3. Optionally capture the intended first tenant admin email.
4. Reserve tenant registry state in the platform database.
5. Create a `tenant.create` provisioning job.
6. Allocate runtime identifiers such as database name, database user, and
   internal ports.
7. Prepare runtime configuration and runtime artifacts.
8. Generate per-table firmware sketches for the seeded tables.
9. Create the tenant database and database user.
10. Apply tenant migrations.
11. Seed tenant defaults:
    - tenant profile
    - starter tables `000` and `999`
    - starter catalog
    - default tenant admin
12. Verify tenant runtime health.
13. Mark the tenant `active`.

## Expected Default Admin Baseline

When the runtime initializes an empty tenant database:

- email defaults to `admin@<tenant-code>.tabflow.uk`
- runtime may override with `initialAdminEmail`
- default password is `TabFlow123.`
- first successful login must force password change

## Verification

Provisioning is considered successful when:

- provisioning job completes successfully
- tenant API health responds correctly
- tenant web becomes reachable on the assigned domain
- seeded defaults are present

Expected seeded defaults:

- starter tables `000` and `999`
- starter catalog baseline
- default tenant admin
- per-table ready-to-flash firmware sketches for seeded tables

## Collision Handling

Provisioning must fail safely when:

- tenant code already exists
- primary domain already exists
- generated database name already exists
- generated database user already exists

Registry collisions should fail fast. Runtime collisions should surface through
job failure details so they can be corrected and retried deliberately.

## Failure Model

Provisioning is job-based and must remain observable.

Expected failure rules:

- duplicate code/domain fails fast
- runtime collisions and host-side faults are captured as job failures
- retryable steps remain retryable through the worker path
- infrastructure side effects must not be hidden in frontend request handlers

## Follow-Up

After a successful tenant create:

1. verify public runtime reachability
2. sign in with the default tenant admin credentials
3. change the default password on first login
4. verify customer menu, admin surfaces, and table/device baseline

If the tenant is no longer needed, prefer archive before destructive delete.
