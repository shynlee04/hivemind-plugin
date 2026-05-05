<!-- refreshed: 2026-04-28 -->
# Architecture

**Analysis Date:** 2026-04-28

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Hard Harness (npm package)                         │
│                             `src/`                                        │
├──────────────────┬──────────────────────┬────────────────────────────────┤
│   Tools (Write)  │   Hooks (Read)       │   Kernel (Shared)              │
│  `src/tools/`    │  `src/hooks/`        │  `src/lib/`                    │
│  CQRS: mutation  │  CQRS: observation   │  types, state, concurrency,    │
│  authority only  │  only (no durable    │  continuity, lifecycle,        │
│                  │   writes allowed)    │  delegation, session-api       │
├──────────────────┼──────────────────────┼────────────────────────────────┤
│            Plugin Composition Root (`src/plugin.ts`)                      │
│            Wires deps → instantiates hooks → registers 16 tools          │
└────────┬─────────┴──────────────────────┴───────────┬────────────────────┘
         │                                              │
         ▼                                              ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│   Soft Meta-Concepts (configurable)  │  │   Deep Module State (internal)        │
│   `.opencode/`                       │  │   `.hivemind/`                        │
│                                      │  │                                       │
│   • 89 agents                        │  │   • Session continuity JSON            │
│   • 58 skills                        │  │   • Delegation records                │
│   • 18 commands                      │  │   • Execution lineage                 │
│   • Permission rules                 │  │   • Event tracker artifacts           │
│   • Plugin loader                    │  │   • Session journals                  │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

## Two Halves (never confuse them)

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf) | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |
| **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state | `.hivemind/` |

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `HarnessControlPlane` | Composition root — instantiates deps, wires hooks, registers tools | `src/plugin.ts` |
| `DelegationManager` | Core delegation orchestrator — WaiterModel dispatch, concurrency, status polling, recovery | `src/lib/delegation-manager.ts` |
| `HarnessLifecycleManager` | Session lifecycle state machine — transition guards, activity tracking, event routing | `src/lib/lifecycle-manager.ts` |
| `CompletionDetector` | Two-signal completion detection (session.idle + stability timer) | `src/lib/completion-detector.ts` |
| `TaskStateManager` | In-memory Maps for sessionStats, rootBudgets, sessionToRoot, delegationMeta | `src/lib/state.ts` |
| `DelegationConcurrencyQueue` | Keyed semaphore (FIFO per model+agent+category) | `src/lib/concurrency.ts` |
| `DelegationBroadcast` | New delegation event notifications via parent session prompt | `src/lib/delegation-broadcast.ts` |
| Continuity Store | Durable JSON persistence with deep-clone, normalization, quarantine | `src/lib/continuity.ts` |
| Session API | Typed OpenCode SDK wrappers (create, get, abort, messages, prompt, walkParentChain) | `src/lib/session-api.ts` |
| Runtime Policy | Policy loading, validation, per-session overrides (concurrency, budget, category gates) | `src/lib/runtime-policy.ts` |
| Session Journal | Append-only event timeline — independent of continuity.ts (Q3 decision) | `src/lib/session-journal.ts` |
| Execution Lineage | Derived projection combining continuity + delegations + journal entries | `src/lib/execution-lineage.ts` |
| Event Tracker | Hook-driven audit trail — parses events, writes artifacts to `.hivemind/event-tracker/` | `src/lib/event-tracker/` |
| Schema Kernel | Zod schemas for agent/command/skill frontmatter, permissions, MCP servers, prompt-enhance pipeline | `src/schema-kernel/` |
| Spawner | Agent primitive policy, concurrency key resolution, parent directory, session creation, request building | `src/lib/spawner/` |
| PTY Manager | bun-pty pseudo-terminal integration for background command execution | `src/lib/pty/` |
| Config Workflow | Turn-based workflow state persistence for configure-primitive | `src/lib/config-workflow/` |
| Security | Path-scope validation (`assertPathWithinRoot`) and boundary-field redaction | `src/lib/security/` |

## Pattern Overview

**Overall:** CQRS Plugin Architecture with WaiterModel Delegation

