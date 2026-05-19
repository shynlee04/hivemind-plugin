# Phase 15: Delegate-Task Gap Remediation — Resume, Delivery, Rich Notifications — Pattern Map

**Mapped:** 2026-05-19
**Files classified:** 6 modified (8 gaps)
**Analogs found:** 6 / 6 — all files have exact role-match analogs in the existing codebase

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/coordination/delegation/manager.ts` | service (facade) | request-response | `manager-runtime.ts:173-253` (dispatch) + current `manager.ts:158-195` (controlDelegation) | exact |
| `src/coordination/delegation/coordinator.ts` | service | chain-request | `coordinator.ts:220-237` (current chain) | exact |
| `src/coordination/delegation/notification-formatter.ts` | utility | pure-transform | `notification-formatter.ts:31-55` (existing format functions) | exact |
| `src/coordination/delegation/completion-detector.ts` | service | stream-analysis | `completion-detector.ts:191-213` (checkSemanticCompletion) | exact |
| `src/tools/delegation/delegation-status.ts` | tool | request-response | `delegation-status.ts:11-16,182-201` (schema + handleControl) | exact |
| `src/plugin.ts` | config (composition root) | init-time | `plugin.ts:153-212` (setupDelegationModules) | exact |

## Pattern Assignments

---

### `src/coordination/delegation/manager.ts` (service/facade, request-response)

**Analog:** Self — `manager.ts:158-195` (current controlDelegation) and `manager-runtime.ts:173-253` (dispatch pattern)

**Strategy:** REFACTOR — restructure `controlDelegation()` to support two dispatch paths: existing abort+dispatch for restart, new `sendPromptAsync` path for resume/chain/adjust-prompt/change-agent.

#### Imports pattern (lines 1-11)
```typescript
import type { CompletionDetector } from "../completion/detector.js"
import type { PtyManager } from "../../features/background-command/pty/pty-manager.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import type { CommandDelegationParams, RuntimePolicy } from "../../shared/types.js"
import type { DelegateParams } from "../spawner/spawn-request-builder.js"
import type { DelegationCoordinator, DispatchParams } from "./coordinator.js"
import { DelegationManager as RuntimeDelegationManager } from "./manager-runtime.js"
import type { DelegationMonitor } from "./monitor.js"
import type { NotificationRouter } from "./notification-router.js"
import type { Delegation, DelegationResult } from "./types.js"
```

#### Dependency injection pattern (lines 22-29)
```typescript
export type DelegationManagerOptions = {
  coordinator?: Pick<DelegationCoordinator, "chain" | "dispatch"> & Partial<Pick<DelegationCoordinator, ...>>
  lifecycle?: FacadeLifecycle
  monitor?: Pick<DelegationMonitor, "start">
  notificationRouter?: Pick<NotificationRouter, "register">
  ptyManager?: PtyManager | null
  runtimePolicy?: RuntimePolicy
  // NEW: sendPromptAsync for resume/chain
  sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>
}
```

**Pattern:** Constructor takes an options object with `Pick<>` partials — each dependency is optional, typed via `Pick<Interface, "methodName">`. New code must follow this pattern: add `sendPromptAsync` to `DelegationManagerOptions`.

#### Facade pattern (lines 48-62, 70-73)
```typescript
export class DelegationManager {
  private readonly runtime?: RuntimeDelegationManager

  constructor(client?: OpenCodeClient, private readonly options: DelegationManagerOptions = {}) {
    if (client) {
      this.runtime = new RuntimeDelegationManager(client, { ... })
    }
  }

  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    if (this.options.coordinator) return this.options.coordinator.dispatch(this.toDispatchParams(params))
    return this.requireRuntime().dispatch(params)
  }
}
```

**Pattern:** The facade checks `this.options.coordinator` (v2 path) first, falls back to `this.runtime` (legacy runtime adapter). New resume/chain code follows the same pattern: check `this.options.sendPromptAsync`, use it, fall back to existing abort+dispatch.

#### Current controlDelegation (lines 158-195) — the code to restructure
```typescript
async controlDelegation(request: DelegationControlRequest): Promise<DelegationResult> {
    const delegation = this.getStatus(request.delegationId)
    if (!delegation) throw new Error(`[Harness] Delegation "${request.delegationId}" not found`)
    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
      throw new Error("[Harness] cannot control terminal delegation")  // ← Blocks resume!
    }
    if (request.action === "abort") return this.abortDelegation(request.delegationId)
    // ... abort + dispatch for restart, resume, chain
    const original = this.options.coordinator?.abortDelegation?.(...)
    const replacement = this.options.coordinator
      ? await this.options.coordinator.dispatch({...})  // ← Creates NEW childSessionId!
      : await this.dispatch({...})
    // Sets resumedFrom / chainedFrom on the replacement record
    if (replacementRecord) {
      if (request.action === "restart") replacementRecord.restartedFrom = delegation.id
      if (request.action === "resume") replacementRecord.resumedFrom = delegation.id
      if (request.action === "chain") replacementRecord.chainedFrom = delegation.id
    }
