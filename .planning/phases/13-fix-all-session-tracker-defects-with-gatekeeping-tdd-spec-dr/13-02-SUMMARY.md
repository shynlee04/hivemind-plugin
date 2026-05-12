---
phase: 13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr
plan: "02"
subsystem: session-tracker
tags: [session-tracker, turn-count, persistence, message-capture]

# Dependency graph
requires:
  - phase: 13-01
    provides: "SessionTracker fork handling and review finding fixes"
provides:
  - "Turn count increment wired into MessageCapture.handleUserMessage via SessionIndexWriter dependency injection"
affects: [13-03, 13-04, 13-05, 13-06]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Dependency injection via constructor for SessionIndexWriter following existing deps pattern"]

key-files:
  created: []
  modified:
    - src/features/session-tracker/capture/message-capture.ts
    - src/features/session-tracker/index.ts
    - tests/features/session-tracker/capture/message-capture.test.ts

key-decisions:
  - "SessionIndexWriter injected via constructor (following existing deps pattern for SessionWriter, AgentTransform)"

patterns-established:
  - "MessageCapture constructor deps injection: all writers follow same pattern (sessionWriter + sessionIndexWriter)"

requirements-completed:
  - REQ-ST-02
  - REQ-ST-08

# Metrics
duration: 5min
completed: 2026-05-12
---

# Phase 13 Plan 02: Turn Count Persistence Summary

**MessageCapture receives SessionIndexWriter via constructor injection and calls incrementTurnCount after each user message — fixing the root cause of all 15 session-continuity.json files showing turnCount: 0.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-12T02:06:00Z
- **Completed:** 2026-05-12T02:11:22Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- SessionIndexWriter dependency injected into MessageCapture constructor alongside existing SessionWriter and AgentTransform
- handleUserMessage now calls sessionIndexWriter.incrementTurnCount(sessionID) after appending each user turn
- index.ts initialize() correctly passes sessionIndexWriter to MessageCapture constructor
- 3 new tests added: incrementTurnCount called per user message, called 3 times for 3 messages, not called for assistant messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Inject SessionIndexWriter into MessageCapture and call incrementTurnCount** (TDD: RED → GREEN)
   - `32b4a3fc` — test(13-02): add failing tests for turn count persistence (RED)
   - `d9d9d77e` — feat(13-02): wire turn count increment into message capture pipeline (GREEN)

**No refactor commit needed** — implementation is minimal and clean.

## Files Created/Modified
- `src/features/session-tracker/capture/message-capture.ts` — Added SessionIndexWriter import, field, constructor param, and incrementTurnCount call in handleUserMessage
- `src/features/session-tracker/index.ts` — Added sessionIndexWriter: this.sessionIndexWriter to MessageCapture constructor call
- `tests/features/session-tracker/capture/message-capture.test.ts` — Added mock SessionIndexWriter and 3 new turn count persistence tests

## Decisions Made
- None — followed plan as specified. SessionIndexWriter injected via constructor following existing deps pattern.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Turn count persistence is complete — ready for Task 1 in 13-03 (child session message routing).
- All 226 session-tracker tests pass, typecheck clean.

---

*Phase: 13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr*
*Completed: 2026-05-12*
