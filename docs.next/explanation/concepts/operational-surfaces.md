# Operational Surfaces

This document explains how TabFlow thinks about tenant runtime surfaces
and why they are split the way they are.

The concrete route map, render mode, and role-to-route matrix live in
[`../../reference/architecture/runtime-surfaces.md`](../../reference/architecture/runtime-surfaces.md).
This document explains the product shape behind that map.

## Core Surface Family

The tenant runtime surface family is:

1. customer menu
2. tenant admin console
3. floor and cash workspace
4. station board
5. waiter and mobile PDA workspace

These surfaces share:

- one runtime contract
- one operational status language
- one family resemblance in tone and interaction quality

They should not feel like the same screen with different tabs.

## Why Multiple Surfaces Exist

Cafe operations have different attention modes:

- oversight and setup
- floor supervision and cash handling
- production fulfillment
- mobile, table-side service
- customer browsing and ordering

Trying to force those into one generic admin screen creates noise and
weakens each role.

## Surface Roles

### Tenant Admin Console

Role:

- live visibility
- setup and governance
- exception detection
- station, catalog, device, staff, and settings control
- tenant audit review

Target feel:

- premium operational control center
- warmer and more operational than a generic SaaS panel

Expected navigation baseline:

- `Overview`
- `Stations`
- `Catalog`
- `Tables`
- `Users`
- `Firmware defaults`
- `Audit`

Console surfaces run under Interactive Server
([`../../reference/architecture/render-modes.md`](../../reference/architecture/render-modes.md)).
Component state lives server-side; forms, modals, and live indicators run
without hand-written polling.

Admin-console visual direction:

- warm stone and paper-like neutrals rather than glossy SaaS chrome
- white or near-white work surfaces with strong station accents
- big, trustworthy headings and compact operational detail underneath
- high-contrast status chips for device, station, and fallback warnings

Expected overview content:

- top summary band for active tables, open checks, ready orders, and
  offline devices
- attention queue for fallback-station items, unhealthy devices, and
  delayed stations
- station health panel
- quick setup actions for stations, catalog coverage, and devices

Expected station-management behavior:

- station cards should show name, code, color, type, active state,
  product count, operator count, and fallback status
- detail view should support reorder, disable, fallback selection, and
  product coverage review
- product routing should be explicit at item level, with category-level
  station assignment acting only as a helper default

### Floor And Cash Workspace

Role:

- physical table state visibility
- open check handling
- manual payment flow
- move, merge, split, and close actions

The floor and cash workspace is operated by the cashier and waiter roles.
It is explicitly not the station operator's surface; fulfillment lives on
the station board.

Target feel:

- live
- tactical
- table-centric
- capable of showing both physical floor flow and bill flow in one
  workspace

Expected top-level views:

- `Floor`
- `Open Checks`
- `Payment Queue`
- `Closed Checks`

Primary mental model:

- one workspace reveals both physical floor flow and bill and payment
  flow
- operators should not have to jump between a decorative floor planner
  and a separate cash-only screen to understand the live state of a
  table

Core information shown on each table card:

- table number
- occupancy state
- open-check presence
- order intensity
- ready-to-serve signal
- device or QR health

Primary actions from the selected table context:

- mark payment received
- close check
- move table or check
- merge tables or checks
- split check
- inspect live order details

Interaction principle:

- normal mode is operational
- layout editing must be explicit and separate
- move, merge, split, close actions are quick but still deliberate
- closing a check requires a stronger confirmation than normal table
  selection

The floor and cash workspace runs under Interactive Server with
subscription to the in-process event bus; new submitted orders, status
changes, and bill mutations appear without polling.

### Station Board

Role:

- single-station fulfillment board
- progression through `new`, `preparing`, and `ready`
- urgency visibility with minimal distraction

The station board is operated by the station operator. It is a distinct
role, a distinct URL family (`/stations/**`), and a distinct identity
(`station_device`). It is not the cashier's surface and must not expose
cashier actions.

Target feel:

- high contrast
- fast-glance readable
- more like a production board than an admin panel

Station board is a family concept, not just one kitchen screen. Variants
may include:

