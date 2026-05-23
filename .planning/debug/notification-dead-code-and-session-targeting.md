---
status: investigating
trigger: "Notification toast + context injection silently fail in live tests despite correct code, typecheck, build, and unit test passes"
created: 2026-05-23T00:00:00Z
updated: 2026-05-23T22:30:00Z
---

## Current Focus

hypothesis: 3 live UAT bugs identified — (1) no periodic injection, (2) console.error leaks to toast, (3) cancel fails on terminal delegation
test: Full code trace of all 3 bug root causes completed
expecting: Structured report with confirmed root causes for all 3 bugs
next_action: Produce structured investigation report, then fix bugs

## Symptoms

expected: When delegate-task dispatches a child session, parent session should see a toast notification and receive context injection via sendPromptAsync
actual: No toast, no context injection in live tests. Poll-based delegation-status works. Cancel control works.
errors: Silent failure — no errors logged
reproduction: Run any delegate-task in live OpenCode, observe parent TUI — no toast, no injection
started: Since notification-handler.ts was added to manager-runtime.ts (which is dead code)

## Eliminated

- hypothesis: notification-handler.ts has a bug in notifyParentSession
  evidence: Code is correct — sendPromptAsync uses explicit parentSessionID, showTuiToast uses global TUI API
  timestamp: 2026-05-23

- hypothesis: client is session-scoped and targets child instead of parent
  evidence: client is GLOBAL (from plugin entry), sendPromptAsync takes explicit sessionID param, showTuiToast is TUI-level (no session scoping)
  timestamp: 2026-05-23

- hypothesis: parentSessionId is incorrect in coordinator.dispatch
  evidence: TASK 1 confirmed params.parentSessionId holds correct parent session ID throughout coordinator.dispatch()
  timestamp: 2026-05-23

## Evidence

- timestamp: 2026-05-23T01
  checked: plugin.ts:205-208 composition root
  found: coordinator ALWAYS injected into DelegationManager, making manager-runtime.ts dead code
  implication: All notification code in manager-runtime.ts is unreachable at runtime

- timestamp: 2026-05-23T02
  checked: manager.ts:73-75 dispatch routing
  found: if (this.options.coordinator) return this.options.coordinator.dispatch(...) — always takes coordinator path
  implication: RuntimeDelegationManager.dispatch() in manager-runtime.ts never called

- timestamp: 2026-05-23T03
  checked: coordinator.ts:72-134 dispatch flow
  found: NO call to notifyParentSession() anywhere in coordinator.ts
  implication: Notification is architecturally missing from the actual runtime path

- timestamp: 2026-05-23T04
  checked: notification-handler.ts internal flow (TASK 2)
  found: notifyParentSession(client, parentSessionID, task) — line 217-220. sendPromptAsync uses explicit parentSessionID (line 247), showTuiToast uses client.tui.showToast (line 231)
  implication: If called, notification WOULD target correct parent session

- timestamp: 2026-05-23T05
  checked: session-api.ts SDK wrapper analysis (TASK 3)
  found: sendPromptAsync(client, sessionID, body) uses path: { id: validSessionID } (line 194-196) — explicit session targeting. showTuiToast(client, message, variant) uses client.tui.showToast({ body }) (line 232-235) — GLOBAL TUI, no session ID needed
  implication: Both APIs target correctly — sendPromptAsync to specific session, showTuiToast to active TUI

- timestamp: 2026-05-23T06
  checked: plugin.ts:205-218 client scoping (TASK 4)
  found: options.client comes from HarnessControlPlane plugin entry (line 221: { client, directory }). Single global client for entire plugin. Not session-scoped.
  implication: Client is not the problem — it's a global SDK client, and explicit sessionID params handle targeting

- timestamp: 2026-05-23T07
  checked: coordinator.ts:80-134 full dispatch path (TASK 1 + TASK 5)
  found: params.parentSessionId is correct, childSessionStarter.start() creates child, attachChildSession updates childSessionId, lifecycle.transition("running") at line 122. After line 122 there is NO notification call — goes straight to monitor.start (128) and watchDualSignal (129).
  implication: Fix point is after line 122 — add void notifyParentSession(this.deps.client, params.parentSessionId, {...}) 

- timestamp: 2026-05-23T08
  checked: Live UAT session evidence (session-ses_1aab.md)
  found: T=0s injection confirmed — `<system_reminder>Delegated task started...</system_reminder>`. NO periodic injections at T=30s/45s/60s/90s/120s/180s. Cancel returns "cannot control terminal delegation". Toast appears but leaks raw console.error text.
  implication: Fix (commit 41cba301) works for T=0s injection. 3 new bugs found during UAT.

