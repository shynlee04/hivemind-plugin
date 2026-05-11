# Codebase Structure

**Analysis Date:** 2026-05-12

## Directory Layout

```
hivemind-plugin-private/
├── src/                          # Hard Harness — TypeScript source (npm package)
│   ├── plugin.ts                 # Composition root — wires deps, registers tools/hooks
│   ├── index.ts                  # Public API — re-exports 27 modules
│   ├── AGENTS.md                 # Hard Harness sector governance
│   ├── cli/                      # CLI entrypoint (bin/hivemind.cjs)
│   ├── config/                   # Config loading, compiler, workflow state machine
│   ├── coordination/             # Orchestration — delegation, concurrency, completion
│   ├── features/                 # Standalone runtime features (9 subdirs)
│   ├── harness/                  # Reserved (empty, .gitkeep)
│   ├── hooks/                    # Read-side — lifecycle observers, guards, transforms
│   ├── kernel/                   # Reserved (empty, .gitkeep)
│   ├── routing/                  # Session entry, behavioral profile, command engine
│   ├── schema-kernel/            # Zod validation schemas (18 schema files)
│   ├── shared/                   # Leaf utilities — types, state, SDK wrappers
│   ├── sidecar/                  # Sidecar read-only state for GUI
│   └── task-management/          # State — continuity, lifecycle, journal, recovery
│
├── tests/                        # Test suites
│   ├── lib/                      # Module unit tests (mirrors src/ modules)
│   ├── tools/                    # Tool unit tests
│   ├── hooks/                    # Hook unit tests
│   ├── cli/                      # CLI unit tests
│   ├── schema-kernel/            # Schema validation tests
│   ├── sidecar/                  # Sidecar tests
│   ├── plugins/                  # Plugin integration tests
│   └── integration/              # Full pipeline integration tests
│
├── .planning/                    # Project governance & planning
│   ├── codebase/                 # Codebase architecture maps (this directory)
│   ├── architecture/             # Architecture decisions & models
│   ├── phases/                   # Phase artifacts
│   └── ...
│
├── .hivemind/                    # Internal state root (Q6 canonical)
│   ├── state/                    # Durable JSON — continuity, delegations
│   ├── event-tracker/            # Legacy event journal artifacts
│   ├── session-tracker/          # Session tracker capture
│   └── ...
│
├── .opencode/                    # Soft Meta-Concepts (user-configurable primitives)
│   ├── agents/                   # 89 agent definitions (gsd-*, hm-*, hf-*, gate-*)
│   ├── skills/                   # 125 skill directories
│   ├── commands/                 # 19 command definitions
│   └── ...
│
├── docs/                         # Architecture proposals & draft docs
│   ├── proposals/                # Validation decisions, architecture proposals
│   └── draft/                    # Draft architecture proposals
│
├── bin/                          # CLI entrypoint scripts
│   └── hivemind.cjs              # CLI bin entry
│
├── assets/                       # Static assets
├── package.json                  # Package manifest
├── tsconfig.json                 # TypeScript config (strict, ESM, ES2022)
├── vitest.config.ts              # Vitest config (globals, coverage thresholds)
└── README.md                     # Project readme
```

## Directory Purposes

**`src/` — Hard Harness (npm package source):**
- Purpose: All TypeScript source code for the `hivemind` npm package
- Contains: Plugin composition root, tools, hooks, runtime modules, schemas, shared utilities
- Key files: `src/plugin.ts` (composition root), `src/index.ts` (public API)
- Module system: ESM (`"type": "module"`), NodeNext resolution, `.js` extensions in imports

**`src/plugin.ts` — Composition Root:**
- Purpose: Wires all dependencies — loads runtime policy, instantiates managers, registers 20 tools, composes hooks
- File: `src/plugin.ts` (242 LOC)
- Key patterns: Factory injection for hooks, tool map registration, event observer array routing

**`src/index.ts` — Public API:**
- Purpose: Re-exports from 27 modules across tools, coordination, task-management, shared, features, routing
- Exports: `HarnessControlPlane` (default + named), 25 additional named exports

