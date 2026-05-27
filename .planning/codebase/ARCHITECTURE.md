# Architecture

**Analysis Date:** 2026-05-28

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OpenCode Runtime Host                              │
│                        (Plugin Loading & Session Management)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HarnessControlPlane (Composition Root)                │
│                              src/plugin.ts                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Tool Registration (23 tools)    │  Hook Registration (7 hooks)     │   │
│  │  Delegation Module Wiring        │  Lifecycle Manager Setup         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  Coordination Layer │ │  Task Management    │ │  Features Layer     │
│  (Delegation,       │ │  (Continuity,       │ │  (Session Tracker,  │
│   Completion,       │ │   Lifecycle,        │ │   Background Cmd,   │
│   Concurrency)      │ │   Journal)          │ │   Governance)       │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Shared Layer (Leaf Utilities)                    │
│  types.ts │ state.ts │ helpers.ts │ session-api.ts │ runtime-policy.ts     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         External Integrations                               │
│  OpenCode SDK (@opencode-ai/sdk) │ Zod Schemas │ Node.js FS              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **HarnessControlPlane** | Plugin composition root, wires all modules, registers tools/hooks | `src/plugin.ts` |
| **DelegationManager** | Thin public facade for delegation operations, delegates to coordinator | `src/coordination/delegation/manager.ts` |
| **DelegationCoordinator** | Dispatches delegations, manages dual-signal completion | `src/coordination/delegation/coordinator.ts` |
| **CompletionDetector** | Dual-signal completion detection (native + terminal status) | `src/coordination/completion/detector.ts` |
| **HarnessLifecycleManager** | Session lifecycle state machine, transition guards, activity tracking | `src/task-management/lifecycle/index.ts` |
| **TaskStateManager** | In-process session/budget state, subagent registry | `src/shared/state.ts` |
| **ContinuityStore** | Persistent session state, deep-clone-on-read, atomic writes | `src/task-management/continuity/index.ts` |
| **SessionTracker** | Session knowledge capture, tool metadata, message tracking | `src/features/session-tracker/index.ts` |
| **ConfigSubscriber** | Lazy-load + cache + fallback for Hivemind configs | `src/config/subscriber.ts` |
| **SchemaKernel** | Zod schemas for all configuration and runtime types | `src/schema-kernel/` |

## Pattern Overview

**Overall:** CQRS (Command Query Responsibility Segregation)

**Key Characteristics:**
- **Command Side:** Tools, hooks, and coordination modules mutate state
- **Query Side:** Read-only tools and status checks query state
- **9-Surface Authority Model:** Clear mutation authority boundaries
- **Dual-Layer State:** In-memory Maps (`state.ts`) + durable JSON (`continuity/index.ts`)
- **Composition Root Pattern:** `plugin.ts` wires all dependencies, contains no business logic

## CQRS Model

**Command Side (Write):**
- **Tools:** `delegate-task`, `session-patch`, `configure-primitive`, `bootstrap-init`
- **Hooks:** `tool.execute.before`, `tool.execute.after`, `chat.message`
- **Coordination:** `DelegationManager.dispatch()`, `DelegationCoordinator.dispatch()`
- **State Mutation:** `TaskStateManager`, `ContinuityStore.recordSessionContinuity()`

**Query Side (Read):**
- **Status Tools:** `delegation-status`, `session-tracker`, `session-hierarchy`
- **Read Operations:** `getSessionContinuity()`, `listSessionContinuity()`, `DelegationManager.getStatus()`
- **Query Hooks:** `event` observers (read-only event processing)

**CQRS Boundaries:**
- Command modules may import from query modules (for status checks)
- Query modules MUST NOT import from command modules (enforced by architecture)
- State mutations only via `TaskStateManager` or `ContinuityStore` write methods

## 9-Surface Authority Model

| Surface | Authority | Module | Mutation Target |
|---------|-----------|--------|-----------------|
| **1. Tool Registration** | Register/unregister tools | `src/plugin.ts` | Plugin tool map |
| **2. Hook Registration** | Register/unregister hooks | `src/plugin.ts` | Plugin hook map |
| **3. Delegation Dispatch** | Create/cancel delegations | `src/coordination/delegation/` | `DelegationManager` |
| **4. Completion Detection** | Monitor session completion | `src/coordination/completion/` | `CompletionDetector` |
| **5. Concurrency Control** | Acquire/release slots | `src/coordination/concurrency/` | `DelegationConcurrencyQueue` |
| **6. Lifecycle Management** | Transition session phases | `src/task-management/lifecycle/` | `HarnessLifecycleManager` |
| **7. Continuity Persistence** | Read/write session state | `src/task-management/continuity/` | `ContinuityStore` |
| **8. Configuration** | Load/cache config | `src/config/` | `ConfigSubscriber` |
| **9. Runtime Policy** | Load/apply runtime policy | `src/shared/runtime-policy.ts` | `RuntimePolicy` |

