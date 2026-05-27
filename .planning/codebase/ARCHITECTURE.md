<!-- refreshed: 2026-05-26 -->
# Architecture

**Analysis Date:** 2026-05-26

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Hivemind Plugin (npm package)                     │
├──────────────────┬──────────────────┬──────────────────┬────────────────┤
│   Tools          │   Hooks          │   Task-Management │   Coordination │
│   `src/tools/`   │   `src/hooks/`   │   `src/task-mana- │   `src/coord-  │
│   - delegation   │   - lifecycle    │   gement/`        │   ination/`   │
│   - prompt       │   - guards       │   - journal      │   - delegation │
│   - session      │   - observers    │   - continuity   │   - spawner   │
│   - hivemind     │   - transforms   │   - trajectory   │   - concurrency│
│                                                           │              │
└────────┬─────────┴────────┬─────────┴──────────┬────────┴───────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Features Layer                                    │
│         `src/features/` — Standalone runtime capabilities               │
│   - session-tracker, auto-loop, ralph-loop, doc-intelligence            │
│   - background-command, governance-engine, prompt-packet                │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Shared Layer                                      │
│         `src/shared/` — Leaf utilities and contracts                    │
│   - session-api, helpers, state, types, security, runtime-policy        │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Configuration Layer                               │
│         `src/config/` — Config subscriber and workflow                  │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Schema Kernel (Zod validation)                        │
│         `src/schema-kernel/` — Type-safe schemas                        │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Internal State (file-based)                           │
│         `.hivemind/` — Journals, lineage, state, artifacts               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Architecture Pattern

**Pattern:** Plugin Architecture with CQRS-inspired Separation of Concerns

**Why this pattern was chosen:**
- Hivemind is designed as an npm plugin for OpenCode, not a standalone application
- The plugin architecture allows zero business logic in the plugin layer itself
- CQRS-inspired separation enables independent evolution of tools (write) and hooks (read)
- File-based persistence supports durability and recovery across harness restarts
- Layered architecture provides clear boundaries for testing and maintenance

## Layers

### Core Layer

**Purpose:** Composition root and plugin registration

**Location:** `src/plugin.ts`, `src/index.ts`

**Contains:**
- Plugin initialization and lifecycle management
- Tool and hook registration
- Shared dependency injection
- Runtime policy loading

**Key Files:**
- `src/plugin.ts` — Main composition root, instantiates shared dependencies, wires hook factories, registers tools
- `src/index.ts` — Public API re-exports

**Depends on:**
- `@opencode-ai/plugin` SDK
- All tool modules in `src/tools/`
- All hook factories in `src/hooks/`

**Used by:** OpenCode runtime plugin loader

### Tools Layer

**Purpose:** Write-side operations and agent dispatch

**Location:** `src/tools/`

**Structure:**
```
src/tools/
├── delegation/          — Delegation tools (delegate-task, delegation-status)
├── config/              — Configuration tools (configure-primitive, bootstrap-init/recover)
├── session/             — Session tools (session-patch, session-journal-export)
├── hivemind/            — Hivemind-specific tools (hivemind-doc, trajectory, pressure)
├── prompt/              — Prompt tools (prompt-skim, prompt-analyze)
└── hivemind-run-background-command/ — Background task execution
```

**Key Files:**
- `src/tools/delegation/delegate-task.ts` — Delegation dispatch tool
- `src/tools/delegation/delegation-status.ts` — Status polling tool
- `src/tools/config/bootstrap-init.ts` — Project initialization
- `src/tools/config/bootstrap-recover.ts` — Symlink repair

**Depends on:**
- Delegation coordination modules
- SDK client via `src/shared/session-api.ts`

**Used by:** User commands via OpenCode CLI

### Hooks Layer

**Purpose:** Read-side lifecycle events and guards

**Location:** `src/hooks/`

**Structure:**
```
src/hooks/
├── lifecycle/           — Core lifecycle hooks
│   ├── core-hooks.ts    — Core lifecycle management
│   └── session-hooks.ts — Session-specific lifecycle
├── guards/              — Tool execution guards
│   └── tool-guard-hooks.ts
├── observers/           — Event observers
│   └── event-observers.ts
└── transforms/          — Tool input/output transforms
    ├── tool-before-guard.ts
    ├── tool-after-composer.ts
    └── chat-message-capture.ts
```

