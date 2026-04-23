# Deploy To Production

This guide describes the current host-side deployment shape used by TabFlow.

## Runtime Layout

Source code stays in:

```text
/opt/tabflow
```

Published backend artifacts live outside the repository:

```text
/opt/tabflow-deploy/platform-api
/opt/tabflow-deploy/platform-operator
/opt/tabflow-deploy/tenant-api
```

Host-managed environment and config live under:

```text
/etc/tabflow
/etc/tabflow/platform-api.env
/etc/tabflow/platform-api.appsettings.json
/etc/tabflow/platform-web.env
/etc/tabflow/platform-operator.env
/etc/tabflow/tenant-api.env
/etc/tabflow/tenant-api.appsettings.json
/etc/tabflow/tenant-web.env
/etc/tabflow/tenants/<code>-api.env
/etc/tabflow/tenants/<code>-web.env
```

Generated runtime artifacts and logs live outside the repository tree.

Typical runtime-owned output roots:

```text
/var/lib/tabflow/runtime/generated
/var/log/tabflow
```

## Current Hosts

- `https://staging.tabflow.uk` -> platform web + platform API
- `https://<tenant>.tabflow.uk` -> tenant web + tenant API

Nginx terminates TLS before proxying to host-local services.

## Current Service Model

Systemd units currently include:

- `tabflow-platform-api.service`
- `tabflow-platform-operator.service`
- `tabflow-platform-web.service`
- `tabflow-tenant-api.service`
- `tabflow-tenant-web.service`
- `tabflow-tenant-api@<tenant-code>.service`
- `tabflow-tenant-web@<tenant-code>.service`

Current runtime behavior:

- API services run published .NET binaries from `/opt/tabflow-deploy/...`
- web services run Next.js standalone output from the repository build tree
- services read runtime values through `EnvironmentFile=` under `/etc/tabflow`

Tenant web services run Next.js standalone output from:

```text
src/apps/tenant-web/.next/standalone/src/apps/tenant-web/server.js
```

Platform web uses the same standalone pattern under `src/apps/platform-web`.

Naming note:

- the source application now lives under `src/apps/platform-worker`
- the current live host service and publish directory still retain the older
  `platform-operator` runtime name
- the runtime naming should be treated as authoritative until the host service
  is intentionally renamed

## Standard Deployment Flow

1. pull the latest source into `/opt/tabflow`
2. publish backend applications to `/opt/tabflow-deploy/...`
3. build Next.js applications in the source tree
4. update systemd or runtime config only when source layout/runtime contracts
   have changed
5. restart the affected services
6. reload Nginx when host or static routing changes
7. run smoke checks against internal health and public entrypoints

## Automated Tenant Provisioning Flow

Once DNS exists for a tenant host, the platform operator may complete the host
runtime lifecycle automatically:

1. create the tenant database
2. write tenant API/web environment files
3. ensure templated `systemd` units exist
4. generate and enable an Nginx vhost
5. obtain TLS through Certbot
6. start tenant API and web instances
7. verify health and mark the tenant `active`

## Expected Smoke Checks

At minimum:

- internal API health endpoints return `ok`
- public login pages return `200`
- expected static assets are reachable
- tenant domains route to the correct tenant runtime

## Operating Principle

The repository remains source-first:

- no active production secrets inside the source tree
- no host-owned environment files inside the source tree
- published runtime artifacts live outside the repository checkout
- host-specific state is explicit rather than hidden inside source docs
