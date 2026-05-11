---
phase: BOOT-09-mvp-config-schema-entry-init
plan: 01
subsystem: config-schema
tags: [zod, config, hooks, session, typescript, tdd]
requires:
  - phase: BOOT-08
    provides: Governance constitution context
provides:
  - document_paths schema field for configurable document path prefixes
  - LEGACY_KEY_MAP entry for documentPaths → document_paths migration
  - isMainSession type on HookDependencies for child-session exclusion
  - createSessionIsMainObserver factory caching isMainSession booleans from session.created events
affects: [BOOT-09-02, BOOT-09-03]

tech-stack:
  added: []
  patterns:
    - "Observer factory pattern: factory returns { observer, lookupFn } using in-memory Map cache"
    - "TDD per task: RED (write failing tests first) → GREEN (implement) → commit"

key-files:
  created:
    - tests/hooks/types.test.ts
    - tests/hooks/observers/event-observers.test.ts
  modified:
    - src/schema-kernel/hivemind-configs.schema.ts
    - src/hooks/types.ts
    - src/hooks/observers/event-observers.ts
    - tests/schema-kernel/hivemind-configs.schema.test.ts

key-decisions:
  - "document_paths: z.array(z.string()).default(['.hivemind/planning/']) per D-08/D-09/D-10"
  - "isMainSession detection uses OpenCode native parentID field (not DelegationManager) per D-01"
  - "Map-based cache populated from session.created events per D-02"
  - "parentID === undefined/null → main session; parentID string → child session per D-03"

patterns-established:
  - "TDD execution per plan task: write failing test → implement → verify → commit"
  - "Observer factory return shape: { observer, isMainSession/getIntake } matching existing createSessionEntryEventObserver pattern"

requirements-completed: [REQ-01, REQ-03]

duration: 11 min
completed: 2026-05-11
---

# Phase BOOT-09 Plan 01: MVP Config Schema Entry Init Summary

**document_paths schema field, isMainSession type on HookDependencies, and createSessionIsMainObserver() factory — all delivered with strict TDD (RED → GREEN per task)**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-11T21:46:00Z
- **Completed:** 2026-05-11T21:57:51Z
- **Tasks:** 3 (6 commits: 3 RED + 3 GREEN)
- **Files modified:** 6

## Accomplishments

- Added `document_paths: z.array(z.string()).default([".hivemind/planning/"])` to `HivemindConfigsSchema` per D-08/D-09/D-10 with full test coverage
- Added `documentPaths` → `document_paths` entry to `LEGACY_KEY_MAP` for backward-compatible camelCase migration
- Added `isMainSession?: (sessionId: string) => boolean` to `HookDependencies` interface per D-04 with JSDoc
- Added `createSessionIsMainObserver()` factory to `event-observers.ts` — Map-based cache from `session.created` events, using OpenCode native `parentID` for main-session detection per D-01/D-02/D-03
- 100% task acceptance criteria met: all 57 tests pass across 3 test files, typecheck passes with 0 errors

## Task Commits

Each task was committed atomically with separate RED and GREEN commits:

1. **Task 1: document_paths schema + LEGACY_KEY_MAP**
   - `1457a2f` — test(BOOT-09-01-T1): RED — failing tests for document_paths schema
   - `7b327fd` — feat(BOOT-09-01-T1): GREEN — implement document_paths schema field

2. **Task 2: isMainSession on HookDependencies**
   - `24de38d` — test(BOOT-09-01-T2): RED — failing type test for isMainSession on HookDependencies
   - `3a700a0` — feat(BOOT-09-01-T2): GREEN — add isMainSession to HookDependencies interface

3. **Task 3: createSessionIsMainObserver factory**
   - `4ea3cb1` — test(BOOT-09-01-T3): RED — failing tests for createSessionIsMainObserver factory
   - `accdf8a` — feat(BOOT-09-01-T3): GREEN — implement createSessionIsMainObserver factory

**Plan metadata:** (committed after this SUMMARY)

## Files Created/Modified

- `src/schema-kernel/hivemind-configs.schema.ts` — Added `document_paths` field to schema + `documentPaths` to LEGACY_KEY_MAP
- `src/hooks/types.ts` — Added `isMainSession?: (sessionId: string) => boolean` to HookDependencies
- `src/hooks/observers/event-observers.ts` — Added `createSessionIsMainObserver()` factory
- `tests/schema-kernel/hivemind-configs.schema.test.ts` — Added 4 tests for document_paths defaults, custom paths, and LEGACY_KEY_MAP migration
- `tests/hooks/types.test.ts` — Added type-level test for isMainSession on HookDependencies
- `tests/hooks/observers/event-observers.test.ts` — Added 7 tests for createSessionIsMainObserver behavior

## Decisions Made

- **document_paths schema:** Flat string array with `z.array(z.string()).default([".hivemind/planning/"])` per SPEC D-08/D-09/D-10. Recursive globbing handled at enforcement time, not schema.
- **Child session detection:** Uses OpenCode native `parentID` field (not DelegationManager) per D-01. Cached at session entry via event observer per D-02. Main = `parentID` absent/null per D-03.
- **Injector pattern:** `isMainSession` injected via HookDependencies matching existing `getBehavioralProfile` pattern per D-04.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Test 3 in Task 1 ("is stripped when not configured") had to be updated from RED to GREEN — the test was written assuming the field didn't exist (producing `undefined`), but post-GREEN the default is correctly applied. Updated the test name and assertion to match the intended GREEN behavior.

## Self-Check

- `src/schema-kernel/hivemind-configs.schema.ts` — found ✓
- `src/hooks/types.ts` — found ✓
- `src/hooks/observers/event-observers.ts` — found ✓
- `tests/schema-kernel/hivemind-configs.schema.test.ts` — found ✓
- `tests/hooks/types.test.ts` — found ✓
- `tests/hooks/observers/event-observers.test.ts` — found ✓
- Commit `1457a2f` — found ✓
- Commit `7b327fd` — found ✓
- Commit `24de38d` — found ✓
- Commit `3a700a0` — found ✓
- Commit `4ea3cb1` — found ✓
- Commit `accdf8a` — found ✓

## Self-Check: PASSED

## Next Phase Readiness

Ready for BOOT-09-02 (language block integration in system.transform hook) and BOOT-09-03 (tool guard enforcement for document paths). The schema field, type, and observer factory from this plan are the foundation those plans require.

---

*Phase: BOOT-09-mvp-config-schema-entry-init*
*Completed: 2026-05-11*