**Key Files:**
- `src/hooks/lifecycle/core-hooks.ts` — Core lifecycle management
- `src/hooks/guards/tool-guard-hooks.ts` — Tool execution guards
- `src/hooks/transforms/tool-before-guard.ts` — Pre-execution validation

**Depends on:**
- Session state via `src/shared/state.ts`
- Lifecycle manager from `src/task-management/lifecycle/index.ts`

**Used by:** OpenCode tool execution pipeline

### Task Management Layer

**Purpose:** Session continuity and state persistence

**Location:** `src/task-management/`

**Structure:**
```
src/task-management/
├── continuity/          — Session persistence (session-continuity.json)
├── journal/             — Append-only event timeline
├── trajectory/          — Execution lineage tracking
└── lifecycle/           — State machine for task status
```

**Key Files:**
- `src/task-management/continuity/index.ts` — Session I/O operations
- `src/task-management/journal/index.ts` — Event append operations
- `src/task-management/lifecycle/index.ts` — Lifecycle manager

**Depends on:**
- File system for `.hivemind/state/` persistence
- Task status types from `src/shared/task-status.ts`

**Used by:** All delegation and task management operations

### Coordination Layer

**Purpose:** Delegation orchestration and concurrency control

**Location:** `src/coordination/`

**Structure:**
```
src/coordination/
├── delegation/          — DelegationManager (WaiterModel)
│   ├── manager.ts      — WaiterModel dispatch
│   ├── coordinator.ts  — Delegation coordination
│   ├── dispatcher.ts   — Task dispatch
│   ├── lifecycle.ts    — Delegation lifecycle
│   └── monitor.ts      — Status monitoring
├── completion/          — Dual-signal completion detection
├── concurrency/         — Task queue management
├── command-delegation/  — Slash command delegation
└── sdk-delegation/      — SDK child session spawning
```

**Key Files:**
- `src/coordination/delegation/manager.ts` — DelegationManager class with WaiterModel dispatch and dual-signal completion
- `src/coordination/completion/detector.ts` — Completion detection logic
- `src/coordination/concurrency/queue.ts` — Task queue implementation

**Depends on:**
- Delegation persistence from `src/task-management/continuity/delegation-persistence.ts`
- Agent resolver from `src/coordination/delegation/agent-resolver.js`

**Used by:** All tool dispatch operations

### Features Layer

**Purpose:** Standalone runtime capabilities

**Location:** `src/features/`

**Structure:**
```
src/features/
├── session-tracker/     — Session event tracking and recovery
│   ├── capture/         — Event capture
│   ├── recovery/        — Recovery operations
│   ├── persistence/     — File persistence
│   └── hooks/           — Session hooks
├── auto-loop/           — Automatic task loop
├── ralph-loop/          — Ralph loop with escalation
├── background-command/  — Background PTY command execution
│   └── pty/             — PTY runtime (bun-pty or fallback)
├── doc-intelligence/    — Document querying
├── governance-engine/   — Governance session creation
├── prompt-packet/       — Prompt packet handling
└── runtime-pressure/    — Runtime pressure monitoring
```

**Key Files:**
- `src/features/session-tracker/index.ts` — SessionTracker class
- `src/features/auto-loop/auto-loop.ts` — Auto-loop implementation
- `src/features/background-command/pty/pty-runtime.ts` — PTY runtime

**Depends on:**
- Hooks and coordination layers
- Configuration subscriber

**Used by:** Auto-running background processes

### Shared Layer

**Purpose:** Leaf utilities and type contracts

**Location:** `src/shared/`

**Structure:**
```
src/shared/
├── session-api.ts      — OpenCode SDK client wrapper
├── helpers.ts          — Utility functions (asString, getNestedValue)
├── state.ts            — In-memory state management
├── types.ts            — Shared TypeScript types
├── security/           — Security utilities
├── runtime-policy.ts   — Runtime policy loading
└── plugin-tool-output-summary.ts — Tool output summarization
```

**Key Files:**
- `src/shared/session-api.ts` — SDK client for `tool()`, `hook()` operations
- `src/shared/helpers.ts` — Utility functions
- `src/shared/state.ts` — In-memory state Maps (dual-layer with persistence)
- `src/shared/types.ts` — Shared type definitions

**Depends on:**
- `@opencode-ai/plugin` SDK types

**Used by:** All other layers

## Data Flow

### Plugin Initialization Flow

