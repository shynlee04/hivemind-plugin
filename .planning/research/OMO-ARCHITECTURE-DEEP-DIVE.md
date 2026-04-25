# OMO Architecture Deep Dive: Comprehensive Research Report

**Repository:** https://github.com/code-yeongyu/oh-my-openagent (dev branch)
**Researched:** 2026-04-25
**Confidence:** HIGH (source code analysis + DeepWiki verification)

---

## 1. ARCHITECTURE OVERVIEW

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PLANNING LAYER (Human + Specialist Agents)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Prometheus│ │  Metis   │ │  Momus   │ │   User   │      │
│  │(Planner) │ │(Consult) │ │(Reviewer)│ │          │      │
│  └────┬─────┘ └──────────┘ └──────────┘ └──────────┘      │
│       │ Plans → .sisyphus/plans/*.md                        │
├───────┼─────────────────────────────────────────────────────┤
│  EXECUTION LAYER (Orchestrator)                             │
│  ┌──────────┐                                               │
│  │  Atlas   │ ← Reads plans, dispatches tasks              │
│  │(Sisyphus)│                                               │
│  └──┬───┬───┘                                               │
│     │   │                                                   │
├─────┼───┼───────────────────────────────────────────────────┤
│  WORKER LAYER (Specialized Agents)                          │
│  ┌────┴──┐ ┌───┴───┐ ┌────────┐ ┌──────────┐              │
│  │Junior │ │Oracle │ │Explore │ │Librarian │              │
│  │(Task) │ │(Arch) │ │(Grep) │ │(Docs/OSS)│              │
│  └───────┘ └───────┘ └────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Initialization Pipeline (5 steps)

**File: `src/index.ts`** — Entry point, pure composition:

```typescript
// Step 1: Load configuration
const pluginConfig = loadPluginConfig(input.directory, input)

// Step 2: Create managers (dependency injection)
const managers = createManagers({ ctx, pluginConfig, tmuxConfig, modelCacheState })

// Step 3: Create tools (skill-aware)
const toolsResult = await createTools({ ctx, pluginConfig, managers })

// Step 4: Create hooks (52 hooks, factory pattern)
const hooks = createHooks({ ctx, pluginConfig, backgroundManager, ... })

// Step 5: Assemble plugin interface
const pluginInterface = createPluginInterface({ ctx, managers, hooks, tools })
```

### Key Architectural Decisions

| Decision | OMO Approach | Rationale |
|----------|-------------|-----------|
| Agent dispatch | `task()` tool with structured prompt contract | Clear boundaries, verifiable outcomes |
| Hook creation | Factory pattern `createXXXHook(deps) → HookFunction` | Isolated failures, testable |
| Skill loading | 4-scope priority with async/blocking variants | Fast startup, runtime discovery |
| Background tasks | Manager with polling + circuit breaker | Prevents infinite loops, manages concurrency |
| State persistence | File-based (`.sisyphus/` directory) | Survives context resets |

---

## 2. BACKGROUND AGENT SYSTEM

### Component: `BackgroundManager`
**File:** `src/features/background-agent/manager.ts` (~22k chars, ~940 LOC)

#### Task Lifecycle States

```
pending → running → completed
                  → error
                  → cancelled
```

#### Core Data Structures

```typescript
class BackgroundManager {
  private tasks: Map<string, BackgroundTask>           // Active task registry
  private notifications: Map<string, BackgroundTask[]>  // Completion notifications by parent
  private pendingNotifications: Map<string, string[]>   // Queued notification IDs
  private pendingByParent: Map<string, Set<string>>     // Track pending tasks per parent
  private concurrencyManager: ConcurrencyManager        // Per-model concurrency control
  private queuesByKey: Map<string, QueueItem[]>         // FIFO task queues by key
  private completionTimers: Map<string, Timeout>        // Stability detection timers
  private completedTaskSummaries: Map<string, Array>    // Batched completion summaries
  private rootDescendantCounts: Map<string, number>     // Budget tracking per root session
  readonly taskHistory = new TaskHistory()              // Historical task records
}
```

#### Spawn Protocol

```typescript
// Two-phase spawn with reservation/commit pattern
async reserveSubagentSpawn(parentSessionID: string): Promise<{
  spawnContext: SubagentSpawnContext
  descendantCount: number
  commit: () => number    // Finalize the spawn
  rollback: () => void    // Cancel the reservation
}>
```

**Depth limits:** `assertCanSpawn()` checks:
1. Child depth < maxDepth (configurable)
2. Descendant count < maxRootSessionSpawnBudget
3. Global running count < maxBackgroundAgents

#### Polling & Completion Detection

- **Polling interval:** 3 seconds
- **Stability detection:** 10 seconds of no state changes → task considered stable
- **Dual-signal completion:** Both polling-based state check AND session message analysis

#### Notification Architecture

```typescript
// Notifications are batched per parent session
private notificationQueueByParent: Map<string, Promise<void>>
```

When a background task completes, a notification is queued for the parent session. Notifications are serialized per parent to prevent race conditions.

### Component: `ConcurrencyManager`
**File:** `src/features/background-agent/concurrency.ts`

```typescript
class ConcurrencyManager {
  private counts: Map<string, number> = new Map()     // Per-model running count
  private queues: Map<string, QueueEntry[]> = new Map() // Per-model FIFO queue
  private globalRunningCount = 0                       // Global running total

  getMaxBackgroundAgents(): number    // Default: 5
  canSpawnGlobally(): boolean         // globalRunningCount < max
  async acquire(model: string)        // FIFO-queued acquire with settle/cancel
  release(model: string)              // Release slot, wake next waiter
  cancelWaiters(model: string)        // Reject all queued waiters
}
```

**Key pattern:** FIFO queue with settled-flag to prevent double-resolve on cancel:

```typescript
interface QueueEntry {
  resolve: () => void
  rawReject: (error: Error) => void
  settled: boolean  // Prevents cancel from rejecting already-resolved entries
}
```

### Component: Circuit Breaker
**File:** `src/features/background-agent/circuit-breaker.ts`

```typescript
interface CircuitBreakerSettings {
  enabled: boolean              // Default: true
  maxToolCalls: number          // Default: 100 (fallback from config.maxToolCalls)
  consecutiveThreshold: number  // Default: 5, minimum: 5, maximum: unlimited
}
```

**Detection algorithm:**
1. Create a **signature** from tool name + sorted input: `"toolName::{sorted JSON of input}"`
2. Track a sliding window: `{ lastSignature, consecutiveCount, threshold }`
3. If `consecutiveCount >= threshold` → **Circuit breaker triggers**, task cancelled
4. Different tool calls reset the counter (diverse tool usage is OK)

```typescript
// Signature creation prevents false positives from reordered inputs
function createToolCallSignature(toolName: string, toolInput?: Record<string, unknown>): string {
  // Sorts object keys recursively for stable signatures
  const sorted = sortObject(toolInput)
  return `${toolName}::${JSON.stringify(sorted)}`
}
```

**Cancellation message:**
```
Subagent called ${toolName} ${repeatedCount} consecutive times (threshold: ${consecutiveThreshold}). 
This usually indicates an infinite loop. The task was automatically cancelled to prevent excessive token usage.
```

### Tmux Integration (Visual Monitoring)

When `tmux.enabled = true`:
- Background agents spawn in separate tmux panes
- `TmuxSessionManager` tracks pane IDs per session
- `onSubagentSessionCreated` callback syncs tmux state
- Visual monitoring of multiple agents working in parallel

---

## 3. DELEGATION AND SUBAGENT PATTERNS

### IntentGate Classification

User requests are classified to determine routing:
1. **Specialist match** → Direct dispatch to agent (Oracle, Explore, Librarian, Metis, Momus)
2. **Category match** → Dispatch via `task(category=..., load_skills=[...])` with model optimization
3. **Simple/local** → Sisyphus executes directly

### Delegation Prompt Contract (6 sections)

When delegating via `task()`, prompts MUST include:

```
TASK: [What to do]
EXPECTED OUTCOME: [What success looks like]
REQUIRED TOOLS: [Which tools the subagent should use]
MUST DO: [Required behaviors]
MUST NOT DO: [Prohibited behaviors]
CONTEXT: [Relevant context]
```

### Category-Based Routing

Categories map to optimized models:
- `visual-engineering` → Frontend-optimized model + `frontend-ui-ux` skill
- `ultrabrain` → High-reasoning model
- `deep` → Deep analysis model
- `quick` → Fast response model
- `writing` → Writing-optimized model

### Session Reuse (Critical Pattern)

`task()` returns a `task_id`. This ID MUST be reused for follow-up interactions:
- Prevents fresh session creation (which discards accumulated context)
- Reduces token usage significantly
- Preserves dead ends explored, decisions made, files read

### Verification Loop

After delegation, Sisyphus:
1. Runs diagnostics on subagent output
2. Verifies output matches EXPECTED OUTCOME
3. If verification fails, reuses `task_id` for corrective iteration

---

## 4. PLUGIN SYSTEM ARCHITECTURE

### Manager Composition (`create-managers.ts`)

```typescript
type Managers = {
  tmuxSessionManager: TmuxSessionManager    // Visual monitoring
  backgroundManager: BackgroundManager      // Task lifecycle
  skillMcpManager: SkillMcpManager          // MCP server lifecycle
  configHandler: ConfigHandler              // Runtime config
  modelFallbackControllerAccessor          // Model fallback on errors
}
```

**Dependency injection pattern:** All managers accept deps parameter for testability:

```typescript
const managers = createManagers({
  ctx: input,
  pluginConfig,
  tmuxConfig,
  modelCacheState,
  deps: {  // Override for testing
    BackgroundManagerClass: MockBackgroundManager,
    SkillMcpManagerClass: MockSkillMcpManager,
  }
})
```

### Plugin Interface (`plugin-interface.ts`)

Exposes these event handlers:

```typescript
{
  tool: tools,                                    // Tool registry
  "chat.params": createChatParamsHandler,         // Model parameter injection
  "chat.headers": createChatHeadersHandler,       // Custom headers
  "chat.message": createChatMessageHandler,       // Message interception
  "experimental.chat.messages.transform": ...,    // Message transformation
  "experimental.chat.system.transform": ...,      // System prompt injection
  config: configHandler,                          // Runtime configuration
  event: createEventHandler,                      // Session lifecycle events
  "tool.execute.before": ...,                     // Pre-tool guards (14 hooks)
  "tool.execute.after": ...,                      // Post-tool transforms (5 hooks)
  "experimental.session.compacting": ...,         // Compaction context preservation
}
```

### Plugin Disposal

```typescript
// Ordered cleanup: background → MCP → hooks
async dispose(): Promise<void> {
  await backgroundManager.shutdown()
  await skillMcpManager.disconnectAll()
  disposeHooks()
}
```

---

## 5. HOOK SYSTEM

### 52 Hooks Across 5 Tiers

| Tier | Count | Factory Function | Purpose |
|------|-------|-----------------|---------|
| Session | 24 | `createSessionHooks()` | Model fallback, think mode, effort allocation |
| Tool Guard | 14 | `createToolGuardHooks()` | Pre/post execution guards |
| Transform | 5 | `createTransformHooks()` | Message context modification |
| Continuation | 7 | `createContinuationHooks()` | Session continuation enforcement |
| Skill | 2 | `createSkillHooks()` | Skill reminders, auto commands |

### Hook Factory Pattern

```typescript
// Every hook follows this pattern:
function createXXXHook(deps: HookDeps): HookFunction {
  return async (event) => {
    // Hook logic using deps
  }
}
```

**Safety:** `safeCreateHook` wrapper isolates initialization — a single failing hook doesn't break the plugin.

**Disabling:** Hooks can be disabled via `disabled_hooks` array in config.

### Key Hook Examples

| Hook | Tier | Event | Purpose |
|------|------|-------|---------|
| `modelFallback` | Session | Error | Switch models on failure |
| `thinkMode` | Session | Pre-chat | Dynamic thinking budget |
| `writeExistingFileGuard` | Tool Guard | `tool.execute.before` | Prevent overwrite without read |
| `bashFileReadGuard` | Tool Guard | `tool.execute.before` | Guard bash file reads |
| `commentChecker` | Tool Guard | `tool.execute.after` | Block AI-generated comments |
| `contextInjector` | Transform | System | Auto-inject AGENTS.md/README.md |
| `todoContinuationEnforcer` | Continuation | `session.idle` | Force continuation until todos complete |
| `ralphLoop` | Continuation | `session.idle` | Self-referential development loop |
| `categorySkillReminder` | Skill | Pre-chat | Remind category-specific skills |
| `compactionContextInjector` | Transform | Compacting | Preserve context across compaction |

---

## 6. SESSION CONTINUITY

### Context Window Reset Recovery

**Compaction hooks** (in `experimental.session.compacting`):

```typescript
// During compaction, these hooks preserve state:
await hooks.compactionContextInjector?.capture(sessionID)     // Save agent config
await hooks.compactionTodoPreserver?.capture(sessionID)       // Save todo state
output.context.push(hooks.compactionContextInjector.inject(sessionID))  // Re-inject
```

### Ralph Loop (Self-Referential Execution)

**State file:** `.sisyphus/ralph-loop.local.md`

```typescript
interface RalphLoopState {
  sessionID: string
  prompt: string
  iteration: number
  maxIterations: number
  completionPromise: string
  ultrawork: boolean  // Oracle verification mode
}
```

**Lifecycle:**
1. `/ralph-loop` command → `startLoop()` → persist state to disk
2. On `session.idle` → check for `completion_promise` in transcript
3. If not found + iterations remaining → inject continuation prompt
4. If found → loop ends
5. If `ultrawork` mode → Oracle agent verifies before termination

### Todo Continuation Enforcer (Boulder Mechanism)

**File:** `src/hooks/todo-continuation-enforcer/`

```typescript
interface SessionState {
  failureCount: number
  lastFailureAt: number
  abortDetectedAt: number
  cooldownUntil: number
}
```

**Anti-stagnation:**
- Tracks incomplete todo count over iterations
- If count doesn't decrease over `MAX_STAGNATION_COUNT` iterations → stop
- Exponential backoff on consecutive failures
- Skip agents: `prometheus`, `compaction`, `plan` (they have their own lifecycle)

### State Persistence Locations

| State | File | Survives |
|-------|------|----------|
| Ralph loop | `.sisyphus/ralph-loop.local.md` | Context resets |
| Boulder plans | `.sisyphus/boulder.json` | Context resets |
| Task history | In-memory `TaskHistory` | Session only |
| Model cache | In-memory `ModelCacheState` | Session only |

---

## 7. SKILL LOADER AND DYNAMIC PROMPT BUILDER

### 4-Scope Priority System

```
Priority (highest → lowest):
1. Project     → .opencode/skills/*/SKILL.md
2. OpenCode    → ~/.config/opencode/skills/*/SKILL.md
3. User        → ~/.config/opencode/oh-my-opencode/skills/*/SKILL.md
4. Global      → Built-in skills
```

**Same-named skill at higher scope overrides lower.**

### SKILL.md Format

```markdown
---
name: my-skill
description: What this skill does
tools: [Bash, Read, Write]      # Allowed tools restriction
mcp:                             # Embedded MCP servers
  - name: my-mcp
    type: stdio
    command: npx
    args: [-y, my-mcp-server]
