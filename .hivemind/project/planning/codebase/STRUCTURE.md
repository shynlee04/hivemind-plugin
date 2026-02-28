# Codebase Structure

> Generated: 2026-02-28 | Source: src/ (143 .ts files)

## Directory Layout

```
hivemind-plugin/
├── src/                          # Main source code
│   ├── index.ts                  # Plugin factory entry point (186 lines)
│   ├── cli.ts                    # CLI binary entry point
│   ├── tools/                    # 14 tool definitions + index (15 files)
│   ├── hooks/                    # 6 hooks + helpers (13 files)
│   │   └── session_coherence/    # Session coherence sub-module (3 files)
│   ├── lib/                      # Core engine (61 top-level + sub-dirs)
│   │   ├── graph/                # Graph I/O split (4 files)
│   │   ├── code-intel/           # AST/LSP/codemap engine (18 files)
│   │   ├── bridges/              # External integrations (1 file)
│   │   └── fs/                   # Planning filesystem ops (3 files)
│   ├── schemas/                  # Zod validation schemas (14 files)
│   ├── cli/                      # CLI commands (4 files)
│   ├── dashboard-v2/             # Separate TUI dashboard sub-project
│   ├── types/                    # Type declarations (2 files)
│   └── utils/                    # String utilities (1 file)
├── tests/                        # Test files (mirroring src/ structure)
├── dist/                         # Compiled output (git-ignored)
├── docs/                         # Documentation and plans
│   └── plans/                    # PRDs, roadmaps, master plans
├── agents/                       # Agent definitions
├── commands/                     # Slash command definitions
├── workflows/                    # Workflow YAML definitions
├── templates/                    # Template files
├── prompts/                      # Prompt templates
├── references/                   # Reference documents
├── scripts/                      # Build/utility scripts
├── bin/                          # Binary entry points
├── bridges/                      # External bridge configs
├── modules/                      # Module definitions
├── skills/                       # Skill definitions
├── tasks/                        # Task definitions
├── .opencode/                    # OpenCode plugin config
│   ├── agents/                   # Agent YAML definitions
│   ├── skills/                   # Plugin skills
│   └── plugin/                   # Plugin configuration
├── .hivemind/                    # Runtime state (managed by plugin)
│   ├── config.json               # Governance configuration
│   ├── state/                    # Hot state (brain, hierarchy, anchors)
│   ├── memory/                   # Cross-session memories
│   ├── graph/                    # Relational graph (trajectory, plans, tasks, mems)
│   ├── sessions/                 # Active + archived sessions
│   ├── codemap/                  # Codebase structure maps
│   └── logs/                     # Runtime logs
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── opencode.json                 # OpenCode plugin manifest
├── AGENTS.md                     # Agent instructions
├── AGENT_RULES.md                # Architectural philosophy
├── SYSTEM-DIRECTIVES.md          # System-level directives
└── README.md                     # Public documentation
```

## Directory Purposes

### `src/tools/` (15 files)
- **Purpose:** OpenCode tool definitions — the write-side of CQRS
- **Contains:** One file per tool, each exporting a `createHivemind*Tool(directory)` factory
- **Key files:**
  - `src/tools/index.ts` — barrel exports for all 14 tool factories
  - `src/tools/hivemind-session.ts` (360 lines) — session lifecycle: start, update, close, status, resume
  - `src/tools/hivemind-codemap.ts` — code intelligence: scan, compress, status, search, inject, commit
  - `src/tools/hivemind-context.ts` — context governance: validate, purge, doctor, resume
  - `src/tools/hivemind-ideate.ts` — Q.U.A.N.T. ideation matrix evaluation