- kitchen
- barista
- bar
- hookah
- fastfood
- dispatch

Board structure baseline:

- default single-station view emphasizes `new`, `preparing`, and `ready`
  columns
- supervisor view, when present, may add station switching or
  multi-station summary
- cards prioritize distance readability over dense data presentation

Ticket-card anchors:

- table number
- order id
- item name
- quantity
- item note and order note
- elapsed time

Urgency direction:

- 0 to 3 minutes: normal
- 3 to 7 minutes: warning
- 7+ minutes: urgent

Expected operator actions:

- start preparing
- mark ready
- mark remake or rework when needed
- cancel when authorized by the runtime flow

Visual direction:

- high contrast
- dark board background
- large timers and action buttons
- readable from distance and under high-pressure conditions

The station board runs under Interactive Server and subscribes to the
order event stream so newly submitted items appear immediately and
urgency bands update without polling.

### Waiter And PDA Web

Role:

- fast mobile order taking
- one-handed use
- table-side operation

This surface behaves like a focused field tool rather than a compressed
admin screen.

PDA direction:

- one-handed use
- quick table selection
- fast note entry
- minimal navigation chrome
- protected waiter actions run under the waiter's authenticated tenant
  identity, not through a customer QR session

### Customer Menu

Role:

- table-side browsing
- open check visibility
- low-friction order composition

Security note:

- browsing stays lightweight while the access ticket is valid
- final order submission remains the critical boundary and requires a
  fresh QR proof

Experience direction:

- category-first browsing
- strong mobile-first layout
- lightweight session continuity while the table session is open
- final order submission as the only deliberately high-friction step

Customer menu surfaces run under Static SSR. They do not open a SignalR
connection. The server-side cart model is described in
[`./customer-session-model.md`](./customer-session-model.md).

## Shared Runtime Language

All runtime surfaces share the same operational anchors:

- table number
- order id
- item name
- quantity
- notes
- station
- open-check status
- device or QR health
- timing or elapsed time

Shared order-state language:

- `submitted`
- `preparing`
- `ready`
- `served`
- `cancelled`

## Station-First Fulfillment

TabFlow is station-first rather than kitchen-only.

That means:

- products route to stations
- stations are the fulfillment unit
- one order may split operationally across different stations
- admins can view all stations
- station-device identities are scoped to a single station

This is what allows the same product model to fit:

- kitchen
- bar
- barista
- hookah
- dessert
- dispatch

without hard-coding one narrow restaurant structure forever.

### Fallback Rule

The model always has one fallback station so product routing failures do
not make items disappear operationally.

Catalog direction:

- item-level station assignment is the final routing source
- category-level station assignment may exist as a helpful default only
- admins can see when an item is falling back rather than explicitly
  routed

## Floor Layout Model

Floor and cash operation is not just a table list.

The runtime supports multiple physical layouts for one tenant, such as:

- main floor
- balcony
- upper floor
- garden
- dispatch or takeaway area

Direction of travel:

- one tenant may have multiple layouts
- each layout may contain zones
- tables have placement and visual metadata
- fixed objects such as cashier bank, entrance, or kitchen pass can
  exist in the floor model
- edit mode is distinct from normal operations mode

Reference data direction:

- one tenant may own multiple layouts
- one layout may own multiple zones
- tables keep placement metadata per layout
- fixed floor objects act as edit-friendly anchors rather than runtime
  orders or billing entities

## UX Principle

The same business state is visible through role-appropriate surfaces, not
through one giant shared UI.

This is a core TabFlow product principle, not a visual afterthought.

## First Design Emphasis

Product language sharpens first around:

1. tenant admin overview
2. floor and cash workspace
3. station board

If those three surfaces feel operational, fast, and premium, the rest of
the runtime family can inherit the same language without becoming
repetitive.

## Related

- [`../../reference/architecture/runtime-surfaces.md`](../../reference/architecture/runtime-surfaces.md)
- [`../../reference/architecture/render-modes.md`](../../reference/architecture/render-modes.md)
- [`./customer-session-model.md`](./customer-session-model.md)
- [`./authorization.md`](./authorization.md)
