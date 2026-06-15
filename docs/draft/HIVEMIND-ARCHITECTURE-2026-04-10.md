# THE WAYS: How a Harness Should Work

**Date**: 2026-04-10
**Document Type**: Architecture & Infrastructure Reference
**Audience**: Business stakeholders and technical practitioners
**Source**: Verified against `src/plugin.ts` (57 LOC), `src/lib/types.ts` (316 LOC), `src/lib/continuity.ts` (310 LOC), `src/lib/state.ts` (251 LOC), `src/lib/lifecycle-manager.ts` (476 LOC), `src/lib/task-status.ts` (21 LOC), `src/lib/session-api.ts` (154 LOC), and 30 modules in `src/lib/`

---

## Executive Summary

The HiveMind harness is a **runtime composition engine** for OpenCode that enables multi-agent orchestration with session continuity, concurrency control, and durable state management. It is distributed as an npm package (`hivemind`) that installs into any OpenCode workspace and wires itself through a thin plugin interface.

The core architectural insight is that the harness operates in **two distinct halves** that must never be confused: the **Hard Harness** (the npm package — tools, hooks, plugin, and shared modules) and the **Soft Meta-Concepts** (user-configurable skills, agents, commands, and rules in `.opencode/`). The Hard Harness is stable and distributed; the Soft Meta-Concepts are customizable and live in the project workspace.

The design applies **CQRS** (Command-Query Responsibility Segregation) throughout: tools are the write-side that mutate state and trigger events, while hooks are the read-side that observe events and inject context without mutations. This separation is what makes the plugin layer composable, testable, and auditable.

The plugin composition root at `src/plugin.ts` is intentionally **57 lines** — not as a stunt, but as an enforceable constraint that keeps all business logic out of the assembly layer. Every import is a factory call; every returned object comes from a dedicated module.

---

## 1. The Two-Halves Architecture

The fundamental architectural decision in HiveMind V3 is the strict separation between two halves that serve fundamentally different purposes.

### Hard Harness: The Engine

**Location**: `src/` (compiled to `dist/` and distributed as `hivemind` npm package)
**Location in OpenCode workspace**: `node_modules/hivemind/` after npm install
**Peer dependency**: `@opencode-ai/plugin` >= 1.1.0

The Hard Harness contains:

| Component | Role | CQRS Side |
|-----------|------|-----------|
| **Tools** (`src/tools/`) | Agent-facing tool surfaces that mutate state | Write |
| **Hooks** (`src/hooks/`) | Event observers that inject context, never mutate | Read |
| **Plugin** (`src/plugin.ts`) | 57-line composition root — wires everything, zero business logic | Assembly |
| **Shared** (`src/lib/` — leaf modules) | Pure utilities, no dependencies on harness modules | Read |

The Hard Harness is a **Node.js package** published to npm. It has no knowledge of your project, your agents, your skills, or your workflows. It only knows how to:
- Register tools with OpenCode's tool system
- Register hooks with OpenCode's event system
- Manage the lifecycle of delegated sessions
- Persist and restore continuity across sessions
- Enforce concurrency budgets per root session

### Soft Meta-Concepts: The Mind

**Location**: `.opencode/` in the project workspace (not in the npm package)

The Soft Meta-Concepts contain:

| Component | Location | Role |
|-----------|----------|------|
| **Skills** | `.opencode/skills/` | Portable instruction bundles (SKILL.md + scripts) |
| **Agents** | `.opencode/agents/` | OpenCode agent definitions with permission profiles |
| **Commands** | `.opencode/commands/` | Reusable command bundles with YAML frontmatter |
| **Rules** | `.opencode/rules/` | Behavioral constraints |
| **Permissions** | `.opencode/opencode.json` | Tool/skill/command access control |

These are **project-local**. They live in your repository, are version-controlled with your code, and are configured for your specific use case. The Hard Harness does not import or depend on any of them.

### Why This Separation Matters