**Authority Rules:**
- Each surface has a single owning module (no split authority)
- Mutations flow downward (composition root → coordination → task management → shared)
- Query operations may flow upward (shared → coordination → composition root)
- Cross-surface mutations require explicit wiring in composition root

## Layers

**Composition Root:**
- Purpose: Plugin entry point, dependency wiring, tool/hook registration
- Location: `src/plugin.ts`
- Contains: Tool factory calls, hook factory calls, delegation module setup
- Depends on: All other layers
- Used by: OpenCode runtime (plugin loader)

**Coordination Layer:**
- Purpose: Delegation dispatch, completion detection, concurrency control
- Location: `src/coordination/`
- Contains: Delegation modules, completion detector, concurrency queue
- Depends on: Shared layer, Task Management layer
- Used by: Composition root, Features layer

**Task Management Layer:**
- Purpose: Session lifecycle, continuity persistence, journaling, trajectory
- Location: `src/task-management/`
- Contains: Lifecycle manager, continuity store, journal, trajectory
- Depends on: Shared layer, Config layer
- Used by: Composition root, Coordination layer, Features layer

**Features Layer:**
- Purpose: Standalone runtime features (session tracking, background commands, governance)
- Location: `src/features/`
- Contains: Session tracker, PTY manager, governance engine, doc intelligence
- Depends on: Shared layer, Task Management layer
- Used by: Composition root

**Shared Layer:**
- Purpose: Leaf utilities, types, SDK wrappers, runtime policy
- Location: `src/shared/`
- Contains: Types, state, helpers, session API, runtime policy
- Depends on: External integrations only
- Used by: All other layers

**Schema Kernel:**
- Purpose: Zod schema definitions for configuration and runtime types
- Location: `src/schema-kernel/`
- Contains: Schema definitions, validation logic
- Depends on: None (leaf layer)
- Used by: Config layer, Shared layer

## Data Flow

### Primary Request Path

1. User sends prompt → OpenCode runtime → `HarnessControlPlane` (`src/plugin.ts:258`)
2. Tool guard hooks validate budget/concurrency (`src/hooks/guards/tool-guard-hooks.ts`)
3. Session tracker captures metadata (`src/features/session-tracker/index.ts`)
4. Delegation manager dispatches to child session (`src/coordination/delegation/manager.ts:73`)
5. Completion detector monitors dual signals (`src/coordination/completion/detector.ts:68`)
6. Continuity store persists session state (`src/task-management/continuity/index.ts:352`)

### Delegation Dispatch Flow

1. `DelegationManager.dispatch()` → `DelegationCoordinator.dispatch()` (`src/coordination/delegation/manager.ts:73`)
2. Coordinator validates slot limits, queue key (`src/coordination/delegation/coordinator.ts`)
3. Child session created via SDK (`src/coordination/delegation/sdk-child-session-starter.ts`)
4. Dual-signal watcher registered (`src/coordination/completion/detector.ts:92`)
5. Polling loop monitors message stability (`src/coordination/delegation/manager-runtime.ts`)

### Session Lifecycle State Machine

```
┌─────────────┬──────────────────────────────────────────────┐
│ From         │ To                                           │
├─────────────┼──────────────────────────────────────────────┤
│ created     │ queued, dispatching, running, failed         │
│ queued      │ dispatching, running, failed                 │
│ dispatching │ running, completed, failed                   │
│ running     │ completed, failed                            │
│ completed   │ (terminal)                                   │
│ failed      │ (terminal)                                   │
└─────────────┴──────────────────────────────────────────────┘
```

**State Management:**
- **In-Memory:** `TaskStateManager` holds session stats, budget tracking, subagent registry
- **Persistent:** `ContinuityStore` persists to `.hivemind/state/session-continuity.json`
- **Atomic Writes:** Uses temp file + rename pattern for crash safety
- **Deep-Clone-on-Read:** All reads return deep clones to prevent mutation

## Key Abstractions

**Delegation (WaiterModel):**
- Purpose: Asynchronous child session dispatch with dual-signal completion
- Examples: `src/coordination/delegation/manager.ts`, `src/coordination/delegation/coordinator.ts`
- Pattern: Facade pattern (DelegationManager) + Coordinator pattern

**Dual-Signal Completion:**
- Purpose: Requires both native Task completion AND terminal status signal
- Examples: `src/coordination/completion/detector.ts`
- Pattern: Signal aggregation with stability tracking

