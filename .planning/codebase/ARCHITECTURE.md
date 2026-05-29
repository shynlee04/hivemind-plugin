# Architecture

**Analysis Date:** 2026-05-28

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
│   - runtime-pressure, sdk-supervisor, agent-work-contracts              │
│   - bootstrap (primitive-registry, control-plane)                       │
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

### Source vs Deploy Architecture

This diagram shows the `src/` TypeScript npm package layer. The shipped OpenCode primitives (agents, commands, skills, workflows) follow a **source-of-truth → deploy** model:

- **Source:** `assets/` — author all primitives here
- **Authoring Lab:** `.hivefiver-meta-builder/` — meta-authoring environment for primitives before reflection to `assets/`
- **Deploy:** `.opencode/` — synced copy via `scripts/sync-assets.js`. NEVER develop directly in `.opencode/`
- **Exception:** `gsd-*` primitives are developer tooling (NOT shipped) and may live in `.opencode/get-shit-done/`

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
├── session/             — Session tools (session-patch, session-journal-export, session-tracker)
├── hivemind/            — Hivemind-specific tools (hivemind-doc, trajectory, pressure, command-engine)
├── prompt/              — Prompt tools (prompt-skim, prompt-analyze)
└── hivemind-run-background-command/ — Background task execution
```

**Key Files:**
- `src/tools/delegation/delegate-task.ts` — Delegation dispatch tool
- `src/tools/delegation/delegation-status.ts` — Status polling tool
- `src/tools/config/bootstrap-init.ts` — Project initialization
- `src/tools/config/bootstrap-recover.ts` — Symlink repair
- `src/tools/session/execute-slash-command.ts` — Slash command execution

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
├── composition/         — CQRS boundary classification
│   └── cqrs-boundary.ts
├── lifecycle/           — Core lifecycle hooks
│   ├── core-hooks.ts    — Core lifecycle management
│   └── session-hooks.ts — Session-specific lifecycle
├── guards/              — Tool execution guards
│   ├── tool-guard-hooks.ts
│   └── governance-block.ts
├── observers/           — Event observers
│   ├── event-observers.ts
│   ├── session-entry-consumer.ts
│   ├── session-main-consumer.ts
│   ├── session-tracker-consumer.ts
│   └── delegation-consumer.ts
└── transforms/          — Tool input/output transforms
    ├── tool-before-guard.ts
    ├── tool-after-composer.ts
    ├── tool-after-workflow.ts
    └── chat-message-capture.ts
```

**Key Files:**
- `src/hooks/lifecycle/core-hooks.ts` — Core lifecycle management
- `src/hooks/guards/tool-guard-hooks.ts` — Tool execution guards
- `src/hooks/transforms/tool-before-guard.ts` — Pre-execution validation
- `src/hooks/composition/cqrs-boundary.ts` — CQRS boundary classification

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
│   ├── index.ts         — Store I/O (CRUD operations)
│   ├── store-cache.ts   — In-memory cache
│   └── delegation-persistence.ts — Delegation record I/O
├── journal/             — Append-only event timeline
│   ├── index.ts         — Journal entry operations
│   ├── query.ts         — Journal query operations
│   ├── replay.ts        — Journal replay operations
│   └── execution-lineage.ts — Lineage tracking
├── trajectory/          — Execution lineage tracking
│   ├── index.ts         — Trajectory operations
│   ├── ledger.ts        — Ledger operations
│   ├── store-operations.ts — Store operations
│   └── types.ts         — Trajectory types
└── lifecycle/           — State machine for task status
    └── index.ts         — Lifecycle manager
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
│   ├── monitor.ts      — Status monitoring
│   ├── agent-resolver.ts — Agent resolution
│   ├── slot-manager.ts — Concurrency slot management
│   ├── state-machine.ts — State machine
│   ├── completion-detector.ts — Completion detection
│   ├── notification-router.ts — Notification routing
│   ├── periodic-notifier.ts — Periodic notifications
│   ├── retry-handler.ts — Retry handling
│   ├── resume-resolver.ts — Resume resolution
│   ├── escalation-timer.ts — Escalation timing
│   └── survival-kit.ts — Survival kit
├── completion/          — Dual-signal completion detection
│   └── detector.ts
├── concurrency/         — Task queue management
│   └── queue.ts
├── command-delegation/  — Slash command delegation
├── sdk-delegation/      — SDK child session spawning
│   └── handler.ts
└── spawner/             — Session spawning
    ├── auto-loop.ts     — Auto-loop implementation
    ├── ralph-loop.ts    — Ralph loop with escalation
    ├── session-creator.ts — Session creation
    ├── spawn-request-builder.ts — Spawn request building
    ├── agent-primitive-policy.ts — Agent primitive policy
    └── parent-directory.ts — Parent directory resolution
