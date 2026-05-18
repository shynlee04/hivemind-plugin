# Phase 14: Wire Monitor/Notification into DelegationManager.dispatch — Pattern Map

**Mapped:** 2026-05-19  
**Files analyzed:** 22 surfaces/files  
**Analogs found:** 21 / 22  
**Ngôn ngữ:** Vietnamese  
**Evidence level:** L5 pattern map; không claim runtime readiness.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/coordination/delegation/manager.ts` | service/facade | request-response + control | `src/coordination/delegation/manager.ts` | exact self-analog |
| `src/coordination/delegation/manager-runtime.ts` | service/runtime adapter | request-response + CRUD-ish state transitions | `src/coordination/delegation/coordinator.ts` | role-match |
| `src/plugin.ts` | config/composition root | event-driven + dependency injection | `src/plugin.ts` | exact self-analog |
| `src/coordination/delegation/monitor.ts` | service/monitor | timer event-driven + streaming status | `src/coordination/delegation/monitor.ts` | exact self-analog |
| `src/coordination/delegation/escalation-timer.ts` | utility/tracker | timer event-driven + transform | `src/coordination/delegation/escalation-timer.ts` | exact self-analog |
| `src/coordination/delegation/notification-router.ts` | service/router | event-driven + request-response delivery | `src/coordination/delegation/notification-router.ts` | exact self-analog |
| `src/coordination/delegation/notification-formatter.ts` | utility/formatter | transform | `src/coordination/delegation/notification-formatter.ts` | exact self-analog |
| `src/coordination/delegation/completion-detector.ts` | utility/detector | batch transform over messages | `src/coordination/delegation/completion-detector.ts` | exact self-analog |
| `src/coordination/delegation/types.ts` | model/contracts | transform/config constants | `src/coordination/delegation/types.ts` | exact self-analog |
| `src/tools/delegation/delegation-status.ts` | tool/controller | request-response + control | `src/tools/delegation/delegation-status.ts` | exact self-analog |
| `src/tools/delegation/delegate-task.ts` | tool/controller | request-response dispatch | `src/tools/delegation/delegate-task.ts` | exact self-analog |
| `src/shared/session-api.ts` | shared SDK wrapper | request-response SDK I/O | `src/shared/session-api.ts` | exact self-analog |
| `tests/lib/coordination/delegation/monitor.test.ts` | test | timer/event-driven verification | `tests/lib/coordination/delegation/monitor.test.ts` | exact |
| `tests/lib/coordination/delegation/notification-router.test.ts` | test | routing/idempotency verification | `tests/lib/coordination/delegation/notification-router.test.ts` | exact |
| `tests/lib/coordination/delegation/coordinator.test.ts` | test | orchestration/control verification | `tests/lib/coordination/delegation/coordinator.test.ts` | exact |
| `tests/lib/coordination/delegation/completion-detector.test.ts` | test | semantic message transform verification | `tests/lib/coordination/delegation/completion-detector.test.ts` | exact |
| `tests/integration/delegation-v2-integration.test.ts` | integration test | plugin/tool/hook event flow | `tests/integration/delegation-v2-integration.test.ts` | exact |
| `tests/tools/delegation/delegate-task-v2.test.ts` | tool test | request-response validation | `tests/tools/delegation/delegate-task-v2.test.ts` | exact, but stale cases |
| `tests/tools/delegation/delegation-status-v2.test.ts` | tool test | request-response + control validation | `tests/tools/delegation/delegation-status-v2.test.ts` | exact, but stale cases |
| `tests/tools/delegation/delegate-task-e2e.test.ts` | e2e-ish tool test | SDK wrapper dispatch proof | `tests/tools/delegation/delegate-task-e2e.test.ts` | exact, but stale setup args |
| `tests/lib/coordination/delegation/full-pipeline.test.ts` | pipeline test | integration-ish event flow | `tests/lib/coordination/delegation/full-pipeline.test.ts` | partial/stale |
| `.hivemind/session-tracker/**` | runtime state input only | file-I/O evidence | No source analog to edit | no-edit |

## Pattern Assignments

### `src/coordination/delegation/manager.ts` (service/facade, request-response + control)

**Analog:** `src/coordination/delegation/manager.ts`

**Imports/dependency-injection pattern** (lines 1-10, 22-29):
```typescript
import type { CompletionDetector } from "../completion/detector.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import type { DelegationCoordinator, DispatchParams } from "./coordinator.js"
import { DelegationManager as RuntimeDelegationManager } from "./manager-runtime.js"
import type { DelegationMonitor } from "./monitor.js"
import type { NotificationRouter } from "./notification-router.js"

export type DelegationManagerOptions = {
  coordinator?: Pick<DelegationCoordinator, "chain" | "dispatch"> & Partial<Pick<DelegationCoordinator, "abortDelegation" | "attachChildSession" | "cancelDelegation" | "failDispatch" | "handleSessionDeleted" | "handleSessionError" | "handleSessionIdle" | "recordChildMessageSignal" | "recordChildToolSignal">>
  lifecycle?: FacadeLifecycle
  monitor?: Pick<DelegationMonitor, "start">
  notificationRouter?: Pick<NotificationRouter, "register">
}
```

**Core facade routing pattern** (lines 51-70):
```typescript
constructor(client?: OpenCodeClient, private readonly options: DelegationManagerOptions = {}) {
  if (client) {
    this.runtime = new RuntimeDelegationManager(client, {
      ptyManager: options.ptyManager,
      runtimePolicy: options.runtimePolicy,
    })
  } else if (!options.coordinator || !options.lifecycle) {
    throw new Error("[Harness] DelegationManager requires a client when v2 modules are not injected.")
  }
}

async dispatch(params: DelegateParams): Promise<DelegationResult> {
  if (this.options.coordinator) return this.options.coordinator.dispatch(this.toDispatchParams(params))
  return this.requireRuntime().dispatch(params)
}
```

**Planner recommendation:** Copy the constructor pattern, but repair pass-through by including `monitor: options.monitor` and `notificationRouter: options.notificationRouter` in the `RuntimeDelegationManager` options. Add RED test proving `createDelegateTaskTool(delegationManager)` reaches this path.

**Control/error pattern** (lines 157-193):
```typescript
async controlDelegation(request: DelegationControlRequest): Promise<DelegationResult> {
  const delegation = this.getStatus(request.delegationId)
  if (!delegation) throw new Error(`[Harness] Delegation "${request.delegationId}" not found`)
  if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
    throw new Error("[Harness] cannot control terminal delegation")
  }
  if (request.action === "abort") return this.abortDelegation(request.delegationId)
  if (request.action === "cancel") return this.cancelDelegation(request.delegationId)
  // restart/redirect replacement dispatch follows after validation
}
```

**Gap to plan:** Current contract still says `"abort" | "cancel" | "restart" | "redirect"` (line 32). Phase context requires `abort/cancel/restart/resume/chain/adjust-prompt/change-agent`; planner must decide mapping vs rename, not silently keep `redirect` as final language.

---

### `src/coordination/delegation/manager-runtime.ts` (runtime adapter, request-response + state transitions)

**Analog:** `src/coordination/delegation/coordinator.ts` for ordering; `manager-runtime.ts` for SDK dispatch.

**Imports pattern** (lines 1-29):
```typescript
import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "../concurrency/queue.js"
import { sendPromptAsync, type OpenCodeClient } from "../../shared/session-api.js"
import { spawnDelegatedSession } from "../spawner/session-creator.js"
import type { DelegationMonitor } from "./monitor.js"
import type { NotificationRouter } from "./notification-router.js"
```

**Current constructor pattern with partial edit smell** (lines 89-97):
```typescript
constructor(
  private readonly client: OpenCodeClient,
  options: DelegationManagerOptions = {},
) {
  this.runtimePolicy = options.runtimePolicy ?? DEFAULT_MANAGER_RUNTIME_POLICY
  this.monitor = options.monitor
  this.notificationRouter = options.notificationRouter
  this.runtimePolicy = options.runtimePolicy ?? DEFAULT_MANAGER_RUNTIME_POLICY
  this.state = new DelegationStateMachine({
```

**Planner recommendation:** Preserve DI shape, remove duplicate `this.runtimePolicy = ...` assignment, and test that facade passes `monitor`/`notificationRouter` into this constructor.

**Dispatch/register/start pattern** (lines 203-245):
```typescript
const child = await spawnDelegatedSession({
  client: this.client as never,
  request: buildSdkSpawnRequest(params, agent, workingDirectory),
})

const delegation: Delegation = { /* id, parentSessionId, childSessionId, agent, status */ }
this.state.registerDelegation(delegation, true)
this.state.persistAll()
this.notificationRouter?.register(delegation.id, params.parentSessionId)
try {
  await sendPromptAsync(this.client, delegation.childSessionId, promptBody)
  this.state.transition(delegation.id, "running")
  this.monitor?.start(delegation.id, params.parentSessionId)
} catch {
  this.state.transitionToTerminal(delegation.id, "error", "Failed to send prompt to child session")
  return buildDelegationResult(this.state.get(delegation.id) ?? delegation)
}
```

**Ordering to copy:** spawn → record/register → persist → `notificationRouter.register` → `sendPromptAsync` → transition running → `monitor.start`. If `sendPromptAsync` fails, transition terminal error and return rendered result; do not start monitor.

---

### `src/coordination/delegation/coordinator.ts` (service/coordinator, event-driven orchestration)

**Analog:** `src/coordination/delegation/coordinator.ts`

**Deps DI pattern** (lines 17-32):
```typescript
export interface DelegationCoordinatorDeps {
  dispatcher: Pick<DelegationDispatcher, "preflightCheck">
  monitor: Pick<DelegationMonitor, "onCompletion" | "start" | "stop">
  notificationRouter: Pick<NotificationRouter, "deregister" | "register" | "route">
  lifecycle: Pick<DelegationLifecycle, "isTerminal" | "markTimeout" | "transition"> & Partial<Pick<DelegationLifecycle, "getStatus" | "list" | "register">>
  detector: { watchDualSignal: (delegationId: string, childSessionId: string, callback: (result: DelegationResult) => void) => void }
  retryHandler: Pick<DelegationRetryHandler, "persistWithRetry">
}
```

**Dispatch route/monitor pattern** (lines 64-98):
```typescript
const preflight = await this.deps.dispatcher.preflightCheck(params)
const delegationId = this.createDelegationId()
const record = this.createRecord(delegationId, params, preflight.queueKey)
this.active.set(delegationId, { record, slotHandle: preflight.slotHandle })
this.deps.lifecycle.register?.(record)
this.deps.lifecycle.transition(delegationId, "dispatched")
this.deps.notificationRouter.register(delegationId, params.parentSessionId)
// optional child session starter attaches real child id, then running
this.deps.monitor.start(delegationId, params.parentSessionId)
this.deps.detector.watchDualSignal(delegationId, record.childSessionId, (result) => {
  this.handleCompletion(delegationId, result)
})
```

**Completion cleanup pattern** (lines 148-156, 240-255):
```typescript
handleCompletion(delegationId: string, result: DelegationResult): void {
  this.deps.monitor.onCompletion(delegationId)
  this.mergeCompletionResult(delegationId, result)
  this.deps.lifecycle.transition(delegationId, status)
  this.routeTerminal(delegationId, this.notificationTypeFor(status), result.result ?? result.error ?? status)
  this.cleanup(delegationId, status, result)
}

