---
phase: 02-auto-hooks-governance-mesh
plan: 02
subsystem: governance
tags: [hooks, showToast, staleness, compaction, escalation]

# Dependency graph
requires:
  - phase: 02-auto-hooks-governance-mesh
    plan: 01
    provides: [governance-signal-model, severity-baseline]
provides:
  - Event-driven stale governance on session.idle with toast escalation
  - Shared toast adapter with hybrid-language messaging and cooldown dedupe
  - Info-only compaction toast channel and IGNORED error triage formatting
affects: [session-lifecycle, event-governance, stress-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-channel-governance-feedback, sdk-safe-toast-dispatch, severity-escalation-counters]

key-files:
  created: []
  modified: [src/hooks/event-handler.ts, src/hooks/soft-governance.ts, src/hooks/compaction.ts, tests/sdk-foundation.test.ts, tests/soft-governance.test.ts, tests/integration.test.ts]

key-decisions:
  - "Use governance_counters as the single escalation source for toast severity progression"
  - "Record toast cooldown only after successful SDK dispatch to avoid suppressing first visible warnings"
  - "Route compaction feedback through the shared adapter but lock its variant to info"

patterns-established:
  - "Shared hook adapter: emitGovernanceToast for SDK-safe toast delivery + throttling"
  - "IGNORED triage payload: reason + current phase/action + suggested fix command"

# Metrics
duration: 4 min
completed: 2026-02-12
---

# Phase 2 Plan 2: Dual-Channel Toast Adapter Summary

**Event-driven stale governance and dual-channel toast routing now escalate correctly for humans while preserving agent-facing corrective messaging contracts.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T11:43:09Z
- **Completed:** 2026-02-12T11:47:39Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Wired `session.idle` to real staleness + drift checks and toast severity progression (`warning` then `error`).
- Added a shared governance toast adapter with hybrid-language guidance, SDK fallback safety, and cooldown dedupe.
- Locked compaction feedback to informational toasts and implemented IGNORED-tier triage error format.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire event-driven stale governance and human-visible toasts** - `b99e530` (feat)
2. **Task 2: Add toast adapter discipline (hybrid language, dedupe, and severity escalation)** - `374f4e2` (feat)

## Files Created/Modified
- `src/hooks/event-handler.ts` - Handles idle-driven stale/drift signal routing and info-only compaction event toast.
- `src/hooks/soft-governance.ts` - Adds shared `emitGovernanceToast`, severity progression logic, cooldown dedupe, and IGNORED triage messaging.
- `src/hooks/compaction.ts` - Emits informational compaction-context toast through shared adapter.
- `tests/sdk-foundation.test.ts` - Verifies idle escalation path and compaction info toast behavior.
- `tests/soft-governance.test.ts` - Verifies out-of-order/evidence-pressure escalation and IGNORED triage format.
- `tests/integration.test.ts` - Verifies event + compaction toast behavior end-to-end.

## Decisions Made
- Reused `governance_counters` as the common escalation ledger for both event and tool hooks.
- Enforced dedupe cooldown after successful toast dispatch (not before) so fallback mode never hides first visible toasts.
- Kept compaction transport in the same adapter pipeline but hard-pinned to `info` severity.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- GOV-04 and GOV-05 execution points are now wired and covered by tests.
- Ready for `02-03-PLAN.md` framework conflict handling and phase-goal pinning work.

## Self-Check: PASSED

- FOUND: `.planning/phases/02-auto-hooks-governance-mesh/02-02-SUMMARY.md`
- FOUND: `b99e530`
- FOUND: `374f4e2`