**Key Characteristics:**
- **CQRS separation**: Tools are the only write-side mutation surface; hooks are read-side observers — enforced by `hook-cqrs-boundary.ts` (`assertHookWriteBoundary`)
- **WaiterModel delegation**: `delegate-task` tool returns immediately with delegation ID; polling via `delegation-status` tool; dual-signal completion detection (session.idle + stability timer)
- **Dual-layer state**: Durable JSON file (`continuity.ts`) for persistence across restarts + in-memory Maps (`state.ts`) for hot runtime access, hydrated on startup
- **Keyed semaphore concurrency**: `DelegationConcurrencyQueue` with per-key (provider:model, agent:category) FIFO lanes, high/normal priority queuing
- **Trusted runtime policy**: Configurable concurrency limits, tool budgets, category gates loaded from `.hivemind/runtime-policy.json` (workspace-level) with per-session overrides via delegation metadata
- **Hybrid delegation**: SDK child-session dispatch (resumable) + PTY command-process dispatch (best-effort) + headless process dispatch (non-resumable) — unified under `DelegationManager`
- **Zero business logic in plugin layer**: `plugin.ts` is a thin composition root (~142 LOC); all logic lives in individual hook factories and tool implementations
- **`[Harness]` error prefix**: All thrown errors use this prefix for flow control identification

## Layers

### Tools Layer (Write-Side / CQRS Command)
- Purpose: Expose mutation operations to agents via OpenCode tool system — delegation dispatch, status polling, background commands, prompt enhancement, configuration, validation, journal export
- Location: `src/tools/`
- Contains: 16 tool implementations, each wrapping a Zod schema and `execute()` function
- Depends on: `src/lib/` (types, delegation-manager, continuity), `@opencode-ai/plugin/tool`, `src/shared/`
- Used by: OpenCode runtime — agents invoke tools via plugin tool registry

**Tools registered:**
| Tool | Purpose | File |
|------|---------|------|
| `delegate-task` | Dispatch work to specialist agents via SDK child-session (WaiterModel) | `src/tools/delegate-task.ts` |
| `delegation-status` | Poll delegation status by ID or list all (optionally filtered by status) | `src/tools/delegation-status.ts` |
| `run-background-command` | Run CLI commands in shared PTY sessions with queue-governed dispatch | `src/tools/run-background-command.ts` |
| `prompt-skim` | Fast scan of prompt content (words/lines/tokens, URLs, file paths, complexity score) | `src/tools/prompt-skim/` |
| `prompt-analyze` | Deep analysis for contradictions, vagueness, missing scope, clarity signals | `src/tools/prompt-analyze/` |
| `session-patch` | Patch specific sections in session files with backup | `src/tools/session-patch/` |
| `session-journal-export` | Export session journal and execution lineage as JSON or Markdown | `src/tools/session-journal-export.ts` |
| `configure-primitive` | Configure, read, list, or inspect OpenCode primitives (agent, command, skill) | `src/tools/configure-primitive.ts` |
| `validate-restart` | Validate compiled primitives are discoverable after restart | `src/tools/validate-restart.ts` |
| `hivemind-doc` | Search and retrieve Hivemind documentation artifacts | `src/tools/hivemind-doc.ts` |
| `hivemind-trajectory` | Track and export execution trajectory for audit | `src/tools/hivemind-trajectory.ts` |
| `hivemind-pressure` | Runtime pressure classification and authority matrix | `src/tools/hivemind-pressure.ts` |
| `hivemind-sdk-supervisor` | SDK supervision and health monitoring | `src/tools/hivemind-sdk-supervisor.ts` |
| `hivemind-command-engine` | Command execution engine with queue governance | `src/tools/hivemind-command-engine.ts` |
| `hivemind-agent-work-create` | Create agent work contracts | `src/tools/hivemind-agent-work-create.ts` |
| `hivemind-agent-work-export` | Export agent work contracts for audit | `src/tools/hivemind-agent-work-export.ts` |

