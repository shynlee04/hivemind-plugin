---
phase: 09-sticky-delegation-corrective
plan: 1
subsystem: runtime
tags: [delegation, observer, completion-detector, vitest]
requires:
  - phase: 08-repair-durable-parent-observability-for-delegated-sessions
    provides: continuity-backed delegated-session truth used by the background observer
provides:
  - builtin-subsession completion now requires stable combined message and tool-call evidence
  - observer polling cadence now matches the locked 3000ms responsiveness target
  - regression coverage for idle-without-work and evidence-stability completion paths
affects: [phase-09 follow-up plans, delegated execution, background completion]
tech-stack:
  added: []
  patterns: [combined evidence stability gating, timed idle verification via CompletionDetector]
key-files:
  created: []
  modified:
    - src/lib/lifecycle-background-observer.ts
    - tests/lib/lifecycle-background-observer.test.ts
    - tests/lib/completion-detector.test.ts
key-decisions:
  - "Count combined evidence as messages plus tool-call parts before accepting idle completion."
  - "Reuse CompletionDetector as the stable-idle gate and keep builtin-subsession polling at 3000ms."
patterns-established:
  - "Observer idle completion must prove real work via session message evidence, not status alone."
  - "Regression tests should model zero-evidence idle polls and delayed stability acceptance."
requirements-completed: [PH09-01]
duration: 4 min
completed: 2026-04-10
---

> **QUARANTINED 2026-04-14:** Do not use this summary as proof of truthful async start/runtime semantics. Later forensic work showed delegated children were still being marked `running`/`started` from dispatch metadata before assistant/tool evidence proved real execution.

# Phase 09 Plan 1: Stable builtin-subsession completion Summary

**Builtin-subsession completion now waits for stable combined message and tool-call evidence before an idle child session is marked done.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-10T11:54:22Z
- **Completed:** 2026-04-10T11:58:32Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added RED regressions for zero-evidence idle polls, 3000ms cadence, and stability-reset behavior.
- Integrated `CompletionDetector` into the background observer using combined `messages.length + tool-call parts` evidence.
- Prevented builtin-subsession completion when idle is observed without any evidence of real work.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add failing stability-gate regressions for idle-without-work and combined evidence tracking** - `354dd224` (test)
2. **Task 2: Integrate CompletionDetector with combined evidence counting and 3-second polling** - `03218847` (fix)

**Plan metadata:** Pending final execution-doc commit.

## Files Created/Modified
- `src/lib/lifecycle-background-observer.ts` - adds combined-evidence counting, detector-driven stability gating, and 3000ms polling.
- `tests/lib/lifecycle-background-observer.test.ts` - covers zero-evidence idle polling, stable evidence completion, and cadence assertions.
- `tests/lib/completion-detector.test.ts` - verifies stability resets keep completion pending until the latest count settles.

## Decisions Made
- Used `getSessionMessages()` as the observer’s second completion signal so idle state alone never proves delegated work happened.
- Counted `tool-call`, `tool_call`, and `tool` parts alongside message count because tool activity is part of the delegated work evidence.
- Kept the lifecycle completion patch behind `CompletionDetector.watch()` so the observer only completes after stable evidence, not the first idle poll.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript initially inferred the combined-evidence reducer accumulator as `unknown`; tightening the reducer generic resolved the typecheck failure before the task commit.
- `requirements mark-complete PH09-01` reported `not_found`, so REQUIREMENTS.md appears not to track this Phase 09 requirement ID yet.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 09 can proceed to `09-02-PLAN.md` with the stable-evidence completion corridor hardened.
- No blockers remain for the parent-notification replay work planned next.

## Self-Check: PASSED

- Found `.planning/phases/09-sticky-delegation-corrective/09-01-SUMMARY.md` on disk.
- Verified task commits `354dd224` and `03218847` in git history.

---
*Phase: 09-sticky-delegation-corrective*
*Completed: 2026-04-10*
