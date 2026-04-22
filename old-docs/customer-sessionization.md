# Customer Sessionization

Scope: Runtime Security And Customer Experience Baseline

Status Snapshot: 2026-04-21

This document defines the official customer access, sessionization, and
identity model for QR-driven tenant menu access.

The goal is to keep the customer flow lightweight while concentrating security
controls at the point where an order is actually submitted.

## Product Goal

TabFlow should allow customers to:

- scan a table QR
- join the live table experience quickly
- browse menu and open check comfortably
- submit orders only with fresh proof of physical presence at the table

TabFlow should prevent:

- replaying expired QR codes
- using screenshots of old QR codes
- submitting orders remotely without access to the current table display

## Core Model

There is one canonical live table session.

This session:

- starts when a customer scans a fresh QR for a table that has no open session
- remains open while the table check is open
- ends when the check is closed by the store

Every participating browser receives its own access ticket, but all access
tickets attach to the same live table session.

This means:

- one table session per active table check
- multiple browser participants may join the same table session
- each browser has its own signed access cookie
- all participants see the same live table context
- orders can still be attributed to the specific access ticket that created them

## Official Runtime Concepts

### 1. QR Token

The QR token is a short-lived join proof.

Rules:

- only one fresh QR is considered active for a table at a time
- QR TTL is short, currently 60 seconds
- every QR is single-use
- as soon as it is scanned successfully, it is consumed
- immediately after successful scan, the table display rotates to a new QR

QR tokens are only for joining the live table session.
They are not the long-lived customer session.

### 2. Table Session

The table session is the canonical live customer-facing session for a table.

Rules:

- created by the first successful fresh QR join
- remains active while the table check stays open
- closed by store-side operational flow when the check is closed
- all customer access becomes invalid when the table session closes

The table session is the backend source of truth.

### 3. Access Ticket

An access ticket represents one browser participant attached to the live table
session.

Rules:

- issued after successful QR join
- carried in a signed `httpOnly` first-party cookie
- browser-scoped, not guaranteed physical-device identity
- survives refresh as long as the cookie survives
- becomes invalid as soon as the parent table session closes

Important:

- access tickets are not real device IDs
- private tabs, cookie clearing, or different browsers may create new tickets
- this is acceptable
- security decisions must not rely on "same physical person" guarantees

### 4. Checkout Proof

The critical attack surface is order submission, not menu reading.

Therefore, every order submission must require a fresh QR proof.

Rules:

- menu and check can remain visible while an access ticket is valid
- `Submit order` must always require a fresh QR challenge
- the fresh QR used for checkout must be single-use
- after successful order submit, the checkout proof is consumed
- a later order submit requires a new fresh QR challenge again

This keeps the UX smooth while forcing physical table presence at the exact
moment an order enters the operation.

## Customer Flow

### Join Flow

1. Customer opens `/g/{token}` by scanning the current table QR.
2. Backend validates that the QR token is fresh and unused.
3. Backend consumes the QR token.
4. Backend opens the table session if one does not already exist.
5. Backend creates a new access ticket for this browser.
6. Tenant web stores the access ticket in a signed `httpOnly` cookie.
7. Customer is redirected to `/menu`.
8. Table display rotates to a new QR immediately.

### Read Flow

While the table session remains open and the browser access ticket is valid,
the customer may:

- browse the menu
- review the open check
- inspect previously submitted order lines attributed to the current ticket
- inspect the full table order/check state as allowed by the product surface

Menu and check reading should not require repeated QR scans.

### Submit Flow

1. Customer prepares basket normally.
2. Customer presses `Submit order`.
3. UI requests a fresh QR scan from the current table display.
4. Backend validates and consumes that fresh QR proof.
5. Backend verifies that the browser access ticket belongs to the still-open table session.
6. Backend creates the order and attributes it to:
   - the table session
   - the browser access ticket
7. The fresh checkout QR proof is consumed and cannot be reused.

Every later order submission must request another fresh QR proof.

### End Flow

When the table check is closed by the store:

- the table session is closed
- all linked access tickets become invalid
- customer cookies may remain physically present in the browser, but backend
  validation must reject them
- the next menu/order interaction must require joining again with a fresh QR

## Identity Model

TabFlow should distinguish between:

- operational session identity
- persistent pseudonymous customer identity

### Operational Identity

Operational identity is strictly necessary for the table flow:

- QR token
- table session
- access ticket
- checkout proof

This layer exists to make the product function and to defend order submission.

### Persistent Customer Identity

Separately, TabFlow may maintain a longer-lived first-party customer identity
for analytics, learning, and future recommendation hooks.

This identity is:

- pseudonymous
- not guaranteed to represent the same physical person forever
- not used as the security control for order submission

Suggested building blocks:

- first-party persistent cookie
- localStorage mirror
- server-side alias records
- coarse helper signals such as browser family, locale, and timezone

Important:

- this is not a hard device fingerprint
- this is not a substitute for fresh QR proof
- this identity layer must follow consent boundaries

## Consent Boundary

TabFlow should collect the maximum defensible signal set, not the maximum
possible signal set.

### Strictly Necessary Layer

May be used to operate the table flow and defend abuse:

- QR token events
- table session state
- access tickets
- checkout proof validation
- order submission metadata
- coarse abuse/security telemetry

### Consent-Gated Layer

Should be enabled only according to the selected consent model:

- persistent customer identity
- long-lived behavior stitching across visits
- recommendation features
- advanced analytics or profiling signals

The consent banner should present at least:

- `Reject`
- `Minimum`
- `Accept all`

`Reject` should still allow strictly necessary operational cookies.

## Official Security Position

The main threat is not menu visibility.
The main threat is remote or replayed order submission.

Therefore:

- QR join proof must be short-lived and single-use
- checkout must always require a fresh QR proof
- backend table session state is the source of truth
- browser access tickets are convenience/session carriers only

## Implementation Direction

Future runtime implementation should move from the current single customer
session model toward:

- canonical `table_sessions`
- browser-scoped `table_session_access_tickets`
- per-submit fresh QR checkout proof
- optional persistent first-party `customer_identity`

Until that migration is completed, current behavior should be treated as an
intermediate baseline rather than the final customer security model.
