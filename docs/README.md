# TabFlow Documentation

This is the TabFlow documentation tree.

It follows a Diátaxis-inspired structure so readers can quickly find the
kind of information they need:

- `tutorials/` — step-by-step learning material
- `how-to/` — task-oriented operational guides
- `reference/` — stable facts, contracts, and system reference
- `explanation/` — conceptual and architectural reasoning
- `meta/` — documentation governance and maintenance notes

## Start Here

- New contributor or teammate: [`tutorials/getting-started.md`](./tutorials/getting-started.md)
- Need to perform a task: [`how-to/`](./how-to/README.md)
- Need exact system facts: [`reference/`](./reference/README.md)
- Need to understand why the system is shaped this way: [`explanation/`](./explanation/README.md)
- Need docs-tree maintenance rules: [`meta/`](./meta/README.md)

## Fast Paths

- Active architecture decisions: [`reference/architecture/decisions.md`](./reference/architecture/decisions.md)
- System overview: [`reference/architecture/system-overview.md`](./reference/architecture/system-overview.md)
- Runtime surface map: [`reference/architecture/runtime-surfaces.md`](./reference/architecture/runtime-surfaces.md)
- Render-mode strategy: [`reference/architecture/render-modes.md`](./reference/architecture/render-modes.md)
- Capability matrix: [`reference/architecture/capability-matrix.md`](./reference/architecture/capability-matrix.md)
- Platform vs tenant concepts: [`explanation/concepts/multi-tenancy.md`](./explanation/concepts/multi-tenancy.md)
- Authorization model: [`explanation/concepts/authorization.md`](./explanation/concepts/authorization.md)
- Customer QR and session model: [`explanation/concepts/customer-session-model.md`](./explanation/concepts/customer-session-model.md)
- Tenant runtime surfaces (product view): [`explanation/concepts/operational-surfaces.md`](./explanation/concepts/operational-surfaces.md)
- Database schema: [`reference/database/schema.md`](./reference/database/schema.md)
- Tenant public HTTP and device WebSocket: [`reference/api/tenant-api.md`](./reference/api/tenant-api.md)
- Firmware runtime contract: [`reference/firmware.md`](./reference/firmware.md)
- Provision a tenant: [`how-to/provision-tenant.md`](./how-to/provision-tenant.md)
- Deploy or update a host runtime: [`how-to/deploy-to-production.md`](./how-to/deploy-to-production.md)

## Documentation Rules

- Prefer fewer, stronger source-of-truth documents.
- Create new files only when a topic truly needs to stand alone.
- Keep task guidance in `how-to/` and stable facts in `reference/`.
- Reasoning, tradeoffs, and concepts belong in `explanation/`.
- Architecture decisions are recorded in
  [`reference/architecture/decisions.md`](./reference/architecture/decisions.md).
  Longer reasoning for a decision lives in
  [`explanation/decisions/`](./explanation/decisions/README.md).
