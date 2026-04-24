# HiveMind V3 Session Persistence & Resumption Analysis

## Executive Summary

The HiveMind harness plugin **does NOT implement parent session persistence or resumption**. When a parent session delegates tasks and then "goes off the stream," there is no mechanism to save its state to disk or to resume it when child tasks complete. Completion notifications are delivered as fire-and-forget messages that appear as orphaned messages in inactive sessions.

---

## 1. Parent Session Persistence: NONE

### Finding: No parent session state is written to disk at delegation time

The continuity store (`src/lib/continuity.ts`) provides durable JSON persistence for session records, but it is **only used for child (delegated) sessions**, never for parent sessions.

**Key evidence:**

- `recordSessionContinuity()` (continuity.ts:298) — **Never called anywhere in the codebase** for any session.
- `patchSessionContinuity()` (continuity.ts:312) — Called only for:
  - Setting lifecycle state on cancellation (lifecycle-manager.ts:102)
  - Recording compaction checkpoints (lifecycle-manager.ts:122)
  - Clearing pending notifications (create-core-hooks.ts:72)
- The `delegate-task` tool (tools/delegate-task.ts:42-71) calls `delegationManager.dispatch()` but **never records any continuity for the parent session**.
- The `spawnDelegatedSession` helper (spawner/session-creator.ts:27-45) creates the child session but does not persist parent state.

**What this means:**
When a parent session delegates 10 tasks, the parent session exists only in the OpenCode platform's memory. If the platform stops processing the parent session ("goes off the stream"), there is **no durable record on disk** of:
- What the parent session was doing
- What tasks it delegated
- What state it was in
- What it should do when children complete

---

## 2. Session Resumption: NONE

### Finding: No mechanism exists to resume a parent session when a child completes

**Key evidence:**

- `lifecycle-manager.ts` is explicitly a **stub** (lines 2-6):
  ```typescript
  /**
   * Harness lifecycle manager — minimal stub.
   *
   * Stripped to compile after 09-13 module deletion.
   * Plan 14-02 (DelegationManager) will replace this with a full implementation.
   */
  ```

- `hydrateFromContinuity()` (lifecycle-manager.ts:64-70) only restores **in-memory delegation metadata** at plugin startup:
  ```typescript
  hydrateFromContinuity(): void {
    for (const record of listSessionContinuity()) {
      if (record.metadata.delegation) {
        hydrateDelegationState(record.sessionID, record.metadata.delegation)
      }
    }
  }
  ```
  This populates `taskState.sessionDelegationMeta` and root budgets — it does NOT resume sessions.

- `recoverPending()` (delegation-manager.ts:195-214) only recovers **child delegation polling** for delegations that were in "running" or "dispatched" state when the plugin restarted. It does not touch parent sessions.

- There is **no callback, hook, or trigger** that runs when a delegation transitions to terminal state to resume its parent session.

**What this means:**
When a delegated task completes, the `DelegationManager` marks it complete and sends a notification (see section 3), but the parent session remains inactive. The platform does not know it should re-activate the parent session.

---

## 3. Completion Notification Delivery: Fire-and-Forget Orphaned Messages

### Finding: Notifications are delivered as `noReply: true` prompts that do not trigger session resumption

**The notification path:**

1. When a delegation completes, `transitionToTerminal()` (delegation-manager.ts:291-323) calls:
   ```typescript
   // R-NOTIF-01: Notify parent session of terminal state (fire-and-forget)
   void notifyDelegationTerminal(this.client, delegation)
   ```