private cleanup(delegationId: string, status: DelegationStatus, result: DelegationResult): void {
  active.slotHandle.release()
  this.deps.detector.unwatch(delegationId)
  this.deps.notificationRouter.deregister(delegationId)
  this.active.delete(delegationId)
  void this.deps.retryHandler.persistWithRetry(this.deps.lifecycle.list?.() ?? [...this.active.values()].map((entry) => entry.record))
}
```

**Planner recommendation:** Nếu chọn coordinator-backed path, copy lifecycle/cleanup pattern này. Nếu phase chỉ sửa runtime adapter, vẫn dùng coordinator as reference cho cleanup semantics và route idempotency.

---

### `src/plugin.ts` (composition root, event-driven DI)

**Analog:** `src/plugin.ts`

**Thin composition-root rule** (lines 1-7):
```typescript
/**
 * HiveMind V3 Harness Control Plane — composition root.
 *
 * This file is intentionally thin: it instantiates shared dependencies,
 * wires hook factories, and registers tools. All logic lives in the
 * individual hook factory modules and tool implementations.
 */
```

**Module setup DI pattern** (lines 148-200):
```typescript
export function setupDelegationModules(options: DelegationModuleSetupOptions): DelegationModuleSetup {
  const records = new Map<string, Delegation>()
  const slotManager = new SlotManager()
  const agentResolver = new AgentResolver({ client: options.client, projectRoot: options.projectDirectory })
  const dispatcher = new DelegationDispatcher({ agentResolver, slotManager })
  const detector = new CompletionDetector()
  const notificationRouter = new NotificationRouter({ deliver: async (...) => { ... } })
  const monitor = new DelegationMonitor({ ... })
  const coordinator = new DelegationCoordinator({ childSessionStarter: createSdkChildSessionStarter(options.client), dispatcher, monitor, notificationRouter, lifecycle, detector, retryHandler })
  const delegationManager = new DelegationManager(options.enableRuntimeAdapter ? options.client : undefined, {
    monitor,
    notificationRouter,
    ptyManager: options.ptyManager,
    runtimePolicy: options.runtimePolicy,
  })
  return { coordinator, delegationManager, detector, lifecycle, notificationRouter, slotManager }
}
```

**Hook signal forwarding pattern** (lines 344-362, 389-400):
```typescript
"chat.message": async (input: unknown, output: unknown): Promise<void> => {
  const childSessionId = extractHookSessionId(input)
  if (childSessionId) delegationManager.recordChildMessageSignal(childSessionId, extractAssistantExcerpt(input, output))
  await createChatMessageCapture(...)(input, output)
},