**`src/cli/` — CLI Entrypoint:**
- Purpose: `hivemind` CLI binary entry (init, recover, doctor, version, help)
- Key files: `discovery.ts`, `router.ts`, `renderer.ts`, `index.ts`, `commands/`

**`src/config/` — Configuration:**
- Purpose: Hivemind config subscriber (lazy-cached, YAML/JSON → schema), config compiler, configure-primitive workflow state machine
- Structure:
  - `subscriber.ts` — config loading + caching
  - `compiler.ts` — config compilation (resolves references, validates schemas)
  - `workflow/` — workflow state machine (6 files: state, types, persistence, guards, index)

**`src/coordination/` — Orchestration:**
- Purpose: All delegation, concurrency, completion, and spawning logic
- Structure:
  - `delegation/` — DelegationManager (500 LOC), DelegationStateMachine, types, category gates (7 files)
  - `completion/` — CompletionDetector, notification-handler (2 files)
  - `concurrency/` — DelegationConcurrencyQueue (1 file)
  - `sdk-delegation/` — SdkDelegationHandler (1 file)
  - `command-delegation/` — CommandDelegationHandler (1 file)
  - `spawner/` — Session creator, spawn request builder, agent policy, auto-loop, ralph-loop (10 files)

**`src/features/` — Standalone Features:**
- Purpose: Self-contained runtime features
- Subdirectories (9 total):
  - `agent-work-contracts/` — Agent work contract store & operations (4 files)
  - `background-command/` — PTY manager, runtime, buffer, types (4 files + d.ts)
  - `bootstrap/` — Primitive registry, scanner, loader, framework detector, cross-primitive validator, runtime detection (9 files)
  - `doc-intelligence/` — Markdown chunker, parser, router, types (5 files)
  - `prompt-packet/` — Delegation packet, kernel packet, compaction preservation (4 files)
  - `runtime-pressure/` — Pressure model, control-plane, authority matrix (5 files)
  - `sdk-supervisor/` — SDK wrapper health inspection (2 files)
  - `session-tracker/` — Capture, persistence, recovery, transform (7 files)
  - `steering-engine/` — Conditions, schema, state, templates (5 files)

**`src/hooks/` — Read-Side:**
- Purpose: OpenCode lifecycle event observation, guard decisions, response shaping
- Structure:
  - `lifecycle/` — `core-hooks.ts` (event routing, system/message/shell transform), `session-hooks.ts`
  - `guards/` — `tool-guard-hooks.ts`, `governance-block.ts`
  - `observers/` — `event-observers.ts` (delegation, session entry, session journey)
  - `transforms/` — `tool-after-composer.ts`, `toggle-gates.ts`
  - `composition/` — `cqrs-boundary.ts` (write boundary enforcement)
  - `types.ts` — HookDependencies interface

**`src/routing/` — Session Entry & Routing:**
- Structure:
  - `session-entry/` — `intake-gate.ts`, `purpose-classifier.ts`, `language-resolution.ts`, `profile-resolver.ts`, `index.ts`
  - `behavioral-profile/` — `profiles.ts`, `resolve-behavioral-profile.ts`, `types.ts`, `index.ts`
  - `command-engine/` — `index.ts`, `types.ts`

**`src/schema-kernel/` — Validation Schemas:**
- Purpose: Zod v4 schemas for all external contracts
- Key files (18 total): `hivemind-configs.schema.ts`, `agent-frontmatter.schema.ts`, `bootstrap.schema.ts`, `command-engine.schema.ts`, `prompt-enhance.schema.ts`, `trajectory.schema.ts`, `runtime-pressure.schema.ts`, `sdk-supervisor.schema.ts`, `agent-work-contract.schema.ts`, etc.
- Also: `index.ts` (barrel), `generate-config-json-schema.ts` (JSON schema generator)

