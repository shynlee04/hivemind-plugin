<!-- refreshed: 2026-05-15 -->
# Architecture

**Analysis Date:** 2026-05-15

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        OpenCode Runtime                                  │
│                        (Plugin Host)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                      HarnessControlPlane                                  │
│                      `src/plugin.ts` — composition root                  │
├──────────────┬──────────────────┬──────────────────┬────────────────────┤
│   Tools      │   Hooks          │   Coordination   │   Task-Management  │
│   (write)    │   (read/CQRS)    │   (dispatch)     │   (state)          │
│ `src/tools/` │ `src/hooks/`     │ `src/coord/`     │ `src/task-mgmt/`   │
├──────┬───────┴──────┬───────────┴──────┬───────────┴──────┬─────────────┤
│Routing│  Features    │   Schema-Kernel  │   Config         │   Shared     │
│`src/` │ `src/feat/`  │ `src/schema/`    │ `src/config/`    │ `src/shared/`│
└───┬───┴──────┬───────┴────────┬─────────┴────────┬─────────┴──────┬─────┘
    │          │                │                  │                │
    ▼          ▼                ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  `.hivemind/` — Internal State Root (journals, continuity, lineage)     │
│  `.opencode/` — Soft Meta-Concepts (agents, commands, skills — NO state)│
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| HarnessControlPlane | Plugin composition: wires tools, hooks, lifecycle, delegation | `src/plugin.ts` |
| DelegationManager | WaiterModel dispatch, dual-signal completion, category gates | `src/coordination/delegation/manager.ts` |
| HarnessLifecycleManager | Session lifecycle state machine (created→queued→dispatching→running→completed/failed) | `src/task-management/lifecycle/index.ts` |
| DelegationConcurrencyQueue | Per-key lane-based concurrency gating with priority | `src/coordination/concurrency/queue.ts` |
| CompletionDetector | Dual-signal completion (idle + message stability) | `src/coordination/completion/detector.ts` |
| SessionTracker | Session knowledge capture, hierarchy persistence | `src/features/session-tracker/index.ts` |
| ContinuityStore | Dual-layer state: in-memory Maps + `.hivemind/state/` JSON | `src/task-management/continuity/index.ts` |
| SchemaKernel | Zod v4 validation contracts for all meta-concepts | `src/schema-kernel/index.ts` |
| ConfigSubscriber | Lazy-load + cache Hivemind configs per project | `src/config/subscriber.ts` |
| SessionEntry | Intake classification: purpose, language, profile, routing | `src/routing/session-entry/index.ts` |
| BehavioralProfile | Config-first profile resolution with lazy cache | `src/routing/behavioral-profile/index.ts` |
| CommandEngine | Bounded command context discovery and rendering | `src/routing/command-engine/index.ts` |

## Pattern Overview

**Overall:** CQRS (Command Query Responsibility Segregation) with dependency injection

**Key Characteristics:**
- **Tools are write-side** — only tools (`src/tools/`) perform durable mutations via SDK calls
- **Hooks are read-side** — hooks observe events, shape responses, guard decisions; `assertHookWriteBoundary()` enforces CQRS (`src/hooks/composition/cqrs-boundary.ts`)
- **Plugin is thin composition root** — `src/plugin.ts` wires factories, registers tools, spreads hook return objects; zero business logic
- **Dependency injection everywhere** — factories receive managers via constructor args, never import globals
- **Leaf-like shared layer** — `src/shared/` imports from nothing deeper; all other layers consume it

## Layers

**Composition Layer:**
- Purpose: Assemble plugin, wire hooks, register tools
- Location: `src/plugin.ts`
- Contains: Factory instantiation, hook spread-merge, tool registration map
- Depends on: All surface layers (tools, hooks, coordination, task-management, features)
- Used by: OpenCode runtime loader (`.opencode/plugins/harness-control-plane.ts`)

**Tool Layer (Write-Side / CQRS Mutation):**
- Purpose: Entry points for harness tools exposed to OpenCode agents
- Location: `src/tools/` (delegation, session, prompt, hivemind, config)
- Contains: Tool factory functions returning OpenCode tool definitions
- Depends on: Coordination (DelegationManager), schema-kernel, shared, features
- Used by: OpenCode runtime via plugin tool map

