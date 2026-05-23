---
status: awaiting_human_verify
trigger: "Notification toast + context injection silently fail in live tests despite correct code, typecheck, build, and unit test passes"
created: 2026-05-23T00:00:00Z
updated: 2026-05-23T21:35:00Z
---

## Current Focus

hypothesis: CONFIRMED — coordinator.ts dispatch() was missing notifyParentSession() call
test: Fix applied, typecheck + build + 2415/2417 tests pass
expecting: Toast + context injection now fires when delegate-task dispatches a child
next_action: Live UAT — rebuild plugin, run delegate-task, verify toast appears in parent TUI

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

## Resolution

root_cause: Two-layer root cause: (1) ARCHITECTURAL — notification code was added to manager-runtime.ts which is dead code (coordinator.ts is always the runtime path), (2) MISSING — coordinator.ts dispatch() never calls notifyParentSession(). The session ID targeting is NOT the issue — sendPromptAsync uses explicit parentSessionID, showTuiToast is global TUI, client is global not session-scoped.
fix: Added import `notifyParentSession` from notification-handler.js to coordinator.ts. Added `if (this.deps.client) { void notifyParentSession(this.deps.client, params.parentSessionId, { sessionID, description, agent, status: "started" }) }` after lifecycle.transition("running") at line 123. Commit: 41cba301.
verification: Typecheck PASS, build PASS, 2415/2417 tests PASS (2 pre-existing failures). Live UAT pending.
files_changed: [src/coordination/delegation/coordinator.ts]
