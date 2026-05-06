# Codebase Structure

**Analysis Date:** 2026-05-07

## Directory Layout

```
hivemind-plugin-1/
├── src/                          # Hard Harness — npm package source (~23k LOC TypeScript)
│   ├── plugin.ts                 # Composition root (183 LOC) — wires deps, creates hooks, registers 17 tools
│   ├── index.ts                  # Public API re-exports (27 LOC)
│   ├── lib/                      # Core library — 55 entries (flat files + 20 subdirectories)
│   ├── hooks/                    # Hook factories — 10 read-side observer modules
│   ├── tools/                    # Tool implementations — 16 entries (13 single-file + 3 multi-file)
│   ├── shared/                   # Cross-cutting tool utilities — 2 files
│   ├── schema-kernel/            # Zod validation schemas — 16 files
│   ├── cli/                      # Standalone CLI interface — 5 files
│   ├── sidecar/                  # Sidecar state reader — 1 file
│   ├── harness/                  # Reserved for future harness modules (.gitkeep)
│   └── kernel/                   # Reserved for future kernel modules (.gitkeep)
├── .opencode/                    # Soft Meta-Concepts — user-configurable primitives
│   ├── agents/                   # 89 agent definitions (33 gsd + 45 hm + 11 hf)
│   ├── skills/                   # 123 skill packages (canonical location)
│   ├── commands/                 # 19 command definitions
│   ├── rules/                    # Universal rules (context budget, delegation, orchestrator)
│   ├── plugins/                  # Plugin loader — prompt-enhance.ts (re-exports dist/plugin.js)
│   ├── hooks/                    # GSD workflow hooks (shell scripts for guardrails)
│   ├── tools/                    # GSD tool supplements (nl-route.ts)
│   ├── hivefiver/                # HiveFiver integration artifacts
│   ├── get-shit-done/            # GSD framework skill pack
│   ├── deny-prompts/             # Denied prompt patterns
│   ├── research/                 # Project research artifacts
│   ├── agent-tracking-pad/       # Agent tracking scratchpad
│   ├── gsd-local-patches/        # GSD local modification patches
│   ├── gsd-user-files-backup/    # GSD user file backups
│   ├── retired/                  # Retired skills/agents
│   ├── trashskills/              # Discarded skills
│   ├── state/                    # Legacy state location (Q6 migration to .hivemind/)
│   └── opencode.json             # OpenCode project config
├── .hivemind/                    # Deep Module State — internal runtime persistence
│   ├── state/                    # session-continuity.json, delegations.json, config-workflows.json
│   ├── event-tracker/            # Hook-driven audit artifacts (markdown)
│   └── poor-prompts/             # Archived poor prompt examples
├── .hivefiver-meta-builder/      # Meta-concept authoring environment
│   ├── agents-lab/               # Agent source files (active/refactoring/, orchestrator/)
│   ├── skills-lab/               # Skill source files (active/, .archive/, retired/)
│   ├── commands-lab/             # Command source files
│   ├── workflows-lab/            # Workflow definitions
│   ├── references-lab/           # Reference materials
│   ├── plans/                    # Meta-builder implementation plans
│   ├── research/                 # Research artifacts
│   └── rules/                    # Meta-builder rules
├── tests/                        # Test suite (vitest, globals: true)
│   ├── lib/                      # Unit tests mirroring src/lib/ — 55 entries
│   ├── tools/                    # Tool-focused unit tests
│   ├── hooks/                    # Hook unit tests
│   ├── schema-kernel/            # Schema validation tests
│   ├── kernel/                   # Kernel tests
│   ├── cli/                      # CLI tests
│   ├── sidecar/                  # Sidecar tests
│   ├── plugins/                  # Plugin integration tests
│   └── integration/              # Integration tests
├── dist/                         # Build output (npm pack artifact)
│   ├── plugin.js / .d.ts         # Plugin subpath entry
│   ├── index.js / .d.ts          # Main entry
│   ├── cli/                      # CLI entry
│   ├── lib/                      # Compiled library
│   ├── hooks/                    # Compiled hooks
│   ├── tools/                    # Compiled tools
│   ├── shared/                   # Compiled shared
│   ├── schema-kernel/            # Compiled schemas
│   └── sidecar/                  # Compiled sidecar
├── bin/                          # CLI binary entry (hivemind-tools.cjs)
├── .planning/                    # GSD planning artifacts
│   ├── codebase/                 # Codebase intelligence documents
│   └── archive/                  # Archived plans and phase artifacts
├── docs/                         # Project documentation
│   ├── draft/                    # Architecture proposals and drafts
│   └── proposals/                # Locked validation decisions (Q1-Q6)
├── package.json                  # npm package manifest (opencode-harness v0.1.0)
├── tsconfig.json                 # TypeScript config (strict, ES2022, NodeNext)
├── vitest.config.ts              # Vitest configuration
└── AGENTS.md                     # Agent instruction file (project-level)
```