**Hook Layer (Read-Side / CQRS Observation):**
- Purpose: Observe OpenCode lifecycle events, shape responses, guard decisions
- Location: `src/hooks/` (lifecycle, guards, transforms, observers, composition)
- Contains: Factory functions returning hook handlers keyed by OpenCode hook names
- Depends on: Lifecycle manager, state manager, runtime policy (injected)
- Used by: OpenCode runtime via plugin hook spread

**Coordination Layer (Dispatch):**
- Purpose: Delegate child sessions, gate concurrency, detect completion, spawn sessions
- Location: `src/coordination/` (delegation, completion, concurrency, sdk-delegation, command-delegation, spawner)
- Contains: DelegationManager, CompletionDetector, DelegationConcurrencyQueue, handlers
- Depends on: Shared types, task-management (persistence), features (PTY), routing (behavioral profile)
- Used by: Tools (delegate-task), hooks (event routing), plugin (composition)

**Task-Management Layer (State):**
- Purpose: Durable state persistence, lifecycle state machine, journal, trajectory, recovery
- Location: `src/task-management/` (continuity, journal, lifecycle, recovery, trajectory)
- Contains: ContinuityStore, HarnessLifecycleManager, journal append/query/replay, trajectory ledger
- Depends on: Shared types, coordination (CompletionDetector, notification handler)
- Used by: Hooks (event routing), tools (state reads), plugin (composition)

**Features Layer (Standalone Runtime):**
- Purpose: Self-contained runtime features that don't fit other layers
- Location: `src/features/` (session-tracker, bootstrap, background-command/pty, prompt-packet, doc-intelligence, runtime-pressure, agent-work-contracts, sdk-supervisor, steering-engine)
- Contains: PTY manager, session tracker, prompt packet builders, bootstrap detectors, pressure classifier
- Depends on: Shared, coordination (spawner), schema-kernel
- Used by: Tools, hooks, plugin

**Schema-Kernel Layer (Validation Leaf):**
- Purpose: Zod v4 schemas for all OpenCode meta-concept validation
- Location: `src/schema-kernel/` (16 schema files + barrel)
- Contains: Agent/command/skill frontmatter, permissions, MCP servers, prompt-enhance, configs, trajectory, pressure, SDK supervisor, command engine, doc intelligence, bootstrap, agent work contracts
- Depends on: zod (external only)
- Used by: Tools, config, features, bootstrap

**Config Layer (Compilation):**
- Purpose: Compile workspace config into runtime policy, manage config workflow state machine
- Location: `src/config/` (subscriber, compiler, workflow)
- Contains: Lazy config cache, schema-based config reader, workflow state machine
- Depends on: Schema-kernel (hivemind-configs schema)
- Used by: Plugin, tools, coordination

**Routing Layer (Classification):**
- Purpose: Session intake classification, behavioral profile resolution, command engine
- Location: `src/routing/` (session-entry, behavioral-profile, command-engine)
- Contains: Purpose classifier, language detector, profile resolver, intake gate
- Depends on: Config (subscriber), shared
- Used by: Hooks (guard decisions), tools (session classification)

**Shared Layer (Leaf Utilities):**
- Purpose: Cross-cutting types, helpers, response envelopes, state managers, session API wrappers
- Location: `src/shared/` (types, helpers, state, session-api, tool-response, runtime-policy, security)
- Contains: TaskStatus, HarnessStatus, RuntimePolicy, ContinuityStore types, sendPromptAsync, tool response rendering
- Depends on: Nothing deeper (leaf constraint)
- Used by: All layers

## Data Flow

### Primary Request Path (Tool Dispatch)

