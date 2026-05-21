---
phase: 21-session-tracker-design-fix
plan: 02
subsystem: session-tracker persistence
tags: hierarchy-manifest, continuity-tree, derivative-cache, childCount, delegation-depth

# Dependency graph
requires:
  - phase: 21-session-tracker-design-fix
    provides: G-1 decision (manifest = derivative cache), G-8 precondition (updateSession timestamp path)
provides:
  - HierarchyIndex with getChildCountForSession() and getMaxDepthForSession()
  - ProjectIndexWriter computes childCount and totalDelegationDepth in updateSession()
  - generateFromContinuity() walks continuity tree producing flat manifest
  - loadManifest() regenerates from continuity tree on cache miss (G-1 derivative cache)
  - Zero manifestWriter.addChild() calls in entire codebase (REQ-21-04)
affects:
  - Plans 21-03 (F-18 anonymous children)
  - Plans 21-04 (F-07 recovery, F-13 MAX_DEPTH)
  - Plans 21-06 (guardrails, integration verification)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Derivative cache pattern: manifest generated from continuity tree at read time
    - computeChildCount/depth in updateSession() via hierarchyIndex DI

key-files:
  created: []
  modified:
    - src/features/session-tracker/persistence/hierarchy-index.ts
    - src/features/session-tracker/persistence/project-index-writer.ts
    - src/features/session-tracker/initialization.ts
    - src/features/session-tracker/persistence/hierarchy-manifest.ts
    - src/features/session-tracker/capture/event-capture.ts
    - src/features/session-tracker/tool-delegation.ts
    - tests/features/session-tracker/persistence/hierarchy-manifest.test.ts
    - tests/features/session-tracker/persistence/project-index-writer.test.ts

key-decisions:
  - "generateFromContinuity() uses entry.depth for delegationDepth, passes parentID through walk() parameter (not stored in ChildHierarchyEntry interface)"
  - "subagentType uses entry.delegatedBy as fallback (continuity tree only stores delegatedBy, not subagentType separately)"
  - "updateSession() overwrites childCount and totalDelegationDepth with computed values — callers cannot override via updates param"
  - "existing test updated: childCount=0 when hierarchyIndex not wired (graceful degradation)"

patterns-established:
  - "Derivative cache: manifest is read-time generated from canonical continuity tree; no write-side addChild calls"
  - "ChildCount/depth computed from hierarchyIndex at updateSession() time — always fresh, never stale"

requirements-completed:
  - REQ-21-03
  - REQ-21-04
  - REQ-21-10
  - REQ-21-11

# Metrics
duration: 6 min
completed: 2026-05-21
---

# Phase 21: Session-Tracker Design Fix — Plan 02 Summary

**Manifest becomes derivative cache of continuity tree; childCount and totalDelegationDepth computed from hierarchyIndex in updateSession(); all write-side addChild calls removed**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-21T14:14:11Z
- **Completed:** 2026-05-21T14:21:06Z
- **Tasks:** 4
- **Files modified:** 8

## Accomplishments

- Added `getChildCountForSession()` and `getMaxDepthForSession()` to HierarchyIndex for O(1) child count and recursive depth computation
- Wired `HierarchyIndex` as optional dependency in `ProjectIndexWriter` — computes `childCount` and `totalDelegationDepth` in `updateSession()` (F-19 fix)
- Wired `hierarchyIndex` into `ProjectIndexWriter` at `initialization.ts:99` — runtime no-op fixed (BLOCKER)
- Added `generateFromContinuity()` to HierarchyManifestWriter — walks continuity tree and produces flat manifest (G-1 derivative cache)
- Modified `loadManifest()` to regenerate from continuity tree on cache miss — automatically writes regenerated manifest to disk
- Removed `manifestWriter.addChild()` from **both** `event-capture.ts` and `tool-delegation.ts` — zero write-side addChild calls remain (REQ-21-04)
- Added 7 new tests: 3 for `generateFromContinuity` (empty continuity, 3 children from fixture, cache-miss regeneration), 2 for `getChildCountForSession`, 2 for `getMaxDepthForSession`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getChildCountForSession() and getMaxDepthForSession()** — `d6174a62` (feat)
2. **Task 2: Add HierarchyIndex dep to ProjectIndexWriter, compute childCount/depth, wire in init** — `6fa8ba63` (feat)
3. **Task 3: Add generateFromContinuity, derivative cache, remove addChild calls** — `16aa322c` (feat)
4. **Task 4: Add tests** — `7ce9c503` (test)

## Files Created/Modified

- `src/features/session-tracker/persistence/hierarchy-index.ts` — Added getChildCountForSession() and getMaxDepthForSession()
- `src/features/session-tracker/persistence/project-index-writer.ts` — Added hierarchyIndex dep, computeChildCount/depth, updateSession() computes childCount/depth
- `src/features/session-tracker/initialization.ts` — Wired hierarchyIndex into ProjectIndexWriter constructor
- `src/features/session-tracker/persistence/hierarchy-manifest.ts` — Added generateFromContinuity(), modified loadManifest() for derivative cache
- `src/features/session-tracker/capture/event-capture.ts` — Removed manifestWriter.addChild() call
- `src/features/session-tracker/tool-delegation.ts` — Removed manifestWriter.addChild() call
- `tests/features/session-tracker/persistence/hierarchy-manifest.test.ts` — Added generateFromContinuity tests
- `tests/features/session-tracker/persistence/project-index-writer.test.ts` — Added childCount/depth tests, fixed existing test assertion

## Decisions Made

- **generateFromContinuity()** uses `entry.depth` for delegationDepth and passes `parentID` through walk function parameter since `ChildHierarchyEntry` interface stores `delegatedBy` but not `parentSessionID` or `subagentType` separately
- **childCount/depth in updateSession()** always overwrites `updates.childCount` and `updates.totalDelegationDepth` with computed values — callers cannot override these fields via the `updates` param
- **updateChildStatus() read paths preserved** — all lifecycle status update calls (completed/error/idle) still use `manifestWriter.updateChildStatus()` for backward compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **ChildHierarchyEntry interface mismatch:** The plan's `generateFromContinuity()` referenced `entry.parentSessionID` and `entry.subagentType` which don't exist on `ChildHierarchyEntry`. Resolution: passed `parentID` through `walk()` parameter, used `entry.delegatedBy` as subagentType fallback. All functionally equivalent — continuity tree children are still correctly flattened into manifest.
- **Existing test assertion updated:** `project-index-writer.test.ts` expected `childCount: 3` from `updateSession({ childCount: 3 })`. Now `updateSession()` always computes childCount from hierarchyIndex (returns 0 when not wired). Updated test assertion to expect 0 with F-19 annotation.

## Known Stubs

None detected.

## Threat Flags

None — all changes are internal to session-tracker persistence with no new network endpoints, auth paths, or trust-boundary surfaces.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All manifest and childCount/depth changes complete for Plan 02
- Plan 02 was the **architectural prerequisite** (Wave 1) — downstream plans 21-03 through 21-06 can now build on this foundation
- Ready for Plan 21-03: F-18 Anonymous Children Metadata
- All 27 tests pass, typecheck clean

---

*Phase: 21-session-tracker-design-fix*
*Completed: 2026-05-21*
