# Codebase Structure

**Analysis Date:** 2026-05-08

## Directory Layout

```
hivemind-plugin-private/
├── src/                          # Hard Harness npm package source (TypeScript)
│   ├── plugin.ts                 # Composition root — wires deps, registers tools, composes hooks
│   ├── index.ts                  # Public API re-exports (entry point)
│   ├── shared/                   # Leaf utilities, types, SDK wrappers, runtime policy
│   ├── task-management/          # Lifecycle, state, continuity, journals, trajectory, recovery
│   ├── coordination/             # Delegation, concurrency, completion, spawner, SDK/command delegation
│   ├── features/                 # Standalone runtime features (PTY, bootstrap, doc-intel, pressure, etc.)
│   ├── config/                   # Config subscriber, compiler, workflow state machines
│   ├── routing/                  # Session intake, behavioral profile resolution, command engine
│   ├── hooks/                    # Read-side lifecycle hooks, guards, observers, transforms
│   ├── tools/                    # Write-side tool entrypoints (delegation, hivemind, config, prompt, session)
│   ├── schema-kernel/            # Zod validation schemas for all primitives and runtime contracts
│   ├── cli/                      # Standalone CLI (discovery, routing, rendering)
│   ├── kernel/                   # Reserved: kernel-level abstractions (placeholder)
│   ├── harness/                  # Reserved: harness-level abstractions (placeholder)
│   ├── lib/                      # Deprecated (only `security/` remains during migration)
│   └── sidecar/                  # Read-only state enforcement for Next.js sidecar app
├── .hivemind/                    # Canonical deep-module state (journals, lineage, delegation records)
├── .opencode/                    # OpenCode primitives ONLY (agents, commands, skills, rules, plugins)
├── .planning/                    # GSD planning artifacts (roadmaps, specs, architecture decisions)
├── tests/                        # Test suites mirroring source structure
├── bin/                          # CLI entry point (hivemind.cjs)
├── dist/                         # Compiled output (gitignored)
├── docs/                         # Architecture proposals, PRDs, audits, requirements
├── templates/                    # Project templates
├── sidecar/                      # Next.js sidecar app (separate from harness)
├── package.json                  # npm package manifest
├── tsconfig.json                 # TypeScript strict mode config
├── vitest.config.ts              # Vitest test runner config
├── opencode.json                 # OpenCode configuration
├── AGENTS.md                     # Root agent instructions
├── README.md                     # Project README
└── CHANGELOG.md                  # Release changelog
```

## Directory Purposes

**src/:**
- Purpose: Hard Harness npm package source — TypeScript runtime composition engine for OpenCode
- Contains: All TypeScript source files organized by architectural layer
- Key files: `src/plugin.ts` (composition root), `src/index.ts` (public API), `src/shared/types.ts` (type authority)

**src/shared/:**
- Purpose: Leaf utility layer — types, state manager, helpers, SDK wrappers, runtime policy
- Contains: `types.ts`, `state.ts`, `helpers.ts`, `session-api.ts`, `runtime-policy.ts`, `workspace-runtime-policy.ts`, `tool-response.ts`, `tool-helpers.ts`, `runtime.ts`, `task-status.ts`, `app-api.ts`, `plugin-tool-output-summary.ts`, `security/`
- Key files: `src/shared/types.ts` (415 lines — core type authority), `src/shared/state.ts` (251 lines — TaskStateManager), `src/shared/runtime-policy.ts` (267 lines)
- Depends on: Only Node.js builtins and `src/coordination/delegation/types.js` (type imports)

**src/task-management/:**
- Purpose: Runtime state ownership — lifecycle, continuity, journals, recovery, trajectory
- Contains: `lifecycle/index.ts` (HarnessLifecycleManager), `continuity/` (delegation persistence), `journal/` (session journal, event tracker, execution lineage, query, replay), `recovery/`, `trajectory/`
- Key files: `src/task-management/lifecycle/index.ts` (243 lines), `src/task-management/continuity/index.ts`

**src/coordination/:**
- Purpose: Delegation orchestration — dispatch, concurrency, completion, spawner, SDK/command delegation
- Contains: `delegation/` (manager, state-machine, category-gates), `completion/` (detector, notification-handler), `concurrency/queue.ts`, `spawner/` (session-creator, spawn-request-builder, auto-loop, ralph-loop, agent-primitive-policy), `sdk-delegation/`, `command-delegation/`
- Key files: `src/coordination/delegation/manager.ts` (500 lines), `src/coordination/concurrency/queue.ts`

**src/features/:**
- Purpose: Standalone runtime features with their own lifecycle
- Contains: `background-command/pty/` (PTY manager), `bootstrap/` (init, recovery, primitive registry, runtime detection), `doc-intelligence/`, `runtime-pressure/`, `sdk-supervisor/`, `agent-work-contracts/`, `prompt-packet/`
- Key files: `src/features/bootstrap/primitive-registry.ts`, `src/features/background-command/pty/`

