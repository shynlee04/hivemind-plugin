# Architecture Patterns - Phase 2 Cognitive Packer

**Domain:** Context Compilation / State Management
**Researched:** 2026-02-18

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     packCognitiveState()                    │
│                    (Context Compiler)                       │
├─────────────────────────────────────────────────────────────┤
│  1. Load Graph Files                                         │
│     └── graph-io.ts: loadTrajectory/loadTasks/loadMems     │
│  2. Prune Contaminated (Time Machine)                       │
│     └── cognitive-packer.ts: pruneContaminated()           │
│  3. Filter Stale (TTS)                                      │
│     └── staleness.ts: isMemStale()                         │
│  4. Budget Compression                                       │
│     └── staleness.ts: calculateRelevanceScore()            │
│  5. Build XML                                                │
│     └── cognitive-packer.ts: escapeXml(), buildMemXmlLines()│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Graph I/O Layer                          │
│                    (graph-io.ts)                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Trajectory   │  │ Tasks        │  │ Mems         │      │
│  │ (root)       │  │ (FK: phase)  │  │ (FK: task)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           ▼                                 │
│                  ┌──────────────┐                           │
│                  │ Orphans File │                           │
│                  │ (quarantine) │                           │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `cognitive-packer.ts` | XML compilation, budget management | staleness.ts, graph-io.ts, paths.ts |
| `staleness.ts` | TTS filtering, relevance scoring | Pure functions, no dependencies |
| `graph-io.ts` | Graph persistence, FK validation | paths.ts, file-lock.ts, schemas |
| `paths.ts` | Path resolution | getEffectivePaths() |

### Data Flow

```
User calls packCognitiveState(projectRoot, options)
    │
    ├─── Load trajectory.json (via graph-io)
    │    └─── Return null → buildEmptyStateXml()
    │
    ├─── Load plans.json, tasks.json, mems.json
    │    └─── Zod validation on read
    │
    ├─── pruneContaminated(mems, tasks)
    │    ├─── Filter false_path mems → prunedMems
    │    └─── Filter invalidated tasks → prunedTasks
    │
    ├─── For each mem: isMemStale(mem, activeTaskIds)
    │    ├─── Check origin_task_id in activeTaskIds → false (not stale)
    │    └─── Check staleness_stamp < now → true (stale)
    │
    ├─── Calculate remaining budget
    │    └─── Sort by relevance, drop lowest
    │
    └─── Build XML string
         └─── Return deterministic XML
```

## Patterns to Follow

### Pattern 1: Pure Functions for State
**What:** All compilation functions are pure - no side effects
**When:** Any state transformation
**Example:**
```typescript
export function pruneContaminated(
  mems: MemNode[],
  tasks: TaskNode[]
): PrunedNodes {
  // No mutations, no I/O, deterministic output
  const cleanMems = mems.filter(m => m.type !== "false_path");
  const prunedMems = mems.filter(m => m.type === "false_path");
  // ...
}
```

### Pattern 2: Atomic File Writes
**What:** Write to temp file, then rename
**When:** Any file write operation
**Example:**
```typescript
const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
await writeFile(tempPath, JSON.stringify(data));
await rename(tempPath, filePath);  // Atomic on POSIX
```

### Pattern 3: SafeParse (Non-Throwing)
**What:** Use Zod safeParse instead of parse
**When:** Loading external data
**Example:**
```typescript
const result = GraphTasksStateSchema.safeParse(parsed);
if (!result.success) {
  console.error("Validation error:", result.error.message);
  return EMPTY_TASKS_STATE;  // Graceful degradation
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct File Reads in Compiler
**What:** Reading files inside packCognitiveState without validation
**Why bad:** Unvalidated data can crash the agent
**Instead:** Always use graph-io.ts functions which validate

### Anti-Pattern 2: Mutation of Input Arrays
**What:** Modifying mems/tasks arrays in place
**Why bad:** Breaks referential transparency, causes bugs
**Instead:** Create new arrays with filter/map

### Anti-Pattern 3: Ignoring FK Violations
**What:** Loading tasks/mems without validating parent references
**Why bad:** Orphan data corrupts context
**Instead:** Use loadGraphTasks/loadGraphMems with FK validation

## Scalability Considerations

| Concern | At 100 mems | At 10K mems | At 1M mems |
|---------|-------------|-------------|------------|
| Pack time | <10ms | ~100ms | ~1s (need index) |
| Memory | Minimal | ~10MB | ~100MB (stream needed) |
| Relevance sort | O(n log n) | OK | Need pre-index |

**Recommendation:** Current implementation handles 10K mems well. For 1M+, consider:
- Pre-indexing relevance scores
- Streaming XML generation
- Mem pagination

## Sources

- Code analysis: src/lib/cognitive-packer.ts, staleness.ts, graph-io.ts
- Schema analysis: src/schemas/graph-nodes.ts, graph-state.ts
- Test patterns: tests/orphan-quarantine.test.ts, tests/graph-migrate.test.ts
