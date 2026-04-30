---
phase: 02-v3-runtime-architecture
plan: 04
subsystem: runtime
tags: [session-recovery, cqrs, hooks, vitest, opencode]

# Dependency graph
requires:
  - phase: 02-01
    provides: continuity-backed runtime baselines and hook factory structure
  - phase: 02-02
    provides: policy/config seams used by the runtime core
  - phase: 02-03
    provides: delegation packet export wiring and continuity routing context
provides:
  - staleness-aware recovery assessment and resume-state framing
  - single-owner core event hook with observer fan-out
  - lifecycle-owned compaction persistence and auto-loop retry dispatch
affects: [02-05, 02-06, runtime recovery, verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [continuity-backed recovery assessment, core-hook event fan-out, lifecycle-owned write-side retries]

key-files:
  created: [src/lib/session-recovery.ts, tests/lib/session-recovery.test.ts, tests/hooks/create-core-hooks.test.ts]
  modified: [src/lib/continuity.ts, src/lib/lifecycle-manager.ts, src/hooks/create-core-hooks.ts, src/hooks/create-session-hooks.ts, src/hooks/types.ts, src/lib/state.ts, src/plugin.ts, tests/hooks/create-session-hooks.test.ts]

key-decisions:
  - "Recovery state is assessed from persisted continuity records instead of implicitly restoring live counters during hydration."
  - "createCoreHooks owns the single active event hook and fans out session observers explicitly."
  - "Compaction persistence and auto-loop retry dispatch execute through lifecycle methods, not directly inside read-side hooks."

patterns-established:
  - "Recovery Pattern: derive resume risk from persisted timestamps, warning snapshots, and delegation packet status."
  - "Hook Pattern: read-side hooks contribute observations/context while lifecycle methods perform write-side work."

requirements-completed: [RUN-3d, RUN-3h]

# Metrics
duration: 8 min
completed: 2026-04-08
---

# Phase 02 Plan 04: Session recovery and CQRS-safe hook wiring Summary

**Staleness-aware session recovery with continuity-backed warning snapshots and a single-owner event hook that routes retry/persistence work through lifecycle methods**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-08T15:18:36Z
- **Completed:** 2026-04-08T15:26:41Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added an explicit `session-recovery` module that scores recovery risk from persisted activity, warnings, and active delegation state.
- Exposed continuity-backed resume-state construction so recovery framing is no longer implicit in checkpoint restore behavior.
- Refactored hook composition so the core event path fans out observers while lifecycle methods own retry dispatch and compaction persistence/reset behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing recovery tests** - `a0a91f95` (test)
2. **Task 1 GREEN: session recovery implementation** - `ab6b8683` (feat)
3. **Task 2 RED: failing hook architecture tests** - `08fa3186` (test)
4. **Task 2 GREEN: hook/lifecycle CQRS refactor** - `cabdeb19` (fix)

_Note: This plan used TDD, so each task produced RED and GREEN commits._

## Files Created/Modified
- `src/lib/session-recovery.ts` - Defines deterministic recovery-risk assessment and resume-state builders.
- `src/lib/continuity.ts` - Exposes continuity-backed recovery-state access.
- `src/lib/lifecycle-manager.ts` - Owns retry dispatch, compaction persistence, and recovery lookup entry points.
- `src/lib/state.ts` - Adds session-stat reset support for compact/reset semantics.
- `src/hooks/create-core-hooks.ts` - Fans out the single event hook to lifecycle and observer paths.
- `src/hooks/create-session-hooks.ts` - Restricts session hooks to observation/context work and lifecycle delegation.
- `src/hooks/types.ts` - Extends hook dependencies with observer fan-out wiring.
- `src/plugin.ts` - Wires core hooks as the sole event owner and passes session observers explicitly.
- `tests/lib/session-recovery.test.ts` - Covers fresh, stale, and warning-preservation recovery cases.
- `tests/hooks/create-core-hooks.test.ts` - Verifies event fan-out behavior.
- `tests/hooks/create-session-hooks.test.ts` - Verifies CQRS-safe compaction and retry routing.

## Decisions Made
- Recovery framing now comes from `assessRecoveryRisk`/`buildRecoveryResumeState`, keeping continuity as the source of truth while avoiding implicit checkpoint restore semantics.
- The plugin now destructures the session hook `event` handler into a core-hook observer to prevent spread-order overwrite and keep event ownership auditable.
- Compaction resets live session stats after persistence through lifecycle code, while warning history remains preserved in the durable compaction checkpoint for resume review.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced unsupported Vitest `-x` usage with `--bail=1` during verification**
- **Found during:** Task 1 verification
- **Issue:** The plan's verify command used `-x`, but the repo's Vitest 1.6.1 CLI rejects that flag.
- **Fix:** Used the supported `--bail=1` equivalent for RED/GREEN and final verification runs.
- **Files modified:** None
- **Verification:** `npx vitest --help` showed `--bail` support and no `-x` option.
- **Committed in:** none (verification-only deviation)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No product scope changed; only the execution command syntax changed to match the installed Vitest CLI.

## Issues Encountered
- Vitest CLI compatibility differed from the planned command syntax; the supported `--bail=1` flag was used instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- RUN-3d recovery framing is now explicit and test-backed.
- RUN-3h compact/reset behavior now routes through lifecycle-owned write paths instead of hook-side writes.
- Ready for `02-05`.

## Self-Check: PASSED

- Found `.planning/phases/02-v3-runtime-architecture/02-04-SUMMARY.md`
- Found commits `a0a91f95`, `ab6b8683`, `08fa3186`, and `cabdeb19` in git history