```
hivemind (npm package)        ← Stable, versioned, reusable
    │
    ├── Tools (write-side) ──────────→ Mutate continuity store, create sessions
    └── Hooks (read-side) ──────────→ Observe events, inject session context

.opencode/ (project workspace)        ← Custom, per-project, version-controlled
    │
    ├── skills/  (teach agents how to work)
    ├── agents/   (define agent personas + permissions)
    └── commands/ (bundle reusable workflows)
```

The **engine is stable** — it ships once and doesn't need to change when your workflow changes. The **mind is customizable** — you change skills, agents, and commands without touching the npm package. This is the core architectural bet: separating the mechanism (how sessions run) from the policy (how agents should behave).

---

## 2. The CQRS Pattern in Practice

Command-Query Responsibility Segregation is not a framework pattern in HiveMind — it is a **physical separation enforced at the module boundary**.

### Tools = Write-Side

Tools are registered in OpenCode's tool system and are callable by agents. Every tool call is a **command**: it mutates state, creates side effects, or triggers events. Tools in HiveMind:

- `background` — spawns a background agent session
- `delegate-task` — creates a delegated session with full lifecycle management
- `prompt-skim` — reads and summarizes prompt content
- `prompt-analyze` — deep-analysis of prompt quality
- `session-patch` — modifies session-level state

All tool arguments are validated with **Zod schemas** (using the `tool.schema` API from `@opencode-ai/plugin`). Tool implementations live in `src/tools/<tool-name>/` with `tools.ts` (implementation), `types.ts` (schema + input/output types), and `index.ts` (exports).

### Hooks = Read-Side

Hooks subscribe to OpenCode events and can inject context into prompts or runtime behavior. They **observe and inject** — they do not mutate the continuity store, do not create sessions, and do not enforce policy directly. Hooks in HiveMind:

- `event` — session lifecycle event router
- `system.transform` — system prompt enrichment
- `experimental.chat.system.transform` — chat system transform
- `messages.transform` — message injection
- `shell.env` — environment variable injection
- `experimental.session.compacting` — pre-compaction checkpointing
- `tool.execute.before` — tool guard pre-execution checks
- `tool.execute.after` — tool call counting and stats

Hook implementations live in `src/hooks/` with three factories:
- `create-core-hooks.ts` — primary event routing and context injection
- `create-session-hooks.ts` — session lifecycle observers
- `create-tool-guard-hooks.ts` — tool execution guards

### The plugin.ts as Zero-Logic Assembly

The design achievement of `plugin.ts` at **57 lines** is not a trivia point — it is an **enforceable constraint**. Every function call in the plugin imports from a dedicated module; nothing is inlined. This means:

1. You can audit what the plugin does by reading 57 lines
2. Business logic cannot hide in the assembly layer
3. Every module can be tested in isolation without loading the full plugin
4. The composition order is explicit and auditable

```typescript
// plugin.ts — 57 lines total
export const HarnessControlPlane: Plugin = async ({ client }) => {
  const runtimePolicy = loadRuntimePolicy()
  const backgroundManager = new BackgroundManager()
  const lifecycleManager = createHarnessLifecycleManager({...})
  lifecycleManager.hydrateFromContinuity()           // Restore from durable JSON

  const deps = { client, lifecycleManager, stateManager: taskState }
  const sessionHooks = createSessionHooks(deps)
  const { event: sessionEventObserver, ...sessionReadHooks } = sessionHooks

  return {
    ...createCoreHooks({ ...deps, eventObservers: [sessionEventObserver] }),
    ...sessionReadHooks,
    ...createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy }),
    tool: {
      background: createBackgroundTool(backgroundManager, process.cwd()),
      "delegate-task": createDelegateTaskTool(lifecycleManager, client),
      "prompt-skim": createPromptSkimTool(process.cwd()),
      "prompt-analyze": createPromptAnalyzeTool(process.cwd()),
      "session-patch": createSessionPatchTool(process.cwd()),
    },
  }
}
```

