# ADR 0001: Use .NET + TypeScript

## Status

Accepted.

## Context

The product needs long-lived backend correctness, tenant isolation, and modern
web UI velocity.

## Decision

Use ASP.NET Core for backend APIs and TypeScript/Next.js for frontend apps.
Use PostgreSQL 17 as the database.

## Consequences

Positive:

- Strong backend conventions through ASP.NET Core.
- Mature PostgreSQL support through Npgsql/EF Core.
- Clear frontend ecosystem through Next.js and Tailwind CSS.

Tradeoffs:

- Two language ecosystems must be maintained.
- Shared contracts need deliberate generation or schema discipline.
- Runtime packaging and automation must be designed as a separate
  layer instead of leaking into source code.

## Non-Goals

- MSSQL is not required just because the backend is .NET.
- Runtime platform decisions are outside this source-only baseline.
