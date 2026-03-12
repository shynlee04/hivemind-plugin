# HiveMind Entity Relationship & State Mapping Synthesis

**Generated**: 2026-03-12
**Scope**: Tools, Libs, Hooks, Schema, Skills
**Purpose**: Unified entity relationship map for cross-system understanding

---

## 1. Entity Catalog

### 1.1 Core Entities

| Entity | Schema Type | Storage | Canonical Source |
|--------|-------------|---------|------------------|
| **BrainState** | `BrainState` | `.hivemind/state/brain.json` | Runtime session state |
| **HierarchyTree** | `HierarchyTree` | `.hivemind/state/hierarchy.json` | Work context tree |
| **Trajectory** | `TrajectoryNode` | `.hivemind/graph/trajectory.json` | Lifecycle chain root |
| **Session** | `SessionNode` | `.hivemind/graph/sessions.json` | Session records |
| **Plan** | `PlanNode` | `.hivemind/graph/plans.json` | Planning hierarchy |
| **Task** | `TaskNode` | `.hivemind/graph/tasks.json` | Execution tasks |
| **Mem** | `MemNode` | `.hivemind/graph/mems.json` | Memory entries |
| **Delegation** | `DelegationNode` | `.hivemind/graph/delegations.json` | Subagent delegations |

### 1.2 Manifest Entities (Projections)

| Manifest | Storage | Purpose |
|----------|---------|---------|
| **RootManifest** | `.hivemind/manifest.json` | SOT registry |
| **SessionManifest** | `.hivemind/sessions-manifest.json` | Session index |
| **PlanManifest** | `.hivemind/plans-manifest.json` | Plan index |
| **TaskManifest** | `.hivemind/state/tasks.json` | Task authority (canonical) |
| **MemoryManifest** | `.hivemind/memory-manifest.json` | Memory shelf stats |

### 1.3 Entity Hierarchy Levels

```
Level 0: SOT (Codemap, Codewiki) — immutable source of truth
Level 1: Project → Milestone → Phase — planning lifecycle
Level 2: Plan (root/sub/atomic) — execution planning
Level 3: Task → Subtask — work items
Level 4: Verification → Mem — evidence and memory
```

---

## 2. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HIVEMIND ENTITY RELATIONSHIPS                        │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   BrainState     │ ← Runtime session governance
                    │  (brain.json)    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Session   │  │  Hierarchy  │  │   Metrics   │
    │  (nested)   │  │  (nested)   │  │  (nested)   │
    └──────┬──────┘  └──────┬──────┘  └─────────────┘
           │                │
           │                │
           ▼                ▼
    ┌─────────────────────────────────────────────────────────────┐
    │                    TRAJECTORY LAYER                         │
    │  trajectory.json — the lifecycle chain root                │
    └─────────────────────────────┬───────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   Project   │      │    Plan     │      │   Session   │
    │ (optional)  │      │  (graph)    │      │   (graph)   │
    └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
           │                    │                     │
           │                    │                     │
           ▼                    ▼                     │
    ┌─────────────┐      ┌─────────────┐             │
    │  Milestone  │─────▶│    Phase    │             │
    └─────────────┘      └──────┬──────┘             │
                                │                     │
                                ▼                     │
                         ┌─────────────┐              │
                         │    Task     │◀─────────────┘
                         │ (graph)     │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
    ┌─────────────┐     ┌─────────────┐   ┌─────────────┐
    │  Subtask    │     │Verification│   │     Mem     │
    │ (optional)  │     │ (optional)  │   │  (memory)   │
    └─────────────┘     └─────────────┘   └─────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         DELEGATION RELATIONSHIPS                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │   Session   │─────────▶│ Delegation  │─────────▶│   Subagent  │
    │  (main)     │          │    Node     │          │   Session   │
    └─────────────┘          └──────┬──────┘          └─────────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │    Task     │
                             │ (delegated) │
                             └─────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         MANIFEST RELATIONSHIPS                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌───────────────────┐
    │   RootManifest    │ — SOT registry
    └────────┬──────────┘
             │
    ┌────────┴────────┬────────────────┐
    │                 │                │
    ▼                 ▼                ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Session    │ │    Plan     │ │   Memory    │
│  Manifest   │ │  Manifest   │ │  Manifest   │
└──────┬──────┘ └──────┬──────┘ └─────────────┘
       │               │
       │    ┌──────────┘
       │    │
       ▼    ▼
