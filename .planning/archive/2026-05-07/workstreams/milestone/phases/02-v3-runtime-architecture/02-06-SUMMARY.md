---
phase: 02-v3-runtime-architecture
plan: 06
subsystem: runtime
tags: [runtime, injections, hooks, governance, vitest]

# Dependency graph
requires:
  - phase: 02-04
    provides: delegation lineage and continuity-backed packet state
  - phase: 02-05
    provides: recovery assessment state for resumed sessions
  - phase: 02-06
    provides: specialist routing metadata used for session-start injection
provides:
  - Conditional runtime injection evaluation for session-start and compaction flows
  - Governance-aware prompt injection suppression with auditable apply/skip decisions
  - Hook-level session-start and compaction wiring backed by one evaluator
affects: [phase-05-integration-verification, RUN-3f, INT-7e]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared injection evaluator, hook-level prompt injection aliasing, governance-driven injection suppression]

key-files:
  created: [src/lib/injection-engine.ts, tests/lib/injection-engine.test.ts]
  modified: [src/hooks/create-core-hooks.ts, src/hooks/create-session-hooks.ts, tests/hooks/create-core-hooks.test.ts]

key-decisions:
  - "Keep injection policy narrow: specialist guidance, delegation lineage, and recovery review only."
  - "Use the same evaluator for system-transform and compaction hooks, with governance blocks suppressing prompt injection instead of adding write-side side effects."

patterns-established:
  - "Shared evaluator first: derive runtime injections once, then render them in each hook context."
  - "Governance suppresses runtime injection conservatively by session block state, preserving the hooks-read/tools-write boundary."

requirements-completed: [RUN-3f]

# Metrics
duration: 9 min
completed: 2026-04-08
---

# Phase 02 Plan 06: Injection Engine Summary

**Conditional runtime injection now evaluates specialist guidance, delegation lineage, and recovery review at both session start and compaction with governance-aware audit decisions.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-08T16:06:36Z
- **Completed:** 2026-04-08T16:15:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added a deterministic injection engine that evaluates runtime context and returns auditable apply/skip decisions.
- Wired the same evaluator into session-start and compaction hooks so prompt injection is no longer compaction-only.
- Added hook coverage proving matching, blocked, and non-matching sessions behave correctly across both paths.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build conditional injection evaluator and audit log** - `4e6d8d65` (test), `ca78c2cb` (feat)
2. **Task 2: Wire session-start and compaction-time injection through the repaired hooks** - `073f151a` (test), `a3d48def` (feat)

**Plan metadata:** recorded in the final docs commit for summary/state synchronization.

_Note: TDD tasks produced RED and GREEN commits; no extra refactor commit was needed._

## Files Created/Modified
- `src/lib/injection-engine.ts` - shared runtime injection evaluator and audit log model
- `src/hooks/create-core-hooks.ts` - session-start system transform hook wiring via the evaluator
- `src/hooks/create-session-hooks.ts` - compaction-time injection wiring via the same evaluator
- `tests/lib/injection-engine.test.ts` - evaluator matching, non-matching, and governance-blocked coverage
- `tests/hooks/create-core-hooks.test.ts` - session-start and compaction hook behavior coverage

## Decisions Made
- Kept RUN-3f scoped to three policy-controlled injections so the engine stays aligned with 02-CONTEXT D-06 and does not become a second governance framework.
- Exposed both `system.transform` and `experimental.chat.system.transform` to preserve the plan wording while wiring the OpenCode-native session-start hook.
- Treated persisted governance block violations as a conservative session-level suppression signal so blocked injections never surface through either hook path.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The plan's `npx vitest run ... -x` verification form is not accepted by the repo's Vitest version, so verification was run with the equivalent supported `npx vitest run ...` command instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- RUN-3f is now implemented with session-start and compaction coverage, closing the validation warning about compaction-only injection.
- Phase 02 is ready for summary/state advancement and downstream integration verification planning.

## Self-Check: PASSED
- Verified summary and key implementation files exist on disk.
- Verified task commits `4e6d8d65`, `ca78c2cb`, `073f151a`, and `a3d48def` exist in git history.