2. `notifyDelegationTerminal()` (notification-handler.ts:186-216) sends:
   ```typescript
   export async function notifyDelegationTerminal(
     client: OpenCodeClient,
     delegation: Delegation,
   ): Promise<void> {
     const duration = delegation.completedAt
       ? delegation.completedAt - delegation.createdAt
       : Date.now() - delegation.createdAt

     const resultSummary =
       delegation.result?.slice(0, MAX_PREVIEW_LENGTH) ??
       delegation.error?.slice(0, MAX_PREVIEW_LENGTH) ??
       ""

     const message = JSON.stringify({
       taskId: delegation.id,
       terminalState: delegation.status,
       resultSummary: resultSummary || undefined,
       duration,
     })

     try {
       await client.session.prompt({
         path: { id: delegation.parentSessionId },
         body: { noReply: true, parts: [{ type: "text", text: message }] },
       })
     } catch (error) {
       console.error(
         `[Harness] Failed to notify parent session ${delegation.parentSessionId}...`
       )
     }
   }
   ```

**Critical characteristics:**

- **`noReply: true`** (line 209): This tells the platform "add this message to the session but do not generate a reply." It is a one-way injection.
- **Fire-and-forget**: The `void` prefix in `void notifyDelegationTerminal(...)` means the promise is not awaited. Delivery failure is logged but does not block the terminal transition.
- **No session resumption trigger**: There is no platform API call to "wake up" or "resume" a session. The message is simply appended to the session's message history.

**Why they appear as orphaned messages:**

If the parent session is not currently being processed by the OpenCode platform (the LLM is not actively generating a response for it), the `noReply: true` message is added to the session but:
- No agent is invoked to process it
- No auto-loop or event is triggered by it
- The session remains idle until some external event (user message, manual trigger) activates it

When the user later opens the session, they see the completion messages but the session never "picked up where it left off."

---

## 4. Relationship Between parentSessionId and childSessionId

### Finding: Clear parent-child relationship exists in delegation records, but is not leveraged for resumption

**Type definition** (types.ts:349-376):
```typescript
export interface Delegation {
  id: string
  parentSessionId: string   // The session that initiated the delegation
  childSessionId: string    // The new session created for the delegated task
  agent: string
  status: DelegationStatus
  result?: string
  error?: string
  createdAt: number
  completedAt?: number
  // ... other fields
}
```

**How the relationship is established:**

1. `delegate-task` tool gets `parentSessionId` from `context.sessionID` or `process.env.OPENCODE_SESSION_ID` (delegate-task.ts:46)
2. `DelegationManager.dispatch()` stores this as `parentSessionId` in the delegation record (delegation-manager.ts:110)
3. `spawnDelegatedSession()` creates the child session with `parentID` set to the parent (session-creator.ts:31):
   ```typescript
   const childSession = await createSession(args.client, {
     parentID: args.request.parentSessionId,
     // ...
   })
   ```

**What is tracked:**
- In-memory: `delegationsBySession` Map maps `childSessionId -> delegationId` (delegation-manager.ts:44)
- On disk: `delegations.json` persists the full delegation array including both IDs
- In continuity: Each child session may have a `SessionContinuityRecord` in `session-continuity.json`

**What is NOT tracked:**
- There is no reverse index from `parentSessionId` to its child delegations
- The parent session has no continuity record
- The parent session's "task list" or "waiting state" is not persisted

---

## 5. Gaps in Session Lifecycle Management

### Gap 1: `lifecycle-manager.ts` is a non-functional stub

**File:** `src/lib/lifecycle-manager.ts`

Multiple methods are no-ops or minimally implemented:
- `isValidTransition()` (line 39): Always returns `true`
- `noteObservedActivity()` (line 76): No-op stub
- `handleEvent()` (line 80): Only feeds the completion detector for idle detection
- `requestAutoLoopRetry()` (line 110): Just sends a prompt — no state management

The comment on line 5 states: *"Plan 14-02 (DelegationManager) will replace this with a full implementation."*

### Gap 2: `replayPendingNotificationsForEvent` does not replay anything

**File:** `src/hooks/create-core-hooks.ts` (lines 52-76)

