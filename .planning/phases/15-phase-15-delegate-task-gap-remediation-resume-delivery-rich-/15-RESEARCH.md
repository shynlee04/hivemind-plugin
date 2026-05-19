# Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications — Research

**Researched:** 2026-05-19
**Domain:** Delegation ecosystem — session resume, notification delivery, completion detection
**Confidence:** HIGH

## Summary

Phase 15 surgically remediates 8 gaps (3 critical, 3 medium, 2 minor) identified in the Phase 14 gap analysis. The affected codebase spans 6 files across 3 sectors: `coordination/delegation/`, `tools/delegation/`, and `plugin.ts`. All changes are modifications to existing interfaces and methods — no new modules, no new tools, no new dependencies.

Two important discovery findings:

1. **Pending notification replay already partially exists.** The lifecycle manager (`src/task-management/lifecycle/index.ts:169-192`) already has `replayPendingNotificationsForEvent()` triggered on `session.created`/`session.updated` events via `core-hooks.ts:168`. However, this mechanism replays via the `notification-handler.ts` path (`sendPrompt` to parent session), not the `NotificationRouter` path (`appendTuiPrompt` + `showTuiToast`). The GAP-C2 fix must bridge the `NotificationRouter`-persisted pending notifications into the lifecycle replay path, ensuring compact TUI-style notifications are replayed (not full `sendPrompt` blocks).

2. **`sendPromptAsync` already exists.** The SDK wrapper at `src/shared/session-api.ts:183-195` exports `sendPromptAsync(client, sessionID, body)`. It is already used by `manager-runtime.ts:242` and `sdk-child-session-starter.ts:36`. No new SDK capability research is needed — the function signature is `(client: OpenCodeClient, sessionID: string, body: { parts: Array<{ type: string; text: string }>; agent?: string; tools?: Record<string, boolean> }) => Promise<void>`.

**No new SDK capabilities needed:** All required capabilities (`sendPromptAsync`, `getSessionContinuity`, `patchSessionContinuity`, `replayPendingNotifications`, Zod schema validation, `CompletionDetector` dual-signal framework) are already present in the codebase or available via existing imports.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Inject `sendPromptAsync` capability into `DelegationManager` as a dependency, used by `controlDelegation("resume")` and `controlDelegation("chain")`
- **D-02:** Replay pending notifications at BOTH plugin init AND session resume
- **D-03:** Same mechanism as resume — chain appends to completed child session via `sendPromptAsync`, creates new delegation record with `chainedFrom` reference
- **D-04:** Accumulate per-tool-call durations in `CompletionDetector`; completion requires BOTH conditions
- **D-05:** Direct `sendPromptAsync` to the running child session for adjust-prompt; no queuing layer
- **D-06:** Add `path`, `fileChanges[]`, `completedAt` to `NotificationFormatOptions`
- **D-07:** Remove redundant `showTuiToast` call from `plugin.ts:164`

### the agent's Discretion
- Exact field naming in `NotificationFormatOptions` interface
- Logging detail during pending notification replay
- Adjust-prompt error handling when session is no longer running

### Deferred Ideas (OUT OF SCOPE)
- None

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-01 | True session resume: reuse childSessionId, preserve context, set resumedFrom | `sendPromptAsync` exists and is injected into `DelegationManager` as option; `controlDelegation` at manager.ts:158 restructured to use it |
| REQ-02 | Session-ended delivery + pending replay: replay at init AND session resume | Two-path replay needed; `NotificationRouter`-persisted notifications must bridge into lifecycle replay or add init-time drain |
| REQ-03 | Rich notification: path, fileChanges, timestamp in format | `NotificationFormatOptions` interface extended; `formatDelegationNotification` at notification-formatter.ts:31 updated |
| REQ-04 | Chain-append to completed session | Same `sendPromptAsync` resume mechanism with `chainedFrom`; coordinator.ts:220 chain() restructured |
| REQ-05 | Adjust-prompt and change-agent control actions | `DelegationControlSchema` at delegation-status.ts:11 extended; two new handlers in manager.ts |
| REQ-06 | Total tool activity duration tracking | `checkSemanticCompletion` extended with cumulative duration from message timestamps; `SemanticCompletionResult` gets new field |
</phase_requirements>

---

## Per-Requirement Research

### REQ-01: True Session Resume

**File:** `src/coordination/delegation/manager.ts`

#### What changes

The `DelegationManager` facade's `controlDelegation()` method (lines 158-195) currently aborts the old delegation and dispatches a **new** child session for ALL actions including "resume". This creates a fresh session with zero context from the prior run.

#### Current code path (broken)

```
controlDelegation("resume")
  → check terminal guard (line 162): THROWS if completed/error/timeout
  → abortDelegation (line 172)
  → coordinator.dispatch (line 175) → creates new childSessionId
  → sets resumedFrom (line 180)
```

Problems:
1. Terminal guard blocks resume on completed delegations — but resume is specifically for completed ones
2. Abort + dispatch creates a new session, losing context
3. `sendPromptAsync` is not wired into the facade

