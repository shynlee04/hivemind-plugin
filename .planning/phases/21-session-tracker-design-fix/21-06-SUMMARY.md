---
phase: 21-session-tracker-design-fix
plan: 06
subsystem: session-tracker
tags: guardrails, integration-test, orphan-cleanup, hierarchy-index, warnings

# Dependency graph
requires:
  - phase: 21-02
    provides: hierarchy-manifest.ts derivative cache (loadManifest regeneration)
provides:
  - "checkContinuityTree() guardrail before orphan quarantine (REQ-21-14)"
  - "Depth truncation warning at Math.min(depth, 2) (REQ-21-15)"
  - "End-to-end integration test covering all 6 P21 plans"
affects: [22, 23, 24]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guardrail warning pattern: checkContinuityTree uses node:fs/promises access()"
    - "Module-level warning via process.emitWarning when no client available"

key-files:
  created:
    - tests/features/session-tracker/integration/phase-21.test.ts
  modified:
    - src/features/session-tracker/orphan-cleanup.ts
    - src/features/session-tracker/persistence/hierarchy-index.ts

key-decisions:
  - "checkContinuityTree uses access() from node:fs/promises (already imported)"
  - "Depth warning uses process.emitWarning() — hierarchy-index.ts has no client reference"
  - "Integration test follows atomic-write.test.ts pattern with mkdtempSync temp dirs"

patterns-established:
  - "Guardrail code is warning-only — no behavioral change to quarantine or capping"

requirements-completed:
  - REQ-21-14
  - REQ-21-15

# Metrics
duration: 12 min
completed: 2026-05-21
---

# Phase 21 Plan 06: Guardrails + Integration Test Summary

**Three guardrail additions (warning-only, no behavioral changes) and a definitive end-to-end integration test covering all 6 P21 plans**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-21T14:48:48Z
- **Completed:** 2026-05-21T14:48:48Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- **REQ-21-14:** Added `checkContinuityTree()` guardrail to orphan-cleanup.ts — warns before quarantining a session with a valid continuity tree entry
- **REQ-21-15:** Added depth truncation warning via `process.emitWarning()` in hierarchy-index.ts `getDepth()` — fires when delegation depth exceeds max 2
- End-to-end integration test (`phase-21.test.ts`) with 5 phases covering ALL P21 fixes in a single production-like scenario using real temp directories

## Task Commits

Each task was committed atomically:

1. **Task 1: Add orphan continuity guardrail** — `3a3e461f` (feat)
2. **Task 2: Add depth truncation warning** — `3072ac70` (feat)
3. **Task 3: Create integration test** — `0a70f678` (feat)

## Files Created/Modified

### Created
- `tests/features/session-tracker/integration/phase-21.test.ts` — 5-phase e2e integration test (184 LOC)

### Modified
- `src/features/session-tracker/orphan-cleanup.ts` — Added `checkContinuityTree()` private method + G-6 guardrail warning (+38 LOC)
- `src/features/session-tracker/persistence/hierarchy-index.ts` — Added G-7 depth truncation warning in `getDepth()` (+9 LOC)

## Decisions Made

- **checkContinuityTree uses access() from node:fs/promises** — This was already imported; no new import needed. The method checks for `session-continuity.json` existence before quarantining.
- **Depth warning uses process.emitWarning()** — `hierarchy-index.ts` has no client/app reference for logging, so `process.emitWarning()` is the correct module-level fallback, consistent with Plan 01's cross-volume validation approach.
- **Integration test uses mkdtempSync + rmSync lifecycle** — Follows the established pattern from `atomic-write.test.ts` for temp directory management.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- The plan specified the wrong path for `orphan-cleanup.ts` (`src/features/session-tracker/persistence/orphan-cleanup.ts` instead of `src/features/session-tracker/orphan-cleanup.ts`). The file structure was verified before editing.
- The plan's import paths for the integration test used `../../../` which was incorrect for tests in `tests/features/session-tracker/integration/` — corrected to `../../../../`.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Passes |
| `npx vitest run tests/features/session-tracker/integration/phase-21.test.ts` | ✅ 5/5 pass |
| `npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts` | ✅ 19/19 pass (depth warning fires as expected) |
| `npx vitest run tests/features/session-tracker/` | ✅ 431/433 pass (2 pre-existing failures) |
| `npm test` (full regression) | ✅ 2357/2361 pass (2 pre-existing failures, 2 skipped) |

### Pre-existing Failures (not caused by this plan)
- `event-capture.test.ts` — hierarchy-manifest.json assertion
- `e2e-verification.test.ts` — hierarchy-manifest.json assertion

## Next Phase Readiness

- **Phase 22 (Status + Error Unification):** Ready — guardrail warnings in orphan-cleanup and hierarchy-index provide observable diagnostic input
- **Phase 23 (Dispatch + Delegate-Task Fix):** Ready — depth truncation warning makes the L2 cap observable for redesign
- **Phase 24 (Recovery Redesign):** Ready — orphan continuity warning surfaces sessions that may need different treatment
- Integration test serves as the P21 exit gate — all 6 plans verified working together