This is the **entire public surface** of the plugin. No business logic. No state machines. No conditional branching based on session type. Just dependency injection and registration.

---

## 3. The Plugin Composition Root

The plugin registers with OpenCode via `opencode.json` at the project root:

```json
{
  "plugins": ["./dist/plugin.js"]
}
```

During development, a thin wrapper at `.opencode/plugins/harness-control-plane.ts` re-exports from `dist/`. At runtime, OpenCode loads the plugin, calls `HarnessControlPlane({ client })`, and merges the returned hooks and tools into the global tool and hook registries.

The composition chain is:

```
OpenCode runtime
    └── Loads plugin from ./dist/plugin.js
            └── Calls HarnessControlPlane({ client })
                    ├── BackgroundManager (background session tracking)
                    ├── LifecycleManager (hydrated from continuity)
                    │       ├── Continuity (durable JSON store)
                    │       ├── ConcurrencyQueue (keyed semaphore)
                    │       ├── CompletionDetector (two-signal detection)
                    │       └── State (in-memory Maps)
                    ├── CoreHooks (event routing + context injection)
                    ├── SessionHooks (lifecycle observers)
                    ├── ToolGuardHooks (pre/post execution guards)
                    └── Tools (5 agent-facing tools)
```

The plugin is configured via two optional environment variables:
- `OPENCODE_HARNESS_STATE_DIR` — defaults to `.opencode/state/hivemind/`
- `OPENCODE_HARNESS_CONTINUITY_FILE` — defaults to `session-continuity.json` within that directory

---

## 4. The Continuity System

HiveMind's continuity system is a **dual-layer model**: an in-memory layer for fast access and a durable JSON file for session survival across process restarts.

### In-Memory Layer (`src/lib/state.ts`)

`state.ts` exports a `TaskStateManager` class and a `taskState` singleton. All state is held in `Map` objects:

```typescript
private readonly rootBudgets = new Map<string, RootBudget>()       // maxDescendants per root
private readonly sessionToRoot = new Map<string, string>()          // session → rootID
private readonly sessionStats = new Map<string, SessionStats>()     // tool call counts, loop detection
private readonly sessionDelegationMeta = new Map<string, DelegationMeta>()  // agent, model, category
private readonly subagentSessions = new Map<string, Set<string>>() // parent → Set<childID>
```

Warning caps are enforced at 25 per session (line 39 of `state.ts`). Root budget tracking enforces `MAX_DESCENDANTS_PER_ROOT` (10 by default, from `types.ts` line 6).

### Durable JSON Layer (`src/lib/continuity.ts`)

`continuity.ts` manages a single JSON file at `.opencode/state/hivemind/session-continuity.json`. The file schema (`ContinuityStoreFile`) holds:

```typescript
type ContinuityStoreFile = {
  version: 1
  updatedAt: number
  sessions: Record<string, SessionContinuityRecord>
  governance: GovernancePersistenceState
}
```

Each `SessionContinuityRecord` contains:
- `sessionID` — the OpenCode session identifier
- `toolProfile` — permission rules and compatible tools for this session
- `promptParams` — agent, model, temperature, guidance, tools
- `metadata` — the full delegation metadata including lifecycle state, compaction checkpoint, delegation packet, and pending notifications

### Deep-Clone-on-Read

Every read from the continuity store is **deep-cloned** before being returned. This is implemented in `continuity-clone.ts` with a family of `clone*` functions:

```typescript
// continuity-clone.ts exports:
cloneContinuityRecord()     // full record
cloneDelegationMeta()      // delegation metadata
cloneDelegationPacket()    // delegation packet
cloneCompactionCheckpoint() // compaction data
cloneLifecycleState()      // lifecycle state
clonePendingNotifications() // notification queue
```

This prevents **mutation aliasing**: callers who read session state and modify it cannot accidentally corrupt the in-store version. The clone functions use spread operators and array copying to create structurally identical but reference-discrete copies.

### Persistence Strategy

