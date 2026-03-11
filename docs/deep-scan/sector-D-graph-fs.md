# Sector D: Graph & Filesystem Operations

**Deep Scan Report** — Generated: 2025-01-XX  
**Files Analyzed**: 13 source files + 2 schemas  
**Total LOC**: ~2,600 lines

---

## File Inventory

| File | LOC | Primary Responsibility |
|------|-----|------------------------|
| `src/lib/graph/shared.ts` | 231 | Core graph I/O primitives, state loading, logging |
| `src/lib/graph/writer.ts` | 307 | Graph write operations, task/mem upsert, invalidation |
| `src/lib/graph/fk-validator.ts` | 177 | Foreign key validation for tasks and mems |
| `src/lib/graph/reader.ts` | 317 | Graph read operations with FK validation pipeline |
| `src/lib/graph-io.ts` | 39 | Public API re-exports for graph operations |
| `src/lib/graph-migrate.ts` | 853 | Legacy → graph migration, ID normalization |
| `src/lib/fs/session-io.ts` | 514 | Session file I/O, YAML frontmatter parsing |
| `src/lib/fs/planning-ops.ts` | 508 | Planning directory init, index generation, archive ops |
| `src/lib/fs/planning-paths.ts` | 137 | Planning-specific path resolution |
| `src/lib/persistence.ts` | 402 | BrainState disk persistence with file locking |
| `src/lib/file-lock.ts` | 52 | Cross-process file locking via proper-lockfile |
| `src/lib/paths.ts` | 621 | Central path resolver — single source of truth |
| `src/lib/hiveops-paths.ts` | 33 | HiveOps-specific paths (gates, SOT, TODO) |
| `src/schemas/graph-state.ts` | 96 | Zod schemas for graph state containers |
| `src/schemas/graph-nodes.ts` | 528 | Zod schemas for individual graph nodes |
| `src/lib/orphan-quarantine.ts` | 90 | Orphan node quarantine for FK violations |
| `src/lib/manifest.ts` | 561 | Typed manifest layer for relational state |

---

## Graph Architecture

### The FK (Foreign Key) System

The graph uses a **relational foreign key system** to enforce referential integrity between nodes. The hierarchy follows this lineage chain:

```
TrajectoryNode (root)
    └── session_id: UUID
    └── active_plan_id → PlanNode.id
                          └── project_id → ProjectNode.id
                          └── milestone_id → MilestoneNode.id
                          └── phases[] → PhaseNode.id
                              └── tasks[] → TaskNode.id
                                  └── parent_phase_id → PhaseNode.id
                                  └── plan_id → PlanNode.id
                                  └── verification_id → VerificationNode.id

MemNode
    └── session_id → TrajectoryNode.session_id (REQUIRED)
    └── origin_task_id → TaskNode.id (nullable)
    └── verification_id → VerificationNode.id (nullable)
```

### Node Types and Their FKs

| Node | Primary FK | Optional FKs |
|------|------------|--------------|
| `TaskNode` | `parent_phase_id` | `plan_id`, `milestone_id`, `project_id` |
| `MemNode` | `session_id` | `origin_task_id`, `verification_id` |
| `PlanNode` | `trajectory_id` | `project_id`, `milestone_id`, `parent_plan_id` |
| `PhaseNode` | `plan_id` | — |
| `VerificationNode` | `task_id` | `plan_id` |
| `SubtaskNode` | `task_id`, `session_id` | — |

### Special UUIDs for Migration

The migration system uses **fixed UUIDs** for legacy entities:

```typescript
LEGACY_PHASE_ID     = "00000000-0000-4000-8000-000000000001"
LEGACY_PLAN_ID      = "00000000-0000-4000-8000-000000000002"
LEGACY_TRAJECTORY_ID = "00000000-0000-4000-8000-000000000003"
```

These ensure all migrated tasks have valid parent references during and after migration.

---

## Read/Write Patterns

### Graph Reader Flow (`reader.ts`)

```
loadGraphTasks(projectRoot, { enabled: true })
    │
    ├── loadPlans() → extract validPhaseIds, validPlanIds
    ├── loadTrajectory() → extract lifecyclePhaseId
    │
    └── validateTasksWithFKValidation(filePath, validPhaseIds, orphanPath, ...)
            │
            ├── Parse JSON → GraphTasksStateSchema
            ├── For each task:
            │   ├── Check parent_phase_id ∈ validPhaseIds
            │   ├── Check plan_id ∈ validPlanIds
            │   ├── Check project_id/milestone_id lineage consistency
            │   └── Quarantine if FK violation
            │
            └── Return validated state
```