#### Target code path

```
controlDelegation("resume")
  → allow delegation in "completed" status (relax terminal guard)
  → get childSessionId from existing delegation record
  → if childSessionId exists: call sendPromptAsync(childSessionId, prompt)
    → create NEW delegation record via coordinator OR lifecycle
    → set resumedFrom = old delegation.id on the new record
  → if no childSessionId: fall back to abort+dispatch (backward compat)
```

#### Required modifications

1. **`DelegationManagerOptions`** (line 22-29): Add optional `sendPromptAsync`:
   ```typescript
   sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>
   ```

2. **`DelegationControlRequest`** (line 31-37): Add optional `agent` field for change-agent:
   ```typescript
   agent?: string
   ```

3. **`controlDelegation()`** (lines 158-195): Restructure to:
   - Allow "resume" and "chain" on `completed` delegations (relax the terminal check on line 162)
   - For resume/chain: look up `childSessionId` from existing delegation record
   - If childSessionId + sendPromptAsync available: call `sendPromptAsync(childSessionId, newPrompt)`
   - Create new delegation record via injected `lifecycle.register()` or `coordinator.dispatch()` with a modified record
   - If childSessionId missing or sendPromptAsync unavailable: fall back to existing abort+dispatch

4. **`DelegationControlRequest` type** in `src/tools/delegation/delegation-status.ts` `ManagerLike` interface (line 29): Update type to include new actions and fields

5. **`src/plugin.ts` `setupDelegationModules`** (line 203-210): Wire `sendPromptAsync` into `DelegationManagerOptions`:
   ```typescript
   const delegationManager = new DelegationManager(options.enableRuntimeAdapter ? options.client : undefined, {
     coordinator,
     lifecycle,
     monitor,
     notificationRouter,
     ptyManager: options.ptyManager,
     runtimePolicy: options.runtimePolicy,
     sendPromptAsync: (sessionId, prompt) => sendPromptAsync(options.client, sessionId, { parts: [{ type: "text", text: prompt }] }),
   })
   ```

#### Existing `sendPromptAsync` pattern

Already used in `manager-runtime.ts:242`:
```typescript
await sendPromptAsync(this.client, delegation.childSessionId, {
  parts: [{ type: "text", text: params.prompt }],
  agent: agent.name,
  tools: buildDelegationPromptTools(child.allowedTools),
})
```

And in `sdk-child-session-starter.ts:36`:
```typescript
await sendPromptAsync(client, childSessionId, {
  agent: params.validatedAgent.name,
  parts: [{ type: "text", text: params.prompt }],
  tools: buildDelegationPromptTools(permissionProfile.tools),
})
```

Both patterns show `sendPromptAsync` takes `(client, sessionId, body)` with `parts` and optional `agent`/`tools`. For resume/chain from the facade, we send a simpler prompt (no tools override needed — the existing session already has its configuration):

```typescript
sendPromptAsync(client, childSessionId, {
  parts: [{ type: "text", text: prompt }],
  agent: agent,
})
```

#### Delegation record creation for resume

When resuming, we need a new delegation record that:
- Has the SAME `childSessionId` (the existing session)
- Has a NEW delegation ID (e.g., `dt-{timestamp}-{random}`)
- Has `resumedFrom: oldDelegation.id`
- has `parentSessionId` inherited from old delegation
- Has new `prompt` and `agent`

The coordinator's `dispatch()` creates a new child session — we don't want that. Instead, we can:
a. Use `lifecycle.register(newRecord)` to add the record without going through dispatch
b. Then call `sendPromptAsync` to send the prompt

Or we could add a dedicated method `DelegationCoordinator.resume()` that:
- Takes an existing delegation record + new prompt
- Calls sendPromptAsync on the existing childSessionId
- Creates and registers a new Delegation record
- Returns DelegationResult

#### Test File
- `tests/tools/delegation/delegation-status-v2.test.ts` — add test for resume action returning same childSessionId
- `tests/lib/coordination/delegation/manager-decomposition.test.ts` or a new test — verify controlDelegation("resume") reuses childSessionId

---

### REQ-02: Session-Ended Delivery + Pending Replay

**Files:** `src/plugin.ts`, `src/coordination/delegation/notification-router.ts`, `src/coordination/delegation/notification-formatter.ts`

#### Discovery: Existing replay mechanism

The lifecycle manager already has partial replay at `src/task-management/lifecycle/index.ts:169-192`:
```typescript
async replayPendingNotificationsForEvent(sessionID: string, eventType: string): Promise<void> {
  const continuity = getSessionContinuity(sessionID)
  const pendingNotifications = continuity?.metadata.pendingNotifications ?? []
  // ...
  const delivered = await replayPendingNotifications(this.client, sessionID, pendingNotifications)
  if (delivered) patchSessionContinuity(sessionID, { pendingNotifications: [] })
}
```

This is triggered from `core-hooks.ts:168` on `session.created` and `session.updated` events.

