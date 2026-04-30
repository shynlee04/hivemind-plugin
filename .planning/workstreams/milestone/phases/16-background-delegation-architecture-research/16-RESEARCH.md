# Phase 16 Research: Background Delegation Architecture Deep Analysis

## Executive Summary

This research artifact is the result of deep forensic analysis across six failed delegation phases (09, 09.1, 09.2, 09.3, 12, 13), exhaustive comparison against the reference oh-my-openagent (OMO) background-agent subsystem, and critical reasoning about the current harness-experiment codebase state. Phase 14 achieved a "seems working but useless in almost all use cases" outcome because it implemented a shallow delegation tool without the surrounding architectural scaffolding that makes delegation actually useful: meaningful notification delivery, dependency tracking, recovery mechanisms, implicit trigger detection, and integration with the broader orchestration system.

**Core Thesis**: Background delegation is not a single tool—it is an ecosystem of coordinated subsystems: spawn guardrails, lifecycle tracking, notification delivery, implicit trigger detection, dependency graphs, circuit breakers, and recovery handlers. Implementing any one piece in isolation produces the illusion of functionality while delivering no practical value.

---

## 1. Forensic Analysis: Why Phases 09-13 Failed

### 1.1 Phase 09: The False-Start Promotion

**What was attempted**: A direct port of OMO's `BackgroundManager` into the harness experiment, with `TaskHistory`, `ConcurrencyManager`, notification templates, polling loops, and the full OMO event surface.

**Why it failed**:

| Failure Mode | Root Cause | Evidence from Archive |
|-------------|-----------|----------------------|
| **Mock-Heavy Tests** | 70%+ mock coverage with `bun:test` spies on `client.tui.showToast`, `client.session.prompt` | `09-SUMMARY.md`: "Tests passed but did not validate actual SDK behavior" |
| **Shallow Manager** | `BackgroundManager` existed as a class but no actual polling loop was wired to SDK events | `09-03-PLAN.md`: "Notification delivery incomplete — orphaned child sessions" |
| **Orphaned Sessions** | Child sessions created via `client.session.prompt({ noReply: true })` were never tracked post-creation | `09-02-SUMMARY.md`: "Session tracking gap: manager creates but does not monitor" |
| **Hook Mismatch** | OMO's `createBackgroundNotificationHook` expects `event` and `chat.message` hooks; harness experiment had different hook signatures | `09-01-SUMMARY.md`: "Hook shape mismatch between OMO and harness" |
| **Callback Hell** | `session.on("message", handler)` callbacks accumulated without cleanup, causing memory leaks on session deletion | Archive logs show `Warning: Possible EventEmitter memory leak detected` |

**Critical Anti-Pattern**: *False-Start Promotion* — the practice of declaring a feature "working" because its interfaces exist and tests pass with mocks, while the actual integration with the runtime system is absent or broken.

### 1.2 Phase 09.1: Notification System Dead End

**What was attempted**: Building a `NotificationHandler` class that would queue, batch, and deliver notifications from completed background tasks to parent sessions.

**Why it failed**:

| Failure Mode | Root Cause | Evidence |
|-------------|-----------|----------|
| **Dead Code** | `NotificationHandler` was created but never invoked by the `DelegateTaskTool` or `LifecycleManager` | `CONCERNS.md`: "DEAD CODE: `NotificationHandler` is instantiated but never meaningfully used" |
| **Callback Architecture** | Relied on `session.on("message", ...)` callbacks which are fragile and bypass OpenCode's hook system | `09.1-SUMMARY.md`: "Callback-based notification bypasses OpenCode hook pipeline" |
| **No Delivery Path** | Even when notifications were generated, there was no verified path to inject them into the parent's message stream | `09.1-VERIFICATION.md`: "Notification injection point not found in production hook flow" |

**Key Lesson**: Notification delivery must be hook-based, not callback-based. The OpenCode SDK's hook pipeline (`chat.message`, `messages.transform`) is the only reliable injection surface.

### 1.3 Phase 09.2: Task Tool Integration Misfire

**What was attempted**: Integrating the built-in OpenCode `task` tool with the harness delegation system.

**Why it failed**:

| Failure Mode | Root Cause | Evidence |
|-------------|-----------|----------|
| **Tool Collision** | The `task` tool and `delegate_task` tool had overlapping responsibilities but different lifecycles | `09.2-SUMMARY.md`: "Task tool integration created dual-track confusion" |
| **Lifecycle Drift** | `task` tool sessions were managed by OpenCode's internal task runner, not by harness `LifecycleManager` | `09.2-VERIFICATION.md`: "Harness lifecycle state does not track task-tool sessions" |
| **Identity Crisis** | Could not determine whether a child session was spawned by `task` tool or `delegate_task` tool | `CONCERNS.md`: "Session ownership tracking incomplete" |

