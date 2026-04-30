---
phase: 16.4.1-branch-strategy-resolution
priority: P2
status: pending
created: 2026-04-30
driver_audit: delegation-async-pty-lifecycle-audit-2026-04-30
driver_finding: 7
amends: 16.4
depends_on: [16.2.1-pty-subsystem-detox]
blocks: [53-release-readiness-and-lifecycle-gate-closure]
gsd_agents: [gsd-doc-writer]
requirements: [BRANCH-STRATEGY-01]
---

# Phase 16.4.1: Branch Strategy Resolution

## Goal

Make `feature/harness-implementation` (the v3 runtime engine) the canonical default branch and archive the legacy v2.x snapshot currently sitting on `master`. End the "two divergent codebases" framing introduced by the audit's Finding 7.

## Validation Source

Generated from `AUDIT-VALIDATION-2026-04-30.md` Finding 7 (VALIDATED but inverted). Evidence on disk:

- `master`: 56 test files, older v2.x harness baseline (`hivemind-plugin`)
- `feature/harness-implementation`: 84 test files, 1,414 specs, full v3 runtime composition engine (`opencode-harness@0.1.0`)
- Branches diverged ~2026-04-08 with the v3 rebuild
- All recent product work, planning, and runtime tests live on `feature/harness-implementation`

The audit's recommendation to "delete worktree duplicates and port tests to main" inverts reality: the worktree IS the product, master is the legacy snapshot.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| BRANCH-STRATEGY-01 | A documented decision MUST be recorded under `.planning/decisions/ADR-2026-04-30-branch-strategy.md` choosing one of: (A) force-push `feature/harness-implementation` to `master` after tagging legacy as `legacy/v2.x-baseline`, OR (B) rename `feature/harness-implementation` → `main` and rename current `master` → `legacy/v2.x`. CI default branch and README/`package.json#repository.directory` MUST be updated accordingly. | Validation override |

## Scope

- `.planning/decisions/ADR-2026-04-30-branch-strategy.md` (new file — record the decision)
- `README.md`, `package.json`, `.github/workflows/*.yml` (update once decision is enacted)
- GitHub default-branch setting (manual, requires admin)

## Out of Scope

- Code merges between branches. Decision is "which branch wins", not "merge them".
- Renaming the npm package.

## Constraints

- Decision MUST be recorded BEFORE any branch operations are performed.
- Branch operations require user/maintainer authorization — Devin scaffolds the ADR; user enacts the strategy.
- Phase 16.2.1 should land first so the canonical branch is install-clean on Node before it becomes default.
