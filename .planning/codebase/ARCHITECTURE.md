# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** Layered Plugin Architecture with Event-Driven Governance

**Key Characteristics:**
- **Write-Only Tools** - 6 canonical tools, dumb dispatchers ≤100 lines
- **Pure Libraries** - Business logic in pure TypeScript functions
- **Read-Auto Hooks** - SDK event listeners that inject context automatically
- **Zod Schemas** - DNA validation with FK constraints

## Layers

### Tools Layer (`src/tools/`)
- **Purpose:** User-facing API verbs, dispatch to libraries
- **Location:** `src/tools/`
- **Contains:** 6 canonical tools + index barrel
- **Depends on:** Libraries layer, Schemas
- **Used by:** OpenCode plugin host
- **Constraint:** Each tool ≤100 lines, write-only (no business logic)

### Libraries Layer (`src/lib/`)
- **Purpose:** Pure TypeScript business logic, filesystem I/O
- **Location:** `src/lib/`
- **Contains:** 42 library files
- **Depends on:** Schemas, Node.js built-ins
- **Used by:** Tools, Hooks
- **Key modules:**
  - `persistence.ts` - Atomic file I/O with locking
  - `paths.ts` - Single source of truth for `.hivemind/` paths
  - `session-engine.ts` - Session lifecycle state machine
  - `hierarchy-tree.ts` - Trajectory → Tactic → Action tree
  - `event-bus.ts` - In-process EventEmitter pub/sub
  - `watcher.ts` - fs.watch with debouncing

### Hooks Layer (`src/hooks/`)
- **Purpose:** SDK event listeners, automatic context injection
- **Location:** `src/hooks/`
- **Contains:** 13 hook files
- **Depends on:** Libraries, Schemas
- **Used by:** OpenCode plugin host
- **Key hooks:**
  - `session-lifecycle.ts` - Injects `<hivemind>` prompt every turn
  - `soft-governance.ts` - Governance enforcement
  - `tool-gate.ts` - Tool access control
  - `compaction.ts` - Session archiving
  - `messages-transform.ts` - Message transformation

### Schemas Layer (`src/schemas/`)
- **Purpose:** Zod validation, type inference, FK constraints
- **Location:** `src/schemas/`
- **Contains:** 8 schema files
- **Depends on:** Zod
- **Used by:** All layers
- **Key schemas:**
  - `brain-state.ts` - Session state schema
  - `config.ts` - Configuration schema
  - `hierarchy.ts` - Hierarchy levels schema
  - `events.ts` - Event types for in-process bus
  - `graph-nodes.ts` - Graph node schemas with FK constraints

### Dashboard Layer (`src/dashboard/`)
- **Purpose:** Terminal UI for monitoring and debugging
- **Location:** `src/dashboard/`
- **Contains:** 18 files (components, views, types)
- **Depends on:** Ink, React (optional peers)
- **Status:** Currently Ink-based, migration to OpenTUI planned

### CLI Layer (`src/cli/`)
- **Purpose:** Command-line interface entry points
- **Location:** `src/cli/`, `src/cli.ts`
- **Contains:** 5 CLI files
- **Depends on:** Libraries
- **Commands:** `init`, `scan`, `sync-assets`

## Data Flow

### Session Lifecycle Flow:

1. **User starts session** → `hivemind_session start`
2. **Tool dispatches** → `session-engine.ts` creates state
3. **Hook fires** → `session-lifecycle.ts` injects `<hivemind>` prompt
4. **State persists** → `persistence.ts` writes to `.hivemind/state/brain.json`
5. **Each turn** → Hooks update metrics, check drift, enforce governance

### File Event Flow:

1. **File changes** → `watcher.ts` detects via fs.watch
2. **Event emitted** → `event-bus.ts` publishes to subscribers
3. **Hooks react** → Update context, trigger governance checks

## Key Abstractions

### HivemindPaths (`src/lib/paths.ts`)
- **Purpose:** Single source of truth for all `.hivemind/` paths
- **Examples:** `getEffectivePaths(projectRoot)` returns all paths
- **Pattern:** Pure function, no I/O (except `getActiveSessionPath`)

### SessionResult (`src/lib/session-engine.ts`)
- **Purpose:** Unified result type for all session operations
- **Pattern:** `{ success: boolean, action: string, data: {}, error?: string }`

### ArtifactEvent (`src/schemas/events.ts`)
- **Purpose:** In-process event type for file/artifact changes
- **Pattern:** `{ type, timestamp, payload, source }`

## Entry Points

### Plugin Entry:
- **Location:** `src/index.ts`
- **Triggers:** OpenCode plugin host on load
- **Responsibilities:** Export tools, hooks, schemas

### CLI Entry:
- **Location:** `src/cli.ts`
- **Triggers:** `hivemind` or `hivemind-context-governance` command
- **Responsibilities:** Parse args, dispatch to CLI modules

### Dashboard Entry:
- **Location:** `src/dashboard/bin.ts`, `src/dashboard/server.ts`
- **Triggers:** Dashboard binary execution
- **Responsibilities:** Start TUI server, render Ink components

## Error Handling

**Strategy:** Fail-safe hooks, never break session lifecycle

**Patterns:**
- All hooks wrapped in try/catch with logging
- Tools return `SessionResult` with error field
- Persistence uses file locking to prevent corruption
- `toast-throttle.ts` prevents notification spam

## Cross-Cutting Concerns

**Logging:** `src/lib/logging.ts` - Structured logging with levels
**Validation:** Zod schemas at layer boundaries
**Authentication:** None (runs inside OpenCode plugin context)
**Governance:** `src/lib/governance-instruction.ts` - HIVE-MASTER rules
**Migration:** `src/lib/migrate.ts` - Auto-migrate legacy structures

## Architecture Constraints

| Constraint | Enforcement |
|------------|-------------|
| Tools ≤100 lines | `scripts/check-sdk-boundary.sh` |
| No business logic in tools | Code review + lint:boundary |
| Single path source | Use `getEffectivePaths()` |
| FK constraints | Zod schemas with refinements |
| No external services | Filesystem-only persistence |

---

*Architecture analysis: 2026-02-18*
