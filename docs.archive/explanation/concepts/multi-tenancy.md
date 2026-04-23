# Multi-Tenancy

TabFlow uses a control-plane/runtime split rather than treating the whole system
as one flat application.

## Core Idea

The platform and tenants are different things.

- the platform owns registry state and lifecycle orchestration
- each tenant owns runtime business state

The platform is not a tenant and should not behave like one.

## Why This Matters

This separation keeps:

- tenant business data isolated
- provisioning visible and explicit
- runtime incidents local to a tenant where possible
- control-plane logic free from tenant business-table coupling

## Database View

Platform database owns:

- platform admins
- tenant registry
- tenant domains
- provisioning jobs

Tenant databases own:

- menu and product state
- tables
- device keys
- QR/session lifecycle
- orders and bills
- tenant-local admins

## Runtime View

The platform handles:

- tenant creation
- tenant status changes
- provisioning visibility
- control-plane operations

The tenant runtime handles:

- customer menu access
- floor and cash operations
- station and kitchen flows
- tenant-local operational behavior

## Provisioning As The Bridge

Provisioning is the bridge between the two worlds.

It takes platform-owned registry state and turns it into tenant-owned runtime
state without collapsing the two into one application boundary.

Related concept documents:

- [`tenant-lifecycle.md`](./tenant-lifecycle.md)
- [`customer-session-model.md`](./customer-session-model.md)
- [`operational-surfaces.md`](./operational-surfaces.md)
