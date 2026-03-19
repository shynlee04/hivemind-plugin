---
phase: 11-runtime-context-detox-and-plugin-flattening
plan: 03
subsystem: runtime
tags: [runtime-context, session-entry, control-plane, trajectory, slash-command]
requires:
  - phase: 11-01
    provides: consumer-proof matrix for conditional runtime/plugin deletions
provides:
  - preserved consumers import `src/features/session-entry/start-work-types.ts` directly
  - `src/hooks/start-work/start-work-types.ts` is marked delete-ready in the consumer proof matrix
affects: [phase-11, start-work-shims, runtime-entry, control-plane, slash-command]
tech-stack:
  added: []
  patterns: [feature-owned start-work type authority, consumer-proof-driven shim deletion]
key-files:
  created: [.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-03-SUMMARY.md]
  modified:
    - .planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md
    - src/shared/opencode-knowledge.ts
    - src/recovery/recovery-types.ts
    - src/intelligence/doc/doc-surface-router.ts
    - src/features/runtime-entry/attachment.ts
    - src/core/trajectory/trajectory-types.ts
    - src/control-plane/control-plane-types.ts
    - src/control-plane/control-plane-registry.ts
    - src/commands/slash-command/command-types.ts
key-decisions:
  - "Preserved type consumers now import `src/features/session-entry/start-work-types.ts` directly instead of the hook shim."
  - "`src/hooks/start-work/start-work-types.ts` is now a delete-now target because repo consumers reached zero."
patterns-established:
  - "Feature-owned types: preserved runtime and control-plane surfaces import session-entry types from the feature owner, not hook re-exports."
requirements-completed: [P11-06]
duration: 8 min
completed: 2026-03-19
---

# Phase 11 Plan 03: Relocate preserved consumers off start-work hook shims Summary

**Feature-owned start-work types now back preserved runtime, control-plane, trajectory, and slash-command consumers, and the final hook-layer type shim is delete-ready by proof.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T14:50:00Z
- **Completed:** 2026-03-19T14:58:15Z
- **Tasks:** 1
- **Files modified:** 9

## Accomplishments
- Repointed every preserved `PurposeClass` or `StartWorkInput` consumer in scope to `src/features/session-entry/start-work-types.ts`
- Removed the last documented `src/**` import dependency on `src/hooks/start-work/start-work-types.ts`
- Updated the consumer-proof matrix so later delete work can remove the shim from evidence instead of intuition

## Task Commits

Each task was committed atomically:

1. **Task 1: Repoint preserved consumers away from `src/hooks/start-work/*` shims** - `8c4ce95` (fix)

**Plan metadata:** Pending

## Files Created/Modified
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md` - Reclassified `start-work-types` as `delete-now` and recorded zero remaining consumers
- `src/shared/opencode-knowledge.ts` - Imports `PurposeClass` from the feature-owned authority
- `src/recovery/recovery-types.ts` - Imports `PurposeClass` from the feature-owned authority
- `src/intelligence/doc/doc-surface-router.ts` - Imports `PurposeClass` from the feature-owned authority
- `src/features/runtime-entry/attachment.ts` - Imports `PurposeClass` from the feature-owned authority
- `src/core/trajectory/trajectory-types.ts` - Imports `PurposeClass` from the feature-owned authority
- `src/control-plane/control-plane-types.ts` - Imports `PurposeClass` and `StartWorkInput` from the feature-owned authority
- `src/control-plane/control-plane-registry.ts` - Imports `PurposeClass` and `StartWorkInput` from the feature-owned authority
- `src/commands/slash-command/command-types.ts` - Imports `PurposeClass` from the feature-owned authority

## Decisions Made
- Preserved boundaries now depend on `src/features/session-entry/start-work-types.ts` directly so the hook shim stops acting as hidden authority.
- The consumer-proof artifact is the source of truth for later shim deletion, so it was updated in the same task commit as the import relocation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc --noEmit` still reports the pre-existing `@opencode-ai/plugin` `tool` export and implicit `any` errors in `src/tools/doc/tools.ts`, `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts`; this task did not touch those files and did not introduce new typecheck failures.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The `start-work-types` shim now has zero `src/**` and `tests/**` consumers, so later delete work has explicit proof.
- Runtime-entry command-loader relocation remains separate follow-up work under the remaining Phase 11 plans.

---
*Phase: 11-runtime-context-detox-and-plugin-flattening*
*Completed: 2026-03-19*

## Self-Check: PASSED

- Found `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-03-SUMMARY.md`
- Found task commit `8c4ce95`