## Directory Purposes

**`src/` — Hard Harness:**
- Purpose: The npm package runtime code — composition root, tools, hooks, library modules, schemas, CLI
- Contains: TypeScript source files (~23k LOC across ~200 files)
- Key files: `plugin.ts` (composition root), `index.ts` (public API), `lib/types.ts` (leaf type definitions)

**`src/lib/` — Core Library:**
- Purpose: All business logic — types, state, concurrency, persistence, lifecycle, delegation, SDK wrappers, completion detection, runtime policy, journals, lineage, event tracking
- Contains: 55 entries — 35 flat `.ts` files + 20 subdirectories (spawner, pty, event-tracker, security, config-workflow, control-plane, recovery, prompt-packet, session-entry, behavioral-profile, doc-intelligence, trajectory, runtime-pressure, agent-work-contracts, sdk-supervisor, command-engine, runtime-detection, etc.)
- Key files: `types.ts` (415 LOC, leaf), `delegation-manager.ts` (500 LOC, deepest consumer), `continuity.ts` (465 LOC, persistence), `concurrency.ts` (310 LOC, semaphore), `helpers.ts` (257 LOC, pure utilities)
- **Dependency rule:** `types.ts` is leaf — depends on nothing. No circular dependencies. Max depth: 2.

**`src/hooks/` — Hook Factories (Read-Side):**
- Purpose: Observe and react to OpenCode lifecycle events — CQRS read-side only, no durable writes
- Contains: 10 files — `create-core-hooks.ts`, `create-session-hooks.ts`, `create-tool-guard-hooks.ts`, `plugin-event-observers.ts`, `tool-after-composer.ts`, `messages-transform.ts`, `hook-cqrs-boundary.ts`, `governance-block.ts`, `toggle-gates.ts`, `types.ts`
- Key files: `create-core-hooks.ts` (primary event routing), `plugin-event-observers.ts` (delegation lifecycle tracking)

**`src/tools/` — Tool Implementations (Write-Side):**
- Purpose: Expose mutation operations to agents via OpenCode tool system — CQRS write-side only
- Contains: 16 entries — 13 single-file tools + 3 multi-file directory tools (prompt-skim, prompt-analyze, session-patch)
- Key files: `delegate-task.ts`, `delegation-status.ts`, `configure-primitive.ts`, `run-background-command.ts`

**`src/shared/` — Shared Tool Utilities:**
- Purpose: Standard tool response envelope and rendering — consistent output format for all tools
- Contains: 2 files — `tool-response.ts` (success/error/pending envelope), `tool-helpers.ts` (JSON rendering)
- Key files: `tool-response.ts` — provides `success()`, `error()`, `pending()` factories with `ToolResponse<T>` type