**src/config/:**
- Purpose: Config loading, compilation, workflow state machines
- Contains: `subscriber.ts` (lazy-load cache), `compiler.ts` (primitive compilation), `workflow/` (workflow state machine)
- Key files: `src/config/subscriber.ts` (78 lines)

**src/routing/:**
- Purpose: Session entry classification, behavioral profile resolution, command routing
- Contains: `session-entry/` (intake gate, purpose classifier, language resolution, profile resolver), `behavioral-profile/` (profile types, resolution), `command-engine/`
- Key files: `src/routing/session-entry/intake-gate.ts`, `src/routing/behavioral-profile/resolve-behavioral-profile.ts`

**src/hooks/:**
- Purpose: Read-side observers that respond to OpenCode lifecycle events
- Contains: `lifecycle/` (core-hooks, session-hooks), `guards/` (tool-guard-hooks, governance-block), `observers/event-observers.ts`, `transforms/` (tool-after-composer, toggle-gates), `composition/cqrs-boundary.ts`, `types.ts`
- Key files: `src/hooks/lifecycle/core-hooks.ts` (166 lines), `src/hooks/types.ts` (45 lines — HookDependencies)

**src/tools/:**
- Purpose: Write-side CQRS mutation tools invoked by OpenCode agents
- Contains: `delegation/` (delegate-task, delegation-status), `hivemind/` (8 tools: doc, trajectory, pressure, agent-work, SDK supervisor, command engine, background command), `config/` (configure-primitive, validate-restart, bootstrap-init, bootstrap-recover), `prompt/` (prompt-skim, prompt-analyze), `session/` (session-patch, session-journal-export)
- Key files: `src/tools/delegation/delegate-task.ts`, `src/tools/hivemind/hivemind-doc.ts`

**src/schema-kernel/:**
- Purpose: Zod validation schemas for all primitives and runtime contracts
- Contains: 19 schema files — agent/command frontmatter, skill metadata, tool definitions, permissions, MCP servers, Hivemind configs, bootstrap, prompt-enhance, runtime pressure, SDK supervisor, trajectory, agent work contracts, config precedence, doc intelligence, command engine
- Key files: `src/schema-kernel/hivemind-configs.schema.ts`, `src/schema-kernel/index.ts`

**src/cli/:**
- Purpose: Standalone CLI tool for primitive discovery and rendering
- Contains: `index.ts`, `discovery.ts`, `router.ts`, `renderer.ts`, `commands/`

**src/kernel/ and src/harness/:**
- Purpose: Reserved placeholder directories (`.gitkeep` only)
- Contains: Empty — staged for future kernel/harness-level abstractions

**src/lib/:**
- Purpose: Deprecated — being migrated to new structure
- Contains: `security/` only (remaining files during migration)

**src/sidecar/:**
- Purpose: Read-only enforcement contract for the Next.js sidecar GUI
- Contains: `readonly-state.ts` (120 lines — read helpers + `refuseCanonicalWrite()` guard)

**.hivemind/:**
- Purpose: Canonical deep-module state root (isolated from `.opencode/`)
- Contains: `state/` (continuity files), `delegation/` (delegation records), `event-tracker/`, `hf-brain/`, `manifests/`, `registries/`, `onboarding/`, `poor-prompts/`, `configs.json`, `configs.schema.json`
- Generated: Yes (runtime artifacts)
- Committed: Some (schemas, configs); runtime state in `.gitignore`

**.opencode/:**
- Purpose: OpenCode primitives ONLY — agents, commands, skills, rules, plugins
- Contains: `agents/` (89 agents), `skills/` (59+ skills), `commands/` (18 commands), `rules/`, `plugins/`, `hooks/`, `tools/`, `settings.json`, `opencode.json`
- Generated: No (manually authored meta-concepts)
- Committed: Yes

**.planning/:**
- Purpose: GSD planning artifacts — roadmap, specs, architecture decisions, codebase map
- Contains: `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md`, `phases/`, `specs/`, `architecture/`, `research/`, `audits/`, `config/`, `lifecycle/`
- Generated: Yes (planning workflow artifacts)
- Committed: Yes

**tests/:**
- Purpose: Test suites mirroring source structure
- Contains: `lib/`, `tools/`, `hooks/`, `cli/`, `plugins/`, `schema-kernel/`, `kernel/`, `sidecar/`, `integration/`
- Key files: Test files follow `.test.ts` naming, co-located in `tests/` (not next to source)

**bin/:**
- Purpose: CLI entry point for npm package
- Contains: `hivemind.cjs` — CommonJS bootstrap for the CLI

## Key File Locations

**Entry Points:**
- `src/plugin.ts`: Plugin composition root — instantiate deps, wire hooks, register 18 tools
- `src/index.ts`: Public API surface — re-exports HarnessControlPlane + key modules
- `bin/hivemind.cjs`: CLI bootstrap
- `dist/index.js`: Compiled npm package entry
- `dist/plugin.js`: Compiled plugin entry

