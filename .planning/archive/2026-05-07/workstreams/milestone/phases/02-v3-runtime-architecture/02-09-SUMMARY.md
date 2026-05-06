---
phase: 02-v3-runtime-architecture
plan: 09
subsystem: infra
tags: [runtime, injections, governance, hooks, vitest]

# Dependency graph
requires:
  - phase: 02-05
    provides: durable governance rules and evaluation wiring
  - phase: 02-06
    provides: shared injection evaluator for session-start and compaction hooks
  - phase: 02-07
    provides: live runtime-policy plumbing already aligned with hook seams
provides:
  - route-aware specialist injection payloads keyed to the resolved live route
  - active governance-state suppression for session-start and compaction injections
  - per-invocation governance metadata correlation for overlapping tool calls
affects: [RUN-3e, RUN-3f, phase-02-final-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [route-derived injection payloads, active-rule injection suppression, invocation-scoped governance correlation]

key-files:
  created: []
  modified: [src/lib/injection-engine.ts, src/lib/governance-engine.ts, src/hooks/create-core-hooks.ts, src/hooks/create-session-hooks.ts, src/hooks/create-tool-guard-hooks.ts, tests/lib/injection-engine.test.ts, tests/hooks/create-core-hooks.test.ts, tests/hooks/create-session-hooks.test.ts, tests/hooks/create-tool-guard-hooks.test.ts]

key-decisions:
  - "Keep specialist guidance narrow and derive only its payload from the resolved effective agent instead of expanding the injection model."
  - "Treat only active matching block rules as injection suppressors; historical violations remain audit data, not permanent blockers."
  - "Use a per-invocation correlation seam for governance metadata and fall back to `_harnessInvocationKey` when no native request identifier is exposed."

patterns-established:
  - "Route-aware injection rendering: audit evidence stays stable while payload text/skills follow the resolved specialist lane."
  - "Active-governance suppression: shared hook logic consults live block rules without replaying violation history as policy."
  - "Invocation-scoped after-hook metadata: overlapping tool calls carry their own governance result until deterministic cleanup."

requirements-completed: [RUN-3e, RUN-3f]

# Metrics
duration: 8 min
completed: 2026-04-08
---

# Phase 02 Plan 09: Injection and governance correctness summary

**Route-aware specialist injections, active-rule suppression, and per-invocation governance metadata now close the remaining Phase 02 hook correctness gaps.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-08T18:20:30Z
- **Completed:** 2026-04-08T18:28:24Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Made specialist-route guidance render from the resolved builder, researcher, or critic lane instead of a builder-only payload.
- Replaced historical-violation injection suppression with a shared active-rule helper used by both session-start and compaction hooks.
- Correlated governance metadata to explicit invocation keys so overlapping tool calls no longer overwrite one another's after-hook reporting.

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate route-aware injection payloads for researcher, critic, and builder lanes** - `b3c300a7` (test), `c30e074a` (feat)
2. **Task 2: Replace historical injection suppression with active governance block state** - `69753b1e` (test), `c761648f` (feat)
3. **Task 3: Correlate tool-governance metadata to each invocation instead of session-only cache state** - `44d7c5e0` (test), `e4cacf58` (feat)

**Plan metadata:** Pending

_Note: TDD tasks produced RED and GREEN commits; no separate refactor commit was needed._

## Files Created/Modified
- `src/lib/injection-engine.ts` - derives specialist guidance payloads from the live effective route while preserving audit reasons/evidence.
- `src/lib/governance-engine.ts` - exposes active injection-governance block state without replaying historical violations as current policy.
- `src/hooks/create-core-hooks.ts` - uses shared active-governance suppression for session-start injection evaluation.
- `src/hooks/create-session-hooks.ts` - applies the same active-governance suppression path during compaction-time injection evaluation.
- `src/hooks/create-tool-guard-hooks.ts` - carries per-invocation governance correlation keys through before/after hook boundaries and cleans up deterministically.
- `tests/lib/injection-engine.test.ts` - protects builder, researcher, critic, and fallback specialist injection behavior.
- `tests/hooks/create-core-hooks.test.ts` - covers session-start behavior for historical-only violations and active blocking rules.
- `tests/hooks/create-session-hooks.test.ts` - covers compaction behavior for historical-only violations and active blocking rules.
- `tests/hooks/create-tool-guard-hooks.test.ts` - covers overlapping invocation correlation and deterministic cleanup.

## Decisions Made
- Kept the injection surface narrow per D-10 by changing only specialist payload rendering rather than adding new injection candidates or a second governance path.
- Centralized active injection blocking in `governance-engine.ts` so both hook factories read the same live rule state.
- Used `_harnessInvocationKey` as the explicit fallback seam for per-call governance correlation while still honoring any native request identifier when available.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Existing tool-guard tests assumed after-hook governance lookup without an invocation carrier. The implementation preserved those single-call paths with a bounded pending-key fallback while still requiring explicit per-invocation keys for overlap safety.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 02 Wave 8 is ready for final verification.
- The remaining verification surface for Phase 02 should now exercise truths 16, 17, and 18 against the live runtime hooks.

## Self-Check: PASSED

- Verified `.planning/phases/02-v3-runtime-architecture/02-09-SUMMARY.md` exists on disk.
- Verified task commits `b3c300a7`, `c30e074a`, `69753b1e`, `c761648f`, `44d7c5e0`, and `e4cacf58` exist in git history.
