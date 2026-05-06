# OMO Architecture Findings for HiveMind V3

**Date:** 2026-04-08
**Source:** oh-my-openagent (OMO) repository via repomix-packed reference
**Researcher:** Hivexplorer (Terminal Repository Investigator)

---

## 1. Background Agent Patterns

### Finding 1.1: BackgroundManager as Central Orchestration Hub

**Source:** `src/features/background-agent/manager.ts` (lines 67533-67732+)
**Source:** `src/features/background-agent/AGENTS.md` (lines 59081-59136)

The `BackgroundManager` class is the single entry point for all background agent lifecycle management. It manages:
- `tasks: Map<string, BackgroundTask>` — in-memory task registry
- `notifications: Map<string, BackgroundTask[]>` — per-parent-session notification queues
- `pendingByParent: Map<string, Set<string>>` — tracks pending tasks per parent for batching
- `queuesByKey: Map<string, QueueItem[]>` — FIFO queues per concurrency key
- `concurrencyManager: ConcurrencyManager` — per-model/provider slot management

**Key methods:** `launch()`, `cancelTask()`, `getTask()`, `listTasks()`, `assertCanSpawn()`, `reserveSubagentSpawn()`, `shutdown()`

**Implication for HiveMind V3:** Our `continuity.ts` + `state.ts` dual-layer pattern maps directly to OMO's approach. We should adopt the `BackgroundManager` pattern as a single class that owns all task state, rather than splitting across multiple modules. The `pendingByParent` map is a clever pattern for batch notification we currently lack.

### Finding 1.2: Task Lifecycle with Explicit Status Transitions

**Source:** `src/features/background-agent/spawner.ts` (lines 70527-70775)
**Source:** `src/features/background-agent/constants.ts` (lines 60356-60413)

Tasks follow a strict state machine:
```
LaunchInput → pending → [ConcurrencyManager queue] → running → polling → completed/error/cancelled/interrupt
```

The spawner creates tasks with `status: "pending"`, queues them via `ConcurrencyManager`, then transitions to `"running"` when a slot opens. The `startTask()` function:
1. Creates a new OpenCode session via `client.session.create()` with `parentID`
2. Registers session in `subagentSessions` Set
3. Optionally invokes tmux callback for visual display
4. Sets status to `"running"` with `startedAt` and `progress` tracking
5. Fires `promptWithModelSuggestionRetry()` as fire-and-forget

**Implication for HiveMind V3:** Our `runtime.ts` event→status mapping should adopt this explicit state machine. The fire-and-forget prompt pattern (`.catch(onTaskError)` without awaiting) is critical — the parent doesn't block on the child's execution.

### Finding 1.3: Subagent Spawn Limits (Depth + Budget)

**Source:** `src/features/background-agent/subagent-spawn-limits.ts` (lines 71016-71110)
**Source:** `src/features/background-agent/manager.ts` (lines 67717-67732)

OMO enforces two spawn guards:
1. **Depth limit:** `getMaxSubagentDepth(config)` — prevents infinite nesting (e.g., max depth 3)
2. **Budget limit:** `getMaxRootSessionSpawnBudget(config)` — caps total descendants per root session
3. **Reservation system:** `reserveSubagentSpawn(parentSessionID)` — atomically reserves a spawn slot before creating a session, with `rollback()` on failure

The `assertCanSpawn()` method checks both limits before allowing a spawn, throwing descriptive errors.

**Implication for HiveMind V3:** We need both depth limiting and total budget guards. Our current `concurrency.ts` only handles per-model concurrency, not nesting depth. The reservation/rollback pattern prevents race conditions when multiple agents try to spawn simultaneously.

---

## 2. Orchestration Model

### Finding 2.1: ConcurrencyManager with Per-Key FIFO Queues

**Source:** `src/features/background-agent/concurrency.ts` (lines 60356-60495, via AGENTS.md at 59081-59136)
**Source:** `src/features/background-agent/state.ts` (lines 70775-70973)

Concurrency is keyed by `{providerID}/{modelID}` (e.g., `anthropic/claude-opus-4-6`). Each key has:
- A slot counter (default 5 concurrent)
- A FIFO queue of waiting tasks
- `acquire(key)` — blocks until slot available
- `release(key)` — frees slot, processes next queued task

The `TaskStateManager` class centralizes all state operations: task CRUD, queue management, notification tracking, and completion timer management. It exposes `getAllDescendantTasks(sessionID)` for recursive tree traversal.

