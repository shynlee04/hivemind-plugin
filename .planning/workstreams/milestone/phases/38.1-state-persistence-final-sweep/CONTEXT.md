---
phase: 38.1-state-persistence-final-sweep
priority: P3
status: pending
created: 2026-04-30
driver_audit: delegation-async-pty-lifecycle-audit-2026-04-30
driver_finding: 5
amends: 38
supersedes_amendment_status: false
depends_on: []
blocks: [66-recovery-engine-implementation]
gsd_agents: [gsd-executor, gsd-verifier]
requirements: [HIVEMIND-ROOT-08, FRESH-INSTALL-RECOVERY-01]
---

# Phase 38.1: State Persistence Final Sweep

## Goal

Close the small residual gap from the audit's Finding 5: decide what to do with the empty `.hivemind/state/brain.json` artifact, and add a regression test that verifies state files appear on a fresh install.

## Validation Source

Generated from `AUDIT-VALIDATION-2026-04-30.md` Finding 5 (REFUTED). Evidence on disk:

- `.hivemind/state/session-continuity.json` — EXISTS, valid JSON, contains real recovered session data
- `.hivemind/state/delegations.json` — EXISTS, valid JSON array with real delegation records (including `gracePeriodExpiresAt`, `executionMode`, `queueKey`)

The audit's HIVEMIND-ROOT-04/05/06 amendment items are already covered by existing `continuity.ts` + `delegation-persistence.ts` behavior. Only HIVEMIND-ROOT-08 (`brain.json` populate-vs-delete) remains open, plus a fresh-install regression test that did not previously exist.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| HIVEMIND-ROOT-08 | `.hivemind/state/brain.json` MUST either contain real, schema-valid data or be removed (and the code path that may write it deleted). Empty skeleton is not acceptable. | 38-AUDIT-AMENDMENT-2026-04-30.md §HIVEMIND-ROOT-08 |
| FRESH-INSTALL-RECOVERY-01 | A test MUST verify: starting from an absent `.hivemind/` directory, after plugin init + first delegation, both `session-continuity.json` and `delegations.json` exist and are valid JSON. | New (validation) |

## Scope

- `.hivemind/state/brain.json` — populate or delete
- Any code that references `brain.json` (delete if file is removed)
- `tests/lib/continuity.test.ts` — add fresh-install case

## Out of Scope

- HIVEMIND-ROOT-04, -05, -06, -07 from the original amendment — they describe behaviors that already exist; verify but do NOT re-implement.

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| HIVEMIND-ROOT-08 | gsd-executor | hm-refactor |
| FRESH-INSTALL-RECOVERY-01 | gsd-executor | hm-test-driven-execution |

## Tech Compliance

- TypeScript strict mode
- Tests must clean up `.hivemind/` after themselves (use a temp dir + `OPENCODE_HARNESS_STATE_DIR`)
- No leakage between test files