### `src/hooks/` (13 files)
- **Purpose:** OpenCode hook handlers — the read-side observers
- **Contains:** Hook factories + SDK context management + session coherence sub-module
- **Key files:**
  - `src/hooks/index.ts` — barrel exports for 5 hook factories + SDK context
  - `src/hooks/messages-transform.ts` (679 lines) — largest hook, USER channel context injection
  - `src/hooks/soft-governance.ts` (691 lines) — counter/detection engine firing after every tool call
  - `src/hooks/tool-gate.ts` (463 lines) — pre-tool governance advisory (never blocks)
  - `src/hooks/session-lifecycle.ts` (231 lines) — SYSTEM prompt compilation
  - `src/hooks/session-lifecycle-helpers.ts` (479 lines) — bootstrap/first-turn context builders
  - `src/hooks/sdk-context.ts` (107 lines) — SDK singleton wiring
  - `src/hooks/compaction.ts` (246 lines) — hierarchy preservation across compaction
  - `src/hooks/event-handler.ts` (418 lines) — OpenCode event processing (session, file, todo)

### `src/lib/` (61 top-level files + 4 subdirectories)
- **Purpose:** Core business logic engine — pure TypeScript, no OpenCode SDK dependency
- **Contains:** State management, graph operations, detection algorithms, session logic, code intelligence
- **Key files:**
  - `src/lib/paths.ts` (530 lines) — **SOT** for all `.hivemind/` path resolution
  - `src/lib/persistence.ts` (376 lines) — atomic file I/O with locking
  - `src/lib/state-mutation-queue.ts` (670 lines) — CQRS mutation queue
  - `src/lib/hierarchy-tree.ts` (1070 lines) — largest file, full tree engine
  - `src/lib/session-engine.ts` (640 lines) — session lifecycle operations
  - `src/lib/cognitive-packer.ts` (622 lines) — deterministic XML context compiler
  - `src/lib/session-governance.ts` (317 lines) — governance signal compilation
  - `src/lib/detection.ts` — tool classification, keyword scanning, governance severity
  - `src/lib/graph-io.ts` (39 lines) — facade re-exporting from `graph/` sub-modules
  - `src/lib/event-bus.ts` (133 lines) — in-process EventEmitter singleton
  - `src/lib/watcher.ts` (217 lines) — fs.watch with debouncing

### `src/lib/graph/` (4 files)
- **Purpose:** Graph persistence layer split by read/write concerns
- **Contains:**
  - `reader.ts` — `loadTrajectory`, `loadGraphTasks`, `loadGraphMems`, `loadPlans`
  - `writer.ts` — `saveTrajectory`, `saveGraphTasks`, `addGraphMem`, `flagFalsePath`
  - `fk-validator.ts` — foreign key constraint validation
  - `shared.ts` — shared types (`OrphanRecord`)

### `src/lib/code-intel/` (18 files)
- **Purpose:** Code intelligence engine — AST analysis, LSP integration, codemap
- **Contains:**
  - `index.ts` — barrel exports (`ASTSurgeon`, `LSPBridge`, `DocWeaver`, `createTreeSitterFactory`)
  - `ast-surgeon.ts` — AST skeleton extraction and symbol patching
  - `lsp-bridge.ts` — Language Server Protocol blast radius analysis
  - `doc-weaver.ts` — markdown section patching by heading
  - `compressed-codemap.ts` — compressed code signature format
  - `file-scanner.ts` — file system scanning for codemap
  - `selective-injector.ts` — source code selection for context injection
  - `pattern-search.ts` — codebase pattern matching
  - `tree-sitter-loader.ts` — Tree-sitter WASM loader
  - `signature-extractor.ts` — function/type signature extraction
  - `token-counter.ts` — token counting for budget management
  - `secret-detector.ts` — secret/credential detection
  - `binary-detector.ts` — binary file detection
  - `gitignore-filter.ts` — .gitignore-aware filtering
  - `codemap-io.ts` — codemap read/write operations
  - `incremental-updater.ts` — incremental codemap updates
  - `knowledge-commits.ts` — knowledge state commit tracking
  - `watch-integration.ts` — file watcher integration for codemap

### `src/lib/bridges/` (1 file)
- **Purpose:** External system integrations
- **Contains:** `ralph-bridge.ts` — Ralph task graph snapshot builder

### `src/lib/fs/` (3 files)
- **Purpose:** Planning filesystem operations (extracted from monolithic `planning-fs.ts`)
- **Contains:**
  - `planning-paths.ts` — planning directory path resolution
  - `planning-ops.ts` — planning file operations
  - `session-io.ts` — session file I/O