**Implication for HiveMind V3:** Our `concurrency.ts` keyed semaphore is the same pattern. We should add the `TaskStateManager` abstraction to consolidate our scattered Map operations in `state.ts`. The descendant tree traversal is useful for our category system.

### Finding 2.2: Completion Detection via Dual Signals

**Source:** `src/features/background-agent/AGENTS.md` (lines 59117-59124)
**Source:** `src/features/background-agent/constants.ts` (lines 60361-60370)

OMO uses two signals that **must both agree** before marking complete:
1. **Session idle event** — OpenCode reports `session.idle` via event system
2. **Stability detection** — message count unchanged for 10 seconds (`MIN_STABILITY_TIME_MS`) across 3+ stable polls at 3-second intervals (`POLLING_INTERVAL_MS`)

This prevents premature completion on brief pauses (e.g., tool call latency, thinking time).

**Implication for HiveMind V3:** Our `completion-detector.ts` already does two-signal detection. We should verify it matches OMO's idle+stability approach. The 3-second polling interval and 10-second stability window are good defaults to adopt.

### Finding 2.3: Parent Session Notification System

**Source:** `src/features/background-agent/background-task-notification-template.ts` (lines 59136-59203)
**Source:** `src/features/background-agent/state.ts` (lines 70879-70902)

When a background task completes, OMO:
1. Adds the task to `notifications` map keyed by `parentSessionID`
2. Builds a structured `<system-reminder>` message via `buildBackgroundTaskNotificationText()`
3. Injects the message into the parent session via the hook message injector
4. If ALL tasks for a parent are complete, sends a summary with success/failure breakdown
5. If partial completion, sends individual notification with remaining count

The notification template includes actionable guidance: "Use `background_output(task_id="<id>")` to retrieve this result."

**Implication for HiveMind V3:** Our `notification-handler.ts` should adopt this structured template approach. The batch-when-all-complete pattern is superior to notifying on every single completion. The `<system-reminder>` XML tag is a clean way to distinguish system messages from agent output.

---

## 3. Session Continuity

### Finding 3.1: Compaction Agent Config Checkpoint

**Source:** `src/shared/compaction-agent-config-checkpoint.ts` (lines 215450-215479)
**Source:** `src/hooks/compaction-context-injector/` (lines 160036-161183)

OMO solves the context compaction problem by checkpointing agent configuration **before** compaction:

```typescript
export type CompactionAgentConfigCheckpoint = {
  agent?: string
  model?: { providerID: string; modelID: string }
  tools?: Record<string, boolean>
}
```

The `checkpoints` Map stores per-session checkpoints. Before compaction, `capture()` saves the current agent/model/tools config. After compaction, the `compaction-context-injector` hook re-injects the checkpointed config via a system message if the agent metadata was lost.

The injector validates checkpoint models against current prompt config — if they disagree, it ignores the checkpoint model to prevent "poisoned" config from persisting.

**Implication for HiveMind V3:** This is directly applicable to our session recovery. When OpenCode compacts a session, it may lose agent/tool configuration. We need a similar checkpoint-before-compaction pattern. Our `continuity.ts` should store agent config snapshots alongside task state.

### Finding 3.2: Ralph Loop State Persistence

**Source:** `src/hooks/ralph-loop/storage.ts` (lines 173029-173192)
**Source:** `src/hooks/ralph-loop/types.ts` (lines 173192-173216)
**Source:** `src/hooks/ralph-loop/AGENTS.md` (lines 169989-170050)

The ralph-loop persists state to `.sisyphus/ralph-loop.local.md` (gitignored):
```typescript
export interface RalphLoopState {
  active: boolean
  iteration: number
  max_iterations?: number
  message_count_at_start?: number
  completion_promise: string
  started_at: string
  prompt: string
  session_id?: string
  ultrawork?: boolean
  verification_pending?: boolean
  strategy?: "reset" | "continue"
}
```

The `storage.ts` module provides `writeState()`, `readState()`, `clearState()` with mkdir-sync and JSON serialization. The loop can recover from crashes by reading the persisted state file on restart.

**Implication for HiveMind V3:** Our continuity store should adopt this pattern for loop state. The `strategy` field ("reset" vs "continue") is a clean way to control loop behavior across sessions. The `.local.md` naming convention (gitignored markdown) is practical for human-readable state.

### Finding 3.3: Subagent Session Registry

**Source:** `src/features/background-agent/state.ts` (line 70778, 70857)
**Source:** `src/features/background-agent/spawner.ts` (line 70607)