- **Read**: `loadStoreFromDisk()` is called lazily on first access and cached in module-level `storeCache`
- **Write**: `persistStore()` writes synchronously to disk after every mutation (no write-back caching)
- **Path resolution**: `OPENCODE_HARNESS_STATE_DIR` or `OPENCODE_HARNESS_CONTINUITY_FILE` override defaults
- **Export**: Delegation artifacts (artifacts, commits, parent chain) can be exported to `.hivemind/delegation/` via `OPENCODE_HARNESS_DELEGATION_EXPORTS=1`

### Hydration on Startup

When `lifecycleManager.hydrateFromContinuity()` is called during plugin initialization (`plugin.ts` line 37), it:
1. Reads all `SessionContinuityRecord` entries from the continuity file
2. Calls `hydrateDelegationState()` for each, repopulating the in-memory Maps
3. Restores any `compactionCheckpoint` data into `taskState`

This means **background agents that were running when OpenCode shut down are reconnected** to their in-memory state when the plugin restarts.

---

## 5. The Lifecycle State Machine

### TaskStatus: The Core Type

`src/lib/task-status.ts` defines the canonical task status type:

```typescript
export type TaskStatus = "pending" | "queued" | "running" | "completed" | "error" | "cancelled" | "interrupt"

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending:    ["queued", "cancelled"],
  queued:     ["running", "cancelled"],
  running:    ["completed", "error", "cancelled", "interrupt"],
  completed:  [],
  error:      [],
  cancelled:  [],
  interrupt:  ["running", "queued"],  // can resume from interrupt
}
```

This 7-state model replaces an earlier 4-state model (breaking change to continuity JSON format, documented in `src/lib/AGENTS.md`).

### SessionLifecyclePhase: The Inner State

While `TaskStatus` is the external/public status, the lifecycle manager maintains a richer `SessionLifecyclePhase` for internal tracking:

```typescript
type SessionLifecyclePhase = "created" | "queued" | "dispatching" | "running" | "completed" | "failed"
```

The `HarnessLifecycleManager` (`src/lib/lifecycle-manager.ts`, 476 LOC) manages the transition between these states. Key operations:

- `launchDelegatedSession()` — creates child session, records continuity, reserves budget, sets up delegation packet
- `handleEvent()` — processes `session.created`, `session.updated`, `session.deleted` events and updates continuity
- `cancelDelegatedSession()` — aborts session via SDK and cleans up lifecycle
- `recordCompactionCheckpoint()` — snapshots state at compaction time, resets stats
- `hydrateFromContinuity()` — rebuilds in-memory state from continuity store on startup

### Concurrency Control

The `DelegationConcurrencyQueue` in `src/lib/concurrency.ts` implements a **keyed semaphore** using FIFO queues per key. Keys are built from `buildDelegationQueueKey({ model, agent, category })`. The global default limit is 3 concurrent delegated sessions (configurable via `OPENCODE_HARNESS_CONCURRENCY_LIMIT`).

---

## 6. The Agent Registry and Delegation

### Agent Definitions

Agents are defined as YAML + markdown files in `.opencode/agents/`. The harness does not compile or validate these at startup — OpenCode loads them natively. The `AGENTS.md` file in the project root references 6 agents: `coordinator`, `conductor`, `researcher`, `builder`, `critic`, `explore`.

The agent definitions specify:
- `agent:` — the specialist role (`researcher`, `builder`, `critic`, `general`)
- `permission:` — tool/skill access profiles
- `temperature:` — model temperature preset
- `model:` — explicit model override or category-derived default

### The Delegation Chain

When an orchestrator delegates to a specialist, the chain is:

```
Orchestrator (coordinator agent)
    │
    ├── Calls delegate-task tool
    │       │
    │       └── LifecycleManager.launchDelegatedSession()
    │               │
    │               ├── Creates child session via session-api.ts (SDK wrapper)
    │               ├── Records SessionContinuityRecord in continuity store
    │               ├── Reserves descendant budget on root session
    │               └── Sets up DelegationPacket with parent chain
    │
    └── Child session (specialist agent)
            │
            ├── Runs independently (can be sync or async/background)
            ├── Emits events via OpenCode event system
            ├── CompletionDetector watches for session.idle + stability timer
            └── Parent notified via pending notifications or direct response
```

