# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Layered CQRS Plugin Architecture with Dual-Plane SDK Separation

HiveMind is a context-governance framework for OpenCode that enforces strict boundaries between concerns. It builds on the OpenCode SDK using a 6-layer architecture with hard CQRS separation between write-side (tools) and read-side (hooks).

**Key Characteristics:**
- **CQRS Hard Boundary**: Tools write state, hooks read/inject context — never both
- **SDK-First**: Always use OpenCode SDK primitives before custom abstractions
- **Authority Principle**: Each concern has ONE owner — no duplicate implementations
- **Interface Decomposition**: Types ≤10 fields, compose via intersection not monoliths
- **Dual-Plane SDK**: Control Plane (CLI side) vs Execution Plane (plugin side)
- **Consumer-First**: Shipped assets must work for npm consumers, not just internal dev
- **Projection-Not-Authority**: Root markdown is thin projection, TypeScript owns behavior

## Layers

**Tools Layer:**
- Purpose: Write-side CQRS surface — agent-callable tools that perform state mutations
- Location: `src/tools/`
- Contains: 6 structured tools with Zod schemas using `tool.schema`
- Depends on: `@opencode-ai/plugin` (execution plane SDK), `src/core/` (state authority), `src/features/` (feature implementations), `src/shared/` (utilities)
- Used by: Agents in OpenCode sessions, slash commands, runtime status tools

**Hooks Layer:**
- Purpose: Read-side and in-band interception — inject context, classify, validate, observe
- Location: `src/hooks/`
- Contains: 7 sub-modules handling lifecycle concerns (start-work, runtime-loader, workflow-integration, etc.)
- Depends on: `@opencode-ai/plugin` (execution plane SDK), `src/shared/` (utilities)
- Used by: Plugin assembly, session compaction, tool execution flow
- Constraint: Hooks are non-durable — never write to `.hivemind/` directly

**Plugin Assembly Layer:**
- Purpose: Assembly and enforcement wiring only — registers hooks, tools, event handlers
- Location: `src/plugin/`
- Contains: `opencode-plugin.ts` (sole plugin entry), context renderers, route helpers
- Depends on: `src/tools/`, `src/hooks/`, `src/features/`, `src/commands/`
- Used by: OpenCode runtime when plugin is loaded
- Constraint: No business logic, no tool definitions, no event processing beyond delegation

**Supervisor Layer:**
- Purpose: Additive Phase 1 orchestration control — instances, sessions, workflows, health
- Location: `src/sdk-supervisor/`
- Contains: Instance registry, health aggregation, runtime status builder
- Depends on: `src/schema-kernel/` (archived contracts), OpenCode SDK
- Used by: Runtime status tool (`src/tools/runtime/`), control plane handlers
- Constraint: Must not perform durable runtime mutations directly

**Schema Kernel Layer:**
- Purpose: Phase 1 contract authority for persisted and cross-session records
- Location: `src/archive/schema-kernel/` (archived, stub exports remain in `src/schema-kernel/`)
- Contains: Lifecycle records, orchestration records, evidence records schemas
- Depends on: None (pure schema definitions)
- Used by: Core modules, supervisor, runtime status tools
- Constraint: Does not own durable writes, hook logic, or supervisor orchestration

**Core Layer:**
- Purpose: State management — trajectory ledger, workflow authority, task lifecycle
- Location: `src/core/`
- Contains: `trajectory/` (ledger, assessment), `workflow-management/` (workflow authority), `hierarchy/` (decision tree), `state/` (persistence)
- Depends on: `src/shared/paths.ts` (path resolution), `src/archive/schema-kernel/` (contracts)
- Used by: Tools (via delegated mutations), hooks (via state reads)
- Constraint: `core/session/` is removed — session lifecycle owned by `hooks/start-work/`

**Shared Layer:**
- Purpose: Transitional utilities and lifecycle primitives — cross-cutting helpers
- Location: `src/shared/`
- Contains: Path builders, logging augment, tool response formats, lifecycle spine, pressure contracts, opencode registries
- Depends on: `@opencode-ai/sdk` (partial), `@opencode-ai/plugin` (partial)
- Used by: All layers
- Note: `shared/event-bus.ts` removed — use SDK `event` hook

## Data Flow

**Tool Execution Flow (CQRS Pattern):**

1. Agent calls tool (e.g., `hivemind_task`)
2. Tool uses `tool.schema` for arg validation (Zod)
3. Tool delegates to `src/core/` modules via state functions
4. Core module mutates `.hivemind/state/` files via store functions
5. `tool.execute.after` hook observes execution and records event
6. Response returned via `JSON.stringify({status, message, data})`

**Context Injection Flow (Synthetic Parts):**

1. Hook intercepts lifecycle event (e.g., `messages.transform`, `system.transform`)
2. Hook builds `Part` objects via `createSyntheticPart()`
3. Parts injected into message stream via `output.parts` or `output.context`
4. Agent sees injected context as message parts, never as system prompt

