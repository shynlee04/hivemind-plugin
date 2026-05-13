---
phase: CP-ST-02-session-tracker-deep-fix-remaining
plan: "01"
subsystem: session-tracker
tags: [pending-dispatch-registry, three-gate-classification, race-condition, child-session, gate-3]

# Dependency graph
requires:
  - phase: CP-ST-01-session-tracker-revamp
    provides: SessionTracker with dual-gate classification, HierarchyIndex, EventCapture
provides:
  - PendingDispatchRegistry in-memory class with add/has/get/remove/cleanupStale
  - Gate 3 classification in SessionTracker.ensureSessionReady()
  - Gate 3 classification in EventCapture.handleSessionCreated()
  - Gate 3 fallback in EventCapture idle/deleted/error handlers
  - ToolCapture plumbing for Plan 02-03 delegator attribution
affects: [CP-ST-02-02, CP-ST-02-03, session-tracker-classification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Three-gate classification order: SDK parentID then HierarchyIndex then PendingDispatchRegistry then MAIN
    - callID-based temporary keying for pre-discovery window in PendingDispatchRegistry
    - 30s stale auto-purge on every has()/get() call
    - effectiveParentID fallback pattern when Gate 3 fires but SDK parentID is null

key-files:
  created:
    - src/features/session-tracker/persistence/pending-dispatch-registry.ts
  modified:
    - src/features/session-tracker/index.ts
    - src/features/session-tracker/capture/event-capture.ts
    - src/features/session-tracker/capture/tool-capture.ts

key-decisions:
  - callID used as temporary key in PendingDispatchRegistry because child session ID is unknown at PreToolUse time
  - pendingRegistry wired as optional field in EventCapture and ToolCapture constructors (maintains backward compatibility)
  - effectiveParentID resolved from pendingRegistry entry when Gate 3 fires but SDK parentID is null

patterns-established:
  - Three-gate classification: SDK parentID (Gate 1) then HierarchyIndex.isChild() (Gate 2) then PendingDispatchRegistry.has() (Gate 3) before MAIN fallback
  - effectiveParentID pattern: parentID ?? this.pendingRegistry?.get(sessionID)?.parentSessionID

requirements-completed: [AC-02, AC-05]

# Metrics
duration: 12 min
completed: 2026-05-13
---

# Phase CP-ST-02 Plan 01: PendingDispatchRegistry + Three-Gate Classification Summary

**PendingDispatchRegistry class created and three-gate classification wired into SessionTracker, EventCapture, and ToolCapture to close the orphan-directory race condition for child sessions.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-13T12:52:03Z
- **Completed:** 2026-05-13T13:04:07Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created PendingDispatchRegistry class (222 LOC) with add/has/get/remove/removeByCallID/updateWithChildID/cleanupStale/getSubagentType methods
- Wired Gate 3 into SessionTracker.ensureSessionReady() after HierarchyIndex gate
- Wired Gate 3 into EventCapture.handleSessionCreated() to prevent directory creation for pending children
- Updated EventCapture idle/deleted/error handlers to use Gate 3 with effectiveParentID fallback
- Added ToolCapture constructor plumbing for Plan 02-03 delegator attribution
- All 256 existing session-tracker tests pass with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PendingDispatchRegistry class** - `9b05edd7` (feat)
2. **Task 2: Wire PendingDispatchRegistry into SessionTracker and add Gate 3** - `0ef5f95f` (feat)

## Files Created/Modified
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts` - NEW: PendingDispatchRegistry class with callID-based temporary keying, 30s stale auto-purge
- `src/features/session-tracker/index.ts` - MODIFIED: Gate 3 check in ensureSessionReady(), pendingRegistry field, init and DI wiring
- `src/features/session-tracker/capture/event-capture.ts` - MODIFIED: Gate 3 in handleSessionCreated and idle/deleted/error handlers
- `src/features/session-tracker/capture/tool-capture.ts` - MODIFIED: pendingRegistry field and constructor plumbing (unused until Plan 02-03)

## Decisions Made
- callID used as temporary key in PendingDispatchRegistry because child session ID is unknown at PreToolUse time; updateWithChildID() re-keys when child ID discovered
- pendingRegistry wired as optional (undefined) in EventCapture and ToolCapture constructors, maintaining backward compatibility with existing test mocks
- effectiveParentID resolved from pendingRegistry entry when Gate 3 fires but SDK parentID is null — prevents type errors in child handler methods

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed parentID type error in idle/deleted/error handlers**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** When Gate 3 triggers (pendingRegistry.has() returns true) but SDK parentID is null/undefined, the child handler methods passed null parentID to childWriter.updateChildStatus(), causing TS2345 type errors
- **Fix:** Added effectiveParentID resolution: `parentID ?? this.pendingRegistry?.get(sessionID)?.parentSessionID`. Also added early return if effectiveParentID is falsy (defensive guard against edge case where both SDK and pendingRegistry lack parentID)
- **Files modified:** src/features/session-tracker/capture/event-capture.ts (handleSessionIdle, handleSessionDeleted, handleSessionError)
- **Verification:** TypeScript compiles cleanly; all 256 tests pass
- **Committed in:** 0ef5f95f (Task 2 commit)

**2. [Rule 1 - Bug] Fixed unused PendingDispatchEntry import**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `PendingDispatchEntry` type imported but never used in index.ts (entry is used through PendingDispatchRegistry methods, not directly as a type reference)
- **Fix:** Removed `type PendingDispatchEntry` from import statement
- **Files modified:** src/features/session-tracker/index.ts
- **Committed in:** 0ef5f95f

**3. [Rule 1 - Bug] Fixed unused pendingRegistry field in ToolCapture**
- **Found during:** Task 2 (TypeScript compilation, TS6133)
- **Issue:** pendingRegistry field declared in ToolCapture but never read (plumbing for Plan 02-03). TypeScript strict mode flagged as unused local.
- **Fix:** Added @ts-ignore TS6133 annotation on field declaration with note that it is plumbing for Plan 02-03
- **Files modified:** src/features/session-tracker/capture/tool-capture.ts
- **Committed in:** 0ef5f95f

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All fixes are necessary for type safety and correctness. No scope creep. The plan did not account for the edge case where Gate 3 fires but parentID is null in the handler methods.

## Issues Encountered
- Vitest test file `tests/features/session-tracker/pending-dispatch-registry.test.ts` referenced in Task 1 verify block does not exist yet (0 tests, exit code 1). Task 1 acceptance criteria are all structural (file exists, methods correct, TypeScript compiles) — all verified via code inspection and tsc. Test file creation is deferred to Plan 02-03.

## Next Phase Readiness
- PendingDispatchRegistry class is ready for PreToolUse integration (Plan 02-02)
- ToolCapture has pendingRegistry plumbing ready for delegator attribution (Plan 02-03)
- SessionTracker three-gate classification is complete — child sessions discovered during race window will be correctly classified as CHILD

---
*Phase: CP-ST-02-session-tracker-deep-fix-remaining*
*Completed: 2026-05-13*