**`src/shared/` — Leaf Utilities:**
- Purpose: Types, helpers, state, SDK wrappers, runtime policy — leaf dependency, never imports from other src/ modules
- Key files: `types.ts` (415 LOC — types barrel re-exporting from other modules), `state.ts` (TaskStateManager singleton), `session-api.ts` (OpenCodeClient wrapper, 285 LOC), `runtime-policy.ts` (policy loader/validation, 267 LOC), `helpers.ts` (295 LOC), `tool-response.ts`, `tool-helpers.ts`, `task-status.ts`, `runtime.ts`, `app-api.ts`, `workspace-runtime-policy.ts`, `plugin-tool-output-summary.ts`
- Subdirectories: `security/` (redaction.ts, path-scope.ts)

**`src/task-management/` — State & Lifecycle:**
- Purpose: Durable state, lifecycle state machine, journals, trajectory, recovery
- Structure:
  - `continuity/` — Continuity store, delegation persistence (2 files)
  - `journal/` — Event journal index, query, replay, event-tracker (5+ files in event-tracker/)
  - `lifecycle/` — HarnessLifecycleManager class (243 LOC)
  - `recovery/` — assess-state, create-checkpoint, failure-classes, repair-state (5 files)
  - `trajectory/` — Ledger, store-operations, types, index (5 files)

**`src/sidecar/` — GUI Sidecar:**
- Purpose: Read-only state export for the json-render dashboard
- Key file: `readonly-state.ts`

**`tests/` — Test Suites:**
- Purpose: All tests organized by type (mirroring src/ structure)
- Subdirectories: `tests/lib/` (module tests), `tests/tools/` (tool tests), `tests/hooks/` (hook tests), `tests/cli/` (CLI tests), `tests/schema-kernel/` (schema tests), `tests/sidecar/`, `tests/plugins/`, `tests/integration/`
- Coverage thresholds: statements 85%, branches 72%, functions 85%, lines 85%

## Key File Locations

**Entry Points:**
- `src/plugin.ts`: Composition root — OpenCode plugin entry
- `src/index.ts`: Package public API re-exports
- `src/cli/index.ts`: CLI entry (bin: `hivemind`)
- `bin/hivemind.cjs`: CLI bin script

**Configuration:**
- `package.json`: Project manifest, dependencies, scripts, exports map
- `tsconfig.json`: TypeScript strict mode config (ES2022, NodeNext ESM)
- `vitest.config.ts`: Vitest with V8 coverage, threshold enforcement

**Core Logic:**
- `src/coordination/delegation/manager.ts`: DelegationManager — central dispatch
- `src/task-management/lifecycle/index.ts`: HarnessLifecycleManager — lifecycle state machine
- `src/features/session-tracker/index.ts`: SessionTracker — session knowledge capture
- `src/task-management/continuity/index.ts`: ContinuityStore — state persistence
- `src/coordination/completion/detector.ts`: CompletionDetector — dual-signal completion
- `src/shared/state.ts`: TaskStateManager — in-process singleton state

**Testing:**
- `tests/lib/`: Module unit tests mirroring src/
- `tests/tools/`: Tool-specific unit tests
- `tests/hooks/`: Hook-specific unit tests
- `tests/plugins/`: Plugin integration tests

## Naming Conventions

**Files:**
- `kebab-case.ts`: Regular source modules (e.g., `runtime-policy.ts`, `session-api.ts`)
- `kebab-case.schema.ts`: Zod schema files (e.g., `hivemind-configs.schema.ts`)
- `kebab-case.test.ts`: Test files (mirror source names)

**Directories:**
- `kebab-case/`: All source directories (e.g., `task-management/`, `session-tracker/`)
- Subdirectory naming mirrors module grouping (e.g., `src/hooks/lifecycle/`, `src/coordination/delegation/`)

**Classes:**
- `PascalCase`: Major abstractions (e.g., `HarnessLifecycleManager`, `DelegationManager`, `TaskStateManager`, `CompletionDetector`, `SessionTracker`, `DelegationStateMachine`, `DelegationConcurrencyQueue`)

