# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** CQRS Plugin Architecture on OpenCode SDK

**Key Characteristics:**
- Assembly-only plugin entry — `src/plugin/opencode-plugin.ts` wires hooks and tools, contains zero business logic
- CQRS hard boundary — tools write state, hooks read/inject context, plugin assembles
- Interface decomposition — no type exceeds 10 fields at the core level; extensions compose via intersection types
- SDK-First — all SDK surfaces (`tool.schema`, `client.app.log()`, `client.tui.showToast()`) used directly; no custom reimplementations
- Authority principle — each concern has one owner module; no second implementations

## Layers

**Plugin Layer (Assembly):**
- Purpose: Registers hooks and tools with the OpenCode runtime; wires SDK context
- Location: `src/plugin/`
- Contains: Plugin entry (`opencode-plugin.ts`), context rendering, system/message transforms, compaction adapters, skill injection, runtime snapshot loading, synthetic part injection, route hints, injection store, evidence reporter
- Depends on: `src/hooks/`, `src/tools/`, `src/features/`, `src/core/`, `src/shared/`
- Used by: OpenCode runtime (consumed via `dist/plugin/opencode-plugin.js`)

**Hooks Layer (Read-Side Interception):**
- Purpose: Read-only context injection and in-band interception of OpenCode lifecycle events
- Location: `src/hooks/`
- Contains: Event handler, compaction handler, transform handler, text-complete handler, chat-message handler, tool-execution handler, soft governance (toast throttling), SDK context initialization, start-work router, auto-slash-command, runtime-loader, workflow-integration
- Depends on: `src/core/`, `src/features/`, `src/shared/`
- Used by: Plugin layer
- Key contract: Hooks MUST NOT perform durable writes

**Tools Layer (Write-Side CQRS):**
- Purpose: Agent-callable execution limbs — the only write-side surfaces exposed to agents
- Location: `src/tools/`
- Contains: 12 tools — `hivemind_runtime_status`, `hivemind_runtime_command`, `hivemind_doc`, `hivemind_task`, `hivemind_trajectory`, `hivemind_handoff`, `hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract`, `hivemind_journal`, `hivemind_hm_init`, `hivemind_hm_doctor`, `hivemind_hm_setting`
- Depends on: `src/core/`, `src/features/`, `src/schema-kernel/`, `src/sdk-supervisor/`, `src/shared/`
- Used by: Plugin layer (registered in tool map)
- Key contract: ~300 LOC limit per tool; all args use `tool.schema` (Zod); return `JSON.stringify()`

**Core Layer (State Management):**
- Purpose: Trajectory ledger, workflow authority, and task lifecycle state
- Location: `src/core/`
- Contains: `trajectory/` (ledger, events, checkpoints, assessment), `workflow-management/` (authority, task lifecycle, routing, continuity)
- Depends on: `src/shared/paths.ts`
- Used by: Tools, hooks, features
- Key contract: State files live in `.hivemind/` subdirectories; all reads/writes go through store functions

**Schema Kernel (Contract Authority):**
- Purpose: Machine-authoritative contracts for persisted and cross-session Phase 1 records
- Location: `src/schema-kernel/`
- Contains: Config records, agent records, default agent templates, skill injection records; re-exports from `src/archive/schema-kernel/` (shared, lifecycle, orchestration, evidence)
- Depends on: `zod`
- Used by: All layers that produce or consume persisted records

**SDK Supervisor (Orchestration Authority):**
- Purpose: Additive Phase 1 orchestration control — instances, sessions, workflows, health, diagnostics
- Location: `src/sdk-supervisor/`
- Contains: Instance registry, health checks, runtime status, session inspection, diagnostic log
- Depends on: `src/schema-kernel/`, `src/features/`
- Used by: Tools, hooks, plugin

**Features Layer (Domain Modules):**
- Purpose: Self-contained domain modules implementing specific framework capabilities
- Location: `src/features/`
- Contains: `agent-work-contract/` (contract store, engine, tools, hooks), `session-entry/` (intake gates, lineage routing, profile resolution, purpose classification), `event-tracker/` (consolidated session writer, session structure, classifiers, parsers, writers), `runtime-entry/` (init flow), `runtime-observability/`, `doc-intelligence/`, `handoff/`, `trajectory/`, `workflow/`
- Depends on: `src/schema-kernel/`, `src/shared/`
- Used by: Core, tools, hooks

**Shared Layer (Transitional Utilities):**
- Purpose: Cross-cutting utilities and current lifecycle primitives
- Location: `src/shared/`
- Contains: Path resolution (`paths.ts`), pressure contracts, entry kernel state, lifecycle spine, intake records, keyword matcher, logging, errors, evidence lane, bootstrap profile, config groups, skill registries, tool helpers, tool response, tiered injection
- Depends on: `node:fs`, `node:path`, `zod`
- Used by: All layers
- Key contract: `getEffectivePaths()` is the single path authority — never hardcode `.hivemind/` paths

