<!-- refreshed: 2026-05-08 -->
# Architecture

**Analysis Date:** 2026-05-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         OpenCode Runtime                                 │
│                  (Host platform — loads plugin, emits events)            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    HarnessControlPlane (Composition Root)                │
│  `src/plugin.ts` — wires deps, registers tools, composes hooks          │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────┤
│   Hooks  │  Tools   │ Config   │ Routing  │ CLi      │   Schema-Kernel  │
│  `hooks/`│ `tools/` │`config/` │`routing/`│ `cli/`   │ `schema-kernel/` │
│ (read)   │ (write)  │ (config) │(intake)  │ (CLI)    │ (validation)     │
└────┬─────┴────┬─────┴────┬─────┴──────────┴──────────┴──────────────────┘
     │          │          │
     ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Runtime Logic Layer                                │
│  `task-management/`   `coordination/`   `features/`                     │
│  (lifecycle, state,   (delegation,      (background cmd, bootstrap,      │
│   continuity,         concurrency,       doc-intel, pressure,            │
│   journals,           completion,        SDK supervisor,                 │
│   trajectory)         spawner)           agent work contracts)           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Shared / Leaf Layer                              │
│  `shared/` — types, state manager, helpers, SDK wrappers, policy        │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Persistent State & File System                        │
│  `.hivemind/` (canonical)    `.opencode/` (primitives only)             │
│  `.planning/` (planning artifacts)                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| HarnessControlPlane | Composition root: instantiate deps, wire hooks, register tools | `src/plugin.ts` |
| TaskStateManager | In-memory session/budget/concurrency state (dual-layer with continuity) | `src/shared/state.ts` |
| HarnessLifecycleManager | Session lifecycle state machine (created→queued→dispatching→running→completed/failed) | `src/task-management/lifecycle/index.ts` |
| DelegationManager | WaiterModel delegation dispatch, dual-signal completion, recovery | `src/coordination/delegation/manager.ts` |
| CompletionDetector | Detect delegated session completion (idle, error, deleted events) | `src/coordination/completion/detector.ts` |
| DelegationConcurrencyQueue | Per-key concurrency gating with acquire/release | `src/coordination/concurrency/queue.ts` |
| ConfigSubscriber | Lazy-load + cache + fallback for Hivemind configs | `src/config/subscriber.ts` |
| ConfigCompiler | Compile OpenCode primitives (agent, command, skill) from definitions to files | `src/config/compiler.ts` |
| PromptSkimTool | Fast prompt scan: word/line/token count, URL extraction, complexity score | `src/tools/prompt/prompt-skim/index.ts` |
| PromptAnalyzeTool | Deep prompt analysis: contradictions, vagueness, missing scope | `src/tools/prompt/prompt-analyze/index.ts` |
| DelegateTaskTool | SDL-backed child-session dispatch (always-background WaiterModel) | `src/tools/delegation/delegate-task.ts` |
| PtyManager | Lazy-loaded PTY session management for background commands | `src/features/background-command/pty/` |
| BootstrapInit | Create `.hivemind/` surfaces and install project/global primitive symlinks | `src/tools/config/bootstrap-init.ts` |
| HivemindDoc | Read-only document intelligence (skim, read, chunk, search) | `src/tools/hivemind/hivemind-doc.ts` |
| AgentWorkContract | Pressure-aware agent work contract creation/export | `src/tools/hivemind/hivemind-agent-work.ts` |

## Pattern Overview

**Overall:** Plugin Composition + CQRS (Command Query Responsibility Segregation)

**Key Characteristics:**
- **Thin composition root:** `src/plugin.ts` (187 lines) does dependency injection only — zero business logic
- **CQRS boundary:** Hooks (read-side observers) never perform durable writes; Tools (write-side commands) own mutation authority
- **Factory injection:** All dependencies passed via constructor/factory params, no hidden global state
- **Dual-layer state:** In-memory `Map` state (`TaskStateManager`) + durable JSON continuity files (`.hivemind/state/`)
- **Deep-clone-on-read:** Continuity store defensive copies prevent shared-mutation bugs
- **Best-effort side-effects:** Audit/telemetry/tracking projections never crash the main event flow
- **`[Harness]` error prefix:** All thrown errors carry a recognizable domain prefix

## Layers