### Hooks Layer (Read-Side / CQRS Query)
- Purpose: Observe and react to OpenCode lifecycle events — event routing, auto-loop, session compaction, tool guarding, shell env injection
- Location: `src/hooks/`
- Contains: 7 hook factory modules organized by concern
- Depends on: `src/lib/` (session-api, lifecycle-manager, continuity, types)
- Used by: `plugin.ts` composition root — spread-merged into plugin return object

**Hook factories:**
| Factory | Produces | File |
|---------|----------|------|
| `createCoreHooks` | `event`, `messages.transform`, `system.transform`, `experimental.chat.system.transform`, `shell.env` | `src/hooks/create-core-hooks.ts` |
| `createSessionHooks` | `event` (auto-loop), `experimental.session.compacting` | `src/hooks/create-session-hooks.ts` |
| `createToolGuardHooks` | `tool.execute.before` (guard), `tool.execute.after` (audit) | `src/hooks/create-tool-guard-hooks.ts` |
| Plugin Event Observers | `event` observers for delegation lifecycle and session journey tracking | `src/hooks/plugin-event-observers.ts` |
| `createToolExecuteAfterHook` | `tool.execute.after` composer that chains tool-guard after-hook with output summarization | `src/hooks/tool-after-composer.ts` |
| CQRS Boundary | `classifyHookEffect()`, `assertHookWriteBoundary()` — classifies hooks as observation/response-shaping/guard-decision | `src/hooks/hook-cqrs-boundary.ts` |

### Library Layer (Deep Modules / Shared Kernel)
- Purpose: All business logic — types, state, concurrency, persistence, lifecycle, delegation, SDK wrappers, completion detection, runtime policy, session journal, execution lineage, event tracking, spawner, PTY, security
- Location: `src/lib/`
- Contains: 34 modules organized into flat files and 6 subdirectories (spawner, pty, event-tracker, security, config-workflow)
- Depends on: `zod`, `@opencode-ai/sdk`, `bun-pty`, `gray-matter`, `yaml`, Node.js built-ins (fs, crypto, path, child_process)
- Used by: `plugin.ts` composition root, all tools, all hooks

**Dependency graph (simplified):**
```
types.ts (leaf — no imports)
├── task-status.ts → types.ts
├── state.ts → types.ts
├── helpers.ts → types.ts
├── concurrency.ts (self-contained)
├── completion-detector.ts (self-contained)
├── continuity.ts → types.ts + security/
├── delegation-persistence.ts → types.ts + continuity.ts
├── session-api.ts → helpers.ts
├── runtime.ts → helpers.ts + types.ts
├── notification-handler.ts → helpers.ts
├── category-gates.ts → types.ts
├── category-gate-audit.ts → types.ts
├── runtime-policy.ts → types.ts + category-gates.ts
├── workspace-runtime-policy.ts → (fs-based config loading)
├── session-journal.ts → security/
├── execution-lineage.ts → types.ts + session-journal.ts
├── event-tracker/ → types.ts + writers
├── spawner/ → session-api.ts + concurrency.ts + helpers.ts
├── pty/ → (bun-pty optional)
├── command-delegation.ts → pty/ + helpers.ts
├── sdk-delegation.ts → session-api.ts + helpers.ts
├── app-api.ts → session-api.ts + helpers.ts
├── lifecycle-manager.ts → concurrency + continuity + helpers + session-api + state + types + completion-detector + notification-handler
└── delegation-manager.ts → concurrency + delegation-persistence + notification-handler + command-delegation + sdk-delegation + category-gates + category-gate-audit + session-api + runtime-policy + spawner/ + app-api + types
```

**Max chain depth:** 2 levels. `types.ts` changes ripple to most modules.

### Shared Layer (Cross-Cutting Tool Utilities)
- Purpose: Standard tool response envelope and rendering for consistent tool output
- Location: `src/shared/`
- Files: `tool-response.ts` (success/error/pending envelope with type guards), `tool-helpers.ts` (JSON rendering)
- Depends on: Nothing (leaf modules)
- Used by: All tool implementations

