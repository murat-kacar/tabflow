# TabFlow Documentation

This is the rebuilt documentation tree for TabFlow.

It follows a Diataxis-inspired structure so readers can quickly find the kind
of information they need:

- `tutorials/`: step-by-step learning material
- `how-to/`: task-oriented operational guides
- `reference/`: stable facts, contracts, and system reference
- `explanation/`: conceptual and architectural reasoning
- `meta/`: documentation governance and maintenance notes

## Start Here

- New contributor or teammate: [tutorials/getting-started.md](./tutorials/getting-started.md)
- Need to perform a task: [how-to/](./how-to/)
- Need exact system facts: [reference/](./reference/README.md)
- Need to understand why the system is shaped this way: [explanation/](./explanation/README.md)
- Need docs-tree maintenance rules: [meta/](./meta/README.md)

## Fast Paths

- Tenant runtime and surface map:
  [reference/architecture/system-overview.md](./reference/architecture/system-overview.md)
- Platform vs tenant concepts:
  [explanation/concepts/multi-tenancy.md](./explanation/concepts/multi-tenancy.md)
- Customer QR/session model:
  [explanation/concepts/customer-session-model.md](./explanation/concepts/customer-session-model.md)
- Provision a tenant:
  [how-to/provision-tenant.md](./how-to/provision-tenant.md)
- Deploy or update a host runtime:
  [how-to/deploy-to-production.md](./how-to/deploy-to-production.md)

## Documentation Rules

- Prefer fewer, stronger source-of-truth documents.
- Create new files only when a topic truly needs to stand alone.
- Keep task guidance in `how-to/` and stable facts in `reference/`.
