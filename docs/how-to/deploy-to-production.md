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
```

Host-managed environment and config live under:

```text
/etc/tabflow
```

Generated runtime artifacts and logs live outside the repository tree.

## Current Service Model

Systemd units currently include:

- `tabflow-platform-api.service`
- `tabflow-platform-operator.service`
- `tabflow-platform-web.service`
- `tabflow-tenant-api@<tenant-code>.service`
- `tabflow-tenant-web@<tenant-code>.service`

Current runtime behavior:

- API services run published .NET binaries from `/opt/tabflow-deploy/...`
- web services run Next.js standalone output from the repository build tree
- services read runtime values through `EnvironmentFile=` under `/etc/tabflow`

## Standard Deployment Flow

1. pull the latest source into `/opt/tabflow`
2. publish backend applications to `/opt/tabflow-deploy/...`
3. build Next.js applications in the source tree
4. update systemd or runtime config only when source layout/runtime contracts
   have changed
5. restart the affected services
6. reload Nginx when host or static routing changes
7. run smoke checks against internal health and public entrypoints

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
