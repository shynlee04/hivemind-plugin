---
phase: 15-delegate-task-gap-remediation-resume-delivery-rich-
plan: 04
subsystem: delegation-notification
tags: [plugin, delegation, notification, continuity, sendPromptAsync, showTuiToast]

requires:
  - phase: 15-03
    provides: DelegationManager with sendPromptAsync option type
provides:
  - Inject sendPromptAsync into DelegationManager at setupDelegationModules composition root
  - Remove redundant TUI toast from deliver callback (GAP-N1)
  - Init-time pending notification drain replaying from continuity via appendTuiPrompt (GAP-N2)
  - Fix sendPromptAsync-based chain path ignoring chainParentSessionId (pre-existing bug)
affects: [delegation-notification-lifecycle, plugin-init-flow]

tech-stack:
  added: []
  patterns:
    - Plugin init drains continuity pending notifications via fire-and-forget async
    - DelegationManager options receive sendPromptAsync closure wrapping session-api.ts

key-files:
  created: []
  modified:
    - src/plugin.ts — sendPromptAsync injection, toast removal, replayPendingDelegationNotifications
    - src/coordination/delegation/manager.ts — chain parentSessionId fix
    - tests/integration/delegation-v2-integration.test.ts — 3 RED/GREEN TDD tests

key-decisions:
  - "showTuiToast import removed from plugin.ts (plan said keep it, but noUnusedLocals: true would reject unused import — Rule 3 deviation)"
  - "replayPendingDelegationNotifications exported for testability"
  - "sendPromptAsync injection revealed pre-existing bug in manager.ts chain path — fixed inline (Rule 1)"

patterns-established:
  - "Init-time drain pattern: read continuity → iterate pending → appendTuiPrompt → clear continuity"
  - "Fire-and-forget void pattern for non-blocking plugin init operations"

requirements-completed:
  - REQ-02 (R2): Session-ended delivery + pending replay at init AND session resume
  - GAP-N1: Remove redundant TUI toast

duration: 18min
completed: 2026-05-19
---

# Phase 15 Plan 04: Pending Replay and Toast Removal

**sendPromptAsync injection into DelegationManager, init-time pending notification drain from continuity, and redundant TUI toast removal (GAP-N1, GAP-N2)**

## Performance

- **Duration:** 18 min
- **Started:** 2026-05-19T23:02:00Z
- **Completed:** 2026-05-19T23:13:00Z
- **Tasks:** 2 (RED tests + GREEN implementation)
- **Files modified:** 3

## Accomplishments

1. **Toast removal (GAP-N1):** Removed redundant `showTuiToast` call from the deliver callback in `setupDelegationModules`. The `system_reminder` block already notifies the user.
2. **sendPromptAsync injection (GAP-C2):** Injected `sendPromptAsync` closure into `DelegationManager` options at the composition root, enabling session-ended delivery.
3. **Init-time pending notification drain (GAP-N2):** Added `replayPendingDelegationNotifications` function that reads all continuity records, replays pending notifications via `appendTuiPrompt`, and clears the continuity array.
4. **Pre-existing bug fix:** The `sendPromptAsync` injection exposed a latent bug in `DelegationManager.controlDelegation` — the new sendPromptAsync-based chain/resume path ignored `chainParentSessionId`. Fixed by adding explicit `parentSessionId` override for chain actions.
5. **3 TDD RED→GREEN tests:** Verification for toast-not-called, sendPromptAsync-injected, and pending-replay-at-init.

## Task Commits

Each task was committed atomically:

1. **RED tests** - `b8fd87d8` (test)
2. **GREEN implementation** - `062f99b1` (feat)

## Files Created/Modified

- `src/plugin.ts` — `sendPromptAsync` import + injection, toast removal, `replayPendingDelegationNotifications` function + init call, `listSessionContinuity` import
- `src/coordination/delegation/manager.ts` — Fixed `parentSessionId` override for chain action in new sendPromptAsync-based code path
- `tests/integration/delegation-v2-integration.test.ts` — 3 TDD tests for toast, injection, and replay

## Decisions Made

- **showTuiToast import removed** (deviated from plan instruction to keep it) — `noUnusedLocals: true` in tsconfig would reject the unused import. Rule 3 deviation.
- **replayPendingDelegationNotifications exported** — Enables direct test verification without going through plugin init.
- **Fire-and-forget void at init** — The drain function is called with `void` to never block plugin init, matching the pattern of `recoverPending()` and session tracker init.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed chain parentSessionId in DelegationManager.controlDelegation**
- **Found during:** GREEN implementation, discovered by gatekeeping test run
- **Issue:** Injecting `sendPromptAsync` activated a new code path (lines 222-264) that creates a delegation record by spreading `...delegation`, carrying over the original `parentSessionId`. For chain actions with `chainParentSessionId`, the new delegation should use the chained parent session, not the original.
- **Fix:** Added `chainParentId` variable that reads `request.chainParentSessionId` for chain actions, and explicitly sets `parentSessionId: chainParentId` on the new record instead of spreading the original.
- **Files modified:** `src/coordination/delegation/manager.ts`
- **Verification:** `npx vitest run tests/integration/delegation-v2-integration.test.ts -t "chains active"` passes
- **Committed in:** `062f99b1` (GREEN commit)

**2. [Rule 3 - Blocking] Removed unused showTuiToast import**
- **Found during:** GREEN implementation
- **Issue:** Plan instructed to keep `showTuiToast` import. But after removing the only call site (deliver callback), the import binding is unused. TypeScript's `noUnusedLocals: true` would cause `npm run typecheck` to fail.
- **Fix:** Removed `showTuiToast` from the import statement.
- **Files modified:** `src/plugin.ts`
- **Verification:** `npm run typecheck` passes
- **Committed in:** `062f99b1` (GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both deviations necessary for correctness. No scope creep.

## Issues Encountered

- **Async race in RED test:** The deliver callback is fire-and-forget async. The toast test initially passed even with `showTuiToast` still in the code because test assertions ran before microtasks drained. Fixed by adding `await new Promise(setTimeout(resolve, 0))` to drain microtasks before the assertion.
- **Pending replay test:** The `void` fire-and-forget call at init means the test assertion runs before the async function completes. Fixed by using `vi.waitFor` to retry until `appendTuiPrompt` is called with expected text.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Notification delivery lifecycle is complete (pending replay at init + session-ended delivery + toast removed)
- DelegationManager exposed to sendPromptAsync for adjust-prompt, resume, and chain actions
- Ready for remaining gap remediation in wave 2

## Self-Check: PASSED

- [x] `showTuiToast` removed from plugin.ts (0 occurrences)
- [x] `sendPromptAsync` imported + injected (2 occurrences)
- [x] `replayPendingDelegationNotifications` defined + called at init (2 occurrences)
- [x] Commit `b8fd87d8` exists (RED tests)
- [x] Commit `062f99b1` exists (GREEN implementation)
- [x] 282/282 tests pass
- [x] `npm run typecheck` passes

---

*Phase: 15-delegate-task-gap-remediation-resume-delivery-rich-*
*Completed: 2026-05-19*