- timestamp: 2026-05-23T09
  checked: monitor.ts DelegationMonitor polling mechanism (Bug 1 investigation)
  found: Monitor polls at 30→45→60→90→120→180s intervals. `inject` callback only calls `formatStatusLine()` → thin-line status injection. NO call to `notifyParentSession()` anywhere in monitor. `NotificationRouter.isParentFacingNotification()` only allows "success"/"failure"/"timeout" — rejects "progress". Monitor callbacks: `inject`, `onComplete`, `onFailure`, `onFirstActionDeadline`, `onAutoAbort` — NONE call notifyParentSession.
  implication: Periodic structured notification was NEVER designed. Monitor only does thin-line status, not system_reminder blocks.

- timestamp: 2026-05-23T10
  checked: notification-handler.ts:217-260 notifyParentSession() diagnostics (Bug 2 investigation)
  found: 5 console.error diagnostic calls in notifyParentSession(): (1) line 223 ENTERED, (2) line 229 toast pre-call, (3) line 234 toast catch, (4) line 245 promptAsync pre-call, (5) line 253 context injection catch. These output to stderr which leaks into TUI terminal output. formatToastMessage() is CLEAN — no [Harness] prefix. The issue is exclusively the console.error diagnostics added in commit a7afb92b.
  implication: Bug 2 root cause is diagnostic console.error calls in notifyParentSession(). Fix: remove or downgrade all 5 console.error lines.

- timestamp: 2026-05-23T11
  checked: delegation-status.ts:185-204 handleControl() + manager.ts:174-182 controlDelegation() (Bug 3 investigation)
  found: TWO guard points check isTerminal: (1) delegation-status.ts:190 — `deps.lifecycle?.isTerminal(delegation.status)` returns error "cannot control terminal delegation", (2) manager.ts:179-181 — inline `delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"` throws same error. lifecycle.ts:61-63 isTerminal checks: `"completed" || "error" || "timeout"`. Once coordinator.handleChildSessionTerminal() fires via hooks (handleSessionIdle/SessionError/SessionDeleted), delegation transitions to terminal state IMMEDIATELY. User cancel arrives AFTER this transition → blocked.
  implication: Bug 3 is a RACE CONDITION — completion hooks fire and terminalize the delegation before user's cancel command reaches handleControl(). The delegation is already terminal by the time the user tries to cancel.

## Resolution

root_cause: |
  THREE confirmed root causes from live UAT:
  
  BUG 1 (No periodic injection): BY DESIGN — periodic notifyParentSession was never implemented. 
  coordinator.ts calls notifyParentSession ONCE at dispatch (T=0s). DelegationMonitor polls at 
  30→45→60→90→120→180s but only calls this.inject() → thin-line status (formatStatusLine), 
  NOT notifyParentSession. NotificationRouter.isParentFacingNotification() only allows 
  "success"/"failure"/"timeout" — rejects "progress" type. No timer/interval anywhere in the 
  codebase triggers periodic structured notifications.
  
  BUG 2 (Toast leak log text): DIAGNOSTIC LEAK — 5 console.error calls in notifyParentSession() 
  (notification-handler.ts:223, 229, 234, 245, 253) output to stderr which leaks into TUI terminal 
  output. formatToastMessage() itself is clean — the issue is exclusively the diagnostic 
  console.error lines added during development. Fix: remove or downgrade to debug level.
  
  BUG 3 (Cancel control fails): RACE CONDITION — Two isTerminal guards block cancel:
  (1) delegation-status.ts:190 uses deps.lifecycle?.isTerminal(status), 
  (2) manager.ts:179-181 uses inline check. Both check "completed"/"error"/"timeout". 
  By the time the user's cancel command reaches handleControl(), coordinator.handleChildSessionTerminal() 
  has already fired via hooks (handleSessionIdle/Error/Deleted), transitioning the delegation to 
  terminal state. The delegation IS already terminal when cancel arrives — the guard correctly blocks 
  but the UX is wrong (user sees confusing error instead of acknowledgment).

fix: |
  BUG 1: Add periodic notifyParentSession calls in DelegationMonitor polling loop — inject callback 
  should call notifyParentSession (not just formatStatusLine) at configured intervals. Requires 
  NotificationRouter to accept "progress" type. DESIGN DECISION NEEDED on injection schedule.
  
  BUG 2: Remove all 5 console.error diagnostic lines in notification-handler.ts:223-253. 
  Replace with conditional debug logging or remove entirely.
  
  BUG 3: Two options — (A) Allow cancel on completed delegations (it becomes a no-op acknowledgment),
  or (B) Return graceful "already completed" message instead of error. Option A is safer UX.
  Also: delegation-status.ts:190 should check if action is cancel/abort and return success 
  acknowledgment for already-terminal delegations.

verification: |
  Bug 1: Rebuild, delegate-task, observe parent TUI for system_reminder at T=30s, 60s, etc.
  Bug 2: Rebuild, delegate-task, verify toast appears WITHOUT [Harness] log text leakage.
  Bug 3: Rebuild, delegate-task that completes quickly, attempt cancel, verify graceful handling.

files_changed: [src/coordination/delegation/coordinator.ts]
