---
phase: HER-2
plan: "02"
subsystem: notification-handler, plugin-composition
tags: [dead-code, boundary-violation, plugin-wiring, auto-loop, ralph-loop]
requires: [HER-2-01]
provides: [HER-2-C, HER-2-D]
affects: [src/plugin.ts, src/lib/notification-handler.ts, src/hooks/create-core-hooks.ts, src/hooks/types.ts]
tech-stack:
  added: []
  patterns: [pure-di-orchestrator, deps-bundle-injection]
key-files:
  created: []
  modified:
    - src/plugin.ts
    - src/lib/notification-handler.ts
    - src/hooks/create-core-hooks.ts
    - src/hooks/types.ts
    - tests/lib/notification-handler.test.ts
decisions:
  - "Auto-loop and ralph-loop wired via deps bundle (not as tools) for future tool/hook consumption"
  - "Removed buildTaskNotificationFromContinuity and its 6 tests — zero production callers"
  - "Type-only imports omitted from plugin.ts to satisfy noUnusedLocals; types available via types.ts"
metrics:
  duration_seconds: 453
  completed_date: "2026-05-05"
---

# Phase HER-2 Plan 02: Wire auto-loop + ralph-loop, fix notification-handler Summary

Auto-loop and ralph-loop pure DI orchestrators wired into plugin.ts deps bundle for future tool/hook consumption. Notification-handler boundary violations fixed: stale comment corrected in create-core-hooks.ts and unused export `buildTaskNotificationFromContinuity` removed.

## Tasks

### Task 1: Fix notification-handler boundary violations (D-07, D-08)

**Commit:** `ff3b2558`

**D-06:** No change needed — notification-handler.ts already has correct "Re-activated in Phase 16.2" header (0 occurrences of "DEPRECATED").

**D-07:** Fixed stale comment in `src/hooks/create-core-hooks.ts` line 8. Changed from "notification-handler, messages-transform removed (dead code)" to "messages-transform removed (dead code). Notification-handler re-activated in Phase 16.2."

**D-08:** Removed `buildTaskNotificationFromContinuity` function (51 lines) from `src/lib/notification-handler.ts`. This function had zero production callers. Also removed its 6 associated tests in `tests/lib/notification-handler.test.ts` and cleaned up the now-unused `SessionContinuityRecord` import.

**D-09:** Verified all critical exports remain: `notifyDelegationTerminal`, `replayPendingNotifications`, `buildNotificationMessage`, `formatToastMessage`, `notifyParentSession`, and `TaskNotification` type.

### Task 2: Wire auto-loop and ralph-loop in plugin.ts (D-01, D-02, D-03)

**Commit:** `86e72b5e`

**D-01:** Wired both loop primitives as runtime features in `src/plugin.ts`.

**D-02:** Imported `runAutoLoop` from `src/lib/auto-loop.ts` (146 LOC pure async DI orchestrator for self-referential dev loops).

**D-03:** Imported `runRalphLoop` and `escalationMessage` from `src/lib/ralph-loop.ts` (182 LOC pure async DI orchestrator for validate-fix-redispatch cycles).

Both primitives were added to the `deps` bundle and the `HookDependencies` interface in `src/hooks/types.ts` was extended with optional generic call signatures for `runAutoLoop`, `runRalphLoop`, and `escalationMessage`.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ 0 errors |
| `npm run build` | ✅ Pass |
| `npm test` | ✅ 1604/1606 passing (2 pre-existing failures) |
| `grep "auto-loop\|ralph-loop" src/plugin.ts` | ✅ 2 matches |
| `grep "DEPRECATED" src/lib/notification-handler.ts` | ✅ 0 matches |
| `grep "buildTaskNotificationFromContinuity" src/lib/notification-handler.ts` | ✅ 0 matches |
| `notifyDelegationTerminal` still exported | ✅ |
| `replayPendingNotifications` still exported | ✅ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed dead tests for buildTaskNotificationFromContinuity**
- **Found during:** Task 1
- **Issue:** After removing `buildTaskNotificationFromContinuity`, 6 tests in `tests/lib/notification-handler.test.ts` failed because the function no longer exists.
- **Fix:** Removed the `buildTaskNotificationFromContinuity` describe block (97 lines) and cleaned up unused imports (`buildTaskNotificationFromContinuity`, `SessionContinuityRecord`).
- **Files modified:** `tests/lib/notification-handler.test.ts`
- **Commit:** `ff3b2558`

**2. [Rule 3 - Blocking] Removed unused type imports from plugin.ts**
- **Found during:** Task 2
- **Issue:** `noUnusedLocals` flagged `AutoLoopOptions`, `AutoLoopResult`, `AutoLoopVerification`, `RalphLoopOptions`, `RalphLoopResult`, `RalphValidation` as unused in `src/plugin.ts` (only values `runAutoLoop`, `runRalphLoop`, `escalationMessage` are used at the composition level).
- **Fix:** Reduced imports to value-only: `import { runAutoLoop }` and `import { runRalphLoop, escalationMessage }`. Types remain importable from `src/hooks/types.ts` where they are actually used.
- **Files modified:** `src/plugin.ts`
- **Commit:** `86e72b5e`

## Known Stubs

None — all changes are surgical edits to existing production code. No placeholder values, no TODO/FIXME markers introduced.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. Changes are internal refactoring (removing dead code, fixing comments, wiring existing pure functions into a dependency bundle).