### `src/schemas/` (14 files)
- **Purpose:** Zod validation schemas — define all data structures
- **Contains:** One schema file per domain concept
- **Key files:**
  - `src/schemas/brain-state.ts` (651 lines) — `BrainState`, `SessionState`, `MetricsState` + helpers
  - `src/schemas/graph-nodes.ts` (518 lines) — all graph node schemas with FK constraints
  - `src/schemas/graph-state.ts` (96 lines) — container schemas for graph state files
  - `src/schemas/config.ts` — `HiveMindConfig` with governance modes, thresholds
  - `src/schemas/hierarchy.ts` — `HierarchyLevel`, `ContextStatus` enums
  - `src/schemas/manifest.ts` — session/task manifest schemas
  - `src/schemas/events.ts` — event bus event schemas
  - `src/schemas/governance-constitution.ts` — governance checklist schemas
  - `src/schemas/delegation-packet.ts` — delegation packet schemas
  - `src/schemas/skill-registry.ts` — skill registry schemas
  - `src/schemas/execution-knot.ts` — execution knot schemas
  - `src/schemas/planning.ts` — planning node schemas
  - `src/schemas/ideation-state.ts` — Q.U.A.N.T. ideation schemas

### `src/cli/` (4 files)
- **Purpose:** CLI commands for project initialization and asset sync
- **Contains:**
  - `init.ts` — `hivemind init` command
  - `interactive-init.ts` — interactive initialization wizard
  - `scan.ts` — `hivemind scan` command for project scanning
  - `sync-assets.ts` — syncs agents/commands/workflows to `.opencode/`

### `src/dashboard-v2/` (separate sub-project)
- **Purpose:** TUI dashboard for HiveMind visualization
- **Contains:** Own `package.json`, `tsconfig.json`, `src/` with React/Ink components
- **Isolation:** NOT imported by main plugin — runs independently
- **Structure:** `src/` has `index.tsx`, `api.ts`, `state.ts`, `components/`, `panels/`, `hooks/`

### `src/types/` (2 files)
- **Purpose:** TypeScript ambient declarations
- **Contains:** `ink.d.ts`, `react.d.ts`

### `src/utils/` (1 file)
- **Purpose:** Shared utility functions
- **Contains:** `string.ts` — string manipulation helpers

## Key File Locations

### Entry Points
- `src/index.ts` — Plugin factory entry point (default export)
- `src/cli.ts` — CLI binary entry point
- `src/dashboard-v2/src/index.tsx` — Dashboard entry point

### Configuration
- `package.json` — NPM package manifest, scripts, dependencies
- `tsconfig.json` — TypeScript compiler configuration
- `opencode.json` — OpenCode plugin manifest
- `.hivemind/config.json` — Runtime governance configuration (managed by plugin)

### Core Logic
- `src/lib/session-engine.ts` — Session start/update/close/resume operations
- `src/lib/cognitive-packer.ts` — XML context compilation (the "brain compiler")
- `src/lib/hierarchy-tree.ts` — Hierarchy tree CRUD, rendering, staleness
- `src/lib/state-mutation-queue.ts` — CQRS mutation queue
- `src/lib/persistence.ts` — Atomic state I/O with file locking
- `src/lib/paths.ts` — All path resolution (single source of truth)

### Testing
- `tests/` — Test files (mirrors `src/` structure)
- Test files use `*.test.ts` naming convention

## Naming Conventions

### Files
- **Kebab-case:** `session-engine.ts`, `hierarchy-tree.ts`, `brain-state.ts`
- **Tool files:** `hivemind-{name}.ts` (e.g., `hivemind-session.ts`, `hivemind-codemap.ts`)
- **Hook files:** descriptive names: `session-lifecycle.ts`, `soft-governance.ts`, `tool-gate.ts`
- **Schema files:** domain-named: `brain-state.ts`, `graph-nodes.ts`, `config.ts`
- **Index files:** `index.ts` in each directory for barrel exports

### Directories
- **Kebab-case:** `code-intel/`, `dashboard-v2/`, `session_coherence/`
- **Exception:** `session_coherence/` uses underscore (inconsistency)

