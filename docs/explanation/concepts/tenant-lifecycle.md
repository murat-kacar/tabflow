# Tenant Lifecycle

This document explains the lifecycle model for tenants as a product and
control-plane concept.

## Core Rule

Tenant lifecycle operations are platform jobs.

The UI may ask for a tenant, but infrastructure changes must remain
observable, retryable, and explicit through provisioning state.

## Tenant Identity

Tenant code baseline:

- lowercase `a-z`, `0-9`, and hyphen
- 3 to 63 characters
- no leading or trailing hyphen
- globally unique in the platform database

Primary domain baseline:

- normalized to lowercase
- no scheme
- no trailing dot
- globally unique in the platform database

The platform does not impose a fixed parent domain. Tenants may run on any
domain they own; the platform's job is to route to the tenant host that
serves that domain.

## Create

Conceptual create flow:

1. validate tenant code and domain
2. capture required regional settings
3. optionally capture the intended first tenant owner email
4. reserve tenant registry state
5. create a `tenant.create` job
6. allocate runtime identifiers
7. prepare runtime configuration and artifacts
8. create the tenant database and the tenant-scoped database user
9. apply EF Core migrations
10. seed tenant defaults
11. verify runtime health
12. mark the tenant `active`

## Runtime Seed Baseline

Tenant bootstrap seeds:

- tenant profile
- starter tables `000` and `999`
- starter catalog baseline
- default tenant owner user

Default tenant owner baseline:

- email defaults to a tenant-scoped address derived from the configured
  platform email template, or to the optional `initialOwnerEmail` input
- initial password is generated at provisioning time
- the generated password is shown exactly once, at the end of the
  provisioning flow, to the operator who initiated the create
- the generated password is never written to disk or to the audit log;
  only a hashed version persists
- first successful login forces a password change

This replaces any fixed default password baseline used in earlier
iterations of the system.

## Archive

Archive is the preferred non-destructive lifecycle step.

Archive direction:

- tenant status becomes `archived`
- database remains
- historical business state remains
- active runtime usage should stop

## Delete

Delete is destructive and should require explicit intent.

Expected cleanup direction:

- tenant database and database user are removed
- generated runtime artifacts are removed
- platform registry rows are removed

Delete should not be the default unhappy-path action. Prefer archive first.

## Collision Handling

Provisioning must fail safely when:

- tenant code already exists
- primary domain already exists
- generated database name already exists
- generated database user already exists

Registry collisions should fail fast. Runtime collisions should surface
through job failure details and deliberate retry.

## Related

- [`./multi-tenancy.md`](./multi-tenancy.md)
- [`./authorization.md`](./authorization.md)
- [`../../how-to/provision-tenant.md`](../../how-to/provision-tenant.md)