1. **Agent invokes tool** — OpenCode routes tool call to harness via plugin tool map (`src/plugin.ts:216-239`)
2. **Tool validates input** — Schema kernel validates args (`src/schema-kernel/*.schema.ts`)
3. **Tool calls manager** — e.g., `delegate-task` → `DelegationManager.dispatch()` (`src/coordination/delegation/manager.ts:163`)
4. **Concurrency gate acquired** — `DelegationConcurrencyQueue.acquire()` with per-key lane (`src/coordination/concurrency/queue.ts:70`)
5. **Category gate evaluated** — `resolveCategoryGateDecision()` checks agent-category pairing (`src/coordination/delegation/category-gates.ts`)
6. **Child session spawned** — `spawnDelegatedSession()` via SDK (`src/coordination/spawner/session-creator.ts`)
7. **Prompt sent async** — `sendPromptAsync()` dispatches child (`src/shared/session-api.ts`)
8. **State registered** — `DelegationStateMachine.registerDelegation()` + persist (`src/coordination/delegation/state-machine.ts`)
9. **Result returned** — `buildDelegationResult()` to caller (`src/coordination/delegation/state-machine.ts`)

### Hook Event Path (Read-Side)

1. **OpenCode emits event** — e.g., `session.idle`, `tool.execute.before`, `chat.message`
2. **Hook factory handles** — e.g., `createToolBeforeGuard()` runs circuit breaker + budget guard (`src/hooks/transforms/tool-before-guard.ts`)
3. **Event routed to manager** — `HarnessLifecycleManager.handleEvent()` feeds CompletionDetector (`src/task-management/lifecycle/index.ts:133`)
4. **Observer consumers react** — `createDelegationConsumer()`, `createSessionTrackerConsumer()` process facts (`src/hooks/observers/`)
5. **Response shaped** — `createToolAfterComposer()` / `createChatMessageCapture()` shape output (`src/hooks/transforms/`)

### Session Entry Path (Intake)

1. **Session created** — OpenCode fires `session.created` event
2. **Intake gate resolves** — `resolveIntake()` classifies purpose, detects language, resolves profile (`src/routing/session-entry/intake-gate.ts`)
3. **Behavioral profile cached** — `resolveBehavioralProfile()` loads config-first profile (`src/routing/behavioral-profile/resolve-behavior-profile.ts`)
4. **Hooks consume** — `createSessionEntryConsumer()` observes intake for downstream guard behavior (`src/hooks/observers/session-entry-consumer.ts`)

**State Management:**
- Dual-layer: in-memory Maps (`src/shared/state.ts`) + durable JSON (`.hivemind/state/`)
- Deep-clone-on-read in continuity store
- Append-only journal for event timeline (`src/task-management/journal/`)
- Session tracker writes hierarchy manifests to `.hivemind/` (`src/features/session-tracker/persistence/`)

## Key Abstractions

**Delegation (WaiterModel):**
- Purpose: Asynchronous child session dispatch with dual-signal completion
- Examples: `src/coordination/delegation/manager.ts`, `src/coordination/delegation/state-machine.ts`
- Pattern: SDK dispatch (async) + command dispatch (PTY/headless), completion via idle + message stability

**CQRS Boundary:**
- Purpose: Enforce that hooks never perform durable writes
- Examples: `src/hooks/composition/cqrs-boundary.ts`
- Pattern: `classifyHookEffect()` + `assertHookWriteBoundary()` — hooks classified as observation/response-shaping/guard-decision only

**Continuity Store:**
- Purpose: Dual-layer session state persistence
- Examples: `src/task-management/continuity/index.ts`
- Pattern: In-memory Map for fast reads + JSON file for durability; deep-clone-on-read

**Schema Kernel:**
- Purpose: Strict-first validation with graceful unknown-field stripping
- Examples: `src/schema-kernel/index.ts` — `validateWithFallback()`
- Pattern: Strict schema parse → if only unrecognized keys → lenient parse + warning

**Runtime Policy:**
- Purpose: Concurrency limits, budget caps, category gates, delegation depth
- Examples: `src/shared/types.ts` (RuntimePolicy, BudgetPolicy, ConcurrencyPolicy)
- Pattern: Workspace defaults → config file → per-session override resolution

## Entry Points

**Plugin Composition:**
- Location: `src/plugin.ts` — `HarnessControlPlane`
- Triggers: OpenCode loads plugin at startup
- Responsibilities: Wire all tools, hooks, lifecycle, delegation, session tracker, PTY manager

