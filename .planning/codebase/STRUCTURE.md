# Codebase Structure

**Analysis Date:** 2026-02-18

## Directory Layout

```
hivemind-plugin/
├── src/                    # Source code root
│   ├── tools/              # 6 canonical tools (write-only)
│   ├── lib/                # 42 library files (business logic)
│   ├── hooks/              # 13 hook files (event listeners)
│   ├── schemas/            # 8 Zod schema files
│   ├── dashboard/          # 18 TUI files (Ink-based)
│   ├── cli/                # 5 CLI command files
│   ├── types/              # Type declarations (ink.d.ts, react.d.ts)
│   ├── utils/              # Utility functions
│   └── index.ts            # Package entry point
├── tests/                  # 41 test files
├── dist/                   # Compiled output (gitignored)
├── bin/                    # Binary scripts
├── docs/                   # Documentation
│   ├── plans/              # PRDs and roadmaps
│   ├── research/           # Research notes
│   ├── verification/       # Verification reports
│   └── stitch-screens/     # UI mockups
├── .opencode/              # OpenCode plugin config
│   ├── skills/             # 6 governance skills
│   ├── commands/           # Slash commands
│   ├── workflows/          # Workflow definitions
│   └── agents/             # Agent configurations
├── .planning/              # Planning artifacts
│   └── codebase/           # Codebase analysis docs
├── scripts/                # Build/utility scripts
├── templates/              # Template files
├── skills/                 # Packaged skills for distribution
├── agents/                 # Agent definitions
├── workflows/              # Workflow templates
├── references/             # Reference documentation
└── package.json            # Package manifest
```

## Directory Purposes

### `src/tools/`
- **Purpose:** User-facing API verbs
- **Contains:** 6 canonical tools
- **Key files:**
  - `hivemind-session.ts` - Session lifecycle (start, update, close, status, resume)
  - `hivemind-inspect.ts` - State inspection (scan, deep, drift)
  - `hivemind-memory.ts` - Knowledge persistence (save, recall, list)
  - `hivemind-anchor.ts` - Immutable anchors (save, list, get)
  - `hivemind-hierarchy.ts` - Tree management (prune, migrate, status)
  - `hivemind-cycle.ts` - Session export (export, list, prune)

### `src/lib/`
- **Purpose:** Pure TypeScript business logic
- **Contains:** 42 library files
- **Key files:**
  - `paths.ts` - Path resolution (ALWAYS use this)
  - `persistence.ts` - Atomic file I/O
  - `session-engine.ts` - Session state machine
  - `hierarchy-tree.ts` - Trajectory tree
  - `event-bus.ts` - In-process pub/sub
  - `watcher.ts` - File system watching
  - `planning-fs.ts` - Planning filesystem ops (largest file, 1031 lines)
  - `detection.ts` - Framework detection (881 lines)

### `src/hooks/`
- **Purpose:** SDK event listeners
- **Contains:** 13 hook files + index
- **Key files:**
  - `session-lifecycle.ts` - Main context injection hook
  - `soft-governance.ts` - Governance enforcement
  - `tool-gate.ts` - Tool access control
  - `messages-transform.ts` - Message transformation
  - `sdk-context.ts` - SDK context management

### `src/schemas/`
- **Purpose:** Zod validation schemas
- **Contains:** 8 schema files
- **Key files:**
  - `brain-state.ts` - Session state (427 lines)
  - `config.ts` - Configuration (417 lines)
  - `graph-nodes.ts` - Graph node schemas with FK
  - `events.ts` - Event type schemas

### `src/dashboard/`
- **Purpose:** Terminal UI for monitoring
- **Contains:** 16 TSX files + types
- **Key files:**
  - `App.tsx` - Main dashboard application
  - `loader.ts` - Dashboard loader (238 lines)
  - `server.ts` - Dashboard server
  - `components/` - 7 React components
  - `views/` - 3 view components

