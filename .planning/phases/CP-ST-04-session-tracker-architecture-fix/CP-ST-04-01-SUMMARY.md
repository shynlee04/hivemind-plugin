---
phase: CP-ST-04
plan: 01
subsystem: session-tracker
tags: [session-tracker, pending-dispatch-registry, classification, child-session, race-condition]

# Dependency graph
requires:
  - phase: CP-ST-02
    provides: "Three-gate classification system (SDK parentID → HierarchyIndex → PendingDispatchRegistry)"
provides:
  - "PendingDispatchRegistry parent-indexed reverse lookup (byParent map, D-04)"
  - "handleChatMessage classification BEFORE ensureSessionReady (D-05)"
  - "Gate 3 (PendingDispatchRegistry) wired into handleChatMessage classification"
  - "Consistent byParent cleanup across add/remove/removeByCallID/cleanupStale/clear"
affects: [CP-ST-04-02, CP-ST-04-03, session-tracker, event-capture, tool-before-guard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parent-indexed reverse lookup: Map<string, Set<string>> for O(1) broad child detection"
    - "Classification-first guard: classify session as child/main BEFORE any I/O (mkdir/write)"
    - "Conservative broad check: has() returns true when byParent.size > 0 — false positives safe"

key-files:
  created:
    - "tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts — 12 tests for D-04"
  modified:
    - "src/features/session-tracker/persistence/pending-dispatch-registry.ts — byParent index, broad has(), cleanup"
    - "src/features/session-tracker/index.ts — handleChatMessage reorder, Gate 3 integration"
    - "tests/features/session-tracker/index.test.ts — 5 new tests for D-05 classification order"

key-decisions:
  - "D-04: byParent reverse index enables has() to return true when ANY parent has pending dispatches"
  - "D-05: Classification (3 gates) runs BEFORE ensureSessionReady — child sessions never trigger mkdir"
  - "False positives are safe (child → child skips directory); false negatives create orphan directories (the bug)"

patterns-established:
  - "Broad gate pattern: has() returns true for any session when byParent.size > 0 — bounded by 30s STALE_THRESHOLD_MS"
  - "Classify-first pattern: all session classification gates run before any I/O side effect"

requirements-completed: [D-01, D-04, D-05]

# Metrics
duration: 11min
completed: 2026-05-13
---

# Phase CP-ST-04 Plan 01: Fix PendingDispatchRegistry + BEFORE-THE-FACT Classification Summary

**Fixed the PendingDispatchRegistry key mismatch root cause and reordered handleChatMessage to classify BEFORE directory creation, eliminating the primary race condition that created orphan child-session directories.**

## Performance

- **Duration:** ~11 minutes
- **Started:** 2026-05-13T16:41:43Z
- **Completed:** 2026-05-13T16:53:14Z
- **Tasks:** 2 completed
- **Files modified:** 3 source files, 2 test files

## Accomplishments

- **Fixed PendingDispatchRegistry.has()** — added `byParent` reverse index so `has(childID)` returns true when ANY parent has pending dispatches, closing the Gate 3 classification gap that caused orphan directories
- **Fixed handleChatMessage classification order** — moved the three-gate classification (SDK parentID → HierarchyIndex → PendingDispatchRegistry) BEFORE `ensureSessionReady()`, so child sessions never trigger `mkdir`
- **Added Gate 3 to handleChatMessage** — previously only `ensureSessionReady()` and `handleToolExecuteAfter()` checked the pending dispatch registry; `handleChatMessage` now uses all three gates
- **Cleaned up byParent in all mutation paths** — `add()`, `remove()`, `removeByCallID()`, `cleanupStale()`, and `clear()` all maintain the byParent index consistently

## Task Commits

Each task was committed atomically following TDD (RED → GREEN):

1. **Task 1 (RED): test** — `00d5b4ee` — Added 12 failing tests for PendingDispatchRegistry parent-indexed reverse lookup
2. **Task 1 (GREEN): feat** — `5a94a85b` — Added byParent index, broad has(), consistent cleanup across all methods
3. **Task 2 (RED): test** — `7942d504` — Added 5 failing tests for handleChatMessage classification-first ordering
4. **Task 2 (GREEN): feat** — `a65c69df` — Reordered handleChatMessage to classify BEFORE ensureSessionReady, added Gate 3

## Files Created/Modified

- `src/features/session-tracker/persistence/pending-dispatch-registry.ts` — Added `byParent: Map<string, Set<string>>` reverse index; broad `has()` with `byParent.size > 0` check; byParent cleanup in `add()`, `remove()`, `removeByCallID()`, `cleanupStale()`, `clear()`
- `src/features/session-tracker/index.ts` — Reordered `handleChatMessage()`: Gate 1 (SDK) → Gate 2 (HierarchyIndex) → Gate 3 (PendingDispatchRegistry) → only THEN `ensureSessionReady()` for main sessions
- `tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts` — Created: 12 tests covering add, has (empty/any pending/stale/mixed/after re-key), removeByCallID, updateWithChildID, cleanupStale, clear
- `tests/features/session-tracker/index.test.ts` — Added 5 tests: child via SDK parentID, child via HierarchyIndex, child via PendingDispatchRegistry, main session, error handling

## Decisions Made

- **byParent.size > 0 is intentionally broad** — False positives (classifying a main session as child) are safe: they skip directory creation and write to child .json, which is a harmless Noop for main sessions. False negatives (classifying a child as main) create orphan directories — the bug being fixed
- **30s STALE_THRESHOLD_MS bounds the window** — Auto-purge on every `has()` call prevents stale entries from persisting
- **Classification-first is the correct architectural pattern** — Both `handleToolExecuteAfter()` (already fixed in CP-ST-02) and now `handleChatMessage()` classify BEFORE any I/O. `ensureSessionReady()` retains its own internal gates only as defense-in-depth for the main session path

## Deviations from Plan

None — plan executed exactly as written. The `remove()` method was fixed to clean `byParent` as part of the GREEN phase (identified as a gap during test execution) and included in the same commit (`a65c69df`).

## Issues Encountered

- **Pre-existing test failures:** `tests/features/session-tracker/integration/cleanup.test.ts` has 2 pre-existing failures (event-tracker directory removed in CP-ST-03). Confirmed to exist before and after changes — unrelated.
- **remove() byParent cleanup:** The original `remove()` method only cleaned `dispatches` but not `byParent`. This was caught during regression testing of `tool-capture.test.ts` and fixed inline.

## Verification

| Check | Result |
|-------|--------|
| `npx vitest run tests/features/session-tracker/persistence/pending-dispatch-registry.test.ts` | ✅ 12/12 pass |
| `npx vitest run tests/features/session-tracker/index.test.ts` | ✅ 16/16 pass |
| `npx vitest run tests/features/session-tracker/tool-capture.test.ts` | ✅ 9/9 pass (regression fix) |
| Full session-tracker suite | ✅ 288/290 pass (2 pre-existing) |
| TypeScript typecheck (changed files only) | ✅ No errors in changed files |

## Threat Model Compliance

All 4 threat mitigations from the plan's STRIDE register are satisfied:

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-04-01 (Spoofing) | `byParent.size > 0` intentionally broad; 30s STALE_THRESHOLD_MS; `isValidSessionID()` guard | ✅ |
| T-04-02 (DoS) | Map bounded by 30s auto-purge; max entries = concurrent dispatches (<10) | ✅ |
| T-04-03 (Tampering) | parentID resolved via SDK (authoritative) → HierarchyIndex → PendingDispatchRegistry fallbacks | ✅ |
| T-04-04 (Info Disclosure) | Child .json under ROOT main dir with same permissions as main .md | ✅ Accept |
