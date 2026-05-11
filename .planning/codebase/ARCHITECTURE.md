<!-- refreshed: 2026-05-12 -->
# Architecture

**Analysis Date:** 2026-05-12

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPOSITION ROOT                                │
│                       `src/plugin.ts` (242 LOC)                         │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│   TOOLS      │    HOOKS     │  ROUTING     │   FEATURES   │   CLI       │
│  (write-side)│ (read-side)  │ (entry)      │ (standalone) │(bin)        │
│ src/tools/   │ src/hooks/   │ src/routing/ │ src/features/│ src/cli/    │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴──────┬──────┘
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     RUNTIME DEEP MODULES                                │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│  TASK-MANAGEMENT │   COORDINATION   │   CONFIG                         │
│  `src/task-      │   `src/          │   `src/config/`                  │
│   management/`   │   coordination/` │   (subscriber, compiler,         │
│  (continuity,    │   (delegation,   │    workflow state machine)        │
│   lifecycle,     │    concurrency,  │                                   │
│   journal,       │    completion,   │                                   │
│   trajectory,    │    spawner,      │                                   │
│   recovery)      │    sdk/cmd-del.) │                                   │
└──────────────────┴──────────────────┴──────────────────────────────────┘
       │                      │                          │
       ▼                      ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LEAF UTILITIES                                  │
├──────────────────┬─────────────────────────────────────────────────────┤
│  SHARED          │  SCHEMA-KERNEL                                      │
│  `src/shared/`   │  `src/schema-kernel/`                               │
│  (types, state,  │  (Zod schemas, validation contracts)                │
│   helpers, SDK   │                                                     │
│   wrappers)      │                                                     │
└──────────────────┴─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DURABLE STATE (`.hivemind/`)                         │
│  Session continuity JSON, delegation records, event journals,           │
│  execution lineage, session tracker capture                             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Plugin** | Composition root — wires dependencies, registers tools & hooks | `src/plugin.ts` |
| **Public API** | Package entrypoint re-exports | `src/index.ts` |
| **Tools** | 20 write-side tool entrypoints across 6 categories | `src/tools/*/` |
| **Hooks** | Read-side observers, lifecycle routing, guard decisions | `src/hooks/*/` |
| **DelegationManager** | WaiterModel dispatch, concurrency, category gates | `src/coordination/delegation/manager.ts` |
| **HarnessLifecycleManager** | Session lifecycle state machine | `src/task-management/lifecycle/index.ts` |
| **CompletionDetector** | Dual-signal completion (idle + msg threshold) | `src/coordination/completion/detector.ts` |
| **ContinuityStore** | Dual-layer state (in-memory + `.hivemind/` JSON) | `src/task-management/continuity/index.ts` |
| **SessionTracker** | Session knowledge capture & persistence | `src/features/session-tracker/index.ts` |
| **TaskStateManager** | In-process session stats, budgets, delegation metadata | `src/shared/state.ts` |
| **SessionEntryRouter** | Intake classification, language resolution, profile | `src/routing/session-entry/index.ts` |
| **CommandEngine** | Command bundle discovery & routing | `src/routing/command-engine/index.ts` |
| **ConfigSubscriber** | Hivemind config loading & caching | `src/config/subscriber.ts` |
| **Workspace Workflow** | configure-primitive workflow state machine | `src/config/workflow/*.ts` |
| **CLI** | Bin entrypoint for hivemind CLI | `src/cli/` |

## Pattern Overview

**Overall:** CQRS (Command Query Responsibility Segregation) + Dependency Injection factory pattern

**Key Characteristics:**
- **CQRS boundary:** Tools = write-side, Hooks = read-side. Hooks MUST NOT perform durable writes (`cqrs-boundary.ts` enforces this via `assertHookWriteBoundary()`)
- **Factory injection:** Hook factories receive `HookDependencies` (`src/hooks/types.ts`) — lifecycle manager, client, state manager — through constructor/dependency injection
- **WaiterModel delegation:** The `DelegateTask` tool dispatches background child sessions via `DelegationManager`, which manages state machine transitions, concurrency gating, and dual-signal completion detection
- **Dual-layer state:** In-memory `TaskStateManager` (`src/shared/state.ts`) backed by durable JSON in `.hivemind/state/` via continuity store
- **9-surface model:** The plugin architecture defines 9 surfaces with distinct mutation authority: plugin (composition), tools (write), hooks (read/guard/transform), task-management (state), coordination (orchestration), features (standalone), config (settings), routing (entry), shared (leaf)
- **L0→L1→L2→L3 agent hierarchy:** Delegation nesting up to `MAX_DELEGATION_DEPTH` (default 3), tracked via `nestingDepth` in delegation records

## Layers

