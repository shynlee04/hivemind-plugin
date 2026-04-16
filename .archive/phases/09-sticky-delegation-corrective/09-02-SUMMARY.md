---
phase: 09-sticky-delegation-corrective
plan: 02
subsystem: observability
tags: [notifications, hooks, continuity, replay]

requires:
  - phase: 08-repair-durable-parent-observability-for-delegated-sessions
    provides: durable pending notifications persisted in continuity when parent delivery fails
provides:
  - event-hook replay for pending parent notifications on create/resume
  - exactly-once clearing after successful toast injection
affects: [background-execution, parent-observability, continuity]

tech-stack:
  added: []
  patterns: [event-hook-notification-replay, continuity-backed-exactly-once-clearing]

key-files:
  created: []
  modified:
    - src/hooks/create-core-hooks.ts
    - tests/hooks/create-core-hooks.test.ts

key-decisions:
  - "Replay pending notifications from the core event hook, not a hydration seam."
  - "Only clear pending notifications after successful toast injection so durability survives replay failures."

patterns-established:
  - "Parent notification replay is triggered from session.created/session.updated events with continuity as the source of truth."
  - "Session.updated resume replay is gated by recovery state rather than a separate notification cache."

requirements-completed: [PH09-02]

duration: 4 min
completed: 2026-04-10
---

# Phase 09 Plan 02: Durable Notification Replay Summary

**Continuity-backed pending notifications now replay through `createCoreHooks` on parent create/resume and clear exactly once after successful toast delivery.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-10T12:07:10Z
- **Completed:** 2026-04-10T12:11:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added RED/GREEN coverage for `session.created` and `session.updated` replay paths in the core hook tests.
- Replayed pending notifications from the authoritative event hook seam instead of relying on transform-time delivery alone.
- Cleared replayed notifications only after successful toast injection so continuity remains durable on failures.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add RED coverage for created/resumed notification replay and exactly-once clearing** - `db950c60` (test)
2. **Task 2: Wire pending-notification replay into the core event hook without using hydration seams** - `ca5e7df7` (feat)

## Files Created/Modified
- `src/hooks/create-core-hooks.ts` - replays pending notifications on `session.created` and recovery-safe `session.updated` events, then clears continuity after successful toast delivery.
- `tests/hooks/create-core-hooks.test.ts` - verifies replay on create/resume and asserts pending notifications do not reappear on the next `system.transform`.

## Decisions Made
- Reused the continuity-backed `formatPendingNotificationsForSession()` path as the replay formatter so pending delivery and replay stay on one notification model.
- Treated a low-risk recovery assessment on `session.updated` as the resume signal for one-time replay.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 09 Plan 03 can assume durable parent notifications are visible again after parent create/resume.
- No blockers found for the next corrective plan.

## Known Stubs

None.

## Self-Check

PASSED.