### session-api.ts: Typed SDK Wrappers

`src/lib/session-api.ts` (154 LOC) wraps the raw OpenCode SDK client with typed functions:

- `createSession(client, opts)` — creates a child session
- `getSession(client, sessionID)` — fetches session metadata
- `getSessionStatusMap(client)` — returns `Record<sessionID, { type: "idle" | "busy" | "retry" }>`
- `abortSession(client, sessionID)` — aborts a running session
- `getSessionMessages(client, sessionID, opts)` — fetches message history
- `sendPrompt(client, sessionID, body)` — sends a prompt synchronously
- `sendPromptAsync(client, sessionID, body)` — sends a prompt asynchronously (background tasks)

The wrappers do **no completion detection** and have **no multi-path fallback** — that logic lives in `completion-detector.ts` and `lifecycle-manager.ts` respectively.

---

## 7. The Module Dependency Map

### The 30 Files of src/lib/

```
src/
├── plugin.ts              # 57 LOC — composition root
├── index.ts              # barrel re-exports
├── hooks/
│   ├── create-core-hooks.ts
│   ├── create-session-hooks.ts
│   ├── create-tool-guard-hooks.ts
│   ├── messages-transform.ts
│   └── types.ts
└── lib/                  # 30 files
    ├── types.ts           # 316 LOC — LEAF (no imports)
    ├── task-status.ts     # 21 LOC — near-leaf
    ├── state.ts           # 251 LOC — TaskStateManager singleton
    ├── helpers.ts         # ~107 LOC — pure utilities
    ├── concurrency.ts     # ~98 LOC — DelegationConcurrencyQueue
    ├── completion-detector.ts  # ~120 LOC — two-signal detection
    ├── continuity.ts      # 310 LOC — durable persistence
    ├── continuity-clone.ts     # 170 LOC — deep clone functions
    ├── continuity-normalizers.ts
    ├── session-api.ts     # 154 LOC — SDK wrappers
    ├── session-recovery.ts
    ├── runtime.ts         # ~43 LOC — event→status mapping
    ├── lifecycle-manager.ts   # 476 LOC — state machine
    ├── lifecycle-state.ts
    ├── lifecycle-queue.ts
    ├── lifecycle-runtime-policy.ts
    ├── lifecycle-process-runner.ts
    ├── lifecycle-background-observer.ts
    ├── notification-handler.ts  # ~100 LOC
    ├── pending-notifications.ts
    ├── background-manager.ts
    ├── delegation-packet.ts
    ├── delegation-export.ts
    ├── runtime-policy.ts
    ├── compaction-checkpoint.ts
    ├── execution-mode.ts
    ├── categories.ts
    ├── governance-engine.ts      # ORPHAN — on disk, not in architecture
    ├── specialist-router.ts      # ORPHAN — on disk, not in architecture
    └── injection-engine.ts      # ORPHAN — on disk, not in architecture
```

### Dependency Rules

```
types.ts (leaf — no imports from src/lib)
├── task-status.ts
├── state.ts
├── helpers.ts (self-contained — no imports from src/lib)
├── concurrency.ts (self-contained)
├── completion-detector.ts (self-contained)
├── continuity.ts → types.ts
├── session-api.ts → helpers.ts
├── runtime.ts → helpers.ts + types.ts
├── notification-handler.ts → helpers.ts
└── lifecycle-manager.ts → concurrency + continuity + helpers + session-api + state + types
```

**Max chain depth: 2 levels.** No module in `src/lib/` imports from another module that ultimately imports back to it.

### The 3 Orphan Modules

Three files exist on disk but are **not part of the current architecture**:
- `governance-engine.ts` — governance logic that was planned but not integrated
- `specialist-router.ts` — routing logic that was refactored into the delegation system
- `injection-engine.ts` — injection logic superseded by the hooks system