"tool.execute.after": async (input, _output): Promise<void> => {
  const fact = await createToolExecuteAfterHook(...)(input, _output)
  const childSessionId = extractHookSessionId(input)
  if (childSessionId) delegationManager.recordChildToolSignal(childSessionId)
  await sessionTracker.handleToolExecuteAfter(...)
  await createToolAfterWorkflow({})(input, _output)
}
```

**Planner recommendation:** Keep all business logic outside plugin. `plugin.ts` should only instantiate, pass callbacks, and forward hook facts. Add/update integration test around `HarnessControlPlane` lines 108-129 in `tests/integration/delegation-v2-integration.test.ts`.

---

### `src/coordination/delegation/monitor.ts` (monitor service, timer event-driven)

**Analog:** `src/coordination/delegation/monitor.ts`

**Options/callback injection pattern** (lines 22-31, 60-69):
```typescript
export interface MonitorOptions {
  getStatus: (delegationId: string) => DelegationStatus | string
  getDelegationRecord: (delegationId: string) => Delegation | undefined
  getActionCount?: (delegationId: string) => number
  inject: (parentSessionId: string, line: string, delegationId?: string) => void
  onComplete?: (delegationId: string, result?: SemanticCompletionResult) => void
  onFailure?: (delegationId: string, result: FailureCheckpointResult) => void
  onFirstActionDeadline?: (delegationId: string, elapsedSeconds: number) => void
  pollingCadence?: readonly number[]
}
```

**Progressive cadence pattern** (lines 71-125):
```typescript
start(delegationId: string, parentSessionId: string): void {
  this.stop(delegationId)
  const tracker = new FailureCheckpointTracker()
  tracker.start(delegationId)
  this.states.set(delegationId, state)

  for (const elapsed of this.pollingCadence) {
    state.pollingTimers.push(setTimeout(() => {
      if (state.completed) return
      if (!tracker.shouldInject(delegationId)) return
      const status = this.getStatus(delegationId)
      if (this.isTerminal(status)) return
      const actionCount = this.getActionCount?.(delegationId) ?? 0
      if (elapsed >= 60 && record?.executionState !== "confirmed") this.onFirstActionDeadline?.(delegationId, elapsed)
      this.inject(parentSessionId, formatStatusLine(delegationId, status, record, actionCount), delegationId)
      if ((elapsed === 60 || elapsed === 120 || elapsed === 180) && this.onFailure) tracker.check(...)
    }, elapsed * 1000))
  }
  state.pollingTimers.push(setTimeout(() => { tracker.check(delegationId, 300, actionCount, ...) }, 300_000))
}
```

**Failure notification pattern** (lines 163-193):
```typescript
private handleFailure(delegationId: string, parentSessionId: string, result: FailureCheckpointResult): void {
  const actionCount = this.getActionCount?.(delegationId) ?? 0
  const isExecutedRunning = actionCount > 0
  this.onFailure?.(delegationId, result)
  if (result.isFinal) {
    const notification = formatFinalFailure({ delegationId, agent: record?.agent ?? "unknown", failureLevel: result.level, elapsedSeconds: result.elapsedSeconds, actionCount, isExecutedRunning })
    this.inject(parentSessionId, notification, delegationId)
    this.stop(delegationId)
  } else {
    const notification = formatFailureNotification({ ... })
    this.inject(parentSessionId, notification, delegationId)
  }
}
```

**Planner gap:** Context requires post-300s/600s behavior; current `types.ts` has `FAILURE_CHECKPOINTS = [60, 120, 180, 300]` and monitor has final 300s timer only. If implementing 600s auto-abort, add explicit timer/test instead of overloading deprecated escalation aliases.

---

### `src/coordination/delegation/escalation-timer.ts` (utility/tracker, timer transform)

**Analog:** `src/coordination/delegation/escalation-timer.ts`

**Action-count comparison pattern** (lines 31-65):
```typescript
check(delegationId: string, elapsedSeconds: number, currentActionCount: number, onFailure: (result: FailureCheckpointResult) => void): void {
  const state = this.checkpoints.get(delegationId)
  if (!state || state.injectionStopped || state.completed) return
  if (!FAILURE_CHECKPOINTS.includes(elapsedSeconds as (typeof FAILURE_CHECKPOINTS)[number])) return
  const previousCount = state.lastCheckpointActionCount
  if (currentActionCount === previousCount) {
    const newLevel = (state.failureLevel + 1) as FailureLevel
    state.failureLevel = newLevel > 4 ? 4 : newLevel
    const result: FailureCheckpointResult = { delegationId, level: state.failureLevel, elapsedSeconds, actionCountAtCheckpoint: currentActionCount, actionCountAtPreviousCheckpoint: previousCount, isFinal: state.failureLevel === 4 }
    if (state.failureLevel === 4) state.injectionStopped = true
    onFailure(result)
  }
  state.lastCheckpointActionCount = currentActionCount
}
```

**Planner recommendation:** Keep this logic as `FailureCheckpointTracker`; do not resurrect WARN→NUDGE→ALERT semantics. If renaming file to `failure-checkpoint.ts`, update imports/tests atomically.

---

### `src/coordination/delegation/notification-router.ts` (router service, event delivery)

**Analog:** `src/coordination/delegation/notification-router.ts`

**Registration + idempotent route pattern** (lines 15-63):
```typescript
export interface NotificationRouterOptions {
  deliver?: (parentSessionId: string, notification: DelegationNotification) => boolean | Promise<boolean>
  persistPending?: (records: PendingNotificationRecord[]) => void
}

