---
phase: 11-runtime-context-detox-and-plugin-flattening
plan: 09
subsystem: plugin
tags: [plugin, hooks, runtime-context, cleanup, proof]

# Dependency graph
requires:
  - phase: 11-05
    provides: runtime-entry loader authority proof for preserved command flows
  - phase: 11-07
    provides: shared runtime shim deletions and relocation proof
  - phase: 11-08
    provides: plugin-local helper deletion proof workflow
provides:
  - Deletes dead `context-injection`, `prompt-transformation`, and `runtime-bridge` wrapper families
  - Moves surviving prompt helpers into plugin-owned modules
  - Refreshes consumer proof rows for the removed wrapper families
affects: [phase-11, plugin, hooks, consumer-proof]

# Tech tracking
tech-stack:
  added: []
  patterns: [delete-by-consumer-proof, plugin-owned-prompt-helpers]

key-files:
  created: [src/plugin/runtime-prompt.ts, src/plugin/synthetic-parts.ts, .planning/phases/11-runtime-context-detox-and-plugin-flattening/11-09-SUMMARY.md]
  modified: [.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md, src/hooks/index.ts, src/plugin/opencode-plugin.ts, src/plugin/messages-transform.ts, src/plugin/system-transform.ts, src/plugin/AGENTS.md]

key-decisions:
  - "Move surviving prompt helper ownership into src/plugin/ before deleting the hook-layer wrapper families."
  - "Delete runtime-bridge entirely once instruction-loader and bridge definitions have zero preserved consumers."

patterns-established:
  - "Consumer-proof gates wrapper deletion: proof rows change to deleted only after rg confirms zero preserved consumers."
  - "Plugin-owned prompt helpers replace hook-layer barrels when plugin assembly is the real owner."

requirements-completed: [P11-06]

# Metrics
duration: 6 min
completed: 2026-03-19
---

# Phase 11 Plan 09: Wrapper family deletion summary

**Removed dead non-start-work hook wrapper families after relocating the surviving prompt helpers into plugin-owned modules and refreshing the consumer-proof matrix.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T15:46:51Z
- **Completed:** 2026-03-19T15:52:40Z
- **Tasks:** 1
- **Files modified:** 20

## Accomplishments
- Deleted `src/hooks/context-injection/` after confirming its only remaining consumer was the bridge wrapper family.
- Deleted `src/hooks/runtime-bridge/` including the bridge-only `instruction-loader.ts` re-export.
- Relocated prompt helper ownership to `src/plugin/runtime-prompt.ts` and `src/plugin/synthetic-parts.ts`, then removed `src/hooks/prompt-transformation/`.
- Refreshed `11-CONSUMER-PROOF.md` so the three wrapper families are recorded as `deleted` with explicit proof commands.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove dead context/prompt/bridge wrapper files** - `ca7799e` (refactor)

**Plan metadata:** pending

## Files Created/Modified
- `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md` - Records the wrapper-family rows as deleted with updated evidence.
- `src/plugin/runtime-prompt.ts` - Preserved prompt packet transform now lives with plugin-owned helpers.
- `src/plugin/synthetic-parts.ts` - Preserved synthetic-part helpers now live with the plugin assembly.
- `src/plugin/opencode-plugin.ts` - Imports prompt helpers from plugin-owned modules instead of deleted hook wrappers.
- `src/hooks/index.ts` - Removes exports for deleted wrapper families.
- `src/plugin/AGENTS.md` - Updates plugin hook ownership notes to match the flattened runtime path.

## Decisions Made
- Moved `transformRuntimePrompt()` into `src/plugin/runtime-prompt.ts` because the remaining consumers are plugin-local adapters, not hook-owned behavior.
- Moved synthetic-part helpers into `src/plugin/synthetic-parts.ts` so `HiveMindPlugin` can import directly without a wrapper barrel.
- Deleted `src/hooks/runtime-bridge/instruction-loader.ts` instead of deferring it because current repo evidence showed no preserved command or test consumer remained.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc --noEmit` still reports pre-existing `@opencode-ai/plugin` tool import/type errors under `src/tools/*/tools.ts`. Per the reduced-scope instruction, these command/tool-surface issues were treated as out of scope after confirming no new wrapper-family errors remained.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 11-09 is complete and the wrapper-family cleanup proof is now explicit for downstream delete work.
- Phase 11 still has `11-11` remaining.

## Self-Check: PASSED
- Verified `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-09-SUMMARY.md` exists on disk.
- Verified task commit `ca7799e` is present in `git log --oneline --all`.

---
*Phase: 11-runtime-context-detox-and-plugin-flattening*
*Completed: 2026-03-19*