**`src/schema-kernel/` — Validation Schemas:**
- Purpose: Zod v4 validation schemas for OpenCode meta-concept validation — agent/command/skill frontmatter, permissions, MCP servers, prompt-enhance, agent work contracts, runtime pressure, trajectory, etc.
- Contains: 16 files — 15 `.schema.ts` files + `index.ts` barrel
- Key files: `agent-frontmatter.schema.ts`, `command-frontmatter.schema.ts`, `permission.schema.ts`, `config-precedence.schema.ts`

**`src/cli/` — CLI Interface:**
- Purpose: Standalone CLI for harness operations — `hivemind-tools` binary
- Contains: 5 files — `index.ts`, `router.ts`, `discovery.ts`, `renderer.ts`, `commands/help.ts`
- Key files: `index.ts` (entry point), `router.ts` (command routing)

**`.opencode/` — Soft Meta-Concepts:**
- Purpose: User-configurable OpenCode primitives — agents, skills, commands, rules, plugins
- Contains: 89 agents, 123 skills, 19 commands, permission rules, plugin loader, deny prompts, research artifacts
- Key files: `opencode.json` (project config), `plugins/prompt-enhance.ts` (control plane loader)
- **Q6 rule:** NO internal runtime state stored here — all state writes to `.hivemind/`

**`.hivemind/` — Deep Module State:**
- Purpose: Internal runtime state persistence — session continuity, delegation records, event tracker artifacts
- Contains: `state/` (JSON files for continuity, delegations, config-workflows), `event-tracker/` (markdown audit artifacts), `poor-prompts/` (archived prompts)
- Written by: `continuity.ts`, `delegation-persistence.ts`, config-workflow persistence, event tracker
- **Canonical per Q6** — this is the ONLY state root. Legacy `.opencode/state/opencode-harness/` is migration-only.

**`.hivefiver-meta-builder/` — Meta-Concept Authoring:**
- Purpose: Source-of-truth authoring environment for soft meta-concepts — skills, agents, commands, workflows
- Contains: `agents-lab/`, `skills-lab/`, `commands-lab/`, `workflows-lab/`, `references-lab/`, `plans/`, `research/`, `rules/`
- Key directory: `skills-lab/active/refactoring/` — canonical source for `.opencode/skills/` symlinks

**`tests/` — Test Suite:**
- Purpose: Vitest unit and integration tests, mirroring `src/` structure
- Contains: 9 subdirectories mirroring source — `lib/`, `tools/`, `hooks/`, `schema-kernel/`, `cli/`, `sidecar/`, `kernel/`, `plugins/`, `integration/`
- Key files: `tests/lib/` with 55 entries matching `src/lib/` module structure

**`dist/` — Build Output:**
- Purpose: Compiled TypeScript → JavaScript with declarations and source maps
- Generated: Yes (via `npm run build` — `tsc`)
- Committed: No (in `.gitignore` — packaged via `npm pack`)

**`bin/` — CLI Binary Entry:**
- Purpose: `hivemind-tools` binary entry point for npm package consumers
- Contains: `hivemind-tools.cjs`

## Key File Locations

**Entry Points:**
- `src/plugin.ts`: Composition root — `HarnessControlPlane` async plugin factory
- `src/index.ts`: Public API — re-exports `HarnessControlPlane` + entire lib surface
- `dist/index.js`: Main package entry (`"main"` in package.json)
- `dist/plugin.js`: Plugin subpath entry (`"exports": { "./plugin" }` in package.json)
- `dist/cli/index.js`: CLI subpath entry (`"exports": { "./cli" }` in package.json)
- `.opencode/plugins/prompt-enhance.ts`: OpenCode plugin loader (thin re-export)

**Configuration:**
- `package.json`: npm package manifest — name `opencode-harness`, version `0.1.0`, type `module`
- `tsconfig.json`: TypeScript config — strict mode, ES2022 target, NodeNext module resolution
- `vitest.config.ts`: Vitest configuration — globals enabled, coverage for `src/**/*.ts`
- `.opencode/opencode.json`: OpenCode project config — references AGENTS.md
- `.opencode/rules/universal-rules.md`: Universal agent rules — context budget, subagent, orchestrator

