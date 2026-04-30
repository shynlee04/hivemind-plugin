---
phase: 48.4.1-node-20-green-bar-coverage
priority: P2
status: pending
created: 2026-04-30
driver_audit: delegation-async-pty-lifecycle-audit-2026-04-30
driver_finding: 4
amends: 48.4
supersedes_amendment_status: false
depends_on: [16.2.1-pty-subsystem-detox, 36.1-completion-detector-rewiring, 46.1-always-background-truth-reset]
blocks: [49-uat-tool-contract-and-pty-command-reliability, 53-release-readiness-and-lifecycle-gate-closure]
gsd_agents: [gsd-executor, gsd-verifier]
requirements: [TEST-NODE-20-01, COVERAGE-DELEG-01]
---

# Phase 48.4.1: Test Suite Green-Bar on Node 20 + Coverage

## Goal

Verify the existing 1,414-spec test corpus passes on Node 20 (the actual deployment target) and produce per-module coverage for the delegation subsystem. This phase replaces the audit's "add 50+ tests" amendment, which was based on an inaccurate assertion that the worktree had zero tests.

## Validation Source

Generated from `AUDIT-VALIDATION-AND-REMEDIATION-PLAN-2026-04-30.md` Finding 4 (REFUTED). Evidence on disk:

- 84 test files under `tests/` (vs 56 on master)
- 1,414 specs (`grep -rE "^\s*(it|test|describe)\(" tests --include="*.test.ts" | wc -l`)
- 6,417 LOC of delegation tests across 9 files (`tests/lib/delegation-manager.test.ts` alone is 3,193 LOC)

The real risk is not absence of coverage — it is that the corpus has not been verified to pass on Node 20 in CI, and per-module coverage numbers are not published.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| TEST-NODE-20-01 | CI matrix MUST run `npm test` on Node 20.x with no Bun installed. Suite MUST be green. | Validation override |
| COVERAGE-DELEG-01 | Per-module line coverage MUST be ≥ 80% for `src/lib/delegation-manager.ts`, `src/lib/sdk-delegation.ts`, `src/lib/command-delegation.ts`, `src/lib/completion-detector.ts`. Coverage report committed under this phase directory. | Validation override |

## Scope

- `.github/workflows/*.yml` — Node 20 matrix
- `vitest.config.ts` (if present) — coverage thresholds
- `package.json` — engines field, scripts
- This phase directory — coverage HTML/JSON output

## Constraints

- Do NOT mass-add tests to inflate coverage. If a real gap is discovered, port the missing scenario from the main-repo test corpus or write a single targeted spec.
- The phase is BLOCKED until 16.2.1 (PTY detox) and 36.1 (CompletionDetector re-wiring) land — testing on Node 20 with `bun-pty` in `dependencies` will fail at install time.

## Tech Compliance

- Node.js >= 20.0.0
- Vitest 4.x with `@vitest/coverage-v8`
- Coverage thresholds enforced in `vitest.config.ts`

## Out of Scope

- Adding 50+ "fresh" delegation tests (the audit amendment's prescription) — refuted; coverage already exists.
- Migrating tests from Vitest to another runner.
