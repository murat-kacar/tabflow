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
  host. Do not hard-code the tree root (for example `docs.next/...` or
  `docs/...`) inside a document that lives inside the tree itself.
- Avoid embedding credentials, secrets, or real customer data in
  examples.

## Workflow Principles

TabFlow is documentation-first. These principles apply to every change
that touches the shape of the system:

- Any architectural change lands in the relevant `reference/` or
  `explanation/` document **before** the code change.
- When the code and the docs disagree, treat it as a documentation bug
  first. Fix the doc, review the fix, then align the code. Never promote
  the code as the source of truth retroactively.
- An architectural change requires an entry in
  `reference/architecture/decisions.md`. Extended reasoning lives in
  `explanation/decisions/<slug>.md` and is linked from the ADR.
- The docs changelog (`meta/changelog.md`) tracks documentation
  evolution. Product release notes live in a repo-root `CHANGELOG.md`
  when product versioning is established; they do not mix with the docs
  changelog.

## Swap Commit Checklist

When a `docs.next/` rewrite is locked, the swap commit moves the active
tree to `docs.archive/` and promotes `docs.next/` to `docs/` in one
commit.

Before that commit:

- Verify that every relative link inside `docs.next/` resolves.
- Audit the tree for any reference to `docs.next/` itself (paths, fast
  paths, mentions of a "draft tree"); rewrite those references as plain
  `docs/`-relative paths or remove them.
- Audit the repo-root `README.md` for doc paths and update the
  documentation map in the same commit.
- Add a changelog entry under the current unreleased section in
  `meta/changelog.md`.
