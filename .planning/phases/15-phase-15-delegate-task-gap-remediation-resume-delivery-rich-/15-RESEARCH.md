# Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications — Research

**Researched:** 2026-05-19
**Domain:** Delegation ecosystem — session resume, notification delivery, completion detection, control actions
**Confidence:** HIGH

## Summary

Phase 15 surgically remediates 8 gaps (3 critical, 3 medium, 2 minor) identified in the Phase 14 gap analysis. The affected codebase spans 6 files across 3 sectors: `coordination/delegation/`, `tools/delegation/`, and `plugin.ts`. All changes are modifications to existing interfaces and methods — no new modules, no new tools, no new dependencies.

**Three critical discovery findings:**

1. **`sendPromptAsync` already exists and is production-ready** — `src/shared/session-api.ts:183-195` exports `sendPromptAsync(client, sessionID, body)`. Signature: `(client: OpenCodeClient, sessionID: string, body: unknown) => Promise<void>`. Already used by `manager-runtime.ts:242` and `sdk-child-session-starter.ts:36`. Body shape: `{ parts: Array<{ type: string; text: string }>, agent?: string, tools?: Record<string, boolean> }`. [VERIFIED: source code]

2. **Pending notification replay already partially exists** — The lifecycle manager (`src/task-management/lifecycle/index.ts:169-192`) has `replayPendingNotificationsForEvent()` triggered on `session.created`/`session.updated` via `core-hooks.ts`. However, this replay uses `notification-handler.ts` path (`sendPrompt` to parent session with full system_reminder blocks), NOT the `NotificationRouter` path (`appendTuiPrompt` + compact TUI lines). These are semantically different delivery mechanisms. [VERIFIED: source code]

3. **`Delegation` type already has `resumedFrom` and `chainedFrom` fields** — `src/coordination/delegation/types.ts:61-63` already defines `resumedFrom?: string` and `chainedFrom?: string`. These fields exist but are never set by the current `controlDelegation` implementation because it always goes through abort+dispatch instead. [VERIFIED: source code]

**No new SDK capabilities needed:** All required capabilities (`sendPromptAsync`, `getSessionContinuity`, `patchSessionContinuity`, `listSessionContinuity`, Zod schema validation, `CompletionDetector` dual-signal framework, `NotificationRouter` formatting) are already present in the codebase or available via existing imports.

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
| REQ-01 | True session resume: reuse childSessionId, preserve context, set resumedFrom | `sendPromptAsync` exists at session-api.ts:183; controlDelegation at manager.ts:158 restructured to use it; Delegation type already has `resumedFrom` field |
| REQ-02 | Session-ended delivery + pending replay: replay at init AND session resume | lifecycle/index.ts:169 has partial replay via notification-handler path; new plugin init-time drain needed for NotificationRouter path; continuity `listSessionContinuity()` + `patchSessionContinuity()` already exist |
| REQ-03 | Rich notification: path, fileChanges, timestamp in format | `NotificationFormatOptions` at notification-formatter.ts:11 can be extended; `formatTuiNotification` and `formatSystemNotification` at notification-router.ts:126-148 must pass new fields through |
| REQ-04 | Chain-append to completed session | Same `sendPromptAsync` resume mechanism with `chainedFrom`; coordinator.ts:220-237 chain() restructured; Delegation type already has `chainedFrom` field |
| REQ-05 | Adjust-prompt and change-agent control actions | DelegationControlSchema at delegation-status.ts:11 extended with 2 new enum values; `ManagerLike` type at delegation-status.ts:29 and `DelegationControlRequest` at manager.ts:31 updated; two new handler blocks in manager.ts |
| REQ-06 | Total tool activity duration tracking | `checkSemanticCompletion` at delegation/completion-detector.ts:191 extended with pure function `computeTotalToolActivityDuration`; `SemanticCompletionResult` and `SemanticCompletionOptions` interfaces extended |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session resume / chain-append | `DelegationManager` (facade) | `NotificationRouter` (for chained notifications) | Control actions are entry points in the facade; coordinator creates records |
| Pending notification replay | `plugin.ts` (composition root) | `task-management/lifecycle/index.ts` (existing replay hook) | Init-time scan belongs in plugin; event-driven replay already in lifecycle |
| Rich notification formatting | `notification-formatter.ts` (pure functions) | `notification-router.ts` (callers), `completion-detector.ts` (data source) | Formatters are pure; data comes from router state and completion-detector |
| Control actions (adjust-prompt, change-agent) | `DelegationManager` | `delegation-status.ts` (schema validation) | Schema validates; manager executes |
| Tool activity duration tracking | `delegation/completion-detector.ts` | `plugin.ts` (wiring) | Pure computation on message data; plugged into existing dual-signal chain |

---

## REQ-01: True Session Resume

**File:** `src/coordination/delegation/manager.ts`
**Risk:** MEDIUM

### Current Code Path (Broken)