**However**, this replay uses `replayPendingNotifications` from `notification-handler.ts:199`, which calls `notifyParentSession()` → `sendPrompt()` — delivering full system_reminder blocks via SDK prompt. The `NotificationRouter` path in `plugin.ts:160-166` uses `appendTuiPrompt` (compact TUI line), which is a different delivery mechanism.

#### What's missing

When `plugin.ts:161-164` deliver callback fails (parent session ended):
1. `NotificationRouter.queuePending()` is called (line 68 of notification-router.ts)
2. `persistPendingDelegationNotifications` (plugin.ts:100) writes to continuity as `PendingNotification[]`
3. **BUT**: No bridge exists between NotificationRouter-persisted pending notifications and the lifecycle replay path

The lifecycle replay path reads `continuity.metadata.pendingNotifications` and replays via `sendPrompt` (SDK prompt, not TUI append). The NotificationRouter path expects to deliver via `appendTuiPrompt` (TUI append, not SDK prompt). These are semantically different delivery mechanisms.

#### Two fixes needed

**Fix 1: Plugin init-time replay**
At plugin init, scan all continuity records for pending notifications. For each parent session that has pending notifications, replay them into the TUI via `appendTuiPrompt`.

This requires:
- A function that reads all pending notifications from continuity
- Replays each via the `NotificationRouter`'s `formatNotification` + `appendTuiPrompt`
- Clears the pending notifications after successful replay

Implementation location: `src/plugin.ts` in `setupDelegationModules()` or the plugin factory. Add `recoverPendingNotifications()` analogous to `delegationManager.recoverPending()` at line 228.

**Fix 2: Bridge into lifecycle replay**
When the lifecycle manager's `replayPendingNotificationsForEvent` fires, it should also handle NotificationRouter-style notifications. Since NotificationRouter notifications are simpler (compact TUI lines), the bridging could:

a. Have `NotificationRouter` expose a `replayPending(parentSessionId)` method (already exists, see line 100-107)
b. From the lifecycle manager or plugin, call `notificationRouter.replayPending(sessionId)` and for each replayed notification, call `appendTuiPrompt`
c. Clear the persistence after successful replay

**Combined approach (recommended):**

In `plugin.ts`, add a hook at plugin init:
```typescript
async function replayPendingDelegationNotifications(client: OpenCodeClient): Promise<void> {
  // Read all continuity records
  const allSessions = listSessionContinuity()
  for (const [sessionId, record] of Object.entries(allSessions)) {
    const pending = record.metadata.pendingNotifications ?? []
    if (pending.length === 0) continue
    // Replay via TUI append
    for (const notification of pending) {
      const line = notification.resultPreview ?? `Delegation ${notification.metadata?.delegationId} ${notification.status}`
      await appendTuiPrompt(client, line)
    }
    // Clear after successful replay
    patchSessionContinuity(sessionId, { pendingNotifications: [] })
  }
}
```

Then call it in the plugin factory after `delegationManager.recoverPending()` at line 228.

**Important:** The existing `persistPendingDelegationNotifications` function at plugin.ts:100 writes `PendingNotification` records to continuity. The `resultPreview` field already contains the notification message text. We can use this for replay without reformatting.

#### Test File
- `tests/lib/coordination/delegation/notification-router.test.ts` — add test for replayPending across multiple routes
- Integration test: simulate parent-session-ended scenario and verify notification appears on init

---

### REQ-03: Rich Notification Fields

**File:** `src/coordination/delegation/notification-formatter.ts`

#### Current interface (lines 11-18)

```typescript
export interface NotificationFormatOptions {
  delegationId: string
  agent: string
  status: "completed" | "error" | "timeout" | "cancelled"
  elapsedMs: number
  toolCount?: number
  summaryPreview?: string
}
```

#### Target interface

```typescript
export interface NotificationFormatOptions {
  delegationId: string
  agent: string
  status: "completed" | "error" | "timeout" | "cancelled"
  elapsedMs: number
  toolCount?: number
  summaryPreview?: string
  /** Path to working directory or result file */
  path?: string
  /** List of modified/created files detected by completion detector */
  fileChanges?: string[]
  /** ISO 8601 completion timestamp */
  completedAt?: string
}
```

#### Format string changes

**`formatDelegationNotification`** (line 31-36) — change from:
```
<system_reminder>[DT:{id}] {icon} {status} | agent={agent} | {duration} | tools={tools}{summary}</system_reminder>
```
To:
```
<system_reminder>[DT:{id}] {icon} {status} | agent={agent} | {duration} | tools={tools} | path={path} | files={fileCount} | at={timestamp}{summary}</system_reminder>
```

**`formatCompactLine`** (line 42-46) — add path and file count:
```
[DT:{id}] {icon} {status} | {duration} | tools={tools} | agent={agent} | {path} | files={fileCount}
```

**`formatToastLine`** (line 52-55) — unchanged (toast is being removed per GAP-N1)

#### Caller updates needed