register(delegationId: string, parentSessionId: string): void {
  this.routes.set(delegationId, { parentSessionId, notifications: [] })
}

route(notification: DelegationNotification): RouteResult | undefined {
  const route = this.routes.get(notification.delegationId)
  if (!route) return undefined
  if (notification.idempotencyKey && this.deliveredKeys.has(notification.idempotencyKey)) {
    return { parentSessionId: route.parentSessionId, notification }
  }
  const deliveryResult = this.options.deliver?.(route.parentSessionId, notification) ?? true
  // async/sync delivery handling; false queues pending
  return { parentSessionId: route.parentSessionId, notification }
}
```

**Pending queue pattern** (lines 79-108):
```typescript
queuePending(delegationId: string, notification: DelegationNotification): void {
  const route = this.routes.get(delegationId)
  if (!route) return
  if (notification.idempotencyKey && this.deliveredKeys.has(notification.idempotencyKey)) return
  route.notifications.push(notification)
  if (route.notifications.length > this.pendingLimit) route.notifications.splice(0, route.notifications.length - this.pendingLimit)
  this.persistAllPending()
}
```

**Planner recommendation:** Use `idempotencyKey: ${delegationId}:${type}:${message}` pattern from `coordinator.ts` lines 315-317 for terminal/progress notifications.

---

### `src/coordination/delegation/notification-formatter.ts` (utility, transform)

**Analog:** `src/coordination/delegation/notification-formatter.ts`

**System reminder format** (lines 27-46):
```typescript
export function formatDelegationNotification(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  const tools = opts.toolCount != null ? String(opts.toolCount) : "n/a"
  const summary = opts.summaryPreview ? ` | ${opts.summaryPreview}` : ""
  return `<system_reminder>[DT:${opts.delegationId}] ${icon} ${opts.status} | agent=${opts.agent} | ${formatDuration(opts.elapsedMs)} | tools=${tools}${summary}</system_reminder>`
}

