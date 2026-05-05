<!-- generated-by: gsd-doc-writer -->

# Architecture

## System Overview

`opencode-harness` is a **runtime composition engine** for the OpenCode AI coding platform — delivered as an npm package. It is a TypeScript plugin that wires custom tools (write-side, CQRS command) and event hooks (read-side, CQRS query) into OpenCode's plugin system to provide delegated session orchestration, durable continuity persistence, concurrency control, dual-signal completion detection, and runtime guardrails.

The system has two halves that must never be confused:

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side mutations), Hooks (read-side event observers), Plugin (thin composition root), Shared utilities | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions — instruction surfaces that teach agents how to use the harness | `.opencode/` |
| **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state, vector/graph memory | `.hivemind/` |

The plugin (`src/plugin.ts`) is the composition root — a thin async factory function (~165 LOC) that instantiates dependencies, wires hook factories, and registers 14 custom tools. All business logic lives in the individual hook factory modules and tool implementations. Zero business logic lives in the plugin layer itself — it only assembles.

The architectural style is **event-driven CQRS**: tools mutate state (command side), hooks observe events (query side), and all cross-cutting concerns (completion detection, lifecycle transitions, runtime policy enforcement) flow through the lifecycle manager's event routing.

## Component Diagram

```mermaid
graph TD
    OC[OpenCode Runtime]
    PLUGIN[plugin.ts<br/>Composition Root]
    HOOKS[Hook Factories]
    TOOLS[Tool Implementations]
    LM[lifecycle-manager.ts<br/>Session Lifecycle State Machine]
    DM[delegation-manager.ts<br/>Delegation Orchestrator]
    CD[completion-detector.ts<br/>Dual-Signal Completion]
    CQ[concurrency.ts<br/>Keyed Semaphore]
    CT[continuity.ts<br/>Durable JSON Persistence]
    SA[session-api.ts<br/>Typed SDK Wrappers]
    ST[state.ts<br/>In-Memory Maps]
    TY[types.ts<br/>Shared Types — Leaf]
    SP[spawner/<br/>Session Creation]

    OC -->|loads plugin| PLUGIN
    PLUGIN -->|wires| HOOKS
    PLUGIN -->|registers| TOOLS
    PLUGIN -->|instantiates| LM
    PLUGIN -->|instantiates| DM
    LM -->|owns| CD
    LM -->|reads/writes| CT
    LM -->|reads/writes| ST
    LM -->|uses| SA
    DM -->|enqueues via| CQ
    DM -->|creates sessions via| SP
    DM -->|polls via| SA
    DM -->|reads completion from| CD
    HOOKS -->|route events to| LM
    TOOLS -->|dispatch through| DM
    CT -->|depends on| TY
    ST -->|depends on| TY
    CQ -->|depends on| TY
    CD -.->|self-contained| TY
    SA -->|uses| TY

    TY@{ shape: lean, label: "types.ts (leaf)" }
```

The dependency graph respects a strict dependency order. `types.ts` is the root leaf — imported by nearly every module. The maximum dependency chain depth is 2 levels.

## Data Flow

### 1. Plugin Load (Startup)

```
OpenCode starts → loads HarnessControlPlane → creates DelegationManager → creates HarnessLifecycleManager
  → hydrates in-memory state from continuity.ts → registers tools + hooks → recovers pending delegations
```

On startup, `plugin.ts` instantiates the `DelegationManager` (with the OpenCode `client`, an optional `PtyManager`, and resolved `runtimePolicy`), then creates the `HarnessLifecycleManager`. The lifecycle manager hydrates its in-memory state maps (`sessionStats`, `rootBudgets`, `sessionDelegationMeta`) from the durable continuity JSON file (written to `.hivemind/state/session-continuity.json` per Q6). Then `delegationManager.recoverPending()` runs asynchronously to recover any delegations that were in-flight when the last session terminated.

### 2. Delegation Request (Task Dispatch)

```
Agent calls delegate-task tool → DelegationManager.dispatch()
  → 1. Validate agent against registry + runtime policy
  → 2. Check category gates
  → 3. Build queue key (provider:model or agent:category)
  → 4. Enqueue via DelegationConcurrencyQueue.acquire()
  → 5. Spawn child session via spawner/session-creator.ts (SDK or PTY)
  → 6. Register with DelegationStateMachine (in-memory, persisted)
  → 7. Send prompt to child session asynchronously
  → 8. Begin CompletionDetector.watch() for dual-signal completion
  → 9. Return delegation ID to calling agent immediately (always-background WaiterModel)
```

