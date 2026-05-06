---
phase: quick
plan: 260421-u9n
subsystem: documentation
tags: [docs, agents-md, drift-fix, maintenance]
dependency_graph:
  requires: []
  provides: [accurate-agents-md-documentation]
  affects: [AGENTS.md, src/lib/AGENTS.md]
tech_stack:
  added: []
  patterns: [documentation-sync]
key_files:
  created: []
  modified:
    - AGENTS.md
    - src/lib/AGENTS.md
decisions:
  - "Documentation-only sync — no code changes"
  - "Updated .opencode/ counts to match live filesystem (57 agents, 22 skills, 13 commands)"
  - "Marked lifecycle-manager.ts as STUB in src/lib/AGENTS.md to reflect Phase 14 clean slate"
metrics:
  duration: 344s
  completed: 2026-04-21
  tasks: 2
  files: 2
  drift_items_fixed: 25
---

# Quick Task 260421-u9n: AGENTS.md Drift Fix Summary

Synced both AGENTS.md files to eliminate all 25 documentation drift items against the current codebase state (verified 2026-04-21).

## Changes Made

### Task 1: Root AGENTS.md (17 drift items fixed)

**Commit:** `3508685f`

| # | Change | Section |
|---|--------|---------|
| 1 | Added PTY, WaiterModel delegation, queue-key validation to runtime features | Runtime features |
| 2 | Added `delegation-persistence.ts` to project structure tree | Project Structure |
| 3 | Added `src/shared/` directory (tool-response.ts, tool-helpers.ts) | Project Structure |
| 4 | Added `src/schema-kernel/` directory (index.ts, prompt-enhance.schema.ts) | Project Structure |
| 5 | Updated continuity.ts LOC from ~635 to ~401 | Project Structure |
| 6 | Updated lifecycle-manager.ts LOC from ~500 to ~152, added STUB note | Project Structure |
| 7 | Added `delegation-persistence.ts` dependency rule | Dependency rules |
| 8 | Added "Persist delegation records" row | Where to find things |
| 9 | Added "Change tool response envelope" row | Where to find things |
| 10 | Added "Change prompt-enhance schemas" row | Where to find things |
| 11 | Updated agents count: 6 → 57 with categorized description | OpenCode Integration |
| 12 | Updated skills count: 5 → 22 with categorized description | OpenCode Integration |
| 13 | Updated commands count: 6 → 13 with categorized description | OpenCode Integration |

### Task 2: src/lib/AGENTS.md (8 drift items fixed)

**Commit:** `82572ba9`

| # | Change | Section |
|---|--------|---------|
| 1 | Added `delegation-persistence.ts` row to MODULE RESPONSIBILITIES | MODULE RESPONSIBILITIES |
| 2 | Updated continuity.ts LOC from ~635 to ~401 | MODULE RESPONSIBILITIES |
| 3 | Updated lifecycle-manager.ts to note STUB status at ~152 LOC | MODULE RESPONSIBILITIES |
| 4 | Added `extractSdkErrorMessage` to helpers.ts exports | MODULE RESPONSIBILITIES |
| 5 | Added `delegation-persistence.ts` node to DEPENDENCY GRAPH | DEPENDENCY GRAPH |
| 6 | Added delegation-manager.ts → delegation-persistence.ts dependency | DEPENDENCY GRAPH |
| 7 | Added "Persist / read delegation records" row | WHERE TO LOOK |
| 8 | Updated CODE SMELLS items 1 and 2 for current LOC | CODE SMELLS |

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| `delegation-persistence.ts` in root AGENTS.md | ≥ 2 | 3 | PASS |
| `schema-kernel` in root AGENTS.md | ≥ 1 | 2 | PASS |
| `src/shared/` in root AGENTS.md | ≥ 1 | 1 | PASS |
| `57 agents` in root AGENTS.md | ≥ 1 | 1 | PASS |
| `PTY` in root AGENTS.md | ≥ 1 | 1 | PASS |
| `delegation-persistence.ts` in src/lib/AGENTS.md | ≥ 3 | 4 | PASS |
| `~401` in src/lib/AGENTS.md | ≥ 1 | 1 | PASS |
| `STUB` in src/lib/AGENTS.md | ≥ 1 | 1 | PASS |
| Typecheck (committed code) | Pass | Pass | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Deferred Issues

None.