**Core Logic:**
- `src/lib/types.ts` (415 LOC): Shared types + constants — `TaskStatus`, `VALID_DELEGATION_CATEGORIES`, `RootBudget`, `TaskNotification`
- `src/lib/delegation-manager.ts` (500 LOC): Core delegation orchestrator — `DelegationManager` class
- `src/lib/continuity.ts` (465 LOC): Durable JSON persistence — load, normalize, persist, quarantine
- `src/lib/lifecycle-manager.ts` (243 LOC): Session lifecycle state machine — transitions, hydration, event handling
- `src/lib/concurrency.ts` (310 LOC): Keyed semaphore — `DelegationConcurrencyQueue` with priority queuing

**Testing:**
- `tests/lib/helpers.test.ts`: Helpers unit tests
- `tests/lib/concurrency.test.ts`: Concurrency unit tests
- `tests/lib/continuity.test.ts`: Continuity store unit tests
- `tests/lib/delegation-manager.test.ts`: Delegation manager unit tests
- `tests/lib/lifecycle-manager.test.ts`: Lifecycle manager unit tests

## Naming Conventions

**Files:**
- Library modules: `kebab-case.ts` — e.g., `session-api.ts`, `delegation-manager.ts`, `completion-detector.ts`
- Hook factories: `kebab-case.ts` with `create-` prefix — e.g., `create-core-hooks.ts`, `create-session-hooks.ts`
- Tool implementations: `kebab-case.ts` — e.g., `delegate-task.ts`, `configure-primitive.ts`
- Schema files: `kebab-case.schema.ts` — e.g., `agent-frontmatter.schema.ts`, `permission.schema.ts`
- Test files: mirrors source with `.test.ts` suffix — e.g., `helpers.test.ts`, `continuity.test.ts`
- Subdirectories: `kebab-case/` — e.g., `prompt-skim/`, `config-workflow/`, `event-tracker/`
- `.gitkeep` files in registered-but-empty directories — `src/kernel/.gitkeep`, `src/harness/.gitkeep`

**Agents:**
- `hm-l2-{specialist}.md` — Harness Module L2 specialists (e.g., `hm-l2-researcher.md`)
- `hf-l2-{specialist}.md` — HiveFiver L2 builders (e.g., `hf-l2-agent-builder.md`)
- `gsd-{role}.md` — GSD internal build tools (e.g., `gsd-code-reviewer.md`)

**Skills:**
- `hm-l2-{domain}.md` — Harness Module product-dev skills (e.g., `hm-l2-brainstorm`, `hm-l2-debug`)
- `hm-l3-{reference}.md` — Harness Module reference skills (e.g., `hm-l3-deep-research`)
- `hf-l2-{domain}.md` — HiveFiver meta-builder skills (e.g., `hf-l2-agent-composition`)
- `gate-l3-{gate}.md` — Quality gate triad skills (e.g., `gate-l3-evidence-truth`)
- `stack-l3-{tech}.md` — Stack reference skills (e.g., `stack-l3-vitest`)

**Lineage prefixes:**
| Prefix | Lineage | Scope |
|--------|---------|-------|
| `hm-*` | Harness Module | Product-dev skills & agents — STRICT |
| `hf-*` | HiveFiver | Meta-concept builders — FLEXIBLE |
| `gate-*` | Quality Triad | Internal quality gates — THIS PROJECT ONLY |
| `stack-*` | Stack Reference | Framework/stack reference materials |
| `gsd-*` | GSD Internal | Developer tooling — NOT shipped |

## Where to Add New Code

**New Tool:**
- Implementation: `src/tools/{tool-name}.ts` (single-file) or `src/tools/{tool-name}/index.ts` (multi-file)
- Schema: `src/schema-kernel/{tool-name}.schema.ts` (if Zod validation needed)
- Tests: `tests/tools/{tool-name}.test.ts`
- Registration: Add to `src/plugin.ts` tool registry (`tool: { ... }` block, lines 127-143)

