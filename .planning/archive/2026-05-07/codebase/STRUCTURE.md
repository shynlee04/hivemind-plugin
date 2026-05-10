<!-- generated-by: gsd-doc-writer -->
# Codebase Structure

**Analysis Date:** 2026-04-28
**Updated:** 2026-05-06

## Directory Layout

```
[project-root]/
├── src/                          # Hard Harness — npm package source (TypeScript)
│   ├── plugin.ts                 # Composition root — wires hooks + tools (~142 LOC)
│   ├── index.ts                  # Public API re-exports
│   ├── lib/                      # Core library — business logic (34 modules)
│   │   ├── types.ts              # Shared types + constants — LEAF (no imports)
│   │   ├── helpers.ts            # Pure utilities only
│   │   ├── state.ts              # In-memory Maps (sessionStats, rootBudgets)
│   │   ├── concurrency.ts        # Keyed semaphore (FIFO lanes)
│   │   ├── continuity.ts         # Durable JSON persistence (~455 LOC)
│   │   ├── completion-detector.ts # Two-signal completion detection
│   │   ├── task-status.ts        # Task status transitions + guards
│   │   ├── session-api.ts        # Typed OpenCode SDK wrappers
│   │   ├── lifecycle-manager.ts  # Session lifecycle state machine
│   │   ├── delegation-manager.ts # Core delegation orchestrator (~656 LOC)
│   │   ├── delegation-persistence.ts # Delegation record I/O
│   │   ├── notification-handler.ts  # Parent session notification (ACTIVE — re-activated Phase 16.2)
│   │   ├── sdk-delegation.ts     # SDK child-session polling (~209 LOC)
│   │   ├── command-delegation.ts # PTY/headless process delegation (~401 LOC)
│   │   ├── runtime-policy.ts     # Trusted runtime policy loading
│   │   ├── workspace-runtime-policy.ts # Workspace-level policy resolution
│   │   ├── runtime-validator.ts  # Runtime validation helpers
│   │   ├── category-gates.ts     # Category gate decision logic
│   │   ├── category-gate-audit.ts # Category gate denial auditing
│   │   ├── app-api.ts            # SDK app agent registry wrapper
│   │   ├── primitive-loader.ts   # Agent/command/skill primitive loading
│   │   ├── framework-detector.ts # Framework detection utilities
│   │   ├── cross-primitive-validator.ts # Cross-primitive conflict detection
│   │   ├── config-compiler.ts    # Configuration compilation
│   │   ├── plugin-tool-output-summary.ts # Tool output summarization
│   │   ├── session-journal.ts    # Append-only event timeline (~119 LOC)
│   │   ├── execution-lineage.ts  # Derived projection (~122 LOC)
│   │   ├── spawner/              # Agent primitive policy + session creation
│   │   │   ├── agent-primitive-policy.ts # Agent .md frontmatter enrichment
│   │   │   ├── concurrency-key.ts       # Delegation concurrency key resolution
│   │   │   ├── parent-directory.ts      # Working directory resolution
│   │   │   ├── session-creator.ts       # SDK session creation
│   │   │   ├── spawn-request-builder.ts # Delegation request assembly
│   │   │   └── spawner-types.ts         # Spawner-specific types
│   │   ├── pty/                  # PTY pseudo-terminal integration
│   │   │   ├── pty-runtime.ts    # Lazy-loaded bun-pty with fallback
│   │   │   ├── pty-manager.ts    # PTY session lifecycle
│   │   │   ├── pty-buffer.ts     # PTY output buffering
│   │   │   └── pty-types.ts      # PTY-specific types
│   │   ├── event-tracker/        # Hook-driven audit trail
│   │   │   ├── index.ts          # Barrel re-export
│   │   │   ├── types.ts          # Event tracker types
│   │   │   ├── parser.ts         # Event parsing
│   │   │   ├── hook-event.ts     # Hook event → tracker integration
│   │   │   ├── document-store.ts # Document storage
│   │   │   ├── markdown-renderer.ts # Markdown artifact rendering
│   │   │   ├── artifact-writer.ts   # Filesystem artifact writing
│   │   │   └── writer.ts         # Top-level writer
│   │   ├── security/             # Security utilities
│   │   │   ├── path-scope.ts     # Path traversal prevention
│   │   │   └── redaction.ts      # Boundary field redaction
│   │   └── config-workflow/      # Turn-based config workflow state
│   │       ├── index.ts          # Barrel re-export
│   │       ├── workflow-types.ts # Workflow type definitions
│   │       ├── workflow-state.ts # State machine logic
│   │       ├── workflow-persistence.ts # JSON persistence
│   │       └── workflow-guards.ts # Validation guards
│   ├── hooks/                    # Hook factories (7 modules)
│   │   ├── types.ts              # HookDependencies interface
│   │   ├── hook-cqrs-boundary.ts # CQRS enforcement (classify, assert)
│   │   ├── create-core-hooks.ts  # event, messages.transform, shell.env, system.transform
│   │   ├── create-session-hooks.ts # auto-loop, session.compacting
│   │   ├── create-tool-guard-hooks.ts # tool.execute.before/after
│   │   ├── plugin-event-observers.ts # Delegation + journey event observers
│   │   └── tool-after-composer.ts # tool.execute.after hook composer
│   ├── tools/                    # Tool implementations (16 tools)
│   │   ├── delegate-task.ts      # WaiterModel delegation dispatch
│   │   ├── delegation-status.ts  # Poll delegation status/results
│   │   ├── run-background-command.ts # PTY background command (~221 LOC)
│   │   ├── configure-primitive.ts # OpenCode primitive configuration
│   │   ├── configure-primitive-paths.ts # Configuration path helpers
│   │   ├── validate-restart.ts   # Post-restart validation
│   │   ├── session-journal-export.ts # Journal + lineage export
│   │   ├── prompt-skim/          # Fast prompt content scan
│   │   │   ├── index.ts, tools.ts, types.ts
│   │   ├── prompt-analyze/       # Deep prompt analysis
│   │   │   ├── index.ts, tools.ts, types.ts
│   │   └── session-patch/        # Session file patching
│   │       ├── index.ts, tools.ts, types.ts
│   ├── shared/                   # Cross-cutting tool utilities (2 modules)
│   │   ├── tool-response.ts      # Standard response envelope
│   │   └── tool-helpers.ts       # JSON rendering helper
│   ├── schema-kernel/            # Zod schemas (9 modules)
│   │   ├── index.ts              # Barrel + validateWithFallback()
│   │   ├── prompt-enhance.schema.ts
│   │   ├── agent-frontmatter.schema.ts
│   │   ├── command-frontmatter.schema.ts
│   │   ├── permission.schema.ts
│   │   ├── skill-metadata.schema.ts
│   │   ├── mcp-server.schema.ts
│   │   ├── tool-definition.schema.ts
│   │   └── config-precedence.schema.ts
│   └── [placeholders]/           # Future expansion slots
│       ├── kernel/               # (.gitkeep only)
│       ├── harness/              # (.gitkeep only)
│       ├── cli/                  # (.gitkeep only)
│       ├── config/               # (empty)
│       ├── plugins/              # (empty)
│       └── validation/           # (empty)
├── tests/                        # Test suite (vitest)
│   ├── lib/                      # Unit tests for src/lib/ (35+ test files)
│   │   ├── [module].test.ts      # 1:1 mirror of src/lib/
│   │   ├── config-workflow/      # Config workflow tests
│   │   ├── event-tracker/        # Event tracker tests
│   │   ├── helpers/              # Helper function tests
│   │   ├── pty/                  # PTY tests
│   │   ├── security/             # Security tests
│   │   └── spawner/              # Spawner tests
│   ├── tools/                    # Tool tests (9 test files)
│   ├── hooks/                    # Hook tests
│   ├── integration/              # Integration tests
│   ├── kernel/                   # Kernel tests
│   ├── plugins/                  # Plugin tests
│   └── schema-kernel/            # Schema tests
├── .opencode/                    # Soft Meta-Concepts (user-configurable)
│   ├── agents/                   # 89 agent definitions (.md with YAML frontmatter)
│   ├── skills/                   # 123 skills (SKILL.md + references/)
│   ├── commands/                 # 18 commands (.md with YAML frontmatter)
│   ├── rules/                    # Universal rules (universal-rules.md)
│   ├── plugins/                  # Plugin loaders (prompt-enhance.ts)
│   ├── tools/                    # OpenCode-native tools (nl-route.ts)
│   ├── hooks/                    # OpenCode-native hooks
│   ├── ask-prompts/             # Denied prompt patterns
│   ├── settings.json             # OpenCode settings
│   └── opencode.json             # OpenCode project config
├── .hivemind/                    # Deep Module State (internal, Q6 canonical)
│   ├── state/                    # Runtime state files
│   │   ├── session-continuity.json   # Durable session continuity store
│   │   ├── delegations.json          # Delegation records
│   │   ├── config-workflows.json     # Config workflow state
│   │   ├── planning/                 # Planning persistence
│   │   └── .patches/                 # Patch artifacts
│   ├── event-tracker/            # Hook-driven audit trail artifacts
│   ├── journal/                  # Session journal entries
│   ├── lineage/                  # Execution lineage records
│   ├── research/                 # Research findings
│   ├── archive/                  # Archived state
│   ├── cycle2/                   # Cycle 2 artifacts
│   └── daily-notes/              # Daily session notes
├── .planning/                    # Project planning documents (GSD)
│   ├── PROJECT.md                # Project overview + requirements
│   ├── ROADMAP.md                # Milestone roadmap
│   ├── codebase/                 # Codebase mapping docs (destination)
│   ├── intel/                    # Codebase intelligence
│   ├── milestones/               # Milestone definitions
│   ├── phases/                   # Phase artifacts
│   ├── research/                 # Research findings
│   ├── audits/                   # Audit reports
│   ├── todos/                    # Todo tracking
│   ├── roadmaps/                 # Roadmap variants
│   ├── spikes/                   # Spike artifacts
│   ├── reports/                  # Project reports
│   ├── forensics/                # Forensics investigations
│   ├── debug/                    # Debug artifacts
│   ├── checkpoints/              # Checkpoint data
│   ├── config.json               # Planning configuration
│   └── STATE.md                  # Current workflow state
├── docs/                         # Design documents + proposals
│   ├── draft/                    # Architecture proposals
│   ├── proposals/                # Decision proposals
│   ├── designs/                  # Design documents
│   ├── research/                 # Research documents
│   ├── project/                  # Project docs
│   ├── publications/             # Publication drafts
│   ├── harness-techniques/       # Harness techniques
│   ├── .archive/                 # Archived docs
│   └── ...                       # Audit reports, plans, comparisons
├── bin/                          # CLI validation scripts (3 bash scripts)
│   ├── validate-agent-config.sh
│   ├── validate-load-order.sh
│   └── validate-runtime-paths.sh
├── dist/                         # Compiled output (generated, gitignored)
├── package.json                  # npm package definition (opencode-harness v0.1.0)
├── tsconfig.json                 # TypeScript config (strict, ES2022, NodeNext)
├── vitest.config.ts              # Test config (globals, 70% coverage thresholds)
├── opencode.json                 # OpenCode project config (plugin + permissions)
├── mcp.json                      # MCP server configuration
├── AGENTS.md                     # Agent instructions (project overview + rules)
├── README.md                     # Project readme
└── LICENSE                       # License file
```