---

Skill content (instructions for the agent)...
```

### Loading Variants

| Variant | File | Use Case |
|---------|------|----------|
| Sync (blocking) | `blocking.ts` | Initial plugin load (uses worker_threads) |
| Async | `async-loader.ts` | Runtime skill discovery |
| Main | `loader.ts` | Orchestrates discovery → parse → merge |

### SkillMcpManager

**File:** `src/features/skill-mcp-manager/manager.ts`

- Manages MCP servers embedded in skills
- On-demand spin-up (scoped to task)
- Automatic cleanup when skill no longer needed
- Process cleanup registration for orphaned processes
- Idle timeout with configurable cleanup timer

### Template Resolution

Variables in skill content are resolved at load time:
- `{{directory}}` → Current working directory
- `{{agent}}` → Active agent name
- Custom template variables from config

---

## 8. WHAT HIVEMIND CAN LEARN FROM OMO

### Directly Adoptable Patterns

1. **5-Step Plugin Initialization Pipeline**
   - Hivemind's `plugin.ts` should mirror: `loadConfig → createManagers → createTools → createHooks → createPluginInterface`
   - Already partially implemented, needs hook and skill layers

2. **Circuit Breaker with Signature-Based Deduplication**
   - Hivemind's `completion-detector.ts` could integrate this pattern
   - Key: sort input keys for stable signatures, track consecutive count per signature
   - Minimum threshold of 5 prevents false positives

3. **FIFO Concurrency Manager with Settled Flag**
   - Hivemind's `concurrency.ts` should add the `settled: boolean` pattern
   - Prevents double-resolve race conditions on cancel

4. **Two-Phase Spawn (Reserve/Commit)**
   - Pre-check depth and budget, reserve slot, then commit after spawn succeeds
   - Rollback on failure prevents budget leaks

5. **Compaction Context Injection**
   - Hivemind needs `experimental.session.compacting` hooks
   - Capture agent config + todo state before compaction, re-inject after

6. **Delegation Prompt Contract**
   - Adopt the 6-section format for all delegation packets
   - Makes expectations explicit and verifiable

### Patterns to Adapt (Not Copy)

1. **BackgroundManager Monolith** → Modularize into:
   - `TaskRegistry` (task state management)
   - `TaskPoller` (completion detection)
   - `TaskNotifier` (parent notification)
   - `CircuitBreaker` (loop detection)
   - `TaskQueue` (queue management)

2. **Ralph Loop State Machine** → Hivemind's auto-loop should be:
   - Configurable per-task (not global)
   - State persisted via `continuity.ts` (not separate files)
   - Integrated with WaiterModel dual-signal completion

3. **52-Hook System** → Hivemind should start with ~10 hooks:
   - `writeGuard` (tool.execute.before)
   - `bashGuard` (tool.execute.before)
   - `contextInjector` (system.transform)
   - `compactionPreserver` (session.compacting)
   - `completionDetector` (tool.execute.after)
   - `loopDetector` (tool.execute.after)
   - `modelFallback` (session error)
   - `skillLoader` (pre-chat)
   - `notificationHandler` (session.idle)
   - `taskCompletionChecker` (session.idle)

### Anti-Patterns to Avoid from OMO

1. **Single-file BackgroundManager** (~22k chars) → Hivemind enforces 500 LOC max
2. **File-based state in `.sisyphus/`** → Hivemind uses `continuity.ts` JSON store
3. **Bun-specific APIs** → Hivemind targets Node.js >= 20
4. **Hard-coded agent names** → Hivemind uses config-driven agent definitions

---

## Source References

| Source | Confidence | Method |
|--------|------------|--------|
| `src/index.ts` (plugin entry) | HIGH | Direct GitHub read |
| `src/create-managers.ts` | HIGH | Direct GitHub read |
| `src/features/background-agent/manager.ts` | HIGH | Repomix grep + offset read |
| `src/features/background-agent/circuit-breaker.ts` | HIGH | Repomix grep + offset read |
| `src/features/background-agent/concurrency.ts` | HIGH | Repomix grep + offset read |
| `src/features/opencode-skill-loader/AGENTS.md` | HIGH | Repomix offset read |
| `src/plugin-interface.ts` | HIGH | Repomix offset read |
| DeepWiki architecture overview | HIGH | Cross-verified with source |
| DeepWiki hook system details | HIGH | Cross-verified with source |
| DeepWiki session continuity | MEDIUM | Conceptual understanding, some state details unverified |
