# Gate Chain Order

## Why This Order Matters

The gate chain follows a dependency hierarchy:

1. **project-contracts** — Everything depends on valid package.json
2. **project-dependencies** — Can't build/test without deps installed
3. **project-sdk-surface** — Specifically need OpenCode SDK for this project
4. **project-build** — TypeScript must compile before we trust code
5. **planning-exists** — Planning is required for structured work
6. **planning-health** — Planning docs must be present
7. **planning-consistency** — Planning must match disk state
8. **git-branch-state** — Clean tree required for valid commits

## Failure Cascade

If `project-dependencies` fails:
- Cannot run `project-build` (would fail anyway)
- Cannot run `project-tests` (would fail anyway)
- Planning gates still run (independent of build)
- Git gates still run (independent of build)

## Soft Gates

Architecture gates run AFTER the hard chain but do NOT block. They report warnings:
- `arch src-domains` — Reports LOC/files/exports per domain
- `arch dead-exports` — Warns about unused exports
- `arch circular-deps` — Warns about circular imports

These inform decisions but never block completion.

## Delegation Protocol

When `gate-chain` fails:
1. Gate failure is detected
2. `delegation_trigger` is included in JSON output
3. Agent reports failure to user with evidence
4. Agent awaits user instruction
5. Agent does NOT proceed past failure autonomously