### Graph Writer Flow (`writer.ts`)

```
addGraphTask(projectRoot, task)
    │
    ├── withFileLock(filePath, async () => {
    │       │
    │       ├── Parse task against TaskNodeSchema
    │       ├── _loadRawTasks() → current state
    │       ├── taskById.set(validatedTask.id, validatedTask)
    │       └── saveGraphTasks() → atomic write
    │   })
    │
    └── Return task.id
```

### Atomic Write Pattern (shared across all writers)

```typescript
const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
await writeFile(tempPath, JSON.stringify(validated, null, 2))
await rename(tempPath, filePath)  // POSIX atomic rename
```

---

## FK Validation Logic

### Task Validation (`fk-validator.ts`)

The FK validator enforces **five validation rules** for tasks:

1. **Phase FK**: `task.parent_phase_id` MUST exist in `validPhaseIds`
2. **Plan FK**: If `task.plan_id` is set, it MUST exist in `validPlanIds`
3. **Lineage Consistency**: If `project_id` or `milestone_id` is set, `plan_id` MUST also be set
4. **Project Lineage**: `task.project_id` must match `plan.project_id` if both set
5. **Milestone Lineage**: `task.milestone_id` must match `plan.milestone_id` if both set

### Memory Validation

For `MemNode`, three rules apply:

1. **Task FK**: `mem.origin_task_id` MUST exist in `validTaskIds` (if not null)
2. **Session FK**: `mem.session_id` MUST exist in `validSessionIds`
3. **Verification FK**: `mem.verification_id` MUST exist in `validVerificationIds` (if set)

### Quarantine Behavior

Invalid nodes are **quarantined** rather than discarded:

```typescript
// OrphanRecord structure
{
  id: string,
  type: "task" | "mem",
  reason: string,  // e.g., "parent_phase_id xxx not found in valid phases"
  original_data: unknown,
  quarantined_at: ISO8601 string
}
```

Quarantine prevents data loss while allowing the system to boot with partially corrupt state.

---

## Session Persistence

### Session File Format (`session-io.ts`)

Sessions are stored as **YAML frontmatter + Markdown body**:

```markdown
---
session_id: "uuid-here"
stamp: "2025-01-15-..."
mode: "plan_driven"
governance_status: "OPEN"
trajectory: "Feature X implementation"
linked_plans: ["PLAN-001"]
---

# Session: 2025-01-15-...

## Hierarchy
<!-- Rendered from hierarchy.json -->

## Log
<!-- Append-only within same session -->

## Notes
<!-- Scratchpad -->
```

### Session Manifest

The `sessions/manifest.json` tracks all sessions:

```typescript
interface SessionManifest {
  sessions: SessionManifestEntry[]
  active_stamp: string | null
}

interface SessionManifestEntry {
  stamp: string
  file: string
  status: "active" | "archived" | "compacted" | "suspended"
  created: number
  session_id?: string | string[]
  linked_plans: string[]
  // ... more fields
}
```

### Archive Flow

```
archiveSession(projectRoot, sessionId, content)
    │
    ├── Find active session in manifest
    ├── Generate archive filename (session-{slug}.md)
    ├── Update frontmatter with status: "archived"
    ├── Move file: sessions/active/ → sessions/archive/
    └── Update manifest: active_stamp = null
```

---

## Plan Persistence

### Plans Directory Structure

```
.hivemind/
├── plans/
│   ├── manifest.json
│   └── templates/
├── graph/
│   ├── plans.json      # Relational graph state
│   └── tasks.json
```

### Plan Manifest Entry

```typescript
interface PlanManifestEntry {
  id: string
  type: "root" | "sub" | "atomic"
  prefix: string         // META01, PROJ01-SUB01
  status: "pending" | "active" | "complete" | "blocked"
  parent_id: string | null    // FK to parent plan
  root_id: string | null      // FK to root plan
  linked_sessions: string[]
  linked_graph_plan_id: string | null
  domain: PlanDomain
  purpose: PlanPurpose
  validation_state: "pending" | "validated" | "failed" | "skipped"
  dependencies: string[]
}
```

---

## File Locking Strategy

### Cross-Process Locking (`file-lock.ts`)

Uses **proper-lockfile** library for cross-process safety:

