# Architecture Analysis

> Generated: 2026-02-28 | Source: src/ (143 .ts files across 8 directories + subdirectories)

## Pattern Overview

**Overall:** Plugin-based Layered Architecture with CQRS-compliant State Management

**Key Characteristics:**
- OpenCode Plugin SDK contract (`@opencode-ai/plugin`) — single async factory function returns hooks + tools
- Strict uni-directional dependency flow: `tools → lib`, `hooks → lib`, `schemas ← *` (no cross-layer violations detected)
- CQRS pattern for state mutations: hooks are read-only, tools own writes, mutations queued via `state-mutation-queue.ts`
- Dual-channel context injection: SYSTEM prompt (session-lifecycle hook) + USER message (messages-transform hook)
- Soft governance model: hooks advise but never block tool execution (HC1 compliance)

## Layer Map

### 1. Entry Point (`src/index.ts` — 186 lines)
- **Purpose:** Plugin factory — wires all hooks and tools into OpenCode's plugin contract
- **Exports:** `HiveMindPlugin: Plugin` (default + named)
- **Key responsibilities:**
  - Initializes SDK context singleton (`initSdkContext`)
  - Loads config, regenerates manifests
  - Wires `fileWatcher → eventBus` bridge
  - Returns object with `event`, `tool` (14 tools), and 5 hook registrations

### 2. Tools Layer (`src/tools/` — 15 files)
- **Purpose:** Write operations — each tool is a `@opencode-ai/plugin/tool` definition
- **Key exports (via `src/tools/index.ts`):** 14 `createHivemind*Tool` factory functions
- **Pattern:** Each tool file exports a single factory `createHivemind*Tool(directory: string)` that returns a `ToolDefinition`
- **Write responsibility:** Tools call `flushMutations(stateManager)` to apply queued hook mutations before/after their own writes
- **Tool categories:**
  - Core lifecycle: `hivemind-session.ts` (360 lines), `hivemind-context.ts`, `hivemind-cycle.ts`
  - State inspection: `hivemind-inspect.ts`
  - Memory/anchors: `hivemind-memory.ts`, `hivemind-anchor.ts`
  - Tree management: `hivemind-hierarchy.ts`
  - Session memory: `hivemind-session-memory.ts`
  - Code intelligence (Cluster 3): `hivemind-codemap.ts`, `hivemind-read-skeleton.ts`, `hivemind-precision-patch.ts`, `hivemind-mesh-pull.ts`, `hivemind-doc-weaver.ts`
  - Ideation: `hivemind-ideate.ts`

### 3. Hooks Layer (`src/hooks/` — 13 files)
- **Purpose:** Read-only event handlers — fire on OpenCode lifecycle events
- **Key exports (via `src/hooks/index.ts`):** 5 hook factories + SDK context accessors
- **Hook registrations (in `src/index.ts`):**

| Hook | OpenCode Event | File | Lines |
|------|---------------|------|-------|
| Session Lifecycle | `experimental.chat.system.transform` | `session-lifecycle.ts` | 231 |
| Messages Transform | `experimental.chat.messages.transform` | `messages-transform.ts` | 679 |
| Soft Governance | `tool.execute.after` | `soft-governance.ts` | 691 |
| Tool Gate | `tool.execute.before` | `tool-gate.ts` | 463 |
| Compaction | `experimental.session.compacting` | `compaction.ts` | 246 |
| Event Handler | `event` | `event-handler.ts` | 418 |

- **Supporting files:**
  - `session-lifecycle-helpers.ts` (479 lines) — bootstrap/first-turn context generation
  - `sdk-context.ts` (107 lines) — SDK singleton wiring (delegates to `lib/sdk-access.ts`)
  - `swarm-executor.ts` — swarm agent execution
  - `session_coherence/` — subdirectory with session coherence types and start logic