**Plugin Composition Layer:**
- Purpose: Thin assembly root — instantiate dependencies, register tools, compose hooks
- Location: `src/plugin.ts`
- Contains: Dependency wiring, tool registration map, hook composition
- Depends on: Everything (is the root)
- Used by: OpenCode runtime (loads as plugin)

**Tools Layer (Write-Side):**
- Purpose: CQRS mutation authority — validate input, execute commands, return structured responses
- Location: `src/tools/`
- Contains: `delegation/`, `hivemind/`, `config/`, `prompt/`, `session/`
- Depends on: `src/shared/`, `src/coordination/`, `src/schema-kernel/`, `src/features/`
- Used by: OpenCode agents (invoked as tools)

**Hooks Layer (Read-Side):**
- Purpose: Observe OpenCode lifecycle events, route to managers, shape responses, guard decisions
- Location: `src/hooks/`
- Contains: `lifecycle/` (core-hooks, session-hooks), `guards/` (tool-guard-hooks, governance-block), `observers/` (event-observers), `transforms/` (tool-after-composer, toggle-gates), `composition/` (cqrs-boundary)
- Depends on: `src/shared/`, `src/task-management/`, `src/routing/`
- Used by: `src/plugin.ts` (assembled into plugin return value)

**Runtime Logic Layer:**
- Purpose: Business logic — lifecycle management, delegation dispatch, concurrency control, completion detection
- Location: `src/task-management/`, `src/coordination/`, `src/features/`
- Contains: 
  - `src/task-management/`: `lifecycle/`, `continuity/`, `journal/`, `recovery/`, `trajectory/`
  - `src/coordination/`: `delegation/`, `completion/`, `concurrency/`, `spawner/`, `sdk-delegation/`, `command-delegation/`
  - `src/features/`: `background-command/`, `bootstrap/`, `doc-intelligence/`, `runtime-pressure/`, `sdk-supervisor/`, `agent-work-contracts/`, `prompt-packet/`
- Depends on: `src/shared/`, `src/schema-kernel/`
- Used by: `src/plugin.ts`, `src/tools/`, `src/hooks/`

**Config Layer:**
- Purpose: Hivemind config loading, compilation, workflow state machines
- Location: `src/config/`
- Contains: `subscriber.ts`, `compiler.ts`, `workflow/`
- Depends on: `src/shared/`, `src/schema-kernel/`
- Used by: `src/plugin.ts`, `src/tools/config/`

**Routing Layer:**
- Purpose: Session entry classification, behavioral profile resolution, command engine
- Location: `src/routing/`
- Contains: `session-entry/`, `behavioral-profile/`, `command-engine/`
- Depends on: `src/shared/`, `src/schema-kernel/`
- Used by: `src/plugin.ts`, `src/hooks/`, `src/tools/`

**Shared / Leaf Layer:**
- Purpose: Pure utility types, state manager, SDK wrappers, runtime policy — no deep runtime imports
- Location: `src/shared/`
- Contains: `types.ts`, `state.ts`, `helpers.ts`, `session-api.ts`, `runtime-policy.ts`, `tool-response.ts`, `security/`, `runtime.ts`, `task-status.ts`, `app-api.ts`
- Depends on: Only `src/coordination/delegation/types.js` (for type imports), Node.js builtins
- Used by: Every layer above it

**Schema Kernel Layer:**
- Purpose: Zod validation schemas for all primitives and runtime contracts
- Location: `src/schema-kernel/`
- Contains: 19 schema files covering agents, commands, skills, permissions, configs, bootstrap, MCP servers, etc.
- Depends on: Zod library only
- Used by: `src/config/`, `src/tools/`, `src/features/`

**CLI Layer:**
- Purpose: Standalone CLI tool for discovery, routing, rendering
- Location: `src/cli/`
- Contains: `index.ts`, `discovery.ts`, `router.ts`, `renderer.ts`, `commands/`
- Depends on: `src/shared/`
- Used by: `bin/hivemind.cjs` (CLI entry point)

## Data Flow

### Primary Request Path (Delegation Dispatch)