### Schema Kernel Layer
- Purpose: Zod validation schemas for OpenCode meta-concept validation — agent/command/skill frontmatter, permissions, MCP server configs, prompt-enhance pipeline, config precedence
- Location: `src/schema-kernel/`
- Files: 9 `.schema.ts` files + `index.ts` barrel
- Depends on: `zod` (zod v4)
- Used by: `configure-primitive` tool, `validate-restart` tool, config-workflow

### Soft Meta-Concepts Layer
- Purpose: User-configurable OpenCode primitives — agents, skills, commands, rules — compose the runtime behavior from outside the npm package
- Location: `.opencode/`
- Contains: 89 agents, 58 skills, 18 commands, permission rules, plugin loader
- Relationship: Loaded at OpenCode startup; harness tools reference these primitives at runtime

### Deep Module State Layer (Q6)
- Purpose: Internal runtime state persistence — session continuity, delegation records, execution lineage, event tracker artifacts, session journals, state planning
- Location: `.hivemind/`
- Contains: `state/` (session-continuity.json, delegations.json, config-workflows.json), `event-tracker/`, `journal/`, `lineage/`, `research/`, `archive/`, `cycle2/`, `daily-notes/`
- Relationship: Written by `continuity.ts`, `delegation-persistence.ts`, `event-tracker/`, `session-journal.ts`; read at hydration time

### Entry Points
| Entry Point | Location | Triggers | Responsibilities |
|-------------|----------|----------|------------------|
| Plugin Composition | `src/plugin.ts` | OpenCode plugin loading | Instantiate deps, wire hooks, register 16 tools, load runtime policy, recover pending delegations |
| Public API | `src/index.ts` | `import "opencode-harness"` | Re-export `HarnessControlPlane` + entire lib surface |
| Plugin subpath | `dist/plugin.js` (via `./plugin` export) | `opencode.json` `"plugin": ["./dist/plugin.js"]` | Thin re-export of `HarnessControlPlane` |

## Data Flow

### Primary Request Path: Delegation (WaiterModel)

1. **Agent invokes `delegate-task` tool** — passes agent name, prompt, title, safetyCeilingMs (`src/tools/delegate-task.ts:42-56`)
2. **Schema validation** — `DelegateTaskInputSchema.parse()` via Zod (`src/tools/delegate-task.ts:43`)
3. **Runtime detection** — checks `context.sessionID` / `OPENCODE_SESSION_ID` for OpenCode context (`src/tools/delegate-task.ts:46-53`)
4. **DelegationManager.dispatch()** — validates agent, resolves category gate, checks depth limit, acquires concurrency slot, builds spawn request (`src/lib/delegation-manager.ts`)
5. **Spawner resolves agent policy** — loads agent `.md` frontmatter, resolves permissions, tools, temperature from primitives (`src/lib/spawner/spawn-request-builder.ts`, `src/lib/spawner/agent-primitive-policy.ts`)
6. **Session creation** — SDK `client.session.create()` with parentID, agent, model, tools, permissions (`src/lib/spawner/session-creator.ts`, `src/lib/session-api.ts:39`)
7. **Prompt dispatch** — SDK `sendPrompt()` sends task prompt to child session (`src/lib/session-api.ts:141`)
8. **Concurrency release** — release queue slot, persist delegation record (`src/lib/delegation-manager.ts`)
9. **Status polling** — agent periodically calls `delegation-status` tool to check completion (`src/tools/delegation-status.ts`)
10. **Completion detection** — `CompletionDetector` watches for `session.idle` events + stability timer (`src/lib/completion-detector.ts`)
11. **Result capture** — messages retrieved via `getSessionMessages()`, result returned as JSON tool response (`src/lib/sdk-delegation.ts`, `src/tools/delegation-status.ts`)

### Secondary Flow: Background Command Execution (PTY)

1. Agent invokes `run-background-command` tool with `action: "run"` (`src/tools/run-background-command.ts`)
2. Tool routes to `DelegationManager` → `CommandDelegationHandler` (`src/lib/command-delegation.ts`)
3. PTY session spawned via `PtyManager` (lazy-loaded bun-pty with graceful fallback) (`src/lib/pty/pty-runtime.ts`, `src/lib/pty/pty-manager.ts`)
4. Output polled via `action: "output"`, input sent via `action: "input"`, terminated via `action: "terminate"`
5. Queue-governed dispatch with key-based concurrency