```
controlDelegation("resume")
  → line 162: terminal guard THROWS if delegation.status is "completed"/"error"/"timeout"
    → Resume specifically needs to work on COMPLETED delegations!
  → line 167: agent = delegation.agent
  → line 171-173: abortDelegation (always creates a replacement)
  → line 174-176: coordinator.dispatch → creates NEW childSessionId
  → line 179-182: sets resumedFrom on the replacement record
```

**Problems:**
1. Terminal guard at line 162 blocks resume on completed delegations — but resume is designed for completed ones
2. `abortDelegation` at line 171-173 runs even for resume/chain, creating unnecessary replacement
3. `coordinator.dispatch` at line 175 creates a new session with new ID, losing context
4. No `sendPromptAsync` capability wired into the facade

### Target Code Path

```
controlDelegation("resume")
  → Allow delegation.status === "completed" for resume and chain only (relax terminal guard)
  → If childSessionId exists AND options.sendPromptAsync:
    → Look up existing delegation record
    → Call options.sendPromptAsync(childSessionId, prompt) to send new prompt
    → Create new delegation record (NOT via coordinator.dispatch — just lifecycle.register)
    → Set resumedFrom = delegation.id on new record
    → Return with SAME childSessionId
  → Fallback: existing abort+dispatch (for backward compat)
```

### Existing `sendPromptAsync` Pattern

Already used in `manager-runtime.ts:242` [VERIFIED: source code]:
```typescript
await sendPromptAsync(this.client, delegation.childSessionId, {
  parts: [{ type: "text", text: params.prompt }],
  agent: agent.name,
  tools: buildDelegationPromptTools(child.allowedTools),
})
```

And `sdk-child-session-starter.ts:36`:
```typescript
await sendPromptAsync(client, childSessionId, {
  agent: params.validatedAgent.name,
  parts: [{ type: "text", text: params.prompt }],
  tools: buildDelegationPromptTools(permissionProfile.tools),
})
```

For resume/chain, the prompt is simpler (no tools override — existing session already has config):
```typescript
sendPromptAsync(client, childSessionId, {
  parts: [{ type: "text", text: prompt }],
  agent: agent,
})
```

### Required Interface Changes

**`DelegationManagerOptions`** (manager.ts:22-29) — add `sendPromptAsync`:
```typescript
export type DelegationManagerOptions = {
  coordinator?: Pick<DelegationCoordinator, "chain" | "dispatch"> & Partial<Pick<DelegationCoordinator, ...>>
  lifecycle?: FacadeLifecycle
  monitor?: Pick<DelegationMonitor, "start">
  notificationRouter?: Pick<NotificationRouter, "register">
  ptyManager?: PtyManager | null
  runtimePolicy?: RuntimePolicy
  sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>  // NEW
}
```

**`DelegationControlRequest`** (manager.ts:31-37) — add `agent` field for change-agent:
```typescript
export type DelegationControlRequest = {
  action: "abort" | "cancel" | "restart" | "resume" | "chain" | "adjust-prompt" | "change-agent"
  chainParentSessionId?: string
  delegationId: string
  nativeTask?: NativeTask
  restartPrompt?: string
  agent?: string  // NEW for change-agent
}
```

### Wiring in plugin.ts

At `plugin.ts:203-210`, inject `sendPromptAsync`:
```typescript
const delegationManager = new DelegationManager(options.enableRuntimeAdapter ? options.client : undefined, {
  coordinator,
  lifecycle,
  monitor,
  notificationRouter,
  ptyManager: options.ptyManager,
  runtimePolicy: options.runtimePolicy,
  sendPromptAsync: (sessionId, prompt) => sendPromptAsync(options.client, sessionId, {
    parts: [{ type: "text", text: prompt }],
  }),
})
```

### Control Flow for Resume

