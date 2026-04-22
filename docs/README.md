# TabFlow Documentation

This is the rebuilt documentation tree for TabFlow.

It follows a Diataxis-inspired structure so readers can quickly find the kind
of information they need:

- `tutorials/`: step-by-step learning material
- `how-to/`: task-oriented operational guides
- `reference/`: stable facts, contracts, and system reference
- `explanation/`: conceptual and architectural reasoning
- `meta/`: documentation governance and maintenance notes

Legacy material has been preserved under [`old-docs/`](../old-docs/) and is now
source material for rewrite work rather than the active documentation tree.

## Start Here

- New contributor or teammate: [tutorials/getting-started.md](./tutorials/getting-started.md)
- Need to perform a task: [how-to/](./how-to/)
- Need exact system facts: [reference/](./reference/README.md)
- Need to understand why the system is shaped this way: [explanation/](./explanation/README.md)
- Need docs-tree maintenance rules: [meta/](./meta/README.md)

## Documentation Rules

- Prefer fewer, stronger source-of-truth documents.
- Create new files only when a topic truly needs to stand alone.
- Rewrite from `old-docs/` deliberately; do not bulk-copy legacy files.
- Keep task guidance in `how-to/` and stable facts in `reference/`.