**Key Lesson**: The built-in `task` tool and custom delegation must share a unified session registry and lifecycle tracking system, or they will create parallel universes of child sessions that cannot coordinate.

### 1.4 Phase 09.3: Dependency Graph Overreach

**What was attempted**: Building a full DAG dependency system for background tasks with checkpoint/resume capability.

**Why it failed**:

| Failure Mode | Root Cause | Evidence |
|-------------|-----------|----------|
| **Premature Complexity** | Implemented topological sort, cycle detection, and checkpoint serialization before basic notification delivery worked | `09.3-SUMMARY.md`: "Dependency graph is sophisticated but unused — no task produces consumable output" |
| **No Consumer** | The DAG system assumed tasks would write to a shared result store, but no such store existed | `09.3-VERIFICATION.md`: "Result store not implemented; DAG nodes have no output sink" |
| **Serialization Gap** | Checkpoint/resume required serializing full session state, which OpenCode does not expose | `09.3-SUMMARY.md`: "Session state serialization not supported by OpenCode SDK" |

**Key Lesson**: Dependency graphs and checkpoints are advanced features that require a mature baseline of working task execution, notification delivery, and result persistence. Building them on a broken foundation is architecture theater.

### 1.5 Phase 12: Lifecycle Manager Stub

**What was attempted**: Creating a `HarnessLifecycleManager` class to track session lifecycles and handle state transitions.

**Why it failed**:

| Failure Mode | Root Cause | Evidence |
|-------------|-----------|----------|
| **Stub Implementation** | `LifecycleManager` has methods (`getLifecycleSnapshot`, `handleEvent`, `noteObservedActivity`) but minimal internal state tracking | `lifecycle-manager.ts`: `private sessions: Map<string, SessionLifecycle> = new Map()` with no persistence |
| **No State Recovery** | Session lifecycle state is in-memory only; process restart loses all tracking | `12-SUMMARY.md`: "Lifecycle state is ephemeral; no disk persistence" |
| **No Integration** | `LifecycleManager` is constructed and passed to hooks, but hooks do not actually query it for decisions | `CONCERNS.md`: "LifecycleManager is consulted but not used for flow control" |

**Key Lesson**: A lifecycle manager without durable state, without integration into flow-control decisions, and without recovery semantics is a data structure, not a subsystem.

### 1.6 Phase 13: Hook Architecture Decay

**What was attempted**: Refactoring hooks into a clean factory pattern (`createCoreHooks`, `createSessionHooks`, `createToolGuardHooks`).

**Why it contributed to failure**:

| Failure Mode | Root Cause | Evidence |
|-------------|-----------|----------|
| **Stripped Hooks** | `14-01` clean slate removed `injection-engine`, `governance-engine`, and `pending-notifications` from core hooks | `create-core-hooks.ts`: "System injection stripped in 14-01 clean slate" |
| **No-op Stubs** | `system.transform` and `experimental.chat.system.transform` are empty stubs | `create-core-hooks.ts`: "Will be restored in Plan 14-02 (DelegationManager)" — never restored |
| **Broken Chain** | `createSessionHooks` auto-loop logic was preserved but the delegation packet handling was removed | `create-session-hooks.ts`: "Parent auto-loop stripped in 14-01 clean slate" |

**Key Lesson**: Clean-slate refactoring without a migration plan for functionality destroys more value than it creates. The hooks architecture is sound, but the features it should carry were stripped and never restored.

---

## 2. Current State: Honest Assessment

### 2.1 What Exists and Works

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `delegate_task` tool | `src/tools/delegate-task.ts` | **Functional shell** | Spawns child session via `client.session.prompt({ noReply: true })`, returns immediately with WaiterModel |
| `WaiterModel` | `src/lib/spawner/waiter-model.ts` | **Complete** | Provides illusion-of-delegation for sync tool return; correctly typed |
| `createCoreHooks` | `src/hooks/create-core-hooks.ts` | **Partial** | Event routing to `LifecycleManager` works; system injection stripped |
| `createSessionHooks` | `src/hooks/create-session-hooks.ts` | **Partial** | Auto-loop for delegation packets works; parent coordination removed |
| `createToolGuardHooks` | `src/hooks/create-tool-guard-hooks.ts` | **Functional** | Tool budget + circuit breaker work; metadata injection works |
| `SessionContinuity` | `src/lib/continuity.ts` | **Functional** | File-based continuity storage; session metadata persistence |
| `RuntimePolicy` | `src/lib/runtime-policy.ts` | **Functional** | Budget limits, delegation depth limits, tool restrictions |
| `PtySubsystem` | `src/pty/` | **Isolated** | PTY session tracking works but is not integrated with delegation |

### 2.2 What Exists but Is Broken or Dead