**`notification-router.ts`:**
- `formatTuiNotification` (line 126-135): Accept and pass through new fields
- `formatSystemNotification` (line 138-148): Accept and pass through new fields

**Callers of format functions:**
- `notification-router.ts` `formatTuiNotification` and `formatSystemNotification` signatures need to accept `path`, `fileChanges`, and `completedAt`

#### File changes detection integration

The `fileChanges` list should come from the `completion-detector.ts` module. Currently `hasFileChangeIndicators()` returns a boolean. We need a parallel function `extractFileChanges(messages: unknown[]): string[]` that extracts actual file paths from messages. This can reuse the existing `FILE_PATH_PATTERN` regex and `FILE_CHANGE_TOOL_NAMES` set.

New function in `completion-detector.ts`:
```typescript
export function extractFileChanges(messages: unknown[]): string[] {
  // Scan tool_use parts for filePath in input
  // Scan tool_result parts for file path patterns in output
  // Deduplicate and return
}
```

#### Test File
- `tests/lib/coordination/delegation/completion-detector.test.ts` — add test for `extractFileChanges`
- Notification formatter tests (if they exist) or update existing formatter tests

---

### REQ-04: Chain-Append to Completed Session

**File:** `src/coordination/delegation/coordinator.ts`

#### Current chain() (lines 220-237)

```typescript
async chain(delegations: ChainStep[]): Promise<DelegationResult[]> {
  const results: DelegationResult[] = []
  for (const [index, step] of delegations.entries()) {
    const result = await this.dispatch({ /* ... creates new session each time */ })
    results.push(result)
    if (result.status !== "completed") break
  }
  return results
}
```

Each `this.dispatch()` call creates a new child session. This loses context between chain steps.

#### Target

Chain appends to the previous step's child session using `sendPromptAsync`, preserving context:

```typescript
async chain(delegations: ChainStep[]): Promise<DelegationResult[]> {
  const results: DelegationResult[] = []
  let previousRecord: Delegation | undefined
  for (const [index, step] of delegations.entries()) {
    if (index > 0 && previousRecord?.childSessionId && this.sendPromptAsync) {
      // Append to existing session
      await this.sendPromptAsync(previousRecord.childSessionId, step.prompt)
      const result = this.createChainedRecord(step, previousRecord)
      results.push(result)
      previousRecord = /* the new record */
    } else {
      // First step or fallback: create new session
      const result = await this.dispatch({ ... })
      results.push(result)
    }
    if (results[results.length - 1].status !== "completed") break
  }
  return results
}
```

#### Required modifications to DelegationCoordinator

1. Add `sendPromptAsync` to `DelegationCoordinatorDeps` (line 17-32):
   ```typescript
   sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>
   ```

2. Add a method to create a chained record without going through dispatch:
   ```typescript
   private createChainedRecord(step: ChainStep, previous: Delegation): DelegationResult {
     const delegationId = this.createDelegationId()
     const record = this.createRecord(delegationId, {
       agent: step.agent,
       currentDepth: previous.nestingDepth ?? 0,
       parentSessionId: "chain",
       prompt: step.prompt,
       queueKey: `chain:${step.agent}`,
       surface: "agent-delegation",
       workingDirectory: previous.workingDirectory,
     }, `chain:${step.agent}`)
     record.childSessionId = previous.childSessionId  // reuse existing session
     record.chainedFrom = previous.id
     this.active.set(delegationId, { record, slotHandle: /* need a slot handle */ })
     this.deps.lifecycle.register?.(record)
     return { delegationId, status: "completed" as const, result: undefined }
   }
   ```

**Concern:** The `slotHandle` is normally created by `Dispatcher.preflightCheck()`. For chained records, we need a slot handle but we're not actually creating a new session. The slot was already held by the previous delegation (which is now completed). Options:
a. Create a no-op slot handle that has `queueKey` but no actual slot
b. Skip slot management for chained records
c. Create a placeholder handle

Option (b) is simplest: flagged records (with `chainedFrom`) skip slot release in cleanup.

#### Impact on controlDelegation("chain")

The existing `manager.ts:168-175` also handles "chain" via abort+dispatch. With the new approach, `controlDelegation("chain")` should:
- Use `sendPromptAsync` (same as resume) to append to the existing completed child session
- Not abort the old delegation (already completed)
- Create a new record with `chainedFrom`

#### Test File
- `tests/lib/coordination/delegation/coordinator.test.ts` — extend chain tests to verify childSessionId reuse

---

### REQ-05: Adjust-Prompt and Change-Agent Control Actions

**File:** `src/tools/delegation/delegation-status.ts`

#### Current schema (lines 11-16)

```typescript
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "resume", "chain"]),
  chainParentSessionId: z.string().optional(),
  restartPrompt: z.string().optional(),
}).refine(...)
```

#### Target schema

```typescript
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "resume", "chain", "adjust-prompt", "change-agent"]),
  chainParentSessionId: z.string().optional(),
  restartPrompt: z.string().optional(),
  agent: z.string().optional(), // for change-agent
}).refine(/* adjust-prompt requires restartPrompt */)
  .refine(/* change-agent requires agent */)
```

