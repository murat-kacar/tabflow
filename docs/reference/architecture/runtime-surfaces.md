# Runtime Surfaces

This document is the reference map for tenant runtime surfaces.

## Official Surface Set

Current tenant runtime surface family:

1. customer menu
2. tenant admin console
3. floor and cash workspace
4. station board
5. waiter/mobile PDA workspace

## Official Route Model

Current official route baseline:

- `/login`
- `/change-password`
- `/console`
- `/console/stations`
- `/console/catalog`
- `/service`
- `/stations`
- `/stations/[stationCode]`
- `/pda`
- `/menu`

## Shared Runtime Language

Shared order-state language:

- `submitted`
- `preparing`
- `ready`
- `served`
- `cancelled`

Shared operational anchors:

- table number
- order id
- item name
- quantity
- notes
- station
- open check status
- device or QR health
- timing or elapsed time

## Surface Map

### Tenant Admin Console

Purpose:

- oversight
- setup and governance
- station/catalog/device/staff/settings management

Navigation baseline:

- `/console`
- `/console/stations`
- `/console/catalog`

Reference expectations:

- overview shows operational summary plus attention queue
- stations workspace exposes station cards and selected-station detail
- catalog must surface item-level station routing and fallback visibility
- devices and staff remain part of the admin family even if their routes evolve

### Floor And Cash Workspace

Purpose:

- table state
- open checks
- manual payment flow
- move/merge/split/close actions

Reference views:

- `Floor`
- `Open Checks`
- `Payment Queue`
- `Closed Checks`

Reference table-card fields:

- table number
- occupancy/open-check signal
- order pressure
- ready-to-serve signal
- device/QR health

### Station Board

Purpose:

- station-scoped fulfillment
- urgency visibility
- fast ticket progression

Variants may include kitchen, barista, bar, hookah, fastfood, and dispatch
boards.

Reference status columns:

- `new`
- `preparing`
- `ready`

Reference urgency bands:

- 0-3 minutes: normal
- 3-7 minutes: warning
- 7+ minutes: urgent

### Waiter / PDA Web

Purpose:

- mobile, table-side order taking
- fast one-handed service use

Reference behavior:

- protected waiter actions use tenant-admin-authenticated runtime flows
- customer QR session is not required for waiter-created orders
- item routing still uses the same station-first model as customer orders

### Customer Menu

Purpose:

- customer browsing
- open check visibility
- order composition

Submit-order security should still require a fresh QR proof.

## Station-First Fulfillment

The runtime uses a station-first model rather than a kitchen-only model.

That means:

- products route to stations
- stations are the fulfillment unit
- one order may split operationally across different stations
- admins can view all stations
- operators can be scoped to relevant stations

Each tenant should maintain one fallback station so routing failures do not hide
items operationally.

Reference setup direction:

- station CRUD belongs to admin surfaces
- one active fallback station must exist
- item-level station assignment is the final routing source
- category-level station assignment may remain as a default helper only

## Floor Layout Direction

Floor and cash operation should support multiple physical layouts such as:

- main floor
- balcony
- upper floor
- garden
- dispatch/takeaway area

Direction of travel:

- one tenant may have multiple layouts
- layouts may contain zones
- tables have placement and visual metadata
- fixed floor objects may exist
- edit mode should remain separate from normal operations mode

Reference model:

- `layout`
- `zone`
- `table placement`
- `fixed object`

Reference placement fields include:

- layout identity and sort order
- canvas dimensions and background style
- zone coordinates and dimensions
- table placement coordinates, size, shape, rotation, and z-index
- fixed-object kind, label, placement, size, and rotation
