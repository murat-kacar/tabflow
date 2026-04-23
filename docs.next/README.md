# `docs.next/` — TabFlow Documentation (Refactor 3 Draft)

This is the **in-progress rewrite** of the TabFlow documentation tree for the
third architectural refactor (Blazor unification).

Until this tree is locked, the authoritative source is still [`../docs/`](../docs/).

## Status

- The legacy tree `docs/` remains valid for any active runbook or contract
  question until the swap commit.
- `docs.next/` is the future `docs/`. When review is complete, a single commit
  renames `docs/` to `docs.archive/` and `docs.next/` to `docs/`.
- During the draft window, any divergence between the two trees is expected.
  The legacy tree describes the running system. The draft tree describes the
  target system after Refactor 3.

## Structure

`docs.next/` mirrors the [Diátaxis](https://diataxis.fr/) taxonomy already used
by the legacy tree:

- `tutorials/` — guided learning
- `how-to/` — task-oriented procedures
- `reference/` — stable facts and contracts
- `explanation/` — reasoning, concepts, decisions
- `meta/` — documentation governance

## Authoring Rules

- Prefer revising an existing source-of-truth document over opening a new one.
- Keep titles short, noun-based, and stable.
- One commit per document during draft; atomic history helps review.
- Lock order: decisions → system overview → runtime surfaces → supporting
  references → how-to and tutorials → minor revisions.