### Exports
- **Tool factories:** `createHivemind{Name}Tool` (PascalCase name)
- **Hook factories:** `create{Name}Hook` (descriptive name)
- **Lib functions:** camelCase: `loadTree`, `saveTree`, `packCognitiveState`
- **Types/Interfaces:** PascalCase: `BrainState`, `HierarchyTree`, `TaskNode`
- **Schemas:** PascalCase with `Schema` suffix: `TrajectoryNodeSchema`, `GraphTasksStateSchema`
- **Constants:** UPPER_SNAKE_CASE: `MAX_QUEUE_SIZE`, `GOVERNANCE_MARKER`, `STRUCTURE_VERSION`

## Where to Add New Code

### New Tool
1. Create `src/tools/hivemind-{name}.ts`
2. Export `createHivemind{Name}Tool(directory: string)` factory
3. Import and use `tool()` from `@opencode-ai/plugin/tool`
4. Import helpers from `src/lib/tool-response.ts` (`toSuccessOutput`, `toErrorOutput`)
5. Call `flushMutations(stateManager)` before/after write operations
6. Add export to `src/tools/index.ts`
7. Register in `src/index.ts` tool object

### New Hook
1. Create `src/hooks/{name}.ts`
2. Export `create{Name}Hook(log, directory, config)` factory
3. Follow P3 pattern: entire body in `try/catch`, never throw
4. Use `queueStateMutation()` for state changes (never direct save)
5. Add export to `src/hooks/index.ts`
6. Register in `src/index.ts` with appropriate OpenCode event

### New Library Module
1. Create `src/lib/{name}.ts`
2. Export pure functions (no OpenCode SDK dependency)
3. Use `getEffectivePaths(projectRoot)` for path resolution (never hardcode `.hivemind/`)
4. Add barrel export to `src/lib/index.ts`
5. Add tests to `tests/lib/{name}.test.ts`

### New Schema
1. Create `src/schemas/{name}.ts`
2. Define Zod schemas with `z.object()`, `z.enum()`, etc.
3. Export both schema and inferred type: `export type MyType = z.infer<typeof MySchema>`
4. Add barrel export to `src/schemas/index.ts`

### New Graph Node Type
1. Add schema to `src/schemas/graph-nodes.ts`
2. Add state container to `src/schemas/graph-state.ts`
3. Add reader function to `src/lib/graph/reader.ts`
4. Add writer function to `src/lib/graph/writer.ts`
5. Re-export from `src/lib/graph-io.ts`

### New Code Intelligence Feature
1. Add module to `src/lib/code-intel/{name}.ts`
2. Export from `src/lib/code-intel/index.ts`
3. Wire to tool in `src/tools/hivemind-codemap.ts` or create new Cluster 3 tool

### New CLI Command
1. Add to `src/cli/{name}.ts`
2. Register in `src/cli.ts` (or equivalent entry point)

## Special Directories

### `.hivemind/` (runtime state)
- **Purpose:** All plugin runtime state — brain, hierarchy, graph, sessions, logs
- **Generated:** Yes (by plugin at runtime)
- **Committed:** Partially — `config.json` committed, state files in `.gitignore`
- **Managed by:** `src/lib/paths.ts` (all paths), `src/lib/persistence.ts` (I/O)

### `dist/` (compiled output)
- **Purpose:** TypeScript compilation output
- **Generated:** Yes (by `tsc`)
- **Committed:** No (in `.gitignore`)

### `.opencode/` (plugin configuration)
- **Purpose:** OpenCode plugin agents, skills, and configuration
- **Generated:** Partially (synced by `src/cli/sync-assets.ts`)
- **Committed:** Yes (on `dev-v3` branch, excluded from `master`)

### `docs/plans/` (planning documents)
- **Purpose:** PRDs, roadmaps, master plans
- **Generated:** No (human/AI authored)
- **Committed:** Yes (on `dev-v3` branch)

### `tests/` (test files)
- **Purpose:** Test suites mirroring `src/` structure
- **Generated:** No
- **Committed:** Yes
- **Runner:** Node.js built-in test runner (`npx tsx --test`)

---

*Structure analysis: 2026-02-28*
