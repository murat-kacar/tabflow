# NFR Baseline

Scope: Source Baseline

Status Snapshot: 2026-04-17

This baseline defines non-functional expectations used to evaluate architecture
and implementation choices.

## Service Objectives

| Area | Indicator | Target | Current state |
| --- | --- | --- | --- |
| Platform API availability | monthly successful request ratio | 99.9% | Planned target, not yet measured in-repo |
| Tenant API availability | monthly successful request ratio | 99.9% | Planned target, not yet measured in-repo |
| Public catalog latency | p95 `GET /api/public/catalog` | < 300 ms (steady state) | Planned target |
| Admin mutation latency | p95 write operations | < 500 ms | Planned target |
| Provisioning completion | successful `tenant.create` job ratio | > 99% | Partially visible via job status, no formal SLO yet |

## Observability Baseline

- All APIs should emit structured JSON logs with request id, tenant code (when available), actor id (when available), and endpoint.
- Errors should include stable error category codes in addition to HTTP status.
- Provisioning jobs should emit step-level status transitions with timestamps.
- Metrics and distributed tracing are planned; this repo currently defines
  expectations but not full telemetry infrastructure.

## Security Baseline

- No secrets in source control.
- App-to-app auth should evolve from shared static keys to short-lived internal service identity.
- Admin and device credentials must be rotatable without database rebuilds.
- Raw secret material should be shown only at creation/rotation time.
- Production secret manager integration is out of scope for this source baseline.

## Data And Audit Baseline

- Audit logs must record auth and tenant lifecycle mutations.
- Audit retention target: minimum 180 days in production environments.
- PII minimization rule: store only required fields for operations and auditing.
- Backup, archival, and legal retention workflows belong to operational layers.

## Out Of Scope

- Concrete production alert routing and on-call escalation trees.
- Vendor-specific APM and SIEM configuration.