### 4. Library Layer (`src/lib/` — 83 files including subdirectories)
- **Purpose:** Core engine — pure TypeScript business logic, no OpenCode SDK dependency
- **Key exports (via `src/lib/index.ts`):** 36 barrel re-exports
- **Subdirectories:**
  - `graph/` (4 files) — Graph I/O split: `reader.ts`, `writer.ts`, `fk-validator.ts`, `shared.ts`
  - `code-intel/` (18 files) — AST surgery, LSP bridge, codemap, pattern search, tree-sitter
  - `bridges/` (1 file) — `ralph-bridge.ts` for Ralph task graph integration
  - `fs/` (3 files) — Planning filesystem operations split: `planning-ops.ts`, `planning-paths.ts`, `session-io.ts`

### 5. Schemas Layer (`src/schemas/` — 14 files)
- **Purpose:** Zod validation schemas — DNA of all data structures
- **Key exports (via `src/schemas/index.ts`):** 12 barrel re-exports
- **Critical schemas:**
  - `brain-state.ts` (651 lines) — `BrainState`, `SessionState`, `MetricsState` types + mutation helpers
  - `graph-nodes.ts` (518 lines) — `TrajectoryNode`, `TaskNode`, `MemNode`, `PlanNode`, `PhaseNode` etc.
  - `graph-state.ts` (96 lines) — Container schemas (`TrajectoryStateSchema`, `GraphTasksStateSchema`, etc.)
  - `config.ts` — `HiveMindConfig` schema with governance modes
  - `hierarchy.ts` — `HierarchyLevel`, `ContextStatus` enums

### 6. CLI Layer (`src/cli/` — 4 files)
- **Purpose:** CLI commands for initialization and asset management
- **Files:** `init.ts`, `interactive-init.ts`, `scan.ts`, `sync-assets.ts`
- **Note:** No `cli.ts` entry point in this directory — the entry is `src/cli.ts` at src root

### 7. Dashboard Layer (`src/dashboard-v2/` — separate sub-project)
- **Purpose:** TUI dashboard (separate `package.json`, `tsconfig.json`)
- **Isolation:** Self-contained sub-application, not imported by main plugin

### 8. Types & Utils (`src/types/`, `src/utils/`)
- `types/` — 2 files: `ink.d.ts`, `react.d.ts` type declarations
- `utils/` — 1 file: `string.ts` string utilities

## Entry Points & Init Sequence

**Plugin initialization flow** (`src/index.ts:80-184`):

```
1. HiveMindPlugin(pluginInput) called by OpenCode
   │
2. effectiveDir = worktree || directory
   │
3. initSdkContext({ client, $, serverUrl, project })
   │  → stores refs in module singleton (src/hooks/sdk-context.ts → src/lib/sdk-access.ts)
   │  → NEVER calls client.* here (deadlock risk comment, line 90)
   │
4. loadConfig(effectiveDir) → reads .hivemind/config.json
   │
5. regenerateManifests(effectiveDir) → updates planning manifests
   │
6. fileWatcher.watchDirectory(effectiveDir)
   │  → fs.watch with debouncing (src/lib/watcher.ts)
   │  → fileWatcher.on("event") → eventBus.emitEvent() bridge (line 116-118)
   │
7. Return plugin contract object:
   ├── event: createEventHandler(log, dir)
   ├── tool: { 14 tool definitions }
   ├── experimental.chat.system.transform: createSessionLifecycleHook(...)
   ├── experimental.chat.messages.transform: createMessagesTransformHook(...)
   ├── tool.execute.after: createSoftGovernanceHook(...)
   ├── tool.execute.before: createToolGateHook(...)
   └── experimental.session.compacting: createCompactionHook(...)
```

## Dependency Flow

### Layer → Layer Dependencies (validated via grep)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  tools   │────▶│   lib   │◀────│  hooks  │     │ schemas │
│ (15 files)│    │(83 files)│    │(13 files)│     │(14 files)│
└─────────┘     └────┬────┘     └─────────┘     └────┬────┘
                     │                                │
                     └────────────────────────────────┘
                          (lib imports schemas)
