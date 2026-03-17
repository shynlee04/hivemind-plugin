---
phase: 01-runtime-authority-baseline
plan: 02
subsystem: runtime-authority
tags: [attached-sdk, runtime-routing, control-plane, live-sanity, opencode-sdk]

# Dependency graph
requires:
  - phase: 01-runtime-authority-baseline
    provides: managed runtime authority fields and status seam from 01-01
provides:
  - Attach-aware SDK context normalization from plugin server URL
  - Attach/resume routing that avoids competing hm-init bootstrap
  - Control-plane and runtime-tool redirection to hm-harness for attached authority
  - Narrow live sanity regression lane for init/attach/reuse semantics
affects: [02-unified-runtime-operations, 07-live-official-boundary-proof]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route reminder includes explicit route_disposition and runtime_authority
    - Attached runtime authority short-circuits competing bootstrap paths
    - Live sanity evidence lane separated from broader future live proof

key-files:
  created:
    - tests/runtime-authority-live-sanity.test.ts
  modified:
    - src/hooks/sdk-context.ts
    - src/hooks/start-work/start-work-router.ts
    - src/plugin/runtime-plan.ts
    - src/control-plane/control-plane-handler.ts
    - src/tools/runtime/tools.ts
    - tests/start-work-router.test.ts
    - tests/plugin-runtime.test.ts
    - tests/runtime-turn-output.test.ts
    - .planning/phases/01-runtime-authority-baseline/01-VALIDATION.md

key-decisions:
  - "When route_disposition is attach/resume, route reminders classify runtime_authority as attached-sdk."
  - "hm-init redirects to hm-harness when snapshot authority is attached-sdk and healthy."
  - "Managed runtime creation in hm-init uses ephemeral port allocation to avoid competing local port collisions during verification."

patterns-established:
  - "Attach-first routing: continuation beats bootstrap when attached authority is healthy"
  - "Narrow live sanity lane: real runtime test in Phase 1 without claiming full live proof"

requirements-completed: [CTRL-02]

# Metrics
duration: 7 min
completed: 2026-03-17
---

# Phase 1 Plan 02: Normalize Attach Semantics Summary

**Attach-aware runtime routing now reuses live OpenCode authority (`attached-sdk`) and blocks competing hm-init bootstrap, with a real narrow live sanity proof lane added for init/attach/reuse behavior.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-18T04:35:52+07:00
- **Completed:** 2026-03-17T21:43:04Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Added SDK context authority normalization from plugin `serverUrl` and surfaced attach authority in route reminder output.
- Updated start-work routing plus control-plane/runtime-tool behavior to redirect attached healthy flows away from competing `hm-init`.
- Added `tests/runtime-authority-live-sanity.test.ts` using real `createOpencode()` and updated validation lanes to explicitly mark narrow live sanity coverage.

## Task Commits

1. **Task 1: Make the SDK context and routing attach-aware** - `bd1af24` (feat)
2. **Task 2: Refuse or redirect competing bootstrap when attached authority already exists** - `18222c8` (fix)
3. **Task 3: Add the narrow live sanity lane and run the full Phase 1 closeout gate** - `60ba505` (fix)

## Files Created/Modified
- `tests/runtime-authority-live-sanity.test.ts` - Live sanity lane proving singular authority across managed init + attached reuse.
- `src/hooks/sdk-context.ts` - Added attached-sdk authority normalization helpers from plugin server URL.
- `src/hooks/start-work/start-work-router.ts` - Prefer attach/resume continuation over hm-init bootstrap for healthy attached flows.
- `src/plugin/runtime-plan.ts` - Emits `runtime_authority` and `route_disposition`; normalizes start-work input for attached context.
- `src/control-plane/control-plane-handler.ts` - Redirects hm-init when attached-sdk authority already exists; uses ephemeral managed runtime port.
- `src/tools/runtime/tools.ts` - Runtime-command guard that redirects competing hm-init requests to attach continuation guidance.
- `tests/start-work-router.test.ts` - Regression for attach-active continuation without hm-init requirement.
- `tests/plugin-runtime.test.ts` - Route reminder authority assertions for managed vs attached route output.
- `tests/runtime-turn-output.test.ts` - Regression asserting hm-init redirection on attached authority.
- `.planning/phases/01-runtime-authority-baseline/01-VALIDATION.md` - Marked narrow live sanity lane green and retained explicit future-proof evidence lane wording.

## Decisions Made
- Attach/resume route disposition is now the source for route reminder authority signaling (`attached-sdk` vs managed path).
- Control-plane init treats healthy attached authority as continuation context, not bootstrap context.
- Phase 1 keeps proof boundaries explicit: local tests + narrow live sanity now, broader full live proof deferred.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Eliminated managed runtime port collision in concurrent verification runs**
- **Found during:** Task 3
- **Issue:** Live sanity + hm-init test execution could collide on default port `4096`, causing flaky bootstrap failures.
- **Fix:** Set managed runtime creation in `runInit` to use ephemeral `serverOptions.port = 0`.
- **Files modified:** `src/control-plane/control-plane-handler.ts`
- **Verification:** Full attach suite and standalone live sanity lane passed.
- **Committed in:** `60ba505`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Improved reliability while preserving intended attach-authority behavior; no scope creep.

## Issues Encountered

Initial verification surfaced a transient runtime port collision on `4096`; resolved via ephemeral managed port assignment during `hm-init` execution.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 requirements are now complete for managed + attached authority semantics (`CTRL-01`, `CTRL-02`).
- Runtime route/status/control-plane surfaces align on attached authority handling.
- Ready to begin Phase 2 (`02-01`) unified runtime operations.

## Self-Check: PASSED

- Verified summary file exists on disk.
- Verified task commits `bd1af24`, `18222c8`, and `60ba505` exist in git history.

---
*Phase: 01-runtime-authority-baseline*
*Completed: 2026-03-17*
