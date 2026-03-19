---
phase: 11-runtime-context-detox-and-plugin-flattening
plan: 02
subsystem: plugin
tags: [opencode-plugin, runtime-context, compaction, tsx]
requires:
  - phase: 11-01
    provides: consumer-proof baselines and real-hook red tests for plugin detox
provides:
  - single authoritative `<hivemind context_version="v1">` packet renderer
  - per-turn runtime snapshot cache with explicit reset behavior
  - flattened plugin hook wiring through messages transform and compaction only
affects: [11-03, 11-06, runtime-context, plugin-assembly]
tech-stack:
  added: []
  patterns: [single-packet injection, per-turn snapshot caching, compaction packet parity]
key-files:
  created:
    - src/plugin/runtime-snapshot.ts
    - src/plugin/context-renderer.ts
    - src/plugin/route-hint.ts
    - .planning/phases/11-runtime-context-detox-and-plugin-flattening/deferred-items.md
  modified:
    - src/plugin/opencode-plugin.ts
    - tests/plugin-runtime.test.ts
    - tests/plugin-context-detox.test.ts
    - tests/plugin-assembly-smoke.test.ts
    - tests/runtime-authority-live-sanity.test.ts
key-decisions:
  - "Use `experimental.chat.messages.transform` as the only runtime injector and keep compaction as the preservation seam."
  - "Model runtime context with one canonical packet plus a minimal route hint instead of multiple overlapping emitters."
patterns-established:
  - "Plugin assembly uses `createTurnSnapshotLoader()` so repeated hook work reuses one runtime snapshot per turn."
  - "Context rendering lives in plugin-local helpers while `opencode-plugin.ts` stays focused on hook registration and composition."
requirements-completed: [P11-01, P11-02, P11-03, P11-04, P11-05]
duration: 9 min
completed: 2026-03-19
---

# Phase 11 Plan 02: Collapse plugin context emission to one cached snapshot and one authoritative packet Summary

**A single cached runtime snapshot now feeds one authoritative HiveMind context packet, one minimal route hint, and one compaction-safe plugin injection path.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-19T14:57:51Z
- **Completed:** 2026-03-19T15:07:06Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added plugin-local helpers for per-turn snapshot caching, canonical packet rendering, and minimal route hints.
- Flattened `src/plugin/opencode-plugin.ts` so `chat.message` only resets turn state while `experimental.chat.messages.transform` injects the unified packet.
- Preserved compaction survival by pushing the same authoritative packet through `experimental.session.compacting`.
- Replaced deleted local verification files with focused tests that prove the new hook contract and runtime packet behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add plugin-local snapshot and unified packet helpers** - `07ced98` (test)
2. **Task 1: Add plugin-local snapshot and unified packet helpers** - `eccd651` (feat)
3. **Task 2: Rewire the plugin to the single authoritative injector and compaction seam** - `71a50b3` (test)
4. **Task 2: Rewire the plugin to the single authoritative injector and compaction seam** - `c687ff9` (feat)

**Plan metadata:** Summary, roadmap, and state updates recorded for the completed plan.

## Files Created/Modified
- `src/plugin/runtime-snapshot.ts` - caches one runtime bindings snapshot per turn with explicit reset.
- `src/plugin/context-renderer.ts` - maps snapshot plus start-work decisions into the canonical `<hivemind context_version="v1">` packet.
- `src/plugin/route-hint.ts` - renders the minimal routed-command reminder without legacy bridge rules.
- `src/plugin/opencode-plugin.ts` - removes duplicate emitters and rewires runtime injection through one messages transform plus compaction seam.
- `tests/plugin-runtime.test.ts` - verifies packet field order and snapshot cache behavior.
- `tests/plugin-context-detox.test.ts` - verifies the route hint stays minimal.
- `tests/plugin-assembly-smoke.test.ts` - verifies the flattened hook set and runtime injection behavior.
- `tests/runtime-authority-live-sanity.test.ts` - restores the runtime authority sanity proof used by plan verification.

## Decisions Made
- Used `resolveStartWork(...)` directly from plugin assembly so routed-command decisions feed the unified packet and route hint without reviving `createPluginRuntimePlan()`.
- Kept route hints as a separate helper so the authoritative packet stays stable while optional routing reminders remain tiny and removable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored the runtime sanity verification file required by the plan gate**
- **Found during:** Task 2 (Rewire the plugin to the single authoritative injector and compaction seam)
- **Issue:** `tests/runtime-authority-live-sanity.test.ts` was deleted in the current worktree, so the plan-level verification command could not run as written.
- **Fix:** Recreated `tests/runtime-authority-live-sanity.test.ts` from the current repository authority and included it in the phase verification run.
- **Files modified:** `tests/runtime-authority-live-sanity.test.ts`
- **Verification:** `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/plugin-context-detox.test.ts tests/runtime-authority-live-sanity.test.ts -x`
- **Committed in:** `c687ff9` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix restored a required verification input without changing the planned runtime behavior.

## Issues Encountered
- `npx tsc --noEmit` still fails in untouched tool files under `src/tools/` because `@opencode-ai/plugin` no longer exports `tool` there; this pre-existing issue was logged in `.planning/phases/11-runtime-context-detox-and-plugin-flattening/deferred-items.md` and was not changed by Plan 11-02.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for `11-03-PLAN.md`; plugin runtime injection is now flattened around stable helper seams.
- Pre-existing typecheck failures outside this plan remain deferred and should be resolved before claiming a repo-wide green `npx tsc --noEmit` gate.

## Self-Check: PASSED

- Verified summary file exists on disk.
- Verified task commits `07ced98`, `eccd651`, `71a50b3`, and `c687ff9` are present in git history.
