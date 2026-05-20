---
mapped_date: 2026-05-20
last_mapped_commit: 906b21a055352fdeca3b7a1209c7c7be3f529cf7
focus: arch
---

<!-- refreshed: 2026-05-20 -->
# Architecture

**Analysis Date:** 2026-05-20

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ OpenCode runtime                                                             │
│ Loads package plugin export from `src/plugin.ts` through project primitives  │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ `src/plugin.ts` — HarnessControlPlane composition root                       │
│ Instantiates managers, starts recovery, registers hooks, registers tools      │
├──────────────┬───────────────┬────────────────┬─────────────────────────────┤
│ Tools        │ Hooks         │ Coordination   │ Task management             │
│ `src/tools/` │ `src/hooks/`  │ `src/coordination/` │ `src/task-management/` │
│ write-side   │ read-side     │ dispatch       │ durable state/lifecycle     │
├──────────────┼───────────────┼────────────────┼─────────────────────────────┤
│ Features     │ Routing       │ Config         │ Schema kernel / Shared      │
│ `src/features/` │ `src/routing/` │ `src/config/` │ `src/schema-kernel/`, `src/shared/` │
└───────┬──────┴───────┬───────┴──────┬─────────┴───────────────┬─────────────┘
        │              │              │                         │
        ▼              ▼              ▼                         ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────┐ ┌────────────────────────┐
│ `.hivemind/` │ │ `.opencode/` │ │ `.planning/`   │ │ npm package surfaces   │
│ state root   │ │ primitives   │ │ governance     │ │ `dist/`, `bin/`        │
└──────────────┘ └──────────────┘ └────────────────┘ └────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| HarnessControlPlane | Composition root for runtime dependencies, tools, hooks, lifecycle, delegation, config, and session tracker | `src/plugin.ts` |
| Public API | Package re-exports for plugin, lifecycle, continuity, runtime, command engine, pressure, trajectory, and bootstrap APIs | `src/index.ts` |
| CLI substrate | `hivemind` bin command router and built-in commands | `src/cli/index.ts`, `src/cli/router.ts`, `bin/hivemind.cjs` |
| Delegation facade | Stable public `DelegationManager` API delegating to v2 coordinator or runtime adapter | `src/coordination/delegation/manager.ts` |
| Delegation coordinator | Preflight, record creation, child session start, model inheritance, monitoring, and completion cleanup | `src/coordination/delegation/coordinator.ts` |
| Lifecycle manager | Session lifecycle event routing, completion detector ownership, continuity hydration, pending notification replay | `src/task-management/lifecycle/index.ts` |
| Continuity store | Canonical `.hivemind/state/session-continuity.json` persistence with legacy read compatibility and clone-on-read | `src/task-management/continuity/index.ts` |
| Session tracker | Hook-driven session knowledge capture under `.hivemind/session-tracker/` | `src/features/session-tracker/index.ts` |
| CQRS boundary | Hook effect classification and durable-write rejection | `src/hooks/composition/cqrs-boundary.ts` |
| Command engine | Read-only command discovery, contract analysis, context rendering, and route preview | `src/routing/command-engine/index.ts` |
| Config compiler | Project/global OpenCode primitive compilation and path validation | `src/config/compiler.ts` |
| Sidecar read guard | Read-only access to `.hivemind/state/` and `.planning/`; explicit write refusal | `src/sidecar/readonly-state.ts` |
| Schema kernel | Zod validation authority for tool inputs, primitives, config, pressure, session tracker, trajectory | `src/schema-kernel/index.ts` |
| Shared leaf layer | Types, SDK wrappers, state maps, response envelopes, runtime policy, path/redaction helpers | `src/shared/` |

## Pattern Overview

**Overall:** Thin OpenCode plugin composition root with CQRS boundaries, dependency injection, typed schema validation, and canonical state separation.

**Key Characteristics:**
- Keep `src/plugin.ts` as an assembly file: instantiate dependencies, spread hook factories, and register tool factories only.
- Use `src/tools/` as the OpenCode tool entry layer. Tool factories validate inputs and call deeper modules.
- Use `src/hooks/` as the read-side layer. Hooks observe OpenCode events, shape responses, and make guard decisions; durable writes are forbidden by `src/hooks/composition/cqrs-boundary.ts`.
- Store runtime state only under `.hivemind/`; never store internal state in `.opencode/`.
- Keep `.opencode/` as Soft Meta-Concepts: agents, commands, skills, rules, permissions, and thin plugin loader wrappers.
- Keep `src/shared/` leaf-like. Deeper modules import shared contracts; shared modules must not import tools, hooks, coordination, features, or task-management modules.
- Keep `src/schema-kernel/` validation-oriented and dependency-light; schemas depend on `zod` and are consumed by tools/config/features.

