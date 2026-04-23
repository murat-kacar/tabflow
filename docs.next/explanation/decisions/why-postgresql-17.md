# Why PostgreSQL 17

PostgreSQL 17 is the chosen database baseline for TabFlow because it fits
the current control-plane and tenant-runtime split without pulling the
system toward a vendor-specific platform stack.

## Why It Fits

TabFlow needs:

- separate platform and tenant databases
- predictable relational modeling
- strong transaction semantics
- mature .NET support
- straightforward host-level deployment

PostgreSQL fits those needs cleanly.

## Benefits

- strong relational integrity for registry, order, and bill state
- mature .NET ecosystem support through Npgsql and EF Core
- easy separation of platform and tenant databases
- good fit for explicit migrations and schema-owned changes
- operationally familiar on Linux hosts

## Tradeoffs

- database administration remains an explicit operational responsibility
- provisioning logic must handle per-tenant database creation carefully
- future cross-tenant analytics must be designed deliberately rather than
  assumed from one giant shared database

## Why Not Treat This As Incidental

In TabFlow, database shape affects:

- tenant isolation
- provisioning design
- auditability
- runtime safety for orders, bills, and device and session state

That makes the database choice an architectural decision, not a trivial
implementation detail. The active decision record lives in
[`../../reference/architecture/decisions.md`](../../reference/architecture/decisions.md)
under AD-0007.