```typescript
// In controlDelegation, around line 158-195:
async controlDelegation(request: DelegationControlRequest): Promise<DelegationResult> {
  const delegation = this.getStatus(request.delegationId)
  if (!delegation) throw new Error(`[Harness] Delegation "${request.delegationId}" not found`)

  // Resume and chain are ALLOWED on completed delegations
  if (request.action !== "resume" && request.action !== "chain") {
    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
      throw new Error("[Harness] cannot control terminal delegation")
    }
  }

  // Existing abort/cancel handlers...
  if (request.action === "abort") return this.abortDelegation(request.delegationId)
  if (request.action === "cancel") return this.cancelDelegation(request.delegationId)

  // Resume/chain: reuse existing childSessionId via sendPromptAsync
  if (request.action === "resume" || request.action === "chain") {
    const childSessionId = delegation.childSessionId
    if (childSessionId && this.options.sendPromptAsync) {
      const prompt = request.restartPrompt ?? delegation.prompt
      if (!prompt) throw new Error("[Harness] resume/chain requires a prompt")

      await this.options.sendPromptAsync(childSessionId, prompt)

      // Create new delegation record via lifecycle
      const newRecord: Delegation = {
        ...delegation,
        id: `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        childSessionId,  // reuse existing session ID
        prompt,
        status: "running",
        createdAt: Date.now(),
        completedAt: undefined,
        resumedFrom: request.action === "resume" ? delegation.id : undefined,
        chainedFrom: request.action === "chain" ? delegation.id : undefined,
      }
      this.options.lifecycle?.getStatus  // NOTE: lifecycle needs register capability
      // Register via coordinator's lifecycle persistence
      return { delegationId: newRecord.id, childSessionId, status: "running" as const }
    }
    // Fallback: abort+dispatch
  }

  // ... existing abort+dispatch fallback for restart
}
```

### Key Insight: Delegation Record Registration

The existing `FacadeLifecycle` type (manager.ts:14-20) only has `getChildSessionId`, `getStatus`, `list`, `markAborted`, `markCancelled` — it does NOT have a `register` method. To create a new delegation record for resume/chain, we need either:
1. Add `register` to `FacadeLifecycle` 
2. Use an ad-hoc record creation through the `options.lifecycle` (which already owns the `records` Map at plugin.ts:154-174)

Option 1 is cleaner. Add to `FacadeLifecycle`:
```typescript
type FacadeLifecycle = {
  getChildSessionId: (delegationId: string) => string | undefined
  getStatus: (delegationId: string) => Delegation | undefined
  list: () => Delegation[]
  markAborted: (delegationId: string) => DelegationResult
  markCancelled: (delegationId: string) => DelegationResult
  register?: (record: Delegation) => void  // NEW
}
```

### Existing Type Check

`Delegation` interface (types.ts:26-72) already has:
- `resumedFrom?: string` at line 61
- `chainedFrom?: string` at line 63
- `restartedFrom?: string` at line 59

These fields exist but are never set by the current controlDelegation implementation.

---

## REQ-02: Session-Ended Delivery + Pending Replay

**Files:** `src/plugin.ts`, `src/coordination/delegation/notification-router.ts`
**Risk:** MEDIUM — two separate replay mechanisms must not conflict

### Existing Replay Mechanism (lifecycle/index.ts:169-192)

```typescript
async replayPendingNotificationsForEvent(sessionID: string, eventType: string): Promise<void> {
  const continuity = getSessionContinuity(sessionID)
  const pendingNotifications = continuity?.metadata.pendingNotifications ?? []
  if (pendingNotifications.length === 0) return

  const shouldReplay =
    (eventType === "session.created" && continuity?.metadata.lifecycle?.phase === "created") ||
    eventType === "session.updated"
  if (!shouldReplay) return

  try {
    const delivered = await replayPendingNotifications(this.client, sessionID, pendingNotifications)
    if (delivered) patchSessionContinuity(sessionID, { pendingNotifications: [] })
  } catch { /* best-effort */ }
}
```

This uses `replayPendingNotifications` from `notification-handler.ts:199`, which calls `notifyParentSession()` → `sendPrompt()` — delivering full system_reminder blocks via SDK prompt. [VERIFIED: source code]

### What's Missing

The `NotificationRouter` path at `plugin.ts:160-166` uses `appendTuiPrompt` (compact TUI line), which is a different delivery mechanism. When the deliver callback fails:
1. `NotificationRouter.queuePending()` at notification-router.ts:88
2. `persistPendingDelegationNotifications` at plugin.ts:100 writes to continuity as `PendingNotification[]`
3. No bridge exists between `NotificationRouter`-persisted pending notifications and the lifecycle replay path

### Two Fixes Needed

**Fix 1: Plugin init-time drain** — Scan ALL continuity records on init, replay NotificationRouter-type notifications via `appendTuiPrompt`:

```typescript
// In src/plugin.ts, called after delegationManager.recoverPending()
async function replayPendingDelegationNotifications(
  client: OpenCodeClient,
): Promise<void> {
  const allSessions = listSessionContinuity()
  for (const record of Object.values(allSessions)) {
    const pending = record.metadata.pendingNotifications ?? []
    if (pending.length === 0) continue

    const sessionId = record.sessionID
    if (!sessionId) continue

    // Replay via TUI append (matching original delivery mechanism)
    for (const notification of pending) {
      const line = notification.resultPreview ??
        `Delegation ${notification.metadata?.delegationId ?? "unknown"} ${notification.status}`
      try {
        await appendTuiPrompt(client, line)
      } catch {
        break  // best-effort: stop on failure
      }
    }
    // Clear after successful replay
    patchSessionContinuity(sessionId, { pendingNotifications: [] })
  }
}
```

Called at `plugin.ts:228`:
```typescript
void delegationManager.recoverPending()
void replayPendingDelegationNotifications(client)
```

**Fix 2: Bridge into lifecycle replay path** — The existing `replayPendingNotifications` from `notification-handler.ts:199` uses `sendPrompt` (SDK prompt, full system_reminder blocks). The NotificationRouter notifications are compact TUI lines. These are semantically different delivery mechanisms and should NOT be merged — keep them separate.

### Critical: Double-Notification Prevention

The lifecycle handler ALREADY clears `pendingNotifications` at `patchSessionContinuity(sessionID, { pendingNotifications: [] })` (lifecycle/index.ts:187). The new init-time drain must also clear after replay. Since both paths write/read from the same `pendingNotifications[]` array, they will interfere:

- If init-time drain runs first: clears the array → lifecycle handler sees empty array → noop
- If lifecycle handler runs first (session.created/updated fires before init-time drain completes): clears the array → init-time drain sees empty array → noop

**This is safe** — both paths clear after replay, and `listSessionContinuity()` reads fresh data each time.

### Existing Continuity Functions [VERIFIED: source code]

All needed from `src/task-management/continuity/index.ts`:
- `listSessionContinuity()` — returns record of all continuity files
- `getSessionContinuity(sessionID)` — returns single record
- `patchSessionContinuity(sessionID, updates)` — partial update with deep clone

---

## REQ-03: Rich Notification Fields

**File:** `src/coordination/delegation/notification-formatter.ts`
**Risk:** LOW

### Current Interface (notification-formatter.ts:11-18)

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

### Target Interface

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

### Format String Changes

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

### Caller Updates

**`notification-router.ts:126-148`** — `formatTuiNotification` and `formatSystemNotification` must accept and pass through new fields.

### File Changes Detection Integration

The `fileChanges` list should come from a new pure function in `delegation/completion-detector.ts`. Currently `hasFileChangeIndicators()` returns a boolean. Add:

```typescript
/**
 * Extract actual file paths from session messages.
 * Reuses existing FILE_PATH_PATTERN regex and FILE_CHANGE_TOOL_NAMES.
 */