```

**Key Files:**
- `src/coordination/delegation/manager.ts` — DelegationManager class with WaiterModel dispatch and dual-signal completion
- `src/coordination/completion/detector.ts` — Completion detection logic
- `src/coordination/concurrency/queue.ts` — Task queue implementation

**Depends on:**
- Delegation persistence from `src/task-management/continuity/delegation-persistence.ts`
- Agent resolver from `src/coordination/delegation/agent-resolver.ts`

**Used by:** All tool dispatch operations

### Features Layer

**Purpose:** Standalone runtime capabilities

**Location:** `src/features/`

**Structure:**
```
src/features/
├── session-tracker/     — Session event tracking and recovery
│   ├── index.ts         — SessionTracker class
│   ├── capture/         — Event capture
│   ├── recovery/        — Recovery operations
│   ├── persistence/     — File persistence
│   ├── hooks/           — Session hooks
│   └── tool-delegation.ts — Tool delegation handling
├── auto-loop/           — Automatic task loop
├── ralph-loop/          — Ralph loop with escalation
├── background-command/  — Background PTY command execution
│   └── pty/             — PTY runtime (bun-pty or fallback)
├── doc-intelligence/    — Document querying
├── governance-engine/   — Governance session creation
├── prompt-packet/       — Prompt packet handling
├── runtime-pressure/    — Runtime pressure monitoring
│   ├── index.ts         — Pressure detection
│   ├── model.ts         — Pressure model
│   ├── authority-matrix.ts — Authority matrix
│   └── control-plane.ts — Control plane
├── sdk-supervisor/      — SDK wrapper supervision
│   └── index.ts         — SdkSupervisor class
├── agent-work-contracts/ — Agent work contracts
├── bootstrap/           — Primitive registry and control plane
│   ├── primitive-registry.ts — Primitive registry
│   ├── control-plane/   — Control plane
│   ├── cross-primitive-validator.ts — Cross-primitive validation
│   ├── framework-detector.ts — Framework detection
│   ├── primitive-loader.ts — Primitive loading
│   └── runtime-validator.ts — Runtime validation
└── features/            — Feature module index
```

**Key Files:**
- `src/features/session-tracker/index.ts` — SessionTracker class
- `src/features/auto-loop/auto-loop.ts` — Auto-loop implementation
- `src/features/background-command/pty/pty-runtime.ts` — PTY runtime
- `src/features/runtime-pressure/index.ts` — Runtime pressure detection
- `src/features/sdk-supervisor/index.ts` — SDK supervisor

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
├── runtime.ts          — Runtime utilities
├── runtime-policy.ts   — Runtime policy loading
├── workspace-runtime-policy.ts — Workspace runtime policy
├── task-status.ts      — Task status definitions
├── tool-helpers.ts     — Tool helper functions
├── tool-response.ts    — Tool response utilities
├── plugin-tool-output-summary.ts — Tool output summarization
├── session-naming.ts   — Session naming utilities
├── app-api.ts          — App API utilities
├── errors/             — Error types
└── security/           — Security utilities
    ├── path-scope.ts   — Path scope validation
    └── redaction.ts    — Data redaction
```

**Key Files:**
- `src/shared/session-api.ts` — SDK client for `tool()`, `hook()` operations
- `src/shared/helpers.ts` — Utility functions
- `src/shared/state.ts` — In-memory state Maps (dual-layer with persistence)
- `src/shared/types.ts` — Shared type definitions
- `src/shared/security/path-scope.ts` — Path scope validation
- `src/shared/security/redaction.ts` — Data redaction