OMO maintains a global `subagentSessions: Set<string>` that tracks all active subagent session IDs. When a task is removed, its session ID is removed from the Set. This Set is used to:
- Distinguish subagent sessions from root sessions
- Prevent subagent sessions from being treated as independent user sessions
- Enable cleanup of orphaned sessions on shutdown

**Implication for HiveMind V3:** We need an equivalent registry. Our `state.ts` has `sessionStats` and `rootBudgets` Maps but no explicit subagent session tracking. Adding a `subagentSessions: Set<string>` would enable proper lifecycle management.

---

## 4. Plugin/Hook Architecture

### Finding 4.1: Hook Factory Pattern with Feature Flags

**Source:** `src/plugin/hooks/create-core-hooks.ts` (lines 201198-201243)
**Source:** `src/plugin/hooks/create-session-hooks.ts` (lines 201298-201447)

OMO uses a factory pattern where hooks are conditionally created based on config:

```typescript
export function createCoreHooks(args: {
  ctx: PluginContext
  pluginConfig: OhMyOpenCodeConfig
  modelCacheState: ModelCacheState
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
})
```

Each hook factory receives the plugin context, config, and an `isHookEnabled` predicate. Hooks return `null` when disabled. The `safeCreateHook` wrapper catches errors in hook execution.

Session hooks include 25+ hooks: `contextWindowMonitor`, `preemptiveCompaction`, `sessionRecovery`, `sessionNotification`, `thinkMode`, `modelFallback`, `ralphLoop`, `editErrorRecovery`, `delegateTaskRetry`, `taskResumeInfo`, etc.

**Implication for HiveMind V3:** Our plugin.ts should adopt this factory pattern. Instead of registering hooks inline, we should have `createCoreHooks()`, `createSessionHooks()`, `createToolGuardHooks()` factories that return hook objects conditionally. The `isHookEnabled` predicate enables fine-grained feature flags.

### Finding 4.2: Hook Categories (Session, Tool, Transform)

**Source:** `src/plugin/hooks/create-core-hooks.ts` (lines 201198-201243)
**Source:** `src/plugin/hooks/create-tool-guard-hooks.ts` (via grep at 201643)
**Source:** `src/plugin/hooks/create-transform-hooks.ts` (via grep at 201790)

OMO organizes hooks into three categories:
1. **Session hooks** — respond to session lifecycle events (create, idle, compact, recover)
2. **Tool guard hooks** — intercept tool calls for validation/rate-limiting/guardrails
3. **Transform hooks** — modify messages/prompts before they reach the model

Each category is a separate factory function that returns a typed object of hook handlers. The core hooks factory spreads all three together.

**Implication for HiveMind V3:** Our hook organization should follow this three-tier model. Currently our hooks are less structured. The separation of concerns (session vs tool vs transform) makes it easy to add new hooks without touching existing ones.

### Finding 4.3: Ralph Loop as a Session Tier Hook

**Source:** `src/hooks/ralph-loop/AGENTS.md` (lines 169989-170050)
**Source:** `src/hooks/ralph-loop/ralph-loop-hook.ts` (line 172796)
**Source:** `src/hooks/ralph-loop/ralph-loop-event-handler.ts` (line 172707)

The ralph-loop is implemented as a **Session Tier hook** (not a standalone feature). It:
- Listens to `session.idle` events via `createRalphLoopEventHandler()`
- Uses `completionPromiseDetector` to scan output for `<promise>DONE</promise>`
- Injects continuation prompts via `continuation-prompt-injector.ts`
- Persists state to disk via `storage.ts`
- Exposes `RalphLoopHook` interface: `{ event, startLoop, cancelLoop, getState }`

The loop controller (`loop-state-controller.ts`) manages state CRUD with disk persistence. The `loop-session-recovery.ts` module handles crashed/interrupted loop recovery.

**Implication for HiveMind V3:** Our auto-loop/ralph-loop should be implemented as a hook, not a standalone module. This gives it access to session events, message injection, and the plugin lifecycle. The `<promise>DONE</promise>` completion signal is a clean convention.

---

## 5. Tool Architecture

### Finding 5.1: call_omo_agent Tool with Background/Sync Modes

**Source:** `src/tools/call-omo-agent/tools.ts` (lines 239218-239349)
**Source:** `src/tools/call-omo-agent/constants.ts` (line 237844)

The `call_omo_agent` tool is the primary delegation interface:

```typescript
tool({
  description: CALL_OMO_AGENT_DESCRIPTION,
  args: {
    description: tool.schema.string(),
    prompt: tool.schema.string(),
    subagent_type: tool.schema.string(),
    run_in_background: tool.schema.boolean(),  // REQUIRED
    session_id: tool.schema.string().optional(),
  },
  async execute(args, toolContext) {
    if (args.run_in_background) {
      return await executeBackground(args, toolCtx, backgroundManager, ...)
    }
    // sync mode with spawn reservation
    const spawnReservation = await backgroundManager.reserveSubagentSpawn(toolCtx.sessionID)
    return await executeSync(args, toolCtx, ctx, undefined, fallbackChain, spawnReservation, ...)
  }
})
```

Key design decisions:
- `run_in_background` is **required** — forces explicit async/sync choice
- `session_id` only works in sync mode (resume existing session)
- Background mode rejects `session_id` (new session only)
- Sync mode uses reservation pattern for spawn budget tracking
- Model resolution with fallback chain per agent type

**Implication for HiveMind V3:** Our delegation tool should adopt the required `run_in_background` flag pattern. The separation of background vs sync executors is clean. The model resolution with fallback chains is sophisticated — we should adopt this for our category system.

### Finding 5.2: Model Resolution with Fallback Chains

**Source:** `src/tools/call-omo-agent/tools.ts` (lines 239234-239273)
**Source:** `src/shared/model-requirements.ts` (referenced throughout)

Each agent type has model requirements defined in `AGENT_MODEL_REQUIREMENTS`. The resolution order is:
1. Agent-specific override from config (`agentOverrides`)
2. Category-level fallback models from user config
3. Default fallback chain from `AGENT_MODEL_REQUIREMENTS`

The `resolveModelAndFallbackChain()` function normalizes model formats, builds fallback chains, and returns both the primary model and the fallback list.

**Implication for HiveMind V3:** Our category system should include model requirements per category. The fallback chain pattern ensures delegation works even when the primary model is unavailable. This is critical for production reliability.

### Finding 5.3: Loop Detector (Circuit Breaker for Tool Use)

**Source:** `src/features/background-agent/loop-detector.ts` (lines 61622-61723)
**Source:** `src/features/background-agent/constants.ts` (lines 60364-60366)

The loop detector prevents infinite tool-use loops:

```typescript
export interface CircuitBreakerSettings {
  enabled: boolean
  maxToolCalls: number          // Default: 4000
  consecutiveThreshold: number  // Default: 20
}
```

It tracks tool call signatures (`toolName::JSON(sortedInput)`) and counts consecutive identical calls. When the same tool+input is called `consecutiveThreshold` times in a row, it triggers. Different inputs for the same tool don't trigger (e.g., reading different files is fine).

**Implication for HiveMind V3:** We should adopt this circuit breaker pattern. Our current `MAX_TOOL_CALLS_PER_SESSION` is a simple counter — the consecutive-detection approach is much smarter. The signature-based dedup (sorting input keys) prevents false positives from key-order differences.

---

## 6. Actionable Patterns for HiveMind V3

### Pattern 6.1: Adopt TaskStateManager Abstraction

