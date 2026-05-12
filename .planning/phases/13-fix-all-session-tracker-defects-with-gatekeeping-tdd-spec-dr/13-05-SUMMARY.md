---
phase: 13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr
plan: "05"
subsystem: session-tracker
tags: [session-tracker, event-tracker, validation, safeSessionPath]

# Dependency graph
requires:
  - phase: 13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr
    provides: "Research (13-RESEARCH.md) identifying RC-8 through RC-11, threat model"
  - phase: CP-ST-01-session-tracker-revamp
    provides: "SessionTracker module, safeSessionPath, isValidSessionID"
provides:
  - "Legacy event-tracker double-capture eliminated (consumeJourneyFact removed from eventObservers)"
  - "thinkingDuration metadata verified truthful (returns undefined, not fabricated)"
  - "isValidSessionID loosened to accept valid OpenCode session IDs with embedded separators"
  - "Session-tracker search tool hardened against ReDoS (MAX_QUERY_LENGTH guard)"
affects: [session-tracker, event-tracker, plugin-composition, session-id-validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defense-in-depth: isValidSessionID provides input validation; safeSessionPath provides filesystem safety"
    - "TDD RED→GREEN cycle for validation logic changes"
    - "Comment-out-instead-of-delete for deprecated safety-net code (REQ-ST-13)"

key-files:
  created: []
  modified:
    - "src/plugin.ts — removed consumeJourneyFact from eventObservers, commented out legacy wiring"
    - "src/features/session-tracker/types.ts — loosened isValidSessionID regex"
    - "src/tools/hivemind/session-tracker.ts — added MAX_QUERY_LENGTH guard"
    - "tests/features/session-tracker/transform/agent-transform.test.ts — added undefined assertions"
    - "tests/features/session-tracker/types.test.ts — updated for loosened regex"
    - "tests/features/session-tracker/tools/tool-safety.test.ts — updated for loosened regex"

key-decisions:
  - "D-F-09: Comment out (not delete) consumeJourneyFact — safety net per REQ-ST-13"
  - "D-F-10: computeThinkingDuration already correct — research claim of 'hardcoded present' was stale"
  - "D-F-11: Loosen isValidSessionID to rely on safeSessionPath for filesystem safety; only reject absolute paths and traversal"
  - "D-F-12: MAX_QUERY_LENGTH=1000 guard on search-sessions to prevent ReDoS"

patterns-established:
  - "Loosened validation with defense-in-depth: type-level guard rejects obvious attacks, persistence-level guard (safeSessionPath) handles filesystem safety"

requirements-completed: [REQ-ST-13, REQ-ST-12]

# Metrics
duration: 12min
completed: 2026-05-12
---

# Phase 13 Plan 05: Independent Cleanup Fixes Summary

**Legacy event-tracker double-capture removed, thinkingDuration verified honest, isValidSessionID loosened for real OpenCode IDs, session-tracker search hardened against ReDoS**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-12T08:50:00Z
- **Completed:** 2026-05-12T09:02:00Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- Eliminated legacy event-tracker double-capture by removing `consumeJourneyFact` from `eventObservers` — `.hivemind/event-tracker/` will no longer receive new writes
- Verified `computeThinkingDuration()` honestly returns `undefined` — no fabricated timing data in session metadata
- Loosened `isValidSessionID` to accept valid OpenCode session IDs (removed blanket `/` and `\` rejection, replaced with `startsWith` absolute-path checks)
- Hardened `handleSearchSessions` against ReDoS attacks with `MAX_QUERY_LENGTH = 1000` guard

## Task Commits

Each task was committed atomically:

1. **Task 1: F-09 — Remove double-capture** — `0224c3bb` (fix)
2. **Task 2: F-10 — Verify thinkingDuration** — `0f3cec15` (test)
3. **Task 3: F-11 — Loosen isValidSessionID (TDD)** — `fa7e18b9` (test/RED) + `777a46b1` (feat/GREEN)
4. **Task 4: F-12 — Fix session-tracker tool defects** — `958dd190` (fix)

**Plan metadata:** (this commit)

## Files Modified
- `src/plugin.ts` — Removed `consumeJourneyFact` from eventObservers, commented out legacy event-tracker wiring (both locations: event observer + tool.execute.after handler)
- `src/features/session-tracker/types.ts` — Loosened `isValidSessionID` to replace `includes("/")`/`includes("\\")` with `startsWith("/")`/`startsWith("\\")`
- `src/tools/hivemind/session-tracker.ts` — Added `MAX_QUERY_LENGTH = 1000` constant and validation guard in `handleSearchSessions`
- `tests/features/session-tracker/transform/agent-transform.test.ts` — Added explicit `toBeUndefined()` assertions for `thinkingDuration`
- `tests/features/session-tracker/types.test.ts` — Updated tests for loosened regex; added new tests for embedded separators and absolute path rejection
- `tests/features/session-tracker/tools/tool-safety.test.ts` — Updated tests to reflect new behavior (embedded separators accepted, absolute paths rejected)

## Decisions Made
- **D-F-09:** Commented out `consumeJourneyFact` rather than deleting — safety net per REQ-ST-13
- **D-F-10:** Research claim (RC-9: "returns hardcoded 'present'") was stale — source already returns `undefined` since Phase 12. Added test assertions to lock this truth
- **D-F-11:** `isValidSessionID` now delegates filesystem safety to `safeSessionPath()` — only rejects traversal (`..`) and absolute paths (starts with `/` or `\`)
- **D-F-12:** GAP-01 (path traversal) already mitigated by `safeSessionPath`; GAP-02 (sync I/O) already using `node:fs/promises`; GAP-03 addressed with query length guard

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-13-09 (Info Disclosure — double-capture) | Removed `consumeJourneyFact` from `eventObservers` | ✅ Mitigated |
| T-13-10 (Elevation of Privilege — session ID) | Loosened regex, delegates to `safeSessionPath` | ✅ Mitigated |
| T-13-11 (Denial of Service — search ReDoS) | Added `MAX_QUERY_LENGTH = 1000` guard | ✅ Mitigated |

## Issues Encountered
- **Unused import discovered:** Removing `consumeJourneyFact` also made `sessionJourneyEventObserver`, `createSessionJourneyEventObserver`, and `createEventTrackerArtifactsFromHook` unused. Handled during task execution by commenting out all legacy wiring.
- **Second event-tracker usage:** `createEventTrackerArtifactsFromHook` was also called in `tool.execute.after` hook handler (line 246). Commented out to prevent unused-import errors.

## Next Phase Readiness
- Plan 13-05 (independent cleanup fixes) complete — all 4 tasks delivered
- Ready for Plan 13-06 (pipeline fixes: F-01 through F-07)

---

*Phase: 13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr*
*Plan: 05*
*Completed: 2026-05-12*