```typescript
const replayPendingNotificationsForEvent = async (
  sessionID: string,
  eventType: string,
): Promise<void> => {
  const continuity = getSessionContinuity(sessionID)
  const pendingNotifications = continuity?.metadata.pendingNotifications ?? []
  if (pendingNotifications.length === 0) {
    return
  }

  const shouldReplay =
    (eventType === "session.created" && continuity?.metadata.lifecycle?.phase === "created") ||
    eventType === "session.updated"

  if (!shouldReplay) {
    return
  }

  // Clear pending notifications after replay attempt
  try {
    patchSessionContinuity(sessionID, { pendingNotifications: [] })
  } catch {
    // Best-effort replay
  }
}
```

**Issue:** The function checks if there are pending notifications, determines if it "should replay," and then **only clears the pending notifications array**. It never actually replays them. The notification delivery code is missing.

### Gap 3: No parent session continuity record creation

When a parent session delegates tasks, the harness should:
1. Create a continuity record for the parent session
2. Update it to reflect "waiting for N child tasks"
3. On child completion, update it and trigger resumption

None of this happens.

### Gap 4: `notifyParentSession` exists but is unused

**File:** `src/lib/notification-handler.ts` (lines 145-177)

`notifyParentSession()` is a richer notification function that supports toasts and structured `TaskNotification` objects. However, the delegation completion flow uses the simpler `notifyDelegationTerminal()` instead. The richer notification path is dead code.

### Gap 5: Session hooks only handle child auto-loop, not parent coordination

**File:** `src/hooks/create-session-hooks.ts` (lines 127-202)

The `session.idle` event hook only handles auto-loop for sessions that have a `delegationPacket` (child sessions with a plan). The comment on line 200-201 explicitly states:
```typescript
// Parent auto-loop stripped in 14-01 clean slate — tasking/* removed
// Will be restored in Plan 14-02 (DelegationManager)
```

There is no logic to handle a parent session that is waiting for delegated children to complete.

---

## Summary Table

| Mechanism | Exists? | Notes |
|-----------|---------|-------|
| Persist parent session state | ❌ NO | `recordSessionContinuity` never called for parents |
| Persist child session state | ⚠️ PARTIAL | Continuity records exist but mainly for metadata |
| Resume parent on child completion | ❌ NO | No resumption trigger or callback |
| Deliver completion notification | ✅ YES | Fire-and-forget `noReply: true` prompt |
| Notification triggers resumption | ❌ NO | `noReply: true` does not wake the session |
| Track parent-child relationship | ✅ YES | `Delegation` record has both IDs |
| Reverse child→parent lookup | ✅ YES | `delegationsBySession` Map in memory |
| Lifecycle state machine | ❌ NO | Stub implementation — all transitions allowed |
| Pending notification replay | ❌ NO | Function clears array but never replays |
| Auto-loop for parent sessions | ❌ NO | Explicitly stripped, comment says "will be restored" |

---

## Root Cause of the Reported Bug

**The chain of failure:**

1. Parent session delegates 10 tasks → 10 child sessions created
2. Parent session completes its current work → platform stops processing it ("goes off the stream")
3. **Parent session state is NOT persisted to disk** → no record of what it was waiting for
4. Child tasks complete over time
5. For each completion, `notifyDelegationTerminal()` sends a `noReply: true` message to the parent
6. **Parent session is not active** → messages accumulate but no agent processes them
7. User later views the parent session → sees orphaned completion messages
8. **Session does not resume** because there is no resumption mechanism

**The fix requires:**
1. Persist parent session state (continuity record) before/during delegation
2. Implement a "waiting for children" lifecycle phase
3. On child terminal transition, check if parent is waiting and trigger resumption
4. When parent resumes, deliver accumulated results in a coordinated manner
5. Implement proper pending notification replay (the current function is broken)

**Note:** The codebase comments repeatedly reference "Plan 14-02" as the planned implementation for these features. The current code is an intentional "clean slate" stub after module deletion.
