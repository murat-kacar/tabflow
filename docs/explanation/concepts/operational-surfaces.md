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

### Waiter / PDA Web

Role:

- fast mobile order taking
- one-handed use
- table-side operation

This surface should behave like a focused field tool rather than a compressed
admin screen.

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

## UX Principle

The same business state should be visible through role-appropriate surfaces, not
through one giant shared UI.

This is a core TabFlow product principle, not a visual afterthought.
