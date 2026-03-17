---
phase: 02-unified-runtime-operations
plan: 01
subsystem: runtime-status
tags: [runtime-status, sdk-supervisor, runtime-tools, contracts, control-plane]

# Dependency graph
requires:
  - phase: 02-unified-runtime-operations
    provides: Bun/OpenTUI runtime-status contract foundation from 02-00
provides:
  - Canonical backend-owned runtime-status fields for authority and state reporting
  - Runtime status tool payload aligned to the shared contract seam
  - Focused regression coverage for canonical runtime authority serialization
affects: [02-unified-runtime-operations, apps/opentui, runtime inspection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Backend-owned runtime status reducer emits the canonical contract before tool serialization
    - Runtime status tool stays a thin adapter that only adds surface-specific command availability

key-files:
  created: []
  modified:
    - src/shared/contracts/runtime-status.ts
    - src/sdk-supervisor/runtime-status.ts
    - src/tools/runtime/tools.ts
    - src/tools/runtime/types.ts
    - tests/runtime-tools.test.ts
    - tests/control-plane-runtime-tools.test.ts

key-decisions:
  - "Canonical runtime status keeps runtime authority fields top-level while entry and QA state move into nested shared-contract records."
  - "buildRuntimeStatusSnapshot now owns runtime state assembly so hivemind_runtime_status only adds availableCommands metadata."

patterns-established:
  - "Shared-contract-first status payloads: tools consume backend reducers instead of rebuilding status fragments."
  - "Focused runtime-status assertions verify the exact authority and bootstrap fields exposed to control-plane consumers."

requirements-completed: [CTRL-03]

# Metrics
duration: 8 min
completed: 2026-03-17
---

# Phase 2 Plan 01: Runtime Status Canonicalization Summary

**Canonical runtime status now flows from the backend seam into `hivemind_runtime_status`, with shared authority fields, nested state records, and thin tool-side command reporting.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-17T23:24:51Z
- **Completed:** 2026-03-17T23:33:21Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Reworked `src/shared/contracts/runtime-status.ts` into a canonical shared contract with nested `entryState`, `qaState`, and `lineageSessionState` records.
- Extended `src/sdk-supervisor/runtime-status.ts` so `buildRuntimeStatusSnapshot()` emits the canonical status contract plus runtime, kernel, and supervisor state from one backend-owned reducer.
- Updated `src/tools/runtime/types.ts` and `src/tools/runtime/tools.ts` so `hivemind_runtime_status` serializes the backend seam directly and only adds `workflowGateState.availableCommands`.
- Added focused regression assertions in `tests/runtime-tools.test.ts` and `tests/control-plane-runtime-tools.test.ts` covering top-level `runtimeAuthority`, `serverBaseUrl`, and incomplete bootstrap serialization.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Finalize the canonical runtime-status contract on the backend seam** - `2da6f31` (test)
2. **Task 1 GREEN: Finalize the canonical runtime-status contract on the backend seam** - `985505c` (feat)
3. **Task 2: Make the runtime status tool a thin adapter over the canonical seam** - `edd5684` (refactor)

## Files Created/Modified
- `src/shared/contracts/runtime-status.ts` - Shared runtime-status contract schemas and types.
- `src/sdk-supervisor/runtime-status.ts` - Backend reducer that emits canonical status plus runtime/kernel/supervisor details.
- `src/tools/runtime/tools.ts` - Thin tool adapter that serializes backend status and surfaces available commands.
- `src/tools/runtime/types.ts` - Tool payload typing aligned to the shared runtime contract.
- `tests/runtime-tools.test.ts` - Runtime tool regression coverage for canonical authority fields.
- `tests/control-plane-runtime-tools.test.ts` - Control-plane regression coverage for incomplete bootstrap serialization.

## Decisions Made
- Kept `runtimeAuthority`, `runtimeInstanceId`, and `serverBaseUrl` as top-level shared-contract fields so CLI, tool, and UI consumers can read authority consistently.
- Moved state normalization into `buildRuntimeStatusSnapshot()` so runtime tools no longer assemble their own entry, QA, or runtime state fragments.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `CTRL-03` is now backed by one canonical runtime-status contract across backend and tool consumers.
- Ready for `02-02-PLAN.md`, which can rebind bootstrap, doctor, and harness flows to the same runtime contract seam.

## Self-Check: PASSED

- Verified `.planning/phases/02-unified-runtime-operations/02-01-SUMMARY.md` exists on disk.
- Verified task commits `2da6f31`, `985505c`, and `edd5684` exist in git history.

---
*Phase: 02-unified-runtime-operations*
*Completed: 2026-03-17*