┌─────────────────────────┐
│   linkSessionToPlan()   │ — bidirectional FK
└─────────────────────────┘
```

---

## 3. State Flow Mapping

### 3.1 Session Lifecycle State Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SESSION STATE MACHINE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
    ┌─────────┐     hivemind_session({action:"start"})
    │  OPEN   │◀──────────────────────────────────────────┐
    └────┬────┘                                           │
         │                                                │
    ┌────┼────────────────────────────────────────────────┤
    │    │                                                │
    │    ▼                                                │
    │  ┌─────────┐   map_context()   ┌─────────┐         │
    │  │trajectory│─────────────────▶│ tactic  │         │
    │  │  level  │                   │  level  │         │
    │  └─────────┘                   └────┬────┘         │
    │                                     │               │
    │                                     ▼               │
    │                               ┌─────────┐          │
    │                               │ action  │          │
    │                               │  level  │          │
    │                               └────┬────┘          │
    │                                    │               │
    │                                    ▼               │
    │  ┌─────────┐   hivemind_session({action:"close"}) │
    │  │ CLOSED  │◀──────────────────────────────────────┘
    │  └────┬────┘
    │       │
    │       ▼
    │  ┌─────────┐   hivemind_session({action:"resume"})
    │  │RESUMED  │───────────────────────────────────────▶
    │  └─────────┘
    └──────────────────────────────────────────────────────┘
```

### 3.2 State Propagation Paths