```typescript
export async function withFileLock<T>(
  filePath: string,
  fn: () => Promise<T>,
  options: LockOptions = {},
): Promise<T> {
  const { retries = 5, stale = 10000, update = 5000 } = options

  const release = await lockfile.lock(filePath, { retries, stale, update })
  try {
    return await fn()
  } finally {
    await release()
  }
}
```

### Lock Options

| Option | Default | Purpose |
|--------|---------|---------|
| `retries` | 5 | Max retry attempts when lock is held |
| `stale` | 10000ms | Time before lock considered stale |
| `update` | 5000ms | Time between lock file updates |

### BrainState Persistence (`persistence.ts`)

Uses a **custom FileLock class** with additional features:

- **Stale lock detection**: Removes locks older than 5 seconds
- **Exponential backoff**: Starts at 50ms, caps at 500ms
- **Automatic cleanup**: Removes old backups, keeps last 3
- **Atomic temp file pattern**: Write to `.tmp`, rename to main

```typescript
class FileLock {
  async acquire(timeout = 5000): Promise<void> {
    // Exponential backoff with stale lock removal
  }
  async release(): Promise<void> {
    // Close handle + remove lock file
  }
}
```

---

## Path Computation

### Central Path Resolver (`paths.ts`)

**Single source of truth** for all `.hivemind/` paths:

```typescript
export function getHivemindPaths(projectRoot: string): HivemindPaths {
  const root = join(projectRoot, HIVEMIND_DIR) // ".hivemind"
  // ... compute all paths
}
```

### Directory Structure (v2.0.0)

```
.hivemind/
├── INDEX.md                    # Human-readable index
├── manifest.json               # Root manifest
├── config.json                 # Configuration
│
├── state/                      # Hot — updated every turn
│   ├── manifest.json
│   ├── brain.json              # Runtime state
│   ├── hierarchy.json          # Hierarchy tree
│   ├── anchors.json            # Immutable anchors
│   └── tasks.json              # Task state
│
├── memory/                     # Warm — cross-session
│   ├── manifest.json
│   └── mems.json
│
├── sessions/
│   ├── manifest.json
│   ├── active/                 # Active session files
│   └── archive/
│       └── exports/            # Session exports
│
├── plans/
│   ├── manifest.json
│   └── templates/
│
├── graph/                      # v3.0 Relational graph
│   ├── trajectory.json
│   ├── plans.json
│   ├── tasks.json
│   ├── mems.json
│   ├── orphans.json            # Quarantined nodes
│   ├── pending-changes.json
│   └── verification-ledger.json
│
├── project/planning/           # Readable planning SOT
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   └── MILESTONES.md
│
├── codemap/                    # Level 0 SOT
├── codewiki/                   # Level 0 SOT
├── logs/
├── docs/
└── templates/
```

### Security: Path Sanitization

```typescript
// Rejects path traversal attempts
export function sanitizeSessionFileName(file: string): string | null
export function sanitizeSessionStamp(stamp: string): string | null
export function safeJoinWithin(baseDir: string, fileName: string): string | null
```

The `safeJoinWithin` function ensures resolved paths don't escape the base directory.

---

## Data Schemas

### Graph State Schemas (`graph-state.ts`)

```typescript
// Container schemas (wrap arrays of nodes)
TrajectoryStateSchema   // { version, trajectory: TrajectoryNode | null }
PlansStateSchema        // { version, plans: PlanNode[] }
GraphTasksStateSchema   // { version, tasks: TaskNode[] }
GraphMemsStateSchema    // { version, mems: MemNode[] }
```

### Core Node Schemas (`graph-nodes.ts`)

**TaskNode** (most complex):
```typescript
TaskNodeSchema = z.object({
  id: z.string().uuid(),
  parent_phase_id: z.string().uuid(),      // REQUIRED FK
  title: z.string(),
  status: z.enum(["pending", "in_progress", "active", "complete", 
                  "blocked", "invalidated", "cancelled"]),
  file_locks: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Optional FKs
  plan_id: z.string().uuid().nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  // HiveFiver integration
  domain: z.enum(["dev", "marketing", "finance", "office-ops", "hybrid"]).optional(),
  persona: z.string().optional(),
  // ... many more optional fields
})
```

