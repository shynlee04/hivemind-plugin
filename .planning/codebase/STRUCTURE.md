# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
hivemind-plugin/
├── src/                          # TypeScript source (compiles to dist/)
│   ├── plugin/                   # Assembly layer — plugin entry, context rendering, transforms
│   ├── hooks/                    # Read-side interception — event, compaction, transform, governance
│   ├── tools/                    # Write-side CQRS — 12 agent-callable tools
│   ├── core/                     # State management — trajectory ledger, workflow authority
│   ├── schema-kernel/            # Contract authority — Phase 1 record schemas
│   ├── sdk-supervisor/           # Orchestration authority — instances, health, diagnostics
│   ├── features/                 # Domain modules — agent-work-contract, session-entry, event-tracker, etc.
│   ├── shared/                   # Cross-cutting utilities — paths, pressure contracts, logging
│   ├── control-plane/            # CLI command gate — intake, gates, primitive registry
│   ├── context/                  # Prompt engineering — packet compilation, normalization
│   ├── delegation/               # Sub-agent handoff — packets, schemas, store
│   ├── recovery/                 # Runtime state repair
│   ├── governance/               # Planning projection
│   ├── intelligence/             # Document intelligence — doc surface router, read ops
│   ├── commands/                 # Slash command discovery and execution
│   ├── internal/                 # Internal writers (session-writers)
│   ├── archive/                  # Archived schema-kernel re-exports
│   ├── cli.ts                    # CLI binary entry point
│   └── index.ts                  # Package barrel export
├── agents/                       # Canonical agent source (shipped to npm consumers)
├── commands/                     # Slash command markdown (shipped to npm consumers)
├── skills/                       # Skill packages (shipped to npm consumers)
├── workflows/                    # Workflow definitions (shipped to npm consumers)
├── bin/                          # Shell wrapper scripts for CLI binaries
├── dist/                         # Compiled output (npm publish artifact)
├── tests/                        # Test suite — unit, integration, plugin, features
├── scripts/                      # Boundary enforcement scripts (13 lint checks)
├── docs/                         # Documentation and guides
├── templates/                    # Template files
├── references/                   # Reference materials
├── .opencode/                    # Dev-only runtime projections (not shipped)
├── .hivemind/                    # Runtime-generated state (not authoring surface)
├── .planning/                    # Planning artifacts
├── package.json                  # npm manifest
├── tsconfig.json                 # TypeScript configuration
├── opencode.json                 # OpenCode configuration
└── AGENTS.md                     # Root governance document
```

## Directory Purposes

**`src/plugin/`:**
- Purpose: Assembly-only plugin layer — wires hooks and tools, zero business logic
- Contains: Plugin entry (`opencode-plugin.ts`), context renderer (6 files), system/message transforms, compaction adapter, skill injection, runtime snapshot, synthetic parts, route hints, injection store, evidence reporter
- Key files: `opencode-plugin.ts`, `context-renderer.ts`, `runtime-prompt.ts`, `skill-exposure-map.ts`, `injection-store.ts`

**`src/hooks/`:**
- Purpose: Read-side lifecycle interception — no durable writes allowed
- Contains: Event handler, compaction handler, transform handler, text-complete handler, chat-message handler, tool-execution handler, soft governance, SDK context, start-work router, auto-slash-command, runtime-loader, workflow-integration
- Key files: `event-handler.ts`, `sdk-context.ts`, `soft-governance.ts`, `compaction-handler.ts`, `transform-handler.ts`

**`src/tools/`:**
- Purpose: Agent-callable write-side execution limbs
- Contains: 12 tools in subdirectories — `runtime/`, `task/`, `trajectory/`, `handoff/`, `doc/`, `hivefiver-init/`, `hivefiver-doctor/`, `hivefiver-setting/`, plus standalone `hivemind-journal.ts`
- Key files: `index.ts` (tool catalog), each tool directory's `tools.ts`

**`src/core/`:**
- Purpose: State management authority — trajectory and workflow
- Contains: `trajectory/` (ledger, events, checkpoints, assessment), `workflow-management/` (authority, task lifecycle, routing, continuity)
- Key files: `trajectory/trajectory-store.ts`, `workflow-management/workflow-authority.ts`

**`src/schema-kernel/`:**
- Purpose: Machine-authoritative contract definitions
- Contains: Config records, agent records, default agent templates, skill injection records, re-exports from archive
- Key files: `index.ts`, `config-records.ts`, `agent-records.ts`

**`src/sdk-supervisor/`:**
- Purpose: Phase 1 orchestration control
- Contains: Instance registry, health, runtime status, session inspection, diagnostic log
- Key files: `health.ts`, `runtime-status.ts`, `session-inspection.ts`, `diagnostic-log.ts`

**`src/features/`:**
- Purpose: Self-contained domain modules
- Contains: `agent-work-contract/` (engine, hooks, schema, tools), `session-entry/` (intake, gates, routing, classification), `event-tracker/` (consolidated writer, session structure, classifiers, writers), `runtime-entry/`, `runtime-observability/`, `doc-intelligence/`, `handoff/`, `trajectory/`, `workflow/`
- Key files: `session-entry/start-work-types.ts`, `event-tracker/consolidated-writer.ts`

**`src/shared/`:**
- Purpose: Cross-cutting utilities and lifecycle primitives
- Contains: Paths, pressure contracts, entry kernel state, lifecycle spine, intake records, keyword matcher, logging, errors, evidence lane, bootstrap profile, config groups, skill registries, tool helpers, tool response, tiered injection, opencode knowledge
- Key files: `paths.ts`, `pressure-contract.ts`, `entry-kernel-state.ts`, `tool-helpers.ts`, `logging.ts`

**`src/control-plane/`:**
- Purpose: CLI command gate and intake flow
- Contains: Handler, intake, registry, types
- Key files: `control-plane-types.ts`, `control-plane-registry.ts`, `control-plane-handler.ts`

**`src/context/`:**
- Purpose: Prompt packet compilation
- Contains: `prompt-packet/` (compiler, normalizer, renderers, types)
- Key files: `prompt-packet/prompt-compiler.ts`, `prompt-packet/prompt-packet-types.ts`

**`agents/`:**
- Purpose: Canonical agent source files (shipped to npm consumers)
- Contains: Agent markdown files with YAML frontmatter (9 agents — hivefiver, hiveminder, hivexplorer, hiveplanner, hivemaker, hitea, hiveq, hivehealer, hiverd)
- Key files: `hivefiver.deprecated.md`, `hiveminder.deprecated.md`

**`commands/`:**
- Purpose: Slash command markdown definitions (shipped to npm consumers)
- Contains: 46 command markdown files
- Key files: `hm-init.md`, `hm-doctor.md`, `hm-settings.md`, `hm-plan.md`, `hm-verify.md`

**`tests/`:**
- Purpose: Test suite — unit, integration, plugin smoke tests
- Contains: Root-level test files, `unit/`, `integration/`, `plugin/`, `features/`, `hooks/` subdirectories
- Key files: `authority-contract.test.ts`, `plugin-assembly-smoke.test.ts`, `runtime-tools.test.ts`

**`scripts/`:**
- Purpose: Boundary enforcement and validation scripts (run via `npm run lint:boundary`)
- Contains: 13 shell scripts checking architectural invariants
- Key files: `check-hooks-readonly.sh`, `check-no-event-bus.sh`, `check-tool-schema.sh`, `check-plugin-assembly.sh`

## Key File Locations

**Entry Points:**
- `src/plugin/opencode-plugin.ts`: Primary runtime entry — plugin assembly
- `src/cli.ts`: CLI binary entry point
- `src/index.ts`: Package barrel export (library consumers)

**Configuration:**
- `package.json`: npm manifest, bin entries, scripts, dependencies
- `tsconfig.json`: TypeScript config (ES2022, NodeNext, strict)
- `opencode.json`: OpenCode runtime configuration
- `AGENTS.md`: Root governance document (authoritative for development)

**Core Logic:**
- `src/core/trajectory/trajectory-store.ts`: Trajectory state authority
- `src/core/workflow-management/workflow-authority.ts`: Workflow state authority
- `src/shared/paths.ts`: Canonical path resolution
- `src/shared/entry-kernel-state.ts`: Session readiness state machine
- `src/shared/pressure-contract.ts`: Runtime safety contracts
- `src/hooks/sdk-context.ts`: SDK client singleton access
- `src/hooks/event-handler.ts`: Central OpenCode event dispatch

**Plugin Wiring:**
- `src/plugin/opencode-plugin.ts`: Hook and tool registration
- `src/tools/index.ts`: Agent tool catalog with typed entries
- `src/hooks/index.ts`: Hook barrel exports
- `src/commands/slash-command/command-bundles.ts`: Slash command registry

**Testing:**
- `tests/`: Root test directory
- `tests/unit/`: Unit tests
- `tests/integration/`: Integration tests
- `tests/plugin/`: Plugin assembly tests
- `tests/features/`: Feature-specific tests
- `tests/hooks/`: Hook tests

## Naming Conventions

**Files:**
- Kebab-case for all source files: `trajectory-store.ts`, `pressure-contract.ts`, `command-bundles.ts`
- Test files: `*.test.ts` co-located with source or in `tests/` mirror
- AGENTS.md: Sector governance file in each `src/` subdirectory that owns a boundary

**Directories:**
- Kebab-case for all directories: `schema-kernel/`, `sdk-supervisor/`, `event-tracker/`
- Feature directories match domain name: `agent-work-contract/`, `session-entry/`, `doc-intelligence/`

**Types and Interfaces:**
- PascalCase: `RuntimePressureContract`, `ControlPlanePrimitive`, `EntryKernelStateV1`
- Type suffix `Kind` for union discriminants: `EntryKernelStateKind`, `RuntimeSafetyLevel`
- `I` prefix NOT used

**Functions:**
- camelCase: `createHivemindRuntimeStatusTool()`, `getEffectivePaths()`, `initSdkContext()`
- Factory pattern: `create*Tool()`, `create*Handler()`
- Accessor pattern: `getClient()`, `getShell()`, `getServerUrl()`

**Constants:**
- SCREAMING_SNAKE_CASE for path constants: `HIVEMIND_DIR`, `STATE_DIR`, `SESSIONS_DIR`
- camelCase for config objects: `toastCooldowns`

**Import Paths:**
- Always `.js` extension on relative imports (NodeNext module resolution)
- Barrel re-export via `index.ts` in every directory

## Where to Add New Code

**New Tool:**
- Implementation: `src/tools/<tool-name>/tools.ts` + `types.ts` + `index.ts`
- Register: Add to `src/tools/index.ts` `agentToolCatalog` array and barrel export
- Wire: Add `create*Tool()` call in `src/plugin/opencode-plugin.ts`
- Test: `tests/` or co-located `*.test.ts`
- Must use `tool.schema` (Zod) for args, `context.sessionID/agent/directory`, return `JSON.stringify()`

**New Hook Handler:**
- Implementation: `src/hooks/<handler-name>.ts`
- Export: Add to `src/hooks/index.ts`
- Wire: Add handler in `src/plugin/opencode-plugin.ts` under the appropriate hook key
- Constraint: MUST be read-only — no durable writes

**New Feature Module:**
- Implementation: `src/features/<feature-name>/`
- Structure: `index.ts`, `types.ts`, domain-specific subdirectories
- Register: Import from relevant tools/hooks/core modules
- Test: `tests/features/<feature-name>/`

**New Domain Schema:**
- Implementation: `src/schema-kernel/<record-name>.ts`
- Export: Add to `src/schema-kernel/index.ts`
- Consume: Import from any layer that needs the contract

**New Slash Command:**
- Definition: `commands/<command-name>.md` with YAML frontmatter
- Bundle: Add to `src/commands/slash-command/command-bundles.ts`
- Discovery: Auto-discovered by `findSlashCommandBundle()`

**New CLI Command:**
- Handler: `src/cli/<command-name>.ts`
- Types: Add to `src/control-plane/control-plane-types.ts`
- Route: Add case to `src/cli/command-routing.ts`
- Register: Add `bin` entry in `package.json`

**New Boundary Script:**
- Implementation: `scripts/check-<boundary>.sh`
- Register: Add to `npm run lint:boundary` in `package.json`

## Special Directories

**`src/archive/`:**
- Purpose: Archived schema-kernel re-exports (shared, lifecycle, orchestration, evidence records)
- Generated: No
- Committed: Yes
- Note: Re-exported by `src/schema-kernel/index.ts` — do not modify directly

**`src/internal/`:**
- Purpose: Internal session writers not part of public API
- Generated: No
- Committed: Yes

**`dist/`:**
- Purpose: Compiled TypeScript output (ES2022, NodeNext)
- Generated: Yes — via `npm run build`
- Committed: No (in `.gitignore`)
- Note: `dist/plugin/opencode-plugin.js` is the npm plugin entry

**`.hivemind/`:**
- Purpose: Runtime-generated state directory (trajectory ledger, sessions, config, graph)
- Generated: Yes — via `hm-init` and tool operations
- Committed: No (runtime output, not authoring surface)
- Key subdirs: `state/`, `config/`, `graph/`, `sessions/`, `session-inspection/`, `project/planning/`, `error-log/`

**`.opencode/`:**
- Purpose: Dev-only runtime projections (plugins, agents)
- Generated: Partially — agent projections from canonical source
- Committed: Varies — agents/ from dev builds; plugins/ written by `hm-init`
- Note: Dev projections are NOT shipped at install time

**`bin/`:**
- Purpose: Shell wrapper scripts for CLI binaries
- Generated: No
- Committed: Yes
- Referenced by `package.json` `bin` field

**`skills/`:**
- Purpose: Skill packages shipped to npm consumers
- Generated: No
- Committed: Yes
- Shipped: Yes (listed in `package.json` `files` array)

---

*Structure analysis: 2026-03-27*
