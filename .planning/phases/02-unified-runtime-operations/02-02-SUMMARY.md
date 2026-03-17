---
phase: 02-unified-runtime-operations
plan: 02
subsystem: runtime
tags: [runtime, cli, control-plane, tools, contracts]

requires:
  - phase: 02-unified-runtime-operations
    provides: canonical runtime status contract and backend-owned status seam from 02-00 and 02-01
provides:
  - shared runtime-entry decision guidance for init, doctor, harness, and runtime command flows
  - focused CLI contract coverage for closeout status and next-step guidance
  - thin runtime command tool adaptation over the shared runtime-entry contract
affects: [phase-02, runtime-entry, control-plane, runtime-tools]

tech-stack:
  added: []
  patterns:
    - shared runtime-entry decision contract for closeoutStatus, nextCommand, and recommendedCommands
    - CLI and tool adapters consume shared runtime-entry guidance instead of branching locally

key-files:
  created:
    - tests/runtime-entry-contract.test.ts
  modified:
    - src/shared/contracts/runtime-status.ts
    - src/cli/init.ts
    - src/cli/doctor.ts
    - src/cli/harness.ts
    - src/tools/runtime/tools.ts
    - tests/control-plane-runtime-tools.test.ts

key-decisions:
  - "Shared runtime-entry guidance now lives in the canonical runtime-status contract layer."
  - "The runtime command tool decorates hm-init, hm-doctor, and hm-harness results with the same next-step semantics used by CLI flows."

patterns-established:
  - "Runtime entry surfaces should consume buildRuntimeEntryDecision rather than hand-roll next-command logic."
  - "Focused runtime-entry tests should assert top-level closeout and recommendation fields on CLI and tool adapters."

requirements-completed: [CTRL-04]
duration: 6 min
completed: 2026-03-17
---

# Phase 02 Plan 02: Rebind bootstrap, doctor, and harness flows to the shared runtime contract Summary

**Bootstrap, doctor, harness, and runtime-command entry flows now share one runtime-entry decision contract for closeout status and next-step guidance.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T23:40:03Z
- **Completed:** 2026-03-17T23:46:25Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added a shared runtime-entry decision contract that centralizes `closeoutStatus`, `nextCommand`, and `recommendedCommands`.
- Updated `init`, `doctor`, and `harness` CLI flows to expose the same next-step semantics.
- Aligned `hivemind_runtime_command` question-gate and runtime-entry responses with the CLI contract and added focused verification.

## Task Commits

Each task was committed atomically:

1. **Task 1: Unify runtime-entry command guidance on the shared contract** - `10f1985` (test), `0919614` (feat)
2. **Task 2: Align `hivemind_runtime_command` with the same runtime-entry contract** - `f38a761` (feat)

**Plan metadata:** pending

_Note: Task 1 followed the TDD red-green cycle._

## Files Created/Modified
- `tests/runtime-entry-contract.test.ts` - proves init and doctor expose shared runtime-entry semantics
- `src/shared/contracts/runtime-status.ts` - defines the canonical runtime-entry decision contract and helper
- `src/cli/init.ts` - returns shared closeout and recommendation fields after `hm-init`
- `src/cli/doctor.ts` - returns shared closeout and recommendation fields after `hm-doctor`
- `src/cli/harness.ts` - derives recommended commands from the shared runtime-entry decision helper
- `src/tools/runtime/tools.ts` - decorates runtime-entry tool results with the shared contract
- `tests/control-plane-runtime-tools.test.ts` - verifies runtime tool question-gate guidance remains canonical

## Decisions Made
- Moved runtime-entry decision logic into `src/shared/contracts/runtime-status.ts` so CLI and tool surfaces consume one authority seam.
- Kept tool-specific behavior limited to metadata and attach redirect wiring; next-step guidance now comes from the shared contract.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `CTRL-04` is satisfied for bootstrap, doctor, harness, and runtime-command parity.
- Phase 2 is ready for `02-03-PLAN.md`, which can extend the same backend-owned seam into workflow and event inspection.

## Self-Check: PASSED
