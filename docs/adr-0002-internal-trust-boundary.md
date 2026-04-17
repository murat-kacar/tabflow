# ADR 0002: Strengthen Internal Trust Boundary

Scope: Source Baseline

Status Snapshot: 2026-04-17

## Status

Proposed.

## Context

Current platform and tenant admin flows rely on:

- shared static API keys between web and API services
- forwarded actor headers for identity propagation

This works for a source baseline but is weaker than short-lived service
identity and explicit audience scoping.

## Decision

Move toward an internal trust model with:

- short-lived signed internal tokens for service-to-service calls
- explicit audience and issuer validation per API
- forwarded actor context signed as token claims instead of unsigned headers
- optional mTLS at infrastructure boundary when operational layers are added

Static shared API keys remain as compatibility fallback only during migration.

## Consequences

Positive:

- reduced replay risk and key leakage blast radius
- clearer separation of service identity and human actor identity
- easier policy enforcement for role + audience checks

Tradeoffs:

- token issuance/validation infrastructure complexity increases
- migration requires staged rollout across platform-web and tenant-web

## Migration Outline

1. Introduce token issuer and validator primitives in shared backend packages.
2. Allow dual-mode auth: existing key headers and signed internal tokens.
3. Shift web apps to token-based service calls.
4. Remove static key requirement from mutable endpoints.
5. Keep documented emergency break-glass fallback outside normal request path.

## Non-Goals

- Public OAuth/OIDC provider integration for end users.
- Removing actor-level authorization checks.
