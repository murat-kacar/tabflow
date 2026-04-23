# Deploy To Production

This guide describes the host-side deployment shape for TabFlow after
Refactor 3. The runtime model is covered at an architectural level in
[`../reference/architecture/system-overview.md`](../reference/architecture/system-overview.md).

## Runtime Layout

Source code stays in:

```text
/opt/tabflow
```

Published host artifacts live outside the repository:

```text
/opt/tabflow-deploy/platform
/opt/tabflow-deploy/platform-worker
/opt/tabflow-deploy/tenant
```

Host-managed environment and configuration live under:

```text
/etc/tabflow
/etc/tabflow/platform.env
/etc/tabflow/platform.appsettings.json
/etc/tabflow/platform-worker.env
/etc/tabflow/tenant.env
/etc/tabflow/tenant.appsettings.json
/etc/tabflow/tenants/<code>.env
```

Runtime-owned output, including generated firmware and logs, lives under:

```text
/var/lib/tabflow/runtime/generated
/var/log/tabflow
```

## Hosts

Each side runs as a single ASP.NET Core host process.

- Platform host — serves the platform admin UI and platform health probes.
- Tenant host — one process per tenant, serves every tenant-facing surface
  and the ESP32 device WebSocket.

Example host assignment:

- `https://<platform-host>` routes to the platform host.
- `https://<tenant-domain>` routes to that tenant's host.

Nginx terminates TLS and proxies to the local port of the target host.

## Systemd Units

```text
tabflow-platform.service
tabflow-platform-worker.service
tabflow-tenant@<tenant-code>.service
```

- `tabflow-platform.service` runs the platform host.
- `tabflow-platform-worker.service` runs the provisioning worker.
- `tabflow-tenant@<tenant-code>.service` is the templated tenant host unit.
  One enabled instance per tenant.

Each unit reads configuration through `EnvironmentFile=` under
`/etc/tabflow` and optional tenant-specific overrides under
`/etc/tabflow/tenants/`.

Compared with the previous iteration, there are no longer separate
`*-api.service` and `*-web.service` units per side. A single unit covers
both the API surface and the Blazor UI for each host.

## Nginx

Nginx holds:

- One TLS termination block per domain.
- One `proxy_pass` per host. No separate `location /api/` block is needed;
  the ASP.NET Core host handles both UI routes and the remaining
  `/api/public/**`, `/ws/masa/**`, and `/health*` paths in the same
  process.
- Websocket headers enabled so `/ws/masa/...` passes through cleanly.

Per-tenant vhosts are generated during provisioning and reload nginx when
the tenant goes active.

## Standard Deployment Flow

1. Pull the latest source into `/opt/tabflow`.
2. Publish the platform host: `dotnet publish src/apps/platform -c Release
   -o /opt/tabflow-deploy/platform`.
3. Publish the platform worker: `dotnet publish src/apps/platform-worker
   -c Release -o /opt/tabflow-deploy/platform-worker`.
4. Publish the tenant host: `dotnet publish src/apps/tenant -c Release -o
   /opt/tabflow-deploy/tenant`.
5. Update systemd or runtime configuration only when source layout or
   runtime contracts have changed.
6. Restart the affected services.
7. Reload nginx when host-level routing changes.
8. Run smoke checks against internal health endpoints and customer entry
   points.

## Automated Tenant Provisioning

Once DNS exists for a tenant host, the platform worker may complete the
host runtime lifecycle automatically:

1. Create the tenant database and database user.
2. Write the tenant-specific environment file under
   `/etc/tabflow/tenants/`.
3. Ensure the templated `tabflow-tenant@<tenant-code>.service` instance is
   enabled.
4. Generate and enable an nginx vhost for the tenant domain.
5. Obtain TLS through Certbot.
6. Start the tenant host.
7. Run EF Core migrations and seed tenant defaults.
8. Verify health and mark the tenant `active`.

Details of the provisioning flow, including the initial owner password
handling, live in [`./provision-tenant.md`](./provision-tenant.md).

## Smoke Checks

At minimum, after any deployment:

- `GET /health/ready` on the platform host returns `ok`.
- `GET /health/ready` on at least one tenant host returns `ok`.
- Platform admin sign-in page returns `200`.
- Tenant customer entry page returns `200` on a known tenant domain.
- Expected static assets are reachable.
- The platform worker is up and polling the provisioning queue.

## Operating Principle

The repository stays source-first:

- No active production secrets inside the source tree.
- No host-owned environment files inside the source tree.
- Published host artifacts live outside the repository checkout.
- Host-specific state is explicit under `/etc/tabflow`, not hidden inside
  source documents.