export function extractFileChanges(messages: unknown[]): string[] {
  const changes = new Set<string>()
  for (const message of messages) {
    const parts = getMessageParts(message)
    for (const part of parts) {
      // Check tool_use inputs for filePath
      if (getNestedValue(part, ["type"]) === "tool_use") {
        const filePath = asString(getNestedValue(part, ["input", "filePath"]))
        if (filePath) changes.add(filePath)
        // Also check for the "path" field used by some tools
        const path = asString(getNestedValue(part, ["input", "path"]))
        if (path && FILE_PATH_PATTERN.test(path)) changes.add(path)
      }
      // Check tool_result outputs for file paths
      if (getNestedValue(part, ["type"]) === "tool_result") {
        const output = asString(getNestedValue(part, ["output"]))
        if (output) {
          const matches = [...output.matchAll(FILE_PATH_PATTERN)]
          for (const match of matches) changes.add(match[0].trim())
        }
      }
    }
  }
  return [...changes]
}
```

---

## REQ-04: Chain-Append to Completed Session

**File:** `src/coordination/delegation/coordinator.ts`
**Risk:** MEDIUM

### Current chain() (coordinator.ts:220-237)

Each `this.dispatch()` call creates a new child session. This loses context between chain steps.

### Target

Chain appends to the previous step's child session using `sendPromptAsync`, preserving context. The implementation mirrors resume but with `chainedFrom` instead of `resumedFrom`.

### Required modifications

1. **`DelegationCoordinator`** needs `sendPromptAsync` capability — add to `DelegationCoordinatorDeps` or make the chain method accept an optional `sendPromptAsync` parameter.

2. **Modify chain()** at coordinator.ts:220-237:

```typescript
async chain(delegations: ChainStep[], sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>): Promise<DelegationResult[]> {
  const results: DelegationResult[] = []
  let previousChildSessionId: string | undefined
  for (const [index, step] of delegations.entries()) {
    if (index > 0 && previousChildSessionId && sendPromptAsync) {
      // Append to existing completed child session
      await sendPromptAsync(previousChildSessionId, step.prompt)
      // Create chained record (reuse childSessionId)
      const chainResult = this.buildChainResult(step, previousChildSessionId, results[results.length - 1].delegationId)
      results.push(chainResult)
      if (chainResult.status !== "completed") break
    } else {
      // First step or no sendPromptAsync: use existing dispatch
      const result = await this.dispatch({
        agent: step.agent,
        currentDepth: index,
        parentSessionId: "chain",
        prompt: step.usePreviousResult && results.at(-1)
          ? `${step.prompt}\n\nPrevious result: ${results.at(-1)?.result ?? results.at(-1)?.error ?? results.at(-1)?.status}`
          : step.prompt,
        queueKey: `chain:${step.agent}:${index}`,
      })
      previousChildSessionId = result.childSessionId
      const completedResult = result.status === "dispatched"
        ? { ...result, result: result.result ?? result.delegationId, status: "completed" as const }
        : result
      results.push(completedResult)
      if (completedResult.status !== "completed") break
    }
  }
  return results
}