1. **Entry:** OpenCode plugin loader imports `src/plugin.ts`
2. **Lifecycle Manager:** `createHarnessLifecycleManager()` creates lifecycle manager
3. **Shared Dependencies:** Load `session-api`, `state`, `runtime-policy`
4. **Hook Factories:** Create hook factories (`core-hooks`, `session-hooks`, etc.)
5. **Tool Creators:** Instantiate tool creator functions
6. **Registration:** Register all tools and hooks with OpenCode runtime
7. **Background Loops:** Start auto-loop and ralph-loop via `runAutoLoop()` and `runRalphLoop()`

**Key Path:** `src/plugin.ts` lines 30-180

### Delegation Flow

1. **Dispatch:** User calls `/gsd` command or `delegate-task` tool
2. **Tool Creation:** `src/tools/delegation/delegate-task.ts` creates delegation packet
3. **Agent Resolution:** `src/coordination/delegation/agent-resolver.js` selects target agent
4. **WaiterModel:** `src/coordination/delegation/manager.ts` dispatches to WaiterModel
5. **State Persistence:** `src/task-management/continuity/delegation-persistence.ts` persists delegation record
6. **Completion Detection:** `src/coordination/completion/detector.ts` monitors for completion
7. **Status Update:** Updates delegation status in `.hivemind/state/delegations.json`
8. **Result Return:** Returns delegation ID to caller

**Key Path:** `src/tools/delegation/delegate-task.ts` → `src/coordination/delegation/manager.ts`

### Session Continuity Flow

1. **Session Entry:** New delegation created, session ID recorded
2. **Journal Append:** `src/task-management/journal/index.ts` appends to journal
3. **Continuity Update:** `src/task-management/continuity/index.ts` updates `session-continuity.json`
4. **Lineage Tracking:** `src/task-management/trajectory/index.ts` tracks lineage
5. **Recovery:** On restart, read from `.hivemind/state/session-continuity.json`
6. **Resume:** Rehydrate state from journal and continuity files

**Key Path:** `src/task-management/continuity/index.ts` → `.hivemind/state/session-continuity.json`

## Key Abstractions

### Plugin Interface

**Purpose:** Defines the contract between Hivemind and OpenCode runtime

**Location:** `src/shared/session-api.ts`

**Examples:**
```typescript
// Tool registration
tool({
  name: 'delegate-task',
  description: 'Delegate work to a specialist agent',
  async execute(context) { /* ... */ }
})

// Hook registration
hook('lifecycle', 'tool-before', async (context) => { /* ... */ })
```

**Pattern:** OpenCode SDK tool/hook definitions with Zod schemas

### Delegation Packet

**Purpose:** Encapsulates delegation metadata and state

**Location:** `src/coordination/delegation/types.ts`

**Examples:**
```typescript
interface Delegation {
  id: string;                    // Delegation ID
  sessionId: string;             // Parent session ID
  status: DelegationStatus;      // dispatched, running, completed, error, timeout
  agent: string;                 // Target agent name
  prompt: string;                // Task prompt
  context: unknown;              // Optional context packet
  createdAt: string;             // ISO timestamp
  completedAt?: string;          // Completion timestamp
}
```

**Pattern:** Stateful object with lifecycle tracking

### WaiterModel

**Purpose:** Asynchronous delegation dispatch with dual-signal completion

**Location:** `src/coordination/delegation/manager.ts`

**Examples:**
```typescript
class DelegationManager {
  async dispatch(packet: DelegationPacket): Promise<DelegationId> {
    // 1. Create WaiterModel (background task)
    // 2. Persist to delegations.json
    // 3. Return delegation ID immediately
    // 4. Completion detection happens asynchronously
  }
}
```

**Pattern:** Fire-and-forget with status polling

### Session Continuity

**Purpose:** Durable session state across harness restarts

**Location:** `src/task-management/continuity/index.ts`

**Examples:**
```typescript
interface SessionContinuity {
  sessionId: string;
  status: string;
  lastActivity: string;
  journal: JournalEntry[];
  lineage: LineageEntry[];
}
```

**Pattern:** Deep-clone-on-read JSON file persistence

### Runtime Policy

**Purpose:** Enforce behavioral constraints on agents

**Location:** `src/shared/runtime-policy.ts`

**Examples:**
```typescript
interface RuntimePolicy {
  guardrailLevel: 'strict' | 'moderate' | 'relaxed';
  delegationMode: 'waiter' | 'synchronous';
  toolAccessPattern: 'restricted' | 'full';
  skillFilter: 'curated' | 'all';
}
```