**Continuity Store:**
- Purpose: Persistent session state with deep-clone semantics
- Examples: `src/task-management/continuity/index.ts`
- Pattern: Singleton store with atomic writes and quarantine on corruption

**Hook Composition:**
- Purpose: Lifecycle hooks for tool execution, session events, guards
- Examples: `src/hooks/lifecycle/`, `src/hooks/guards/`, `src/hooks/transforms/`
- Pattern: Factory functions with dependency injection

## Entry Points

**HarnessControlPlane (Plugin):**
- Location: `src/plugin.ts`
- Triggers: OpenCode plugin loader
- Responsibilities: Wires all modules, registers 23 tools, registers 7 hooks

**Public API (index.ts):**
- Location: `src/index.ts`
- Triggers: External consumers (npm package)
- Responsibilities: Re-exports core types, utilities, and manager classes

**Schema Kernel:**
- Location: `src/schema-kernel/index.ts`
- Triggers: Config loading, validation
- Responsibilities: Exposes schema definitions and validation functions

## Surface Authority Table

| Surface | Owns | Can Mutate | Cannot Mutate |
|---------|------|------------|---------------|
| **Tool Registration** | Tool map in plugin | Tool handlers, tool schemas | Hook handlers, state |
| **Hook Registration** | Hook map in plugin | Hook handlers, event observers | Tool handlers, state |
| **Delegation Dispatch** | Delegation lifecycle | Delegation records, child sessions | Completion detection, config |
| **Completion Detection** | Completion signals | Watcher callbacks, cached results | Delegation records, state |
| **Concurrency Control** | Slot allocation | Queue state, acquire/release | Delegation dispatch, lifecycle |
| **Lifecycle Management** | Session phases | Lifecycle state, transitions | Continuity store, config |
| **Continuity Persistence** | Session records | JSON file, store cache | In-memory state, lifecycle |
| **Configuration** | Config loading | Cached config, defaults | Runtime policy, state |
| **Runtime Policy** | Policy loading | Policy object, overrides | Config, state |

## Circular Dependency Detection

**Import Analysis Results:**
- No circular dependencies detected in `src/` modules
- Import chains follow layered architecture (composition root → coordination → task management → shared)
- All imports use `.js` extensions (ESM-compatible)

**Potential Risk Areas:**
- `src/shared/types.ts` re-exports from `src/coordination/delegation/types.ts` (intentional for backward compatibility)
- `src/shared/types.ts` re-exports from `src/config/workflow/workflow-types.ts` (intentional for backward compatibility)

**Enforcement:**
- TypeScript compiler detects circular imports at build time
- `tsconfig.json` has `noImplicitReturns: true` and strict mode enabled
- Module size limit (500 LOC) prevents deep dependency chains

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; async operations via Promises
- **Global state:** `taskState` singleton (`src/shared/state.ts:188`) holds all in-process state
- **Circular imports:** None detected in import analysis
- **Module size:** Max 500 LOC per module; largest file is `plugin.ts` (554 LOC) — borderline acceptable
- **CQRS boundaries:** Command side (tools/hooks) mutates state; query side (status tools) reads only
- **9-Surface Authority:** Clear mutation boundaries defined in architecture docs

## Anti-Patterns

### Large Composition Root

**What happens:** `plugin.ts` has grown to 554 LOC with many imports and setup logic
**Why it's wrong:** Makes the composition root hard to maintain and test
**Do this instead:** Extract delegation setup to dedicated module (partially done with `setupDelegationModules`)

### Dual State Stores

**What happens:** In-memory `TaskStateManager` and persistent `ContinuityStore` must stay synchronized
**Why it's wrong:** Risk of state drift between stores
**Do this instead:** Use `hydrateDelegationState` to sync on startup, maintain CQRS boundaries

### Synchronous File I/O in Store

**What happens:** `ContinuityStore` uses synchronous `readFileSync`/`writeFileSync`
**Why it's wrong:** Blocks event loop during persistence
**Do this instead:** Use async I/O with proper queuing (future improvement)

## Error Handling

**Strategy:** Best-effort with structured error codes

**Patterns:**
- `[Harness]` prefix on all thrown errors for identification
- Structured `DelegationError` with machine-readable codes (`src/coordination/delegation/types.ts:227`)
- Best-effort operations (notification replay, session abort) silently ignore failures
- Corrupt continuity files quarantined with timestamp suffix

## Cross-Cutting Concerns

**Logging:** OpenCode SDK `client.app.log()` with service tags
**Validation:** Zod schemas for config, runtime types, tool parameters
**Authentication:** Not applicable (local runtime)
**Security:** Path scope validation (`src/shared/security/path-safety.ts`), redaction of sensitive fields (`src/shared/security/redaction.ts`)

---

*Architecture analysis: 2026-05-28*