**Composition Root (`src/plugin.ts`):**
- Purpose: Instantiates all managers (lifecycle, delegation, session tracker, PTY), loads runtime policy, wires hook factories and tool registrations
- Location: `src/plugin.ts`
- Contains: Plugin factory function, dependency wiring, tool map registration, hook spread-merge
- Depends on: All other layers (tools, hooks, shared, coordination, task-management, features, config, routing)
- Used by: OpenCode runtime via `@opencode-ai/plugin` SDK

**Tools — Write-Side (`src/tools/`):**
- Purpose: 20 tool entrypoints that perform validated mutations — delegation dispatch, config management, prompt assistance, session introspection
- Location: `src/tools/` (6 subdirectories: `config/`, `delegation/`, `hivemind/`, `prompt/`, `session/`)
- Contains: Tool factory functions that return tool definitions, each importing schemas, shared helpers, and runtime managers
- Depends on: `src/shared/`, `src/schema-kernel/`, `src/coordination/`, `src/task-management/`, `src/features/`
- Used by: OpenCode tool call system

**Hooks — Read-Side (`src/hooks/`):**
- Purpose: Observe OpenCode lifecycle events, route facts to runtime managers, shape responses, make guard decisions
- Location: `src/hooks/` (5 subdirectories: `composition/`, `guards/`, `lifecycle/`, `observers/`, `transforms/`)
- Contains: Hook factory functions returned as plugin hook objects, CQRS boundary enforcement
- Depends on: `src/shared/`, `src/task-management/lifecycle/`
- Used by: Plugin composition root (merges hook objects into return)

**Routing — Session Entry (`src/routing/`):**
- Purpose: Session intake classification, language resolution, behavioral profile resolution, command engine routing
- Location: `src/routing/` (3 subdirectories: `behavioral-profile/`, `command-engine/`, `session-entry/`)
- Contains: Purpose classifier, language detector, intake gate, behavioral profile resolution
- Depends on: `src/shared/`, `src/config/`
- Used by: Hook factories (injected as `getIntake`, `getBehavioralProfile`)

**Features — Standalone (`src/features/`):**
- Purpose: Self-contained runtime features — background command PTY, bootstrap, doc intelligence, prompt packets, runtime pressure, SDK supervisor, session tracker, work contracts, steering engine
- Location: `src/features/` (9 subdirectories)
- Contains: Each feature owns its types, implementation, and public API surface
- Depends on: `src/shared/`, `src/schema-kernel/` (varies by feature)
- Used by: Plugin composition root and tools

**Config (`src/config/`):**
- Purpose: Hivemind config loading, caching, and the configure-primitive workflow state machine
- Location: `src/config/` (3 modules: `subscriber.ts`, `compiler.ts`, `workflow/`)
- Contains: Config subscriber (lazy-cached), config compiler (YAML/JSON → schema), workflow state machine
- Depends on: `src/schema-kernel/`, `src/shared/`
- Used by: Plugin init, tools

**Task Management — State & Lifecycle (`src/task-management/`):**
- Purpose: Session continuity (dual-layer persistence), lifecycle state machine (created→queued→dispatching→running→completed/failed), append-only journals, execution trajectory, recovery, event tracker
- Location: `src/task-management/` (5 subdirectories: `continuity/`, `journal/`, `lifecycle/`, `recovery/`, `trajectory/`)
- Contains: `HarnessLifecycleManager`, `ContinuityStore`, journal index/query/replay, trajectory ledger, recovery assess/repair
- Depends on: `src/shared/`, `src/coordination/completion/`
- Used by: Plugin, hooks, tools

**Coordination — Orchestration (`src/coordination/`):**
- Purpose: Delegation dispatch (WaiterModel), concurrency gating, completion detection, SDK/command delegation handlers, spawners, category gates
- Location: `src/coordination/` (6 subdirectories: `command-delegation/`, `completion/`, `concurrency/`, `delegation/`, `sdk-delegation/`, `spawner/`)
- Contains: `DelegationManager`, `DelegationStateMachine`, `DelegationConcurrencyQueue`, `CompletionDetector`, spawn request builder, auto-loop/ralph-loop
- Depends on: `src/shared/`, `src/task-management/continuity/`, `src/features/`, `src/config/`
- Used by: Plugin, tools

**Schema Kernel (`src/schema-kernel/`):**
- Purpose: Zod validation schemas for all Hivemind contracts (tools, schemas, configs, commands, agents, skills, permissions, etc.)
- Location: `src/schema-kernel/` (18 schema files + index barrel + JSON schema generator)
- Contains: Zod v4 schemas, JSON schema generator for config
- Depends on: nothing (leaf-like, may import `zod`)
- Used by: Tools, config, features

