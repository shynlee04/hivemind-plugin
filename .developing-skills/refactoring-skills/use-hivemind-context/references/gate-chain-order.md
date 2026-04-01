# Gate Chain Order

## Why This Order Matters

The gate chain follows a dependency hierarchy:

1. **project-contracts** — Everything depends on valid package.json
2. **project-dependencies** — Can't build/test without deps installed
3. **project-sdk-surface** — Specifically need OpenCode SDK for this project
4. **project-build** — TypeScript must compile before we trust code
5. **project-tests** — Behavior must pass before the state can be trusted
6. **git-branch-state** — Clean tree required before claiming a stable checkpoint
7. **planning-exists** — If the project uses `.planning/`, verify that the planning surface exists
8. **planning-health** — If `.planning/` is in scope, verify the expected planning docs
9. **planning-consistency** — If `.planning/` is in scope, verify plan files match disk state

Layers 1, 3, and 4 are the closest thing to universal repository proof. Planning gates are internal project-policy checks and should not be mistaken for SDK/API evidence.

## Failure Cascade

If `project-dependencies` fails:
- Cannot run `project-build` (would fail anyway)
- Cannot run `project-tests` (would fail anyway)
- The chain stops immediately and reports the blocking gate

If planning gates fail in a project that does not use the `.planning/` convention:
- Treat the result as project-specific context, not universal proof of repository health
- Prefer `landscape` or run Layers 1, 3, and 4 individually

## Soft Gates

Architecture gates run AFTER the hard chain but do NOT block. They report warnings:
- `arch src-domains` — Reports LOC/files/exports per domain
- `arch dead-exports` — Warns about unused exports
- `arch circular-deps` — Warns about circular imports

These inform decisions but never block completion.

## Failure Handling

When `gate-chain` fails:
1. Gate failure is detected
2. The chain stops at that gate
3. `delegation_trigger` may be included in JSON output
4. Report the failure with JSON evidence
5. Choose next steps based on which layer failed and whether the gate is universal or project-specific
