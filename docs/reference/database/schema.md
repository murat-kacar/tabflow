# Database Schema Reference

This document is the stable high-level schema map for TabFlow.

## Boundary

TabFlow uses separate platform and tenant databases.

The platform database is the control-plane registry.
Tenant databases are runtime business databases.

## Platform Database Owns

- platform database ownership
- tenant database ownership
- migration boundary notes
- table groups rather than raw DDL duplication

Platform database groups:

- platform admins
- tenant registry
- tenant domains
- provisioning jobs
- audit records tied to control-plane activity

## Tenant Database Owns

Tenant database groups:

- tenant profile
- menu categories and items
- service tables
- device keys
- QR tokens and customer-facing session state
- customer bills and orders
- tenant-local admin users
- station and kitchen-facing runtime state

## Migration Ownership

Current migration ownership:

- platform migrations live under `src/infra/postgres/migrations/platform`
- tenant migrations live under `src/infra/postgres/migrations/tenant`

These migrations are infrastructure assets, not reusable application packages.

## Bootstrap Direction

Tenant runtime bootstrap currently applies migrations and seeds defaults for:

- tenant profile
- starter tables `000` and `999`
- starter catalog baseline
- default tenant admin

The schema reference should stay high-level and avoid duplicating raw SQL unless
the SQL itself is the source of truth.