### 3. Completion Detection (Dual-Signal)

```
Event hook receives session.idle → [system event path]
  → create-core-hooks.ts routes to lifecycleManager.handleEvent()
  → lifecycle manager routes to CompletionDetector.feed()

[Polling path]
  → DelegationManager polls child session messages via session-api.ts
  → Checks message count stability (count unchanged across polls + idle signal)
  → On dual-signal confirmed: extracts result, transitions delegation to "completed"
  → Persists delegation record via delegation-persistence.ts

[Agent polls status]
  → Agent calls delegation-status tool → DelegationManager.getDelegationResult()
  → If completed: returns result + summary; if running: returns status
```

### 4. State Persistence

```
On session.idle / session.error / session.deleted events:
  → lifecycleManager.handleEvent() → updates TaskStatus in state.ts (in-memory)
  → Writes continuity snapshot to .hivemind/state/session-continuity.json (deep-cloned)
  → On startup: continuity.ts reads the JSON file back → lifecycleManager.hydrateFromContinuity()
```

## Key Abstractions

| Abstraction | File | Purpose |
|-------------|------|---------|
| `HarnessControlPlane` | `src/plugin.ts` | Composition root. Thin async factory (~165 LOC) that instantiates dependencies, wires hook factories, and registers tools into OpenCode. No business logic. |
| `DelegationManager` | `src/lib/delegation-manager.ts` | Core delegation orchestrator (~470 LOC). Handles agent validation, category gates, concurrency enqueue, session spawning (SDK/PTY), dual-signal completion monitoring, and delegation recovery. |
| `HarnessLifecycleManager` | `src/lib/lifecycle-manager.ts` | Session lifecycle state machine (~240 LOC). Manages 6-phase lifecycle (created→queued→dispatching→running→completed/failed) with validated transitions. Routes SDK events (idle/error/deleted) to the CompletionDetector. |
| `CompletionDetector` | `src/lib/completion-detector.ts` | Dual-signal completion detection (~157 LOC). Watches for `session.idle` terminal events AND message count stability (count unchanged across polls) before declaring completion. Includes configurable stability timeout. |
| `DelegationConcurrencyQueue` | `src/lib/concurrency.ts` | Keyed semaphore with FIFO lanes and priority queuing (~310 LOC). Builds queue keys from provider+model or agent+category combinations. Enforces `MAX_DESCENDANTS_PER_ROOT` (10) budget limit. |
| `ContinuityStore` (functions) | `src/lib/continuity.ts` | Durable JSON persistence (~455 LOC). Provides `getSessionContinuity`, `recordSessionContinuity`, `patchSessionContinuity`, `hydrateFromContinuity`. Implements deep-clone-on-read, atomic writes, and Q6 canonical path (`.hivemind/state/`). |
| `types.ts` | `src/lib/types.ts` | Leaf module (~415 LOC). Contains all shared types (`TaskStatus`, `SessionLifecyclePhase`, `DelegationMeta`, `RuntimePolicy`, `DelegateParams`, etc.), constants (`VALID_DELEGATION_CATEGORIES`, `MAX_DESCENDANTS_PER_ROOT`), and status mapping tables. Imported by nearly every module. |
| `session-api.ts` | `src/lib/session-api.ts` | Typed OpenCode SDK wrappers (~265 LOC). Provides `createSession`, `getSession`, `abortSession`, `getSessionMessages`, `sendPrompt`, `getSessionID`, `getParentID`, `walkParentChain`. Canonical call shapes with validation. |
| `runtime-policy.ts` | `src/lib/runtime-policy.ts` | Runtime policy loading and resolution (~267 LOC). Defines `DEFAULT_RUNTIME_POLICY` (concurrency.globalLimit: 3, budget.maxToolCallsPerSession: 400, etc.), validates workspace-level policy YAML files, and resolves per-session overrides. |
| `state.ts` | `src/lib/state.ts` | In-memory state maps (~106 LOC). Maintains `sessionStats`, `rootBudgets`, `sessionToRoot` mappings, and `sessionDelegationMeta` — the volatile complement to `continuity.ts`'s durable store. |

### CQRS Boundary