## Directory Purposes

**src/ (Hard Harness):**
- Purpose: The npm package `opencode-harness` — TypeScript source compiled to `dist/`. Provides the `HarnessControlPlane` plugin that wires tools (write-side) and hooks (read-side) into OpenCode.
- Contains: Plugin composition root, 16 tools, 7 hook factories, library modules, 9 Zod schemas, 2 shared utilities
- Key files: `plugin.ts` (composition root), `index.ts` (public API), `lib/types.ts` (shared types leaf)

**tests/:**
- Purpose: Vitest test suite with globals enabled. Mirror structure of `src/` for unit tests plus dedicated integration, kernel, and plugin test directories.
- Contains: 35+ lib test files, 9 tool test files, hook tests, integration tests
- Key files: `lib/delegation-manager.test.ts`, `lib/concurrency.test.ts`, `tools/delegate-task.test.ts`

**.opencode/ (Soft Meta-Concepts):**
- Purpose: User-configurable OpenCode primitives that compose runtime behavior. Agents define specialist roles with permissions and tools; skills define reusable workflows; commands define slash-command interactions.
- Contains: 89 agent definitions, 123 skills, 18 commands, permission rules, plugin loader, native tools
- Key files: `agents/gsd-codebase-mapper.md`, `skills/hm-detective/SKILL.md`, `commands/plan.md`

