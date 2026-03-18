---
phase: 02-unified-runtime-operations
plan: 03
subsystem: runtime
tags: [workflow, events, opentui, zod, inspection]
requires:
  - phase: 02-unified-runtime-operations
    provides: canonical runtime status seam and Bun/OpenTUI boundary from 02-00 through 02-02
provides:
  - backend-owned workflow summary on the runtime inspection seam
  - reduced recent-event records shared across tool and TUI consumers
  - minimal OpenTUI rendering for workflow summary and recent events
affects: [Phase 2, Phase 3, OpenTUI, runtime inspection]
tech-stack:
  added: []
  patterns: [backend-owned inspection seam, reduced recent-event contracts, thin OpenTUI adapter]
key-files:
  created: [src/shared/contracts/runtime-events.ts, tests/runtime-inspection-seam.test.ts]
  modified: [src/shared/contracts/runtime-status.ts, src/sdk-supervisor/runtime-status.ts, src/tools/runtime/tools.ts, apps/opentui/src/adapters/runtime-client.ts, apps/opentui/src/views/runtime-status.tsx, apps/opentui/tests/runtime-status.test.tsx]
key-decisions:
  - "Reduce recent events into stable backend-owned records before exposing them to tools or the TUI."
  - "Scope workflow inspection to active workflow identity, gate state, and current task links instead of exposing raw workflow graphs."
patterns-established:
  - "Inspection seams publish reduced contracts from backend truth, not raw SDK event payloads."
  - "OpenTUI adapters should parse backend snapshots directly and keep presentation logic in the view layer."
requirements-completed: [INSP-03]
duration: 6 min
completed: 2026-03-18
---

# Phase 2 Plan 3: Workflow and Event Inspection Summary

**Runtime status now carries backend-owned workflow summary and reduced recent events, and the OpenTUI status screen renders that seam without interpreting raw SDK events.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T23:54:15Z
- **Completed:** 2026-03-18T00:00:22Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added a reduced `recentEvents` contract and extended runtime status with `workflowSummary`.
- Taught the backend status seam to synthesize workflow gate state and recent event records from runtime and trajectory data.
- Updated the OpenTUI adapter and status view to render compact workflow and recent-event sections from the shared contract.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add workflow summary and reduced recent-event contracts to the inspection seam** - `84c86bb` (test), `c35f95e` (feat)
2. **Task 2: Render the new inspection fields in the minimal TUI consumer only** - `1158ea3` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified
- `src/shared/contracts/runtime-events.ts` - Defines the reduced recent-event contract.
- `src/shared/contracts/runtime-status.ts` - Extends runtime status with workflow summary and recent events.
- `src/sdk-supervisor/runtime-status.ts` - Builds workflow summary and recent-event reductions from backend truth.
- `src/tools/runtime/tools.ts` - Keeps the runtime status tool aligned to the expanded inspection seam.
- `tests/runtime-inspection-seam.test.ts` - Covers workflow summary and reduced recent-event behavior.
- `apps/opentui/src/adapters/runtime-client.ts` - Parses the backend snapshot directly through the shared contract.
- `apps/opentui/src/views/runtime-status.tsx` - Renders compact workflow summary and recent-event sections.
- `apps/opentui/tests/runtime-status.test.tsx` - Verifies the OpenTUI consumer stays bound to the shared contract.

## Decisions Made
- Reduced event records keep `eventKind`, `source`, `recordedAt`, and `summary` as the stable inspection surface so the UI remains a consumer of backend truth.
- Workflow inspection stays intentionally small: workflow id, gate state, and current task identifiers are exposed now; full workflow graph detail remains deferred.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Bun was installed outside the active shell PATH**
- **Found during:** Task 2 (verification)
- **Issue:** `bun test apps/opentui` failed because the shell could not resolve `bun` even though Bun was installed at `/Users/apple/.bun/bin/bun`.
- **Fix:** Prefixed verification commands with `PATH="/Users/apple/.bun/bin:$PATH"` so the existing Bun install could be used without changing repo code.
- **Files modified:** None
- **Verification:** `PATH="/Users/apple/.bun/bin:$PATH" bun test apps/opentui` passed.
- **Committed in:** Not applicable (verification environment only)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix only unblocked local verification. Runtime inspection scope and shipped code stayed aligned to plan.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 is complete: runtime status, runtime commands, workflow summary, and recent events now flow through one backend-owned inspection seam.
- Ready for Phase 3 planning with the TUI still consuming reduced backend-owned truth.

## Self-Check: PASSED
- Verified `.planning/phases/02-unified-runtime-operations/02-03-SUMMARY.md` exists.
- Verified task commits `84c86bb`, `c35f95e`, and `1158ea3` exist in git history.
