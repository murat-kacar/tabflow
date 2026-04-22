# Host Operations

This document records the current host-level runtime layout used for a live
staging installation. It exists to make operational state explicit without
moving deployment automation into the source baseline.

## Current Hosts

- `https://staging.tabflow.uk` -> platform web + platform API
- `https://demo.tabflow.uk` -> tenant web + tenant API

## Runtime Layout

Source code stays in:

```text
/opt/tabflow
```

Published backend artifacts live outside the repository:

```text
/opt/tabflow-deploy/platform-api
/opt/tabflow-deploy/tenant-api
```

Host-managed secrets and environment files live outside the repository:

```text
/etc/tabflow/platform-api.env
/etc/tabflow/platform-api.appsettings.json
/etc/tabflow/platform-web.env
/etc/tabflow/tenant-api.env
/etc/tabflow/tenant-api.appsettings.json
/etc/tabflow/tenant-web.env
```

Generated runtime artifacts and logs live outside the repository:

```text
/var/lib/tabflow/runtime/generated
/var/log/tabflow
```

## Service Model

Systemd units:

- `tabflow-platform-api.service`
- `tabflow-platform-operator.service`
  source repo path now lives under `apps/platform-worker`
- `tabflow-platform-web.service`
- `tabflow-tenant-api.service`
- `tabflow-tenant-web.service`
- `tabflow-tenant-api@<tenant-code>.service`
- `tabflow-tenant-web@<tenant-code>.service`

Current behavior:

- API services run published .NET binaries from `/opt/tabflow-deploy/...`
- web services run Next.js standalone servers from the repository build output
- services read environment values through `EnvironmentFile=` from `/etc/tabflow`
- per-tenant tenant runtime instances can be provisioned automatically by the platform operator

## Reverse Proxy

Nginx virtual hosts:

- `/etc/nginx/sites-available/tabflow-staging`
- `/etc/nginx/sites-available/tabflow-demo`

TLS certificates are managed with Let's Encrypt / Certbot and terminate at
Nginx before proxying to host-local services.

## Operating Principle

This repository remains source-first:

- no active deploy output should live under `/opt/tabflow`
- no active production secrets should live under `/opt/tabflow`
- host configuration belongs to `/etc`
- published runtime artifacts belong outside the repository tree

If host-level deployment changes, update this document to keep the gap between
source architecture and real host operations explicit.

## Automated Tenant Provisioning

After DNS exists for a tenant host, the platform operator can finish the rest of
the host lifecycle automatically:

- creates the tenant PostgreSQL database
- writes `/etc/tabflow/tenants/<code>-api.env`
- writes `/etc/tabflow/tenants/<code>-web.env`
- ensures templated `systemd` units exist
- generates and enables an Nginx vhost
- obtains TLS through Certbot
- starts per-tenant API and web instances
- verifies tenant health and flips platform tenant status to `active`

Operational flow:

1. create the DNS record
2. create the tenant in platform
3. wait for the provision job to complete
4. sign in with `admin@<tenant-code>.tabflow.uk` and `TabFlow123.`