**Shared — Leaf (`src/shared/`):**
- Purpose: Type definitions, state management, SDK wrapper, helpers, runtime policy, tool response envelope
- Location: `src/shared/` (12 files + 2 subdirectories: `security/`)
- Contains: `TaskStateManager`, `OpenCodeClient` wrapper, `RuntimePolicy` loader, types barrel, tool response constructors
- Depends on: nothing from this project (leaf utility)
- Used by: All layers

## Data Flow

### Primary Request Path — Delegate-Task Tool Call

1. **Tool entry** (`src/tools/delegation/delegate-task.ts`) receives validated input via Zod schema
2. **DelegationManager.dispatch()** (`src/coordination/delegation/manager.ts:163`) validates agent, evaluates category gate, resolves concurrency key, acquires semaphore
3. **Session spawner** (`src/coordination/spawner/session-creator.ts`) creates child OpenCode session via SDK
4. **Prompt dispatch** (`sendPromptAsync` at `src/shared/session-api.ts`) sends async prompt to child session
5. **State machine transition** (`src/coordination/delegation/state-machine.ts`) transitions delegation from "dispatched" → "running"
6. **Persistence** (`src/task-management/continuity/delegation-persistence.ts`) persists delegation records
7. **Completion detection** (`src/coordination/completion/detector.ts`) monitors via dual-signal (session idle events + message count stability)
8. **Result polling** (`src/coordination/sdk-delegation/handler.ts`) polls for terminal state
9. **Response** returned to caller via tool response envelope (`src/shared/tool-response.ts`)

### Lifecycle Event Flow

1. **OpenCode runtime** emits lifecycle events (session.created, session.idle, session.error, session.deleted)
2. **Core hook** (`src/hooks/lifecycle/core-hooks.ts:53`) receives raw event, extracts `eventType` and `sessionID`
3. **Event router** feeds:
   - `lifecycleManager.handleEvent()` → feeds CompletionDetector with session signals
   - `lifecycleManager.replayPendingNotificationsForEvent()` → replays queued notifications
   - Event observers array → delegation event observer, session entry observer, session journey observer, session tracker observer
4. **system.transform hook** (`src/hooks/lifecycle/core-hooks.ts:69`) injects governance block, intake context, and behavioral profile into session system prompt

### Config Workflow Flow

1. **configure-primitive tool** (`src/tools/config/configure-primitive.ts`) receives workflow parameters
2. **tool.execute.after hook** (`src/plugin.ts:193`) detects `configure-primitive` tool calls with workflow metadata
3. **Workflow state machine** (`src/config/workflow/*.ts`) advances workflow turns, persists state
4. **Workflow guard** (`src/config/workflow/workflow-guards.ts`) validates turn transitions

### Session Tracker Flow

1. **Event observer** in plugin routes events to `sessionTracker.handleSessionEvent()`
2. **chat.message hook** (`src/plugin.ts:159`) routes user/assistant messages
3. **tool.execute.after hook** routes tool execution metadata
4. **SessionTracker** (`src/features/session-tracker/index.ts`) captures, transforms, and persists session knowledge

**State Management:**
- **Dual-layer:** In-memory `TaskStateManager` (`src/shared/state.ts`) for fast lookups + durable `.hivemind/state/` JSON via `ContinuityStore` (`src/task-management/continuity/index.ts`)
- **Singleton pattern:** `taskState` is a process-wide singleton in `src/shared/state.ts:188`
- **Delegation records:** Persisted via `delegation-persistence.ts` in `src/task-management/continuity/`
- **Session journals:** Append-only event timelines in `src/task-management/journal/`

## Key Abstractions

**DelegationManager:**
- Purpose: Public dispatch + concurrency entry point for SDK and command delegations
- Files: `src/coordination/delegation/manager.ts` (500 LOC), `src/coordination/delegation/state-machine.ts`, `src/coordination/delegation/types.ts`
- Pattern: WaiterModel — dispatches child sessions asynchronously, polls for completion, returns results on demand

**HarnessLifecycleManager:**
- Purpose: Session lifecycle state machine with validated transitions
- File: `src/task-management/lifecycle/index.ts` (243 LOC)
- Pattern: Validated state machine — `isValidTransition()` guards all phase changes

**CompletionDetector:**
- Purpose: Dual-signal completion detection — session idle/error/deleted events + message count stability
- File: `src/coordination/completion/detector.ts`
- Pattern: Signal accumulator with stability polling

**TaskStateManager:**
- Purpose: In-memory singleton managing session stats, root budgets, delegation metadata, subagent registry
- File: `src/shared/state.ts` (251 LOC)
- Pattern: Singleton with backward-compatible wrapper functions

