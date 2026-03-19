---
phase: 11-runtime-context-detox-and-plugin-flattening
plan: 11
subsystem: runtime
tags: [plugin, runtime, proof, tools, compaction]
requires:
  - phase: 11-06
    provides: deleted plugin orchestration wrappers and flattened plugin exports
  - phase: 11-07
    provides: relocated runtime-entry ownership for preserved survivors
  - phase: 11-09
    provides: deleted hook wrapper families and plugin-owned prompt helpers
  - phase: 11-10
    provides: deleted start-work shim files
provides:
  - reduced-scope preserved-boundary proof for the surviving plugin/runtime surfaces
  - six-tool registration proof through the flattened `HiveMindPlugin` assembly
  - final consumer-proof notes for skipped removed-surface and agent-mirror noise
affects: [phase-11-closeout, runtime-proof, plugin-boundary]
tech-stack:
  added: []
  patterns: [direct @opencode-ai/plugin/tool imports for tool factories, reduced-scope boundary proof]
key-files:
  created: [tests/runtime-tools.test.ts, .planning/phases/11-runtime-context-detox-and-plugin-flattening/11-11-SUMMARY.md]
  modified:
    [src/tools/doc/tools.ts, src/tools/handoff/tools.ts, src/tools/task/tools.ts, src/tools/trajectory/tools.ts, .planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md]
key-decisions:
  - "Use `@opencode-ai/plugin/tool` directly for preserved tool factories so typecheck matches the installed SDK surface."
  - "Close Phase 11 with reduced-scope proof limited to surviving runtime/plugin boundaries and explicitly skip removed command/agent/schema-noise surfaces."
patterns-established:
  - "Preserved-boundary proof should target the live plugin assembly and existing surviving test surfaces instead of recreating removed wrapper-era tests."
  - "Out-of-scope parity gates must be documented explicitly when they block phase closure without touching surviving runtime/plugin behavior."
requirements-completed: [P11-07]
duration: 1 min
completed: 2026-03-19
---

# Phase 11 Plan 11: Final preserved-boundary proof Summary

**Reduced-scope runtime/plugin proof closes Phase 11 by validating the flattened plugin assembly, six preserved SDK tools, runtime-entry loader ownership, and compaction-safe runtime context delivery.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-19T15:59:04Z
- **Completed:** 2026-03-19T16:00:40Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `tests/runtime-tools.test.ts` to prove the six preserved SDK tools are registered by `HiveMindPlugin` and no deleted plugin wrappers leaked back in.
- Restored TypeScript compatibility for preserved tool factories by importing `tool` from the typed `@opencode-ai/plugin/tool` entrypoint.
- Finalized `11-CONSUMER-PROOF.md` with a reduced-scope closeout note that names skipped removed-surface proofs and the out-of-scope agent parity blocker.

## Task Commits

Each task was committed atomically:

1. **Task 1: Finalize preserved-boundary assertions for the post-flattening runtime path** - `7dae8ec` (fix)
2. **Task 2: Run the full Phase 11 green gate and finalize delete-versus-defer proof** - `2cff605` (docs)

## Files Created/Modified
- `tests/runtime-tools.test.ts` - reduced-scope proof for six preserved SDK tools and deleted-wrapper absence.
- `src/tools/doc/tools.ts` - switches the preserved doc tool factory to the typed tool entrypoint.
- `src/tools/handoff/tools.ts` - switches the preserved handoff tool factory to the typed tool entrypoint.
- `src/tools/task/tools.ts` - switches the preserved task tool factory to the typed tool entrypoint.
- `src/tools/trajectory/tools.ts` - switches the preserved trajectory tool factory to the typed tool entrypoint.
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md` - records the narrowed final proof lane and skipped out-of-scope noise.

## Decisions Made
- Used `@opencode-ai/plugin/tool` directly because the installed package types expose the helper there consistently, while the package-root import blocked `tsc` on preserved tool files.
- Treated missing `tests/control-plane-runtime-tools.test.ts` and `tests/schema-kernel-contracts.test.ts` as reduced-scope skips instead of recreating removed proof surfaces the user marked as noise.
- Treated `scripts/check-agent-registry-parity.sh` failures as out-of-scope agent mirror noise because they do not exercise surviving runtime/plugin boundaries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed preserved tool factories to match the installed plugin tool entrypoint**
- **Found during:** Task 1 (Finalize preserved-boundary assertions for the post-flattening runtime path)
- **Issue:** `npx tsc --noEmit` failed before preserved-boundary verification because four surviving tool factories imported `tool` from a package-root path that the installed types did not expose correctly.
- **Fix:** Repointed the preserved tool factories to `@opencode-ai/plugin/tool` and added runtime tool proof coverage through the flattened plugin assembly.
- **Files modified:** `src/tools/doc/tools.ts`, `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, `src/tools/trajectory/tools.ts`, `tests/runtime-tools.test.ts`
- **Verification:** `npx tsc --noEmit && npx tsx --test tests/runtime-tools.test.ts tests/runtime-entry-contract.test.ts tests/runtime-authority-live-sanity.test.ts tests/plugin-runtime.test.ts tests/plugin-assembly-smoke.test.ts -x`
- **Committed in:** `7dae8ec`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to recover the surviving tool boundary and did not broaden scope beyond the reduced proof lane requested by the user.

## Issues Encountered
- `npm test` stops in `scripts/check-agent-registry-parity.sh` because `.opencode/agents/*.md` runtime mirrors are missing. This was not treated as a Phase 11 runtime/plugin failure because the user explicitly marked agent-surface not-found noise as removable.
- `tests/control-plane-runtime-tools.test.ts` and `tests/schema-kernel-contracts.test.ts` are absent from the current worktree, so final proof stayed on the surviving runtime/plugin surfaces instead of recreating removed tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 11 runtime/plugin cleanup is closed on the surviving proof lane: typecheck, targeted runtime/plugin proofs, and the repo test suite all pass once the out-of-scope agent parity lint gate is excluded.
- Follow-up work, if desired, belongs outside this reduced plan scope: restore `.opencode/agents/*.md` runtime mirrors or retire the parity check, and decide separately whether removed control-plane/schema proof files should return.

## Self-Check

PASSED
- Found `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-11-SUMMARY.md` on disk.
- Found task commits `7dae8ec` and `2cff605` in `git log --oneline --all`.

---
*Phase: 11-runtime-context-detox-and-plugin-flattening*
*Completed: 2026-03-19*
