# Architecture

**Analysis Date:** 2026-04-25

## Pattern Overview

**Overall:** Plugin-based Control Plane with Event-Driven Session Orchestration

HiveMind V3 is an OpenCode plugin that acts as a **runtime composition engine** — it wires tools, hooks, and shared libraries into the OpenCode host to provide delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. There is zero business logic in the plugin layer itself; all logic lives in individual factories and library modules.

**Key Characteristics:**
- Composition root pattern — `plugin.ts` instantiates all managers, wires hooks, registers tools
- Factory-based hooks — three hook factories produce discrete hook sets (core, session, tool-guard)
- Callback-inversion in handlers — `SdkDelegationHandler` and `CommandDelegationHandler` receive callbacks from `DelegationManager` rather than owning registration/persistence
- Dual-layer state — durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`), hydrated on startup
- WaiterModel delegation — tools return immediately with a delegation ID; completion is detected via dual-signal (session.idle event + stability polling)
- Safety ceiling (not deadline) — delegations run until dual-signal confirms completion; `safetyCeilingMs` is a MAX runtime abort, not a target
- State root separation — `.hivemind/` at project root for all internal deep module state; `.opencode/` reserved for OpenCode primitives only (Q6)

## State Root Architecture (Q6)

All Hivemind internal deep module state writes to `.hivemind/` at project root. `.opencode/` is reserved exclusively for OpenCode primitives (agents, commands, skills, rules).

**Migration path:** `.opencode/state/opencode-harness/` → `.hivemind/state/` (one-way, no dual-write)

**Write Surface Table:**

| Module | Canonical Write Location | Type |
|--------|--------------------------|------|
| Session Journal | `.hivemind/journal/` | Internal deep module |
| Continuity store | `.hivemind/state/session-continuity.json` | Internal deep module |
| Delegation records | `.hivemind/state/delegations.json` | Internal deep module |
| Future graph projections | `.hivemind/graph/` | Internal deep module |
| Future vector memory | `.hivemind/vector/` | Internal deep module |
| Skills | `.opencode/skills/` | OpenCode primitive |
| Agents | `.opencode/agents/` | OpenCode primitive |
| Commands | `.opencode/commands/` | OpenCode primitive |
| Rules | `.opencode/rules/` | OpenCode primitive |

**Compatibility bridge:** Existing `.opencode/state/opencode-harness/` remains readable during transition.

## 9-Surface Mutation Authority

From Phase 16.4 architecture baseline, only the following surfaces may mutate canonical state:

| Surface | Authority | Constraint |
|---------|-----------|------------|
| `continuity.ts` | Full CRUD | Durable JSON persistence, deep-clone-on-read |
| `delegation-persistence.ts` | Delegation record I/O | Normalizes older records, writes to `.hivemind/state/` |
| `session-journal.ts` (future) | Append-only | Event timeline per session, no updates or deletes |
| `sidecar` (future) | Read-only | Reads `.hivemind/` and `.planning/` artifacts; CANNOT write |
| `DelegationManager` | Orchestration | Dispatches through canonical stores, does not bypass |
| `TaskStateManager` | In-memory state | Maps only, no direct file writes |
| `plugin.ts` | Composition root | Wires but does not implement business logic |
| Tool factories | Delegated | Return structured responses, state changes via managers |
| Hook factories | Observational | Report facts, suppress, or inject metadata; no direct state mutation |

Tools and hooks write ONLY through `DelegationManager` and `continuity`.

## Layers

**Layer 1 — Harness Core:**
- `DelegationCategory` (6 current categories) — Model routing with behavioral prompt appends
- Category prompt appends per delegation type
- Specialist routing with safe fallback

**Layer 2 — Runtime Intelligence (Q1):**
- Deep codemap/codescan — Detects project type, language, framework, complexity
- File watcher — Triggers dependency graph update on package.json changes
- MCP tools + stack skills — Synthesize tech stack at runtime (Tavily, Context7, GitHub MCP)
- Dependency graph — Tracks and updates when versions change or new registries added

**Plugin Layer (Composition Root):**
- Purpose: Assembly and wiring — no business logic
- Location: `src/plugin.ts`
- Contains: Plugin entry point, manager instantiation, hook factory calls, tool registration
- Depends on: All hook factories, all tool factories, `DelegationManager`, `HarnessLifecycleManager`
- Used by: OpenCode runtime (loads as plugin)

**Hook Layer (Event Handlers):**
- Purpose: React to OpenCode lifecycle events, transform messages, enforce tool budgets
- Location: `src/hooks/`
- Contains: Three factory modules — `create-core-hooks.ts` (event routing, message transform, shell env), `create-session-hooks.ts` (auto-loop, compaction context), `create-tool-guard-hooks.ts` (circuit breaker, tool budget, metadata injection)
- Depends on: `HarnessLifecycleManager`, `TaskStateManager`, continuity store, SDK client
- Used by: OpenCode hook system (event, messages.transform, tool.execute.before/after, etc.)

**Tool Layer (User-Facing APIs):**
- Purpose: Expose harness capabilities to agents via callable tools
- Location: `src/tools/`
- Contains: `delegate-task.ts` (dispatch work to specialist agents), `delegation-status.ts` (poll delegation state), `run-background-command.ts` (PTY/headless command execution), `prompt-skim/`, `prompt-analyze/`, `session-patch/` (prompt-enhance pipeline tools)
- Depends on: `DelegationManager`, `PtyManager`, directory context
- Used by: Agents during sessions via tool invocation

**Manager Layer (Orchestration):**
- Purpose: Core business logic for delegation, lifecycle, concurrency, completion detection
- Location: `src/lib/`
- Contains:
  - `delegation-manager.ts` — Delegation orchestration (dispatch, recovery, safety ceiling, session idle/deleted handling). Delegates SDK and command handling to `SdkDelegationHandler` and `CommandDelegationHandler`.
  - `lifecycle-manager.ts` — Session lifecycle state machine (currently minimal stub, delegates to `DelegationManager` for `launchDelegatedSession`)
  - `concurrency.ts` — Keyed semaphore with FIFO queue per model+agent+category key, priority lanes (high/normal)
  - `completion-detector.ts` — Two-signal completion detection (idle event + stability timer)
  - `state.ts` — `TaskStateManager` class: in-memory Maps for session stats, root budgets, session-to-root mapping, delegation metadata, subagent registry
  - `continuity.ts` — Durable JSON persistence with deep-clone-on-read, normalization, CRUD operations
  - `runtime-policy.ts` — Runtime policy loading, validation, per-session override resolution
  - `session-api.ts` — Typed OpenCode SDK wrappers (create, get, abort, messages, prompt, promptAsync)
  - `sdk-delegation.ts` — SDK delegation handler: stability polling, result extraction, recovery
  - `command-delegation.ts` — Command delegation handler: PTY dispatch, headless fallback, exit polling
  - `runtime.ts` — Event-to-status mapping (transport signal inference)
  - `helpers.ts` — Pure utilities: type guards, nested value extraction, SDK error unwrapping, stable stringify, prompt building
  - `types.ts` — Shared type definitions and constants (leaf node — no imports)

**Spawner Subsystem:**
- Purpose: Child session creation with permission profiles and working directory resolution
- Location: `src/lib/spawner/`
- Contains: `session-creator.ts` (SDK session creation with write-capable permissions), `spawner-types.ts` (spawn request/result contracts), `parent-directory.ts` (working directory resolution), `concurrency-key.ts` (delegation queue key builder)

**PTY Subsystem:**
- Purpose: PTY session management for interactive command execution
- Location: `src/lib/pty/`
- Contains: `pty-manager.ts` (PTY lifecycle: spawn, write, read, terminate via `bun-pty`), `pty-buffer.ts` (ring buffer for PTY output), `pty-types.ts` (PTY type contracts)

**Shared Layer:**
- Purpose: Cross-cutting tool utilities
- Location: `src/shared/`
- Contains: `tool-response.ts` (standard response envelope with success/error/pending kinds), `tool-helpers.ts` (JSON serialization helper)

**Schema Kernel:**
- Purpose: Zod schemas for prompt-enhance pipeline contracts
- Location: `src/schema-kernel/`
- Contains: `prompt-enhance.schema.ts` (schemas for skim, analyze, patch), `index.ts` (barrel re-exports)

## Data Flow

**Delegation Dispatch (SDK Mode):**

1. Agent calls `delegate-task` tool with `agent` + `prompt`
2. `createDelegateTaskTool` validates input via Zod schema, calls `DelegationManager.dispatch()`
3. `DelegationManager` validates agent against runtime registry, builds queue key, acquires semaphore slot
4. `spawnDelegatedSession()` creates child session via SDK with write-capable permissions
5. `DelegationManager` registers delegation (in-memory Map + persisted JSON), sends prompt to child via `client.session.prompt()`
6. Tool returns immediately with `{ delegationId, status: "dispatched" }`
7. `DelegationManager` transitions status to `"running"` after prompt succeeds
8. On `session.idle` event, `handleSessionIdle()` triggers stability polling via `SdkDelegationHandler`
9. Stability polls check message count; after `STABILITY_THRESHOLD` (3) consecutive unchanged polls, delegation is finalized
10. Result extracted via `extractAllAssistantText()`, status set to `"completed"`, cleanup performed

**Command Dispatch (PTY Mode):**

1. Agent calls `run-background-command` tool with `command` + `args`
2. `DelegationManager.dispatchCommand()` builds queue key, acquires semaphore
3. `CommandDelegationHandler.dispatchCommand()` attempts PTY spawn via `PtyManager`
4. If PTY unavailable, falls back to headless `child_process.spawn()`
5. PTY exit polling at 250ms intervals checks `exitCode`
6. On exit, delegation finalized with output + exit code

**Event Routing:**

1. OpenCode fires events (session.created, session.idle, session.deleted, etc.)
2. `createCoreHooks` event handler extracts `eventType` + `sessionID`
3. `HarnessLifecycleManager.handleEvent()` feeds `CompletionDetector`
4. Event observers (`delegationEventObserver`, `sessionEventObserver`) handle delegation-specific logic
5. `createSessionHooks` event handler drives auto-loop on `session.idle` for delegation packets

**Tool Guard Enforcement:**

1. `tool.execute.before` hook intercepts every tool call
2. Increments per-session tool call counter in `TaskStateManager`
3. Checks against `maxToolCallsPerSession` (default 400) — throws if exceeded
4. Builds tool signature (tool name + stable-stringified args), tracks repeated calls
5. Checks against `repeatedSignatureThreshold` (default 16) — circuit breaker trips if exceeded
6. `tool.execute.after` hook injects `_harness` metadata into tool output (stats, warnings, delegation info, continuity snapshot)

**State Management:**
- **In-memory:** `TaskStateManager` singleton (`state.ts`) holds session stats, root budgets, delegation metadata, subagent registry — all as `Map<string, ...>`
- **Durable:** `continuity.ts` persists to `.opencode/state/opencode-harness/session-continuity.json` — deep-clone-on-read prevents mutation aliasing
- **Hydration:** On plugin startup, `lifecycleManager.hydrateFromContinuity()` loads all session records into in-memory Maps
- **Recovery:** `DelegationManager.recoverPending()` restores running/dispatched delegations from persisted JSON, re-attaches to live sessions

## Key Abstractions

**Delegation:**
- Purpose: Represents a unit of work dispatched to a specialist agent or command
- Examples: `src/lib/types.ts` (Delegation interface), `src/lib/delegation-manager.ts` (dispatch/registration)
- Pattern: WaiterModel — dispatch returns immediately, completion detected asynchronously via dual-signal

**Continuity Record:**
- Purpose: Persistent metadata for each session — status, delegation info, lifecycle state, pending notifications, result capture
- Examples: `src/lib/types.ts` (SessionContinuityRecord, SessionContinuityMetadata), `src/lib/continuity.ts` (CRUD operations)
- Pattern: Single JSON file with versioned schema, deep-clone-on-read, atomic writes

**Runtime Policy:**
- Purpose: Configurable limits for concurrency, tool budgets, circuit breaker thresholds
- Examples: `src/lib/types.ts` (RuntimePolicy, ConcurrencyPolicy, BudgetPolicy), `src/lib/runtime-policy.ts` (loading, validation, per-session overrides)
- Pattern: Defaults hardcoded, workspace-level overrides loaded at startup, per-session overrides from trusted delegation metadata only

**Concurrency Queue:**
- Purpose: Keyed semaphore preventing resource exhaustion per model/agent/category combination
- Examples: `src/lib/concurrency.ts` (DelegationConcurrencyQueue class), `src/lib/spawner/concurrency-key.ts` (key builder)
- Pattern: FIFO queue per lane with priority (high/normal), configurable limit (default 3), optional acquire timeout

**Completion Detection:**
- Purpose: Determine when a delegated session has finished working
- Examples: `src/lib/completion-detector.ts` (CompletionDetector class), `src/lib/sdk-delegation.ts` (stability polling)
- Pattern: Two-signal — `session.idle` event triggers stability polling; 3 consecutive polls with unchanged message count confirms completion

## Entry Points

**Plugin Entry Point:**
- Location: `src/plugin.ts` → `HarnessControlPlane`
- Triggers: OpenCode loads plugin at startup
- Responsibilities: Instantiate managers, create hooks, register tools, recover pending delegations, hydrate continuity state

**Public API:**
- Location: `src/index.ts`
- Triggers: Consumer imports `opencode-harness` or `opencode-harness/plugin`
- Responsibilities: Re-export `HarnessControlPlane` as default + all library modules for external use

**Tool Entry Points:**
- `delegate-task` — `src/tools/delegate-task.ts` — Dispatch work to specialist agent
- `delegation-status` — `src/tools/delegation-status.ts` — Poll delegation state
- `run-background-command` — `src/tools/run-background-command.ts` — Execute command in PTY/headless
- `prompt-skim` — `src/tools/prompt-skim/index.ts` — Quick prompt assessment
- `prompt-analyze` — `src/tools/prompt-analyze/index.ts` — Deep prompt analysis
- `session-patch` — `src/tools/session-patch/index.ts` — Patch session file sections

## Error Handling

**Strategy:** `[Harness]`-prefixed errors for flow control, not bugs. All thrown errors include this prefix for easy filtering.

**Patterns:**
- SDK errors unwrapped via `unwrapData()` in `helpers.ts` — extracts human-readable message from varying SDK error shapes
- Tool calls wrapped in try/catch — errors returned as `{ kind: "error", message: ... }` envelope
- Safety ceiling aborts are best-effort — `client.session.abort()` caught with no-op on failure
- Continuity writes are atomic — write to temp file then rename (prevents corruption on crash)
- Module-level singletons (`storeCache` in `continuity.ts`, `taskState` in `state.ts`) — process-wide shared state

## Cross-Cutting Concerns

**Logging:** No dedicated logging framework — warnings stored in `SessionStats.warnings[]` array (capped at 25 per session), surfaced via `_harness` metadata in tool outputs

**Validation:** Zod schemas for tool inputs (`DelegateTaskInputSchema`), runtime policy validation at load time, session ID format validation (`ses` prefix check)

**Authentication:** Delegated to OpenCode host — harness operates within authenticated session context

**Concurrency Control:** Keyed semaphore with per-lane limits, safety ceiling timers, circuit breaker on repeated tool signatures

**Persistence:** Durable JSON files in `.hivemind/state/` for all canonical state — `session-continuity.json`, `delegations.json`. Migration from `.opencode/state/opencode-harness/` in progress (Q6).

---

*Architecture analysis: 2026-04-25*
