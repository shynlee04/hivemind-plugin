---
phase: 16.2.1-pty-subsystem-detox
priority: P0
status: pending
created: 2026-04-30
driver_audit: delegation-async-pty-lifecycle-audit-2026-04-30
driver_finding: 1
amends: 16.2
depends_on: []
blocks: [49-uat-tool-contract-and-pty-command-reliability, 16.4.1-branch-strategy-resolution, 48.4.1-node-20-green-bar-coverage]
gsd_agents: [gsd-executor, gsd-code-reviewer, gsd-verifier]
requirements: [R-PTY-01-AMENDED, R-PTY-02-AMENDED, R-PTY-03-AMENDED]
---

# Phase 16.2.1: PTY Subsystem Detox

## Goal

Make the harness installable and runnable on Node 20 without `bun-pty` resolving at module level or at install time. Reduce `run-background-command` to the action set actually supported on Node, and document PTY non-resumability honestly.

## Validation Source

This phase is generated from the `AUDIT-VALIDATION-2026-04-30.md` validation pass. Original audit Finding 1 was confirmed structurally (`pty-manager.ts:1` does import `bun-pty` at module level; `bun-pty` lives in `dependencies`, not `optionalDependencies`), with one caveat: the dynamic-import try/catch in `pty-runtime.ts:14–20` does swallow the resolution error at runtime, so the harness does not actually crash on Node — but `npm install` postinstall failures and three dead tool actions remain real.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| R-PTY-01-AMENDED | Move `bun-pty` from `dependencies` to `optionalDependencies` in `package.json`, OR remove the dependency entirely if Option A is chosen | 16.2-AUDIT-AMENDMENT-2026-04-30.md §R-PTY-01-AMENDED |
| R-PTY-02-AMENDED | Drop or gate `output`, `input`, `terminate` actions in `run-background-command`. Keep only `run` (headless `child_process.spawn`) as the default code path | 16.2-AUDIT-AMENDMENT-2026-04-30.md §R-PTY-02-AMENDED |
| R-PTY-03-AMENDED | Make `recoverPtyDelegation` return `terminalState: "error", terminalReason: "non-resumable-after-restart"` instead of attempting reconnection | 16.2-AUDIT-AMENDMENT-2026-04-30.md §R-PTY-03-AMENDED |

## Decision Required (Pre-Plan)

Before `01-PLAN.md` is authored, the phase owner must lock one option:

- **Option A** (recommended): Remove PTY entirely. Delete `src/lib/pty/`, drop `bun-pty`, simplify `run-background-command` to a single `run` action.
- **Option B**: Keep PTY as opt-in. Move `bun-pty` to `optionalDependencies`, require an explicit `pty: true` flag at tool-call time, and document that the feature is Bun-only.
- **Option C**: Replace `bun-pty` with `node-pty`. Keep all four actions; `node-pty` is cross-platform but adds a native build step on `npm install`.

## Scope

- `package.json` (deps + engines)
- `src/lib/pty/pty-manager.ts` (delete or rewrite under chosen option)
- `src/lib/pty/pty-runtime.ts`
- `src/lib/command-delegation.ts:126–143` (recovery path)
- `src/tools/run-background-command.ts` (action set)
- Tests:
  - `tests/lib/command-delegation.test.ts` — extend with `non-resumable-after-restart` assertion
  - `tests/tools/run-background-command.test.ts` — extend with absent-PTY graceful path

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| R-PTY-01-AMENDED | gsd-executor | hm-refactor + hm-test-driven-execution |
| R-PTY-02-AMENDED | gsd-executor | hm-refactor |
| R-PTY-03-AMENDED | gsd-executor | hm-test-driven-execution |
| All | gsd-code-reviewer | hm-code-review |
| All | gsd-verifier | gsd-verify-work |

## Key Files

- `package.json` — dependency reclassification
- `src/lib/pty/pty-manager.ts` — module-level `import { spawn } from "bun-pty"` is the root cause
- `src/lib/pty/pty-runtime.ts` — try/catch boundary
- `src/lib/command-delegation.ts` — recovery
- `src/tools/run-background-command.ts` — tool surface

## Tech Compliance

- Node.js >= 20.0.0 — primary target runtime
- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- `[Harness]` prefix on all thrown errors
- No circular dependencies after PTY removal

## Constraints

- RED-first TDD for all changes (write failing test, then make it green)
- Atomic scoped commits per requirement
- Full test suite must pass on Node 20 after each commit
- Do not break `tests/lib/command-delegation.test.ts` headless cases that already exist (538 LOC)
