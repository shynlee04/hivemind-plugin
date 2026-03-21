# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```
hivemind-plugin/
├── agents/                    # Shipped agent definitions (GSD framework)
├── commands/                   # Slash command markdown projections
├── workflows/                  # Shipped workflow definitions
├── skills/                     # Shipped skill definitions
├── docs/                        # Documentation (guide, plans, API reference)
├── dist/                       # Compiled output (npm package)
├── bin/                        # Executable binaries
├── tests/                       # Test suites (*.test.ts)
├── src/                         # Plugin source code (TypeScript)
│   ├── plugin/                  # Plugin assembly and enforcement wiring
│   ├── hooks/                    # Read-side context injection (CQRS)
│   ├── tools/                    # Write-side tools (CQRS)
│   ├── sdk-supervisor/            # Phase 1 orchestration control
│   ├── schema-kernel/             # Archived contract authority (stub exports)
│   ├── archive/schema-kernel/      # Live Phase 1 contract authority
│   ├── core/                     # State management (trajectory, workflow)
│   ├── commands/                  # Slash command bundle registry
│   ├── context/                   # Prompt packet compilation
│   ├── control-plane/             # CLI command gate & intake
│   ├── delegation/                # Handoff packet creation
│   ├── recovery/                  # State assessment & checkpoint
│   ├── governance/                # Planning projection
│   ├── intelligence/              # Doc surface routing
│   ├── features/                  # Feature implementations
│   │   ├── agent-work-contract/     # Agent contract management
│   │   ├── doc-intelligence/         # Doc reading & analysis
│   │   ├── runtime-entry/            # Runtime dispatch logic
│   │   ├── runtime-observability/   # Runtime status & sync
│   │   ├── session-entry/            # Session lifecycle entry
│   │   ├── trajectory/               # Trajectory feature
│   │   └── workflow/                # Workflow feature
│   ├── shared/                    # Cross-cutting utilities
│   ├── cli/                       # CLI entrypoint & routing
│   ├── dashboard-v2/              # React dashboard (separate workspace)
│   ├── tui/                       # Terminal UI components
│   └── index.ts                   # Main barrel export
├── scripts/                     # Build/lint/validation scripts
├── templates/                  # File templates (prompts, configs)
├── prompts/                     # Prompt templates
└── package.json                 # npm package manifest
```

## Directory Purposes

**`agents/` (Shipped Product):**
- Purpose: Source authoring surface for agent contracts
- Contains: GSD agent definitions (`.opencode/agents/gsd-*.md` projected here)
- Key files: Agent markdown with frontmatter defining capabilities and skills
- Ownership: Root authority — defines agents for npm consumers

**`commands/` (Shipped Product):**
- Purpose: Live runtime command surface projections
- Contains: Markdown files that map to slash commands
- Key files: `hm-init.md`, `hm-doctor.md`, `hm-harness.md`, `hm-settings.md`
- Governance: Only executable when registered in `src/commands/slash-command/command-bundles.ts`

**`workflows/` (Shipped Product):**
- Purpose: Workflow definitions for agent execution
- Contains: Multi-step agent workflows
- Ownership: Future authority — currently minimal content

**`skills/` (Shipped Product):**
- Purpose: Reusable skill packages for agents
- Contains: Skill definitions following Agent Skills open standard
- Ownership: Runtime-authority — loaded via `npx skills` command

**`docs/` (Documentation):**
- Purpose: Stable governance and user-facing guides
- Contains: `guide/` (bootstrap paths), `plans/archive/` (historical), dated evidence docs
- Governance: Non-authority — advisory only, never override root governance

**`src/plugin/` (Plugin Assembly Layer):**
- Purpose: Assembly and enforcement wiring only — NO business logic
- Contains: `opencode-plugin.ts` (main entry), context renderers, route helpers
- Key files:
  - `opencode-plugin.ts`: Plugin factory with hook/tool registration
  - `context-renderer.ts`: Canonical HiveMind context packet assembly
  - `route-hint.ts`: Route reminder rendering
  - `runtime-snapshot.ts`: Per-turn runtime snapshot caching
  - `system-transform.ts`: System prompt transform adapter
  - `messages-transform.ts`: Message history injection adapter
  - `synthetic-parts.ts`: Part object creation
- Governance: Must not contain tool implementations, state management, or inline hooks

**`src/hooks/` (Read-Side CQRS Layer):**
- Purpose: Context injection, classification, validation, observation
- Contains: 7 sub-modules, each handling specific lifecycle concerns
- Key modules:
  - `start-work/`: Session lifecycle, purpose classification, trajectory assessment
  - `runtime-loader/`: Post-tool state observation, metadata capture
  - `workflow-integration/`: Compaction context injection
  - `auto-slash-command/`: Auto-detect and route slash commands
  - `event-handler.ts`: All OpenCode lifecycle events
  - `soft-governance.ts`: Governance toast notifications with cooldown
  - `sdk-context.ts`: Cached client/shell references
- Governance: Hooks are non-durable — never write to `.hivemind/` directly

**`src/tools/` (Write-Side CQRS Layer):**
- Purpose: Agent-callable tools that perform state mutations
- Contains: 6 structured tool directories
- Key tools:
  - `runtime/`: `hivemind_runtime_status`, `hivemind_runtime_command`
  - `task/`: `hivemind_task` (workflow management)
  - `trajectory/`: `hivemind_trajectory` (session ledger)
  - `doc/`: `hivemind_doc` (document intelligence)
  - `handoff/`: `hivemind_handoff` (delegation packets)
  - `agent-work-contract/`: Contract creation/export (via features)
- Governance: Each tool uses `tool.schema` (Zod), returns JSON via `renderToolResult()`

**`src/sdk-supervisor/` (Phase 1 Orchestration):**
- Purpose: Additive orchestration control outside agent loop
- Contains: Instance registry, health aggregation, runtime status builder
- Key files:
  - `instance-registry.ts`: Supervisor instance registry and upsert helpers
  - `health.ts`: Aggregate supervisor health summaries
  - `runtime-status.ts`: Build runtime-status snapshots
- Governance: Must not perform durable runtime mutations directly

**`src/archive/schema-kernel/` (Phase 1 Contract Authority):**
- Purpose: Machine-authoritative contracts for persisted records
- Contains: Lifecycle, orchestration, evidence record schemas
- Key files:
  - `lifecycle-records.ts`: Entry, runtime invocation, turn output, delegation receipt contracts
  - `orchestration-records.ts`: Supervisor, session, workflow, wave, guard contracts
  - `evidence-records.ts`: Freshness, deadlock, replay contracts
  - `shared.ts`: Common enums and small shared schema primitives
- Governance: Does not own durable writes, hook logic, or supervisor orchestration

**`src/core/` (State Management):**
- Purpose: Trajectory ledger, workflow authority, task lifecycle
- Contains: 5 active sub-modules
- Key modules:
  - `trajectory/`: Trajectory ledger, events, checkpoints, assessment
  - `workflow-management/`: Workflow authority, task lifecycle, routing
  - `hierarchy/`: Decision tree and ancestor chain
  - `state/`: State persistence layer
  - `planning/`: Planning framework and materialization
- Governance: `core/session/` was removed — session lifecycle owned by `hooks/start-work/`

**`src/commands/` (Command Registry):**
- Purpose: Slash command bundle registry, projection, execution
- Contains: Bundle definitions, discovery, runners, types
- Key files:
  - `slash-command/command-bundles.ts`: Static registry of all `SlashCommandBundle` definitions
  - `slash-command/command-discovery.ts`: `discoverSlashCommandBundles()`, `findSlashCommandBundle()`
  - `slash-command/command-runner.ts`: `executeSlashCommandBundle()` execution logic
  - `slash-command/command-types.ts`: Bundle, input, result, preview types
- Governance: Operates on Control Plane edge using `@opencode-ai/sdk`

**`src/context/` (Context Rendering):**
- Purpose: Prompt packet compilation and rendering
- Contains: Prompt packet builders
- Key files: `prompt-packet/index.ts`: HiveMind context packet assembly

**`src/control-plane/` (CLI Gate & Intake):**
- Purpose: Command gate, intake, handler dispatch
- Contains: 4 primitives
- Key files:
  - `control-plane-handler.ts`: Routes commands to init/doctor/harness/settings handlers
  - `control-plane-intake.ts`: Resolves profile input, detects language, checks missing fields
  - `control-plane-registry.ts`: Registers primitives, resolves gate decisions
  - `control-plane-types.ts`: Control plane primitive, gate results, intake evidence types
- Governance: Uses `@opencode-ai/sdk` exclusively (control plane only)

**`src/delegation/` (Handoff Management):**
- Purpose: Handoff packet creation and store
- Contains: Delegation record CRUD
- Key files:
  - `delegation-packet.ts`: `createDelegationPacket()` — structured handoff context
  - `delegation-store.ts`: CRUD for `DelegationHandoffRecord` with file persistence
- Governance: Handoffs persist in `.hivemind/state/handoffs/`

**`src/recovery/` (State Assessment):**
- Purpose: State assessment, checkpoint, repair
- Contains: First-run and repair entry flows
- Governance: Only writers of user-local `.opencode/**` runtime projection

**`src/governance/` (Planning Projection):**
- Purpose: Minimal planning projection
- Contains: `planning-projection.ts`: Planning framework integration
- Governance: Minimal — keeps planning external

**`src/intelligence/` (Doc Surface):**
- Purpose: Doc surface routing and markdown-first read foundation
- Contains: Document intelligence engine
- Key files:
  - `doc/read-ops.ts`: Markdown read operations
  - `doc/safety.ts`: Safety guardrails
  - `doc/doc-surface-router.ts`: Routes doc requests to appropriate formats
  - `doc/formats/`: Format handlers (md, json)
  - `doc/types.ts`: Document types
- Governance: Read-only — no mutations

**`src/features/` (Feature Implementations):**
- Purpose: Cohesive feature modules (extracted from monolithic areas)
- Contains: 10 feature subdirectories
- Key features:
  - `agent-work-contract/`: Agent contract management, engine, tools
  - `doc-intelligence/`: Document intelligence integration
  - `runtime-entry/`: Natural language first runtime dispatch
  - `runtime-observability/`: Runtime status projection, sync
  - `session-entry/`: Session lifecycle entry types and assessment
  - `trajectory/`: Trajectory feature
  - `workflow/`: Workflow feature
- Governance: Features own their domain; extracted from core/tools/hooks

**`src/shared/` (Cross-Cutting Utilities):**
- Purpose: Utilities used across all layers
- Contains: 16 helper modules
- Key utilities:
  - `paths.ts`: Centralized path builders — `getEffectivePaths()`, `getHivemindPath()`, `getStatePath()`
  - `tool-response.ts`: Standard `{status, message, data}` response format
  - `logging.ts`: Logging augmentation (supplements `client.app.log()`)
  - `tool-helpers.ts`: Shared JSON/list helpers, dedup utilities
  - `pressure-contract.ts`: Pressure contract registry and resolution
  - `lifecycle-spine.ts`: Shared lifecycle identities (entry, runtime invocation, turn output)
  - `opencode-knowledge.ts`: OpenCode-specific knowledge surfaces
  - `opencode-agent-registry.ts`: Canonical agent parsing + runtime projection
  - `opencode-skill-registry.ts`: Skill registry management
  - `runtime-attachment.ts`: Settings load/save + runtime bindings snapshot
  - `entry-kernel-state.ts`: Entry lifecycle state and release gating
  - `intake-record.ts`: Profile intake record types
- Governance: `shared/event-bus.ts` removed — use SDK `event` hook

**`src/cli/` (CLI Entry):**
- Purpose: CLI entrypoint and command routing
- Contains: Main CLI binary entry
- Key files:
  - `cli.ts`: Main CLI entry (via `dist/cli.js`)
  - `command-routing.ts`: Command routing logic
  - `init.ts`: `hm-init` command handler
  - `doctor.ts`: `hm-doctor` command handler
  - `harness.ts`: `hm-harness` command handler
  - `settings.ts`: `hm-settings` command handler
  - `runtime-assets.ts`: Runtime asset synchronization
- Governance: Must only import from `@opencode-ai/sdk` (control plane SDK)

**`tests/` (Test Suites):**
- Purpose: Test coverage for all layers
- Contains: `*.test.ts` files organized by feature/module
- Governance: Tests must surface API of SDK used — no tests with SDK use stubs
- Running: `npm test` executes full suite, `tsx --test tests/<file>.test.ts` for single file

## Key File Locations

**Entry Points:**
- `src/plugin/opencode-plugin.ts`: Main plugin entry — registers hooks, tools, event handlers
- `src/cli.ts`: CLI binary entry — routes commands, initializes control plane
- `dist/plugin/opencode-plugin.js`: Compiled plugin entry (npm package export)
- `dist/cli.js`: Compiled CLI binary (npm package bin)

**Configuration:**
- `opencode.json`: OpenCode plugin configuration (agents, hooks, formatters, model preferences)
- `package.json`: npm package manifest, dependencies, build scripts
- `tsconfig.json`: TypeScript compiler configuration (strict mode, ES2022 target)

**Core Logic:**
- `src/core/trajectory/trajectory-store.ts`: Trajectory ledger CRUD operations
- `src/core/workflow-management/`: Workflow authority and task lifecycle
- `src/shared/paths.ts`: Path resolution — use instead of hardcoded `.hivemind/` paths

**Testing:**
- `tests/`: Root test directory
- Pattern: `src/<module>/<file>.test.ts` — tests co-located with implementation
- Example: `src/features/agent-work-contract/tools/create-contract-tool.test.ts`

**State Files (Runtime-Generated):**
- `.hivemind/state/brain.json`: Machine state (do not edit manually)
- `.hivemind/state/hierarchy.json`: Decision tree
- `.hivemind/state/trajectory-ledger.json`: Trajectory records
- `.hivemind/workflow/*.json`: Workflow state
- `.hivemind/trajectory/*.json`: Trajectory snapshots
- `.hivemind/state/handoffs/`: Delegation handoff records

## Naming Conventions

**Files:**
- Tool implementation: `tools/<domain>/tools.ts` (e.g., `src/tools/doc/tools.ts`)
- Tool types: `tools/<domain>/types.ts` (e.g., `src/tools/doc/types.ts`)
- Tool index: `tools/<domain>/index.ts` (barrel export)
- Hook modules: `hooks/<domain>/<name>.ts` (e.g., `src/hooks/start-work/start-work-router.ts`)
- Feature modules: `features/<domain>/<name>.ts` (e.g., `src/features/doc-intelligence/doc.ts`)
- Test files: `*.test.ts` (co-located with implementation)
- Governance files: `AGENTS.md` (sector ownership documentation)

**Directories:**
- Kebab-case for multi-word names: `slash-command/`, `agent-work-contract/`, `workflow-management/`
- Singular for sector roots: `tools/`, `hooks/`, `core/`, `shared/`, `features/`
- Feature domains: `agent-work-contract`, `doc-intelligence`, `runtime-entry`, `runtime-observability`, `session-entry`, `trajectory`, `workflow`

## Where to Add New Code

**New Tool:**
- Primary code: `src/tools/<domain>/tools.ts` (implement tool with `tool.schema` Zod args)
- Types: `src/tools/<domain>/types.ts` (define HivemindToolArgs interface)
- Index: `src/tools/<domain>/index.ts` (export tool creation function)
- Tests: `tests/` (or co-located `*.test.ts` if preferred)
- Pattern: Use `tool.schema` for args, `context.sessionID/agent/directory` from ToolContext, return `JSON.stringify({status, message, data})`

**New Hook Module:**
- Implementation: `src/hooks/<domain>/<name>.ts` (hook function using SDK events)
- Index: `src/hooks/index.ts` (export new hook module)
- Tests: `tests/` (or co-located `*.test.ts`)
- Constraint: Hooks are read-only — never write to `.hivemind/` directly
- Pattern: Use SDK event context, inject via `output.parts` or `output.context`

**New Feature Module:**
- Implementation: `src/features/<domain>/<name>.ts` (feature logic extracted from core/tools/hooks)
- Tests: `tests/` (or co-located `*.test.ts`)
- Guidance: Features own their domain — delegate to core state authority via store functions

**New Slash Command:**
- Markdown: `commands/<command>.md` (command documentation and usage)
- Registry: Add entry to `src/commands/slash-command/command-bundles.ts`
- Handler: Create handler in `src/control-plane/` (or `src/cli/`)
- Pattern: Define `SlashCommandBundle` with workflow chain, tool grants, structured output

**New Shared Utility:**
- Implementation: `src/shared/<name>.ts` (cross-cutting helper function)
- Index: `src/shared/index.ts` (export new utility)
- Tests: `tests/` (or co-located `*.test.ts`)
- Guidance: Check existing utilities before creating new ones — avoid duplication

**New Schema Contract:**
- Definition: `src/archive/schema-kernel/<domain>-records.ts` (contract schema)
- Index: `src/archive/schema-kernel/index.ts` (export new contract)
- Governance: Keep schemas decomposed by concern — no contract monoliths

## Special Directories

**`src/schema-kernel/` (Stub Archive):**
- Purpose: Backward compatibility stub — exports from `src/archive/schema-kernel/`
- Generated: Yes (archive copy)
- Committed: Yes (for compatibility)

**`.hivemind/` (Runtime State):**
- Purpose: Runtime-generated state output after `hm-init`
- Generated: Yes (by runtime, not authoring surface)
- Committed: No (gitignored, never edit manually)

**`dist/` (Compiled Output):**
- Purpose: TypeScript compilation output — npm package contents
- Generated: Yes (via `npm run build`)
- Committed: No (gitignored)

**`.opencode/` (Dev Projection):**
- Purpose: User-local runtime projection of root `agents/`
- Generated: Yes (by runtime sync)
- Committed: No (gitignored, not repo-time prerequisite)

**`.repo-sdk-packed/` (SDK Reference):**
- Purpose: Packed OpenCode SDK documentation for reference
- Generated: Yes (downloaded 2026-03-20)
- Committed: Yes

---

*Structure analysis: 2026-03-21*