| Component | Location | Status | Defect |
|-----------|----------|--------|--------|
| `LifecycleManager` | `src/lib/lifecycle-manager.ts` | **Stub** | In-memory only; no persistence; no flow control integration |
| `NotificationHandler` | `src/tools/notification-handler.ts` | **Dead code** | Instantiated but never meaningfully invoked |
| `PtySubsystem` | `src/pty/` | **Orphaned** | No integration with delegation tool; no notification delivery |
| `system.transform` hook | `src/hooks/create-core-hooks.ts` | **No-op** | Stripped in 14-01; never restored |
| `injection-engine` | Removed | **Absent** | Was supposed to inject system reminders into child sessions |
| `governance-engine` | Removed | **Absent** | Was supposed to enforce runtime policy dynamically |

### 2.3 What Is Missing Entirely

| Capability | Why It Matters | OMO Reference |
|-----------|--------------|---------------|
| **Implicit delegation trigger detection** | User does not say "delegate"; system must detect need from message content, attachment count, complexity metrics | `category-skill-reminder` hook detects delegatable work after 3 tool calls |
| **Meaningful notification delivery to parent** | Child completes; parent must receive results, not just a toast | `BackgroundManager.injectPendingNotificationsIntoChatMessage()` |
| **Child session monitoring** | Child session spawned but never polled for status; parent does not know if it succeeded or failed | `BackgroundManager` polls via `checkAndInterruptStaleTasks()` |
| **Result aggregation** | Multiple child tasks produce partial results; parent needs consolidated output | OMO `BackgroundTask.result` field + notification template |
| **Dependency tracking** | Tasks depend on each other; must execute in topological order | OMO `boulder-state` DAG (over-engineered; simpler graph needed) |
| **Circuit breaker for child loops** | Child session can loop infinitely on tool calls; must be detected and aborted | `loop-detector.ts`: `detectRepetitiveToolUse()`, adaptive polling |
| **Adaptive polling** | Polling every 5s wastes tokens; should back off when child is idle, accelerate when active | `BackgroundManager` polling with `POLLING_INTERVAL_MS` + activity detection |
| **Tmux integration** | Background tasks need real terminal for REPL, debugger, TUI tools | OMO `isInsideTmux()` + `TmuxConfig` |
| **Fallback retry on model errors** | Child session hits rate limit or model error; should retry with fallback model | `tryFallbackRetry()` + `fallbackChain` |
| **Subagent depth limits** | Prevent infinite delegation recursion | `assertCanSpawn()` + `getMaxSubagentDepth()` |
| **Compaction-aware message resolution** | When child session compacts, must resolve messages correctly | `findNearestMessageExcludingCompaction()` |
| **Write-capable background execution** | OMO explicitly does NOT support write/edit in background (security); we MUST | OMO limitation → our opportunity |

---

## 3. OMO Pattern Extraction: What to Steal, What to Skip

### 3.1 Patterns to Adopt

#### 3.1.1 BackgroundManager as Central Coordinator

OMO's `BackgroundManager` is not just a task registry—it is the central nervous system of background delegation.

**Key responsibilities**:
- `launch(input)`: Spawn child session with pre-flight guardrails (depth limit, concurrency reservation)
- `reserveSubagentSpawn()`: Two-phase commit pattern for root descendant counting
- `pollLoop()`: Periodic status polling with adaptive intervals
- `handleEvent(event)`: Route SDK events to appropriate task state updates
- `injectPendingNotificationsIntoChatMessage(output, sessionID)`: Deliver notifications via hook pipeline

