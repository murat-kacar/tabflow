# Architecture Decisions

This document records the active architecture decisions that currently shape the
repository.

We intentionally keep the decision trail compact in one document for now
instead of creating many small ADR files.

## AD-0001: Use .NET + TypeScript

### Status

Accepted.

### Context

TabFlow needs:

- long-lived backend correctness
- clear tenant isolation
- modern web UI delivery speed

### Decision

Use:

- ASP.NET Core for backend APIs and worker processes
- Next.js with TypeScript for web applications
- PostgreSQL 17 for storage

### Consequences

Positive:

- strong backend conventions
- mature PostgreSQL tooling through the .NET stack
- clear frontend ecosystem and SSR/runtime path via Next.js

Tradeoffs:

- two language ecosystems must be maintained
- shared contracts need discipline
- runtime packaging must remain an explicit layer rather than leaking into
  domain code

## AD-0002: Strengthen Internal Trust Boundary

### Status

Proposed and directionally adopted as the target boundary.

### Context

Current internal web-to-API flows still rely on:

- shared static API keys between web and API services
- forwarded actor headers

This is acceptable as a baseline but weaker than short-lived internal service
identity.

### Decision

Move toward:

- short-lived signed internal tokens for service-to-service calls
- explicit issuer and audience validation
- signed actor context in token claims instead of unsigned forwarded headers
- optional mTLS at the infrastructure edge when that layer becomes mature

### Consequences

Positive:

- lower replay risk
- clearer separation between service identity and human identity
- better role and audience enforcement options

Tradeoffs:

- token issuance and validation complexity increases
- rollout requires staged migration across platform and tenant web/API pairs

## AD-0003: Keep Platform And Tenant Separate

### Status

Accepted.

### Decision

The platform is not a tenant and must not collapse into tenant runtime
concerns.

The platform owns:

- control-plane state
- tenant lifecycle orchestration
- provisioning visibility

Tenant runtimes own:

- business data
- customer access
- floor, cash, menu, station, and kitchen flows

### Consequences

- platform and tenant APIs remain separate
- platform and tenant databases remain separate
- runtime provisioning becomes a bridge, not a merger, between the two
