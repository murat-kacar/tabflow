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
- `tabflow-platform-web.service`
- `tabflow-tenant-api.service`
- `tabflow-tenant-web.service`

Current behavior:

- API services run published .NET binaries from `/opt/tabflow-deploy/...`
- web services run Next.js standalone servers from the repository build output
- services read environment values through `EnvironmentFile=` from `/etc/tabflow`

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