**Adoption strategy**: Port the core `BackgroundManager` class but adapt to harness experiment's:
- Hook-based notification delivery (OMO uses `chat.message` hook; we use `messages.transform`)
- File-based continuity (OMO uses in-memory + optional disk; we have `SessionContinuity`)
- `LifecycleManager` integration (OMO's manager is self-contained; ours should delegate to `LifecycleManager`)

#### 3.1.2 Two-Phase Spawn Reservation

```typescript
// OMO pattern: reserve before spawn, commit after success, rollback on failure
const spawnReservation = await this.reserveSubagentSpawn(parentSessionID)
try {
  // ... spawn child session ...
  spawnReservation.commit()
} catch (error) {
  spawnReservation.rollback()
  throw error
}
```

**Why it matters**: Prevents root descendant count drift when spawn fails mid-flight. Essential for enforcing `MAX_DESCENDANTS_PER_ROOT`.

#### 3.1.3 Notification Template System

OMO's `buildBackgroundTaskNotificationText()` creates structured, human-readable summaries of completed tasks:

```typescript
{
  taskDescription: string
  duration: string
  status: "completed" | "error" | "cancelled"
  result?: string
  error?: string
}
```

**Adoption strategy**: Use the template format but inject via `messages.transform` hook instead of OMO's `chat.message` hook (which may not exist in our hook surface).

#### 3.1.4 Task Poller with Stale Detection

```typescript
// OMO: pruneStaleTasksAndNotifications + checkAndInterruptStaleTasks
function checkAndInterruptStaleTasks(manager: BackgroundManager): void {
  for (const task of manager.getRunningTasks()) {
    if (task.lastMessageAt && Date.now() - task.lastMessageAt > STALE_THRESHOLD_MS) {
      manager.abortSession(task.sessionID, "stale")
    }
  }
}
```

**Adoption strategy**: Integrate with harness `LifecycleManager` stale session detection. Our `RuntimePolicy` already has `staleSessionTimeoutMs` — wire the poller to it.

#### 3.1.5 Loop Detector / Circuit Breaker

OMO detects repetitive tool use by tracking tool signatures in a sliding window:

```typescript
detectRepetitiveToolUse(task: BackgroundTask, toolName: string, args: unknown): boolean {
  const signature = makeToolSignature(toolName, args)
  if (task.progress.toolCallWindow.lastSignature === signature) {
    task.progress.toolCallWindow.consecutiveCount++
    if (task.progress.toolCallWindow.consecutiveCount >= threshold) {
      return true // Circuit breaker trip
    }
  } else {
    task.progress.toolCallWindow = { lastSignature: signature, consecutiveCount: 1, threshold }
  }
  return false
}
```

**Adoption strategy**: Our `createToolGuardHooks` already has tool budget + circuit breaker logic. Extend it to cross-session boundaries: when a child session trips its circuit breaker, notify the parent and mark the task as failed.

### 3.2 Patterns to Skip or Simplify

#### 3.2.1 Boulder-State DAG (Over-Engineered)

OMO's `boulder-state` system provides full DAG dependency tracking with topological sort, cycle detection, and plan progress tracking. This is sophisticated but was identified in Phase 09.3 as premature complexity.

**Simplification**: For Phase 16, use a simple sequential dependency list (task B depends on task A) rather than a full DAG. A `Map<taskId, string[]>` of `dependsOn` references is sufficient. Full DAG can be added in Phase 17+.

#### 3.2.2 OMO's Write Restriction

OMO explicitly denies `edit`, `write`, and `delegate-task` permissions to background sessions:

```typescript
const WRITE_CAPABLE_PERMISSION_RULES = [
  { permission: "read", action: "allow" },
  { permission: "edit", action: "allow" },
  { permission: "write", action: "allow" },
  // ... but delegate-task denied
]
```

This is a **security limitation**, not a feature. Our harness experiment should allow write-capable background sessions with appropriate guardrails (budget limits, depth limits, user confirmation for destructive operations).

#### 3.2.3 Tmux Integration (Defer)

OMO has deep Tmux integration for persistent terminal sessions. This is valuable but complex. Defer to Phase 18+.

#### 3.2.4 Model Fallback Chains (Partial Adopt)

OMO's `fallbackChain` system retries failed child sessions with alternate models. This is valuable but adds significant complexity. Adopt a simplified version: single fallback model configured in `RuntimePolicy`, not a chain.

---

## 4. Extreme-Case Scenario: Implicit Delegation Trigger

### 4.1 The Scenario

> A user submits a prompt like:
> "Refactor the authentication module to use JWT tokens instead of session cookies. Update the login route, the middleware, and the user model. Also write tests for the new token validation logic. Here is the current codebase [attachment: auth-module.zip]."

**The user never says** "delegate", "background", "async", "parallel", or any delegation keyword.

### 4.2 Detection Logic: What Triggers Implicit Delegation

| Trigger | Detection Mechanism | Threshold |
|---------|---------------------|-----------|
| **Attachment count** | Message contains file attachments | `> 0` files |
| **Code references** | Message contains file paths, function names, or code blocks | `> 2` unique file references |
| **Complexity score** | Estimated task complexity based on verb count + scope indicators | `> 5` complexity points |
| **Multi-domain indicators** | Task spans multiple domains (frontend + backend + tests) | `> 2` domains detected |
| **Message length** | Long prompts correlate with complex tasks | `> 500` tokens |
| **Explicit breadth markers** | Words like "refactor", "redesign", "implement", "migrate" | Presence of any |

**Complexity scoring heuristic**:
```
complexity = 0
for each verb in ["refactor", "redesign", "implement", "migrate", "update", "rewrite"]:
  complexity += 2
for each domain in ["frontend", "backend", "database", "tests", "devops"]:
  if domain mentioned: complexity += 1
for each attachment: complexity += 1
for each unique file reference: complexity += 0.5
if message_length > 500: complexity += 1
if message_length > 1000: complexity += 2
```

**Trigger threshold**: `complexity >= 5` → recommend delegation; `complexity >= 8` → auto-delegate (with user confirmation if interactive).

### 4.3 Activation Sequence: Which Components Fire, In What Order

```
User submits complex prompt
│
├─→ [messages.transform hook] → analyzes message content
│   └─→ calculates complexity score
│   └─→ if score >= threshold: injects delegation recommendation into system message
│
├─→ [system.transform hook] → augments system prompt with delegation guidance
│   └─→ "This task appears complex. Consider delegating to specialized agents."
│
├─→ [Agent reasoning] → sees delegation recommendation in context
│   └─→ decides whether to use delegate_task tool
│
├─→ [tool.execute.before hook] → if delegate_task is invoked
│   └─→ checks depth limit, budget, concurrency
│   └─→ reserves spawn slot
│
├─→ [delegate_task tool] → spawns child session via client.session.prompt({ noReply: true })
│   └─→ creates SessionContinuity entry for child
│   └─→ registers with LifecycleManager
│
├─→ [LifecycleManager] → starts polling loop for child session
│   └─→ monitors session.status, message count, tool calls
│
├─→ [event hook] → receives session.idle, session.error events
│   └─→ routes to LifecycleManager for state updates
│
├─→ [loop detector] → monitors child tool calls for repetition
│   └─→ if circuit breaker threshold exceeded: aborts child, marks task failed
│
├─→ [task poller] → periodic check for stale sessions
│   └─→ if no activity for staleSessionTimeoutMs: aborts child
│
├─→ [child completes] → session.idle with completion signal
│   └─→ LifecycleManager marks task completed
│   └─→ aggregates result from child session messages
│
├─→ [messages.transform hook] → injects notification into parent's next message
│   └─→ "Background task 'Refactor auth module' completed. Result: ..."
│
└─→ [Parent agent] → sees notification, incorporates results into reasoning
```

### 4.4 Why This Improves Agentic Outcomes

| Without Implicit Delegation | With Implicit Delegation |
|---------------------------|--------------------------|
| Agent attempts entire refactor in single session | Agent splits refactor into parallel child tasks |
| Context window exhausted by large codebase attachment | Child sessions each get focused context window |
| Tool budget (50 calls) consumed by one long task | Each child gets fresh tool budget |
| No recovery if parent session crashes | Child sessions are independently recoverable |
| User waits synchronously for 20+ minute operation | User receives immediate acknowledgment + async notification |
| No parallelism; tasks executed sequentially | Frontend, backend, test tasks run in parallel |
| Agent forgets attachment details mid-task | Child sessions have fresh memory of assigned scope |

---

## 5. Component Interaction Design

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenCode SDK                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Hooks     │  │   Tools     │  │      Sessions           │  │
│  │  Pipeline   │  │  Registry   │  │     (Parent/Child)      │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
└─────────┼────────────────┼────────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Harness Experiment Layer                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Hook Factories                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ createCore  │ │createSession│ │ createToolGuard     ││   │
│  │  │    Hooks    │ │   Hooks     │ │     Hooks           ││   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘│   │
│  │         └────────────────┼───────────────────┘            │   │
│  │                          ▼                             │   │
│  │              ┌─────────────────────┐                     │   │
│  │              │   createImplicit    │                     │   │
│  │              │  DetectionHooks     │                     │   │
│  │              │  (NEW: Phase 16)    │                     │   │
│  │              └─────────┬─────────┘                     │   │
│  └────────────────────────┼────────────────────────────────┘   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Central Coordinators                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │   │
│  │  │ Lifecycle   │  │ Background  │  │ Notification    │ │   │
│  │  │  Manager    │◄─┤│   Manager   │◄─┤│   Manager       │ │   │
│  │  │ (existing)  │  │  (NEW)      │  │  (revived)      │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Subsystems                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │   │
│  │  │   Task      │  │   Loop      │  │   Dependency    │ │   │
│  │  │   Poller    │  │  Detector   │  │     Graph       │ │   │
│  │  │  (NEW)      │  │  (NEW)      │  │  (simplified)   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │   │
│  │  │   Spawn     │  │   Result    │  │   Session       │ │   │
│  │  │  Guardrails │  │   Store     │  │   Continuity    │ │   │
│  │  │  (existing) │  │  (NEW)      │  │  (existing)     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Interface Contracts

#### 5.2.1 BackgroundManager ↔ LifecycleManager

```typescript
interface BackgroundManager {
  launch(input: LaunchInput): Promise<BackgroundTask>
  abort(taskId: string, reason: string): Promise<void>
  getTask(taskId: string): BackgroundTask | undefined
  getTasksForParent(parentSessionID: string): BackgroundTask[]
  injectPendingNotifications(output: MessagesOutput, sessionID: string): void
  
  // Event routing from hooks
  handleEvent(event: SDKEvent): void
  
  // Lifecycle integration
  registerLifecycleManager(lm: HarnessLifecycleManager): void
}

interface HarnessLifecycleManager {
  // Existing
  getLifecycleSnapshot(sessionID: string): SessionLifecycle | undefined
  handleEvent(params: { event: unknown; eventType: string; sessionID: string }): void
  noteObservedActivity(sessionID: string, source: string): void
  
  // New for Phase 16
  registerChildSession(parentID: string, childID: string, taskId: string): void
  markTaskCompleted(taskId: string, result: string): void
  markTaskFailed(taskId: string, error: string): void
  getChildSessions(parentID: string): string[]
}
```

#### 5.2.2 NotificationManager ↔ MessagesOutput

```typescript
interface NotificationManager {
  // Queue notification for delivery
  queue(taskId: string, notification: TaskNotification): void
  
  // Called by messages.transform hook to inject pending notifications
  flushToOutput(output: MessagesOutput, sessionID: string): void
  
  // Called when parent session is compacted
  onSessionCompacted(sessionID: string): void
}

interface TaskNotification {
  taskId: string
  description: string
  status: "completed" | "error" | "cancelled"
  result?: string
  error?: string
  durationMs: number
  childSessionID: string
}
```

#### 5.2.3 Implicit Detection ↔ System Message

```typescript
interface ImplicitDetectionHooks {
  // Analyzes user message complexity
  analyzeMessage(message: UserMessage): ComplexityScore
  
  // Injects delegation recommendation into system context
  injectRecommendation(systemMessage: string, score: ComplexityScore): string
}

interface ComplexityScore {
  total: number
  triggers: Array<{ type: string; weight: number }>
  recommended: boolean
  autoDelegate: boolean
}
```

### 5.3 Data Flow: Child Session Lifecycle

```
1. PARENT_SESSION: User submits complex prompt
   └─→ messages.transform hook detects complexity score = 8.5
   └─→ Injects: "[Delegation Recommendation] This task spans 3 domains with 2 attachments. Consider delegating."

2. PARENT_SESSION: Agent decides to delegate
   └─→ Calls delegate_task tool with description + prompt
   
3. TOOL_GUARD_HOOK (before)
   └─→ Checks: depth < MAX_DEPTH? budget remaining? concurrency available?
   └─→ If guards pass: proceeds. If fail: throws HarnessError

4. DELEGATE_TASK_TOOL
   └─→ Creates LaunchInput from tool arguments
   └─→ Calls BackgroundManager.launch(input)
   
5. BACKGROUND_MANAGER.launch()
   └─→ reserveSubagentSpawn(parentSessionID)
   └─→ Asserts depth limit, increments descendant count
   └─→ spawns child via client.session.prompt({ noReply: true })
   └─→ Creates SessionContinuity for child
   └─→ Registers child with LifecycleManager
   └─→ Starts polling loop
   └─→ Returns BackgroundTask with taskId

6. DELEGATE_TASK_TOOL
   └─→ Returns WaiterModel response to parent
   └─→ Parent continues immediately

7. POLLING_LOOP (every 5s, adaptive)
   └─→ Checks child session status
   └─→ Updates BackgroundTask.progress
   └─→ If session.idle: check for completion signal
   └─→ If completion signal found: mark completed, aggregate result
   └─→ If error: mark failed, capture error message
   └─→ If stale (> timeout): abort, mark failed

8. LOOP_DETECTOR
   └─→ Monitors tool.execute.after events for child session
   └─→ If same tool signature repeated > threshold: abort child

9. EVENT_HOOK
   └─→ Receives session.idle, session.error, session.deleted
   └─→ Routes to BackgroundManager.handleEvent(event)

10. CHILD_SESSION completes
    └─→ BackgroundManager marks task completed
    └─→ Aggregates final assistant message as result
    └─→ NotificationManager.queue(taskId, notification)

11. PARENT_SESSION: Next user message or agent turn
    └─→ messages.transform hook calls NotificationManager.flushToOutput()
    └─→ Injects: "[Background Task Complete] 'Refactor auth module' completed in 3m 42s. Result: JWT middleware implemented, login route updated, 12 tests added."

12. PARENT_SESSION: Agent incorporates result into reasoning
    └─→ Continues with full knowledge of child task outcomes
```

---

## 6. Implementation Roadmap: Phased Delivery

### 6.1 Principle: No Phase Without Verification

Every phase must include:
1. **Unit tests** with real SDK behavior (not mocks)
2. **Integration tests** verifying hook → tool → manager → notification flow
3. **End-to-end test** with a real OpenCode session (or high-fidelity simulator)
4. **Human review** of the phase summary before promotion

### 6.2 Phase 16.1: BackgroundManager Core

**Deliverable**: A working `BackgroundManager` class with spawn, poll, and abort capabilities.

**Files to create/modify**:
- `src/lib/background-manager.ts` (NEW)
- `src/lib/background-task-types.ts` (NEW)
- `src/tools/delegate-task.ts` (MODIFY: integrate with BackgroundManager)

**Key features**:
- `launch(input)`: Spawn child session, create continuity entry, register with LifecycleManager
- `abort(taskId, reason)`: Abort child session, update task status, release resources
- `getTask(taskId)`: Retrieve task state
- `handleEvent(event)`: Route SDK events to task state updates
- Polling loop with adaptive intervals

**Tests**:
- Spawn 3 child sessions, verify all are tracked
- Abort 1 child, verify status = "cancelled", others unaffected
- Simulate session.error event, verify task status = "error"

### 6.3 Phase 16.2: Notification Delivery

**Deliverable**: Working notification delivery from completed child tasks to parent sessions.

**Files to create/modify**:
- `src/lib/notification-manager.ts` (NEW)
- `src/hooks/create-core-hooks.ts` (MODIFY: restore system injection, add notification flush)
- `src/tools/notification-handler.ts` (MODIFY: revive and integrate)

**Key features**:
- Queue notifications when child tasks complete
- `flushToOutput()` called by `messages.transform` hook
- Human-readable notification format with duration, status, result summary
- Handle session compaction (notifications survive compaction via continuity)

**Tests**:
- Complete a child task, verify notification appears in parent's next message
- Verify notification survives session compaction
- Verify no notification for tasks that are aborted or error (or different format)

### 6.4 Phase 16.3: Implicit Delegation Detection

**Deliverable**: Hook-based system that detects complex tasks and recommends delegation.

**Files to create/modify**:
- `src/hooks/create-implicit-detection-hooks.ts` (NEW)
- `src/lib/complexity-scorer.ts` (NEW)
- `src/hooks/index.ts` (MODIFY: register new hook factory)

**Key features**:
- `messages.transform` hook analyzes user message complexity
- `system.transform` hook injects delegation recommendation when threshold exceeded
- Complexity scoring: attachments, code references, verb count, domain count, message length
- Configurable thresholds in `RuntimePolicy`
- Non-intrusive: recommendation, not enforcement

**Tests**:
- Message with 2 attachments + "refactor" + 3 file refs → score >= 5, recommendation injected
- Simple message "hello" → score < 5, no recommendation
- Verify recommendation appears in system context

### 6.5 Phase 16.4: Loop Detection & Circuit Breaker

**Deliverable**: Cross-session loop detection that protects child sessions from infinite tool loops.

**Files to create/modify**:
- `src/lib/loop-detector.ts` (NEW)
- `src/hooks/create-tool-guard-hooks.ts` (MODIFY: integrate loop detector)
- `src/lib/background-manager.ts` (MODIFY: abort child on circuit breaker trip)

**Key features**:
- Track tool signatures per child session
- Detect repeated identical tool calls
- Abort child session when threshold exceeded
- Notify parent of circuit breaker trip

**Tests**:
- Child session calls `grep` with same args 5 times → circuit breaker trips, child aborted
- Parent receives notification: "Child task aborted: repetitive tool use detected"

### 6.6 Phase 16.5: Dependency Graph (Simplified)

**Deliverable**: Simple sequential dependency tracking for background tasks.

**Files to create/modify**:
- `src/lib/dependency-graph.ts` (NEW)
- `src/tools/delegate-task.ts` (MODIFY: accept `dependsOn` parameter)
- `src/lib/background-manager.ts` (MODIFY: enqueue tasks until dependencies complete)

**Key features**:
- `dependsOn: string[]` field in `LaunchInput`
- Task queued until all dependencies complete successfully
- If dependency fails: dependent tasks cancelled
- Simple Map-based storage, not full DAG

**Tests**:
- Task B depends on Task A; verify B does not spawn until A completes
- Task A fails; verify B is cancelled

### 6.7 Phase 16.6: Result Aggregation & Storage

**Deliverable**: Persistent result storage and aggregation for multi-task operations.

**Files to create/modify**:
- `src/lib/result-store.ts` (NEW)
- `src/lib/background-manager.ts` (MODIFY: write results on completion)
- `src/lib/notification-manager.ts` (MODIFY: read results for notification content)

**Key features**:
- File-based result storage in `.harness/results/`
- Store final assistant message as task result
- Aggregate results from multiple child tasks
- Expire old results (configurable TTL)

**Tests**:
- 3 child tasks complete; verify aggregate result contains all 3 outputs
- Result files written to disk and readable after process restart

---

## 7. Critical Design Decisions

### 7.1 Why Hook-Based Notification, Not Callback-Based

OMO originally used `session.on("message", handler)` for notifications. This was one of its main failure points in the harness experiment because:

1. **Callback leaks**: Handlers are not automatically cleaned up when sessions are deleted
2. **Hook bypass**: Callbacks bypass OpenCode's hook pipeline, breaking extensibility
3. **Timing races**: Callbacks may fire before the hook system has processed the same event

**Decision**: All notification delivery must go through `messages.transform` or `chat.message` hooks. The `NotificationManager.flushToOutput()` method is called by the hook, not by a callback.

### 7.2 Why Two-Phase Spawn Reservation

Without two-phase reservation, if a child session spawn fails after the descendant count is incremented, the count is never decremented. This causes the `MAX_DESCENDANTS_PER_ROOT` limit to become permanently undercounted.

**Decision**: All spawns must use `reserveSubagentSpawn() → commit()/rollback()` pattern.

### 7.3 Why Simplified Dependency Graph (Not Full DAG)

A full DAG with topological sort, cycle detection, and plan progress tracking is 5x more complex than a simple `dependsOn` list. For the 90% case (task B waits for task A), a list is sufficient.

**Decision**: Phase 16 uses `Map<taskId, string[]>` for `dependsOn`. Full DAG deferred to Phase 17+.

### 7.4 Why Write-Capable Background Sessions

OMO restricts background sessions to read-only for security. This makes background delegation useless for the primary use case: code refactoring, implementation, and testing.

**Decision**: Harness experiment allows write/edit in background sessions with these guardrails:
- Tool budget limits per session
- Depth limits to prevent infinite delegation
- User confirmation for destructive operations (future: via OpenCode permission system)
- Audit trail in continuity storage

### 7.5 Why Adaptive Polling (Not Fixed Interval)

Fixed 5-second polling wastes API calls when a child session is idle and delays notification when it's active.

**Decision**: Polling interval adapts:
- Base interval: 5s
- If child has new messages since last poll: 2s (accelerate)
- If child has no activity for 30s: 10s (decelerate)
- If child has no activity for 5min: 30s (coast)
- If child completes: stop polling

---

## 8. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OpenCode SDK hook surface changes | Medium | High | Abstract hook interactions behind adapter layer; unit test hook contracts |
| Session continuity storage corruption | Low | High | JSON schema validation; backup/restore; checksums |
| Notification flooding (too many child tasks complete at once) | Medium | Medium | Batch notifications; max 3 per message; priority queue |
| Implicit detection false positives | Medium | Medium | Conservative thresholds; user-configurable; recommendation not enforcement |
| Child session hangs (infinite loop not caught) | Low | High | Stale timeout + loop detector + manual abort API |
| Process restart loses in-flight tasks | Medium | High | Durable task state in continuity storage; resume on startup |
| Integration with built-in `task` tool conflicts | Medium | High | Unified session registry; shared LifecycleManager |

---

## 9. Success Criteria for Phase 16

| # | Criterion | Measurement |
|---|-----------|-------------|
| 1 | A user can submit a complex prompt with attachments and receive implicit delegation recommendation | E2E test: message with 2 attachments + "refactor" → system message contains recommendation |
| 2 | Agent can delegate a task to background session and continue immediately | E2E test: delegate_task call returns < 2s; parent session continues |
| 3 | Parent receives notification when child task completes | E2E test: child completes; parent's next message contains notification |
| 4 | Parent receives notification when child task fails | E2E test: child errors; parent's next message contains error notification |
| 5 | Child session is protected from infinite tool loops | E2E test: child calls same tool 5x → aborted; parent notified |
| 6 | Task dependencies are respected (B waits for A) | Unit test: B queued until A completes |
| 7 | Process restart does not lose task state | Unit test: simulate restart; tasks resume from continuity storage |
| 8 | All tests pass without mocks for SDK behavior | CI: integration tests use real OpenCode client or high-fidelity stub |

---

## 10. Conclusion

Phase 16 is not about building a single tool. It is about building an **ecosystem** of coordinated subsystems that make background delegation actually useful. The failures of Phases 09-13 teach us that:

1. **Mocks are lies** — test with real behavior or high-fidelity stubs
2. **Partial implementations are worse than none** — they create false confidence
3. **Clean slates destroy value** — refactor incrementally, preserve working code
4. **Notification delivery is the product** — a spawned child session that the parent never hears from is useless
5. **Implicit detection is the differentiator** — users should not need to learn delegation keywords

The OMO repository provides a proven reference implementation, but it must be **adapted**, not **ported**. The harness experiment has different hook signatures, different continuity mechanisms, and different security requirements. The patterns are transferable; the code is not.

**Next step**: Phase 16.1 — implement `BackgroundManager` core with spawn, poll, and abort. Verify with integration tests before proceeding.

---

*Research conducted: 2026-01-22*
*Sources: Phase 09-13 archives, OMO repository (commit HEAD), harness-experiment codebase (branch harness-experiment), Phase 14 verification artifacts, Phase 16 mandates document*