**Slash Command Flow:**

1. User triggers slash command (e.g., `/hm-init`)
2. `command.execute.before` hook resolves `SlashCommandBundle` from registry
3. Tool precedence chain built: `hivemind_runtime_command` → bundle execution
4. Bundle loads markdown assets, processes workflow chain
5. Results returned as structured output

**Session Compaction Flow:**

1. OpenCode triggers `session.compacting` hook
2. Hook retrieves latest agent-work contract via `ContractStore`
3. Compaction packet assembled with trajectory/workflow state
4. `renderHivemindContext()` generates canonical context format
5. Context pushed to `output.context` for LLM consumption

## Key Abstractions

**Tool Contract:**
- Purpose: Structured tool definition with Zod args, standardized response format
- Examples: `src/tools/doc/tools.ts`, `src/tools/task/tools.ts`, `src/tools/trajectory/tools.ts`
- Pattern: `tool({description, args: {...schema}, async execute(args, context) {...}}`

**Hook Contract:**
- Purpose: Lifecycle interception points with read-only context injection
- Examples: `src/hooks/start-work/start-work-router.ts`, `src/hooks/runtime-loader/index.ts`
- Pattern: Hook functions receive SDK event payload, modify via `output`, never return

**Trajectory Record:**
- Purpose: Persistent session ledger tracking events, checkpoints, workflows, tasks
- Examples: `src/core/trajectory/trajectory-store.ts`
- Pattern: CRUD operations on `.hivemind/state/trajectory-ledger.json`

**Agent Work Contract:**
- Purpose: Delegation handoff record preserving context across sessions
- Examples: `src/features/agent-work-contract/engine/contract-store.ts`
- Pattern: Create → Validate → Close lifecycle

**Pressure Contract:**
- Purpose: Runtime behavior contract defining what mutations are allowed
- Examples: `src/shared/pressure-contract.ts`
- Pattern: Registry of `RuntimePressureContract` with levels like 'steady-state', 'task-mutation'

## Entry Points

**Plugin Entry:**
- Location: `src/plugin/opencode-plugin.ts`
- Triggers: OpenCode loads plugin via npm package `hivemind-context-governance`
- Responsibilities: Register hooks, register tools, register event handler, export `Plugin` object
- Dependencies: Imports all tools, hooks, features, commands, shared utilities

**CLI Entry:**
- Location: `src/cli.ts` (via `dist/cli.js` binary)
- Triggers: User runs `hivemind-context-governance` CLI commands
- Responsibilities: Command routing, control plane initialization, handler dispatch
- Dependencies: `@opencode-ai/sdk` (control plane SDK only)

**Control Plane Gate:**
- Location: `src/control-plane/control-plane-intake.ts`
- Triggers: CLI commands (`hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`)
- Responsibilities: Profile intake, gate decisions, command routing
- Dependencies: `@opencode-ai/sdk` (control plane), `src/commands/slash-command/`

## Error Handling

**Strategy:** Structured error responses via shared format

All tools return standardized response objects:
```typescript
{ status: 'error' | 'success', message: string, data?: unknown }
```

**Patterns:**
- **Tool errors**: Use `renderToolResult(error(message))` for failures
- **Success responses**: Use `renderToolResult(success(message, data))` for success
- **Contract validation**: Type checking via `npx tsc --noEmit` before commit
- **Runtime pressure**: `getRuntimePressureContract()` guards against invalid operations
- **Governance toasts**: `showGovernanceToast()` surfaces warnings with cooldown tracking

## Cross-Cutting Concerns

**Logging:** Augmented SDK logging via `client.app.log()` supplemented by `src/shared/logging.ts`. Custom `log()` allowed for dev, production prefers SDK.

**Validation:** Zod schemas in `tool.schema` for all tool args. Type checking via TypeScript strict mode. Interface Decomposition principle limits types to ≤10 fields.

**Authentication:** Delegated to OpenCode — plugin is not an auth provider. Uses `permission.ask` hook for state mutation gating.

**Path Resolution:** Centralized via `src/shared/paths.ts`. `getEffectivePaths()`, `getHivemindPath()`, `getStatePath()` used throughout. Never hardcode `.hivemind/` paths.

**Agent Registry:** `src/shared/opencode-agent-registry.ts` canonicalizes agent parsing and projects runtime-safe `.opencode/agents/**` projection.

**Governance Enforcement:** `src/hooks/soft-governance.ts` + `permission.ask` hook auto-allow HiveMind managed tools and surface mutation toasts for write requests.

**State Mutation Control:** CQRS enforced via architectural boundaries — Tools write (delegated to core), Hooks read (context injection only), Plugin assembles (no business logic).

---

*Architecture analysis: 2026-03-21*