These are documented in `src/lib/AGENTS.md` and would need a proper migration plan before being activated.

---

## 8. THE WAYS: Core Principles

### Principle 1: Zero Business Logic in the Plugin Layer

`plugin.ts` is 57 lines of pure composition. Every decision about what happens when a session is created, what happens when a tool is called, or how concurrency is enforced lives in a dedicated module. The plugin is the **assembly language of the harness** — you read it to understand what modules are connected, not what logic runs.

### Principle 2: State is Durable but Intelligence is Separate

The continuity system persists session state across restarts. But **persistence is not intelligence** — the continuity store does not know how to interpret the data it holds. That interpretation lives in the lifecycle manager and the session recovery logic. The store is a **WAL (Write-Ahead Log)** for session state, not an inference engine.

This separation is what enables session recovery: when a session resumes, `session-recovery.ts` and `compaction-checkpoint.ts` reconstruct what the session needs, but the decision about what to do with that state is made by the calling agent.

### Principle 3: Agents Are Defined, Not Hard-Coded

The harness does not embed agent logic. Agent definitions in `.opencode/agents/` are markdown files that OpenCode reads natively. The harness only manages the **delegation lifecycle** — creating sessions, tracking budgets, enforcing concurrency, and handling completion. What the agent does in that session is determined by the agent definition and the instructions it receives.

### Principle 4: Composition Is the Architecture, Not Inheritance

The harness is assembled at startup from factory functions. There is no deep class hierarchy, no abstract base plugin, no inheritance chain that forces changes to cascade. The `HarnessLifecycleManager` depends on `CompletionDetector`, `DelegationConcurrencyQueue`, and `continuity.ts`, but those modules are independently testable and replaceable.

### Principle 5: Checkpoints Enable Autonomous Loops

The `CompletionDetector` (two-signal detection: `session.idle` + stability timer) and `CompactionCheckpoint` data are what enable the **auto-loop / ralph-loop** feature described in the architecture proposal. When a session completes and the parent agent loops back to retry, the checkpoint data provides a clean handoff point. This is why the `CompactionCheckpointData` type in `types.ts` (line 63) includes agent, model, tools, delegation metadata, session stats, and a timestamp.

---

## 9. The LOC Budget Question

### The Target

The architecture proposal (`architecture-proposal-hivemind-v3.md`) sets a **4,000–5,000 LOC target** for the total harness codebase, representing a 67% reduction from the ~15,000 LOC product-detox branch.

### The Reality

The current `src/` tree (excluding tests) is approximately **8,100 LOC**:
- `src/plugin.ts`: 57 LOC
- `src/lib/`: ~6,339 LOC (30 files)
- `src/hooks/`: ~500 LOC (5 files)
- `src/tools/`: ~500 LOC (5 tools, multiple files each)

This is **60% over the target**, but **46% under the anti-pattern** it replaced.

### Is the Target Still Meaningful?

The LOC target was set in the context of a **cleanup operation** — moving from 15,000 LOC of tangled governance scripts and feature-bloated modules to a clean, minimal harness. As a **cleanup target**, it served its purpose: the team knew what to cut.

As an **absolute budget**, it is less meaningful now because:

1. The **orphan modules** (governance-engine.ts, specialist-router.ts, injection-engine.ts) are 1,000+ LOC of code that is **already cut** from the active architecture but still on disk. Removing them would reduce the LOC count significantly.

2. The **continuity system** (~635 LOC across `continuity.ts`, `continuity-clone.ts`, `continuity-normalizers.ts`) is more complex than the original proposal anticipated because the **deep-clone-on-read** requirement is load-bearing for multi-agent concurrent safety.

3. The **lifecycle system** (~476 LOC in `lifecycle-manager.ts` alone, plus 5 supporting modules) grew because session lifecycle management is genuinely complex when you account for background sessions, parent-child notification, compaction, and recovery.