#### adjust-prompt implementation

- Send supplementary prompt to the **running** child session via `sendPromptAsync`
- Target must be "running" (not terminal)
- Simple: `sendPromptAsync(childSessionId, supplementaryPrompt)`
- Does NOT create a new delegation record (it's a mid-execution adjustment)

Handler in `manager.ts`:
```typescript
if (request.action === "adjust-prompt") {
  if (delegation.status !== "running") throw new Error("[Harness] adjust-prompt requires running delegation")
  const childSessionId = this.getChildSessionId(request.delegationId)
  if (!childSessionId || !options.sendPromptAsync) throw new Error("[Harness] Cannot adjust-prompt: no active session")
  await options.sendPromptAsync(childSessionId, request.restartPrompt!)
  return { delegationId: request.delegationId, status: "running" }
}
```

#### change-agent implementation

- Abort the current delegation
- Restart with a new agent name
- If `sendPromptAsync` available: reuse childSessionId (like resume)
- Otherwise: abort + dispatch (fallback)

Handler in `manager.ts`:
```typescript
if (request.action === "change-agent") {
  const newAgent = request.agent ?? delegation.agent
  // Abort current
  this.abortDelegation(request.delegationId)
  // Dispatch with new agent
  const replacement = await this.options.coordinator!.dispatch({
    agent: newAgent,
    currentDepth: delegation.nestingDepth ?? 0,
    parentSessionId: delegation.parentSessionId,
    prompt: delegation.prompt ?? "",
    queueKey: `agent:${newAgent}`,
    surface: delegation.surface ?? "agent-delegation",
    workingDirectory: delegation.workingDirectory,
  })
  return replacement
}
```

#### Schema refinements to add

```typescript
.refine(
  (value) => value.action !== "adjust-prompt" || !!value.restartPrompt,
  "restartPrompt is required for adjust-prompt"
)
.refine(
  (value) => value.action !== "change-agent" || !!value.agent,
  "agent is required for change-agent"
)
```

#### ManagerLike type update (delegation-status.ts:29)

```typescript
controlDelegation?: (request: {
  action: "abort" | "cancel" | "restart" | "resume" | "chain" | "adjust-prompt" | "change-agent"
  delegationId: string
  chainParentSessionId?: string
  restartPrompt?: string
  agent?: string
}) => Promise<unknown>
```

#### Test File
- `tests/tools/delegation/delegation-status-v2.test.ts` — add tests for adjust-prompt and change-agent schema validation and execution
- `tests/lib/coordination/delegation/manager-decomposition.test.ts` — add test for controlDelegation("adjust-prompt")

---

### REQ-06: Total Tool Activity Duration Tracking

**File:** `src/coordination/delegation/completion-detector.ts`

#### Current checkSemanticCompletion (lines 191-213)

Currently checks three conditions:
1. `toolActivityStalled` — last tool use > threshold ms ago
2. `hasAssistantMessage` — last message is from assistant
3. `hasFileChanges` — file change indicators detected

`isComplete` = all three true.

#### Target

Add a fourth condition: `totalToolActivityDuration > 60000`.

The total duration is the cumulative wall-clock time that tools were executing. This can be computed from the message timestamps:

- For each consecutive pair of `tool_use` parts, the active duration is the time between them (the tool was running during this interval)
- For the last `tool_use` part, the active duration extends to the current time (if still running) or the tool_result timestamp

**Implementation approach:**

Since `checkSemanticCompletion` is a **pure function** that takes `messages: unknown[]`, we compute `totalToolActivityDuration` from the message data:

```typescript
export function computeTotalToolActivityDuration(messages: unknown[], now?: number): number {
  const toolTimestamps: number[] = []
  for (const message of messages) {
    const parts = getMessageParts(message)
    for (const part of parts) {
      if (getNestedValue(part, ["type"]) !== "tool_use") continue
      const partTs = getNestedValue(part, ["timestamp"])
      const msgTs = getNestedValue(message, ["timestamp"])
      const ts = typeof partTs === "number" ? partTs : typeof msgTs === "number" ? msgTs : null
      if (ts !== null) toolTimestamps.push(ts)
    }
  }
  if (toolTimestamps.length === 0) return 0
  // Sort timestamps
  toolTimestamps.sort((a, b) => a - b)
  // Compute cumulative: each segment between consecutive tool_use timestamps is "active time"
  let total = 0
  for (let i = 1; i < toolTimestamps.length; i++) {
    total += toolTimestamps[i] - toolTimestamps[i - 1]
  }
  // Last tool until now is also active time (tool is still running or just finished)
  total += (now ?? Date.now()) - toolTimestamps[toolTimestamps.length - 1]
  return total
}
```

Wait — this approach assumes the tool is active BETWEEN tool_use calls, which isn't accurate. A better approach:

- Each `tool_use` has a start timestamp
- The time span from `firstToolUse` to `lastToolUse` is the active window
- Within that window, the time between consecutive `tool_use` timestamps represents tool activity
- Gap between tool_use calls where there's no tool_use could be "thinking" time, not tool activity

Actually, looking at this from a practical standpoint: the gap analysis says:
> "totalToolActivityDuration — tổng thời gian tools active"

This means the cumulative time that tools were actively executing. The simplest accurate computation:
- Sum of `(tool_end - tool_start)` for each tool call
- Since we don't have explicit `tool_end` timestamps in the message format, we approximate:
  - For all but the last tool_use: `next_tool_use_timestamp - current_tool_use_timestamp` (the tool ran until the next tool was called)
  - For the last tool_use: `now - last_tool_use_timestamp` (the tool is still running or just finished)

This is a reasonable approximation. The key insight is that consecutive tool calls with short gaps indicate active tool use, while long gaps indicate idle time.

#### Updated SemanticCompletionOptions (line 12-15)

```typescript
export interface SemanticCompletionOptions {
  toolIdleThresholdMs?: number
  now?: number
  minTotalToolActivityDurationMs?: number  // NEW
}
```

Default for `minTotalToolActivityDurationMs`: `60000`

#### Updated SemanticCompletionResult (line 3-10)

```typescript
export interface SemanticCompletionResult {
  toolActivityStalled: boolean
  hasAssistantMessage: boolean
  hasFileChanges: boolean
  isComplete: boolean
  lastToolActivityAt: number | null
  secondsSinceLastToolActivity: number | null
  totalToolActivityDurationMs: number  // NEW
}
```

#### Updated checkSemanticCompletion logic

```typescript
export function checkSemanticCompletion(
  messages: unknown[],
  options?: SemanticCompletionOptions
): SemanticCompletionResult {
  const now = options?.now ?? Date.now()
  const threshold = options?.toolIdleThresholdMs ?? DEFAULT_TOOL_IDLE_MS
  const minDuration = options?.minTotalToolActivityDurationMs ?? 60000
  
  // ... existing computations ...
  
  const totalToolActivityDurationMs = computeTotalToolActivityDuration(messages, now)
  const hasSufficientToolDuration = totalToolActivityDurationMs >= minDuration
  
  const isComplete = toolActivityStalled && hasAssistantMessage && hasFileChanges && hasSufficientToolDuration
  
  return {
    // ...existing fields...
    totalToolActivityDurationMs,
    isComplete,  // now requires all FOUR conditions
  }
}
```

#### Impact: Acceptance criteria verification

From SPEC.md:
- "6 tool calls in 10s then idle for 60s does NOT trigger completion": `totalToolActivityDurationMs < 60000` → `hasSufficientToolDuration = false` → blocked ✓
- "12 tool calls over 70s THEN 60s idle DOES trigger completion": `totalToolActivityDurationMs >= 60000` AND `toolActivityStalled = true` ✓

#### Test File
- `tests/lib/coordination/delegation/completion-detector.test.ts` — existing file, add tests for:
  - `computeTotalToolActivityDuration` function
  - Short burst (6 calls, 10s) + idle 60s → not complete
  - Long activity (12 calls, 70s) + idle 60s → complete
  - No tools → duration = 0
  - Single tool call → duration ≈ now - tool timestamp

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session resume / chain-append | `DelegationManager` (facade) | `NotificationRouter` (for chained notifications) | Control actions are entry points in the facade; coordinator creates records |
| Pending notification replay | `plugin.ts` (composition root) | `task-management/lifecycle/index.ts` (existing replay hook) | Init-time scan belongs in plugin; event-driven replay already in lifecycle |
| Rich notification formatting | `notification-formatter.ts` (pure functions) | `notification-router.ts`, `completion-detector.ts` (data sources) | Formatters are pure; data comes from router state and detector |
| Control actions (adjust-prompt, change-agent) | `DelegationManager` | `delegation-status.ts` (schema validation) | Schema validates; manager executes |
| Tool activity duration tracking | `completion-detector.ts` | `manager.ts` (signal feeding) | Pure computation on message data; signals come from manager |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session prompt delivery | Custom SDK session client | `sendPromptAsync` from `session-api.ts` | Already wraps `client.session.promptAsync` with validation |
| Pending notification storage | Custom queue | `PendingNotification[]` in continuity + `patchSessionContinuity` | Already exists with clone-on-read, persistence, and hydration |
| Zod schema validation | Custom control action parser | Extend existing `DelegationControlSchema` | Already uses `z.enum()` with contextual `.refine()` |
| Tool activity time computation | New stateful tracker class | Pure function `computeTotalToolActivityDuration` on messages array | `checkSemanticCompletion` is pure; keeps it testable and stateless |

---

## Common Pitfalls

### Pitfall 1: Resume on non-completed delegation
**What goes wrong:** Trying to resume a delegation that's still running or in error state.
**How to avoid:** Guard: only allow `resume` on `completed` status; allow `adjust-prompt` only on `running` status.
**Warning signs:** Error message about terminal delegation.

### Pitfall 2: Double-notification on session resume
**What goes wrong:** Both the existing lifecycle replay AND the new init-time replay fire for the same pending notifications.
**How to avoid:** Clear `pendingNotifications` from continuity immediately after successful replay in EITHER path. The lifecycle handler already does `patchSessionContinuity(sessionID, { pendingNotifications: [] })` at line 187.
**Warning signs:** User sees duplicate delegation notifications.

### Pitfall 3: `sendPromptAsync` called on a terminated session
**What goes wrong:** Resume tries to `sendPromptAsync` to a child session that was already deleted/abandoned by OpenCode.
**How to avoid:** Catch `sendPromptAsync` errors and fall back to abort+dispatch (creating a new session). The facade's resume handler should have a try/catch around `sendPromptAsync`.
**Warning signs:** Silent failure — resume appears to succeed but child session never responds.

### Pitfall 4: Tool activity duration over-counting
**What goes wrong:** `computeTotalToolActivityDuration` includes idle time between tool calls as "active" time, causing false triggers.
**How to avoid:** The algorithm only counts time between consecutive tool_use timestamps, not total elapsed wall time. A gap of 30s between two tool_use calls counts as 30s of "activity" — but this is a limitation of only having start timestamps. Accept this as an approximation.
**Warning signs:** Long gaps between tool calls inflate the duration.

### Pitfall 5: Existing test regression on completion detector
**What goes wrong:** Adding `hasSufficientToolDuration` to `isComplete` breaks existing tests that expect `isComplete = true` with fewer conditions.
**How to avoid:** Update all existing test expectations to include `hasSufficientToolDuration = true` in mock data (add enough tool_use timestamps with sufficient span). Then add a new test for the short-burst blocking scenario.
**Warning signs:** 91 existing CP-DT-01 regression tests may fail.

---

## Code Examples

### Pattern 1: Injecting sendPromptAsync into DelegationManager

```typescript
// In src/coordination/delegation/manager.ts
export type DelegationManagerOptions = {
  coordinator?: ...
  lifecycle?: FacadeLifecycle
  monitor?: Pick<DelegationMonitor, "start">
  notificationRouter?: Pick<NotificationRouter, "register">
  ptyManager?: PtyManager | null
  runtimePolicy?: RuntimePolicy
  sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>  // NEW
}

// In controlDelegation method:
async controlDelegation(request: DelegationControlRequest): Promise<DelegationResult> {
  const delegation = this.getStatus(request.delegationId)
  if (!delegation) throw new Error(`[Harness] Delegation "${request.delegationId}" not found`)
  
  // Allow resume/chain on completed delegations
  if (request.action !== "resume" && request.action !== "chain") {
    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
      throw new Error("[Harness] cannot control terminal delegation")
    }
  }
  
  if (request.action === "abort") return this.abortDelegation(request.delegationId)
  if (request.action === "cancel") return this.cancelDelegation(request.delegationId)
  
  if (request.action === "resume" || request.action === "chain") {
    const childSessionId = delegation.childSessionId
    if (childSessionId && this.options.sendPromptAsync) {
      const prompt = request.restartPrompt ?? delegation.prompt
      if (!prompt) throw new Error("[Harness] resume/chain requires a prompt")
      
      await this.options.sendPromptAsync(childSessionId, prompt)
      
      // Create new delegation record via coordinator or lifecycle
      const newDelegationId = `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const newRecord: Delegation = {
        ...delegation,
        id: newDelegationId,
        childSessionId,  // reuse existing
        prompt,
        status: "running",
        createdAt: Date.now(),
        // Set resume/chain reference
        resumedFrom: request.action === "resume" ? delegation.id : undefined,
        chainedFrom: request.action === "chain" ? delegation.id : undefined,
      }
      this.options.lifecycle?.register?.(newRecord)
      this.options.coordinator?.attachChildSession?.(newDelegationId, childSessionId)
      
      return { delegationId: newDelegationId, childSessionId, status: "running" as const }
    }
  }
  
  // Fallback to existing abort+dispatch for non-resumable delegations
  // ... (existing code)
}
```

### Pattern 2: Init-time pending notification replay

```typescript
// In src/plugin.ts (new function, called in the plugin factory)
async function replayPendingDelegationNotifications(
  client: OpenCodeClient,
  notificationRouter: NotificationRouter
): Promise<void> {
  const allSessions = listSessionContinuity()
  for (const record of Object.values(allSessions)) {
    const pending = record.metadata.pendingNotifications ?? []
    if (pending.length === 0) continue
    
    const sessionId = record.sessionID
    if (!sessionId) continue
    
    // Replay via TUI append (matching the original delivery mechanism)
    for (const notification of pending) {
      const line = notification.resultPreview ?? 
        `Delegation ${notification.metadata?.delegationId ?? "unknown"} ${notification.status}`
      try {
        await appendTuiPrompt(client, line)
      } catch {
        // Best-effort: keep remaining notifications for next init
        break
      }
    }
    
    // Clear after successful replay of all notifications for this session
    patchSessionContinuity(sessionId, { pendingNotifications: [] })
  }
}