```

**Key insight:** The terminal guard at line 162 blocks resume (which needs completed delegations). The `coordinator.dispatch` at line 175 creates a new session ID. New code must:
1. Relax terminal guard for `resume` and `chain` actions
2. Bypass `coordinator.dispatch` when `this.options.sendPromptAsync` exists
3. Create new delegation record with `lifecycle.register` (which must be added to `FacadeLifecycle`)
4. Reuse `childSessionId` from the original delegation

---

### `src/coordination/delegation/coordinator.ts` (service, chain)

**Analog:** Self — `coordinator.ts:220-237` (current chain)

#### Dependency injection pattern (lines 17-32)
```typescript
export interface DelegationCoordinatorDeps {
  childSessionStarter?: { start: ... }
  dispatcher: Pick<DelegationDispatcher, "preflightCheck">
  monitor: Pick<DelegationMonitor, "onCompletion" | "start" | "stop">
  notificationRouter: Pick<NotificationRouter, "deregister" | "register" | "route">
  lifecycle: Pick<DelegationLifecycle, ...> & Partial<Pick<DelegationLifecycle, "getStatus" | "list" | "register">>
  detector: { signalCompletionEvent, signalTerminalStatus, unwatch, watchDualSignal }
  retryHandler: Pick<DelegationRetryHandler, "persistWithRetry">
}
```

#### Current chain() (lines 220-237) — each step creates a new child session
```typescript
async chain(delegations: ChainStep[]): Promise<DelegationResult[]> {
    const results: DelegationResult[] = []
    for (const [index, step] of delegations.entries()) {
      const previous = results.at(-1)
      const result = await this.dispatch({  // ← Each step = new childSessionId
        agent: step.agent,
        currentDepth: index,
        parentSessionId: "chain",
        prompt: step.usePreviousResult && previous
          ? `${step.prompt}\n\nPrevious result: ...`
          : step.prompt,
        queueKey: `chain:${step.agent}:${index}`,
      })
      const completedResult = result.status === "dispatched"
        ? { ...result, result: result.result ?? result.delegationId, status: "completed" as const }
        : result
      results.push(completedResult)
      if (completedResult.status !== "completed") break
    }
    return results
}
```

**Target modification:** After step 0, use `sendPromptAsync` to append to the previous step's `childSessionId` instead of calling `this.dispatch()`. The pattern follows the same `sendPromptAsync` mechanism as resume — create a new record with `chainedFrom` pointing to the prior delegation, but reuse the same `childSessionId`.

#### dispatch() call site pattern (lines 65-98)
```typescript
async dispatch(params: DispatchParams): Promise<DelegationResult> {
    const preflight = await this.deps.dispatcher.preflightCheck(params)
    const delegationId = this.createDelegationId()
    const record = this.createRecord(delegationId, params, preflight.queueKey)
    this.active.set(delegationId, { record, slotHandle: preflight.slotHandle })
    this.deps.lifecycle.register?.(record)
    this.deps.lifecycle.transition(delegationId, "dispatched")
    // ... start child session, monitor, dual-signal watch
    return { delegationId, ... }
}
```

**Pattern for chain-append:** The chain modification must NOT call `dispatch()` for subsequent steps. Instead, it should call `sendPromptAsync` directly, create a record with `chainedFrom`, and return immediately (no new monitoring/dual-signal needed since the session is already active).

---

### `src/coordination/delegation/notification-formatter.ts` (utility, pure-transform)

**Analog:** Self — `notification-formatter.ts:11-18` (NotificationFormatOptions) and `notification-formatter.ts:31-55` (format functions)

#### Pure function pattern (lines 7, 31-55)
```typescript
/**
 * Pure formatting functions for TUI delegation notifications.
 * No side effects, no SDK calls, no state — pure functions only.
 */

