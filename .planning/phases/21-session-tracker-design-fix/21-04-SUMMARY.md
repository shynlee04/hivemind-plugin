---
phase: 21-session-tracker-design-fix
plan: 04
subsystem: session-tracker
tags: hierarchy, rebuild, restart, depth-guard, MAX_DEPTH

# Dependency graph
requires:
  - phase: 21-01
    provides: temp-leak fix, continuity file writing
  - phase: 21-03
    provides: child metadata backfill
provides:
  - rebuildChildToRootMain() method for post-restart rootMain recovery
  - MAX_DEPTH=20 guard with warning log in ensureAncestorRoute()
affects: session-tracker, plan-06 integration tests

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Third-pass rebuild pattern in buildFromDisk() for post-restart consistency"
    - "Depth-guard pattern with warning log for recursive SDK data traversal"

key-files:
  created: []
  modified:
    - src/features/session-tracker/persistence/hierarchy-index.ts
    - src/features/session-tracker/index.ts
    - tests/features/session-tracker/persistence/hierarchy-index.test.ts
    - tests/features/session-tracker/session-tracker.test.ts

key-decisions:
  - "rebuildChildToRootMain uses first-found-wins for DAG hierarchies (matches existing registerChild() behavior)"
  - "MAX_DEPTH=20 chosen as safe guard — normal delegation depth is L2 (max 3)"

requirements-completed:
  - REQ-21-05
  - REQ-21-06
  - REQ-21-07

# Metrics
duration: 14min
completed: 2026-05-21
---

# Phase 21 Plan 04: childToRootMain rebuild + MAX_DEPTH guard Summary

**childToRootMain mapping rebuilt from continuity tree after restart, with MAX_DEPTH=20 stack overflow protection in ensureAncestorRoute()**

## Performance

- **Duration:** 14 min
- **Started:** 2026-05-21T21:29:00Z
- **Completed:** 2026-05-21T21:36:30Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added `rebuildChildToRootMain()` method that walks `childToParent` map to resolve rootMain for all registered children (F-07 / REQ-21-05)
- Called `rebuildChildToRootMain()` as third pass at end of `buildFromDisk()` to ensure EVERY registered child has a rootMain after restart (REQ-21-06)
- Added `MAX_DEPTH=20` guard with depth parameter in `ensureAncestorRoute()` — returns gracefully with warning after exceeding threshold (F-13 / REQ-21-07)
- Added 3 tests for rebuildChildToRootMain: L0→L1→L2 chain, buildFromDisk fixture, isolated children via manual registration
- Added MAX_DEPTH constant presence test in session-tracker test suite

## Task Commits

Each task was committed atomically with TDD (RED → GREEN):

| # | Task | Type | Commit |
|---|------|------|--------|
| 1 | Add failing test for rebuildChildToRootMain | RED (test) | `78dc6ab6` |
| 1 | Implement rebuildChildToRootMain() method + call from buildFromDisk() | GREEN (feat) | `6ffa05e7` |
| 2 | Add failing test for MAX_DEPTH guard | RED (test) | `8e600596` |
| 2 | Implement MAX_DEPTH=20 guard in ensureAncestorRoute() | GREEN (feat) | `a3df9293` |
| 3 | Tests included in RED phases above | — | — |

## Files Created/Modified
- `src/features/session-tracker/persistence/hierarchy-index.ts` — Added `rebuildChildToRootMain()` method (31 LOC) + third-pass call in `buildFromDisk()`
- `src/features/session-tracker/index.ts` — Replaced `ensureAncestorRoute()` with depth-guarded version (MAX_DEPTH=20, warning log)
- `tests/features/session-tracker/persistence/hierarchy-index.test.ts` — Added 3 rebuildChildToRootMain tests (73 LOC)
- `tests/features/session-tracker/session-tracker.test.ts` — Added MAX_DEPTH constant presence test (17 LOC)

## Decisions Made
- **DAG first-found-wins:** `rebuildChildToRootMain()` uses `resolveRootMain()` which walks the parent chain until finding a session NOT in `childToParent`. For DAG structures, the first registered parent determines the root. This matches existing runtime behavior in `registerChild()`.
- **MAX_DEPTH=20:** Chosen as a safe upper bound. Normal delegation depth is L2 (3 tiers including root). The guard prevents stack overflow from corrupt SDK data while not interfering with realistic chains.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- Pre-existing test failures: 2 `hierarchy-manifest.json` tests failing in the integration suite (unrelated to this plan's changes). These are CP-ST-04 manifest file tests that fail independently.

## Verification Results
- `npm run typecheck` — PASS (0 errors)
- `npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts` — 19/19 pass
- `npx vitest run tests/features/session-tracker/session-tracker.test.ts` — 9/9 pass
- `grep "rebuildChildToRootMain"` — Found: method at line 323, call at line 142
- `grep "MAX_DEPTH"` — Found: 4 occurrences in src/features/session-tracker/index.ts

## Next Phase Readiness
- **Ready for Plan 05** (remaining session-tracker design fixes) — foundation for childToRootMain recovery is solid after restart
- **Ready for Plan 06** (integration tests) — MAX_DEPTH guard is wired; integration tests will validate full SessionTracker instantiation with 25+ ancestor chains

---
*Phase: 21-session-tracker-design-fix*
*Completed: 2026-05-21*