**Pattern:** Configuration-driven behavioral constraints

## Entry Points

### Plugin Composition Root

**Location:** `src/plugin.ts`

**Triggers:** OpenCode plugin loader on startup

**Responsibilities:**
- Initialize shared dependencies
- Register all tools and hooks
- Start background loops (auto-loop, ralph-loop)
- Load runtime policy

**Key Code:**
```typescript
// src/plugin.ts lines 180-250
const lifecycle = createHarnessLifecycleManager()
const hooks = createCoreHooks(), createSessionHooks(), ...
const tools = createDelegateTaskTool(), createDelegationStatusTool(), ...
await opencode.registerTools(tools)
await opencode.registerHooks(hooks)
runAutoLoop()
runRalphLoop()
```

### CLI Entry Point

**Location:** `bin/hivemind.cjs`

**Triggers:** User runs `npx hivemind`

**Responsibilities:**
- Parse CLI arguments
- Initialize OpenCode client
- Dispatch to appropriate tool

### Tool Entry Points

**Location:** `src/tools/**/*.ts`

**Triggers:** User invokes via OpenCode CLI

**Examples:**
- `src/tools/delegation/delegate-task.ts` — Delegate to agent
- `src/tools/config/bootstrap-init.ts` — Initialize project
- `src/tools/hivemind/session-tracker.ts` — Query session tracker

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenCode Runtime                          │
│  (Plugin Loader, Agent Framework, CLI)                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Hivemind Plugin                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Tools      │  │    Hooks     │  │ Task-Management│         │
│  │  (Write-Side)│  │  (Read-Side) │  │   (State)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                           │                                     │
│                           ▼                                     │
│                  ┌──────────────────┐                           │
│                  │ Coordination     │                           │
│                  │ (Delegation,     │                           │
│                  │  Concurrency)    │                           │
│                  └────────┬─────────┘                           │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         ▼                 ▼                 ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Features    │  │   Shared     │  │   Config     │         │
│  │  (Runtime)   │  │   (Utilities)│  │  (Workflow)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    File-Based Persistence                        │
│  .hivemind/state/   .hivemind/journal/   .hivemind/lineage/    │
└─────────────────────────────────────────────────────────────────┘
```

## Architectural Constraints

- **Threading:** Single-threaded event loop via Node.js; background tasks run as separate processes via WaiterModel
- **Global state:** In-memory state Maps (`src/shared/state.ts`) synchronized with file persistence; session ID is the primary singleton identifier
- **Circular imports:** None detected; clear layer boundaries prevent circular dependencies
- **Module size:** Max 500 LOC per module enforced; plugin.ts is ~29KB (largest module)
- **Type safety:** `strict: true` in tsconfig; `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- **No `any` types:** Enforced for new code; legacy code may have `any` with TODOs

## Anti-Patterns

### Static `.md` Files as Agent Definitions

**What happens:** AGENTS.md files in `.opencode/` are used as agent definition templates

**Why it's wrong:** These are reference documents, not runtime definitions; agents are actual TypeScript code in `src/`

**Do this instead:** Use `src/plugin.ts` tool/hook registrations for actual agent definitions; AGENTS.md serves as documentation only

### Hardcoded Paths in Scripts

**What happens:** Scripts use hardcoded paths outside `bin/` CLI substrate

**Why it's wrong:** Breaks portability and violates plugin architecture principles

**Do this instead:** Use `src/shared/helpers.ts` for path utilities; all CLI logic in `bin/` directory

## Error Handling

**Strategy:** Structured error throwing with `[Harness]` prefix

**Patterns:**
- Custom error types for specific failure modes
- Error context includes session ID and delegation ID when available
- Graceful degradation for optional dependencies (e.g., bun-pty fallback)

**Key Code:**
```typescript
// src/shared/helpers.ts
throw new HarnessError('Delegation failed', {
  sessionId,
  delegationId,
  cause: error
})
```

## Cross-Cutting Concerns

**Logging:** Console-based via `console.log()`; no external logging service

**Validation:** Zod schemas in `src/schema-kernel/` for all config inputs

**Authentication:** None; runs within OpenCode environment with inherited permissions

**Security:** Plugin-based execution; file-based persistence; no remote auth

---

*Architecture analysis: 2026-05-26*
