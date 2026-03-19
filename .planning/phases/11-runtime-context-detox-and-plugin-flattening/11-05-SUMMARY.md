---
phase: 11-runtime-context-detox-and-plugin-flattening
plan: 05
subsystem: infra
tags: [runtime-entry, control-plane, slash-command, consumer-proof]

# Dependency graph
requires:
  - phase: 11-04
    provides: feature-owned command asset loader authority in `src/features/runtime-entry/instruction-loader.ts`
provides:
  - Preserved control-plane and slash-command loader types import the feature-owned runtime-entry loader directly.
  - Consumer proof now marks the bridge instruction-loader shim as deferred only for plugin-orchestration cleanup.
affects: [11-06, runtime-bridge, slash-command, control-plane]

# Tech tracking
tech-stack:
  added: []
  patterns: [feature-owned loader authority, consumer-proof-driven deletion]

key-files:
  created: [.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-05-SUMMARY.md]
  modified: [src/control-plane/control-plane-handler.ts, src/commands/slash-command/command-types.ts, src/commands/slash-command/command-runner.ts, .planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md]

key-decisions:
  - "Preserved control-plane and slash-command code now imports loader contracts from `src/features/runtime-entry/instruction-loader.ts` instead of the bridge shim."
  - "`src/hooks/runtime-bridge/instruction-loader.ts` stays deferred only for plugin-orchestration cleanup because preserved command flows no longer depend on it."
  - "Reduced scope skips recreating `tests/control-plane-runtime-tools.test.ts` because that test surface is absent in the current worktree and the user directed removed-surface not-found/import noise to be ignored."

patterns-established:
  - "Feature-owned loader contracts are consumed directly by preserved command flows."
  - "Phase 11 proof rows move from relocate-first to deferred only after import evidence shows preserved consumers are gone."

requirements-completed: [P11-06]

# Metrics
duration: 0 min
completed: 2026-03-19
---

# Phase 11 Plan 05: Rebind Preserved Loader Consumers Summary

**Control-plane and slash-command loader types now bind directly to the feature-owned runtime-entry loader, leaving the bridge instruction-loader shim deferred only for later plugin-orchestration cleanup.**

## Performance

- **Duration:** 0 min
- **Started:** 2026-03-19T15:18:40Z
- **Completed:** 2026-03-19T15:18:40Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Repointed preserved control-plane loader typing to `src/features/runtime-entry/instruction-loader.ts`.
- Repointed preserved slash-command preview/execution typing to the same feature-owned loader authority.
- Updated the consumer-proof matrix so `src/hooks/runtime-bridge/instruction-loader.ts` is no longer treated as a preserved command-flow dependency.

## Task Commits

Each task was committed atomically:

1. **Task 1: Repoint preserved control-plane and slash-command consumers to the feature-owned loader** - `ba3f9a4` (fix)

**Plan metadata:** `pending`

## Files Created/Modified
- `src/control-plane/control-plane-handler.ts` - points preserved control-plane handler typing at the runtime-entry loader authority.
- `src/commands/slash-command/command-types.ts` - points slash-command asset contract types at the runtime-entry loader authority.
- `src/commands/slash-command/command-runner.ts` - points slash-command execution typing at the runtime-entry loader authority.
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md` - records the bridge loader as deferred only for plugin-orchestration cleanup.
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-05-SUMMARY.md` - records reduced-scope execution, verification limits, and next-phase readiness.

## Decisions Made
- Preserved command-flow consumers should use `src/features/runtime-entry/instruction-loader.ts` directly instead of typing through `src/hooks/runtime-bridge/instruction-loader.ts`.
- The bridge loader shim is effectively delete-ready for preserved command flows, but final deletion stays with the deferred plugin-orchestration family in Plan 11-06.
- Reduced-scope execution skips recreating `tests/control-plane-runtime-tools.test.ts` because the file is absent in the current worktree and the user explicitly marked removed-surface not-found/import/type noise as ignorable.

## Deviations from Plan

Reduced scope applied per user directive.

- Skipped rewriting `tests/control-plane-runtime-tools.test.ts` because the file is absent in the current dirty worktree (`missing` from an existence check) and recreating removed test surfaces would work only to preserve a surface the user said to ignore.
- Verification fell back to import-proof evidence (`grep` on feature-owned loader imports) instead of the deleted test file.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** The remaining relevant scope was completed for preserved runtime command flows; removed/dirty test surfaces were documented instead of recreated.

## Issues Encountered
- `npx tsc --noEmit` still fails in unrelated `src/tools/doc/tools.ts`, `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts` because `@opencode-ai/plugin` currently has no exported `tool` member and those files have implicit-`any` context parameters. This is outside the reduced 11-05 scope and does not originate from the loader rebind changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for `11-06-PLAN.md` to remove plugin-orchestration survivors once `src/plugin/surface-registry.ts` and its family are addressed.
- Verification coverage for this slice should be replaced with a new focused proof only after the test surface is intentionally restored or redefined.

## Self-Check: PASSED

- FOUND: `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-05-SUMMARY.md`
- FOUND: `ba3f9a4` task commit in `git log --oneline --all`