private buildChainResult(step: ChainStep, childSessionId: string, previousDelegationId: string): DelegationResult {
  return {
    delegationId: `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    childSessionId,
    status: "completed",
    result: step.usePreviousResult ? `Chained from ${previousDelegationId}` : undefined,
    chainedFrom: previousDelegationId,
  }
}
```

Note: `DelegationResult` already has `chainedFrom` at types.ts:63 (as part of the serializable Delegation fields).

### Interaction with manager.ts controlDelegation("chain")

The manager's `controlDelegation("chain")` at line 159-195 currently goes through the abort+dispatch path. With the changes from REQ-01, the manager's resume/chain handler already uses `sendPromptAsync`. The coordinator's `chain()` method should be updated for consistency but is called less frequently (it's the programmatic chain, not the control-action chain).

---

## REQ-05: Adjust-Prompt and Change-Agent Control Actions

**Files:** `src/tools/delegation/delegation-status.ts`, `src/coordination/delegation/manager.ts`
**Risk:** LOW

### DelegationControlSchema (delegation-status.ts:11-16)

Current:
```typescript
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "resume", "chain"]),
  chainParentSessionId: z.string().optional(),
  restartPrompt: z.string().optional(),
}).refine((value) => (value.action === "restart" || value.action === "resume") ? !!value.restartPrompt : true, ...)
  .refine((value) => value.action !== "chain" || !!value.chainParentSessionId, ...)
```

Target:
```typescript
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "resume", "chain", "adjust-prompt", "change-agent"]),
  chainParentSessionId: z.string().optional(),
  restartPrompt: z.string().optional(),
  agent: z.string().optional(),
}).refine(...)
  .refine(...)
  .refine((value) => value.action !== "adjust-prompt" || !!value.restartPrompt, "restartPrompt is required for adjust-prompt")
  .refine((value) => value.action !== "change-agent" || !!value.agent, "agent is required for change-agent")
```

### ManagerLike Type (delegation-status.ts:27-32)

Current:
```typescript
type ManagerLike = {
  controlDelegation?: (request: {
    action: "abort" | "cancel" | "restart" | "resume" | "chain"
    delegationId: string
    chainParentSessionId?: string
    restartPrompt?: string
  }) => Promise<unknown>
}
```

Target:
```typescript
type ManagerLike = {
  controlDelegation?: (request: {
    action: "abort" | "cancel" | "restart" | "resume" | "chain" | "adjust-prompt" | "change-agent"
    delegationId: string
    chainParentSessionId?: string
    restartPrompt?: string
    agent?: string
  }) => Promise<unknown>
}
```

### handleControl (delegation-status.ts:182-201)

The `handleControl` function passes `action`, `delegationId`, `chainParentSessionId`, `restartPrompt` to `manager.controlDelegation()`. It needs to also pass `agent` for change-agent:

```typescript
const result = await manager.controlDelegation({
  action: args.control.action as any,
  delegationId: delegation.id,
  chainParentSessionId: args.control.chainParentSessionId,
  restartPrompt: args.control.restartPrompt,
  agent: args.control.agent,  // NEW
})
```

### Adjust-Prompt Handler (manager.ts new block)

```typescript
if (request.action === "adjust-prompt") {
  if (delegation.status !== "running")
    throw new Error("[Harness] adjust-prompt requires running delegation")
  const childSessionId = delegation.childSessionId
  if (!childSessionId || !this.options.sendPromptAsync)
    throw new Error("[Harness] Cannot adjust-prompt: no active session or sendPromptAsync unavailable")
  const prompt = request.restartPrompt ?? delegation.prompt
  if (!prompt)
    throw new Error("[Harness] adjust-prompt requires a restartPrompt")
  await this.options.sendPromptAsync(childSessionId, prompt)
  return { delegationId: request.delegationId, childSessionId, status: "running" as const }
}
```

### Change-Agent Handler (manager.ts new block)

```typescript
if (request.action === "change-agent") {
  if (!request.agent)
    throw new Error("[Harness] change-agent requires an agent name")
  const childSessionId = delegation.childSessionId
  // If session exists and sendPromptAsync is available:
  if (childSessionId && this.options.sendPromptAsync) {
    // Abort current session first
    this.options.coordinator?.abortDelegation?.(request.delegationId, "[Harness] Delegation change-agent")
    // Create new delegation record with new agent, reuse childSessionId
    const prompt = request.restartPrompt ?? delegation.prompt
    if (!prompt) throw new Error("[Harness] change-agent requires a prompt")
    await this.options.sendPromptAsync(childSessionId, prompt, { agent: request.agent })
    return { delegationId: request.delegationId, childSessionId, status: "running" as const }
  }
  // Fallback: abort + dispatch with new agent
}
```

---

## REQ-06: Total Tool Activity Duration Tracking

**File:** `src/coordination/delegation/completion-detector.ts`
**Risk:** HIGH (regression risk for 91 existing tests)

### Current checkSemanticCompletion (completion-detector.ts:191-213)

Checks three conditions:
1. `toolActivityStalled` — last tool use > threshold ms ago
2. `hasAssistantMessage` — last message is from assistant
3. `hasFileChanges` — file change indicators detected

`isComplete = toolActivityStalled && hasAssistantMessage && hasFileChanges`

### Target

Add fourth condition: `totalToolActivityDuration > 60000`.

The total duration is the cumulative wall-clock time that tools were executing, computed from message timestamps. The pure function approach keeps `checkSemanticCompletion` stateless and testable.

### Extended Interfaces

```typescript
export interface SemanticCompletionOptions {
  toolIdleThresholdMs?: number
  now?: number
  minTotalToolActivityDurationMs?: number  // NEW
}

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

### New Pure Function

```typescript
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
  // Last tool_use extends to now
  total += (now ?? Date.now()) - timestamps[timestamps.length - 1]

  return total
}
```

### Updated checkSemanticCompletion

```typescript
export function checkSemanticCompletion(
  messages: unknown[],
  options?: SemanticCompletionOptions
): SemanticCompletionResult {
  const now = options?.now ?? Date.now()
  const threshold = options?.toolIdleThresholdMs ?? DEFAULT_TOOL_IDLE_MS
  const minDuration = options?.minTotalToolActivityDurationMs ?? 60000

  const lastToolActivityAt = findLastToolActivity(messages)
  const secondsSinceLastToolActivity =
    lastToolActivityAt !== null ? (now - lastToolActivityAt) / 1000 : null
  const toolActivityStalled =
    lastToolActivityAt !== null && now - lastToolActivityAt > threshold
  const hasAssistantMessage = hasAssistantLastMessage(messages)
  const hasFileChanges = hasFileChangeIndicators(messages)
  const totalToolActivityDurationMs = computeTotalToolActivityDuration(messages, now)
  const hasSufficientToolDuration = totalToolActivityDurationMs >= minDuration

  // Now requires ALL FOUR conditions
  const isComplete = toolActivityStalled && hasAssistantMessage && hasFileChanges && hasSufficientToolDuration

  return {
    toolActivityStalled,
    hasAssistantMessage,
    hasFileChanges,
    isComplete,
    lastToolActivityAt,
    secondsSinceLastToolActivity,
    totalToolActivityDurationMs,
  }
}
```

### Acceptance Criteria Verification

From SPEC.md:
- "6 tool calls in 10s then idle for 60s does NOT trigger completion": `totalToolActivityDurationMs ≈ 10000 < 60000` → `hasSufficientToolDuration = false` → blocked ✓
- "12 tool calls over 70s THEN 60s idle DOES trigger completion": `totalToolActivityDurationMs >= 60000` AND `toolActivityStalled = true` ✓

### Existing Test Files

- `tests/lib/coordination/delegation/completion-detector.test.ts` — the pure function tests (MUST update mocks)
- `tests/lib/completion-detector.test.ts` — legacy test file
- `tests/lib/completion-detector-crash.test.ts` — crash detection tests

**WARNING:** The 91 existing CP-DT-01 regression tests may include tests that expect `isComplete = true` with fewer conditions. Every test using `checkSemanticCompletion` must be updated to include sufficient tool_use timestamps in mock data.

---

## GAP-N1: Redundant TUI Toast

**File:** `src/plugin.ts`
**Risk:** MINUTE

Remove line 164:
```typescript
await showTuiToast(options.client, `Delegation ${notification.type} delivered`)
```

The `system_reminder` block at line 162-163 already notifies the user. This is a one-line removal.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session prompt delivery | Custom SDK session client | `sendPromptAsync` from `session-api.ts:183` | Already wraps `client.session.promptAsync` with validation and session ID assertion |
| Pending notification storage | Custom queue | `PendingNotification[]` in continuity + `patchSessionContinuity` | Already exists with clone-on-read, persistence, and hydration |
| Zod schema validation | Custom control action parser | Extend existing `DelegationControlSchema` at delegation-status.ts:11 | Already uses `z.enum()` with contextual `.refine()` |
| Tool activity time computation | New stateful tracker class | Pure function `computeTotalToolActivityDuration` on messages array | `checkSemanticCompletion` is pure; keeps it testable and stateless |
| File path extraction | New file change scanner | Pure function `extractFileChanges` using existing `FILE_PATH_PATTERN` and `FILE_CHANGE_TOOL_NAMES` | Reuses existing regex patterns and tool name set |

---

## Common Pitfalls

### Pitfall 1: Resume on non-completed delegation
**What goes wrong:** Trying to resume a delegation that's still running or in error state.
**How to avoid:** Guard: only allow `resume` and `chain` on `completed` status; allow `adjust-prompt` only on `running` status; ALL other actions on terminal statuses throw.
**Warning signs:** "cannot control terminal delegation" error.

### Pitfall 2: Double-notification on session resume
**What goes wrong:** Both the existing lifecycle replay AND the new init-time drain fire for the same pending notifications.
**How to avoid:** Clear `pendingNotifications` from continuity immediately after successful replay in EITHER path. The lifecycle handler already does `patchSessionContinuity(sessionID, { pendingNotifications: [] })` at lifecycle/index.ts:187. The new init-time drain also clears. Since both read fresh data, whichever runs first clears the array and the other sees empty.
**Warning signs:** User sees duplicate delegation notifications.

### Pitfall 3: `sendPromptAsync` called on a terminated session
**What goes wrong:** Resume tries to `sendPromptAsync` to a child session that was already deleted/abandoned by OpenCode.
**How to avoid:** Surround `sendPromptAsync` with try/catch in the facade's resume/chain handler. On failure, fall back to abort+dispatch (creating a new session). This preserves backward compatibility.
**Warning signs:** Silent failure — resume appears to succeed but child session never responds.

### Pitfall 4: Existing test regression on completion detector
**What goes wrong:** Adding `hasSufficientToolDuration` to `isComplete` breaks existing tests that expect `isComplete = true` with 3 conditions instead of 4.
**How to avoid:** Update all existing test expectations to include sufficient tool_use timestamps with span in mock data. Then add a new test for the short-burst blocking scenario.
**Verification:** `npx vitest run tests/lib/coordination/delegation/completion-detector.test.ts -t "completion"` must pass.

### Pitfall 5: Coordinated two-file schema change
**What goes wrong:** `DelegationControlSchema`, `DelegationControlRequest`, `ManagerLike.controlDelegation`, and `handleControl` must ALL be updated atomically. Partial updates will cause type errors or runtime schema rejection.
**How to avoid:** Add the two new actions (`adjust-prompt`, `change-agent`) to ALL four locations in the same commit.

### Pitfall 6: `handleControl` bypasses schema for non-manager path
**What goes wrong:** At delegation-status.ts:189, `action: args.control.action as any` uses a type cast that could bypass schema validation if the schema hasn't been updated.
**How to avoid:** `args.control.action` comes from the Zod-parsed `control` object. If the schema is updated first (lines 11-16), the type-safe output from `z.enum(["abort", "cancel", "restart", "resume", "chain", "adjust-prompt", "change-agent"])` will be correct.

---

## Code Examples

### Pattern 1: Injecting sendPromptAsync into DelegationManager

From `src/plugin.ts:203-210`:
```typescript
const delegationManager = new DelegationManager(options.enableRuntimeAdapter ? options.client : undefined, {
  coordinator,
  lifecycle,
  monitor,
  notificationRouter,
  ptyManager: options.ptyManager,
  runtimePolicy: options.runtimePolicy,
  sendPromptAsync: (sessionId, prompt) => sendPromptAsync(options.client, sessionId, {
    parts: [{ type: "text", text: prompt }],
  }),
})
```

### Pattern 2: Init-time pending notification drain

```typescript
async function replayPendingDelegationNotifications(client: OpenCodeClient): Promise<void> {
  const allSessions = listSessionContinuity()
  for (const record of Object.values(allSessions)) {
    const pending = record.metadata.pendingNotifications ?? []
    if (pending.length === 0) continue
    const sessionId = record.sessionID
    if (!sessionId) continue
    for (const notification of pending) {
      const line = notification.resultPreview ??
        `Delegation ${notification.metadata?.delegationId ?? "unknown"} ${notification.status}`
      try {
        await appendTuiPrompt(client, line)
      } catch { break }
    }
    patchSessionContinuity(sessionId, { pendingNotifications: [] })
  }
}
```

### Pattern 3: Total tool activity duration (pure function)

See REQ-06 section above for full `computeTotalToolActivityDuration` implementation. This reuses existing helper functions `getMessageParts` (line 59-62) and `getNestedValue` (from `shared/helpers.ts`).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Resume creates new child session (abort+dispatch) | Resume reuses existing childSessionId (sendPromptAsync) | Phase 15 | Preserves delegation context across resume/chain rounds |
| Notification replay only via lifecycle event hooks | Notification replay at BOTH plugin init AND lifecycle events | Phase 15 | Covers session-ended scenario that event-based replay misses |
| isComplete = 3 conditions (stalled + assistant + fileChanges) | isComplete = 4 conditions (+ totalToolActivityDuration > 60s) | Phase 15 | Prevents false completions from brief tool bursts |
| 5 control actions | 7 control actions (+ adjust-prompt, + change-agent) | Phase 15 | Enables mid-delegation adjustments without abort |

---

## Validation Architecture

> `workflow.nyquist_validation` not explicitly set to false — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (current project version) |
| Config file | root `vitest.config.ts` or similar |
| Quick run command | `npx vitest run tests/lib/coordination/delegation/ tests/tools/delegation/ -t "resume|chain|adjust|complete|notif"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | controlDelegation("resume") reuses childSessionId | integration | `npx vitest run tests/lib/coordination/delegation/ -t "resume"` | ❌ Wave 0 |
| REQ-02 | Pending notification replay on plugin init | integration | `npx vitest run tests/lib/coordination/delegation/ -t "replay"` | ❌ Wave 0 |
| REQ-03 | formatDelegationNotification includes path/fileChanges/completedAt | unit | `npx vitest run tests/lib/coordination/delegation/ -t "format"` | ❌ Wave 0 |
| REQ-04 | chain() appends to completed child session | integration | `npx vitest run tests/lib/coordination/delegation/ -t "chain"` | ❌ Wave 0 |
| REQ-05 | DelegationControlSchema accepts adjust-prompt, change-agent | unit | `npx vitest run tests/tools/delegation/ -t "control"` | ❌ Wave 0 |
| REQ-06 | computeTotalToolActivityDuration > 60s blocks completion | unit | `npx vitest run tests/lib/coordination/delegation/ -t "duration"` | ❌ Wave 0 |