**Control Plane Layer (CLI Command Gate):**
- Purpose: Manages the 4 CLI primitives (`hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`) and their intake/gate flows
- Location: `src/control-plane/`
- Contains: Control plane handler, intake resolver, primitive registry, types
- Depends on: `src/features/session-entry/`, `src/shared/pressure-contract.ts`
- Used by: CLI entry (`src/cli/`)

**Context Layer (Prompt Engineering):**
- Purpose: Prompt packet compilation and normalization for system/message transforms
- Location: `src/context/`
- Contains: `prompt-packet/` (compiler, normalizer, renderers, types)
- Depends on: `src/shared/`, `src/features/session-entry/`
- Used by: Plugin layer (system-transform, messages-transform)

**Delegation Layer:**
- Purpose: Delegation packet schema, records, and store for sub-agent handoffs
- Location: `src/delegation/`
- Contains: Delegation packet, record schema, store
- Depends on: `src/schema-kernel/`, `src/shared/`
- Used by: Tools, hooks

**Recovery Layer:**
- Purpose: Recovery engine for runtime state repair
- Location: `src/recovery/`
- Contains: Recovery engine, recovery types
- Depends on: `src/core/`, `src/shared/`
- Used by: Hooks, control plane

**Governance Layer:**
- Purpose: Planning projection authority
- Location: `src/governance/`
- Contains: Planning projection
- Depends on: `src/shared/`
- Used by: Plugin layer

**CLI Layer:**
- Purpose: Binary entry point for npm package CLI commands
- Location: `src/cli.ts` and `src/cli/`
- Contains: Command routing, init, doctor, harness, settings
- Depends on: `src/control-plane/`, `src/features/runtime-entry/`
- Used by: npm consumers via `bin` entries (`hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness`)

## Data Flow

**Plugin Initialization Flow:**

1. OpenCode loads `hivemind-context-governance` plugin from `dist/plugin/opencode-plugin.js`
2. `HiveMindPlugin()` factory function invoked with `PluginInput` (client, shell, serverUrl, project, directory)
3. `ensureAgentProjection()` auto-creates `.opencode/agents/hivefiver.md` from canonical source if missing
4. `initSkillInjection()` resolves skill exposure map for default agent
5. `initSdkContext()` caches SDK client/shell/server references in module-level state (`src/hooks/sdk-context.ts`)
6. Event handler, turn snapshot loader, messages transform, and compaction handlers created
7. Plugin object returned with hooks (`event`, `chat.message`, `permission.ask`, `tool.execute.before/after`, `shell.env`, `command.execute.before`, `system.transform`, `messages.transform`, `session.compacting`, `text.complete`) and tool registrations

**Agent Tool Invocation Flow:**

1. Agent calls a `hivemind_*` tool (e.g., `hivemind_runtime_command`)
2. OpenCode routes to `tool.execute.before` hook — records intent via `recordToolEvent()`
3. Plugin dispatches to the tool's `execute()` function
4. Tool reads `context.sessionID`, `context.agent`, `context.directory` from SDK `ToolContext`
5. Tool delegates to core/features/shared modules for state operations
6. Tool returns `JSON.stringify(result)` — no direct file I/O to `.hivemind/`
7. `tool.execute.after` hook records completion

**Session Lifecycle Flow:**

1. `chat.message` hook fires on new message — resets turn snapshot
2. `system.transform` hook fires — `TransformHandler` captures injection payload for session journal
3. `messages.transform` hook fires — `MessagesTransformAdapter` injects HiveMind context packet
4. `text.complete` hook fires — writes diagnostic log and session inspection export
5. `session.compacting` hook fires — compaction handler + journal handler write compaction events

**Entry Kernel State Flow:**

1. `entry-kernel-state.json` in `.hivemind/config/` tracks session readiness
2. State machine: `uninitialized` → `repair-required` → `qa-pending` → `ready` → `blocked`
3. `src/shared/entry-kernel-state.ts` inspects trajectory ledger + workflow authority to determine state
4. Tools and hooks check entry kernel state before allowing mutations

**State Management:**
- All persistent state lives in `.hivemind/` directory (runtime-generated, not authoring surface)
- State subdirectories: `.hivemind/state/`, `.hivemind/config/`, `.hivemind/graph/`, `.hivemind/sessions/`, `.hivemind/session-inspection/`, `.hivemind/project/planning/`, `.hivemind/error-log/`
- Tools are the ONLY write-side surfaces; hooks are read-only
- Path resolution centralized in `src/shared/paths.ts` via `getEffectivePaths()`
- Pressure contracts (`src/shared/pressure-contract.ts`) define safety expectations for each runtime operation

## Key Abstractions

**Entry Kernel State:**
- Purpose: Determines if the HiveMind runtime is ready for agent operations
- Examples: `src/shared/entry-kernel-state.ts`, `src/shared/lifecycle-spine.ts`
- Pattern: State machine with `loadStoredEntryKernelState()` / `assessAndPersistEntryKernelState()` transitions

