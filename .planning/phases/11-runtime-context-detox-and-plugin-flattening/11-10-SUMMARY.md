---
phase: 11-runtime-context-detox-and-plugin-flattening
plan: 10
subsystem: plugin
tags: [runtime-context, session-entry, plugin, consumer-proof]
requires:
  - phase: 11-03
    provides: preserved start-work consumers moved toward feature-owned session-entry modules
provides:
  - direct feature-owned session-entry type imports for remaining start-work shim consumers
  - deletion of the five `src/hooks/start-work/*` shim files in the shim family
  - consumer-proof rows updated with completed deletion evidence for the start-work shim family
affects: [plugin, session-entry, runtime-entry, tests]
tech-stack:
  added: []
  patterns: [consumer-proof deletion gating, direct feature-owned session-entry imports]
key-files:
  created: [.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-10-SUMMARY.md]
  modified:
    - .planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md
    - src/hooks/start-work/start-work-router.ts
    - src/plugin/opencode-plugin.ts
    - src/plugin/context-renderer.ts
    - src/plugin/runtime-plan.ts
    - tests/plugin-runtime.test.ts
key-decisions:
  - "Relocate all remaining `start-work-types` consumers to `src/features/session-entry/start-work-types.ts` before deleting the shim file."
  - "Keep `src/hooks/start-work/start-work-router.ts` as the hook entrypoint while deleting only thin shim files from the family."
patterns-established:
  - "Consumer-proof deletion: re-run repo imports immediately before deleting shim files."
  - "Feature-owned session-entry types: plugin, runtime-entry, and tests import session-entry types directly instead of hook-layer shims."
requirements-completed: [P11-06]
duration: 8 min
completed: 2026-03-19
---

# Phase 11 Plan 10: Delete start-work shims by conditional consumer-proof outcome Summary

**Start-work shim deletion now lands on direct session-entry imports, with the five shim files removed and the proof matrix updated to show completed consumer-proof cleanup.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T15:13:00Z
- **Completed:** 2026-03-19T15:20:53Z
- **Tasks:** 1
- **Files modified:** 23

## Accomplishments
- Deleted `src/hooks/start-work/purpose-classifier.ts`, `src/hooks/start-work/lineage-router.ts`, `src/hooks/start-work/readiness-gates.ts`, `src/hooks/start-work/session-state.ts`, and `src/hooks/start-work/start-work-types.ts`.
- Relocated remaining plugin, runtime-entry, auto-slash, plugin-handler, and test imports to `src/features/session-entry/start-work-types.ts` or the feature-owned session-entry helpers.
- Updated `11-CONSUMER-PROOF.md` to record the shim-family cleanup as completed deletion work rather than pending delete-now candidates.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove start-work shims only after relocated consumers are proven direct** - `de26d09` (refactor)

## Files Created/Modified
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-10-SUMMARY.md` - execution summary for Plan 11-10
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md` - marks the shim-family rows as deleted with completed proof commands
- `src/hooks/start-work/start-work-router.ts` - now imports feature-owned session-entry helpers directly after shim deletion
- `src/plugin/opencode-plugin.ts` - imports `StartWorkInput` from feature-owned session-entry types
- `src/plugin/context-renderer.ts` - imports `StartWorkDecision` from feature-owned session-entry types
- `src/plugin/runtime-plan.ts` - keeps the hook router but moves entry-kernel types to feature-owned session-entry authority
- `src/plugin-handlers/*.ts` - import `StartWorkDecision` and `PurposeClass` directly from feature-owned session-entry types
- `src/features/runtime-entry/doctor.ts` - imports `PurposeClass` from feature-owned session-entry types
- `src/features/runtime-entry/init.ts` - imports `PurposeClass` from feature-owned session-entry types
- `tests/plugin-runtime.test.ts` - imports `StartWorkDecision` from the feature-owned type authority

## Decisions Made
- Moved all remaining `start-work-types` consumers to `src/features/session-entry/start-work-types.ts` so the delete was backed by current repo evidence instead of stale 11-03 assumptions.
- Left `src/hooks/start-work/start-work-router.ts` in place as the preserved hook entrypoint and limited this plan to the thin shim family named in the plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Re-ran consumer proof when `start-work-types` still had live imports**
- **Found during:** Task 1 (Remove start-work shims only after relocated consumers are proven direct)
- **Issue:** `rg` still found live `src/**` and `tests/**` imports for `hooks/start-work/start-work-types`, so deleting the shim immediately would have broken plugin, runtime-entry, auto-slash, and test consumers.
- **Fix:** Relocated all remaining type imports to `src/features/session-entry/start-work-types.ts`, rewired `src/hooks/start-work/start-work-router.ts` to feature-owned helpers, then deleted the shim files.
- **Files modified:** `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md`, `src/hooks/start-work/start-work-router.ts`, `src/plugin/*.ts`, `src/plugin-handlers/*.ts`, `src/features/runtime-entry/{doctor,init}.ts`, `src/hooks/auto-slash-command/*.ts`, `tests/plugin-runtime.test.ts`
- **Verification:** `rg -n "hooks/start-work/(purpose-classifier|lineage-router|readiness-gates|session-state|start-work-types)" src tests` returned no matches after relocation.
- **Committed in:** `de26d09` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The extra relocation pass was required to make the shim deletion truthful. No scope creep beyond the start-work shim family.

## Issues Encountered
- `npx tsc --noEmit` still reports unrelated pre-existing errors in `src/tools/{doc,handoff,task,trajectory}/tools.ts`. The task-specific regressions caused by shim deletion were fixed, and the remaining tool-related failures were treated as out of scope per the execution instruction.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The start-work shim family is now deleted by proof, and remaining session-entry authority is explicit in feature-owned imports or the preserved `start-work-router` entrypoint.
- Unrelated pre-existing `src/tools/*` typecheck failures still need separate cleanup before a full green repo-wide `npx tsc --noEmit` gate is possible.

## Self-Check: PASSED

- Found `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-10-SUMMARY.md` on disk.
- Found task commit `de26d09` in `git log --oneline --all`.

---
*Phase: 11-runtime-context-detox-and-plugin-flattening*
*Completed: 2026-03-19*