export function formatCompactLine(opts: NotificationFormatOptions): string {
  return `[DT:${opts.delegationId}] ${icon} ${opts.status} | ${formatDuration(opts.elapsedMs)} | tools=${tools} | agent=${opts.agent}`
}
```

**Failure formats** (lines 77-95):
```typescript
export function formatFailureNotification(opts: FailureNotificationOptions): string {
  if (opts.isExecutedRunning) {
    return `[DT:${opts.delegationId}] ⚠ Stall failure (level ${opts.failureLevel}) | agent=${opts.agent} | last actions=${opts.actionCount} at ${opts.elapsedSeconds}s`
  }
  return `[DT:${opts.delegationId}] ❌ Execution failure | agent=${opts.agent} | no actions recorded`
}

export function formatFinalFailure(opts: FailureNotificationOptions): string {
  return `[DT:${opts.delegationId}] 🛑 Final failure | agent=${opts.agent} | level=${opts.failureLevel} | elapsed=${opts.elapsedSeconds}s | actions=${opts.actionCount}`
}
```

---

### `src/coordination/delegation/completion-detector.ts` (utility/detector, batch transform)

**Analog:** `src/coordination/delegation/completion-detector.ts`

**Message shape defensive parsing** (lines 42-62):
```typescript
export function getMessageRole(message: unknown): string | undefined {
  return asString(getNestedValue(message, ["info", "role"])) ?? asString(getNestedValue(message, ["role"]))
}

export function getMessageParts(message: unknown): unknown[] {
  const parts = getNestedValue(message, ["parts"])
  return Array.isArray(parts) ? parts : []
}
```

**3-condition completion pattern** (lines 173-213):
```typescript
export function checkSemanticCompletion(messages: unknown[], options?: SemanticCompletionOptions): SemanticCompletionResult {
  const now = options?.now ?? Date.now()
  const threshold = options?.toolIdleThresholdMs ?? DEFAULT_TOOL_IDLE_MS
  const lastToolActivityAt = findLastToolActivity(messages)
  const toolActivityStalled = lastToolActivityAt !== null && now - lastToolActivityAt > threshold
  const hasAssistantMessage = hasAssistantLastMessage(messages)
  const hasFileChanges = hasFileChangeIndicators(messages)
  const isComplete = toolActivityStalled && hasAssistantMessage && hasFileChanges
  return { toolActivityStalled, hasAssistantMessage, hasFileChanges, isComplete, lastToolActivityAt, secondsSinceLastToolActivity }
}
```

**Planner recommendation:** Keep this as pure detector. Integration belongs in monitor/coordinator/plugin hooks, not in this utility.

---

### `src/tools/delegation/delegate-task.ts` (tool/controller, request-response)

**Analog:** `src/tools/delegation/delegate-task.ts`

**Zod schema + tool pattern** (lines 1-11, 30-43):
```typescript
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

export const DelegateTaskV2Schema = z.object({
  agent: z.string().min(1, { error: "agent is required" }),
  prompt: z.string().min(1, { error: "prompt is required" }),
  context: z.string().optional(),
})

async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
  const parsed = DelegateTaskV2Schema.safeParse(rawArgs)
  if (!parsed.success) return renderToolResult(error(`[Harness] Invalid delegate-task input: ${z.prettifyError(parsed.error)}`))
```

**Dispatch/result envelope pattern** (lines 46-77):
```typescript
const parentSessionId = context.sessionID ?? process.env.OPENCODE_SESSION_ID
if (!parentSessionId) return renderToolResult(error("[Harness] delegate-task requires an OpenCode plugin runtime environment..."))
try {
  const prompt = args.context ? `${args.context}\n\n${args.prompt}` : args.prompt
  const result = await coordinator.dispatch({
    agent: args.agent,
    currentDepth: 0,
    parentSessionId,
    prompt,
    queueKey: `agent:${args.agent}`,
    workingDirectory: context.directory ?? context.worktree,
  })
  return renderToolResult(success(`[Harness] Delegated task to ${args.agent}`, { ...resultRecord, agent: args.agent }))
} catch (caughtError) {
  return renderToolResult(error(caughtError instanceof Error ? caughtError.message : String(caughtError)))
}
```

**Planner warning:** Do not reintroduce `category`/`safetyCeilingMs` into the schema; current tests still assert stale fields and should be updated or removed.

---

### `src/tools/delegation/delegation-status.ts` (tool/controller, control request-response)

**Analog:** `src/tools/delegation/delegation-status.ts`

**Control schema pattern** (lines 10-22):
```typescript
export const DelegationControlSchema = z.object({
  action: z.enum(["abort", "cancel", "restart", "redirect"]),
  redirectAgent: z.string().optional(),
  restartPrompt: z.string().optional(),
}).refine((value) => value.action !== "redirect" || !!value.redirectAgent, "redirectAgent is required for redirect")