1. OpenCode agent invokes `delegate-task` tool (`src/tools/delegation/delegate-task.ts`)
2. Tool validates input, calls `DelegationManager.dispatch()` (`src/coordination/delegation/manager.ts:124`)
3. `DelegationManager` acquires concurrency slot via `DelegationConcurrencyQueue` (`src/coordination/concurrency/queue.ts`)
4. Category gates evaluated (`src/coordination/delegation/category-gates.ts`)
5. Agent policy resolved from primitives + runtime policy (`src/coordination/spawner/spawn-request-builder.ts`)
6. Child session spawned via `spawnDelegatedSession()` (`src/coordination/spawner/session-creator.ts`)
7. Delegation record persisted to `.hivemind/delegation/` (`src/task-management/continuity/delegation-persistence.ts`)
8. Lifecycle manager transitions session to `dispatching` → `running` (`src/task-management/lifecycle/index.ts`)

### Completion Detection Path

1. OpenCode emits `session.idle` event → `core-hooks.ts` routes to lifecycle manager
2. Lifecycle manager passes to `CompletionDetector` (`src/coordination/completion/detector.ts`)
3. Detector caches terminal signal, feeds message counts back to DelegationManager
4. DelegationManager polling loop detects completion via dual-signal (idle + message threshold)
5. Result captured, persisted, notification queued (`src/coordination/completion/notification-handler.ts`)
6. Session transitions to `completed` terminal state

### Hook Event Routing Path

1. OpenCode emits lifecycle event → `core-hooks.ts` `event()` handler (`src/hooks/lifecycle/core-hooks.ts:53`)
2. Event routed to `lifecycleManager.handleEvent()` for state transitions
3. Event observers invoked in sequence: delegation observer → session observer → journey observer → intake observer
4. Each observer classifies event, returns structured facts; lifecycle manager consumes facts
5. CQRS boundary enforced: hooks never write to durable state directly

**State Management:**
- **In-memory:** `TaskStateManager` — `Map`-based session stats, budgets, subagent registry (lives for plugin lifetime)
- **Durable:** Continuity files in `.hivemind/state/` — delegation records, session lineage, event journals (persist across restarts)
- **Dual-layer sync:** `hydrateFromContinuity()` at startup loads durable state into memory; deep-clone-on-read prevents shared-mutation

## Key Abstractions

**DelegationManager:**
- Purpose: Central delegation dispatch + lifecycle orchestrator
- Location: `src/coordination/delegation/manager.ts` (500 lines)
- Pattern: WaiterModel — always-background dispatch, dual-signal completion (session idle + message threshold)

**HarnessLifecycleManager:**
- Purpose: Session lifecycle state machine with validated transitions
- Location: `src/task-management/lifecycle/index.ts` (243 lines)
- Pattern: Finite state machine — `created → queued → dispatching → running → completed/failed`

**CompletionDetector:**
- Purpose: Detect delegated session terminal states
- Location: `src/coordination/completion/detector.ts`
- Pattern: Dual-signal detection — idle events cached, message counts compared against thresholds

**CQRS Boundary:**
- Purpose: Enforce that hooks (read-side) never perform durable writes
- Location: `src/hooks/composition/cqrs-boundary.ts`
- Pattern: `assertHookWriteBoundary()` — throws `[Harness]` error if hook attempts write

**RuntimePolicy:**
- Purpose: Single seam for runtime configuration (concurrency limits, budgets, category gates)
- Location: `src/shared/runtime-policy.ts` (267 lines)
- Pattern: Default hardcoded policy + workspace-level overrides merged at startup

## Entry Points

**OpenCode Plugin Entry:**
- Location: `src/plugin.ts` → export `HarnessControlPlane` (default + named)
- Triggers: OpenCode runtime loads plugin at startup
- Responsibilities: Instantiate all dependencies, register 18 tools, compose 5 hook surfaces

**npm Package Entry:**
- Location: `src/index.ts` (27 lines)
- Triggers: `import ... from "hivemind"` or `"opencode-harness"`
- Responsibilities: Re-export `HarnessControlPlane` + public API surfaces

**CLI Entry:**
- Location: `src/cli/index.ts`
- Triggers: `npx hivemind` or `bin/hivemind.cjs`
- Responsibilities: CLI command discovery, routing, rendering

