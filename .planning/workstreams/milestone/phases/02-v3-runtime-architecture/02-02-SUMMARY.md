---
phase: 02-v3-runtime-architecture
plan: "02"
subsystem: "runtime-execution"
tags: ["execution-mode", "background-manager", "allowlist", "tdd", "delegation"]

# Dependency graph
requires:
  - phase: 01-baseline-cleanup
    provides: "Clean codebase, established test patterns"
  - phase: 02-v3-runtime-architecture/02-01
    provides: "Runtime policy module, types.ts extensions"

provides:
  - "Execution-mode classifier (classifyExecutionMode, resolveBuiltInMode)"
  - "Hardened BackgroundManager with command allowlist and cwd constraints"
  - "DEFAULT_ALLOWED_COMMANDS aligned with schema draft"
  - "Task characteristics and runtime capability types"

affects: ["plugin.ts (future: wire classifier into delegation)", "lifecycle-manager.ts (future: owned-process path)"]

# Tech tracking
tech-stack:
  added: ["src/lib/execution-mode.ts"]
  patterns: ["execution-family-classifier", "command-allowlist", "cwd-constraint"]

key-files:
  created:
    - "src/lib/execution-mode.ts"
    - "tests/lib/execution-mode.test.ts"
    - "tests/lib/background-manager-harden.test.ts"
  modified:
    - "src/lib/background-manager.ts"
    - "tests/lib/background-manager.test.ts"

key-decisions:
  - "execution-mode.ts is self-contained with no external imports (leaf module)"
  - "BackgroundManager accepts optional BackgroundManagerOptions for custom allowlists"
  - "DEFAULT_ALLOWED_COMMANDS lives in execution-mode.ts, consumed by BackgroundManager"
  - "Classifier always records rationale + capability evidence for auditing"
  - "OpenCode child sessions remain default built-in path (D-16 preference)"

requirements-completed:
  - RUN-3a

# Metrics
duration: "11 min"
completed: "2026-04-08"
---

# Phase 02 Plan 02: Hybrid Execution Mode Summary

Execution-mode classifier implementing RESEARCH D-12/D-13 auto-detection with hardened BackgroundManager enforcing command allowlist and cwd constraints per threat model T-02-05/T-02-07.

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-08T13:34:08Z
- **Completed:** 2026-04-08T13:45:15Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Implemented execution-family classifier (visible-worker vs built-in) with D-12 auto-detection
- Implemented built-in submode classifier (subsession vs owned-process) with D-13 auto-detection
- Hardened BackgroundManager with command allowlist enforcement and cwd constraint
- Failure context persisted before cleanup for parent status queryability (T-02-07)
- All 489 tests passing, typecheck clean

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Execution-mode tests** - `3981fa7c` (test)
2. **Task 1 GREEN: Execution-mode classifier** - `98b3f10f` (feat)
3. **Task 2 RED: Background hardening tests** - `3a04def6` (test)
4. **Task 2 GREEN: Hardened BackgroundManager** - `ac36fa71` (feat)

_Note: Task 1 and Task 2 refactor commits omitted — no cleanup needed_

## Files Created/Modified
- `src/lib/execution-mode.ts` - Hybrid execution-family and built-in submode classifier (D-12/D-13)
- `tests/lib/execution-mode.test.ts` - 12 tests: classification branches, rationale, auditing
- `src/lib/background-manager.ts` - Added allowlist enforcement, cwd constraint, BackgroundManagerOptions
- `tests/lib/background-manager-harden.test.ts` - 11 tests: allowlist, cwd, owned-process capture
- `tests/lib/background-manager.test.ts` - 21 existing tests still passing (backward compatible)

## Decisions Made
- **execution-mode.ts as leaf module** — no imports from other harness modules, keeping it independently testable and dependency-free
- **DEFAULT_ALLOWED_COMMANDS in execution-mode.ts** — colocated with the classifier since it defines what built-in-process can run
- **BackgroundManagerOptions extends constructor** — backward compatible: existing `new BackgroundManager()` calls work unchanged
- **OpenCode child sessions as default** — D-16 principle: prefer built-in OpenCode sessions; owned-process only fills the gap for headless/research work

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both TDD cycles completed cleanly on first pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Execution-mode classifier ready for wiring into plugin.ts composition root
- BackgroundManager hardened and ready for lifecycle-manager.ts owned-process integration
- Future plans: Wire `classifyExecutionMode()` call in `delegate-task.ts` execute path to populate execution-family metadata in `DelegationRouteResolution`
- Future plans: Add owned-process spawn path in `lifecycle-manager.ts` when classifier returns `builtin-process`

---
*Phase: 02-v3-runtime-architecture*
*Completed: 2026-04-08*