const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional(),
  status: z.string().optional(),
  action: z.enum(["status", "get", "list", "control"]).default("status"),
  control: DelegationControlSchema.optional(),
})
```

**Access-control + render pattern** (lines 137-157):
```typescript
const delegation = delegationManager.getStatus(args.delegationId)
  ?? readPersisted().find((entry) => entry.id === args.delegationId)
if (!delegation) return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
if (!delegationManager.canSessionAccessDelegation(context.sessionID, delegation)) {
  return renderToolResult(error(`[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`))
}
return renderToolResult(success(message, await renderDelegationV2(delegation as Delegation & { v2?: boolean }, deps)))
```

**Control handling pattern** (lines 175-193):
```typescript
if (!args.delegationId || !args.control) return renderToolResult(error("[Harness] control action requires delegationId and control"))
if (deps.lifecycle?.isTerminal(delegation.status)) return renderToolResult(error("[Harness] cannot control terminal delegation"))
if (manager.controlDelegation) {
  const result = await manager.controlDelegation({ action: args.control.action, delegationId: delegation.id, redirectAgent: args.control.redirectAgent, restartPrompt: args.control.restartPrompt })
  if (args.control.action === "abort") await deps.terminateChild?.(delegation.childSessionId)
  return renderToolResult(success(`Delegation ${delegation.id} ${args.control.action}ed`, result))
}
```

**Planner gap:** Extend schema/manager contract for required names (`resume`, `chain`, `adjust-prompt`, `change-agent`) or explicitly defer; keep `canSessionAccessDelegation` before every control action.

---

### `src/shared/session-api.ts` (shared SDK wrapper, SDK request-response)

**Analog:** `src/shared/session-api.ts`

**SDK request wrapper pattern** (lines 183-195):
```typescript
export async function sendPromptAsync(client: OpenCodeClient, sessionID: string, body: unknown): Promise<void> {
  const validSessionID = assertValidSessionID(sessionID)
  const request: SessionPromptAsyncRequest = {
    path: { id: validSessionID },
    body: body as SessionPromptAsyncRequest["body"],
  }
  await client.session.promptAsync(request)
}
```

**TUI wrapper pattern** (lines 197-219):
```typescript
export async function appendTuiPrompt(client: OpenCodeClient, text: string): Promise<unknown> {
  const request: TuiAppendPromptRequest = { body: { text } } as TuiAppendPromptRequest
  return unwrapData(await client.tui.appendPrompt(request))
}

export async function showTuiToast(client: OpenCodeClient, message: string): Promise<unknown> {
  const request: TuiShowToastRequest = { body: { message } } as TuiShowToastRequest
  return unwrapData(await client.tui.showToast(request))
}
```

**Planner recommendation:** Prefer these wrappers over raw SDK calls. Note `appendTuiPrompt` has no `sessionID` argument, so multi-parent routing needs live UAT.

---

## Test Pattern Assignments

### Monitor tests — `tests/lib/coordination/delegation/monitor.test.ts`

**Fake timer pattern** (lines 26-29, 42-55):
```typescript
describe("DelegationMonitor", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("injects thin-line status at each polling cadence point", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({ inject, getStatus: () => "running", getDelegationRecord: () => record, getActionCount: () => 3 })
    monitor.start("dt-1", "parent-1")
    vi.advanceTimersByTime(30_000)
    // ... advance cadence
    expect(statusLines.length).toBe(6)
  })
})
```

**Use for:** cadence, 300s/600s timers, final failure stop behavior.

### Router tests — `tests/lib/coordination/delegation/notification-router.test.ts`

**Parent isolation/idempotency pattern** (lines 22-31, 55-69):
```typescript
for (let index = 0; index < 10; index += 1) router.register(`dt-${index}`, `parent-${index}`)
const parents = Array.from({ length: 10 }, (_, index) => router.route({ delegationId: `dt-${index}`, message: "ok", timestamp: index, type: "progress" })?.parentSessionId)
expect(parents).toEqual(Array.from({ length: 10 }, (_, index) => `parent-${index}`))