**New Hook Factory:**
- Implementation: `src/hooks/create-{name}-hooks.ts` — export a factory function
- Types: `src/hooks/types.ts` — add to `HookDependencies` if new deps needed
- Tests: `tests/hooks/{name}.test.ts`
- Registration: Import in `src/plugin.ts`, wire into return object (spread-merged)

**New Library Module:**
- Implementation: `src/lib/{module-name}.ts` — follow dependency graph (leaf → consumer)
- Tests: `tests/lib/{module-name}.test.ts`
- Public API: Add to `src/index.ts` re-exports if public

**New Schema:**
- Implementation: `src/schema-kernel/{name}.schema.ts` — Zod v4 schema
- Barrel: Add to `src/schema-kernel/index.ts`

**New Agent:**
- Source: `.hivefiver-meta-builder/agents-lab/active/refactoring/{name}.md`
- Canonical: `.opencode/agents/{name}.md` (via symlink or copy from meta-builder)
- Follow hf-l2-naming-syndicate naming conventions (hm-/hf-/gate-/stack- prefixes)

**New Skill:**
- Source: `.hivefiver-meta-builder/skills-lab/active/refactoring/{name}/`
- Canonical: `.opencode/skills/{name}/` (via symlink from meta-builder)
- Required: `SKILL.md` entry point, `references/` directory, `evals/` directory

**New Command:**
- Source: `.hivefiver-meta-builder/commands-lab/active/{name}.md`
- Canonical: `.opencode/commands/{name}.md`
- Follow hf-l2-command-dev conventions (YAML frontmatter, $ARGUMENTS)

**New Feature (cross-cutting):**
- Library support: `src/lib/{feature-name}/` subdirectory
- Tools: `src/tools/{feature-name}.ts`
- Hooks: `src/hooks/create-{feature-name}-hooks.ts`
- Schemas: `src/schema-kernel/{feature-name}.schema.ts`
- Tests: mirror in `tests/lib/{feature-name}/`, `tests/tools/`, `tests/hooks/`

**Utilities:**
- Shared helpers: `src/lib/helpers.ts` (pure functions only — no side effects)
- Tool response: `src/shared/tool-response.ts` (envelope format)
- Schema helpers: `src/schema-kernel/` (Zod schemas only)

## Special Directories

**`src/kernel/`:**
- Purpose: Reserved for future kernel-level modules — currently only `.gitkeep`
- Generated: No
- Committed: Yes (as `.gitkeep`)

**`src/harness/`:**
- Purpose: Reserved for future harness-level modules — currently only `.gitkeep`
- Generated: No
- Committed: Yes (as `.gitkeep`)

**`dist/`:**
- Purpose: TypeScript compilation output — declarations, source maps, JavaScript
- Generated: Yes (via `npm run build` → `tsc`)
- Committed: No (in `.gitignore`)

**`.opencode/trashskills/`:**
- Purpose: Discarded/retired skills — kept for reference
- Generated: No
- Committed: Yes

**`.opencode/retired/`:**
- Purpose: Retired skills with `donotusethis-` prefix (e.g., `donotusethis-hm-planning-with-files`)
- Generated: No
- Committed: Yes

**`.opencode/state/`:**
- Purpose: Legacy state location (pre-Q6). Now migrated to `.hivemind/state/`.
- Generated: Yes (runtime)
- Committed: No (compatibility bridge during migration only)

**`.opencode/node_modules/`:**
- Purpose: OpenCode's own dependency isolation
- Generated: Yes
- Committed: No

**`.hivefiver-meta-builder/.hivemind/`:**
- Purpose: Meta-builder's own session state
- Generated: Yes (runtime)
- Committed: No

---

*Structure analysis: 2026-05-07*
