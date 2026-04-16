---
phase: 12-correct-background-session-start-semantics-reconcile-phase-0
plan: 01
subsystem: infra
tags: [lifecycle, delegation, background-observer, vitest]

# Dependency graph
requires:
  - phase: 09.2-completion-detection-architecture
    provides: observer-backed start-gate and completion verification primitives used to restore truthful async lifecycle semantics
provides:
  - builtin-subsession async launches stay queued/dispatching until observer-confirmed start-gate evidence exists
  - visible-worker runners promote to running only after real worker spawn succeeds
  - regression coverage for truthful started/completed/failure ordering across async delegation paths
affects: [12-02, delegated-session-observability, lifecycle-truth]

# Tech tracking
tech-stack:
  added: []
  patterns: [observer-owned start promotion, spawn-gated visible-worker starts, pre-start failure transitions]

key-files:
  created: [src/lib/lifecycle-runner-shared.ts, .planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-01-SUMMARY.md]
  modified:
    [src/lib/lifecycle-background-observer.ts, src/lib/lifecycle-dispatcher.ts, src/lib/lifecycle-process-runner.ts, src/lib/lifecycle-state.ts, src/lib/lifecycle-tmux-runner.ts, tests/lib/delegate-task.test.ts, tests/lib/lifecycle-background-observer.test.ts, tests/lib/lifecycle-process-runner.test.ts]

key-decisions:
  - "Builtin-subsession async dispatch only proves transport acceptance; observer start-gate evidence remains the sole started authority."
  - "Visible-worker families treat successful process/pane spawn as the honest start signal and notify parents only after that transition."
  - "Queued/dispatching lifecycle phases may terminate directly into failed so cancellation and dispatch errors remain truthful before real start."

patterns-established:
  - "Observer-owned start promotion: parent-visible started reminders for builtin-subsession flows come only from background-start-gate-passed."
  - "Spawn-gated worker truth: owned-process and tmux paths patch running from actual worker creation, never queue acquisition."

requirements-completed: [PH12-01, PH12-02]

# Metrics
duration: 6 min
completed: 2026-04-14
---

# Phase 12 Plan 01: Truthful background session start semantics summary

**Async delegated children now stay pre-start until observer D-10 evidence arrives, while visible-worker runners only emit started after real worker spawn succeeds.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-14T12:43:00Z
- **Completed:** 2026-04-14T12:49:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Removed the false-start corridor where builtin-subsession async launches surfaced `running` or parent `started` from queue/transport acknowledgements.
- Restored truthful visible-worker lifecycle semantics by promoting builtin-process and tmux runners to `running` only after actual worker creation succeeds.
- Added regression coverage that locks observer-owned start promotion and prevents timeout/failure paths from backfilling fake `started` signals.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove remaining false-start promotion seams from async launch paths** - `257af50c` (fix)
2. **Task 2: Add regression coverage for truthful parent-visible start sequencing** - `91f7d2ac` (test)

## Files Created/Modified
- `src/lib/lifecycle-dispatcher.ts` - keeps builtin-subsession async launches in `queued`/`dispatching` until observer promotion.
- `src/lib/lifecycle-process-runner.ts` - promotes builtin-process work to `running` only after spawn succeeds and keeps subsession start notifications observer-owned.
- `src/lib/lifecycle-tmux-runner.ts` - promotes tmux-pane work from actual pane spawn and reuses shared async runner response helpers.
- `src/lib/lifecycle-background-observer.ts` - owns the single builtin-subsession `background-start-gate-passed` promotion and parent `started` reminder.
- `src/lib/lifecycle-state.ts` - allows truthful pre-start failure transitions from `queued`/`dispatching`.
- `src/lib/lifecycle-runner-shared.ts` - centralizes shared async runner response and patch types used by the tmux runner refactor present in the resumed worktree.
- `tests/lib/delegate-task.test.ts` - asserts parents see no `started` reminder before observer-confirmed evidence.
- `tests/lib/lifecycle-background-observer.test.ts` - verifies single running promotion and no fake started signal on timeout.
- `tests/lib/lifecycle-process-runner.test.ts` - locks owned-process spawn-as-start behavior and cancellation truth.

## Decisions Made
- Builtin-subsession async dispatch no longer counts prompt transport acknowledgement as work having started.
- Visible-worker runners keep their immediate started semantics, but only from real spawn success instead of inherited queue state.
- Lifecycle transitions now treat pre-start failures as first-class so cancellation and dispatch errors remain accurate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Allowed truthful pre-start failures from queued/dispatching states**
- **Found during:** Task 1 (Remove remaining false-start promotion seams from async launch paths)
- **Issue:** Moving builtin-subsession children to `queued`/`dispatching` caused cancellation and dispatch-error paths to hit invalid lifecycle transitions (`dispatching → failed`).
- **Fix:** Expanded the lifecycle transition map so `queued` and `dispatching` can terminate directly into `failed`.
- **Files modified:** `src/lib/lifecycle-state.ts`
- **Verification:** `CI=true npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/delegate-task.test.ts tests/lib/lifecycle-process-runner.test.ts`
- **Committed in:** `257af50c`

**2. [Rule 3 - Blocking] Included shared tmux runner helper required by resumed worktree state**
- **Found during:** Task 1 (Remove remaining false-start promotion seams from async launch paths)
- **Issue:** The resumed worktree already had `src/lib/lifecycle-tmux-runner.ts` refactored to import `src/lib/lifecycle-runner-shared.ts`; leaving that helper uncommitted would break compilation for the task1 runtime fix.
- **Fix:** Committed the shared async runner helper alongside the tmux runner start-semantics changes.
- **Files modified:** `src/lib/lifecycle-runner-shared.ts`, `src/lib/lifecycle-tmux-runner.ts`
- **Verification:** `npm run typecheck`
- **Committed in:** `257af50c`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to make the truthful start-semantics patch compile and preserve cancellation/failure behavior. No architectural scope creep.

## Issues Encountered
- The plan’s `vitest ... -x` verification command is unsupported by Vitest `v1.6.1` in this repo, so verification was run with the equivalent `vitest run` command without `-x`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 12-01 is complete and leaves builtin-subsession start promotion solely under observer control.
- Ready for `12-02-PLAN.md` once the orchestrator merges this worktree and handles shared state/roadmap writes.

## Known Stubs
None.

## Self-Check: PASSED

- Verified summary file exists at `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-01-SUMMARY.md`.
- Verified task commits `257af50c` and `91f7d2ac` exist in git history.

---
*Phase: 12-correct-background-session-start-semantics-reconcile-phase-0*
*Completed: 2026-04-14*