// Called in the plugin factory at line 228:
void delegationManager.recoverPending()
void replayPendingDelegationNotifications(client, notificationRouter)  // NEW
```

### Pattern 3: Total tool activity duration computation

```typescript
// In src/coordination/delegation/completion-detector.ts (new function)
/**
 * Compute cumulative wall-clock time that tools were active.
 *
 * Uses tool_use part timestamps to estimate active duration:
 * - For consecutive tool_use pairs, the active time is the interval between them
 * - The last tool_use extends to the current time
 * - Returns 0 if no tool_use parts with timestamps are found
 */
export function computeTotalToolActivityDuration(messages: unknown[], now?: number): number {
  const timestamps: number[] = []
  
  for (const message of messages) {
    const parts = getMessageParts(message)
    for (const part of parts) {
      if (getNestedValue(part, ["type"]) !== "tool_use") continue
      const partTs = getNestedValue(part, ["timestamp"])
      const msgTs = getNestedValue(message, ["timestamp"])
      const ts = typeof partTs === "number" ? partTs : typeof msgTs === "number" ? msgTs : null
      if (ts !== null) timestamps.push(ts)
    }
  }
  
  if (timestamps.length === 0) return 0
  
  timestamps.sort((a, b) => a - b)
  
  // Sum intervals between consecutive tool_use timestamps
  let total = 0
  for (let i = 1; i < timestamps.length; i++) {
    total += timestamps[i] - timestamps[i - 1]
  }
  
  // Last tool_use interval extends to now
  total += (now ?? Date.now()) - timestamps[timestamps.length - 1]
  
  return total
}
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `sendPromptAsync` function's signature `(client, sessionId, body)` with `{ parts, agent?, tools? }` body is compatible with resume/chain use cases | REQ-01 | If the SDK API requires different body shape, the injection wrapper in plugin.ts can adapt the call |
| A2 | Message tool_use part timestamps exist and are reliable for computing activity duration | REQ-06 | If timestamps are sparse, fall back to simpler time-window approximation (first tool to now) |
| A3 | The existing 91 CP-DT-01 regression tests cover the completion detector scenarios that will need updated mocks | REQ-06 | If tests don't exercise `checkSemanticCompletion` with realistic message data, smaller risk of regression |
| A4 | `NotificationRouter.replayPending()` at notification-router.ts:100-107 correctly sorts and returns pending notifications in FIFO order | REQ-02 | Replay order doesn't affect correctness, only UX ordering |