export interface NotificationFormatOptions {
  delegationId: string
  agent: string
  status: "completed" | "error" | "timeout" | "cancelled"
  elapsedMs: number
  toolCount?: number
  summaryPreview?: string
  // NEW fields for rich notification:
  path?: string
  fileChanges?: string[]
  completedAt?: string
}

export function formatDelegationNotification(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  const tools = opts.toolCount != null ? String(opts.toolCount) : "n/a"
  const summary = opts.summaryPreview ? ` | ${opts.summaryPreview}` : ""
  return `<system_reminder>[DT:${opts.delegationId}] ${icon} ${opts.status} | agent=${opts.agent} | ${formatDuration(opts.elapsedMs)} | tools=${tools}${summary}</system_reminder>`
}
```

**Convention:**
- Pure functions only — no side effects, no SDK calls, no imports from deep modules
- Interface-first: `NotificationFormatOptions` defines all inputs
- String output with `<system_reminder>` tags for system delivery
- Compact format for TUI (`formatCompactLine`) omits summary but keeps path/fileCount

#### formatCompactLine (lines 42-46)
```typescript
export function formatCompactLine(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  const tools = opts.toolCount != null ? String(opts.toolCount) : "n/a"
  return `[DT:${opts.delegationId}] ${icon} ${opts.status} | ${formatDuration(opts.elapsedMs)} | tools=${tools} | agent=${opts.agent}`
}
```

**How new code follows this:** Extend `NotificationFormatOptions` with `path`, `fileChanges`, `completedAt`. Update both `formatDelegationNotification` and `formatCompactLine` to include the new fields in their template strings. Keep the module pure — no imports from `session-api.ts`, `plugin.ts`, or coordination modules.

---

### `src/coordination/delegation/completion-detector.ts` (service, stream-analysis)

**Analog:** Self — `completion-detector.ts:191-213` (checkSemanticCompletion)

#### Pure function pattern (lines 191-213)
```typescript
export function checkSemanticCompletion(
  messages: unknown[],
  options?: SemanticCompletionOptions
): SemanticCompletionResult {
  const now = options?.now ?? Date.now()
  const threshold = options?.toolIdleThresholdMs ?? DEFAULT_TOOL_IDLE_MS
  const lastToolActivityAt = findLastToolActivity(messages)
  const secondsSinceLastToolActivity =
    lastToolActivityAt !== null ? (now - lastToolActivityAt) / 1000 : null
  const toolActivityStalled =
    lastToolActivityAt !== null && now - lastToolActivityAt > threshold
  const hasAssistantMessage = hasAssistantLastMessage(messages)
  const hasFileChanges = hasFileChangeIndicators(messages)
  const isComplete = toolActivityStalled && hasAssistantMessage && hasFileChanges  // ← 3 conditions
  return {
    toolActivityStalled, hasAssistantMessage, hasFileChanges,
    isComplete, lastToolActivityAt, secondsSinceLastToolActivity,
  }
}
```

#### Existing helper functions (lines 42-97, 59-62, 80-97)
```typescript
export function getMessageParts(message: unknown): unknown[] {
  const parts = getNestedValue(message, ["parts"])
  return Array.isArray(parts) ? parts : []
}

export function findLastToolActivity(messages: unknown[]): number | null {
  let lastTimestamp: number | null = null
  for (const message of messages) {
    const parts = getMessageParts(message)
    for (const part of parts) {
      if (getNestedValue(part, ["type"]) !== "tool_use") continue
      const partTs = getNestedValue(part, ["timestamp"])
      const msgTs = getNestedValue(message, ["timestamp"])
      const ts = typeof partTs === "number" ? partTs : typeof msgTs === "number" ? msgTs : null
      if (ts !== null) lastTimestamp = ts
    }
  }
  return lastTimestamp
}
```

#### SemanticCompletionResult + SemanticCompletionOptions (lines 3-15)
```typescript
export interface SemanticCompletionResult {
  toolActivityStalled: boolean
  hasAssistantMessage: boolean
  hasFileChanges: boolean
  isComplete: boolean
  lastToolActivityAt: number | null
  secondsSinceLastToolActivity: number | null
  // NEW: totalToolActivityDurationMs: number
}

