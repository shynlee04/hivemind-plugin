---
phase: 11-runtime-context-detox-and-plugin-flattening
plan: 04
subsystem: runtime-entry
tags: [runtime-entry, instruction-loader, slash-command, tdd]
requires:
  - phase: 11-01
    provides: consumer-proof baseline for surviving runtime/plugin paths
provides:
  - runtime-entry proof that the feature-owned instruction loader remains the authority path
  - reduced-scope init and doctor handlers that stop surfacing runtime-sync noise
affects: [phase-11, control-plane, slash-command]
tech-stack:
  added: []
  patterns: [feature-owned loader authority, reduced-scope runtime-entry handlers]
key-files:
  created: [.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-04-SUMMARY.md, .planning/phases/11-runtime-context-detox-and-plugin-flattening/deferred-items.md]
  modified: [tests/runtime-entry-contract.test.ts, src/features/runtime-entry/init.ts, src/features/runtime-entry/doctor.ts]
key-decisions:
  - "Treat src/features/runtime-entry/instruction-loader.ts as the surviving loader authority and keep runtime-entry proof focused on that path."
  - "Ignore runtime-surface sync reporting in hm-init and hm-doctor for the reduced 11-04 scope."
patterns-established:
  - "Runtime-entry proof should validate the feature-owned loader path directly instead of the bridge path."
  - "Reduced-scope Phase 11 work can strip command-sync reporting when the user marks those surfaces as noise."
requirements-completed: [P11-06]
duration: 7 min
completed: 2026-03-19
---

# Phase 11 Plan 04: Runtime-entry loader authority summary

**Runtime-entry loader proof now targets the feature-owned authority while init and doctor ignore runtime-surface sync noise in the reduced 11-04 scope.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-19T14:57:07Z
- **Completed:** 2026-03-19T15:03:46Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Rewrote `tests/runtime-entry-contract.test.ts` as a focused TDD lane for the feature-owned loader authority.
- Narrowed `src/features/runtime-entry/init.ts` so reduced-scope runtime entry no longer reports runtime-surface sync artifacts.
- Narrowed `src/features/runtime-entry/doctor.ts` the same way, keeping recovery guidance focused on preserved runtime-entry behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Move the instruction loader into `src/features/runtime-entry/` and rebind runtime-entry consumers** - `7f0c93f` (test), `33fedcd` (feat)

_Note: This TDD task used separate RED and GREEN commits._

## Files Created/Modified
- `tests/runtime-entry-contract.test.ts` - asserts the feature-owned loader path and rejects bridge-path imports inside runtime-entry consumers.
- `src/features/runtime-entry/init.ts` - removes runtime-surface sync reporting from reduced-scope bootstrap handling.
- `src/features/runtime-entry/doctor.ts` - removes runtime-surface sync reporting from reduced-scope recovery handling.
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/deferred-items.md` - logs unrelated typecheck failures left outside this plan.

## Decisions Made
- Keep the runtime-entry proof lane anchored on `src/features/runtime-entry/instruction-loader.ts` instead of re-validating removed bridge ownership.
- Treat runtime-surface sync outputs as out of scope for this reduced plan and strip them from `hm-init`/`hm-doctor` responses.

## Deviations from Plan

None - executed the reduced scope exactly as directed.

## Issues Encountered
- `npx tsc --noEmit` still fails in untouched tool files (`src/tools/doc/tools.ts`, `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, `src/tools/trajectory/tools.ts`) because of existing `@opencode-ai/plugin` tool export/type issues. Logged to `.planning/phases/11-runtime-context-detox-and-plugin-flattening/deferred-items.md` and left out of scope.
- `state advance-plan` could not parse the current-plan line in `.planning/STATE.md`, so the current-position section was updated manually after the metric and roadmap commands ran.
- `requirements mark-complete P11-06` returned `not_found`, so requirements state was left unchanged.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Runtime-entry proof is aligned to the feature-owned loader path for downstream relocation work.
- Control-plane and slash-command consumer relocation can proceed without reintroducing runtime-surface sync noise into this plan.

## Self-Check: PASSED
- Verified `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-04-SUMMARY.md` and `.planning/phases/11-runtime-context-detox-and-plugin-flattening/deferred-items.md` exist.
- Verified task commits `7f0c93f` and `33fedcd` are present in git history.