```

| From → To | tools→lib | hooks→lib | tools→hooks | hooks→tools | lib→hooks | lib→tools | *→schemas |
|-----------|-----------|-----------|-------------|-------------|-----------|-----------|-----------|
| Count     | 53 imports| 70 imports| 0           | 0           | 0         | 0         | Yes (via lib) |

### Violations

**Zero cross-layer violations detected:**
- `lib/` does NOT import from `hooks/` or `tools/` — verified via grep
- `hooks/` does NOT import from `tools/` — verified via grep
- `tools/` does NOT import from `hooks/` — verified via grep
- Dependency direction is strictly `tools → lib ← hooks`, with `schemas` as shared foundation

### Intra-Layer Dependencies (lib/)

The `lib/` layer has internal coupling. Key dependency clusters:

**State Cluster:** `persistence.ts` ↔ `paths.ts` ← (many consumers)
**Graph Cluster:** `graph-io.ts` → `graph/reader.ts`, `graph/writer.ts`, `graph/fk-validator.ts`
**Session Cluster:** `session-engine.ts` → `hierarchy-tree.ts`, `planning-fs.ts`, `persistence.ts`
**Detection Cluster:** `detection.ts` ← `soft-governance.ts`, `session-governance.ts`
**Code-Intel Cluster:** `code-intel/index.ts` → 17 sub-modules (self-contained)

## Context Injection Pipeline

This is the core architectural mechanism. Two channels inject context every turn:

### Channel 1: SYSTEM Prompt (`experimental.chat.system.transform`)
**File:** `src/hooks/session-lifecycle.ts` (line 80)

```
Input: { sessionID, model }
Output: { system: string[] }  ← APPEND strings to system prompt

Flow:
1. injectGovernanceInstruction()  → PREPEND HiveMaster governance (deduplicated)
2. loadConfig() + stateManager.load()  → get current state
3. applyPendingStateMutations()  → project queued mutations
4. handleStaleSession() if needed
5. buildGovernanceSignals()  → src/lib/session-governance.ts
   ├── detectFrameworkContext()
   ├── collectProjectSnapshot()
   ├── compileDetectionSignals()
   ├── buildDriftWarnings()
   └── buildSessionBoundaryWarnings()
6. buildBootstrapContext()  → first-turn blocks via session-lifecycle-helpers.ts
7. assembleSections()  → budget-cap at 2500-4500 chars, drop lowest priority
8. appendChecklistFailureReminder()
9. output.system.push(finalLines)
```

### Channel 2: USER Message (`experimental.chat.messages.transform`)
**File:** `src/hooks/messages-transform.ts` (line 308)

```
Input: {}
Output: { messages: MessageV2[] }  ← MUTATE message parts

Flow (7 phases):
Phase 1: First-Turn Session Coherence (EXCLUSIVE — returns early)
  ├── loadLastSessionContext()  → src/lib/session_coherence.ts
  ├── buildTransformedPrompt()  → merge user text + last session context
  └── prependSyntheticPart()  → inject as synthetic message part

Phase 2: State Load + Early Exit

Phase 3: Recent Messages Capture
  └── Store last 6 messages in brain state for session split

Phase 4: User Message Location + Context Injection
  ├── detectOffTrackIntent()  → queue TODO-Pending
  ├── detectAutoRealignment()  → inject auto-realign reminder
  └── detectRationaleOptionSelection()  → first-turn confirmation

Phase 5: Cognitive Packer Injection
  └── packCognitiveState()  → src/lib/cognitive-packer.ts
      └── Reads: trajectory.json, plans.json, tasks.json, mems.json, anchors.json
      └── Produces: <hivemind_state> XML with trajectory, tasks, mems, anchors, anti_patterns

Phase 6: Contextual Anchoring
  └── buildAnchorContext()  → [SYSTEM ANCHOR: ...] header