**Runtime Pressure Contract:**
- Purpose: Defines safety levels, failure behaviors, and evidence requirements per operation type
- Examples: `src/shared/pressure-contract.ts`
- Pattern: Intersection type decomposition (`RuntimePressureMetadata & RuntimePressureFailure & { safety } & { evidence }`)

**Agent Tool Catalog:**
- Purpose: Typed registry mapping each tool to its contract file, workflow phase, purpose classes, and state authority
- Examples: `src/tools/index.ts` (`agentToolCatalog`)
- Pattern: Static typed array with `AgentToolCatalogEntry` entries

**Context Packet:**
- Purpose: Canonical HiveMind context assembled for injection into system prompts and message transforms
- Examples: `src/plugin/context-renderer.ts`, `src/plugin/context-renderer.types.ts`
- Pattern: Builder pattern with decomposed modules (types, constants, builder, renderers, compaction renderers)

**Prompt Packet:**
- Purpose: Compiled prompt instructions for system-transform and messages-transform hooks
- Examples: `src/context/prompt-packet/prompt-compiler.ts`, `src/context/prompt-packet/prompt-packet-types.ts`
- Pattern: Compiler pattern — takes `PromptPacketState` + `SessionScope`, produces `CompiledPromptPacket`

**SDK Context Authority:**
- Purpose: Single point of access to the OpenCode SDK client, shell, and server URL
- Examples: `src/hooks/sdk-context.ts`
- Pattern: Module-level singleton with `initSdkContext()` / `getClient()` / `withClient()` pattern

**Slash Command Bundle:**
- Purpose: Typed command definition with frontmatter metadata, resolved at runtime
- Examples: `src/commands/slash-command/command-bundles.ts`, `src/commands/slash-command/command-types.ts`
- Pattern: Registry pattern — `findSlashCommandBundle()` resolves command ID to bundle

**Control Plane Primitive:**
- Purpose: Type-safe CLI command definition with gate detection, intake requirements, and pressure contract
- Examples: `src/control-plane/control-plane-types.ts` (`ControlPlanePrimitive`)
- Pattern: Interface with `detect()` method — each primitive probes input for activation keywords

## Entry Points

**Plugin Entry (Primary Runtime):**
- Location: `src/plugin/opencode-plugin.ts`
- Triggers: OpenCode loads plugin from `opencode.json` configuration
- Responsibilities: Assembly only — wires hooks, registers tools, exports `Plugin` object

**CLI Entry (Binary Commands):**
- Location: `src/cli.ts`
- Triggers: npm consumer runs `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, or `hm-harness`
- Responsibilities: Argument parsing, command routing to `src/control-plane/` handlers

**Package Entry (Library Export):**
- Location: `src/index.ts`
- Triggers: `import { ... } from 'hivemind-context-governance'`
- Responsibilities: Barrel re-export of all public modules (core, shared, context, control-plane, delegation, governance, hooks, commands, plugin, intelligence, recovery, tools)

**SDK Context Bootstrap:**
- Location: `src/hooks/sdk-context.ts` → `initSdkContext()`
- Triggers: Called once during plugin initialization
- Responsibilities: Caches `client`, `$` (shell), `serverUrl`, `project` references from `PluginInput`

## Error Handling

**Strategy:** Graceful degradation with fallback values; diagnostic logging; never crash the host

**Patterns:**
- Tools return JSON results with `status: 'success' | 'error'` — never throw to the agent
- `withClient()` wraps SDK calls with fallback on failure (`src/hooks/sdk-context.ts`)
- Boundary lint scripts enforce architectural rules (e.g., `check-hooks-readonly.sh`, `check-no-event-bus.sh`)
- `try/catch {}` silently in non-critical paths (e.g., injection store, toast display)
- `console.error('[prefix]')` for diagnostic logging alongside `client.app.log()`

## Cross-Cutting Concerns

**Logging:** Dual approach — `console.error()` for diagnostics + `withClient(client => client.app.log())` for SDK-structured logging. Diagnostic log writer in `src/sdk-supervisor/diagnostic-log.ts`.

**Validation:** Zod schemas via `tool.schema` for all tool arguments. Schema-kernel contracts validated on write. Entry kernel state assessment validates trajectory + workflow before allowing mutations.

**Authentication:** Delegated to OpenCode's `permission.ask` hook. HiveMind auto-allows its own managed tools (`isHivemindManagedTool()`). Write operations surface governance toasts.

**Boundary Enforcement:** 9 shell scripts in `scripts/` enforce architectural invariants at build/test time (SDK boundary, state-write boundary, hooks-readonly, no-event-bus, no-core-session, tool-schema, plugin-assembly, agents-presence, asset-refs).

---

*Architecture analysis: 2026-03-27*