**.hivemind/ (Deep Module State):**
- Purpose: Internal runtime state persistence — the canonical state root per Q6 decision. Contains session continuity, delegation records, execution lineage, event tracker artifacts, and session journals.
- Contains: `state/` (JSON files), `event-tracker/` (audit artifacts), `journal/`, `lineage/`, `research/`, `archive/`, `daily-notes/`
- Key files: `state/session-continuity.json`, `state/delegations.json`, `state/config-workflows.json`

**.planning/ (Project Planning):**
- Purpose: GSD planning framework artifacts — project definitions, roadmaps, codebase maps, intel, milestones, phase plans, research, audits, and workflow state.
- Contains: `PROJECT.md`, `ROADMAP.md`, `codebase/`, `intel/`, `milestones/`, `phases/`, `research/`, `audits/`
- Key files: `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `config.json`

**docs/ (Design Documents):**
- Purpose: Architecture proposals, decision records, design documents, research papers, audit reports — reference material for understanding and evolving the project.
- Contains: `draft/`, `proposals/`, `designs/`, `research/`, `papers/`, `publications/`, `.archive/`
- Key files: `draft/architecture-proposal-hivemind-v3.md`, `proposals/VALIDATION-DECISIONS-2026-04-25.md`

**bin/ (CLI Scripts):**
- Purpose: Shell scripts for runtime validation — report facts, leave judgment to agents. No governance scripts that block progression.
- Contains: 3 bash validation scripts
- Key files: `validate-agent-config.sh`, `validate-load-order.sh`, `validate-runtime-paths.sh`

**dist/ (Compiled Output):**
- Purpose: TypeScript compilation output with declarations, declaration maps, and source maps
- Contains: `dist/index.js`, `dist/plugin.js`, `dist/**` (mirrors `src/`)
- Generated: Yes (`npm run build`)
- Committed: No (gitignored)

## Key File Locations

**Entry Points:**
- `src/plugin.ts`: Plugin composition root — instantiated by OpenCode via `opencode.json` `"plugin": ["./dist/plugin.js"]`
- `src/index.ts`: Public API — re-exports `HarnessControlPlane` as default + named export + entire lib surface
- `package.json`: Package definition — `"main": "./dist/index.js"`, exports `"."` and `"./plugin"`

**Configuration:**
- `opencode.json`: OpenCode project config — plugin array, permission rules, compaction settings
- `tsconfig.json`: TypeScript strict mode, ES2022 target, NodeNext modules, `verbatimModuleSyntax: true`
- `vitest.config.ts`: Test runner config — globals: true, 70/60/70/70 coverage thresholds, v8 provider
- `mcp.json`: MCP server definitions
- `package.json`: npm scripts (`build`, `test`, `typecheck`, `clean`, `prepack`)

**Core Logic:**
- `src/lib/types.ts`: All shared types, constants, status mappings — the dependency leaf that everything imports
- `src/lib/delegation-manager.ts`: Core delegation orchestrator — WaiterModel dispatch, concurrency, recovery
- `src/lib/lifecycle-manager.ts`: Session lifecycle state machine — transition guards, event routing
- `src/lib/concurrency.ts`: `DelegationConcurrencyQueue` — keyed semaphore with FIFO lanes
- `src/lib/continuity.ts`: Durable JSON persistence — canonical state writes to `.hivemind/state/`
- `src/lib/session-api.ts`: Typed OpenCode SDK wrappers — create, get, abort, messages, prompt, walkParentChain

**Testing:**
- `tests/lib/`: Unit tests mirroring `src/lib/` — 35+ test files, one per module + subdirectories for complex modules
- `tests/tools/`: Tool tests — 9 test files, one per tool
- `tests/hooks/`: Hook tests
- `tests/integration/`: Integration tests
- `vitest.config.ts`: Test configuration

## Naming Conventions

**Files:**
- Source: `kebab-case.ts` — e.g., `delegation-manager.ts`, `session-api.ts`, `runtime-policy.ts`
- Tests: `kebab-case.test.ts` — e.g., `delegation-manager.test.ts`, `concurrency.test.ts`
- Schema files: `kebab-case.schema.ts` — e.g., `agent-frontmatter.schema.ts`, `prompt-enhance.schema.ts`
- Agent definitions: `kebab-case.md` — e.g., `gsd-codebase-mapper.md`, `hivefiver-orchestrator.md`
- Skill directories: `kebab-case/` — e.g., `hm-detective/`, `hm-deep-research/`
- Command files: `kebab-case.md` — e.g., `start-work.md`, `deep-init.md`

**Directories:**
- Top-level: `src/`, `tests/`, `docs/`, `bin/`, `dist/`, `.opencode/`, `.hivemind/`, `.planning/`
- Lib subdirectories: `spawner/`, `pty/`, `event-tracker/`, `security/`, `config-workflow/`
- Tool subdirectories for multi-file tools: `prompt-skim/`, `prompt-analyze/`, `session-patch/`
- Test subdirectories for complex test suites: `config-workflow/`, `event-tracker/`, `helpers/`, `pty/`, `security/`, `spawner/`

**Functions:**
- camelCase: `getSessionContinuity()`, `buildDelegationQueueKey()`, `assertValidSessionID()`
- Factories: `create*` prefix — `createCoreHooks()`, `createDelegateTaskTool()`, `createPtyManagerIfSupported()`
- Guards: `assert*` prefix — `assertValidSessionID()`, `assertHookWriteBoundary()`, `assertStateRole()`
- Predicates: `is*` / `can*` — `isValidTransition()`, `isTerminalPhase()`, `canTransition()`, `isSuccess()`
- Resolvers: `resolve*` / `get*` — `resolveContinuityFilePath()`, `getEventSessionID()`, `resolveConcurrencyForKey()`

**Types:**
- PascalCase for types/interfaces: `DelegationManager`, `RuntimePolicy`, `HarnessLifecycleManager`
- PascalCase for enums/const unions: `DelegationStatus`, `TaskStatus`, `SessionLifecyclePhase`
- `type` imports via `import type` for type-only usage (enforced by `verbatimModuleSyntax`)

**Constants:**
- UPPER_SNAKE_CASE: `DEFAULT_CONCURRENCY_LIMIT`, `MAX_DESCENDANTS_PER_ROOT`, `VALID_DELEGATION_CATEGORIES`, `CANONICAL_STATE_DIR`

## Where to Add New Code

**New Tool:**
- Primary code: `src/tools/new-tool.ts` (single file) or `src/tools/new-tool/` (multi-file)
- Use `tool()` from `@opencode-ai/plugin/tool`, Zod schema, `ToolResponse` envelope
- Tests: `tests/tools/new-tool.test.ts`
- Register in `src/plugin.ts` → `tool: { "new-tool": createNewTool(...) }`

**New Hook:**
- Primary code: `src/hooks/create-new-hooks.ts` (factory function)
- Inject dependencies via `HookDependencies` interface (`src/hooks/types.ts`)
- Tests: `tests/hooks/` (existing directory)
- Register in `src/plugin.ts` via spread-merge

**New Library Module:**
- Implementation: `src/lib/new-module.ts`
- Must not exceed 500 LOC
- If it imports `types.ts`, it's a consumer (normal)
- If nothing imports it yet, it's a new leaf
- Tests: `tests/lib/new-module.test.ts`
- If growing complex, create `src/lib/new-module/` subdirectory

**New Agent Definition:**
- Implementation: `.opencode/agents/new-agent.md` (YAML frontmatter + markdown body)
- Follow agent `.md` template conventions (name, description, tools, model, temperature)

**New Skill:**
- Implementation: `.opencode/skills/new-skill/SKILL.md` (frontmatter + content)
- Reference material in `.opencode/skills/new-skill/references/`
- Follow `hf-use-authoring-skills` conventions

**New Command:**
- Implementation: `.opencode/commands/new-command.md` (YAML frontmatter + content)
- Handle `$ARGUMENTS` for dynamic args, `!bash` for shell execution

**Utilities:**
- Shared helpers: `src/shared/` (for tool-related utilities) or `src/lib/helpers.ts` (for general utilities)
- Schema: `src/schema-kernel/new-schema.schema.ts`

## Special Directories

**src/lib/AGENTS.md:**
- Purpose: Auto-generated module-level documentation covering responsibilities, dependency graph, and conventions for the `src/lib/` directory
- Generated: Yes (by agent processes)
- Committed: Yes

**src/kernel/, src/harness/, src/cli/, src/plugins/, src/config/, src/validation/:**
- Purpose: Reserved for future expansion — currently contain only `.gitkeep` or are empty
- Generated: No
- Committed: Yes (`.gitkeep` files)

**dist/:**
- Purpose: Compiled TypeScript output with declarations, declaration maps, and source maps
- Generated: Yes (`npm run build`)
- Committed: No (gitignored)

**.hivemind/state/:**
- Purpose: Canonical state root (Q6) — runtime persistence files
- Generated: Yes (at runtime by harness)
- Committed: Yes (runtime state needed for session continuity)

**.planning/codebase/:**
- Purpose: Codebase mapping documents consumed by other GSD commands
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes

---

*Structure analysis: 2026-04-28 — updated 2026-05-06 (HER-2 count corrections)*