router.route({ delegationId: "dt-1", idempotencyKey: "same-key", message: "first", timestamp: 1, type: "progress" })
router.route({ delegationId: "dt-1", idempotencyKey: "same-key", message: "first", timestamp: 1, type: "progress" })
expect(router.replayPending("parent-1")).toHaveLength(1)
```

**Use for:** slot/session routing and no broadcast.

### Coordinator tests — `tests/lib/coordination/delegation/coordinator.test.ts`

**Dispatch reachability pattern** (lines 70-83):
```typescript
const result = await coordinator.dispatch(baseDispatchParams)
expect(deps.dispatcher.preflightCheck).toHaveBeenCalledWith(baseDispatchParams)
expect(deps.lifecycle.transition).toHaveBeenCalledWith(result.delegationId, "dispatched")
expect(deps.notificationRouter.register).toHaveBeenCalledWith(result.delegationId, "parent-1")
expect(deps.monitor.start).toHaveBeenCalledWith(result.delegationId, "parent-1")
expect(deps.detector.watchDualSignal).toHaveBeenCalledWith(result.delegationId, expect.any(String), expect.any(Function))
```

**Signal pattern** (lines 97-112, 116-130):
```typescript
coordinator.recordExecutionSignal(result.delegationId, { source: "tool", observedAt: 123, messageDelta: 2, toolDelta: 1 })
expect(deps.lifecycle.getStatus(result.delegationId)).toMatchObject({ actionCount: 1, executionState: "confirmed", firstActionAt: 123, toolCallCount: 1 })

