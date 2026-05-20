---
phase: 18-root-cleanup-sync-boundary-sync-manifest
plan: 03
subsystem: routing
tags: [barrel, command-engine, public-api, narrowing]

requires:
  - phase: 18-root-cleanup-sync-boundary-sync-manifest
    provides: Barrel audit from RESEARCH.md identifying public vs internal functions
provides:
  - Narrowed command-engine barrel — 3 explicit named exports instead of wildcard
  - 4 internal routing functions removed from npm public API surface
affects: []

tech-stack:
  added: []
  patterns: ["Explicit named exports from barrel files instead of export *"]

key-files:
  created: []
  modified:
    - src/index.ts

key-decisions:
  - "Removed 4 internal routing functions (analyzeCommandContract, renderCommandContext, transformCommandMessages, routeCommandPreview) from public API — all accessed through executeCommandEngineAction dispatcher"
  - "Removed all internal types from command-engine barrel (previously leaked via export type *)"
  - "Preserved src/harness/ and src/kernel/ stub dirs unchanged (D-03)"

patterns-established:
  - "Command-engine barrel: only expose dispatcher + query functions, keep routing internals private"

requirements-completed: []

duration: 5 min
completed: 2026-05-21
---

# Phase 18 Plan 03: Narrow command-engine barrel — replace export * with 3 explicit named exports

**Replaced wildcard re-export (`export *`) with 3 explicit named exports in src/index.ts for the command-engine barrel, removing 4 internal routing functions and all internal types from the public npm package API surface.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-21T01:01:00Z
- **Completed:** 2026-05-21T01:06:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced `export * from "./routing/command-engine/index.js"` with 3 explicit named exports (`executeCommandEngineAction`, `listCommands`, `discoverCommandBundles`)
- Removed 4 internal routing helpers from public API: `analyzeCommandContract`, `renderCommandContext`, `transformCommandMessages`, `routeCommandPreview`
- All internal types from `command-engine/index.d.ts` no longer leak through barrel
- Zero regressions — typecheck clean, 2382/2384 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace export * with explicit named exports for command-engine barrel** - `a26caee1` (phase-18)

**Plan metadata:** See below

## Files Created/Modified

- `src/index.ts` — Line 24: replaced `export *` with `export { executeCommandEngineAction, listCommands, discoverCommandBundles }` from `./routing/command-engine/index.js`

## Decisions Made

- **Removed 4 internal functions from public API:** `analyzeCommandContract`, `renderCommandContext`, `transformCommandMessages`, `routeCommandPreview` are only accessed internally through `executeCommandEngineAction()` — confirmed via grep that no src/ or tests/ file imports them directly
- **All internal types excluded:** Previously `export type *` leaked all internal types from command-engine/index.d.ts. Now only the explicitly named functions and their associated types are part of the public surface
- **Stub dirs preserved:** `src/harness/` and `src/kernel/` remain untouched per earlier decision D-03

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Command-engine barrel narrowing complete. Ready for subsequent Phase 18 cleanup plans.

---

*Phase: 18-root-cleanup-sync-boundary-sync-manifest*
*Completed: 2026-05-21*