## Layers

**Composition Layer:**
- Purpose: Wire runtime dependencies and expose OpenCode plugin surfaces.
- Location: `src/plugin.ts`.
- Contains: `HarnessControlPlane`, `setupDelegationModules()`, lifecycle/session tracker setup, hook registration, tool map.
- Depends on: All runtime layers by factory injection.
- Used by: `src/index.ts`, package export `hivemind/plugin`, `.opencode/plugins/harness-control-plane.ts`.

**Tool Layer (CQRS Write-Side):**
- Purpose: OpenCode-callable tools that perform validated actions.
- Location: `src/tools/`.
- Contains: `src/tools/delegation/`, `src/tools/session/`, `src/tools/prompt/`, `src/tools/hivemind/`, `src/tools/config/`.
- Depends on: `src/schema-kernel/`, `src/shared/`, `src/coordination/`, `src/task-management/`, `src/features/`, `src/config/`, `src/routing/`.
- Used by: The tool map in `src/plugin.ts:397-425`.

**Hook Layer (CQRS Read-Side):**
- Purpose: Observe OpenCode lifecycle and tool/chat events, shape outputs, and apply guard decisions.
- Location: `src/hooks/`.
- Contains: `src/hooks/lifecycle/`, `src/hooks/guards/`, `src/hooks/transforms/`, `src/hooks/observers/`, `src/hooks/composition/`.
- Depends on: Injected lifecycle/session tracker/delegation/state dependencies and shared types.
- Used by: Hook spread in `src/plugin.ts:353-452`.

**Coordination Layer:**
- Purpose: Delegation orchestration, child session dispatch, completion detection, concurrency, SDK/command delegation, spawner logic.
- Location: `src/coordination/`.
- Contains: `src/coordination/delegation/`, `src/coordination/completion/`, `src/coordination/concurrency/`, `src/coordination/sdk-delegation/`, `src/coordination/command-delegation/`, `src/coordination/spawner/`.
- Depends on: `src/shared/`, selected `src/features/` modules such as PTY support, and injected OpenCode client surfaces.
- Used by: Delegation tools, lifecycle manager, plugin composition.

**Task-Management Layer:**
- Purpose: Durable state, lifecycle state machine, continuity, journal, recovery, trajectory.
- Location: `src/task-management/`.
- Contains: `src/task-management/continuity/`, `src/task-management/journal/`, `src/task-management/lifecycle/`, `src/task-management/trajectory/`.
- Depends on: `src/shared/` contracts and selected coordination signals.
- Used by: Tools, hooks, coordination, plugin composition.

**Feature Layer:**
- Purpose: Standalone runtime features not owned by routing/config/coordination/task-management.
- Location: `src/features/`.
- Contains: `agent-work-contracts/`, `auto-loop/`, `background-command/`, `bootstrap/`, `doc-intelligence/`, `prompt-packet/`, `ralph-loop/`, `runtime-pressure/`, `sdk-supervisor/`, `session-tracker/`.
- Depends on: `src/shared/`, `src/schema-kernel/`, selected coordination helpers.
- Used by: Tools, hooks, routing, plugin composition, public API exports.

**Routing Layer:**
- Purpose: Session-entry classification, behavioral-profile resolution, command discovery and preview routing.
- Location: `src/routing/`.
- Contains: `src/routing/session-entry/`, `src/routing/behavioral-profile/`, `src/routing/command-engine/`.
- Depends on: `src/config/`, `src/features/bootstrap/`, `src/features/runtime-pressure/`, shared contracts.
- Used by: Hooks, tools, plugin composition, public API exports.

**Config Layer:**
- Purpose: Compile OpenCode primitives and Hivemind config into runtime policy/workflow state.
- Location: `src/config/`.
- Contains: `src/config/compiler.ts`, `src/config/subscriber.ts`, `src/config/workflow/`.
- Depends on: `src/schema-kernel/`, filesystem/path helpers, external markdown/YAML parsers.
- Used by: Config tools and plugin startup.