### Recommendations

1. **Remove the orphan modules** — governance-engine.ts, specialist-router.ts, injection-engine.ts should either be migrated into the active architecture or deleted. They add maintenance overhead and confusion for zero benefit.

2. **Accept that 5,000 LOC is a floor, not a ceiling** — the current complexity of the continuity and lifecycle systems reflects real requirements. A more honest target might be 6,000–7,000 LOC.

3. **Enforce the max-500-LOC-per-module rule** — several modules exceed this (continuity.ts at 310 LOC is fine; lifecycle-manager.ts at 476 LOC is close; the ~635 estimate in AGENTS.md appears to be an overcount). A lint rule would prevent future growth.

---

## 10. Open Questions and Future Directions

### Pillar 5: Persistence Without Intelligence

The architecture proposal describes "Pillar 5" as **persistence without intelligence** — the continuity system knows how to store and retrieve state, not what the state means. This is largely implemented, but the `session-recovery.ts` module (which builds `RecoveryResumeState`) is where the line between "dumb storage" and "intelligent recovery" blurs. The open question is whether recovery heuristics (e.g., "if session was in `running` state, should it auto-resume or wait for human input?") belong in the harness or should be delegated to the agent's instructions.

### KnowledgeGraph Integration

The architecture proposal references a **KnowledgeGraph** for long-term memory across sessions. This is not yet implemented. The current continuity system is session-scoped; a cross-session memory layer would require a new storage backend and a corresponding tool to write and query it.

### Worktree Consolidation

The harness-experiment worktree was created to prototype the clean architecture. The product-detox branch still exists in the main hivemind-plugin repository. A **consolidation plan** is needed to determine what, if anything, gets ported from product-detox into the harness-experiment worktree, and what gets archived.

### The Built-in-Process Fallback

`lifecycle-manager.ts` (line 64–71) contains a comment noting that `builtin-process` execution mode "never grew beyond a stub" and is routed to `builtin-subsession`. This is a **known gap**: true subprocess isolation (where a delegated session runs in a true child process with independent tool access) is not yet implemented via the SDK.

### Background Session Timeout

`WATCH_TIMEOUT_MS` is set to 1800000 (30 minutes) in `plugin.ts` (line 22) for background session polling. This is a **heuristic constant** — there is no adaptive mechanism to adjust timeout based on task complexity or historical completion times. An intelligent timeout strategy would be a meaningful enhancement.

---

## Appendix: Key Types Reference

```typescript
// Task status (7 states, replaces old 4-state model)
type TaskStatus = "pending" | "queued" | "running" | "completed" | "error" | "cancelled" | "interrupt"

// Continuity store shape
type ContinuityStoreFile = {
  version: 1
  updatedAt: number
  sessions: Record<string, SessionContinuityRecord>
  governance: GovernancePersistenceState
}

// Per-session continuity record
type SessionContinuityRecord = {
  sessionID: string
  toolProfile: SessionToolProfile
  promptParams: SessionPromptParams
  metadata: SessionContinuityMetadata
}

// Delegation metadata embedded in continuity
type DelegationMeta = {
  rootID: string
  depth: number
  budgetUsed: number
  agent: SpecialistAgent
  category?: DelegationCategory
  model?: string
  queueKey: string
  runtimePolicyOverride?: SessionPolicyOverride
}

// Lifecycle phase (internal tracking)
type SessionLifecyclePhase = "created" | "queued" | "dispatching" | "running" | "completed" | "failed"

// Compact checkpoint snapshot
type CompactionCheckpointData = {
  agent: string | null
  model: string | null
  tools: string[]
  delegationMeta: DelegationMeta | null
  warnings: string[]
  sessionStats: { total: number; byTool: Record<string, number>; loop: { signature: string; count: number } }
  capturedAt: number
}
```

---

*Document 2 of 3 — Architecture & Infrastructure*
*Companion: "THE WHAT" (Feature & Capability Model) and "THE WHY" (Design Rationale & Evidence)*