Phase 7: Pre-Stop Checklist Assembly
  ├── evaluateEntityChecklist()
  ├── loadTree() + loadGraphTasks() + loadTrajectory()
  ├── shouldCreateNewSession()  → session boundary check
  └── buildChecklist()  → <system-reminder> block appended as synthetic part
```

### Key Insight: Duplication Concern
Both channels independently:
- Load brain state via `createStateManager(directory)`
- Call `loadConfig(directory)`
- Access graph data (`loadGraphTasks`, `loadTrajectory`)
- Evaluate entity checklists

This is by design (hooks fire independently) but means state is read 2+ times per turn.

## State Management

### Persistence Model

**Atomic File I/O** (`src/lib/persistence.ts` — 376 lines):
- `createStateManager(projectRoot)` → returns `{ load, save, withState, initialize, exists }`
- Write pattern: `writeFile(temp) → rename(current, bak) → rename(temp, current)` (atomic rename)
- File locking via `FileLock` class: exclusive `open(path, 'wx')` with stale lock detection (>5s)
- Backup management: timestamped `.bak.YYYY-MM-DDThh-mm-ss` files, keeps last 3

### CQRS State Mutation Queue (`src/lib/state-mutation-queue.ts` — 670 lines)

```
HOOKS (read-only intent)              TOOLS (write authority)
      │                                      │
      │  queueStateMutation({                │  flushMutations(stateManager)
      │    type: "UPDATE_STATE",             │    → load current state
      │    payload: {...},                   │    → sort by priority + timestamp
      │    source: "hook-name"               │    → deepMerge all mutations
      │  })                                  │    → stateManager.save(merged)
      │         │                            │    → clear queue
      └─────── ▼ ───────────────────────────▶│
         mutationQueue[]                     │
         (module-scoped array)               │
         MAX_QUEUE_SIZE = 100                │
```

- `applyPendingStateMutations(baseState)` — projects queued mutations without persisting (used by hooks for read)
- `queueTaskManifestMutation()` — separate queue for task manifest updates
- Audit log: records `AuditEntry` for each applied mutation (max 50 entries)

### Path Resolution (`src/lib/paths.ts` — 530 lines)

**Single source of truth** for all `.hivemind/` paths:
- `getHivemindPaths(projectRoot)` → returns `HivemindPaths` (pure function, no I/O)
- `getEffectivePaths(projectRoot)` → bridge function (currently just delegates to `getHivemindPaths`)
- Structure version: `2.0.0`
- Total managed paths: ~50+ (state/, memory/, sessions/, graph/, codemap/, codewiki/, etc.)
- Security: `sanitizeSessionFileName()`, `safeJoinWithin()` prevent path traversal

### State Files on Disk

```
.hivemind/
├── config.json          ← HiveMindConfig (governance mode, thresholds)
├── state/
│   ├── brain.json       ← BrainState (session, metrics, hierarchy flat projection)
│   ├── hierarchy.json   ← HierarchyTree (trajectory→tactic→action tree)
│   ├── anchors.json     ← Immutable anchors (key-value pairs)
│   └── tasks.json       ← Legacy tasks
├── memory/
│   └── mems.json        ← Cross-session memories
├── graph/
│   ├── trajectory.json  ← Active trajectory + plan/phase/task pointers
│   ├── plans.json       ← Plan nodes with phases
│   ├── tasks.json       ← TaskNode array (FK: parent_phase_id → PhaseNode)
│   ├── mems.json        ← MemNode array (FK: session_id → Trajectory)
│   ├── orphans.json     ← Quarantined invalid nodes
│   ├── pending-changes.json
│   └── verification-ledger.json
└── sessions/
    ├── active/          ← Current session .md files
    └── archive/exports/ ← Archived sessions