### Existing Test Files
- `tests/lib/coordination/delegation/completion-detector.test.ts` — MUST update mocks for REQ-06
- `tests/lib/completion-detector.test.ts` — legacy, may need update
- `tests/tools/delegation/delegation-status-v2.test.ts` — add tests for new control actions
- Existing manager/coordinator tests — may need resume/chain tests

### Wave 0 Gaps
- [ ] `tests/lib/coordination/delegation/completion-detector.test.ts` — update existing mocks to include sufficient tool_use timestamps
- [ ] `tests/lib/coordination/delegation/` — add `computeTotalToolActivityDuration` tests (short burst, long activity, edge cases)
- [ ] `tests/tools/delegation/delegation-status-v2.test.ts` — add adjust-prompt + change-agent schema and execution tests
- [ ] Integration test for resume/chain with `sendPromptAsync` — may need mock for `sendPromptAsync` dependency

---

## Security Domain

> `security_enforcement` not explicitly disabled — included.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schema (`DelegationControlSchema`) with `.refine()` — no raw type assertions |
| V8 Data Protection | partial | `sendPromptAsync` body serialization goes through SDK wrapper; no raw string concatenation |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Schema injection in control action | Tampering | Zod `.refine()` validates action enum and required fields before execution |
| Session hijack via resume | Spoofing | `resumedFrom` on new record references old delegation; parentSessionId inherited from original |
| Pending notification replay injection | Tampering | Reads from `.hivemind/state/` continuity file which is clone-on-read — no direct mutation |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `sendPromptAsync` accepts body with `agent` field (not just `parts`) | REQ-01, REQ-05 | If `agent` is not supported in the body, remove it from the resume call — `parts` alone is sufficient for prompt delivery |
| A2 | Message tool_use part timestamps exist and are reliable for duration computation | REQ-06 | If timestamps are sparse, fall back to simpler time-window approximation (first tool to now). Acceptable approximation |
| A3 | Existing 91 regression tests will break with 4-condition `isComplete` | REQ-06 | If tests don't exercise `checkSemanticCompletion`, risk is lower. Still, all callers must be updated |
| A4 | `listSessionContinuity()` returns all continuity records including parent sessions | REQ-02 | If it only returns active managed sessions, pending notifications stored against dead sessions won't be found. Verify at implementation time |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: source code] `src/coordination/delegation/manager.ts` — DelegationManager facade, controlDelegation method at lines 158-195
- [VERIFIED: source code] `src/coordination/delegation/coordinator.ts` — DelegationCoordinator, chain() at lines 220-237
- [VERIFIED: source code] `src/coordination/delegation/notification-router.ts` — NotificationRouter with replayPending at lines 100-107
- [VERIFIED: source code] `src/coordination/delegation/notification-formatter.ts` — NotificationFormatOptions at lines 11-18, format functions
- [VERIFIED: source code] `src/coordination/delegation/completion-detector.ts` — checkSemanticCompletion at lines 191-213
- [VERIFIED: source code] `src/coordination/delegation/types.ts` — Delegation interface with resumedFrom/chainedFrom at lines 61-63
- [VERIFIED: source code] `src/tools/delegation/delegation-status.ts` — DelegationControlSchema at lines 11-16, ManagerLike at lines 27-32
- [VERIFIED: source code] `src/plugin.ts` — deliver callback at lines 160-166, persistPendingDelegationNotifications at lines 100-127
- [VERIFIED: source code] `src/shared/session-api.ts` — sendPromptAsync at lines 183-195, appendTuiPrompt at lines 204-207
- [VERIFIED: source code] `src/task-management/lifecycle/index.ts` — replayPendingNotificationsForEvent at lines 169-192
- [VERIFIED: source code] `src/task-management/continuity/index.ts` — getSessionContinuity, patchSessionContinuity, listSessionContinuity
- [VERIFIED: source code] `src/coordination/completion/notification-handler.ts` — notifyParentSession at lines 168-197, replayPendingNotifications at lines 199-212

### Secondary (MEDIUM confidence)
- [VERIFIED: Phase 14 gap analysis] `14-GAPS-ANALYSIS-2026-05-19.md` — source of all 8 gaps with per-gap fix requirements
- [CITED: opencode.ai/docs/plugins] Custom tools use `tool({ description, args, execute })` pattern; `tool.execute.before` and `tool.execute.after` hooks accept `(input, output) => void`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all required SDK capabilities already present in codebase
- Architecture: HIGH — surgical modifications to existing interfaces; no new modules
- Pitfalls: MEDIUM — `sendPromptAsync` on terminated session behavior depends on SDK runtime; existing test regression risk

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable codebase — surgical gap fixes, not framework upgrades)
