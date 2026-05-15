---
phase: CP-ST-05
plan: CP-ST-05-01
subsystem: session-tracker
tags: [session-classification, child-sessions, tdd, data-loss-prevention]
dependencies:
  requires: [CP-ST-05-RESEARCH, CP-ST-05-SPEC]
  provides: [Gate-0-classification, immediate-child-json-write, journey-tracking]
  affects: [event-capture, pending-dispatch-registry, child-writer]
tech-stack:
  added: [PreToolUse hook, PendingDispatchRegistry.getAnyActiveEntry, JourneyEntry interface]
key-files:
  created:
    - src/features/session-tracker/hooks/session-classification-hook.ts
    - tests/features/session-tracker/hooks/session-classification-hook.test.ts
    - tests/features/session-tracker/capture/event-capture-classification-first.test.ts
    - tests/features/session-tracker/persistence/child-writer-depth-journey.test.ts
  modified:
    - src/features/session-tracker/capture/event-capture.ts
    - src/features/session-tracker/persistence/pending-dispatch-registry.ts
    - src/features/session-tracker/types.ts
    - tests/features/session-tracker/capture/event-capture.test.ts
decisions:
  - "Gate 0 uses getAnyActiveEntry() to classify before any async SDK calls"
  - "JourneyEntry array added to ChildSessionRecord for tool call tracking (R-CP05-03)"
  - "delegationDepth propagated from dispatch context to child .json metadata"
metrics:
  duration: "~45 minutes"
  completed: "2026-05-15"
  tasks_completed: 3
  tasks_total: 3
  tests_added: 11
  tests_total_passing: 30
---

# Phase CP-ST-05 Plan 01: BEFORE-THE-FACT Classification + Immediate .json Write Summary

**One-liner:** PreToolUse intercept hook for BEFORE-THE-FACT child session classification with immediate `.json` write to prevent orphan directory creation and session journey data loss.

## Objective

Fix the root cause of child session misclassification as MAIN by intercepting Task tool dispatches before child session creation, recording classification in PendingDispatchRegistry, and using it as Gate 0 in `handleSessionCreated()` — bypassing all race conditions.

## Tasks Executed

### Task 1: PreToolUse Classification Hook (TDD — RED/GREEN/REFACTOR)
- **Commit:** `6920449c`
- **Created:** `src/features/session-tracker/hooks/session-classification-hook.ts`
- **Created:** `tests/features/session-tracker/hooks/session-classification-hook.test.ts`
- Intercepts `Tool:Task` calls, extracts `sessionId` from context, checks `delegatedBy` metadata
- Records classification as `PendingDispatchEntry` with `sessionId`, `parentSessionId`, `delegationDepth`, `description`
- 5 tests: Tool:Task intercept, non-Task pass-through, delegatedBy extraction, entry recording, classification retrieval

### Task 2: Gate 0 in handleSessionCreated (TDD — RED/GREEN/REFACTOR)
- **Commit:** `6920449c`
- **Modified:** `src/features/session-tracker/capture/event-capture.ts`
- **Created:** `tests/features/session-tracker/capture/event-capture-classification-first.test.ts`
- Added Gate 0: `this.pendingRegistry?.getAnyActiveEntry()` before any async SDK calls
- If entry found: route to `writeImmediateChildFile()` with parentID from registry
- If no entry: fall through to existing Gates 1-3 (SDK, HierarchyIndex, PendingDispatchRegistry.has)
- 3 tests: Gate 0 intercept, Gate 0 miss fallback, entry parentID propagation

### Task 3: Extend ChildSessionRecord with delegationDepth + Journey (TDD — RED/GREEN/REFACTOR)
- **Commit:** `6920449c`
- **Modified:** `src/features/session-tracker/types.ts` — Added `JourneyEntry` interface, `journey` to `ChildSessionRecord`
- **Modified:** `src/features/session-tracker/persistence/pending-dispatch-registry.ts` — Added `delegationDepth`, `description` to `PendingDispatchEntry`, `getAnyActiveEntry()`, `getAll()`
- **Created:** `tests/features/session-tracker/persistence/child-writer-depth-journey.test.ts`
- 3 tests: delegationDepth persistence, journey array serialization, round-trip read/write

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test Bug] Fixed existing event-capture.test.ts mocks**
- **Found during:** Task 2 verification
- **Issue:** Existing test mocks for `pendingRegistry` only had `has()` and `get()` methods. Gate 0 now calls `getAnyActiveEntry()` which doesn't exist on the mock → throws TypeError caught by try/catch → no assertions pass
- **Fix:** Added `getAnyActiveEntry: vi.fn().mockReturnValue(undefined)` to both `pendingRegistry` mock setups in `event-capture.test.ts` (lines 266-270 and 432-436)
- **Files modified:** `tests/features/session-tracker/capture/event-capture.test.ts`
- **Commit:** `6920449c`

## Verification Results

- **TypeScript compilation:** `npm run typecheck` — PASSED (0 errors)
- **CP-ST-05-01 tests:** 30/30 PASSED
  - `session-classification-hook.test.ts`: 5/5
  - `event-capture-classification-first.test.ts`: 3/3
  - `child-writer-depth-journey.test.ts`: 3/3
  - `event-capture.test.ts`: 19/19 (after Rule 1 mock fix)
- **Pre-existing failures:** 2 tests in `cleanup.test.ts` (legacy cleanup, unrelated to this plan)

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag:tool-intercept | `session-classification-hook.ts` | New PreToolUse hook intercepts all Task tool calls — must not block or slow dispatch |
| threat_flag:state-mutation | `pending-dispatch-registry.ts` | getAnyActiveEntry() reads mutable in-memory state — cleanup of stale entries needed to prevent memory leaks |

## Known Stubs

- `journey` array is written to `.json` but not yet populated with actual tool call results — tracked for R-CP05-03 implementation in a future plan
- `delegationDepth` is recorded but not yet used for depth-based classification heuristics — tracked for future enhancement

## Self-Check: PASSED

- All 4 source files exist: `session-classification-hook.ts`, `event-capture.ts`, `pending-dispatch-registry.ts`, `types.ts`
- All 4 test files exist: `session-classification-hook.test.ts`, `event-capture-classification-first.test.ts`, `child-writer-depth-journey.test.ts`, `event-capture.test.ts`
- Commit `6920449c` verified in git log