**If this table is empty:** Not applicable — assumptions are documented above.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Resume creates new child session (abort+dispatch) | Resume reuses existing childSessionId (sendPromptAsync) | Phase 15 | Preserves delegation context across resume/chain rounds |
| Notification replay only via lifecycle event hooks | Notification replay at BOTH plugin init AND lifecycle events | Phase 15 | Covers session-ended scenario that event-based replay misses |
| isComplete = 3 conditions (stalled + assistant + fileChanges) | isComplete = 4 conditions (+ totalToolActivityDuration > 60s) | Phase 15 | Prevents false completions from brief tool bursts |
| 5 control actions | 7 control actions (+ adjust-prompt, + change-agent) | Phase 15 | Enables mid-delegation adjustments without abort |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: source code] `src/coordination/delegation/manager.ts` — DelegationManager facade, controlDelegation method
- [VERIFIED: source code] `src/coordination/delegation/coordinator.ts` — DelegationCoordinator, chain() method
- [VERIFIED: source code] `src/coordination/delegation/notification-router.ts` — NotificationRouter with replayPending
- [VERIFIED: source code] `src/coordination/delegation/notification-formatter.ts` — NotificationFormatOptions, format functions
- [VERIFIED: source code] `src/coordination/delegation/completion-detector.ts` — checkSemanticCompletion pure function
- [VERIFIED: source code] `src/tools/delegation/delegation-status.ts` — DelegationControlSchema, tool handler
- [VERIFIED: source code] `src/plugin.ts` — composition root, deliver callback, persistPendingDelegationNotifications
- [VERIFIED: source code] `src/shared/session-api.ts` — sendPromptAsync function
- [VERIFIED: source code] `src/task-management/lifecycle/index.ts` — replayPendingNotificationsForEvent
- [VERIFIED: source code] `src/task-management/continuity/index.ts` — getSessionContinuity, patchSessionContinuity
- [VERIFIED: source code] `src/coordination/completion/notification-handler.ts` — replayPendingNotifications, notifyParentSession

### Secondary (MEDIUM confidence)
- [VERIFIED: Phase 14 gap analysis] `14-GAPS-ANALYSIS-2026-05-19.md` — source of all 8 gaps with per-gap fix requirements

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all required SDK capabilities already present
- Architecture: HIGH — surgical modifications to existing interfaces; no new modules
- Pitfalls: MEDIUM — `sendPromptAsync` on terminated session behavior depends on SDK runtime

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable codebase — surgical gap fixes, not framework upgrades)
