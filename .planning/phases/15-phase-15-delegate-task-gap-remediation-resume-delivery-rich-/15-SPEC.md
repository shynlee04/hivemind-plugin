# Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications — Specification

**Created:** 2026-05-19
**Ambiguity score:** 0.097 (gate: ≤ 0.20)
**Requirements:** 6 locked

## Goal

Delegate-task ecosystem transitions from ~65% spec compliance to ~95%+ by closing 3 critical gaps (true session resume, session-ended delivery, rich notification fields), 3 medium gaps (chain-append, adjust-prompt/change-agent tools, tools-running duration tracking), and 2 minor gaps (redundant toast, pending notification replay on session start).

## Background

Phase 14 implemented ~65% of the CP-DT-01 spec requirements. The gap analysis at `.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-GAPS-ANALYSIS-2026-05-19.md` identified 3 CRITICAL gaps, 2 MEDIUM gaps, and 2 MINOR gaps. Current state:

- **GAP-C1**: `manager.ts:167-173` resume/restart abort old delegation → dispatch **new** child session with different ID instead of reusing the existing session
- **GAP-C2**: `plugin.ts:160-166` delivery returns false when main session ended → notification persisted into continuity but **no code path replays pending notifications on session resume**
- **GAP-C3**: `notification-formatter.ts:31-36` formatDelegationNotification lacks workingDirectory/path, fileChanges, and explicit timestamp
- **GAP-M1**: `coordinator.ts:220-237` chain() creates sequential delegations without appending to completed session
- **GAP-M2**: `delegation-status.ts:11-16` DelegationControlSchema has 5 actions; missing adjust-prompt and change-agent
- **GAP-M3**: `completion-detector.ts:17` checks last tool activity >60s idle, NOT total tool activity duration >60s
- **GAP-N1**: `plugin.ts:162-164` redundant TUI toast "Delegation ${type} delivered" — noise alongside system_reminder block
- **GAP-N2**: continuity.pendingNotifications written but never read back on session start

## Requirements

1. **True session resume**: Resuming a delegation reuses the existing childSessionId instead of creating a new one.
   - Current: `manager.ts:167-173` resume/restart/chain abort old delegation → dispatch **new** child session with different ID
   - Target: Resume sends new prompt into the existing child session (via `sendPromptAsync`), preserves context from previous task, sets `resumedFrom: delegation.id` on the updated record
   - Acceptance: Resuming a completed delegation returns the same childSessionId; context from prior task rounds is visible in the resumed session

2. **Session-ended delivery + pending replay**: When the parent session has ended, pending notifications are replayed when the session resumes or at plugin init.
   - Current: `plugin.ts:160-166` deliver → if session ended → `NotificationRouter.queuePending()` persists to continuity but no replay mechanism exists
   - Target: `route()` detects parent session ended (delivery failed); plugin init or session resume triggers replay of pending notifications from continuity
   - Acceptance: Simulating a parent-session-ended scenario queues a notification; on subsequent session start/init, the notification is replayed into the TUI

3. **Rich notification with path, fileChanges, timestamp**: Notification includes working directory path, file change indicators, and explicit completion timestamp.
   - Current: `notification-formatter.ts:31-36` only has delegationId, agent, duration, toolCount, summaryPreview
   - Target: `formatDelegationNotification` accepts and renders `path` (working directory), `fileChanges` (list of modified files from completion-detector), `timestamp` (explicit completion time)
   - Acceptance: A completed delegation notification contains a working directory path, a list of changed files, and an ISO timestamp

4. **Chain-append to completed session**: Chain action appends to the existing completed child session instead of dispatching a new one.
   - Current: `coordinator.ts:220-237` chain() creates new sequential delegations; `manager.controlDelegation("chain")` abort+dispatch
   - Target: chain sends prompt into the completed child session (same as resume pattern), creates a new delegation record with `chainedFrom` reference
   - Acceptance: Chaining to a completed delegation appends to the same childSessionId; the new delegation record has `chainedFrom` pointing to the prior delegation

5. **Adjust-prompt and change-agent control actions**: Two new actions in DelegationControlSchema for mid-delegation adjustments.
   - Current: `delegation-status.ts:11-16` supports abort, cancel, restart, resume, chain — no adjust-prompt, no change-agent
   - Target: `adjust-prompt` sends supplementary prompt into running child session; `change-agent` aborts + restarts with new agent (preserving session ID if runtime allows)
   - Acceptance: Running delegation receives supplementary prompt via adjust-prompt; change-agent successfully restarts delegation with different agent name

