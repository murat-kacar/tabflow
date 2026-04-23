# Contributing To Docs

Rules for the active docs tree:

- Write into the active `docs/` tree. During a major rewrite, a parallel
  `docs.next/` tree may exist as a draft; when the draft is locked, it
  replaces the active tree in a single swap commit.
- Prefer updating an existing source-of-truth document before opening a
  new file.
- Place task guides in `how-to/`, stable facts in `reference/`, and
  reasoning in `explanation/`.
- Keep titles short, clear, and noun-based where possible.
- Architecture decisions are recorded in
  [`../reference/architecture/decisions.md`](../reference/architecture/decisions.md).
  Longer reasoning for a decision belongs in
  [`../explanation/decisions/`](../explanation/decisions/README.md).
- Link with relative paths so the tree stays valid when rendered on any
  host.
- Avoid embedding credentials, secrets, or real customer data in examples.