export interface SemanticCompletionOptions {
  toolIdleThresholdMs?: number
  now?: number
  // NEW: minTotalToolActivityDurationMs?: number
}
```

**How new code follows this:** Add `totalToolActivityDurationMs` to `SemanticCompletionResult`, `minTotalToolActivityDurationMs` to `SemanticCompletionOptions`. Create new pure function `computeTotalToolActivityDuration(messages, now?)` that reuses `getMessageParts` and `getNestedValue` (from `shared/helpers.ts`). Update `isComplete` to require all FOUR conditions.

The key pattern: all functions are pure, stateless, receive messages array + options, return structured results. No side effects, no SDK calls, no state.

---

### `src/tools/delegation/delegation-status.ts` (tool, request-response)

**Analog:** Self — `delegation-status.ts:11-16` (DelegationControlSchema) and `delegation-status.ts:182-201` (handleControl)

#### Zod schema pattern (lines 11-16)
```typescript
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "resume", "chain"]),
  chainParentSessionId: z.string().optional(),
  restartPrompt: z.string().optional(),
}).refine((value) => (value.action === "restart" || value.action === "resume") ? !!value.restartPrompt : true, "restartPrompt is required for restart and resume")
  .refine((value) => value.action !== "chain" || !!value.chainParentSessionId, "chainParentSessionId is required for chain")
