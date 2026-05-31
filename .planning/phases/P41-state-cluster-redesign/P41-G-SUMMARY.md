---
phase: P41-G
plan: P41-G
subsystem: session-tracker/persistence
tags: [bugfix, ENOENT, TUI-leak, child-writer]
requires: []
provides: [REQ-P41G-01, REQ-P41G-02, REQ-P41G-03, REQ-P41G-04, REQ-P41G-05]
affects: [src/features/session-tracker/persistence/child-writer.ts, tests/features/session-tracker/persistence/child-writer.test.ts]
tech-stack:
  added: []
  patterns: [try-catch-guard, enoent-suppression]
key-files:
  created: []
  modified:
    - src/features/session-tracker/persistence/child-writer.ts
    - tests/features/session-tracker/persistence/child-writer.test.ts
decisions: []
metrics:
  duration: 6m
  completed_date: 2026-05-31
---

# Phase P41-G: Fix ChildWriter ENOENT/TUI Leak Summary

**One-liner:** Three ChildWriter methods (`updateChildStatus`, `appendChildTurn`, `appendJourneyEntry`) now wrap `readChildFile()` in try-catch to prevent ENOENT propagation through `enqueueWrite`'s `console.warn` catch handler, following the established pattern from `backfillChildMetadata` and `backfillChildTurns`. The `enqueueWrite` catch handler additionally suppresses `console.warn` for ENOENT errors as a safety net.

## Requirements Coverage

| Req | Description | Status | Evidence |
|-----|-------------|--------|----------|
| REQ-P41G-01 | `updateChildStatus` wraps `readChildFile` in try-catch, ENOENT → silent return | ✅ | `child-writer.ts:459-465` |
| REQ-P41G-02 | `appendChildTurn` wraps `readChildFile` in try-catch, ENOENT → silent return | ✅ | `child-writer.ts:502-508` |
| REQ-P41G-03 | `appendJourneyEntry` wraps `readChildFile` in try-catch, ENOENT → silent return | ✅ | `child-writer.ts:557-563` |
| REQ-P41G-04 | `enqueueWrite` catch handler suppresses `console.warn` for ENOENT errors | ✅ | `child-writer.ts:230-232` |
| REQ-P41G-05 | 3000+ tests pass, typecheck clean | ✅ | 3003/3009 pass (4 pre-existing failures); `npm run typecheck` clean |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test expected ENOENT throw, now expects silent no-op**
- **Found during:** Test run after code changes
- **Issue:** Test at `child-writer.test.ts:205-211` expected `updateChildStatus` to throw ENOENT for non-existent child file. After adding try-catch, the method silently returns instead.
- **Fix:** Updated test to expect `.resolves.toBeUndefined()` instead of `.rejects.toThrow(/ENOENT/)`
- **Files modified:** `tests/features/session-tracker/persistence/child-writer.test.ts`
- **Commit:** `5e62de14`

## Execution Log

1. Read `child-writer.ts` (658 lines) and research report `childwriter-enoent-report-2026-05-31.md`
2. Applied try-catch guard to `updateChildStatus` (Task 1)
3. Applied try-catch guard to `appendChildTurn` (Task 2)
4. Applied try-catch guard to `appendJourneyEntry` (Task 3)
5. Suppressed `console.warn` for ENOENT in `enqueueWrite` catch handler (Task 4)
6. Updated JSDoc `@throws` annotations for all 3 methods
7. Committed code changes: `b912d716`
8. Ran typecheck (clean) and full test suite (3001 passed, 6 failed)
9. Found 1 test failure caused by change — updated test expectation
10. Committed test fix: `5e62de14`
11. Re-ran child-writer tests (28/28 pass) and full suite (3003 passed, 4 pre-existing failures)

## Verification

- `npm run typecheck` — ✅ PASS (clean)
- `npm test` — ✅ 3003/3009 pass | 2 skipped | 4 pre-existing failures in `session-journal-export.test.ts` and `delegation-status.test.ts`
- `npx vitest run tests/features/session-tracker/persistence/child-writer.test.ts` — ✅ 28/28 pass

## Known Stubs

None.

## Threat Flags

None — changes are local to error handling paths; no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- ✅ `src/features/session-tracker/persistence/child-writer.ts` — modified and committed
- ✅ `tests/features/session-tracker/persistence/child-writer.test.ts` — modified and committed
- ✅ Commit `b912d716` exists
- ✅ Commit `5e62de14` exists
- ✅ Typecheck clean
- ✅ 28/28 child-writer tests pass