**ContinuityStore:**
- Purpose: Dual-layer state persistence (in-memory + JSON file on disk)
- Files: `src/task-management/continuity/index.ts`, `src/task-management/continuity/delegation-persistence.ts`
- Pattern: Read/write through in-memory map, background sync to `.hivemind/state/` JSON

**HookDependencies:**
- Purpose: Shared dependency bundle injected into every hook factory
- File: `src/hooks/types.ts` (45 LOC)
- Pattern: Dependency injection through interface, prevents hidden global state

## Entry Points

**Plugin Entry:**
- Location: `src/plugin.ts`
- Triggers: OpenCode runtime loads the plugin (referenced in `.opencode/plugins/harness-control-plane.ts`)
- Responsibilities: Wire all dependencies, register 20 tools, compose hooks, load runtime policy

**Package Entry:**
- Location: `src/index.ts` (re-exports from 27 modules)
- Triggers: `import { ... } from "hivemind"`
- Responsibilities: Public API surface for npm package consumers

**CLI Entry:**
- Location: `src/cli/index.ts` (via `bin/hivemind.cjs`)
- Triggers: `hivemind` CLI command
- Responsibilities: Init, recover, doctor, version, help commands

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js). Async operations use `Promise`-based concurrency via `DelegationConcurrencyQueue` (`src/coordination/concurrency/queue.ts`). PTY background commands use process-level async I/O.
- **Global state:** Singleton `taskState` in `src/shared/state.ts:188` — module-level mutable state shared across all sessions, accessed via thin wrapper functions. Dual-layer state in continuity store similarly module-scoped.
- **Module size cap:** Maximum 500 LOC per module. `DelegationManager` (`manager.ts`) is the reference at exactly 500 LOC.
- **Circular imports:** No circular dependency chains detected. Dependency direction is strictly: Leaf (shared) → Deep modules (task-management, coordination) → Plugin composition root.
- **ESM strict:** TypeScript targets ES2022 with `NodeNext` module resolution. All imports use `.js` extensions and `import type` for type-only imports (`verbatimModuleSyntax: true`).
- **`[Harness]` error prefix:** All thrown errors from harness code use `[Harness]` prefix.
- **State root:** `.hivemind/` is the canonical internal state root (Q6 decision). No runtime state stored in `.opencode/`.
- **9-surface mutation authority:** Each source plane has defined allowed/forbidden mutations (see `src/AGENTS.md` for full matrix).

## Anti-Patterns

### Plugin Composition Complexity
**What happens:** `src/plugin.ts` manages increasingly complex dependency wiring with multiple event observers, callback factories, and lifecycle timing dependencies (e.g., `setCompletionDetector()` resolves circular construction order).
**Do this instead:** Consider an explicit DI container or builder pattern to formalize the dependency graph and eliminate post-construction wiring methods.

### Singleton State Module
**What happens:** `src/shared/state.ts` exports a process-wide singleton `taskState` with thin wrapper functions, creating implicit coupling across all consumers.
**Do this instead:** Pass state manager instances through dependency injection in tools (tools currently import `taskState` directly in some cases).

### Deprecated Event Tracker Coexistence
**What happens:** Two session tracking systems coexist — the new `SessionTracker` (`src/features/session-tracker/`) and the deprecated legacy event-tracker (`src/task-management/journal/event-tracker/`), both wired in `src/plugin.ts`.
**Do this instead:** Remove legacy event-tracker wiring after `SessionTracker` integration is fully validated.

## Error Handling

**Strategy:** Best-effort with catch-and-warn pattern. Critical paths (plugin init, delegation dispatch) throw `[Harness]` errors. Observers and background tasks use try/catch with `console.warn` fallback.

**Patterns:**
- Tools return standardized `success`/`error`/`pending` responses via `src/shared/tool-response.ts`
- Hook observers wrap in try/catch with best-effort semantics — never block SDK lifecycle
- Lifecycle transitions validated by `isValidTransition()` guard
- Runtime policy loading throws `[Harness]` errors for invalid values
- Continuity store deep-clones on read; mutations are explicit via `patchSessionContinuity()`

## Cross-Cutting Concerns

**Logging:** `console.warn` with `[Harness]` prefix for module-level logging. No structured logging framework.

**Validation:** Zod schemas in `src/schema-kernel/` for tool inputs, configs, and all external contracts. Schema-kernel generates JSON schema for config validation.

**Authentication:** No custom auth; delegates to OpenCode's built-in session auth.

**Concurrency:** `DelegationConcurrencyQueue` (`src/coordination/concurrency/queue.ts`) provides per-key semaphore-based concurrency control with global limit (default 3) and optional per-key overrides.

**Category Gates:** `src/coordination/delegation/category-gates.ts` resolves allow/ask/deny decisions for agent-category dispatch pairings.

---

*Architecture analysis: 2026-05-12*