**Public API Re-exports:**
- Location: `src/index.ts`
- Triggers: `import hivemind` or `import hivemind/plugin`
- Responsibilities: Re-export HarnessControlPlane, concurrency, continuity, helpers, lifecycle, runtime, session-api, state, types, task-status, completion detector, journal, trajectory, pressure, work contracts, SDK supervisor, command engine, bootstrap

**CLI Substrate:**
- Location: `src/cli/` (router, discovery, commands: version, init, help, doctor, recover)
- Triggers: `npx hivemind <command>`
- Responsibilities: CLI entry, command discovery, project doctor, recovery

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop; PTY operations via optional `bun-pty` dependency (falls back to `node:child_process` on Node); async dispatch only for child sessions (Phase 46.1)
- **Global state:** Module-level caches in `src/config/subscriber.ts` (config cache), `src/shared/state.ts` (taskState Maps), `src/coordination/concurrency/queue.ts` (lane Map)
- **Circular imports:** Avoided via dependency injection; `DelegationManager` ↔ `HarnessLifecycleManager` circularity resolved by `setCompletionDetector()` setter pattern (`src/plugin.ts:97`)
- **Module size:** Max 500 LOC per module; `session-tracker/index.ts` (1035 LOC) is the known outlier requiring future split
- **ESM strict:** `.js` import extensions required, `import type` for type-only imports, `verbatimModuleSyntax: true`

## Anti-Patterns

### Business Logic in plugin.ts

**What happens:** Adding dispatch, state transitions, or validation logic directly in `src/plugin.ts`
**Why it's wrong:** `plugin.ts` is a thin composition root — business logic here breaks testability and violates the 9-surface model
**Do this instead:** Put logic in `src/coordination/`, `src/task-management/`, `src/features/`, or `src/tools/`; wire via factory injection in plugin.ts (`src/plugin.ts:1-7`)

### Durable Writes from Hooks

**What happens:** A hook function writing to `.hivemind/state/` or calling SDK mutation methods
**Why it's wrong:** Hooks are read-side in the CQRS model; only tools have mutation authority
**Do this instead:** Hook observes event → passes fact to injected manager → manager performs write via tool path (`src/hooks/composition/cqrs-boundary.ts:32-35`)

### Deep Imports from Shared

**What happens:** `src/shared/` importing from `src/tools/`, `src/hooks/`, `src/features/`, etc.
**Why it's wrong:** `src/shared/` must remain leaf-like; deep imports create circular dependencies
**Do this instead:** Shared defines contracts (types, helpers); deeper layers import shared, not vice versa (`src/shared/AGENTS.md`)

### State in .opencode/

**What happens:** Writing journals, delegation records, or continuity data to `.opencode/`
**Why it's wrong:** `.opencode/` is for Soft Meta-Concepts only (agents, commands, skills); internal state belongs in `.hivemind/` per Q6 decision
**Do this instead:** All durable state writes go through `.hivemind/state/` via continuity store (`src/task-management/continuity/index.ts`)

## Error Handling

**Strategy:** `[Harness]` prefix on all thrown errors; best-effort for non-critical paths; strict validation for tool inputs

**Patterns:**
- Tool inputs validated via schema kernel with `validateWithFallback()` — strict first, lenient fallback with warnings
- Async dispatch failures transition delegation to terminal state (`src/coordination/delegation/manager.ts:252-255`)
- Best-effort hooks: session tracker captures, message capture, tool-after workflow — all wrapped in try/catch, never fail the tool call
- Recovery: `recoverPending()` at startup re-polls non-terminal delegations; headless PTY delegations surface `terminalKind: "non-resumable-after-restart"`

## Cross-Cutting Concerns

**Logging:** `client.app?.log?.()` with `[Harness]` prefix in message body; service-tagged (`delegation`, `session-tracker`, `migration`); warn level for non-fatal, error for failures
**Validation:** Zod v4 schemas in `src/schema-kernel/` for all tool inputs, config files, frontmatter, permissions; `validateWithFallback()` for graceful degradation
**Authentication:** Delegated to OpenCode runtime; harness enforces category gates and permission profiles at dispatch time

---

*Architecture analysis: 2026-05-15*
