# Sector A: Core Session Management

**Scan Date:** 2025-01-10
**Sector Focus:** src/lib/*.ts (session, governance, context, compaction)
**Total Files Scanned:** 25 files

---

## File Inventory

| Filename | LOC | Primary Responsibility |
|----------|-----|------------------------|
| `session-governance.ts` | 346 | Compiles governance signals for lifecycle hook injection |
| `session-engine.ts` | 669 | Core session CRUD (start/update/close/resume) + hierarchy tree ops |
| `session-split.ts` | 199 | Non-disruptive session splitting at natural boundaries |
| `session-boundary.ts` | 124 | Pure recommendation logic for when to create new sessions |
| `session-role.ts` | 106 | Session kind (main/sub) + lineage scope inference |
| `session-intent-classifier.ts` | 229 | Classifies session intent (discovery/research/planning/debug/etc) |
| `session_coherence.ts` | 604 | First-turn context retrieval, prompt transformation, confidence scoring |
| `session-coherence-types.ts` | 64 | Type definitions for session coherence |
| `session-swarm.ts` | 346 | Headless researcher actor model for background tasks |
| `session-memory-classifier.ts` | 103 | Classifies memory artifacts by category |
| `session-memory-purge.ts` | 86 | Purges transient session memory on task completion |
| `session-export.ts` | 247 | Session export/import to JSON/Markdown formats |
| `governance-instruction.ts` | 364 | HIVE-MASTER strict governance instruction compilation |
| `gatekeeper.ts` | 159 | Programmatic enforcement of session state validation |
| `runtime-session-lineage.ts` | 116 | SDK session parent/child linkage resolution |
| `state-snapshot.ts` | 74 | Unified state snapshot aggregation |
| `state-mutation-queue.ts` | 881 | CQRS-compliant state mutation queue for hooks |
| `compaction-engine.ts` | 448 | Session archiving + purification + turning point extraction |
| `inspect-engine.ts` | 549 | Inspection APIs (scan/deep/drift/introspect/traverse) |
| `budget.ts` | 85 | Context budget constants (15,360 chars default) |
| `complexity.ts` | 70 | Complexity detection (files touched + turns) |
| `context-escalation.ts` | 170 | Context quality escalation levels (1-4) |
| `context-purifier.ts` | 100 | Context deduplication + fingerprinting |
| `staleness.ts` | 151 | TTS (Time-To-Stale) filter for MemNode filtering |
| `detection.ts` | 857 | Detection engine for drift, stuck patterns, governance alerts |
| `long-session.ts` | 30 | Simple long session detection (turn count threshold) |
| `orphan-quarantine.ts` | 90 | Orphan record quarantine for corrupted nodes |
| `cognitive-packer.ts` | 622 | Context compiler - dense XML state packaging |

**Total LOC:** ~6,792 lines

---

## Runtime Flow Analysis

### Entry Point Chain (Session Start)

```
session-engine.startSession()
    ├── createStateManager() → persistence.ts
    ├── initializePlanningDirectory() → planning-fs.ts
    ├── createBrainState() → schemas/brain-state.ts
    ├── generateSessionId() → schemas/brain-state.ts
    ├── createTree() + setRoot() → hierarchy-tree.ts
    ├── saveTree() → hierarchy-tree.ts
    ├── stateManager.save() → persistence.ts
    └── registerSession() → planning-fs.ts

session-governance.buildGovernanceSignals()
    ├── detectFrameworkContext() → framework-context.ts
    ├── collectProjectSnapshot() → project-snapshot.ts
    ├── loadTreeMetrics() → hierarchy-tree.ts
    ├── compileDetectionSignals() → detection.ts
    ├── detectChainBreaks() → chain-analysis.ts
    ├── detectLongSession() → long-session.ts
    └── generateEscalationBlock() → context-escalation.ts
```

### Mid-Session Chain (Tool Execution)

```
state-mutation-queue.queueStateMutation()
    └── Queued until flushMutations() called by tool

detection.classifyTool()
    └── Returns: "read" | "write" | "query" | "governance"

detection.trackToolResult()
    └── Updates consecutive_failures counter

detection.scanForKeywords()
    └── Scans for stuck/confusion signals

session-engine.updateSession()
    ├── validateHierarchyString() → schemas/hierarchy.ts
    ├── isOffTrackUpdate() → queues to offtrack_todo_pending
    ├── loadTree() + addChild() → hierarchy-tree.ts
    ├── validateAncestorChain() → hierarchy-tree.ts
    └── stateManager.save() → persistence.ts
```

### Compaction Chain (Session Close)

```
compaction-engine.executeCompaction()
    ├── readActiveMd() → planning-fs.ts
    ├── loadTree() → hierarchy-tree.ts
    ├── archiveSession() → planning-fs.ts
    ├── addGraphMem() → graph-io.ts (lifecycle trace)
    ├── identifyTurningPoints() → compaction-engine.ts
    ├── generateNextCompactionReport() → compaction-engine.ts
    ├── pruneCompleted() → hierarchy-tree.ts
    ├── resetActiveMd() → planning-fs.ts
    ├── createBrainState() → schemas/brain-state.ts (new session)
    └── client.session.create() → SDK (if available)
```

### Inspection Chain

```
inspect-engine.scanState()
    ├── stateManager.load() → persistence.ts
    ├── loadAnchors() → anchors.ts
    ├── loadGraphMems() → graph-io.ts
    ├── loadTree() → hierarchy-tree.ts
    └── Returns: ScanResult

inspect-engine.deepInspect()
    ├── detectChainBreaks() → chain-analysis.ts
    ├── getCursorNode() + getAncestors() → hierarchy-tree.ts
    ├── detectGaps() + computeCurrentGap() → hierarchy-tree.ts
    └── Returns: InspectResult
```

---

## Lineage Impact Matrix

| Component | Plan-Driven Behavior | Quick-Fix Behavior | Exploration Behavior |
|-----------|---------------------|-------------------|---------------------|
| `session-engine` | Full hierarchy enforcement | Relaxed hierarchy checks | Minimal hierarchy |
| `session-governance` | Strict drift warnings | Advisory warnings only | Discovery-focused signals |
| `session-boundary` | Hierarchy completion = trigger | User turns >= 30 = trigger | Extended session detection |
| `gatekeeper` | Requires action declared | Relaxed action requirement | No action required |
| `detection` | Full signal compilation | Reduced severity | Exploration-friendly thresholds |
| `context-escalation` | Level 3-4 halts for MAIN | No halts | Discovery encouragement |
| `compaction-engine` | Preserves hierarchy tree | Archives + resets | Preserves research artifacts |
| `session-split` | Creates continuation session | No auto-split | No auto-split |

### Lineage Scope Differences

| Scope | Trigger Agents | Governance Level |
|-------|----------------|------------------|
| `meta-framework` | hivefiver, hivehealer, hitea | Framework parity rules |
| `project` | hiveminder, hivemaker, hiveplanner | Project-specific governance |
| `unknown` | Unresolved agents | Default to strict |

---

## Entry Point Analysis

### New Session Entry (turn_count = 0)

1. **BrainState creation** via `createBrainState()`
   - Session ID generated
   - Mode set from options (plan_driven/quick_fix/exploration)
   - Hierarchy initialized empty
   - Metrics reset to 0

2. **Hierarchy tree creation** via `createTree()` + `setRoot()`
   - Root node = trajectory level
   - Status = "active"
   - Stamp generated from current time

3. **Governance signals compiled** via `buildGovernanceSignals()`
   - First-run onboarding backbone injected
   - Framework context detected
   - No hierarchy warning (expected at start)

4. **Session memory classified** via `classifySessionIntent()`
   - Intent from trajectory keywords
   - Recommended mode/output_style derived

### Continuity Session Entry (after compaction)

1. **Compaction report loaded** from `next_compaction_report`
2. **Previous trajectory context** restored from archived session
3. **Compaction count carried forward** (max 3)
4. **Cursor restoration** attempted from exported BrainState

### Brownfield Entry (existing project)

1. **Framework conflict detection** via `detectFrameworkContext()`
   - GSD mode: Canonical planning root active
   - Spec-kit mode: .spec-kit active
   - Both mode: Framework selection menu required

2. **Project snapshot collected** via `collectProjectSnapshot()`
   - Top-level directories scanned
   - Artifacts identified (README, AGENTS.md, CLAUDE.md)
   - Stack hints extracted

### Greenfield Entry (new project)

1. **Bootstrap gate** triggered if no config found
2. **Onboarding backbone** injected with project structure
3. **Auto-init command** suggested: `npx -y hivemind-context-governance --mode assisted`

---

## .hivemind Interactions

### Read Operations

| File | Reads From | Purpose |
|------|-----------|---------|
| `session-engine.ts` | `.hivemind/config.json` | Load HiveMindConfig |
| `session-engine.ts` | `.hivemind/state/brain.json` | Load BrainState |
| `session-engine.ts` | `.hivemind/planning/hierarchy.json` | Load tree |
| `session-governance.ts` | `.hivemind/planning/hierarchy.json` | Tree metrics |
| `session-governance.ts` | `.hivemind/planning/active.md` | Session file lines |
| `inspect-engine.ts` | `.hivemind/state/anchors.json` | Anchors |
| `inspect-engine.ts` | `.hivemind/graph/mems.json` | Memory nodes |
| `inspect-engine.ts` | `.hivemind/graph/tasks.json` | Task nodes |
| `session_coherence.ts` | `.hivemind/sessions/archive/*.md` | Archived sessions |
| `cognitive-packer.ts` | `.hivemind/graph/trajectory.json` | Trajectory node |
| `cognitive-packer.ts` | `.hivemind/graph/plans.json` | Plan nodes |
| `cognitive-packer.ts` | `.hivemind/graph/mems.json` | Mem nodes |
| `cognitive-packer.ts` | `.hivemind/graph/tasks.json` | Task nodes |
| `state-snapshot.ts` | `.hivemind/state/runtime-profile.json` | Runtime profile |
| `state-snapshot.ts` | `.hivemind/state/context-recovery.json` | Context recovery |
| `state-snapshot.ts` | `.hivemind/state/health-metrics.json` | Health metrics |

### Write Operations

| File | Writes To | Purpose |
|------|-----------|---------|
| `session-engine.ts` | `.hivemind/state/brain.json` | Save BrainState |
| `session-engine.ts` | `.hivemind/planning/hierarchy.json` | Save tree |
| `session-engine.ts` | `.hivemind/planning/active/{session}.md` | Session file |
| `session-engine.ts` | `.hivemind/planning/index.md` | Update index |
| `session-engine.ts` | `.hivemind/state/anchors.json` | Reset anchors |
| `session-export.ts` | `.hivemind/sessions/session-{id}.json` | Exported state |
| `compaction-engine.ts` | `.hivemind/sessions/archive/{id}.md` | Archived session |
| `session-swarm.ts` | `.hivemind/planning/active/swarms/{id}.json` | Swarm metadata |
| `session-memory-purge.ts` | `.hivemind/graph/session-memory.json` | Purged memory |
| `orphan-quarantine.ts` | `.hivemind/graph/orphans.json` | Quarantined nodes |

---

## Auto-Trigger Mechanisms

### Session Split Triggers

```typescript
// session-split.ts
AUTO_SPLIT_TRIGGER_TOOLS = new Set([
  "map_context",
  "export_cycle", 
  "scan_hierarchy",
  "hivemind_session",
  "hivemind_cycle",
  "hivemind_inspect",
])

// Conditions for auto-split:
// 1. automation_level === "full"
// 2. Trigger tool fired
// 3. No pending_failure_ack
// 4. Is main session (not sub)
// 5. Boundary reached (compaction >= 2 + hierarchy complete)
```

### Detection Signal Triggers

| Signal Type | Threshold | Escalation |
|-------------|-----------|------------|
| `turn_count` | >= 5 turns | INFO → WARN → CRITICAL → DEGRADED |
| `consecutive_failures` | >= 3 failures | INFO |
| `section_repetition` | >= 4 similar updates | WARN |
| `read_write_imbalance` | >= 8 reads, 0 writes | INFO |
| `timestamp_gap` | >= 2 hours stale | WARN |
| `missing_tree` | hierarchy.json absent | CRITICAL |
| `write_without_read` | > 0 blind writes | WARN |

### Compaction Triggers

```typescript
// session-boundary.ts
MAX_COMPACTION_COUNT = 3

// Trigger conditions:
// 1. compactionExhausted (>= 3 compactions)
// 2. compactionCount >= 2 AND hierarchyComplete
// 3. hierarchyComplete AND userTurnCount >= 30
```

### Context Escalation Levels

```typescript
// context-escalation.ts
Level 1 (turnCount = 1):    MILD - verify intent, snapshot
Level 2 (turnCount = 2-3):  URGENT - context decay warning
Level 3 (turnCount = 4):    CRITICAL - halt for reconstruction (MAIN only)
Level 4 (turnCount >= 5):   EMERGENCY - mandatory handoff
```

### Swarm Auto-Spawn

```typescript
// session-swarm.ts
// Triggered by: spawnHeadlessResearcher()
// Creates background sub-agent for:
// - Research tasks
// - Autonomous exploration
// - Evidence gathering
```

---

## Cross-Sector Dependencies

### Inbound Dependencies (files that depend on this sector)

| External File | Depends On | Usage |
|---------------|------------|-------|
| `hooks/session-lifecycle.ts` | `session-governance.ts` | Signal injection |
| `hooks/soft-governance.ts` | `detection.ts` | Tool tracking |
| `hooks/experimental.*.ts` | `session-engine.ts` | Session CRUD |
| `tools/hivemind-session.ts` | `session-engine.ts` | Tool implementation |
| `tools/hivemind-inspect.ts` | `inspect-engine.ts` | Tool implementation |
| `tools/hivemind-cycle.ts` | `compaction-engine.ts` | Tool implementation |
| `tools/hivemind-memory.ts` | `session-memory-classifier.ts` | Memory classification |
| `tools/hivemind-anchor.ts` | `anchors.ts` (indirect) | Anchor management |
| `schemas/brain-state.ts` | `session-role.ts` | Role types |
| `lib/planning-fs.ts` | `session-engine.ts` | Session files |
| `lib/hierarchy-tree.ts` | `session-engine.ts` | Tree operations |

### Outbound Dependencies (this sector depends on)

| Internal File | Depends On | Usage |
|---------------|------------|-------|
| `session-engine.ts` | `persistence.ts` | State management |
| `session-engine.ts` | `hierarchy-tree.ts` | Tree operations |
| `session-engine.ts` | `planning-fs.ts` | File operations |
| `session-governance.ts` | `detection.ts` | Signal compilation |
| `session-governance.ts` | `hierarchy-tree.ts` | Tree metrics |
| `session-governance.ts` | `framework-context.ts` | Framework detection |
| `session-governance.ts` | `context-escalation.ts` | Escalation blocks |
| `compaction-engine.ts` | `graph-io.ts` | Memory persistence |
| `cognitive-packer.ts` | `staleness.ts` | Stale mem filtering |
| `cognitive-packer.ts` | `code-intel/*.ts` | Source injection |
| `inspect-engine.ts` | `anchors.ts` | Anchor loading |
| `inspect-engine.ts` | `chain-analysis.ts` | Chain break detection |

---

## Edge Case Handling

### New Session (turn_count = 0)

| Component | Behavior |
|-----------|----------|
| `session_coherence.ts` | Returns `detectFirstTurn() = true`, loads archived context |
| `session-governance.ts` | Injects onboarding backbone if no hierarchy |
| `gatekeeper.ts` | Critical: "HAS_ACTION_FOCUS" until action declared |
| `detection.ts` | No signals until turn_count >= thresholds |

### Continuity Session (after compaction)

| Component | Behavior |
|-----------|----------|
| `session-engine.ts` | Carries `compaction_count` forward |
| `compaction-engine.ts` | Generates `next_compaction_report` |
| `session_coherence.ts` | Loads from archived session, not current files |
| `session-boundary.ts` | Reset metrics, preserved compaction tracking |

### Brownfield Project

| Component | Behavior |
|-----------|----------|
| `session-governance.ts` | Detects GSD vs spec-kit framework conflict |
| `framework-context.ts` | Builds selection menu for "both" mode |
| `project-snapshot.ts` | Collects existing artifacts |
| `cognitive-packer.ts` | Loads existing trajectory/plans/tasks |

### Greenfield Project

| Component | Behavior |
|-----------|----------|
| `governance-instruction.ts` | Injects `STATE_BOOTSTRAP_STOP_DIRECTIVE` |
| `session-engine.ts` | Returns "not configured" error |
| `session-governance.ts` | No warnings (no state to warn about) |
| `session_coherence.ts` | Returns default context (sessionId = "new") |

### Child Session (isChildSession = true)

| Component | Behavior |
|-----------|----------|
| `session-role.ts` | `isMainSession() = false` |
| `session-split.ts` | Skipped (only splits main sessions) |
| `session-governance.ts` | `shouldSuppressHumanFacingGovernance() = true` |
| `gatekeeper.ts` | Relaxed validation (no FILES_UNCOMMITTED warning) |
| `context-escalation.ts` | Level 3 does NOT halt for SUB agents |

### Compaction Exhausted (compaction_count >= 3)

| Component | Behavior |
|-----------|----------|
| `session-boundary.ts` | Emergency escalation: recommends new session |
| `compaction-engine.ts` | Logs warning about context degradation |
| `session-governance.ts` | Injects compaction limit warning |

---

## Knowledge Gaps

### Unclear After Reading

1. **`session-swarm.ts` SDK Executor Interface**
   - The `SwarmSdkExecutor` interface is defined but actual SDK session creation is delegated to hooks layer
   - Unclear how swarms interact with the main session's hierarchy tree
   - Need to trace actual hook implementation to understand full flow

2. **`runtime-session-lineage.ts` Caching Strategy**
   - In-memory cache `runtimeSessionLineageCache` never expires
   - No cache invalidation on session close
   - Potential stale lineage issues for long-running sessions

3. **`state-mutation-queue.ts` Session Partitioning**
   - Uses `DEFAULT_SESSION_KEY = "__global__"` for backward compatibility
   - Unclear when/how session-specific queues are cleaned up
   - Potential memory leak for sessions that don't call `clearMutationQueue()`

4. **`cognitive-packer.ts` Dual-Read Pattern**
   - Reads from both `graph/mems.json` and `memory/mems.json`
   - Unclear which is authoritative during migration period
   - No explicit migration path documented

5. **`session-memory-purge.ts` Trigger Point**
   - Function `purgeTransientSessionMemory()` defined but no clear call site
   - Assumed to be called on task completion but need to trace tool layer

6. **`session-intent-classifier.ts` vs `session-memory-classifier.ts`**
   - Two separate classification systems with overlapping categories
   - Intent classifier: discovery/research/planning/implementing/debug/testing
   - Memory classifier: discovery_brainstorming/research_synthesis/codebase_investigation/planning/implementing/debug/test_validation
   - Unclear if these should be unified

7. **`detection.ts` Threshold Tuning**
   - Hardcoded `DEFAULT_THRESHOLDS` but no dynamic adjustment
   - No learning from historical session patterns
   - Config override via `config.detection_thresholds` but schema not documented

8. **`gatekeeper.ts` vs `session-governance.ts` Overlap**
   - Both check drift, hierarchy, and session state
   - Unclear division of responsibilities
   - `gatekeeper.ts` seems to be programmatic enforcement while `session-governance.ts` is prompt injection

9. **`context-purifier.ts` Integration Point**
   - `purifyContextFragments()` and `fingerprintContext()` defined
   - No clear call site in scanned files
   - May be called by `compaction-engine.ts` indirectly

10. **`orphan-quarantine.ts` Orphan Record Handling**
    - Records quarantined but no recovery mechanism documented
    - No automatic cleanup of old quarantine records
    - Unclear how to resolve orphans back to valid state

### Recommended Investigation

1. Trace `hooks/session-lifecycle.ts` to understand full injection chain
2. Trace `tools/*.ts` to understand tool-to-library call patterns
3. Investigate `lib/code-intel/*.ts` for cognitive-packer source injection
4. Review `schemas/*.ts` for type dependencies not visible in lib layer
5. Check CLI layer (`src/cli/`) for initialization flow

---

## Summary

The Core Session Management sector contains ~6,800 lines of TypeScript implementing:

1. **Session Lifecycle**: Start → Update → Close → Resume with full hierarchy tracking
2. **Governance Injection**: Signal compilation and escalation based on drift, turns, and patterns
3. **Compaction**: Archive, purification, and turning point extraction for session continuity
4. **Inspection**: Scan, deep inspect, drift reporting, and tree traversal APIs
5. **Context Engineering**: Cognitive packing, purifier, and coherence management

Key architectural patterns:
- **CQRS**: `state-mutation-queue.ts` separates read (hooks) from write (tools)
- **Actor Model**: `session-swarm.ts` for background research tasks
- **Pure Functions**: Most detection/boundary logic is side-effect free
- **Session Partitioning**: State queues partitioned by session ID

The sector is well-designed with clear separation of concerns, though some integration points remain unclear without tracing hook and tool layers.
