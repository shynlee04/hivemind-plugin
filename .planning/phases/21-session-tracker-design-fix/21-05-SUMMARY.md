---
phase: 21-session-tracker-design-fix
plan: 05
subsystem: session-tracker, delegation
tags:
  - project-index-writer
  - delegation-persistence
  - status-overwrite
  - commit-docs-gate
  - G-3
  - G-4

# Dependency graph
requires:
  - phase: CP-ST-06
    provides: session-tracker with retry queue, hierarchy manifest, runtime preservation
provides:
  - G-3 precondition: addSession() no longer blanket-overwrites existing.status to "active"
  - G-4 precondition: persistDelegations() always writes delegation data regardless of commit_docs config
affects:
  - Phase 22 (status unification) — can trust project-continuity.json as canonical status store
  - Phase 23 (dispatch redesign) — delegation records reliably persisted

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status preservation: existing session status preserved across hook callbacks"
    - "Unconditional delegation persistence: removed config gate from critical write path"

key-files:
  created: []
  modified:
    - src/features/session-tracker/persistence/project-index-writer.ts
    - src/task-management/continuity/delegation-persistence.ts
    - tests/lib/delegation-persistence.test.ts
    - tests/features/session-tracker/persistence/project-index-writer.test.ts

key-decisions:
  - "G-3: addSession() preserves existing status — only INITIAL creation sets 'active'. Old blanket reset to 'active' had no caller that depended on it; the reset was a design error that masked lifecycle transitions."
  - "G-4: commit_docs gate removed from persistDelegations(). keep schema field for GSD (162+ refs); add separate persist_delegations field if future opt-out needed."

patterns-established:
  - "Status preservation: Hook callbacks that call addSession() for existing sessions no longer reset status. Only setUpNewSession calls set initial 'active' status."
  - "Unconditional persistence: Delegation records are always written to .hivemind/state/delegations.json. The old commit_docs gate was a misnomer — commit_docs controls git commits, not delegation persistence."

requirements-completed:
  - REQ-21-12
  - REQ-21-13

# Metrics
duration: 12 min
completed: 2026-05-21
---

# Phase 21 Session-Tracker Design Fix Plan 05: Status Preservation + Delegation Persistence

**Fixed two preconditions blocking Phase 22-25: (G-3) addSession() preserves existing status instead of blanket-resetting to "active", and (G-4) persistDelegations() always writes regardless of commit_docs config.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-21T14:38:00Z
- **Completed:** 2026-05-21T14:42:20Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- **G-3 (REQ-21-12):** Removed `existing.status = "active"` blanket reset in `addSession()` — session status is now preserved across hook callbacks. Initial creation still sets `status: "active"` for new sessions. Comment documents the G-3 precondition and P22 follow-up.
- **G-4 (REQ-21-13):** Removed `commit_docs` gate from `persistDelegations()` — delegation records are always persisted to `.hivemind/state/delegations.json`. Removed unused `getCachedConfig` import. Schema field `commit_docs` kept for GSD framework.
- Tests updated: added G-3 status preservation test with RED/GREEN TDD, added G-4 unconditional persistence test with RED/GREEN TDD, removed obsolete "skips write when commit_docs is false" test.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing test for status preservation** — `14e891da` (test)
2. **Task 1 GREEN: Fix addSession to preserve status** — `06337443` (feat)
3. **Task 2 RED: Add failing test for unconditional delegation persistence** — `3ab7c5db` (test)
4. **Task 2 GREEN: Remove commit_docs gate from persistDelegations** — `b973dad8` (feat)
5. **Task 3: Update delegation-persistence tests** — `50a366b7` (test)

**Plan metadata:** (see below)

## Files Created/Modified

- `src/features/session-tracker/persistence/project-index-writer.ts` — Removed `existing.status = "active"` blanket reset in addSession(). G-3 comment documents preservation behavior.
- `src/task-management/continuity/delegation-persistence.ts` — Removed `commit_docs` gate and unused `getCachedConfig` import. G-4 comment documents rationale.
- `tests/lib/delegation-persistence.test.ts` — Added G-4 unconditional persistence test, removed obsolete "skips write when commit_docs is false" test, renamed describe block.
- `tests/features/session-tracker/persistence/project-index-writer.test.ts` — Added G-3 status preservation test and new-session-active test.

## Decisions Made

- **G-3 status preservation:** The old code's blanket `existing.status = "active"` reset affected ALL non-error, non-deleted statuses. No caller depended on this behavior — it was a design error that silently reverted lifecycle transitions (e.g., setting a session to "idle" or "completed"). Removing it makes `project-continuity.json` trustworthy for P22.
- **G-4 unconditional delegation:** The `commit_docs` gate was a CA-03 design error — a config flag whose name describes git commit behavior was used to gate delegation persistence. Since `commit_docs` defaults to `false`, delegation records were NEVER persisted by default. Removing the gate is safe: delegations include redacted data (redactBoundaryFields removes result/error/fallbackReason). The `commit_docs` schema field is preserved for GSD framework consumers.
- **Threat model accepted:** T-21-05-02 (info disclosure) accepted — sensitive fields already protected by redaction. T-21-05-03 (repudiation) accepted — GSD reads `commit_docs` directly.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 22 (status unification) can trust `project-continuity.json` as canonical status store — session status will no longer be silently reverted to "active" by hook callbacks.
- Phase 23 (dispatch redesign) can rely on delegation records being persisted in `.hivemind/state/delegations.json` regardless of config.
- Both preconditions (G-3, G-4) are satisfied with typecheck-clean, test-verified evidence.

## Self-Check: PASSED

- [x] SUMMARY.md exists
- [x] Task 1 RED commit: `14e891da`
- [x] Task 1 GREEN commit: `06337443`
- [x] Task 2 RED commit: `3ab7c5db`
- [x] Task 2 GREEN commit: `b973dad8`
- [x] Task 3 test update commit: `50a366b7`
- [x] Plan metadata commit: `6e950e98`
- [x] AC-1: No `existing.status = "active"` blanket reset in addSession()
- [x] AC-2: No `if.*!config.commit_docs` gate in delegation-persistence.ts
- [x] All 22 tests pass (2 test files)
- [x] Typecheck passes clean

---

*Phase: 21-session-tracker-design-fix*
*Completed: 2026-05-21*
