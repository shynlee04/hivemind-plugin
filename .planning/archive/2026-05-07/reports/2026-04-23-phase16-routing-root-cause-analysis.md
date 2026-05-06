# GSD Phase 16/16.2 Routing Analysis & Root Cause Report
**Date:** 2026-04-23
**Session:** ses_2491958b9ffec10SwD0qOLDfkF
**Scope:** delegate-task UAT failure investigation

---

## Executive Summary

The UAT test dispatched 10 tasks via `delegate-task`. All dispatched successfully, but the **parent session did not wait for, poll for, or resume when tasks completed**. Terminal state notifications arrived as orphaned JSON messages after the parent had already finished. This is a **design-code gap**: Phase 16.2 implemented dispatch and notification, but **omitted session resumption and conversation continuity** — both explicitly out-of-scope in the 16.2 plan.

---

## 1. Observed vs Intended Routing Sequence

### What SHOULD Happen (GSD Workflow Theory)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.1 — DISPATCH                                                   │
│ User → delegate-task(tool) → DelegationManager.dispatch()              │
│    ↓                                                                    │
│ Returns: {status: "dispatched", delegationId} ← IMMEDIATE               │
│    ↓                                                                    │
│ Parent session SHOULD enter "waiting" state or auto-poll loop          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.2a — CHILD EXECUTION                                           │
│ Child session spawned → SDK prompt sent → Agent runs task              │
│    ↓                                                                    │
│ Stability polling detects idle (adaptive intervals)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.2b — COMPLETION DETECTION                                      │
│ SdkDelegationHandler.finalizeSdkDelegation()                           │
│    ↓                                                                    │
│ DelegationManager.transitionToTerminal()                               │
│    ↓                                                                    │
│ Status: "completed" | "error" | "timeout"                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.2c — RESULT CAPTURE                                            │
│ Extract result text from child session messages                        │
│ Persist to delegation record + disk                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.2d — PARENT NOTIFICATION  [IMPLEMENTED: fire-and-forget]      │
│ notifyDelegationTerminal() → client.session.prompt({noReply: true})    │
│    ↓                                                                    │
│ Parent receives JSON: {taskId, terminalState, resultSummary, duration} │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.2e — PARENT RESUMPTION  [MISSING — CRITICAL GAP]              │
│ Parent session SHOULD wake up and process the notification             │
│    ↓                                                                    │
│ Session state restored from disk (if platform stopped)                 │
│    ↓                                                                    │
│ Agent receives queued results and continues workflow                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.2f — RESULT INTEGRATION  [MISSING — CRITICAL GAP]             │
│ Parent agent processes terminal state + result summary                 │
│    ↓                                                                    │
│ Continue workflow (e.g., compile final report with ALL results)        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 16.2g — ACKNOWLEDGMENT  [MISSING]                                │
│ Optional: mark delegation as acknowledged in continuity store          │
└─────────────────────────────────────────────────────────────────────────┘
```

### What ACTUALLY Happens (Current Code)

```
User → delegate-task(tool) → Returns immediately with delegationId
    ↓
Main agent continues → compiles report → marks work complete → session ends
    ↓
[Time passes: 60s - 255s]
    ↓
Child completes → notifyDelegationTerminal() → client.session.prompt({noReply: true})
    ↓
Message injected into PARENT session history BUT:
    - Parent agent loop has exited
    - noReply: true prevents assistant response generation
    - Session is idle, no resumption trigger exists
    - Message sits as orphaned JSON in conversation history