**Types & Interfaces:**
- `PascalCase` for types and interfaces (e.g., `TaskStatus`, `Delegation`, `RuntimePolicy`, `HookDependencies`, `OpenCodeClient`)
- Status/phase types often use string literal unions (e.g., `"pending" | "queued" | "running" | "completed" | "failed"`)
- Factory functions prefixed with `create` (e.g., `createCoreHooks`, `createDelegateTaskTool`, `createHarnessLifecycleManager`)

**Functions:**
- `camelCase`: Functions and methods (e.g., `getSessionContinuity`, `patchSessionContinuity`, `dispatch`, `handleEvent`, `isValidTransition`)
- Factory functions: `create{ComponentName}`

**Variables:**
- `camelCase`: Local variables and constants
- `UPPER_SNAKE_CASE`: Module-level constants and defaults (e.g., `MAX_DELEGATION_DEPTH`, `DEFAULT_RUNTIME_POLICY`, `WATCH_TIMEOUT_MS`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/features/{feature-name}/` — create new subdirectory with `index.ts`, types, and implementation files
- If it's a deep module (not a standalone feature), place it in the appropriate sector: `src/task-management/`, `src/coordination/`, `src/config/`, `src/routing/`
- Wire into plugin: `src/plugin.ts` — import the factory, instantiate, add to tool map or hook spread

**New Tool:**
- Implementation: `src/tools/{category}/{tool-name}/index.ts` (or single file for simple tools)
- Schema: `src/schema-kernel/{tool-name}.schema.ts` (Zod validation)
- Registration: `src/plugin.ts` — add to `tool:` map object
- Test: `tests/tools/{tool-name}.test.ts`

**New Hook:**
- Implementation: `src/hooks/{category}/{hook-name}.ts` (factory function returning hook definition)
- Types: If new dependency shape needed, extend `src/hooks/types.ts`
- Registration: `src/plugin.ts` — spread-merge into plugin return object
- Test: `tests/hooks/{hook-name}.test.ts`

**New Schema:**
- Implementation: `src/schema-kernel/{domain}.schema.ts`
- Barrel: Add re-export to `src/schema-kernel/index.ts`

**New Utility:**
- Shared helpers: `src/shared/{utility-name}.ts` (must remain leaf — no imports from other src/ modules)
- Security utilities: `src/shared/security/{utility-name}.ts`

**Configuration:**
- Add new config fields: update `src/schema-kernel/hivemind-configs.schema.ts` + `src/config/subscriber.ts`

**Tests:**
- Module test: `tests/lib/{module-path}/{test-name}.test.ts` (mirrors src/ structure)
- Tool test: `tests/tools/{tool-name}.test.ts`
- Hook test: `tests/hooks/{hook-name}.test.ts`

## Special Directories

**`src/harness/`:**
- Purpose: Reserved for future harness module extraction
- Generated: No
- Committed: Yes (empty, `.gitkeep` only)

**`src/kernel/`:**
- Purpose: Reserved for future kernel module extraction
- Generated: No
- Committed: Yes (empty, `.gitkeep` only)

**`.hivemind/`:**
- Purpose: Canonical internal state root for deep module persistence
- Contains: Durable session continuity JSON, delegation records, event journals, session tracker data, execution lineage
- Generated: Yes (runtime state)
- Committed: No (runtime data, listed in `.gitignore`)
- Authority: Q6 decision — all internal state, no `.opencode/` state

**`.opencode/`:**
- Purpose: Soft Meta-Concepts — user-configurable OpenCode primitives
- Contains: 89 agent definitions, 125 skill directories, 19 commands, 3 quality gates
- Generated: No (authored primitives)
- Committed: Yes (shared configuration)
- Important: NOT for runtime state, NOT for development assets

**`docs/`:**
- Purpose: Architecture proposals, validation decisions, draft specs
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD project governance — roadmaps, phases, architecture maps, requirements
- Generated: Partially (phase artifacts)
- Committed: Yes

---

*Structure analysis: 2026-05-12*