**Configuration:**
- `tsconfig.json`: TypeScript strict mode, ES2022 target, NodeNext module, verbatimModuleSyntax
- `vitest.config.ts`: Vitest runner config
- `opencode.json`: OpenCode project configuration
- `.hivemind/configs.json`: Hivemind runtime configuration
- `.hivemind/configs.schema.json`: Configuration JSON schema

**Core Logic:**
- `src/shared/types.ts`: Type authority — TaskStatus, DelegationMeta, RuntimePolicy, SessionLifecyclePhase
- `src/shared/state.ts`: TaskStateManager — in-memory session/budget/concurrency state
- `src/task-management/lifecycle/index.ts`: HarnessLifecycleManager — session FSM
- `src/coordination/delegation/manager.ts`: DelegationManager — WaiterModel dispatch, dual-signal completion
- `src/coordination/completion/detector.ts`: CompletionDetector — idle/error/deleted event handling
- `src/coordination/concurrency/queue.ts`: DelegationConcurrencyQueue — per-key slot gating

**Testing:**
- `tests/lib/`: Source-level unit tests for runtime modules
- `tests/tools/`: Tool-level unit tests
- `tests/hooks/`: Hook behavior tests
- `tests/integration/`: Cross-module integration tests
- `tests/cli/`: CLI tests
- `tests/schema-kernel/`: Schema validation tests

## Naming Conventions

**Files:**
- `kebab-case.ts`: All TypeScript source files — e.g., `delegate-task.ts`, `session-api.ts`
- `kebab-case.schema.ts`: Zod schema files — e.g., `hivemind-configs.schema.ts`, `agent-frontmatter.schema.ts`
- `kebab-case.test.ts`: Test files — e.g., `helpers.test.ts`, `delegate-task.test.ts`
- `index.ts`: Barrel re-exports for directories with multiple exports
- `AGENTS.md`: Sector-level guidance in each `src/` subdirectory

**Directories:**
- `kebab-case/`: All directories — e.g., `task-management/`, `schema-kernel/`, `background-command/`
- Tool directories: Either flat file (`src/tools/{tool-name}.ts`) or subdirectory with index (`src/tools/{tool-name}/index.ts`)
- Feature directories: Subdirectory per feature — e.g., `features/background-command/pty/`

**Exports:**
- **Named exports preferred:** All modules use named `export` over `export default`
- `export default` used only for `HarnessControlPlane` in `src/plugin.ts`
- `import type` for all type-only imports (verbatimModuleSyntax enforced)
- `.js` extension required in all ESM relative imports

## Where to Add New Code

**New Feature:**
- Primary code: `src/features/{feature-name}/` — standalone feature module
- Schemas: `src/schema-kernel/{feature-name}.schema.ts`
- Tests: `tests/lib/` or `tests/tools/` (mirror source location)
- Tool entry: `src/tools/` if the feature exposes a user-invokable tool
- Hook integration: `src/hooks/` if the feature needs to observe lifecycle events

**New Tool:**
- Implementation: `src/tools/{category}/{tool-name}.ts` or `src/tools/{category}/{tool-name}/index.ts`
- Schema (if input validation needed): `src/schema-kernel/{tool-name}.schema.ts`
- Registration: Add `create{ToolName}Tool()` call in `src/plugin.ts` tool map
- Tests: `tests/tools/{category}/{tool-name}.test.ts`

**New Hook:**
- Implementation: `src/hooks/{lifecycle|guards|observers|transforms}/create-{name}-hooks.ts`
- Types: Add to `src/hooks/types.ts` if new dependency needed
- Registration: Wire factory in `src/plugin.ts` and spread-merge into return object
- Tests: `tests/hooks/{name}.test.ts`

**New Lifecycle/Runtime Manager:**
- Implementation: `src/task-management/{module-name}/` or `src/coordination/{module-name}/`
- Dependency injection: Pass through `HookDependencies` in `src/hooks/types.ts`
- Tests: `tests/lib/`

**New Schema:**
- Location: `src/schema-kernel/{name}.schema.ts`
- Re-export: `src/schema-kernel/index.ts` barrel file

**Utilities:**
- Shared helpers: `src/shared/helpers.ts` or new focused file in `src/shared/`
- Type definitions: `src/shared/types.ts`
- Do NOT create a generic `utils/` dumping ground

## Special Directories

**dist/:**
- Purpose: Compiled TypeScript output with declarations + source maps
- Generated: Yes (`npm run build`)
- Committed: No (in `.gitignore`)

**.hivemind/state/:**
- Purpose: Runtime continuity state (delegation records, session lineage)
- Generated: Yes (runtime artifact)
- Committed: No (runtime state — `.gitignore`d)

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (`npm install`)
- Committed: No

**src/kernel/ and src/harness/:**
- Purpose: Reserved for future kernel-level and harness-level abstractions
- Generated: No (placeholder `.gitkeep`)
- Committed: Yes (`.gitkeep` only)

---

*Structure analysis: 2026-05-08*
