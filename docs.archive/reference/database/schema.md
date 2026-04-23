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
- floor layouts, zones, and table placements
- device keys
- QR tokens and customer-facing session state
- customer bills and orders
- tenant-local admin users
- station and kitchen-facing runtime state

## Tenant Runtime Group Notes

### Catalog And Routing

Catalog ownership includes:

- categories
- menu items
- item availability
- item-to-station routing

Direction of travel:

- category-level station assignment may exist as a default
- item-level station assignment is the final routing source
- one fallback station should remain available so unrouted items still surface
  operationally

### Floor Model

Floor-planning ownership includes:

- layouts
- zones
- table placements
- fixed floor objects

Reference direction:

- one tenant may have multiple layouts
- one layout may have multiple zones
- table identity remains separate from layout placement
- placement records hold coordinates, size, shape, rotation, and z-order

### Customer Access And Check State

Customer-facing state ownership includes:

- QR join tokens
- live table session state
- browser-scoped access tickets or equivalent session records
- checkout-proof validation state
- bills and orders tied to the active table experience

The schema should continue to distinguish:

- operational table/check state
- browser participation state
- longer-lived pseudonymous customer identity

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