The system enforces a strict CQRS boundary:

- **Tools (command side)**: Mutate state. Each tool has a Zod schema for input validation (defined in `src/schema-kernel/`). Examples: `delegate-task`, `session-patch`, `configure-primitive`.
- **Hooks (query side)**: Observe events, never mutate. Three hook categories: core hooks (`event`, `messages.transform`, `shell.env`), session hooks (`session.read.*`), and tool guard hooks (`tool.execute.before`, `tool.execute.after`).

The `hook-cqrs-boundary.ts` module classifies each hook invocation as a read or write to enforce this separation.

## Directory Structure Rationale

```
src/
├── plugin.ts                  # Composition root — the single entrypoint OpenCode loads
├── index.ts                   # Public API re-exports — exposes HarnessControlPlane + all lib/ modules
├── hooks/                     # Event hook factories (read-side CQRS)
│   ├── create-core-hooks.ts   #   event, messages.transform, shell.env routing
│   ├── create-session-hooks.ts#   session.read.* hooks (delegation meta, state queries)
│   ├── create-tool-guard-hooks.ts # tool.execute.before/after guardrails
│   └── types.ts               #   HookDependencies interface
├── tools/                     # Custom tool implementations (write-side CQRS)
│   ├── delegate-task.ts       #   Delegation dispatch tool
│   ├── delegation-status.ts   #   Status polling and result retrieval
│   ├── run-background-command.ts #  PTY-backed background command execution
│   ├── prompt-skim/           #   Prompt skimming (fast scan, complexity scoring)
│   ├── prompt-analyze/        #   Prompt analysis (contradictions, vagueness, gaps)
│   ├── session-patch/         #   Session file patching with backup
│   ├── session-journal-export.ts # Session journal export (JSON/Markdown)
│   ├── hivemind-doc.ts        #   Document intelligence (skim, read, chunk, search)
│   ├── hivemind-trajectory.ts #   Execution trajectory ledger inspection
│   ├── hivemind-pressure.ts   #   Runtime pressure classification
│   ├── hivemind-agent-work.ts #   Agent work contract creation and export
│   ├── hivemind-sdk-supervisor.ts # SDK wrapper health diagnostics
│   ├── hivemind-command-engine.ts # Command bundle discovery and analysis
│   ├── configure-primitive.ts #   OpenCode primitive configuration (agent, command, skill)
│   └── validate-restart.ts    #   Compiled primitive discoverability validation
├── lib/                       # Core library modules — business logic layer
│   ├── types.ts               #   Shared types and constants (leaf module)
│   ├── delegation-types.ts    #   Delegation-specific types (extracted from types.ts)
│   ├── delegation-manager.ts  #   Core delegation orchestrator
│   ├── delegation-state-machine.ts # In-memory delegation record management
│   ├── delegation-persistence.ts   # Delegation state file I/O
│   ├── lifecycle-manager.ts   #   Session lifecycle state machine
│   ├── continuity.ts          #   Durable JSON persistence
│   ├── state.ts               #   In-memory Maps
│   ├── session-api.ts         #   Typed OpenCode SDK wrappers
│   ├── concurrency.ts         #   Keyed semaphore with FIFO lanes
│   ├── completion-detector.ts #   Dual-signal completion detection
│   ├── runtime-policy.ts      #   Runtime policy loading and resolution
│   ├── runtime.ts             #   Event→status mapping
│   ├── helpers.ts             #   Pure utility functions
│   ├── category-gates.ts      #   Category-based delegation gate decisions
│   ├── sdk-delegation.ts      #   SDK-mode delegation handler
│   ├── command-delegation.ts  #   Command-mode delegation handler
│   ├── notification-handler.ts#   Async completion notification (deprecated)
│   ├── config-workflow/       #   Config workflow turn management
│   ├── spawner/               #   Session creation subsystem
│   │   ├── session-creator.ts #     SDK/PTY session creation
│   │   ├── spawn-request-builder.ts # Agent+permission resolution
│   │   └── agent-primitive-policy.ts # Primitive-defined agent enrichment
│   ├── pty/                   #   PTY integration (bun-pty optional dependency)
│   ├── session-journal.ts     #   Append-only event journal
│   ├── journal-query.ts       #   Journal query operations
│   ├── journal-replay.ts      #   Session replay from journal
│   ├── execution-lineage.ts   #   Session ancestry tracing
│   ├── event-tracker/         #   Audit event tracking and artifact creation
│   ├── doc-intelligence/      #   Document intelligence operations
│   ├── trajectory/            #   Execution trajectory ledger
│   ├── runtime-pressure/      #   Runtime pressure classification
│   ├── agent-work-contracts/  #   Agent work contract persistence
│   ├── sdk-supervisor/        #   SDK wrapper supervision
│   ├── command-engine/        #   Command bundle analysis
│   ├── control-plane/         #   Control plane internal operations
│   ├── security/              #   Security modules (path scoping, redaction)
│   └── primitive-registry.ts  #   Primitive registry for OpenCode config
├── schema-kernel/             # Zod schemas for all tool inputs and meta-concept contracts
│   ├── prompt-enhance.schema.ts
│   ├── agent-frontmatter.schema.ts
│   ├── command-frontmatter.schema.ts
│   └── ... (15 schema files total)
├── shared/                    # Cross-cutting tool utilities
│   ├── tool-response.ts       #   Standard tool response envelope
│   └── tool-helpers.ts        #   Tool helper conventions
├── cli/                       # CLI substrate for programmatic dispatch
│   ├── index.ts               #   runCli(argv, io?) entry point
│   └── router.ts              #   Command routing
└── sidecar/                   # Read-only state projection (GUI sidecar)
    └── readonly-state.ts      #   Aggregated state projection (read-only, never mutates)
```

