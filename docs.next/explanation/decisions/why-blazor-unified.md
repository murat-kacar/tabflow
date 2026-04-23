# Why Blazor As The Unified Stack

This document is the reasoning behind
[`../../reference/architecture/decisions.md`](../../reference/architecture/decisions.md)
AD-0002 (ASP.NET Core 10 and Blazor Web App) and AD-0003 (one host process
per side).

The short version: carrying two ecosystems cost more than it returned.
Unifying on .NET removes duplication, removes an entire proxy layer, and
keeps the stack close to a single vendor release cadence and a single set of
idioms.

## What Was Replaced

The previous iteration ran:

- ASP.NET Core for platform and tenant APIs and the provisioning worker
- Next.js with TypeScript for platform and tenant web applications
- A shared TypeScript package for DTOs and Zod schemas
- A handwritten backend-for-frontend layer that forwarded actor identity
  headers signed by a shared static key
- Three handwritten HMAC-signed cookie session protocols for platform admin,
  tenant admin, and customer access

The web tier did useful work, but most of that work existed because the API
lived in a different process. The web tier validated input a second time,
forwarded actor context a second time, and imported a duplicated contract
package to stay in sync with the API.

## What Changed With Blazor Web App

Blazor Web App in .NET 10 is explicitly a server-first full-stack framework.
It renders static HTML, it renders interactive server components, and it
ships with enhanced navigation and enhanced forms that cover the cases that
used to justify a separate SPA tier.

The relevant properties for TabFlow are:

- A component can be Static SSR or Interactive Server declaratively.
- A component can call into dependency-injected services directly, without
  an HTTP hop.
- Authentication is native cookie auth through ASP.NET Core Identity.
- Authorization uses standard attributes and policies.
- Antiforgery, model binding, localization, and validation are framework
  primitives.

Combining this with AD-0003 (one host process per side) collapses the web
tier and the API tier into one project. The backend-for-frontend layer and
the duplicated validation layer both disappear.

## Convention Over Innovation

Every choice in TabFlow aims to follow the convention of its ecosystem
rather than invent new machinery. The monolith direction is aligned with
current industry practice:

- Shopify has continued to describe itself as a majestic monolith after
  years of scale growth.
- Stack Overflow served global traffic from a single .NET monolith for many
  years and continues to document that shape publicly.
- The `MonolithFirst` position, popularized by Martin Fowler and others,
  argues for moving to services only under real pressure, not as a default.
- Microsoft's own Blazor Web App template ships as a single project. The
  framework does not encourage splitting into API and web tiers unless the
  team has a specific cross-boundary reason.

Orchard Core, the most relevant .NET multi-tenant reference in the same
family of problems TabFlow solves, also runs each tenant inside a single
ASP.NET Core host.

## Ecosystem Reductions

Going from two stacks to one reduces:

- Package managers: `pnpm` and `npm` removed; `dotnet` and `NuGet` remain.
- Linters and formatters: `Biome` removed; the .NET analyzer set and the
  default `dotnet format` rules remain.
- Test runners: `vitest` removed; `xunit` or `NUnit` with `bUnit` and
  `WebApplicationFactory` covers both unit and component testing.
- Build orchestrators: per-side Next.js build and shared-ts package builds
  removed; `dotnet build` and `dotnet publish` cover everything.
- Dependency graphs: the TypeScript dependency graph, the Next.js release
  cadence, and the React major-version timing drop out of the team's
  maintenance surface.

The remaining dependency graph is predictable because it tracks the .NET
release cadence. Long-term support versions are clearly labeled and
upgrades are one-shot for all host projects.

## Trade-offs Accepted

### Blazor Server circuit cost

Interactive Server requires a SignalR circuit and server-held state per
connected client. For public customer traffic this would be expensive.
AD-0004 (mixed render modes) addresses this by keeping customer-facing
surfaces on Static SSR and confining Interactive Server to authenticated
staff surfaces where the circuit cost is justified.

### Learning curve

Contributors with a React background must learn Blazor component authoring.
The loss is a few weeks of ramp time; the gain is a single concept of what a
component is, one idiomatic state model, and one debugging toolchain per
team member.

### External API surface

A future native mobile client or a deliberate third-party integration would
need an explicit HTTP API surface. AD-0003 accepts that this is additive and
not a retrofit: the domain layer lives in a shared package, so a second host
project that exposes HTTP endpoints against the same application services is
a weekend project, not a refactor.

### Long-lived server state

Blazor Interactive Server components are stateful. The framework handles
reconnect. The team must still treat that state as transient: anything that
must survive a reconnect must be persisted, and anything stored in a
component instance must not be relied on for business-critical continuity.

## What Did Not Change

- The control-plane and runtime split. Platform and tenant remain separate
  by design, not by framework quirk.
- PostgreSQL 17 as the storage baseline.
- The ESP32 firmware contract.
- The surface family (customer menu, admin console, floor and cash,
  station board, PDA).
- The station-first fulfillment model.

The refactor removes a tier and a language, not a product shape.