**Schema-Kernel Layer:**
- Purpose: Runtime validation contracts and generated config schema support.
- Location: `src/schema-kernel/`.
- Contains: `*.schema.ts` files and `src/schema-kernel/generate-config-json-schema.ts`.
- Depends on: `zod` only for schemas; generator also writes generated schema assets during build.
- Used by: Tools, config compiler, features, tests.

**Shared Layer:**
- Purpose: Leaf contracts and utility functions used by every deeper layer.
- Location: `src/shared/`.
- Contains: `types.ts`, `session-api.ts`, `state.ts`, `runtime-policy.ts`, `workspace-runtime-policy.ts`, `tool-response.ts`, `tool-helpers.ts`, `security/`.
- Depends on: Node/external basics only; no deep runtime imports.
- Used by: All hard-harness modules.

**Sidecar Read-Only Layer:**
- Purpose: Read-only projection helpers for future/sidecar dashboards.
- Location: `src/sidecar/readonly-state.ts`.
- Contains: canonical state path checks, read helper, write refusal helper.
- Depends on: Node filesystem/path only.
- Used by: Sidecar/dashboard consumers; not part of write-side state authority.

## Data Flow

### Plugin Startup Path

1. OpenCode loads `HarnessControlPlane` from package export through plugin configuration (`src/plugin.ts:219`).
2. The plugin resolves the project directory, loads runtime policy and Hivemind config (`src/plugin.ts:219-236`).
3. Optional PTY support is created through `createPtyManagerIfSupported()` (`src/plugin.ts:236`).
4. Delegation modules are assembled through `setupDelegationModules()` (`src/plugin.ts:155-216`).
5. `SessionTracker` and `HarnessLifecycleManager` are instantiated and hydrated (`src/plugin.ts:246-256`).
6. Recovery paths start best-effort: `delegationManager.recoverPending()`, pending notification replay, session tracker initialization/cleanup (`src/plugin.ts:241-287`).
7. Hook factories and tool factories are returned to OpenCode (`src/plugin.ts:353-452`).

### Delegation Tool Path

1. An agent calls `delegate-task`, registered in `src/plugin.ts:397-399`.
2. `createDelegateTaskTool()` validates and normalizes tool input (`src/tools/delegation/delegate-task.ts`).
3. The tool calls `DelegationManager.dispatch()` (`src/coordination/delegation/manager.ts:72-76`).
4. `DelegationCoordinator.dispatch()` runs preflight, creates a delegation ID/record, registers it, and routes notification ownership (`src/coordination/delegation/coordinator.ts:71-134`).
5. If a child session starter is available, the coordinator inherits parent model/provider IDs and starts the child session (`src/coordination/delegation/coordinator.ts:82-127`).
6. The monitor starts and dual-signal completion is watched (`src/coordination/delegation/coordinator.ts:128-134`).
7. Status and evidence-level fields return through the tool response envelope.

### Hook Event Path

1. OpenCode emits lifecycle, chat, or tool events.
2. Core/session hooks route lifecycle facts into `HarnessLifecycleManager.handleEvent()` and observer consumers (`src/plugin.ts:353-357`).
3. `tool.execute.before` applies guard behavior and proactive session-tracker discovery (`src/plugin.ts:361-377`).
4. `chat.message` records child message signals and invokes `createChatMessageCapture()` (`src/plugin.ts:378-396`).
5. `tool.execute.after` summarizes output, records child tool signals, captures tool metadata, and runs workflow post-processing (`src/plugin.ts:428-452`).
6. Hook-side operations remain observation/response-shaping/guard-decision; durable write authority stays outside hook files.

### State Persistence Path

1. Continuity functions resolve the canonical file under `.hivemind/state/session-continuity.json` unless explicit environment overrides are present (`src/task-management/continuity/index.ts:31-44`).
2. Legacy `.opencode/state/hivemind/session-continuity.json` is read only for backward compatibility (`src/task-management/continuity/index.ts:21-48`).
3. Reads hydrate in-memory cache and clone returned records to avoid mutation aliasing (`src/task-management/continuity/index.ts:138-151`, `src/task-management/continuity/index.ts:239-260`).
4. Writes are owned by continuity/task-management helpers, not `.opencode/` primitives.

### Command Engine Path

