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

### Floor And Cash Workspace

Purpose:

- table state
- open checks
- manual payment flow
- move/merge/split/close actions

### Station Board

Purpose:

- station-scoped fulfillment
- urgency visibility
- fast ticket progression

Variants may include kitchen, barista, bar, hookah, fastfood, and dispatch
boards.

### Waiter / PDA Web

Purpose:

- mobile, table-side order taking
- fast one-handed service use

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