**MemNode**:
```typescript
MemNodeSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),           // REQUIRED FK
  origin_task_id: z.string().uuid().nullable(),
  verification_id: z.string().uuid().nullable().optional(),
  shelf: z.string(),
  type: z.enum(["insight", "false_path"]),
  content: z.string(),
  relevance_score: z.number().min(0).max(1),
  staleness_stamp: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
```

---

## Consistency Guarantees

### 1. Atomic Writes

All write operations use the **temp file + rename pattern**:

```typescript
const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
await writeFile(tempPath, JSON.stringify(data, null, 2))
await rename(tempPath, filePath)  // Atomic on POSIX
```

### 2. File Locking

- **Cross-process**: `proper-lockfile` for concurrent agent access
- **Stale detection**: Locks older than 5-10 seconds are removed
- **Retry logic**: Exponential backoff with configurable retries

### 3. Zod Validation

All state is validated against Zod schemas before acceptance:

```typescript
const result = GraphTasksStateSchema.safeParse(parsed)
if (!result.success) {
  await logGraph("error", filePath, "Validation error", result.error.message)
  return null
}
```

### 4. Orphan Quarantine

Invalid nodes are preserved, not discarded:

- Invalid tasks → `graph/orphans.json` with reason
- Invalid mems → same quarantine file
- Prevents silent data loss

### 5. Backup Strategy

BrainState maintains multiple backups:

```typescript
// Timestamped backup
const timestampedBakPath = brainPath + `.bak.${timestamp}`
await copyFile(brainPath, timestampedBakPath)

// Cleanup old backups (keep last 3)
await cleanupOldBackups(brainPath, logger)
```

---

## Cross-Sector Dependencies

### Sectors That Depend on Graph/FS

| Sector | Dependencies |
|--------|--------------|
| **Hooks** | Uses `persistence.ts` for brain state, `graph-io.ts` for task tracking |
| **Tools** | All HiveOps tools use `paths.ts` for path resolution |
| **Session Lifecycle** | Uses `session-io.ts` for session persistence |
| **Planning** | Uses `planning-ops.ts` for directory initialization |
| **Migration** | Uses `graph-migrate.ts` for legacy → graph conversion |

### Imported By (Incoming)

- `src/hooks/` — Hook handlers read/write brain state
- `src/tools/` — All HiveOps tools
- `src/index.ts` — Plugin entry point uses path resolver
- `src/lib/bridges/` — Ralph bridge uses graph snapshots

### Imports From (Outgoing)

- `src/schemas/` — Zod schemas for validation
- `src/lib/logging.ts` — Logger creation
- `proper-lockfile` — External dependency for file locking
- `yaml` — YAML parsing for session files

---

## Knowledge Gaps

### Unresolved Questions

1. **Migration Idempotency**: Does `migrateToGraph()` handle partial migrations?  
   - *Evidence*: Function checks for existing `trajectory.json` before proceeding
   - *Gap*: What happens if migration fails mid-way?

2. **Concurrent Writers**: How are conflicts resolved when multiple agents write simultaneously?  
   - *Evidence*: File locking with retries
   - *Gap*: What's the contention resolution strategy?

3. **Graph Version Compatibility**: How are schema version upgrades handled?  
   - *Evidence*: `GRAPH_STATE_VERSION = "1.0.0"` constant
   - *Gap*: No migration logic for version changes

4. **Orphans Recovery**: Can quarantined nodes be re-integrated?  
   - *Evidence*: Orphans are stored with original data
   - *Gap*: No recovery tool exists

5. **Session Split Handling**: The `SessionNodeSchema` has `status: "split"` but no split logic visible in session-io  
   - *Evidence*: Schema defines split status
   - *Gap*: Implementation not found in analyzed files

### Recommended Follow-Up

- [ ] Analyze `src/hooks/` to understand write amplification patterns
- [ ] Review `src/lib/bridges/ralph-bridge.ts` for task graph snapshot usage
- [ ] Investigate `src/schemas/brain-state.ts` for migration history
- [ ] Check for orphan recovery tools elsewhere in codebase

---

## Summary

The Graph & Filesystem Operations sector implements a **relational graph system** with:

- **Foreign Key validation** ensuring referential integrity
- **Atomic writes** with temp file + rename pattern
- **Cross-process file locking** for concurrent agent access
- **Orphan quarantine** for graceful degradation on FK violations
- **Centralized path management** as single source of truth
- **Migration tooling** for legacy → graph conversion

The architecture prioritizes **data integrity** over performance, with extensive validation and quarantine mechanisms that allow the system to boot even with partially corrupt state.