1. `hivemind-command-engine` is registered in `src/plugin.ts:414`.
2. The tool invokes `executeCommandEngineAction()` in `src/routing/command-engine/index.ts:130-159`.
3. Discovery reads OpenCode command primitives through `loadPrimitives()` (`src/routing/command-engine/index.ts:27-41`).
4. Analysis, context rendering, message transform, and route preview return bounded results without executing commands (`src/routing/command-engine/index.ts:49-120`).

**State Management:**
- Runtime state root: `.hivemind/`.
- Continuity: `.hivemind/state/session-continuity.json` via `src/task-management/continuity/index.ts`.
- Delegations: `.hivemind/state/delegations.json` via `src/task-management/continuity/delegation-persistence.ts`.
- Session knowledge: `.hivemind/session-tracker/` via `src/features/session-tracker/`.
- Planning/governance: `.planning/` is documentation and phase authorization, not runtime state.
- Soft primitives: `.opencode/` configures OpenCode behavior, not harness state.

## Key Abstractions

**HarnessControlPlane:**
- Purpose: OpenCode plugin entry and dependency assembler.
- Examples: `src/plugin.ts`, `src/index.ts`.
- Pattern: Thin composition root with factory injection.

**Delegation (WaiterModel):**
- Purpose: Track delegated child sessions from dispatch through terminal status.
- Examples: `src/coordination/delegation/manager.ts`, `src/coordination/delegation/coordinator.ts`, `src/coordination/delegation/types.ts`.
- Pattern: Preflight → record → child session → monitor → dual-signal completion → notification/persistence cleanup.

**Lifecycle State:**
- Purpose: Session lifecycle transitions and completion signal cache.
- Examples: `src/task-management/lifecycle/index.ts`.
- Pattern: Valid transition table plus event feeding to `CompletionDetector`.

**CQRS Hook Boundary:**
- Purpose: Prevent hidden durable writes in hook execution contexts.
- Examples: `src/hooks/composition/cqrs-boundary.ts`.
- Pattern: classify hook effects as `observation`, `response-shaping`, or `guard-decision`; reject `durable-write`.

**Schema Kernel:**
- Purpose: Typed validation for tool inputs, config, primitive frontmatter, and feature contracts.
- Examples: `src/schema-kernel/index.ts`, `src/schema-kernel/*.schema.ts`.
- Pattern: Strict parse with lenient fallback where explicitly supported.

**Source-Plane Boundary:**
- Purpose: Keep implementation, primitives, state, governance, and generated assets separate.
- Examples: `src/AGENTS.md`, `.opencode/AGENTS.md`, `.planning/AGENTS.md`, `.hivemind/` state paths.
- Pattern: Hard Harness in `src/`; Soft Meta-Concepts in `.opencode/`; Internal State in `.hivemind/`; Governance in `.planning/`.

## Entry Points

**OpenCode Plugin:**
- Location: `src/plugin.ts`.
- Triggers: OpenCode plugin loading.
- Responsibilities: Instantiate runtime modules, register hooks and 28 tool names, hydrate recovery paths.

**Package API:**
- Location: `src/index.ts`.
- Triggers: `import "hivemind"` and `import "hivemind/plugin"` via `package.json` exports.
- Responsibilities: Re-export plugin and public runtime helper modules.

**CLI:**
- Location: `src/cli/index.ts`, `src/cli/router.ts`, `bin/hivemind.cjs`.
- Triggers: `hivemind <command>`.
- Responsibilities: Parse argv, dispatch built-in commands, render errors/help/json/table output.

**OpenCode Tool Factories:**
- Location: `src/tools/`.
- Triggers: OpenCode tool calls.
- Responsibilities: Validate inputs, call deeper modules, return tool response envelopes.

**Sidecar Read Access:**
- Location: `src/sidecar/readonly-state.ts`.
- Triggers: Sidecar/dashboard reads.
- Responsibilities: Permit reads only under `.hivemind/state/` and `.planning/`; reject writes.

## Architectural Constraints