**Sidecar Entry:**
- Location: `src/sidecar/readonly-state.ts`
- Triggers: Next.js sidecar app reads harness state
- Responsibilities: Read-only enforcement for `.hivemind/` and `.planning/` canonical state

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; PTY background commands use `bun-pty` (Bun-only, optional) with `node:child_process` fallback
- **Global state:** `TaskStateManager` is a module-level singleton (`export const taskState` in `src/shared/state.ts`); config cache is module-level (`src/config/subscriber.ts`)
- **Circular imports:** None permitted; dependency graph enforced as acyclic (shared → runtime logic → tools/hooks → plugin root)
- **Module size cap:** 500 LOC maximum per module; `DelegationManager` at 500 lines is at the limit
- **CQRS boundary:** Hooks must not perform durable writes; `assertHookWriteBoundary()` enforces at runtime
- **State root separation:** `.opencode/` is OpenCode primitives ONLY; `.hivemind/` is canonical deep-module state
- **verbatimModuleSyntax:** All TypeScript imports must use `import type` for type-only imports; `.js` extension required in ESM relative imports
- **Deep-clone-on-read:** Continuity store defensive copies prevent shared-mutation bugs across actors
- **Error prefix:** All thrown errors carry `[Harness]` prefix for traceability
- **Lazy loading:** PTY manager loaded conditionally; config cached lazily; behavioral profiles computed on first access

## Anti-Patterns

### Business Logic in Composition Root

**What happens:** Placing delegation logic, state transitions, or tool behavior directly in `src/plugin.ts`
**Why it's wrong:** `src/plugin.ts` is the composition root (187 lines) — it should only wire dependencies. Business logic belongs in `src/coordination/`, `src/task-management/`, or individual tool files
**Do this instead:** Module-level concerns go to `src/coordination/` or `src/task-management/`; tool-specific logic stays in `src/tools/{tool-name}/`

### Hook Performing Durable Writes

**What happens:** A hook factory directly writes to `.hivemind/` or mutates persistence files
**Why it's wrong:** Violates CQRS — hooks are read-side observers. Durable writes must go through tools or their delegated managers
**Do this instead:** Route facts to `lifecycleManager` or `delegationManager` via dependency injection; let those managers own the mutation

### Direct File System Access Without Sidecar Guard

**What happens:** Sidecar Next.js app writes directly to `.hivemind/` or `.planning/` without going through `src/sidecar/readonly-state.ts`
**Why it's wrong:** The sidecar is read-only for canonical state. Writes cause state corruption across harness instances
**Do this instead:** Use `refuseCanonicalWrite()` from `src/sidecar/readonly-state.ts` as the guard; all reads go through the prescribed read helpers

### State Root Confusion

**What happens:** Storing runtime journals, delegation records, or session state in `.opencode/` instead of `.hivemind/`
**Why it's wrong:** `.opencode/` is for OpenCode primitives (agents, commands, skills, rules). Other plugins or user deps may interact with `.opencode/`, causing corruption. `.hivemind/` is the canonical, isolated state root.
**Do this instead:** All runtime state writes go to `.hivemind/`; use `src/task-management/continuity/` for persistence paths

## Error Handling

**Strategy:** `[Harness]`-prefixed errors, best-effort side-effects, graceful degradation

**Patterns:**
- **Prefixed errors:** All thrown errors use `[Harness]` prefix for traceability — e.g., `[Harness] Invalid concurrency policy: globalLimit must be positive`
- **Best-effort projections:** Audit event tracking, intake classification, and workflow persistence failures are silently caught — `try { ... } catch { /* best-effort */ }` — so they never crash the main event flow
- **Graceful fallback:** Missing/invalid configs return defaults; PTY manager returns `null` on unsupported platforms
- **Recovery:** `DelegationManager.recoverPending()` runs async at startup to recover interrupted delegations

## Cross-Cutting Concerns

**Logging:** Console-based with `[Harness]` prefix; no external logging framework
**Validation:** Zod schemas in `src/schema-kernel/` for all input validation; tools validate via Zod before executing
**Authentication:** Delegation uses OpenCode SDK session API; no custom auth layer
**Security:** Workspace runtime policy (`src/shared/workspace-runtime-policy.ts`) validates against `.hivemind/configs.json`; security helpers in `src/shared/security/`
**Observability:** Event tracker (`src/task-management/journal/event-tracker/`) projects audit events to `.hivemind/event-tracker/`; execution lineage (`src/task-management/journal/execution-lineage.ts`) records session parent/child trees

---

*Architecture analysis: 2026-05-08*
