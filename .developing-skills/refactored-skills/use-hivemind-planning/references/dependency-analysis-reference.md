# Dependency Analysis Reference

## Dependency Types

| Type | Meaning | Planning Impact |
| --- | --- | --- |
| hard | Slice B cannot start before Slice A | sequential only |
| soft | Slice B prefers A first but can proceed with caution | parallel possible with review gate |
| peer | Shared contract or shared file | coordinate or isolate first |
| dev | Tooling/test-only dependency | impacts verification, not business logic |

## IF/THEN Rules

1. **IF** two slices edit the same file, **THEN** mark as `peer` and run sequentially.
2. **IF** one slice creates a contract consumed by another, **THEN** mark as `hard`.
3. **IF** only tests or tooling connect the slices, **THEN** mark as `dev`.
4. **IF** uncertainty remains after grep/glob, **THEN** escalate to `hivemind-codemap` or LSP proof before parallelizing.

## Minimal Workflow

1. `glob` candidate files.
2. `grep` imports, type references, or config usage.
3. `lsp.findReferences` when semantic proof matters.
4. Build the graph before assigning parallel waves.