```

### Hierarchy Tree (`src/lib/hierarchy-tree.ts` — 1070 lines)

- Tree structure: `HierarchyTree { root: HierarchyNode | null, cursor: string | null }`
- Node structure: `{ id, level, content, status, created, stamp, children[] }`
- Levels: `trajectory → tactic → action`
- Stamps: `MiMiHrHrDDMMYYYY` format for cross-session grep traceability
- 9 sections: Types, Stamps, CRUD, Queries, Staleness, Rendering, Janitor, I/O, Migration

### Graph I/O (`src/lib/graph-io.ts` → `src/lib/graph/`)

Re-exports from 4 sub-modules:
- `reader.ts` — `loadTrajectory`, `loadGraphTasks`, `loadGraphMems`, `loadPlans`, `buildLifecycleLineageSnapshot`
- `writer.ts` — `saveTrajectory`, `saveGraphTasks`, `addGraphMem`, `addGraphTask`, `flagFalsePath`, `invalidateTask`
- `fk-validator.ts` — FK constraint validation for mems (session_id → trajectory) and tasks
- `shared.ts` — `OrphanRecord` type

## Event System

### In-Process Event Bus (`src/lib/event-bus.ts` — 133 lines)

- Singleton `InProcessEventBus` extending Node.js `EventEmitter`
- Max 50 listeners per event type
- Event types: `file:created`, `file:modified`, `file:deleted`, `artifact:spawned`, `plugin:activated`, `codemap:*`, `context:*`, `memory:classified`, `pending_change:*`
- Schema: `ArtifactEvent { type, timestamp, payload, source }` (defined in `src/schemas/events.ts`)

### File Watcher (`src/lib/watcher.ts` — 217 lines)

- Singleton `FileSystemWatcher` extending `EventEmitter`
- Uses native `fs.watch` with 300ms debounce
- Ignores: `node_modules`, `.git`, `.hivemind`, `dist`, `build`, `.DS_Store`
- Emits `ArtifactEvent` objects through `"event"` channel
- Bridged to `eventBus` in `src/index.ts:116-118`

### OpenCode Event Handler (`src/hooks/event-handler.ts` — 418 lines)

Handles OpenCode SDK events:
- `session.created` — log only
- `session.idle` — increment `user_turn_count`, check staleness, queue drift signal
- `session.compacted` — register compaction governance signal
- `file.edited` — log only
- `session.diff` — log only
- `todo.updated` — **complex**: normalizes TODO items, detects auto-realignment, maps to graph tasks via `queueTaskManifestMutation()`

### Event Consumers (`src/lib/event-consumers.ts`)
- Informational bridges — queues mutation keys but acts as connective tissue
- Note: Identified as unwired in Wave α audit (anchor: `wave-alpha-complete-2026-02-28`)

## Module Coupling Analysis

### Tightly Coupled Modules

1. **`persistence.ts` ↔ `paths.ts`**: Every state operation goes through both. `persistence.ts` calls `getEffectivePaths()` for path resolution.

2. **`session-lifecycle.ts` ↔ `session-governance.ts` ↔ `session-lifecycle-helpers.ts`**: The SYSTEM prompt compilation is split across these 3 files (231 + 317 + 479 = 1027 lines total).

3. **`messages-transform.ts` ↔ `cognitive-packer.ts`**: The USER channel depends heavily on the cognitive packer for XML state compilation.

4. **`soft-governance.ts` ↔ `detection.ts`**: The counter engine imports 16 functions from detection.ts.

5. **`state-mutation-queue.ts`** — central coupling point: imported by ALL hooks and tools for CQRS compliance.

6. **`brain-state.ts` (schema)** — imported transitively by everything that touches session state.

### Loosely Coupled Modules

1. **`code-intel/`** — 18-file sub-package, self-contained with own `index.ts`. Only imported by Cluster 3 tools.

2. **`graph/`** — 4-file sub-package behind `graph-io.ts` facade.

3. **`bridges/ralph-bridge.ts`** — isolated integration module.

4. **`dashboard-v2/`** — completely separate sub-project.

5. **`event-bus.ts` + `watcher.ts`** — loosely coupled, only bridged in `src/index.ts`.

### Central Hub Files (highest fan-in)

| File | Approximate Import Count |
|------|-------------------------|
| `src/lib/persistence.ts` | ~20+ (every hook + every tool) |
| `src/lib/paths.ts` | ~15+ |
| `src/lib/state-mutation-queue.ts` | ~12+ (all hooks + tools) |
| `src/lib/graph-io.ts` | ~10+ |
| `src/lib/tool-response.ts` | ~14 (every tool) |
| `src/schemas/brain-state.ts` | ~10+ |

## Dependency Graph (ASCII)

```
                    ┌──────────────────────────────────────────┐
                    │           src/index.ts                    │
                    │      (Plugin Factory Entry)               │
                    └──────┬──────────────┬────────────────────┘
                           │              │
              ┌────────────▼───┐    ┌─────▼─────────────┐
              │   src/tools/   │    │   src/hooks/       │
              │  (14 tools)    │    │  (6 hooks)         │
              │  WRITE owner   │    │  READ-ONLY         │
              └───────┬────────┘    └──────┬─────────────┘
                      │                    │
                      │    ┌───────────────┘
                      │    │
              ┌───────▼────▼──────────────────────────────┐
              │              src/lib/                       │
              │         (Core Engine)                       │
              │                                            │
              │  ┌──────────┐ ┌───────────┐ ┌───────────┐ │
              │  │persistence│ │graph-io.ts│ │state-mut- │ │
              │  │   .ts     │ │  (facade) │ │ation-queue│ │
              │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ │
              │        │             │              │       │
              │  ┌─────▼─────┐ ┌────▼──────┐       │       │
              │  │ paths.ts  │ │  graph/   │       │       │
              │  │ (SOT)     │ │ reader.ts │       │       │
              │  └───────────┘ │ writer.ts │       │       │
              │                │ fk-val.ts │       │       │
              │                └───────────┘       │       │
              │  ┌───────────────┐  ┌──────────────┘       │
              │  │ code-intel/   │  │                       │
              │  │ (18 files)    │  │  ┌─────────────────┐  │
              │  │ AST, LSP,     │  │  │ hierarchy-tree  │  │
              │  │ codemap...    │  │  │ session-engine   │  │
              │  └───────────────┘  │  │ cognitive-packer │  │
              │                     │  └─────────────────┘  │
              └─────────────────────┼───────────────────────┘
                                    │
                      ┌─────────────▼──────────────┐
                      │       src/schemas/          │
                      │    (Zod Validation DNA)     │
                      │  brain-state, graph-nodes,  │
                      │  config, hierarchy, events  │
                      └────────────────────────────┘
```

## Error Handling

**Strategy:** P3 (Priority 3) defensive pattern — NEVER break the host application

**Patterns:**
- Every hook body is wrapped in `try/catch` with `await log.error(...)` — exceptions are swallowed
- Tool gate always returns `{ allowed: true }` even on error (`src/hooks/tool-gate.ts:358`)
- File operations use `existsSync()` guards before reads
- JSON parse failures fall back to backup files or defaults
- Lock acquisition has 5-second timeout with stale lock detection

## Cross-Cutting Concerns

**Logging:** Custom `Logger` via `src/lib/logging.ts` — file-based logging to `.hivemind/logs/`, with `noopLogger` fallback

**Validation:** Zod schemas in `src/schemas/` — `safeParse()` pattern for graceful degradation on invalid data

**Authentication:** None (plugin runs in-process within OpenCode)

**Localization:** Bilingual support (EN/VI) via `localize(config.language, enText, viText)` pattern throughout hooks

**Configuration:** Re-read from disk each hook invocation (Rule 6) — no in-memory config caching for correctness

---

*Architecture analysis: 2026-02-28*
