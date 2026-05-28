---
phase: C4-Performance-Optimization
plan: 01
subsystem: coordination/completion
tags: [test, pruneStaleTimers, tdd, red-phase]
requires: []
provides: [detector-stability-prune.test.ts]
affects: [src/coordination/completion/detector.ts]
tech-stack:
  added: []
  patterns: [vitest-fake-timers, private-field-bracket-access]
key-files:
  created:
    - tests/coordination/completion/detector-stability-prune.test.ts
    - tests/coordination/completion/.gitkeep
  modified: []
decisions:
  - "Test file uses bracket notation (detector['timerStartTimes']) for private field access, matching existing detector-v2.test.ts pattern"
  - "Fake timers via vi.useFakeTimers() for deterministic timer age control"
  - "afterEach hook calls vi.useRealTimers() to clean up fake timer state"
metrics:
  duration: ~2 minutes
  completed: 2026-05-28
  tasks-completed: 1/1
  files-created: 2
  files-modified: 0
---

# Phase C4 Plan 01: Test Scaffold for pruneStaleTimers Summary

Created test scaffold `tests/coordination/completion/detector-stability-prune.test.ts` with 4 test cases covering the full pruneStaleTimers contract from REQ-03.

## One-liner

TDD RED phase: test file for `pruneStaleTimers(maxAgeMs)` with all-stale, nothing-stale, empty-Maps, and partial-prune scenarios — fails until Wave 1 implementation.

## Execution

| Task | Name | Status | Commit | Files |
|------|------|--------|--------|-------|
| 1 | Create test file for pruneStaleTimers | ✅ Done | b62b9da5 | `tests/coordination/completion/detector-stability-prune.test.ts`, `.gitkeep` |

### Task 1 Detail

**Action:** Created `tests/coordination/completion/detector-stability-prune.test.ts` with 4 test cases:
1. **pruneStaleTimers(0) with 3 stale timers** → expects pruned=3, all Maps empty
2. **pruneStaleTimers(120_000) with recent timers** → expects pruned=0, all Maps unchanged
3. **pruneStaleTimers(5000) on empty detector** → expects pruned=0, no errors
4. **pruneStaleTimers(3000) with mixed-age timers** → expects pruned=2, only session-2 remains

## Verification

Tests **fail** as expected (TDD RED phase) — `timerStartTimes` field and `pruneStaleTimers` method don't exist yet on `CompletionDetector`. Implementation will be added in Wave 1 (C4-02).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] Test file exists at `tests/coordination/completion/detector-stability-prune.test.ts`
- [x] 4 test cases defined covering all acceptance criteria
- [x] Commit exists: b62b9da5
