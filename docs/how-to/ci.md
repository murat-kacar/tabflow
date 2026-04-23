# Continuous Integration

This guide describes the checks that run on every pull request to
`main`. CI is configured to treat documentation and code with equal
weight.

## Trigger

CI runs on:

- every pull request targeting `main`
- every push to `main` (post-merge verification)

## Check Set

### Build And Test

- `dotnet restore TabFlow.sln`
- `dotnet build TabFlow.sln --configuration Release --no-restore`
- `dotnet test TabFlow.sln --configuration Release --no-build`

Build and test failures block merge.

### Lint

- `dotnet format --verify-no-changes` on the full solution
- EditorConfig compliance is enforced through `dotnet format`

Formatting violations block merge. Use `dotnet format` locally before
committing.

### Docs

- `markdownlint-cli2` across the `docs/` tree
- `lychee` link checker on the same tree

Markdown lint violations and broken links block merge. Links within the
repo are resolved relative to the file; external links are fetched and
must return a non-error status.

### OpenAPI Drift

When the tenant public OpenAPI document exists, CI regenerates it from
ASP.NET Core endpoint metadata and compares against the committed file
under `docs/reference/openapi/`. A diff blocks merge; regenerate and
commit the file locally to clear the failure.

## Artifacts

CI publishes:

- Build and test logs
- `dotnet format` diff on failure
- Link-check report on failure
- OpenAPI diff on failure

Artifacts remain on the pipeline run for at least 14 days.

## Required Reviews

Two approvals are required before merge. One must be from a CODEOWNER
for the affected path (see `.github/CODEOWNERS` once it exists).

## Local Reproduction

Replicate every CI check locally:

```bash
dotnet format --verify-no-changes
dotnet build TabFlow.sln --configuration Release
dotnet test TabFlow.sln --configuration Release --no-build

npx markdownlint-cli2 "docs/**/*.md"
lychee --no-progress "docs/**/*.md"
```

Passing these locally guarantees the PR checks will pass, barring
environmental differences.

## Related

- [`../meta/contributing.md`](../meta/contributing.md)
- [`../reference/architecture/slos.md`](../reference/architecture/slos.md)
- [`./local-development.md`](./local-development.md)
