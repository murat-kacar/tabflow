# Tenant Lifecycle

This document explains the lifecycle model for tenants as a product and control
plane concept.

## Core Rule

Tenant lifecycle operations are platform jobs.

The UI may ask for a tenant, but infrastructure changes must remain observable,
retryable, and explicit through provisioning state.

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

## Create

Conceptual create flow:

1. validate tenant code and domain
2. capture required regional settings
3. optionally capture intended first tenant admin email
4. reserve tenant registry state
5. create a `tenant.create` job
6. allocate runtime identifiers
7. prepare runtime configuration and artifacts
8. create tenant database and apply migrations
9. seed tenant defaults
10. verify runtime health
11. mark tenant active

## Runtime Seed Baseline

Current runtime baseline includes:

- starter tables `000` and `999`
- starter catalog seed
- default tenant admin seed

Default tenant admin baseline:

- email defaults to `admin@<tenant-code>.tabflow.uk`
- runtime may override through `initialAdminEmail`
- default password is `TabFlow123.`
- first successful login must force password change

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

Registry collisions should fail fast. Runtime collisions should surface through
job failure details and deliberate retry.
