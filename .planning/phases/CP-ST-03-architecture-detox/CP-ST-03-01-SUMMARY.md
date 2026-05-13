---
phase: CP-ST-03-architecture-detox
plan: 01
subsystem: task-management
tags: [event-tracker, excision, session-tracker, migration, documentation]

# Dependency graph
requires:
  - phase: CP-ST-02
    provides: canonical session-tracker capture module
provides:
  - Full event-tracker excision: 22 source+test files deleted, zero runtime references remain
  - One-shot migration cleanup for existing .hivemind/event-tracker/ state directories
  - All documentation synced to reflect session-tracker as canonical
affects: [CP-ST-03-02, CP-PTY-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One-shot migration pattern: sentinel-gated fire-and-forget cleanup on plugin init"
    - "TDD for deletion: RED tests prove existence before GREEN deletion phase"

key-files:
  created:
    - tests/CP-ST-03-01-excision.test.ts - 16 vitest assertions verifying zero event-tracker surface
  modified:
    - src/plugin.ts - dead code removed, one-shot migration added
    - src/index.ts - line 19 re-export removed
    - src/hooks/observers/event-observers.ts - SessionJourneyEventFact + createSessionJourneyEventObserver removed
    - src/features/session-tracker/index.ts - removeLegacyStateFiles removed
    - src/sidecar/readonly-state.ts - event-tracker prefix removed from CANONICAL_PREFIXES
    - src/features/bootstrap/structure.ts - event-tracker removed from TIER_1_DIRECTORIES
    - src/shared/plugin-tool-output-summary.ts - JSDoc event-tracker reference removed
    - tests/plugins/plugin-lifecycle.test.ts - 3 deleted, 3 rewritten
    - tests/plugin/bootstrap-tools-registration.test.ts - event-tracker mock removed
    - tests/lib/state-root-migration.test.ts - import + 2 tests removed
    - tests/lib/security/path-scope.test.ts - event-tracker sub-assertion removed
    - tests/features/session-tracker/integration/e2e-verification.test.ts - REQ-ST-13 block deleted
    - tests/tools/bootstrap-init.test.ts - event-tracker from expected dirs
    - tests/tools/hivemind-pressure.test.ts - event-tracker:ses_root → session-tracker:ses_root
    - tests/sidecar/readonly-state.test.ts - event-tracker mkdir + test removed
    - AGENTS.md - path updated
    - src/task-management/journal/AGENTS.md - event-tracker purpose/authority/naming removed
    - src/task-management/AGENTS.md - EventTracker line replaced
    - src/features/session-tracker/AGENTS.md - forbidden mutation rule updated
    - sidecar/README.md - canonical paths updated
  deleted:
    - src/task-management/journal/event-tracker/ - 12 source files
    - tests/lib/event-tracker/ - 10 test files

key-decisions:
  - "D-02: Full event-tracker excision — 22 files deleted, only active import was src/index.ts:19"
  - "D-03: One-shot migration cleanup in plugin.ts with sentinel file gating"
  - "D-06: Three-category test strategy (DELETE, REWRITE, EDIT) applied to 8 test files"
  - "D-07: Documentation sync across 6 files with historical context preserved"

requirements-completed: [AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13]

# Metrics
duration: 40 min
completed: 2026-05-13
---

# Phase CP-ST-03 Plan 01: Event-Tracker Excision + Documentation Sync Summary

**Complete event-tracker removal: 22 source+test files deleted, 6 source files edited, 8 test files rewritten, 6 docs synced, one-shot migration cleanup added to plugin.ts**

## Performance

- **Duration:** 40 min
- **Started:** 2026-05-13T14:21:49Z
- **Completed:** 2026-05-13T15:02:40Z
- **Tasks:** 3 (TDD: 2 RED commits + 2 GREEN commits + 1 direct + 1 fix)
- **Files:** 22 deleted, 23 modified, 1 created

## Accomplishments

- Deleted all 12 event-tracker source files under `src/task-management/journal/event-tracker/`
- Deleted all 10 event-tracker test files under `tests/lib/event-tracker/`
- Removed the only active runtime import (`src/index.ts:19`) and all dead commented code from `src/plugin.ts`
- Removed `SessionJourneyEventFact` type and `createSessionJourneyEventObserver()` from `event-observers.ts`
- Removed `removeLegacyStateFiles()` method from `session-tracker/index.ts`
- Cleaned CANONICAL_PREFIXES in `readonly-state.ts` and TIER_1_DIRECTORIES in `structure.ts`
- Rewrote 8 test files: 3 event-tracker tests deleted, 3 rewritten in `plugin-lifecycle.test.ts`, plus 6 other files cleaned
- Synced 6 documentation files: AGENTS.md, journal/AGENTS.md, task-management/AGENTS.md, session-tracker/AGENTS.md, sidecar/README.md (ROADMAP.md phase description accurate as-is)
- Added one-shot migration cleanup to `plugin.ts`: removes legacy `.hivemind/event-tracker/` directory on first init, gated by sentinel file at `.hivemind/state/event-tracker-migration-done`

## Task Commits

Each task was committed atomically using TDD where specified:

1. **Task 1 RED (test):** `6503940e` — test(CP-ST-03-01): add failing test for event-tracker excision
2. **Task 1 GREEN (feat):** `3fb2f364` — feat(CP-ST-03-01): excise event-tracker source, test files, and runtime references
3. **Task 2 RED (test):** `d64f6dcd` — test(CP-ST-03-01): add failing tests for test file event-tracker cleanup
4. **Task 2 GREEN (feat):** `76a31d9e` — feat(CP-ST-03-01): clean event-tracker references from 8 test files
5. **Task 3 (feat):** `d6c8a69e` — feat(CP-ST-03-01): documentation sync + one-shot migration cleanup
6. **Fix:** `635b5cc8` — fix(CP-ST-03-01): narrow AC-03 test scope, remove doc reference in plugin-tool-output-summary

## Files Created/Modified

### Created
- `tests/CP-ST-03-01-excision.test.ts` — 16 vitest assertions covering AC-01 through AC-13

### Modified (source)
- `src/plugin.ts` — Dead event-tracker comments removed, one-shot migration cleanup added (CP-ST-03 D-03)
- `src/index.ts` — Line 19 `export * from "./task-management/journal/event-tracker/index.js"` removed
- `src/hooks/observers/event-observers.ts` — `SessionJourneyEventFact` type and `createSessionJourneyEventObserver()` function removed
- `src/features/session-tracker/index.ts` — `removeLegacyStateFiles()` private method removed, `cleanup()` updated
- `src/sidecar/readonly-state.ts` — `".hivemind/event-tracker"` removed from CANONICAL_PREFIXES
- `src/features/bootstrap/structure.ts` — `"event-tracker"` removed from TIER_1_DIRECTORIES
- `src/shared/plugin-tool-output-summary.ts` — JSDoc reference updated

### Modified (tests)
- `tests/plugins/plugin-lifecycle.test.ts` — 3 event-tracker tests deleted, 3 rewritten, 2 renamed
- `tests/plugin/bootstrap-tools-registration.test.ts` — event-tracker vi.mock block removed
- `tests/lib/state-root-migration.test.ts` — import + 2 tests removed
- `tests/lib/security/path-scope.test.ts` — event-tracker sub-assertion removed
- `tests/features/session-tracker/integration/e2e-verification.test.ts` — REQ-ST-13: Legacy Cleanup describe block deleted
- `tests/tools/bootstrap-init.test.ts` — `"event-tracker"` from CANONICAL_HIVEMIND_DIRECTORIES
- `tests/tools/hivemind-pressure.test.ts` — `event-tracker:ses_root` → `session-tracker:ses_root`
- `tests/sidecar/readonly-state.test.ts` — event-tracker mkdir + test removed

### Modified (docs)
- `AGENTS.md` — path updated from event-tracker to session-tracker
- `src/task-management/journal/AGENTS.md` — event-tracker removed from purpose, authority, naming sections
- `src/task-management/AGENTS.md` — EventTracker line replaced with removal note
- `src/features/session-tracker/AGENTS.md` — forbidden mutation rule updated
- `sidecar/README.md` — canonical paths table updated

### Deleted
- `src/task-management/journal/event-tracker/` — 12 files (types, parser, writer, markdown-renderer, index, hook-event, document-store, dual-persistence, classifier, delegation-evidence, artifact-writer, .gitkeep)
- `tests/lib/event-tracker/` — 10 files (session-v3-schema, session-journey-events, writer, document-store, dual-persistence, event-types, session-artifact-parser, artifact-writer, delegation-evidence, classifier)

## Decisions Made

- **D-02 applied:** Full event-tracker source excision — the only active runtime import was `src/index.ts:19`. All `plugin.ts` references were dead commented code, confirmed by RESEARCH.md.
- **D-03 applied:** One-shot migration in plugin.ts removes `.hivemind/event-tracker/` directory on first init. Gated by sentinel file `.hivemind/state/event-tracker-migration-done`. Fire-and-forget, never blocks init.
- **D-06 applied:** Three categories of test changes executed: DELETE (3 tests + entire REQ-ST-13 block), REWRITE (3 tests in plugin-lifecycle), EDIT (6 files).
- **D-07 applied:** All 6 documentation files updated. Historical context preserved where events are mentioned as "replaced/removed in CP-ST-03."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing corrupted indentation in session-tracker index.ts**
- **Found during:** Task 1 GREEN (first edit attempt on session-tracker/index.ts)
- **Issue:** Edit tool matched wrong closing brace due to multiple `}` patterns, causing corrupted `cleanupOrphanedTmpFiles()` method
- **Fix:** Reverted file with `git checkout`, re-applied edits with unique surrounding context
- **Files modified:** `src/features/session-tracker/index.ts`
- **Verification:** TypeScript compiles clean, all 16 vitest assertions pass
- **Committed in:** `3fb2f364`

**2. [Rule 1 - Bug] AC-03 test flagged legitimate migration code**
- **Found during:** Plan-level verification after Task 3
- **Issue:** AC-03/AC-13 test regex `/event-tracker/` matched the one-shot migration code added in Task 3 (legitimate, not dead code)
- **Fix:** Narrowed test to only check dead patterns (`consumeJourneyFact`, `sessionJourneyEventObserver`, etc.), excluding generic `event-tracker` substring
- **Files modified:** `tests/CP-ST-03-01-excision.test.ts`
- **Verification:** All 16 tests pass after fix
- **Committed in:** `635b5cc8`

**3. [Rule 2 - Missing Critical] plugin-tool-output-summary.ts JSDoc reference**
- **Found during:** Plan-level verification after Task 3
- **Issue:** `src/shared/plugin-tool-output-summary.ts` line 9 JSDoc referenced "plugin event-tracker limit" — missed in initial sweep
- **Fix:** Changed to "plugin metadata limit"
- **Files modified:** `src/shared/plugin-tool-output-summary.ts`
- **Verification:** grep confirms zero event-tracker references in file
- **Committed in:** `635b5cc8`

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep. 2 fixes discovered at plan-level verification gate — verification protocol worked as designed.

## Known Stubs

None — all event-tracker surface is removed. The one-shot migration cleanup is fully functional (fire-and-forget with sentinel gating).

## Threat Flags

None — this plan is purely subtractive and adds no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. The one-shot migration uses scoped `rmSync` with sentinel gating per threat register T-CP-ST-03-01/02.

## Issues Encountered

- **Session-tracker edit tool matching:** The `edit` tool matched wrong `}` patterns in `session-tracker/index.ts` due to multiple identical closing braces at similar indentation. Resolved by using unique surrounding context in the `oldString` pattern. Mitigation: always verify file syntax after edits with `wc -l` and `tail` checks.
- **Pre-existing type error:** `src/tools/session/execute-slash-command.ts:106` has a `TS2739` type error (unrelated to event-tracker). Documented as pre-existing, out of scope per AGENTS.md rules.

## Next Phase Readiness

- CP-ST-03-01 complete — event-tracker fully excised
- Ready for CP-ST-03-02: Plugin Composition Purification (extract inline hook callbacks from plugin.ts)
- One-shot migration handles existing `.hivemind/event-tracker/` state directories for current users
- All 13 acceptance criteria (AC-01 through AC-13) verified

---

*Phase: CP-ST-03-architecture-detox*
*Plan: 01 — Event-Tracker Excision + Documentation Sync*
*Completed: 2026-05-13*