coordinator.recordChildMessageSignal(childSessionId, observedAt, finalMessageExcerpt)
coordinator.recordChildToolSignal(childSessionId, observedAt)
```

**Use for:** proving hook signals update action/message/tool counts.

### Plugin integration tests — `tests/integration/delegation-v2-integration.test.ts`

**Runtime client mock pattern** (lines 20-36):
```typescript
function createRuntimeClient() {
  return {
    app: { agents: vi.fn(async () => [{ name: "builder", tools: { read: true } }]), log: vi.fn(async () => undefined) },
    session: { create: vi.fn(async () => ({ data: { id: "child-integration" } })), messages: vi.fn(async () => ({ data: [] })), promptAsync: vi.fn(async () => ({ data: undefined })), status: vi.fn(async () => ({ data: {} })) },
    tui: { appendPrompt: vi.fn(async () => ({ data: undefined })), showToast: vi.fn(async () => ({ data: undefined })) },
  }
}
```

**Hook-to-completion pattern** (lines 108-129):
```typescript
const plugin = await HarnessControlPlane({ client: client as never, directory: "/tmp/project" } as never)
const dispatchRaw = await plugin.tool["delegate-task"].execute({ agent: "builder", prompt: "build" } as never, { sessionID: "parent-1" })
const delegationId = (parse(dispatchRaw).data as Record<string, unknown>).delegationId as string
await plugin["chat.message"]?.({ message: { content: "implemented runtime behavior", role: "assistant" }, sessionID: "child-integration" }, {})
await plugin["tool.execute.after"]?.({ args: {}, sessionID: "child-integration", tool: "read" }, {})
await plugin.event({ event: { properties: { info: { id: "child-integration" } }, type: "session.idle" } })
const statusRaw = await plugin.tool["delegation-status"].execute({ delegationId } as never, { sessionID: "parent-1" })
expect(parse(statusRaw).data).toMatchObject({ evidenceLevel: "message-and-tool", executionState: "confirmed", status: "completed" })
```

**Use for:** Phase 14 RED/GREEN reachability: `delegate-task` → `DelegationManager.dispatch` → monitor/router → hooks → status.

### Tool tests — `tests/tools/delegation/*.test.ts`

**Tool validation pattern** (delegate-task-v2 lines 18-45):
```typescript
const coordinator = { dispatch: vi.fn().mockResolvedValue({ delegationId: "dt-123", queueKey: "agent:builder", status: "dispatched" }) }
const tool = createDelegateTaskTool(coordinator as never)
const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
expect(parse(raw).kind).toBe("success")
expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({ agent: "builder", parentSessionId: "ses_parent", prompt: "build it" }))
```

**Control access pattern** (delegation-status-v2 lines 104-121, 154-160):
```typescript
const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "abort" } } as never, context)
expect(parse(raw).kind).toBe("success")
expect(lifecycle.markAborted).toHaveBeenCalledWith("dt-123")

const terminalRaw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "cancel" } } as never, context)
expect(parse(terminalRaw).message).toContain("cannot control terminal delegation")
```

**Planner warning:** Several current test cases are intentionally stale against source: `safetyCeilingMs`/`category` assertions in `delegate-task-v2.test.ts` lines 58-73 and `delegation-status-v2.test.ts` progress fields lines 21/80/184. Treat these as cleanup targets, not patterns to preserve.

## Shared Patterns

### 1. Dependency injection, no singleton business logic
**Source:** `src/plugin.ts:148-200`, `src/coordination/delegation/coordinator.ts:17-32`  
**Apply to:** manager/runtime/coordinator/monitor/router tests.  
**Rule:** Build dependencies in `setupDelegationModules`; pass `monitor`, `notificationRouter`, `lifecycle`, `detector`, `retryHandler` as constructor deps. Do not create hidden global state.

### 2. Hooks observe, manager/coordinator mutates
**Source:** `src/plugin.ts:344-362`, `src/plugin.ts:389-400`; sector boundary `src/hooks/AGENTS.md:17-22`.  
**Apply to:** action-count, message-count, completion signal work.  
**Rule:** `chat.message` and `tool.execute.after` extract child session ID and call `delegationManager.recordChildMessageSignal` / `recordChildToolSignal`; hooks must not own durable writes.

### 3. Tool boundary schema + shared envelope
**Source:** `src/tools/delegation/delegate-task.ts:7-11`, `src/tools/delegation/delegation-status.ts:10-22`, `src/tools/delegation/delegate-task.ts:70-76`.  
**Apply to:** `delegation-status` control actions and `delegate-task` cleanup.  
**Rule:** Parse with Zod, return `renderToolResult(success/error(...))`, and prefix errors with `[Harness]`.

### 4. Parent routing and idempotency
**Source:** `src/coordination/delegation/notification-router.ts:40-63`, `src/coordination/delegation/coordinator.ts:315-317`, `tests/lib/coordination/delegation/notification-router.test.ts:22-31`.  
**Apply to:** all TUI/progress/success/failure notifications.  
**Rule:** Register delegation ID to parent session before route; route by delegation ID only; idempotency key per terminal/progress event.

### 5. Failure checkpoints are action-count comparisons
**Source:** `src/coordination/delegation/escalation-timer.ts:31-65`, `tests/lib/coordination/delegation/monitor.test.ts:83-141`.  
**Apply to:** progressive monitor and failure checkpoint tests.  
**Rule:** No WARN/NUDGE/ALERT terminology in new implementation paths. Compare action count at 60/120/180/300; add 600s as explicit post-final behavior if implementing spec.

### 6. Semantic completion remains pure; integration happens outside detector
**Source:** `src/coordination/delegation/completion-detector.ts:191-213`, `tests/lib/coordination/delegation/completion-detector.test.ts:97-133`.  
**Apply to:** completion monitor/coordinator integration.  
**Rule:** Pure function checks tool stall + assistant last message + file changes. Do not make SDK calls inside detector.

### 7. SDK calls go through `src/shared/session-api.ts`
**Source:** `src/shared/session-api.ts:183-219`.  
**Apply to:** async prompt, messages, abort, TUI append/toast.  
**Rule:** Use wrappers (`sendPromptAsync`, `getSessionMessages`, `appendTuiPrompt`, `showTuiToast`) unless wrapper is missing; if missing, add wrapper there rather than raw SDK call in coordination.

## No Analog Found

| File/Surface | Role | Data Flow | Reason |
|---|---|---|---|
| `.hivemind/session-tracker/**` | runtime evidence/state | file-I/O | Not a source pattern to copy. Treat as input/evidence only; do not edit during Phase 14 implementation planning. |

## Cleanup / Stale Pattern Warnings

| Surface | Evidence | Planner Action |
|---|---|---|
| `category` in delegation tests | `tests/tools/delegation/delegate-task-v2.test.ts:64-73`, `tests/lib/coordination/delegation/full-pipeline.test.ts:41-82`, `tests/lib/coordination/delegation/coordinator.test.ts:8-11` | Remove/update only delegation category-gate cases; do not delete unrelated category semantics in prompt-packet/bootstrap/security/language code. |
| `safetyCeilingMs` in delegation tests | `tests/tools/delegation/delegate-task-v2.test.ts:58-62`, `tests/tools/delegation/delegation-status-v2.test.ts:21`, `tests/tools/delegate-task.test.ts:179-194` | Replace with monitor/progressive checkpoint semantics or current queue/runtime policy assertions. |
| Deprecated escalation aliases | `src/coordination/delegation/types.ts:131-140` | Remove only if downstream tests/imports are updated in same wave; otherwise explicitly mark compatibility debt. |
| Facade pass-through gap | `src/coordination/delegation/manager.ts:51-56` vs `manager-runtime.ts:33-38` | Must be Wave 1/2 RED→GREEN target; monitor/router currently typed in facade options but not passed into runtime adapter. |
| Duplicate runtime policy assignment | `src/coordination/delegation/manager-runtime.ts:93-96` | Surgical cleanup during wiring fix. |

## Recommended Planner Sequence

1. **Wave 0 guard:** record dirty state; do not revert `.hivemind/**`, `opencode.json`, or partial source edits.
2. **RED reachability tests:** add/update tests proving `createDelegateTaskTool(delegationManager)` triggers `notificationRouter.register` and `monitor.start` through the actual plugin/facade path.
3. **Facade/runtime repair:** pass `monitor`/`notificationRouter` from `manager.ts` into `manager-runtime.ts`; remove duplicate assignment; preserve `[Harness]` errors.
4. **Hook signal integration:** assert `chat.message` and `tool.execute.after` update message/tool/action evidence via manager/coordinator.
5. **Control tool cleanup:** update control schema/action naming for required suite or document explicit deferrals.
6. **Deprecated cleanup:** target delegation-only `category`/`safetyCeilingMs` refs; keep unrelated category fields.
7. **Validation:** run scoped Vitest files from VALIDATION.md plus `npm run typecheck`; live TUI/progressive behavior remains manual L1 UAT.

## Metadata

**Analog search scope:** `src/coordination/delegation/*.ts`, `src/tools/delegation/*.ts`, `src/plugin.ts`, `src/shared/session-api.ts`, `tests/lib/coordination/delegation/*.test.ts`, `tests/tools/delegation/*.test.ts`, `tests/integration/delegation-v2-integration.test.ts`  
**Files scanned:** 28+ via glob/grep/read  
**Pattern extraction date:** 2026-05-19  
**Only file written:** `.planning/phases/14-wire-monitor-notification-into-delegationmanager-dispatch-cl/14-PATTERNS.md`