**Depends on:**
- `@opencode-ai/plugin` SDK types

**Used by:** All other layers

### Routing Layer

**Purpose:** Session entry classification and behavioral profile resolution

**Location:** `src/routing/`

**Structure:**
```
src/routing/
├── behavioral-profile/  — Behavioral profile resolution
│   ├── resolve-behavioral-profile.ts — Profile resolution
│   ├── profiles.ts      — Profile definitions
│   └── types.ts         — Profile types
├── command-engine/      — Command engine
│   ├── index.ts         — Command engine operations
│   └── types.ts         — Command engine types
└── session-entry/       — Session entry classification
    ├── index.ts         — Session entry operations
    ├── intake-gate.ts   — Intake gate
    ├── purpose-classifier.ts — Purpose classification
    ├── profile-resolver.ts — Profile resolution
    └── language-resolution.ts — Language resolution
```

**Key Files:**
- `src/routing/behavioral-profile/resolve-behavioral-profile.ts` — Behavioral profile resolution
- `src/routing/session-entry/purpose-classifier.ts` — Session purpose classification
- `src/routing/command-engine/index.ts` — Command engine operations

**Depends on:**
- Configuration subscriber
- Schema kernel

**Used by:** Session entry and behavioral profile resolution

### Configuration Layer

**Purpose:** Config subscriber and workflow

**Location:** `src/config/`

**Structure:**
```
src/config/
├── compiler.ts         — Config compiler
├── subscriber.ts       — Config subscriber
└── workflow/           — Config workflow
    └── workflow-types.ts — Workflow types
```

**Key Files:**
- `src/config/subscriber.ts` — Config subscriber
- `src/config/compiler.ts` — Config compiler

**Depends on:**
- Schema kernel
- File system

**Used by:** Configuration management

### Schema Kernel

**Purpose:** Zod validation schemas

**Location:** `src/schema-kernel/`

**Structure:**
```
src/schema-kernel/
├── index.ts                    — Schema kernel exports
├── hivemind-configs.schema.ts  — Hivemind configs schema
├── tool.schema.ts              — Tool schema
├── agent-frontmatter.schema.ts — Agent frontmatter schema
├── agent-work-contract.schema.ts — Agent work contract schema
├── bootstrap.schema.ts         — Bootstrap schema
├── command-engine.schema.ts    — Command engine schema
├── command-frontmatter.schema.ts — Command frontmatter schema
├── commands.schema.ts          — Commands schema
├── config-precedence.schema.ts — Config precedence schema
├── doc-intelligence.schema.ts  — Doc intelligence schema
├── generate-config-json-schema.ts — Config JSON schema generation
├── mcp-server.schema.ts        — MCP server schema
├── prompt-enhance.schema.ts    — Prompt enhance schema
├── runtime-pressure.schema.ts  — Runtime pressure schema
├── sdk-supervisor.schema.ts    — SDK supervisor schema
├── session-tracker.schema.ts   — Session tracker schema
├── session-view.schema.ts      — Session view schema
├── skill-metadata.schema.ts    — Skill metadata schema
└── trajectory.schema.ts        — Trajectory schema
```

**Key Files:**
- `src/schema-kernel/index.ts` — Schema kernel exports
- `src/schema-kernel/hivemind-configs.schema.ts` — Hivemind configs schema
- `src/schema-kernel/tool.schema.ts` — Tool schema

**Depends on:**
- Zod library

**Used by:** All layers that need schema validation

### CLI Layer

**Purpose:** Command-line interface

**Location:** `src/cli/`

**Structure:**
```
src/cli/
├── index.ts            — CLI entry point
├── router.ts           — CLI router
├── discovery.ts        — CLI discovery
├── renderer.ts         — CLI renderer
├── commands/           — CLI commands
│   ├── init.ts         — Init command
│   ├── doctor.ts       — Doctor command
│   ├── recover.ts      — Recover command
│   ├── version.ts      — Version command
│   └── help.ts         — Help command
└── ui/                 — CLI UI
    └── prompts.ts      — CLI prompts
```

**Key Files:**
- `src/cli/index.ts` — CLI entry point
- `src/cli/router.ts` — CLI router