### Tertiary Flow: Prompt Enhancement Pipeline

1. Agent invokes `prompt-skim` → fast scan (words, lines, tokens, URLs, file paths, complexity) (`src/tools/prompt-skim/`)
2. Agent invokes `prompt-analyze` → deep analysis (contradictions, vagueness, clarity) (`src/tools/prompt-analyze/`)
3. Agent invokes `session-patch` → apply fixes to session files (`src/tools/session-patch/`)
4. All use shared `ToolResponse<T>` envelope (`success`/`error`/`pending`) from `src/shared/tool-response.ts`

### Event Observation Flow (Hook Side)

1. OpenCode emits session lifecycle events (start, idle, error, deleted, compacting, message)
2. `createCoreHooks` → `event` handler routes to `lifecycleManager.handleEvent()` (`src/hooks/create-core-hooks.ts:52-60`)
3. `createSessionHooks` → `event` handler drives auto-loop behavior on `session.idle` (`src/hooks/create-session-hooks.ts`)
4. `createToolGuardHooks` → `tool.execute.before` guards tool calls against budget/tool restrictions; `tool.execute.after` records audit events (`src/hooks/create-tool-guard-hooks.ts`)
5. Plugin event observers → delegation lifecycle tracking (`delegation-session-idle`, `delegation-session-deleted`) and session journey tracking (`src/hooks/plugin-event-observers.ts`)
6. Event tracker → parses hook events, writes artifacts to `.hivemind/event-tracker/` (`src/lib/event-tracker/hook-event.ts`, `src/lib/event-tracker/artifact-writer.ts`)

**State Management:**
- Durable state: `continuity.ts` writes `session-continuity.json` to `.hivemind/state/` (canonical per Q6); deep-clone-on-read, normalize-on-write, quarantine-on-corruption
- In-memory state: `state.ts` `TaskStateManager` with 4 Maps (rootBudgets, sessionToRoot, sessionStats, sessionDelegationMeta + subagentSessions)
- Delegation state: `delegation-persistence.ts` writes `delegations.json` to `.hivemind/state/`
- Hydration: `lifecycleManager.hydrateFromContinuity()` at startup

## Key Abstractions

**RuntimePolicy:**
- Purpose: Configurable concurrency limits, tool budgets, category gates — loaded from workspace-level JSON or defaults
- Examples: `src/lib/runtime-policy.ts` (loading, validation, per-session overrides), `src/lib/workspace-runtime-policy.ts` (filesystem resolution)
- Pattern: Layered defaults with per-key overrides; supplements OpenCode-native enforcement (never duplicates)

**Delegation (WaiterModel):**
- Purpose: Unified abstraction for all delegation modes (SDK child-session, PTY command, headless process)
- Examples: `src/lib/delegation-manager.ts` (orchestrator), `src/lib/sdk-delegation.ts` (SDK polling), `src/lib/command-delegation.ts` (PTY/process)
- Pattern: dispatch → return ID immediately → poll for status via delegation-status tool

**HookDependencies:**
- Purpose: Shared dependency bundle injected into all hook factories
- Examples: `src/hooks/types.ts` — `lifecycleManager`, `client`, `stateManager`, `eventObservers`
- Pattern: Constructor injection via factory functions; hooks receive only what they need

**ToolResponse<T>:**
- Purpose: Standardized tool output envelope with kind (success/error/pending), message, optional data/metadata
- Examples: `src/shared/tool-response.ts`
- Pattern: All tools return `renderToolResult(success(...))` or `renderToolResult(error(...))`

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. Concurrency managed via `DelegationConcurrencyQueue` (keyed semaphore, not threads). Background processes via `child_process.spawn` or `bun-pty` PTY sessions.
- **Global state:** `storeCache` singleton at `continuity.ts:26` prevents isolated unit testing. `taskState` singleton at `state.ts` — multiple Maps accessible from anywhere.
- **Circular imports:** No known circular dependencies. Dependency graph max depth is 2 levels (`types.ts` → `lifecycle-manager.ts` → `delegation-manager.ts`).
- **Module size cap:** Target 500 LOC per module. `delegation-manager.ts` at 656 LOC currently exceeds this. `continuity.ts` at 455 LOC is near threshold.
- **CQRS enforcement:** `hook-cqrs-boundary.ts` `assertHookWriteBoundary()` rejects durable writes from hooks. Only tools (write-side) may mutate state.
- **No `any` types:** Policy enforced for new code. Known tech debt: `client: any` in some SDK type positions.
- **State root separation (Q6):** `.hivemind/` is canonical state root; `.opencode/` is only for OpenCode primitives. One-way migration from legacy `.opencode/state/opencode-harness/`.