**Rationale:**

- **`plugin.ts` is deliberately thin** — it only assembles. All logic is pushed into dedicated factory/module files, keeping the composition root scannable and the dependency graph clear.
- **`lib/` holds business logic, `tools/` holds tool wrappers, `hooks/` holds event wiring** — each directory maps to one CQRS surface. No tool contains business logic; no hook mutates state.
- **`schema-kernel/` centralizes all Zod schemas** — tool input validation, frontmatter contracts, and configuration shapes are in one place, making them discoverable and version-locked.
- **`spawner/` isolates session creation** — the complex agent/permission/directory/concurrency-key resolution logic is extracted from `delegation-manager.ts` into focused modules (each under 200 LOC).
- **Module size is capped at 500 LOC** — larger modules like `continuity.ts` (~455 LOC) and `delegation-manager.ts` (~470 LOC) are actively monitored for further extraction.
- **`shared/` is leaf utilities** — `tool-response.ts` and `tool-helpers.ts` have no project-internal dependencies, guaranteeing they can be used by any tool without circular dependencies.

## Dependency Rules (Non-Negotiable)

1. **No circular dependencies** — enforced by the module graph. `types.ts` is the root leaf.
2. **Maximum dependency chain: 2 levels** — `types.ts → module_A → module_B`.
3. **Max module size: 500 LOC** — monitored; extraction thresholds trigger when files approach this limit.
4. **Deep-clone-on-read** in `continuity.ts` — all `clone*()` functions prevent mutation aliasing.
5. **`[Harness]` prefix** on all thrown errors — for flow control and debugging, not production bugs.
6. **No `any` types on new code** — `client: any` is acknowledged tech debt from the SDK's opaque typing.
7. **`verbatimModuleSyntax: true`** — use `import type` for type-only imports to prevent runtime import costs.

## Validation Decisions (Q1–Q6)

Six architectural decisions locked on 2026-04-25 as the foundation for current and future development:

| Decision | Description |
|----------|-------------|
| **Q1** | Hybrid + Spec-Driven Automated Runtime Detection — deep codemap, file watcher, MCP tools, dependency graph; Layer 2 taxonomy |
| **Q2** | Artifact-Focused Sidecar — Next.js 15 + `@json-render/react`, reads `.hivemind/` and `.planning/`, READ-ONLY for canonical state |
| **Q3** | Session Journal as Complement + Time-Machine — append-only event timeline, independent of `continuity.ts` |
| **Q4** | MVP = 5 of 8 memory categories; Post-MVP = 3 with explicit gates |
| **Q5** | Full RICH gate required — 0 of 25 skills pass today is honest status; no threshold lowering |
| **Q6** | `.hivemind/` is internal state root; `.opencode/` is ONLY for OpenCode primitives — one-way migration |

<!-- VERIFY: The package is published as opencode-harness on npm — verify the latest published version at https://www.npmjs.com/package/opencode-harness -->