**What:** Consolidate all task-related Maps into a single `TaskStateManager` class (like OMO's `state.ts`).
**Why:** Our current state is split across `state.ts` Maps with no unified interface. OMO's approach provides `getTasksByParentSession()`, `getAllDescendantTasks()`, `markForNotification()`, etc. as methods.
**Where:** Refactor `src/lib/state.ts` to add a `TaskStateManager` class.
**Effort:** Medium — requires updating all consumers of the current Maps.

### Pattern 6.2: Implement Spawn Reservation System

**What:** Add `reserveSubagentSpawn(parentSessionID)` with atomic reservation and rollback.
**Why:** Prevents race conditions when multiple agents spawn subagents simultaneously. OMO uses this for both sync and background modes.
**Where:** Add to `src/lib/concurrency.ts` or new `src/lib/spawn-reservation.ts`.
**Effort:** Low — simple counter with rollback.

### Pattern 6.3: Dual-Signal Completion Detection

**What:** Combine session idle events with stability detection (message count unchanged for N seconds).
**Why:** Prevents premature completion on brief pauses. OMO requires both signals to agree.
**Where:** Enhance `src/lib/completion-detector.ts` to add stability window checking.
**Effort:** Low — add a polling-based stability check alongside existing idle detection.

### Pattern 6.4: Compaction Checkpoint System

**What:** Save agent/model/tools config before context compaction, re-inject after.
**Why:** OpenCode compaction may lose agent metadata. OMO's checkpoint system preserves it.
**Where:** Add `src/lib/compaction-checkpoint.ts` + hook in plugin.ts.
**Effort:** Medium — requires hook integration and checkpoint storage.

### Pattern 6.5: Hook Factory Pattern

**What:** Organize hooks into factories: `createCoreHooks()`, `createSessionHooks()`, `createToolGuardHooks()`.
**Why:** Clean separation of concerns, feature-flaggable hooks, easy to add new hooks.
**Where:** Refactor `src/plugin.ts` to use factory pattern instead of inline hook registration.
**Effort:** Medium — requires restructuring plugin.ts but no behavioral changes.

### Pattern 6.6: Structured Notification Templates

**What:** Use `<system-reminder>` XML tags with structured task completion messages.
**Why:** Distinguishes system messages from agent output. OMO's templates include actionable guidance and batch summaries.
**Where:** Update `src/lib/notification-handler.ts` to use template-based messages.
**Effort:** Low — string formatting change.

### Pattern 6.7: Consecutive Tool-Use Circuit Breaker

**What:** Replace simple `MAX_TOOL_CALLS_PER_SESSION` with signature-based consecutive detection.
**Why:** Catches infinite loops without penalizing legitimate repeated tool use with different inputs.
**Where:** Replace current circuit breaker in `src/plugin.ts` with loop-detector pattern.
**Effort:** Low — drop in OMO's `loop-detector.ts` logic.

### Pattern 6.8: Ralph Loop as Hook

**What:** Implement auto-loop as a session-tier hook that listens to `session.idle` events.
**Why:** Gives loop access to session lifecycle, message injection, and plugin context. OMO's approach is more integrated than a standalone module.
**Where:** New `src/hooks/ralph-loop.ts` or integrate into existing lifecycle manager.
**Effort:** Medium — requires hook infrastructure and state persistence.

### Pattern 6.9: Subagent Session Registry

**What:** Add `subagentSessions: Set<string>` to track all child session IDs.
**Why:** Enables proper lifecycle management, cleanup on shutdown, and distinction between root and child sessions.
**Where:** Add to `src/lib/state.ts`.
**Effort:** Low — simple Set with add/remove on task lifecycle events.

### Pattern 6.10: Model Resolution with Fallback Chains

**What:** Each agent/category has model requirements with fallback chains.
**Why:** Ensures delegation works even when primary model is unavailable. Critical for production reliability.
**Where:** Add to category system configuration in `src/lib/types.ts`.
**Effort:** Medium — requires config schema changes and resolution logic.

---

## Source Index

| Source File | Lines | Topic |
|---|---|---|
| `src/features/background-agent/AGENTS.md` | 59081-59136 | Background agent overview |
| `src/features/background-agent/manager.ts` | 67533-67732+ | BackgroundManager class |
| `src/features/background-agent/spawner.ts` | 70527-70775 | Task spawning logic |
| `src/features/background-agent/state.ts` | 70775-70973 | TaskStateManager |
| `src/features/background-agent/concurrency.ts` | 60356-60495 | ConcurrencyManager |
| `src/features/background-agent/constants.ts` | 60356-60413 | Default values |
| `src/features/background-agent/task-poller.ts` | 72601-72826 | Stale task detection |
| `src/features/background-agent/loop-detector.ts` | 61622-61723 | Circuit breaker |
| `src/features/background-agent/subagent-spawn-limits.ts` | 71016-71110 | Depth/budget limits |
| `src/features/background-agent/background-task-notification-template.ts` | 59136-59203 | Notification templates |
| `src/hooks/ralph-loop/AGENTS.md` | 169989-170050 | Ralph loop overview |
| `src/hooks/ralph-loop/types.ts` | 173192-173216 | Loop state types |
| `src/hooks/ralph-loop/storage.ts` | 173029-173192 | State persistence |
| `src/shared/compaction-agent-config-checkpoint.ts` | 215450-215479 | Checkpoint types |
| `src/plugin/hooks/create-core-hooks.ts` | 201198-201243 | Hook factory pattern |
| `src/plugin/hooks/create-session-hooks.ts` | 201298-201447 | Session hook factories |
| `src/tools/call-omo-agent/tools.ts` | 239218-239349 | Delegation tool |
| `src/tools/call-omo-agent/constants.ts` | 237844 | Allowed agents |