**Depends on:**
- Shared utilities
- Configuration subscriber

**Used by:** CLI operations

## Data Flow

### Plugin Initialization Flow

1. **Entry:** OpenCode plugin loader imports `src/plugin.ts`
2. **Config Loading:** Load runtime policy and hivemind configs
3. **PTY Manager:** Create PTY manager if supported
4. **Session Tracker:** Create and initialize session tracker
5. **Delegation Modules:** Wire delegation modules (coordinator, manager, detector, lifecycle, etc.)
6. **Lifecycle Manager:** Create harness lifecycle manager
7. **Event Observers:** Create event observers (delegation, session entry, session main, session tracker)
8. **Hook Factories:** Create hook factories (core-hooks, session-hooks, tool-guard-hooks, etc.)
9. **Tool Creators:** Instantiate all tool creator functions
10. **Registration:** Register all tools and hooks with OpenCode runtime
11. **Background Recovery:** Recover pending delegations and replay pending notifications

**Key Path:** `src/plugin.ts` lines 258-554

### Delegation Flow

1. **Dispatch:** User calls `delegate-task` tool
2. **Tool Creation:** `src/tools/delegation/delegate-task.ts` creates delegation packet
3. **Agent Resolution:** `src/coordination/delegation/agent-resolver.ts` selects target agent
4. **Slot Acquisition:** `src/coordination/delegation/slot-manager.ts` acquires concurrency slot
5. **Dispatch:** `src/coordination/delegation/dispatcher.ts` dispatches to child session
6. **State Persistence:** `src/task-management/continuity/delegation-persistence.ts` persists delegation record
7. **Monitoring:** `src/coordination/delegation/monitor.ts` monitors execution
8. **Completion Detection:** `src/coordination/completion/detector.ts` detects completion
9. **Status Update:** Updates delegation status in `.hivemind/state/delegations.json`
10. **Result Return:** Returns delegation ID to caller

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
  parentSessionId: string;       // Parent session ID
  childSessionId: string;        // Child session ID
  agent: string;                 // Target agent name
  prompt: string;                // Task prompt
  status: DelegationStatus;      // dispatched, running, completed, error, timeout
  executionMode: "sdk" | "pty" | "headless";
  queueKey: string;              // Queue key for concurrency
  nestingDepth: number;          // Nesting depth
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
interface SessionContinuityRecord {
  sessionID: string;
  promptParams: SessionPromptParams;
  toolProfile?: SessionToolProfile;
  metadata: SessionContinuityMetadata;
}
```

**Pattern:** Deep-clone-on-read JSON file persistence

### Runtime Policy

**Purpose:** Enforce behavioral constraints on agents

**Location:** `src/shared/runtime-policy.ts`

**Examples:**
```typescript
interface RuntimePolicy {
  concurrency: ConcurrencyPolicy;
  budget: BudgetPolicy;
  trustedRuntime: TrustedRuntimePolicy;
  maxDelegationDepth?: number;
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
- Initialize session tracker
- Wire delegation modules

**Key Code:**
```typescript
// src/plugin.ts lines 258-554
export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  const runtimePolicy = loadRuntimePolicy(...)
  const hivemindConfig = getConfig(...)
  const ptyManager = await createPtyManagerIfSupported()
  const sessionTracker = new SessionTracker(...)
  const delegationModules = setupDelegationModules(...)
  const lifecycleManager = createHarnessLifecycleManager(...)
  // ... register tools and hooks
}
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
- `src/tools/session/session-tracker.ts` — Query session tracker

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
- **Module size:** Max 500 LOC per module enforced; plugin.ts is ~554 LOC (largest module)
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
throw new Error(`[Harness] Delegation failed for session ${sessionId}`)
```

## Cross-Cutting Concerns

**Logging:** Structured logging via `client.app.log()` with service/level/message structure

**Validation:** Zod schemas in `src/schema-kernel/` for all config inputs

**Authentication:** None; runs within OpenCode environment with inherited permissions

**Security:** Plugin-based execution; file-based persistence; no remote auth; path scope validation and data redaction in `src/shared/security/`

---

*Architecture analysis: 2026-05-28*