- **Threading:** Node.js single-threaded event loop; command/PTY execution is async and optional PTY support is isolated under `src/features/background-command/pty/`.
- **Global state:** `src/task-management/continuity/index.ts` maintains module-level `storeCache`; `src/shared/state.ts` maintains in-memory task/delegation maps; `src/config/subscriber.ts` maintains config cache.
- **Circular imports:** Avoid with dependency injection. `src/plugin.ts` performs explicit setter wiring for lifecycle-owned completion detector into delegation manager (`src/plugin.ts:264-272`).
- **Module size:** Keep modules below 500 LOC. Existing pressure points include `src/plugin.ts` (493 lines), `src/features/session-tracker/index.ts` (561 lines), and some config/schema modules; split rather than expand these files.
- **ESM:** TypeScript NodeNext with explicit `.js` import extensions and `verbatimModuleSyntax` (`tsconfig.json`).
- **State root:** New runtime writes must target `.hivemind/`, never `.opencode/`.
- **Source-plane separation:** Do not move runtime implementation into `.opencode/`, `.planning/`, or `.hivemind/`.

## Anti-Patterns

### Business Logic in `src/plugin.ts`

**What happens:** Adding dispatch algorithms, persistence decisions, or validation behavior directly into `src/plugin.ts`.
**Why it's wrong:** The file is the composition root and is already near the module-size ceiling.
**Do this instead:** Put behavior in `src/coordination/`, `src/task-management/`, `src/features/`, `src/config/`, `src/routing/`, or `src/tools/`, then wire it from `src/plugin.ts`.

### Hook Durable Writes

**What happens:** Writing files or mutating canonical state directly from `src/hooks/**`.
**Why it's wrong:** Hooks are CQRS read-side surfaces; hidden writes blur state ownership.
**Do this instead:** Route facts to injected managers and keep enforcement aligned with `src/hooks/composition/cqrs-boundary.ts`.

### Runtime State in `.opencode/`

**What happens:** Persisting continuity, delegation records, journals, or session-tracker files under `.opencode/`.
**Why it's wrong:** `.opencode/` is only for OpenCode primitives; state belongs to `.hivemind/`.
**Do this instead:** Use `src/task-management/continuity/`, `src/task-management/journal/`, `src/task-management/trajectory/`, or `src/features/session-tracker/` with `.hivemind/` paths.

### Deep Imports into `src/shared/`

**What happens:** `src/shared/` imports feature, tool, hook, coordination, or task-management modules.
**Why it's wrong:** Shared is the leaf utility layer; deep imports create circular dependency risk.
**Do this instead:** Define contracts in `src/shared/` and import those contracts from deeper modules.

### Command Execution from Routing

**What happens:** `src/routing/command-engine/` launching commands or mutating state.
**Why it's wrong:** Command engine is preview/discovery/read-side; execution belongs to tools/OpenCode prompt pipeline.
**Do this instead:** Use `src/tools/session/execute-slash-command.ts` for foreground slash command execution and keep `src/routing/command-engine/index.ts` preview-only.

## Error Handling

**Strategy:** Use `[Harness]`-prefixed errors for harness-owned failures; keep non-critical hook/session-tracker paths best-effort; validate external inputs at schema/tool boundaries.

**Patterns:**
- CLI router returns exit code `64` for usage and `70` for handler crash with `[Harness]` messages (`src/cli/router.ts:18-24`, `src/cli/router.ts:160-187`).
- Lifecycle cancellation and session dispatch errors use `[Harness]` errors (`src/task-management/lifecycle/index.ts:221-224`).
- Session tracker handlers catch/log warnings and must not throw into OpenCode runtime (`src/features/session-tracker/index.ts:60-62`).
- Sidecar write attempts always throw `[Harness] sidecar SIDECAR-03` errors (`src/sidecar/readonly-state.ts:115-120`).
- Config compiler rejects traversal in primitive output paths (`src/config/compiler.ts:78-83`).

## Cross-Cutting Concerns

**Logging:** Use `client.app?.log?.()` with service tags and `[Harness]` message prefixes in plugin/session-tracker/migration paths (`src/plugin.ts:222-229`, `src/plugin.ts:274-287`).

**Validation:** Use `src/schema-kernel/` schemas for tool/config/primitive contracts; use `src/shared/security/path-scope.ts` and `src/shared/security/redaction.ts` around persistence boundaries.

**Authentication:** Authentication belongs to OpenCode runtime. Hivemind enforces authorization-like behavior through runtime policy, category gates, tool guards, and permission propagation.

**Observability:** Session tracker, journal, trajectory, SDK supervisor, and command-engine tools provide read-side evidence surfaces without moving state into `.opencode/`.

---

*Architecture analysis: 2026-05-20*
