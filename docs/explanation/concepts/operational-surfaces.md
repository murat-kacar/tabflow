# Operational Surfaces

This document explains how TabFlow thinks about tenant runtime surfaces and why
they are split the way they are.

## Core Surface Family

The current tenant runtime surface family is:

1. customer menu
2. tenant admin console
3. floor and cash workspace
4. station board
5. waiter/mobile PDA workspace

These surfaces should share:

- one runtime contract
- one operational status language
- one family resemblance in tone and interaction quality

But they should not feel like the same screen with different tabs.

## Why Multiple Surfaces Exist

Cafe operations have different attention modes:

- oversight and setup
- floor supervision and cash handling
- production fulfillment
- mobile, table-side service
- customer browsing and ordering

Trying to force those into one generic admin screen creates noise and weakens
each role.

## Surface Roles

### Tenant Admin Console

Role:

- live visibility
- setup and governance
- exception detection
- station, catalog, device, staff, and settings control

Target feel:

- premium operational control center
- warmer and more operational than a generic SaaS panel

Expected navigation baseline:

- `Overview`
- `Stations`
- `Catalog`
- `Devices`
- `Staff`
- `Settings`

Admin-console visual direction:

- warm stone and paper-like neutrals rather than glossy SaaS chrome
- white or near-white work surfaces with strong station accents
- big, trustworthy headings and compact operational detail underneath
- high-contrast status chips for device, station, and fallback warnings

Expected overview content:

- top summary band for active tables, open checks, ready orders, and offline
  devices
- attention queue for fallback-station items, unhealthy devices, and delayed
  stations
- station health panel
- quick setup actions for stations, catalog coverage, and devices

Expected station-management behavior:

- station cards should show name, code, color, type, active state, product
  count, operator count, and fallback status
- detail view should support reorder, disable, fallback selection, and product
  coverage review
- product routing should be explicit at item level, with category-level station
  assignment acting only as a helper default

### Floor And Cash Workspace

Role:

- physical table state visibility
- open check handling
- manual payment flow
- move, merge, split, and close actions

Target feel:

- live
- tactical
- table-centric
- capable of showing both physical floor flow and bill flow in one workspace

Expected top-level views:

- `Floor`
- `Open Checks`
- `Payment Queue`
- `Closed Checks`

Primary mental model:

- one workspace should reveal both physical floor flow and bill/payment flow
- operators should not have to jump between a decorative floor planner and a
  separate cash-only screen to understand the live state of a table

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
- move table/check
- merge tables/checks
- split check
- inspect live order details

Interaction principle:

- normal mode is operational
- layout editing must be explicit and separate
- move/merge/split/close actions should be quick but still deliberate
- closing a check should require a stronger confirmation than normal table
  selection

### Station Board

Role:

- single-station or supervisor-facing fulfillment board
- progression through `new`, `preparing`, and `ready`
- urgency visibility with minimal distraction

Target feel:

- high contrast
- fast-glance readable
- more like a production board than an admin panel

Station board is a family concept, not just one kitchen screen. Variants may
include:

- kitchen
- barista
- bar
- hookah
- fastfood
- dispatch

Board structure baseline:

- default single-station view should emphasize `new`, `preparing`, and `ready`
  columns
- supervisor view may add station switching or multi-station summary
- cards should prioritize distance readability over dense data presentation

Ticket-card anchors:

- table number
- order id
- item name
- quantity
- item note and order note
- elapsed time

Urgency direction:

- 0-3 minutes: normal
- 3-7 minutes: warning
- 7+ minutes: urgent

Expected operator actions:

- start preparing
- mark ready
- mark remake/rework when needed
- cancel when authorized by the runtime flow

Visual direction:

- high contrast
- dark board background
- large timers and action buttons
- readable from distance and under high-pressure conditions

### Waiter / PDA Web

Role:

- fast mobile order taking
- one-handed use
- table-side operation

This surface should behave like a focused field tool rather than a compressed
admin screen.

PDA direction:

- one-handed use
- quick table selection
- fast note entry
- minimal navigation chrome
- no dependency on customer QR flow for protected waiter actions

### Customer Menu

Role:

- table-side browsing
- open check visibility
- low-friction order composition

Security note:

- browsing should stay lightweight after a browser joins the active table
  experience
- final order submission remains the critical boundary and should require a
  fresh QR proof

Experience direction:

- category-first browsing
- strong mobile-first layout
- lightweight session continuity while the table session remains open
- final order submission as the only deliberately high-friction step

## Shared Runtime Language

All runtime surfaces should share the same operational anchors:

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
- operators can be scoped to the stations that matter to them

This is what allows the same product model to fit:

- kitchen
- bar
- barista
- hookah
- dessert
- dispatch

without hard-coding one narrow restaurant structure forever.

### Fallback Rule

The model should always have one fallback station so product routing failures do
not make items disappear operationally.

Catalog direction:

- item-level station assignment is the final routing source
- category-level station assignment may exist as a helpful default only
- admins should be able to see when an item is falling back rather than
  explicitly routed

## Floor Layout Model

Floor and cash operation is not just a table list.

The runtime should support multiple physical layouts for one tenant, such as:

- main floor
- balcony
- upper floor
- garden
- dispatch or takeaway area

Direction of travel:

- one tenant may have multiple layouts
- each layout may contain zones
- tables have placement and visual metadata
- fixed objects such as cashier bank, entrance, or kitchen pass can exist in
  the floor model
- edit mode should be distinct from normal operations mode

Reference data direction:

- one tenant may own multiple layouts
- one layout may own multiple zones
- tables keep placement metadata per layout
- fixed floor objects act as edit-friendly anchors rather than runtime orders
  or billing entities

## UX Principle

The same business state should be visible through role-appropriate surfaces, not
through one giant shared UI.

This is a core TabFlow product principle, not a visual afterthought.

## First Design Emphasis

The product language should sharpen first around:

1. tenant admin overview
2. floor and cash workspace
3. station board

If those three surfaces feel operational, fast, and premium, the rest of the
runtime family can inherit the same language without becoming repetitive.