```

---

## 2. Root Cause Analysis (The 6 Failure Modes)

### Failure 1: "Tasks are unknown of when they return" — No True Polling

**Root Cause:** `delegate-task` is fire-and-forget by design. There is no blocking mode.

**Evidence:**
- `src/tools/delegate-task.ts:55-66` — Returns immediately after `dispatch()`, before child even starts
- `src/lib/delegation-manager.ts:126-145` — Prompt delivery is `.then().catch()`, unawaited
- Tool description: *"Returns immediately with a delegation ID (always-background WaiterModel)"*

**Why this matters:** The agent has no built-in way to "wait" for a delegation. It must manually call `delegation-status` repeatedly. In the UAT test, the agent dispatched 10 tasks and then tried to compile a final report — without waiting for results.

---

### Failure 2: "Main agent off the stream before tasks return" — Session Terminates While Children Run

**Root Cause:** No lifecycle coupling between parent and child sessions.

**Evidence:**
- `src/lib/lifecycle-manager.ts:2-6` — Explicit stub: *"Plan 14-02 will replace this with a full implementation"*
- No hook prevents parent session completion while delegations are running
- `createSessionHooks` auto-loop only handles `<promise>DONE</promise>` signals, not terminal notifications

**Why this matters:** Once the main agent marks its todos complete and generates a final report, the OpenCode platform considers the session "done." When the child later completes, the parent session is idle or dead.

---

### Failure 3: "Sessions are not recorded to hard disk for resume" — No Parent Session Persistence

**Root Cause:** `continuity.ts` exists but is never called for parent session state.

**Evidence:**
- `src/lib/continuity.ts:298` — `recordSessionContinuity()` exists
- **Never called anywhere in the codebase for parent sessions**
- `hydrateFromContinuity()` only restores delegation metadata at plugin startup, not session state
- `AGENTS.md` states: *"notification-handler.ts — DEPRECATED: Dead code. WaiterModel polling replaces push notifications."*

**Why this matters:** If the platform stops processing the parent session (which happens when the agent says "I'm done"), there is no durable record of what the parent was waiting for. Even if a resumption trigger existed, there would be nothing to resume.

---

### Failure 4: "Return messages are not known if accurate but not saved to hard disk" — Results Not Persisted to Parent-Accessible Store

**Root Cause:** Notification is best-effort fire-and-forget; no queue for undelivered messages.

**Evidence:**
- `src/lib/notification-handler.ts:186-216` — `notifyDelegationTerminal()` catches errors but does not retry or queue
- `src/hooks/create-core-hooks.ts:52-76` — `replayPendingNotificationsForEvent()` **clears** `pendingNotifications` but **never replays them** (critical bug: no delivery loop)
- `pendingNotifications` array exists in continuity metadata but is **never populated** by the sender

**Why this matters:** If the parent session is not active when the notification arrives, the message is lost. The `pendingNotifications` queue was designed for this exact scenario, but the implementation is broken — it clears without replaying.

---

### Failure 5: "Returned results get sent to the front, not queued in user messages" — Notification Delivery Model

**Root Cause:** `noReply: true` on SDK prompt call.

**Evidence:**
- `src/lib/notification-handler.ts:208-210`:
```typescript
await client.session.prompt({
  path: { id: delegation.parentSessionId },
  body: { noReply: true, parts: [{ type: "text", text: message }] },
})
```
- `noReply: true` means: "Deliver this message but do NOT generate an assistant response"
- The message is appended to the session history as a standalone system/user message
- It does NOT trigger the platform to resume conversation processing

**Why this matters:** The notification arrives as a raw JSON blob in the conversation history. It doesn't look like a normal turn (user message → assistant response). It's an injected message with no conversational context.

---

### Failure 6: "Front session does not resume" — No Resumption Trigger

**Root Cause:** No mechanism exists to wake up an idle parent session when a child completes.

**Evidence:**
- `CompletionDetector` (`src/lib/completion-detector.ts`) only tracks child sessions, not parent sessions
- `createSessionHooks` auto-loop was explicitly stripped: *"Parent auto-loop stripped in 14-01 clean slate"*
- No hook listens for parent-session message arrivals to trigger resumption
- `HarnessLifecycleManager` (stub) has no `requestAutoLoopRetry()` or equivalent

**Why this matters:** Even if the notification were delivered with `noReply: false` (which would generate an assistant response), the assistant response would be generated in a vacuum — the agent wouldn't know it was supposed to be continuing a previous workflow. The session needs to be explicitly resumed with context.

---

## 3. Code-to-Symptom Map

| Symptom | File | Line | Mechanism |
|---------|------|------|-----------|
| Tool returns immediately | `src/tools/delegate-task.ts` | 55-66 | `return renderToolResult(...)` after `dispatch()` |
| No blocking mode | `src/lib/delegation-manager.ts` | 145 | `return this.buildResult(delegation)` before prompt resolves |
| Parent not notified reliably | `src/lib/notification-handler.ts` | 208 | `noReply: true` prevents resumption |
| Broken replay logic | `src/hooks/create-core-hooks.ts` | 52-76 | Clears `pendingNotifications` without replaying |
| No session persistence | `src/lib/continuity.ts` | 298 | `recordSessionContinuity()` exists but never called |
| Lifecycle manager is stub | `src/lib/lifecycle-manager.ts` | 2-6 | Comment: "Plan 14-02 will replace this" |
| Notification is best-effort | `src/lib/notification-handler.ts` | 211-215 | Try/catch logs error but doesn't queue for retry |
| No auto-loop for parent | `src/hooks/create-session-hooks.ts` | 200-201 | Comment: "Parent auto-loop stripped in 14-01 clean slate" |

---

## 4. Design Drift: What 16.2 Actually Built vs What Was Needed

### Phase 16.2 Scope (from 16.2-01-PLAN.md)

| Feature | Status in 16.2 Plan | Status in Code | Gap |
|---------|-------------------|----------------|-----|
| Dispatch + return ID | ✅ In scope | ✅ Implemented | — |
| Status polling tool | ✅ In scope | ✅ Implemented | — |
| Parent notification (fire-and-forget) | ✅ In scope | ✅ Implemented | — |
| Grace period cleanup | ✅ In scope | ⚠️ Partial (timer set but not fully wired) | Minor |
| Adaptive polling | ✅ In scope | ❌ Not implemented | P1 |
| Nesting depth limits | ✅ In scope | ❌ Not implemented | P1 |
| **Session resumption** | ❌ **Out of scope** | ❌ Not implemented | **CRITICAL** |
| **Conversation continuity** | ❌ **Out of scope** | ❌ Not implemented | **CRITICAL** |
| **Blocking/wait mode** | ❌ **Out of scope** | ❌ Not implemented | **CRITICAL** |

**The 16.2 plan explicitly excluded:**
- `continuity.ts` module split (Phase 11)
- `state.ts` singleton cleanup (Phase 11)
- Notification via webhooks/external channels (SDK call is sole surface)

**What this means:** Session resumption and conversation continuity were never part of Phase 16.2. They were supposed to be handled by "Plan 14-02" (lifecycle manager) which is still a stub.

---

## 5. The Core Architectural Tension

The harness has **two contradictory design patterns** coexisting:

1. **WaiterModel (fire-and-forget):** `delegate-task` returns immediately, background polling detects completion, parent is notified asynchronously. This is the **current** pattern.
2. **Blocking/Resume Model:** Parent session waits, persists state, resumes when child completes, integrates results into workflow. This is the **missing** pattern.

The UAT test assumed pattern #2 (or a hybrid), but the codebase implements pattern #1 only.

**The 16.2 SPEC acknowledges this tension:**
> "OpenCode's hook system is event-receiving only (`plugin.hook(event, handler)`). Plugins cannot emit custom events into the pipeline. The only viable notification path is direct SDK calls. This diverges from OMO's hook-based notification architecture."

But it does not resolve the parent-resumption gap. It says "deliver via direct SDK call with fire-and-forget" and stops there.

---

## 6. Recommended Fix Directions

### Option A: Add Blocking Mode to delegate-task (Minimal Change)

Add a `waitForCompletion` flag (default: `false` for backward compatibility):

```typescript
// In delegate-task.ts
if (args.waitForCompletion) {
  // Poll delegation-status internally until terminal state
  const result = await pollUntilTerminal(delegationId, args.safetyCeilingMs)
  return renderToolResult(success("Delegation completed", result))
}
```

**Pros:** Simple, addresses "main agent off the stream" directly
**Cons:** Blocks the tool call; parent can't do other work while waiting

### Option B: Implement Session Resumption Hook (Architectural Fix)

1. **Persist parent session state** when delegating:
   ```typescript
   recordSessionContinuity(parentSessionId, {
     status: "waiting_for_delegations",
     pendingDelegationIds: [id1, id2, ...],
     workflowContext: { ... }
   })
   ```

2. **Fix `replayPendingNotificationsForEvent()`** to actually replay messages:
   ```typescript
   for (const notification of pendingNotifications) {
     await client.session.prompt({
       path: { id: sessionID },
       body: { noReply: false, parts: [{ type: "text", text: notification }] }
     })
   }
   ```

3. **Populate `pendingNotifications`** in `notifyDelegationTerminal()` when parent is unavailable.

4. **Add session resumption trigger:** On `session.created` or `session.updated` events, check if session has `pendingDelegationIds` and enter auto-loop.

**Pros:** Proper async workflow, parent can do other work, supports session recovery
**Cons:** Requires lifecycle manager implementation (currently a stub)

### Option C: Add a "Wait for All Delegations" Tool (Mid-ground)

Add a new tool `wait-for-delegations`:
```typescript
{
  delegationIds: ["id1", "id2"],
  timeoutMs: 300000,
  returnOn: "any" | "all"
}
```

This tool blocks until the specified delegations reach terminal state (by polling internally).

**Pros:** Explicit, composable, doesn't change delegate-task behavior
**Cons:** Agent must remember to call it; doesn't solve notification queuing

### Option D: Hybrid (Recommended)

Combine A + C + partial B:

1. **Add `waitForCompletion` to `delegate-task`** (Option A) for simple use cases
2. **Add `wait-for-delegations` tool** (Option C) for batch operations
3. **Fix `pendingNotifications` replay** (Option B, partial) so notifications don't get lost
4. **Document** that session resumption is not yet supported and agents should use polling tools

---

## 7. Verification Checklist for Fixes

| # | Test | Evidence Required |
|---|------|-------------------|
| V-01 | `delegate-task` with `waitForCompletion: true` blocks until terminal state | Tool call duration >= delegation duration |
| V-02 | `wait-for-delegations` returns when all tasks complete | Status response shows all terminal |
| V-03 | Notification replay works after session restart | Pending notifications delivered on `session.created` |
| V-04 | Parent session state persisted to disk | Continuity file contains `pendingDelegationIds` |
| V-05 | `noReply: false` notifications trigger assistant response | Session produces assistant message after notification |
| V-06 | Orphaned messages no longer appear | No raw JSON in conversation history |

---

## 8. Confidence Assessment

| Claim | Confidence | Reason |
|-------|-----------|--------|
| delegate-task is fire-and-forget by design | **HIGH** | Tool description, code structure, unawaited prompt delivery |
| Parent session does not persist state | **HIGH** | `recordSessionContinuity()` exists but never called; codebase search confirms |
| Notification replay is broken | **HIGH** | `create-core-hooks.ts:52-76` clears array without loop; no delivery code |
| `noReply: true` prevents resumption | **MEDIUM-HIGH** | OpenCode SDK behavior; documented in code comments |
| Lifecycle manager was planned but never implemented | **HIGH** | `lifecycle-manager.ts` is explicit stub; references "Plan 14-02" |
| Phase 16.2 intentionally excluded session resumption | **HIGH** | `16.2-01-PLAN.md` "Out of Scope" section lists continuity and state cleanup as excluded |

---

## 9. Files Requiring Changes

| File | Change Type | Priority |
|------|-------------|----------|
| `src/tools/delegate-task.ts` | Add `waitForCompletion` parameter | P0 |
| `src/lib/delegation-manager.ts` | Add internal polling loop for blocking mode | P0 |
| `src/hooks/create-core-hooks.ts` | Fix `replayPendingNotificationsForEvent()` to actually replay | P1 |
| `src/lib/notification-handler.ts` | Populate `pendingNotifications` on delivery failure | P1 |
| `src/lib/continuity.ts` | Call `recordSessionContinuity()` when delegating | P1 |
| `src/lib/lifecycle-manager.ts` | Implement stub — session resumption logic | P2 |
| `src/tools/wait-for-delegations.ts` | New tool for batch delegation waiting | P1 |

---

*Report generated from forensic analysis of session artifacts and codebase inspection.*
*Subagent investigations: delegation flow (ses_244dcacb9ffeK86e), session persistence (ses_244dc85b5ffevInD), notification routing (ses_244dc53ceffeD8Ae).*