### `src/cli/`
- **Purpose:** CLI command implementations
- **Contains:** 5 files
- **Key files:**
  - `init.ts` - Init command (668 lines)
  - `interactive-init.ts` - Interactive init flow
  - `scan.ts` - Scan command
  - `sync-assets.ts` - Asset sync (319 lines)

### `tests/`
- **Purpose:** Test files
- **Contains:** 41 test files, 12,373 total lines
- **Pattern:** `*.test.ts` using Node.js built-in test runner
- **Key files:**
  - `schemas.test.ts` - Schema validation tests
  - `persistence-*.test.ts` - Persistence tests
  - `session-*.test.ts` - Session tests

## Key File Locations

### Entry Points:
- `src/index.ts`: Package main export
- `src/cli.ts`: CLI entry point
- `src/dashboard/bin.ts`: Dashboard binary

### Configuration:
- `tsconfig.json`: TypeScript config
- `package.json`: Package manifest
- `.opencode/plugin.json`: Plugin config (if exists)

### Core Logic:
- `src/lib/paths.ts`: Path resolution (use this!)
- `src/lib/persistence.ts`: File I/O
- `src/lib/session-engine.ts`: Session logic

### Governance:
- `src/lib/governance-instruction.ts`: HIVE-MASTER rules
- `src/hooks/soft-governance.ts`: Governance hook
- `.opencode/skills/hivemind-governance/`: Governance skill

## Naming Conventions

### Files:
- **Tools:** `hivemind-{verb}.ts` (e.g., `hivemind-session.ts`)
- **Libraries:** `{noun}.ts` or `{noun}-{verb}.ts` (e.g., `paths.ts`, `session-engine.ts`)
- **Hooks:** `{event}.ts` (e.g., `session-lifecycle.ts`)
- **Schemas:** `{domain}.ts` (e.g., `brain-state.ts`)
- **Tests:** `{module}.test.ts` (e.g., `schemas.test.ts`)
- **Components:** `{Name}.tsx` (PascalCase)

### Directories:
- Lowercase, hyphen-separated
- Feature-based grouping (tools, lib, hooks, schemas)

## Where to Add New Code

### New Tool:
- Implementation: `src/tools/hivemind-{verb}.ts`
- Export: Add to `src/tools/index.ts`
- Test: `tests/{verb}.test.ts`

### New Library Function:
- Implementation: `src/lib/{domain}.ts`
- Export: Add to `src/lib/index.ts`
- Test: `tests/{domain}.test.ts`

### New Hook:
- Implementation: `src/hooks/{event}.ts`
- Export: Add to `src/hooks/index.ts`
- Test: `tests/{event}.test.ts`

### New Schema:
- Implementation: `src/schemas/{domain}.ts`
- Export: Add to `src/schemas/index.ts`
- Test: Add to `tests/schemas.test.ts`

### New Dashboard Component:
- Implementation: `src/dashboard/components/{Name}.tsx`
- Or view: `src/dashboard/views/{Name}View.tsx`
- Types: `src/dashboard/types.ts`

### New CLI Command:
- Implementation: `src/cli/{command}.ts`
- Register: Add to `src/cli.ts`

## Special Directories

### `.hivemind/` (Runtime)
- **Purpose:** HiveMind runtime state
- **Generated:** Yes (by init/run)
- **Committed:** No (gitignored)
- **Structure:** v2.0.0 with state/, memory/, sessions/, graph/

### `.opencode/` (Plugin Config)
- **Purpose:** OpenCode plugin configuration
- **Generated:** Partial (skills, commands committed)
- **Committed:** Yes (skills, commands, workflows)

### `dist/` (Build Output)
- **Purpose:** Compiled JavaScript
- **Generated:** Yes (by `npm run build`)
- **Committed:** No (gitignored)

### `docs/plans/` (Planning)
- **Purpose:** PRDs, roadmaps, implementation plans
- **Generated:** Manual
- **Committed:** Yes

---

*Structure analysis: 2026-02-18*