| Trigger | Source | Target | Mechanism |
|---------|--------|--------|-----------|
| `hivemind_session(start)` | brain.json | trajectory.json | `syncTrajectoryToGraph()` |
| `hivemind_session(update)` | brain.json | trajectory.json | Level-based sync |
| `hivemind_session(close)` | brain.json | trajectory.json | Clear active state |
| `hivemind_plan(create)` | plans-manifest.json | graph/plans.json | `persistActivePlanContext()` |
| `hiveops_todo(add)` | state/tasks.json | graph/tasks.json | `saveTaskAuthority()` |
| `hivemind_memory(save)` | memory/*.json | graph/mems.json | `addGraphMem()` |

### 3.3 State Mutation Queue

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STATE MUTATION QUEUE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    Tool Call
        │
        ▼
    ┌─────────────────┐
    │ queueMutation() │ ──► Mutation Queue (in-memory)
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ flushMutations() │ ──► StateManager.withState()
    └────────┬────────┘         │
             │                  ▼
             │           ┌─────────────┐
             │           │  brain.json │ (atomic write)
             │           └─────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Graph Sync      │ ──► trajectory.json, tasks.json, mems.json
    └─────────────────┘
```

---

## 4. File Storage Inventory

### 4.1 State Files (`.hivemind/state/`)

| File | Schema | Owner | Purpose |
|------|--------|-------|---------|
| `brain.json` | `BrainState` | `persistence.ts` | Runtime governance state |
| `hierarchy.json` | `HierarchyTree` | `hierarchy-tree.ts` | Work context tree |
| `tasks.json` | `TaskManifest` | `hiveops-todo.ts` | **Canonical task authority** |
| `anchors.json` | `AnchorsState` | `anchors.ts` | Immutable anchors |

### 4.2 Graph Files (`.hivemind/graph/`)

| File | Schema | Owner | Purpose |
|------|--------|-------|---------|
| `trajectory.json` | `TrajectoryState` | `graph/writer.ts` | Lifecycle chain root |
| `plans.json` | `PlansState` | `graph/writer.ts` | Plan nodes |
| `tasks.json` | `GraphTasksState` | `graph/writer.ts` | Task nodes (FK to phases) |
| `mems.json` | `GraphMemsState` | `graph/writer.ts` | Memory nodes |
| `sessions.json` | `SessionsState` | `graph/writer.ts` | Session nodes |
| `delegations.json` | `DelegationsState` | `graph/writer.ts` | Delegation records |
| `orphans.json` | `OrphanRecord[]` | `graph/fk-validator.ts` | Quarantined orphans |

### 4.3 Manifest Files (`.hivemind/`)

| File | Schema | Owner | Purpose |
|------|--------|-------|---------|
| `manifest.json` | `RootManifest` | `manifest.ts` | SOT registry |
| `sessions-manifest.json` | `SessionManifest` | `manifest.ts` | Session index |
| `plans-manifest.json` | `PlanManifest` | `manifest.ts` | Plan index |
| `memory-manifest.json` | `MemoryManifest` | `manifest.ts` | Memory shelf stats |

### 4.4 Compatibility Surfaces (Legacy)

| File | Source | Purpose |
|------|--------|---------|
| `.hivemind/state/todo.json` | `hiveops-todo.ts` | Legacy TODO compatibility |
| `.hivemind/exports/*.json` | `hiveops-export.ts` | Session handoffs |

---

## 5. Consistency Mechanisms

### 5.1 Foreign Key Validation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FK VALIDATION CHAIN                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    loadGraphTasks()
         │
         ▼
    ┌─────────────────────────┐
    │ Load Plans & Trajectory │ ──► Build valid phase/plan ID sets
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ validateTasksWithFK()   │ ──► Check each task's parent_phase_id
    └────────────┬────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
    ┌─────────┐    ┌─────────────┐
    │  Valid  │    │   Orphan    │ ──► Quarantine to orphans.json
    │  Task   │    │   Record    │
    └─────────┘    └─────────────┘
```

### 5.2 Orphan Quarantine

When FK validation fails:
1. Orphan record created in `graph/orphans.json`
2. Task status set to `invalidated`
3. Orphan quarantined for later reconciliation

### 5.3 Atomic Write Pattern

All state files use atomic write:
1. Write to `.tmp` file
2. Rename existing to `.bak`
3. Rename `.tmp` to target
4. Cleanup old backups (keep last 3)

### 5.4 File Locking

```typescript
class FileLock {
  async acquire(timeout = 5000): Promise<void> {
    // Exclusive lock with stale detection
    // Retry with exponential backoff
  }
  async release(): Promise<void> {
    // Cleanup lock file
  }
}
```

---

## 6. Hierarchy Chain Analysis

### 6.1 Chain Break Detection

```typescript
interface ChainBreak {
  level: "trajectory" | "tactic" | "action";
  issue: "orphaned" | "missing_parent" | "empty_chain" | "stale_gap";
  message: string;
}
```

**Detection Rules:**
1. Action without tactic → `missing_parent`
2. Tactic without trajectory → `missing_parent`
3. Empty chain with OPEN session → `empty_chain`
4. Timestamp gap > 2 hours → `stale_gap`

### 6.2 Context Integrity Repair

| Signal | Repair Action |
|--------|---------------|
| Drift score < 50 | Re-declare intent |
| Post-compaction | Refresh from anchors |
| Session gap | Load last session, trace work |
| Multiple pivots | Prune abandoned branches |

---

## 7. Recommendations for Refactor

### 7.1 Critical Issues

1. **Dual Task Authority**
   - `state/tasks.json` (canonical) vs `graph/tasks.json` (graph)
   - **Recommendation**: Unify to single source, use graph as canonical

2. **Manifest-Graph Drift**
   - `plans-manifest.json` vs `graph/plans.json` can diverge
   - **Recommendation**: Single write path with dual projection

3. **Session ID Fragmentation**
   - Multiple session ID formats: UUID, stamp, opencode_session_id
   - **Recommendation**: Normalize to UUID at boundaries

### 7.2 Architectural Improvements

1. **Event-Sourced State**
   - Current: Direct file writes
   - Proposed: Event log + projection
   - Benefit: Full audit trail, replay capability

2. **Graph-First Architecture**
   - Current: Manifest + Graph dual maintenance
   - Proposed: Graph as single source, manifests as projections
   - Benefit: Eliminates sync issues

3. **Unified FK Validation**
   - Current: Scattered validation in readers
   - Proposed: Centralized validation layer
   - Benefit: Consistent orphan handling

### 7.3 Code Organization

1. **Consolidate Task Authority**
   - Merge `hiveops-todo.ts` task logic into `graph/writer.ts`
   - Keep `hiveops-todo.ts` as thin tool wrapper

2. **Extract State Machine**
   - Session lifecycle is scattered across tools
   - Extract to `session-state-machine.ts`

3. **Unify Hierarchy**
   - `brain.json` hierarchy (flat) vs `hierarchy.json` (tree)
   - Migrate to tree-only with flat projection for compatibility

---

## 8. Summary

### Entity Count

| Category | Count | Storage Location |
|----------|-------|------------------|
| Core State | 4 | `.hivemind/state/` |
| Graph Nodes | 8 | `.hivemind/graph/` |
| Manifests | 5 | `.hivemind/` |
| **Total** | **17** | |

### Key Relationships

- **Session → Trajectory**: 1:1 (via session_id)
- **Trajectory → Plan**: 1:N (active_plan_id)
- **Plan → Phase**: 1:N (phases array)
- **Phase → Task**: 1:N (parent_phase_id FK)
- **Task → Mem**: 1:N (origin_task_id FK)
- **Session → Delegation**: 1:N (session_id FK)

### State Flow Summary

```
User Action → Tool → Mutation Queue → StateManager → brain.json
                                        ↓
                              Graph Sync → graph/*.json
                                        ↓
                              Manifest Update → *-manifest.json
```

---

**End of Synthesis Report**