## Anti-Patterns

### State Accumulation in Singleton Maps

**What happens:** `TaskStateManager` stores session stats, root budgets, and delegation meta in Maps that accumulate indefinitely — no automatic eviction for completed/terminal sessions.
**Why it's wrong:** Memory leak potential in long-running sessions with many delegations. Completed session data remains in memory.
**Do this instead:** Prune terminal sessions after configurable TTL; leverage `TASK_CLEANUP_DELAY_MS` already defined in `types.ts`.

### Module-Level Singleton Cache

**What happens:** `continuity.ts:26` `let storeCache: ContinuityStoreFile | undefined` — file-level mutable state prevents isolated unit testing of continuity functions.
**Why it's wrong:** Tests can't mock or reset the cache without modules reloading; parallel tests may observe each other's cache.
**Do this instead:** Encapsulate cache inside a class instance; inject via constructor or factory.

### DelegationManager Size

**What happens:** `delegation-manager.ts` at 656 LOC mixes orchestration, concurrency management, status transitions, recovery, persistence, PTY coordination, category gate resolution, and agent validation.
**Why it's wrong:** Breaks module size cap of 500 LOC; single change risk surface; hard to test individual concerns.
**Do this instead:** Extract PTY-specific delegation into separate handler (partially done with `command-delegation.ts` and `sdk-delegation.ts`). Extract agent validation into the spawner (partially done). Extract recovery into dedicated module.

## Error Handling

**Strategy:** All thrown errors use `[Harness]` prefix for flow control identification. Errors propagate through Promise chains and are caught at the outermost tool `execute()` layer, where they're wrapped in `ToolResponse` error envelopes.

**Patterns:**
- **Validate-early:** `assertValidSessionID()` in `session-api.ts` throws before any SDK call
- **Graceful degradation:** `bun-pty` lazy-loaded with fallback; `createPtyManagerIfSupported()` returns undefined if unavailable
- **Best-effort audit:** Event tracker writes use try/catch — never block canonical OpenCode event handling
- **Quarantine on corruption:** `continuity.ts` `quarantineCorruptFile()` renames corrupt JSON files for audit visibility
- **Idempotent operations:** `SpawnReservation.release()` and `.rollback()` are idempotent (settled flag)
- **Timeout with fallback:** `sendPrompt()` has 30s fallback polling if SDK returns empty response

## Cross-Cutting Concerns

**Logging:** No structured logging framework. Errors thrown with `[Harness]` prefix. Event tracker writes markdown artifacts to `.hivemind/event-tracker/`. Session journal provides append-only event timeline.

**Validation:** Zod v4 schemas in `schema-kernel/` for agent/command/skill frontmatter, permissions, MCP servers. `validateWithFallback()` performs strict-first then lenient validation, stripping unknown keys with warnings.

**Authentication:** Not applicable — this is a plugin within OpenCode's process. No external auth beyond OpenCode's own session management.

**Persistence:** Three persistence surfaces:
1. `continuity.ts` — session continuity as JSON (`session-continuity.json`)
2. `delegation-persistence.ts` — delegation records as JSON (`delegations.json`)
3. `config-workflow/` — turn-based workflow state as JSON (`config-workflows.json`)
All canonical paths write to `.hivemind/state/` per Q6.

**Migration (Q6):** Legacy state at `.opencode/state/opencode-harness/` supported via compatibility bridge during one-way migration. No dual-write.

---

*Architecture analysis: 2026-04-28*