```

**How new code follows this:** Add `"adjust-prompt"` and `"change-agent"` to the `z.enum()` array. Add `agent: z.string().optional()` field. Add two new `.refine()` calls:
```typescript
.refine((v) => v.action !== "adjust-prompt" || !!v.restartPrompt, "restartPrompt required for adjust-prompt")
.refine((v) => v.action !== "change-agent" || !!v.agent, "agent required for change-agent")
```

#### ManagerLike type pattern (lines 27-32)
```typescript
type ManagerLike = {
  canSessionAccessDelegation: (sessionId: string | undefined, delegation: Delegation | undefined) => boolean
  controlDelegation?: (request: {
    action: "abort" | "cancel" | "restart" | "resume" | "chain"
    delegationId: string
    chainParentSessionId?: string
    restartPrompt?: string
  }) => Promise<unknown>
  getAllDelegations: () => Delegation[]
  getStatus: (id: string) => Delegation | undefined
}
```

**How new code follows this:** Add `"adjust-prompt" | "change-agent"` to the action union and `agent?: string` to the request type. This type is a **local contract** between the tool and the manager — it must be kept in sync with `DelegationControlRequest` in `manager.ts:31-37`.

#### handleControl pattern (lines 182-201)
```typescript
async function handleControl(args, context, manager, readPersisted, deps): Promise<string> {
  if (!args.delegationId || !args.control) return renderToolResult(error("..."))
  const delegation = (manager.getStatus(args.delegationId) ?? readPersisted().find(...))
  if (!delegation) return renderToolResult(error("..."))
  if (!manager.canSessionAccessDelegation(context.sessionID, delegation)) return renderToolResult(error("..."))
  if (deps.lifecycle?.isTerminal(delegation.status)) return renderToolResult(error("..."))
  if (manager.controlDelegation) {
    const result = await manager.controlDelegation({
      action: args.control.action,
      delegationId: delegation.id,
      chainParentSessionId: args.control.chainParentSessionId,
      restartPrompt: args.control.restartPrompt,
      // NEW: agent: args.control.agent,
    })
    if (args.control.action === "abort") await deps.terminateChild?.(...)
    return renderToolResult(success(`Delegation ${delegation.id} ${args.control.action}ed`, result))
  }
  // Fallback for abort/cancel without manager
  ...
}
```

**Pattern:** Guard chain: parse → find delegation → access check → terminal check → delegate to manager → render result. New actions follow the same flow — no special-casing needed because the action enum routes through the manager.

#### Tool entry point pattern (lines 116-173)
```typescript
export function createDelegationStatusTool(
  delegationManager: ManagerLike,
  deps: StatusDeps = {},
): ReturnType<typeof tool> {
  const s = tool.schema
  return tool({
    description: "...",
    args: { ... },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      const parsed = DelegationStatusInputSchema.safeParse(rawArgs)
      if (!parsed.success) return renderToolResult(error(`...`))
      const args = parsed.data
      try {
        // ... action dispatch
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}
```

**Convention:**
- Zod schema at module level, shared between validation and type inference
- `tool()` factory wraps everything — no direct class instantiation
- `safeParse` at entry → render error or proceed
- try/catch at top level → caughtError → `instanceof Error` check → `String()` fallback
- `renderToolResult(success(...))` / `renderToolResult(error(...))` standardized response

---

### `src/plugin.ts` (config/composition-root, init-time)

**Analog:** Self — `plugin.ts:153-212` (setupDelegationModules) and `plugin.ts:214-426` (HarnessControlPlane)

#### setupDelegationModules pattern (lines 153-212) — composition root
```typescript
export function setupDelegationModules(options: DelegationModuleSetupOptions): DelegationModuleSetup {
  const records = new Map<string, Delegation>()
  const slotManager = new SlotManager()
  const agentResolver = new AgentResolver({ ... })
  const dispatcher = new DelegationDispatcher({ agentResolver, slotManager })
  const detector = new CompletionDetector()
  const notificationRouter = new NotificationRouter({
    deliver: async (_parentSessionId, notification) => {
      if (!shouldAppendParentTuiNotification(notification.type)) return true
      const line = notificationRouter.formatNotification(...)
      await appendTuiPrompt(options.client, line)     // TUI line injection
      await showTuiToast(options.client, `Delegation ${notification.type} delivered`)  // ← REMOVE (GAP-N1)
      return true
    },
    persistPending: persistPendingDelegationNotifications,
  })
  const lifecycle = new DelegationLifecycle({
    get: (id) => records.get(id),
    getAll: () => Array.from(records.values()),
    registerDelegation: (d) => { records.set(d.id, d) },
    // ...
  })
  const delegationManager = new DelegationManager(options.enableRuntimeAdapter ? options.client : undefined, {
    coordinator,
    lifecycle,
    monitor,
    notificationRouter,
    ptyManager: options.ptyManager,
    runtimePolicy: options.runtimePolicy,
    // NEW: inject sendPromptAsync for resume/chain
    sendPromptAsync: (sessionId, prompt) => sendPromptAsync(options.client, sessionId, {
      parts: [{ type: "text", text: prompt }],
    }),
  })
  return { coordinator, delegationManager, detector, lifecycle, notificationRouter, slotManager }
}
```

**Convention:** All dependency wiring happens in this function. New dependencies are added as options to the `DelegationManager` constructor. The `sendPromptAsync` is a closure wrapping the `session-api.ts` function, not the function itself.

#### Plugin init — recoverPending + lifecycle (lines 223-250)
```typescript
const delegationModules = setupDelegationModules({ ... })
const delegationManager = delegationModules.delegationManager
void delegationManager.recoverPending()

const lifecycleManager = createHarnessLifecycleManager({ ... })
lifecycleManager.hydrateFromContinuity()
delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())
```

**How new code follows this:** After `recoverPending()` and `hydrateFromContinuity()`, add the init-time pending notification drain:
```typescript
void replayPendingDelegationNotifications(client)
```
This reads all continuity records, drains `pendingNotifications` arrays, replays via `appendTuiPrompt`, and clears them. Pattern follows the existing `persistPendingDelegationNotifications` at `plugin.ts:100-127` — reads from continuity, replays, patches.

#### Persist pattern for pending notifications (lines 100-127)
```typescript
function persistPendingDelegationNotifications(records): void {
  const byParent = new Map<string, PendingNotification[]>()
  for (const record of records) { /* group by parentSessionId */ }
  for (const [parentSessionId, pending] of byParent) {
    const current = getSessionContinuity(parentSessionId)
    if (current) {
      patchSessionContinuity(parentSessionId, {
        pendingNotifications: [...current.metadata.pendingNotifications, ...pending]
      })
    } else {
      recordSessionContinuity({ ... })
    }
  }
}
```

**Continuity API pattern (from `task-management/continuity/index.ts`):**
- `getSessionContinuity(sessionID)` → returns record or undefined
- `patchSessionContinuity(sessionID, updates)` → deep-clone-on-read partial update
- `recordSessionContinuity(record)` → create new continuity entry
- `listSessionContinuity()` → returns all records (used by init-time drain)

---

### `src/shared/session-api.ts` — sendPromptAsync call pattern (lines 183-195)

```typescript
export async function sendPromptAsync(
  client: OpenCodeClient,
  sessionID: string,
  body: unknown
): Promise<void> {
  const validSessionID = assertValidSessionID(sessionID)
  const request: SessionPromptAsyncRequest = {
    path: { id: validSessionID },
    body: body as SessionPromptAsyncRequest["body"],
  }
  await client.session.promptAsync(request)
}
```

**Call sites (the pattern new code must follow):**

In `manager-runtime.ts:226-242` (SDK dispatch):
```typescript
const promptBody = {
  parts: [{ type: "text", text: params.prompt }],
  agent: agent.name,
  tools: buildDelegationPromptTools(child.allowedTools),
}
await sendPromptAsync(this.client, delegation.childSessionId, promptBody)
```

In `sdk-child-session-starter.ts:36-40`:
```typescript
await sendPromptAsync(client, childSessionId, {
  agent: params.validatedAgent.name,
  parts: [{ type: "text", text: params.prompt }],
  tools: buildDelegationPromptTools(permissionProfile.tools),
})
```

**For resume/chain (simpler — no tools override needed):**
```typescript
await sendPromptAsync(client, childSessionId, {
  parts: [{ type: "text", text: prompt }],
  // agent is optional for existing sessions — the session already has its agent config
})
```

---

### `src/coordination/delegation/notification-router.ts` — Notification routing pattern (lines 50-71, 126-148)

```typescript
route(notification: DelegationNotification): RouteResult | undefined {
    const route = this.routes.get(notification.delegationId)
    if (!route) return undefined
    // Idempotency check
    if (notification.idempotencyKey && this.deliveredKeys.has(notification.idempotencyKey)) {
      return { parentSessionId: route.parentSessionId, notification }
    }
    // Non-terminal notification: skip delivery
    if (!isParentFacingNotification(notification.type)) { ... }
    // Terminal notification: call deliver callback
    const deliveryResult = this.options.deliver?.(route.parentSessionId, notification) ?? true
    // Handle async delivery
    if (typeof (deliveryResult as Promise<boolean>).then === "function") {
      void (deliveryResult as Promise<boolean>)...  // finalizeDelivery or queuePending
    } else if (deliveryResult) { ... } else { this.queuePending(...) }
}
```

**formatTuiNotification** (line 126-134) — passes through to formatter:
```typescript
formatTuiNotification(type, delegationId, agent, elapsedMs, toolCount?): string {
    const opts: NotificationFormatOptions = {
      agent, delegationId, elapsedMs,
      status: type === "success" ? "completed" : ...,
      toolCount,
      // NEW: path, fileChanges, completedAt
    }
    return formatCompactLine(opts)
}
```

**formatSystemNotification** (line 138-148) — passes through to formatter:
```typescript
formatSystemNotification(type, delegationId, agent, elapsedMs, toolCount?, summary?): string {
    const opts: NotificationFormatOptions = {
      agent, delegationId, elapsedMs,
      status: ..., summaryPreview: summary, toolCount,
      // NEW: path, fileChanges, completedAt
    }
    return formatDelegationNotification(opts)
}
```

---

### `src/coordination/delegation/monitor.ts` — Monitor pattern (lines 75-146)

```typescript
start(delegationId: string, parentSessionId: string): void {
    this.stop(delegationId)
    const tracker = new FailureCheckpointTracker()
    tracker.start(delegationId)
    const state: MonitorState = {
      completed: false, checkpointTracker: tracker, pollingTimers: [], parentSessionId,
    }
    this.states.set(delegationId, state)
    for (const elapsed of this.pollingCadence) {
      state.pollingTimers.push(
        setTimeout(() => {
          if (state.completed) return
          const status = this.getStatus(delegationId)
          const record = this.getDelegationRecord(delegationId)
          // ... inject status lines, check failure checkpoints
        }, elapsed * 1000),
      )
    }
    // 300s final + 600s auto-abort timers...
}
```

**Pattern:** Monitor owns timers via `setTimeout` array, tracks `MonitorState` per delegation, stops on completion. The `onComplete` callback is where the notification chain fires: `coordinator.handleCompletion()` → `monitor.onCompletion()` → `notificationRouter.route()` → deliver callback in `plugin.ts`.

---

## Shared Patterns

### SendPromptAsync Pattern
**Source:** `src/shared/session-api.ts:183-195`, `src/coordination/delegation/manager-runtime.ts:242`, `src/coordination/delegation/sdk-child-session-starter.ts:36`
**Apply to:** `manager.ts` (resume/chain/adjust-prompt/change-agent handlers), `coordinator.ts` (chain-append)

```typescript
await sendPromptAsync(client, childSessionId, {
  parts: [{ type: "text", text: prompt }],
  // agent?: string  — optional, session already has agent config
  // tools?: Record<string, boolean> — optional, for restart with different tool set
})
```

### Dependency Injection Pattern
**Source:** `src/coordination/delegation/manager.ts:22-29`, `src/coordination/delegation/coordinator.ts:17-32`, `src/coordination/delegation/monitor.ts:22-32`
**Apply to:** All new/modified service-class constructors

- Options object with optional `Pick<>` partial dependencies
- Constructor saves as `private readonly this.options = ...`
- Methods check `this.options.X?.Y?.()` before calling
- Tests can inject mocks by passing partial options objects

### Pure Function Pattern
**Source:** `src/coordination/delegation/notification-formatter.ts`, `src/coordination/delegation/completion-detector.ts`
**Apply to:** `notification-formatter.ts` (extend format options), `completion-detector.ts` (add `computeTotalToolActivityDuration`)

- Export standalone functions, not class methods
- Receive all inputs as parameters
- Return structured results (interfaces)
- No side effects, no SDK calls, no imports from deep modules
- Reuse `getNestedValue` and `asString` from `shared/helpers.ts`
- Import only from `shared/` and module-local types

### Zod Schema + Refine Pattern
**Source:** `src/tools/delegation/delegation-status.ts:11-16`
**Apply to:** `delegation-status.ts` (extend DelegationControlSchema)

- `z.object({...}).refine(...)` chain
- Action enum as `z.enum([...])` — extend the array to add new actions
- `.refine()` for conditional required fields
- Add `agent: z.string().optional()` for new actions that need it

### Plugin Wiring / Composition Root Pattern
**Source:** `src/plugin.ts:153-212` (setupDelegationModules)
**Apply to:** `plugin.ts` (inject sendPromptAsync, add pending notification drain)

- Single factory function wires all dependencies
- New capabilities injected as constructor options (not by adding methods to the manager)
- Fire-and-forget with `void` for non-blocking init (e.g., `recoverPending`, replay)
- Continuity operations use `getSessionContinuity` / `patchSessionContinuity` / `listSessionContinuity`

### Tool Entry Point Pattern
**Source:** `src/tools/delegation/delegate-task.ts:30-81`, `src/tools/delegation/delegation-status.ts:116-173`
**Apply to:** All tool factories

```typescript
export function createXxxTool(dependency: DepType): ReturnType<typeof tool> {
  return tool({
    description: "...",
    args: { ... },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      const parsed = Schema.safeParse(rawArgs)
      if (!parsed.success) return renderToolResult(error(`...`))
      try {
        // ... call coordination layer
        return renderToolResult(success(message, data))
      } catch (caughtError) {
        return renderToolResult(error(caughtError instanceof Error ? caughtError.message : String(caughtError)))
      }
    },
  })
}
```

---

## Data Flow Summary

```
User sends control action (delegation-status tool)
  → delegation-status.ts: Zod validation + access check
  → manager.ts: controlDelegation() route by action
    → resume/chain: sendPromptAsync to existing childSessionId
    → adjust-prompt: sendPromptAsync to running childSessionId
    → change-agent: abort + sendPromptAsync with new agent
    → restart: abort + coordinator.dispatch (existing path)
  → coordinator.ts: chain() uses sendPromptAsync from step 2+
  → completion-detector.ts: checkSemanticCompletion adds 4th condition
  → notification-router.ts: route() delivers notification
    → plugin.ts deliver callback: appendTuiPrompt
    → on failure: queuePending → persistPendingDelegationNotifications → continuity
  → plugin.ts init: replayPendingDelegationNotifications reads continuity → appendTuiPrompt
```

## No Analog Found

All 6 modified files have exact codebase analogs (they are modifications to existing files, not new modules). No analog search was needed beyond the existing files themselves.

## Metadata

**Analog search scope:** `src/coordination/delegation/`, `src/tools/delegation/`, `src/plugin.ts`, `src/shared/session-api.ts`, `src/task-management/continuity/`
**Files scanned:** 14 source files (manager.ts, manager-runtime.ts, coordinator.ts, notification-router.ts, notification-formatter.ts, completion-detector.ts, monitor.ts, types.ts, delegation-status.ts, delegate-task.ts, plugin.ts, session-api.ts, sdk-child-session-starter.ts, dispatcher.ts)
**Pattern extraction date:** 2026-05-19