6. **Total tool activity duration tracking**: Completion triggers only when BOTH lastToolActivity > idleThreshold AND totalToolActivityDuration > 60s.
   - Current: `completion-detector.ts:17` DEFAULT_TOOL_IDLE_MS = 60000 — checks only last tool activity idle time
   - Target: CompletionDetector tracks cumulative tool active time; completion requires both conditions (idle AND total duration > 60s)
   - Acceptance: 6 tool calls in 10s then idle for 60s does NOT trigger completion (total duration < 60s); 12 tool calls over 70s THEN 60s idle DOES trigger completion

## Boundaries

**In scope:**
- Resume/reuse childSessionId in `manager.ts` controlDelegation (fix GAP-C1)
- Pending notification replay in `plugin.ts` route() and init path (fix GAP-C2, GAP-N2)
- Additional fields in `notification-formatter.ts` NotificationFormatOptions (fix GAP-C3)
- Chain-append to completed session in `coordinator.ts` and `manager.ts` (fix GAP-M1)
- adjust-prompt and change-agent in `delegation-status.ts` DelegationControlSchema (fix GAP-M2)
- totalToolActivityDuration tracking in `completion-detector.ts` (fix GAP-M3)
- Remove redundant TUI toast in `plugin.ts` deliver callback (fix GAP-N1)

**Out of scope:**
- Live native Task UAT — deferred to integration phase (L1 runtime proof manual-only per CP-DT-01 completion)
- Background shell/PTY control-plane — covered by CP-PTY-01 phase
- Full rewrite of delegation dispatch — only surgical remediation of identified gaps
- New tools or commands — only modifications to existing interfaces

## Constraints

- Must preserve WaiterModel dispatch pattern — no breaking changes to delegation state machine
- Notification format must remain compact enough for TUI thin-line injection (< 200 chars per notification)
- Completion detector changes must not regress existing dual-signal completion semantics
- All changes must pass existing regression tests (91/91 tests for CP-DT-01)
- TypeScript strict mode, no `any` types on new/modified code
- No new dependencies

## Acceptance Criteria

- [ ] `controlDelegation("resume")` reuses childSessionId; new delegation record shows `resumedFrom`
- [ ] `controlDelegation("chain")` appends to completed child session; `chainedFrom` reference set
- [ ] Pending notifications from continuity are replayed on plugin init or session resume
- [ ] `formatDelegationNotification` output contains path, fileChanges list, and ISO timestamp
- [ ] `adjust-prompt` sends supplementary prompt to running child session
- [ ] `change-agent` aborts and restarts delegation with new agent name
- [ ] Completion detector requires totalToolActivityDuration > 60s AND idle > idleThreshold
- [ ] Redundant toast removed from plugin.ts deliver callback
- [ ] `npm run typecheck` passes clean
- [ ] All existing CP-DT-01 regression tests pass (91/91)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                    |
|--------------------|-------|------|--------|------------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | Gap analysis provides explicit targets   |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | Specific files, in/out scope per gap     |
| Constraint Clarity | 0.88  | 0.65 | ✓      | WaiterModel preservation, existing tests |
| Acceptance Criteria| 0.90  | 0.70 | ✓      | 8 pass/fail criteria + 2 build gates     |
| **Ambiguity**      | 0.097 | ≤0.20| ✓      | Gate passed — auto-selected from analysis|

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective     | Question summary                         | Decision locked                          |
|-------|-----------------|------------------------------------------|------------------------------------------|
| 1     | (auto)          | Gap analysis read from Phase 14 artifact | 3 critical + 2 medium + 2 minor gaps     |
| 2     | (auto)          | Codebase scouted for affected files      | 6 file targets identified                |
| 3     | (auto)          | Ambiguity scored from existing analysis  | 0.097 — gate passed automatically        |

*Auto mode: Source artifact `.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-GAPS-ANALYSIS-2026-05-19.md` contained sufficient requirements detail. No interactive interview needed.*

---

*Phase: 15-delegate-task-gap-remediation-resume-delivery-rich-*
*Spec created: 2026-05-19*
*Next step: /gsd-discuss-phase 15 — implementation decisions (how to build what's specified above)*
