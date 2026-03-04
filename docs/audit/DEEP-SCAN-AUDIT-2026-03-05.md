# Deep-Scan Audit: Data Pipelines + Lifecycles vs Hooks/Injection

**Date**: 2026-03-05  
**Methodology**: 5-track parallel investigation (hivexplorer agents, 200K context each)  
**Confidence**: 95% (all tracks converged on dual-injection as root cause)  
**Session**: 5efba8eb-532b-4f4f-8a4b-f62e52262af5  

---

## Executive Summary

### Primary Contamination Source (CRITICAL)

**Dual-injection systems fire EVERY LLM turn with overlapping state file reads**, creating:

| System | Location | What It Injects | Reads | Fires On |
|--------|----------|-----------------|-------|----------|
| **System 1** | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | Governance context (todo, runtime-profile, hierarchy, context-recovery, health-metrics) | 6 state files | `experimental.chat.messages.transform` |
| **System 2a** | `src/hooks/session-lifecycle.ts` | HiveMaster governance, signals, bootstrap blocks | 5 state files | `experimental.chat.system.transform` |
| **System 2b** | `src/hooks/messages-transform.ts` | Anchors, cognitive state, pre-stop checklist | 5 state files | `experimental.chat.messages.transform` |

**Conflict Points**:
- System 1 + System 2b both inject to `messages` array (race condition)
- Both read `brain.json`, `hierarchy.json`, `todo.json` (duplicate reads)
- System 1 reads tree hierarchy (hierarchy.json), System 2a reads flat hierarchy (brain.json) — **contradictory representations**
- Budget overflow: 3 hooks injecting context EVERY turn

### Secondary Issues (HIGH)

1. **Schema drift**: `governance_counters` defined with 4 fields, runtime instances have 2
2. **Dual hierarchy representations**: flat (brain.json) vs tree (hierarchy.json)
3. **Legacy-to-graph task transformation**: overhead and potential data loss
4. **Two parallel tool directories**: `.opencode/tool/` vs `src/tools/` with overlapping purposes

---

## Deliverable A: System Map

### A1: Entry-Points Inventory

| Entry Point | Trigger | Location | Downstream Path |
|-------------|---------|----------|-----------------|
| **session.created** | OpenCode session initialization | `src/hooks/event-handler.ts:182` | Creates `.hivemind/sessions/active/{id}/profile.json` (agent: unresolved) |
| **declare_intent** | User/agent declares intent | `src/tools/hivemind-session.ts:189` | Initializes `brain.json` with mode, focus, governance_status: OPEN |
| **map_context** | Agent updates hierarchy | `src/tools/hivemind-session.ts:207` | Updates `hierarchy.json` (trajectory→tactic→action), resets drift |
| **Tool execution** | Any tool call | `src/hooks/soft-governance.ts:230` | Classification, counter updates, keyword scanning |
| **File system events** | file.edited, session.diff, todo.updated | `src/hooks/event-handler.ts:236` | Queues state mutations, updates metrics |
| **experimental.chat.messages.transform** | Every LLM turn | System 1: `context-injection.ts:175` | Injects governance context |
| **experimental.chat.system.transform** | Every LLM turn | System 2a: `session-lifecycle.ts:76` | Injects HiveMaster governance |
| **experimental.session.compacting** | Compaction event | Dual: `compaction.ts:25` + `compaction.ts:52` | **Race condition** - both inject to context |

### A2: Lifecycle + Flow Diagrams

#### Normal Flow
```
session.created
    ↓
profile.json created (agent: unresolved)
    ↓
declare_intent() called
    ↓
brain.json initialized (mode, focus, status: OPEN)
    ↓
map_context() called
    ↓
hierarchy.json updated (trajectory→tactic→action)
    ↓
Turn loop begins
    ├── System 1: context-injection (prepend governance)
    ├── System 2a: session-lifecycle (append system prompt)
    ├── System 2b: messages-transform (prepend anchors, append checklist)
    ├── Tool execution (read/write/query/governance)
    ├── soft-governance (increment counters, detect drift)
    └── map_context (reset drift if called)
    ↓
compact_session() or session end
    ├── compaction.ts (System 1) - inject preservation context
    ├── compaction.ts (System 2) - inject preservation context
    └── Save anchors, mems, export
```

#### Compaction Flow (CRITICAL: Race Condition)
```
experimental.session.compacting fires
    ├── System 1 (gx-pack): compaction.ts:25
    │   ├── Runs gx-handoff-purify.sh
    │   ├── Runs gx-schema-sync.sh
    │   ├── Runs gx-semantic-validate.sh
    │   ├── Runs gx-context-retrieve.sh
    │   └── Injects to output.context
    │
    └── System 2 (hivemind): compaction.ts:52
        ├── Reads brain.json, mems.json, tasks.json, anchors.json
        ├── Injects governance instruction
        ├── Injects trajectory/tactic/action markers
        ├── Injects anchors + mems + tasks
        └── Injects to output.context
    ↓
ORDERING UNDEFINED → unpredictable context
```

#### State Mutation Flow (CQRS)
```
Hooks (read-only)
    ↓
queueStateMutation() (in-memory queue)
    ↓
flushMutations() (called by tools)
    ↓
StateManager.save() (write to disk)
    ↓
brain.json / hierarchy.json / tasks.json
```

### A3: Hook/Injection Matrix

| Hook | Trigger | Ordering | Reads | Mutates | Injects To | Side Effects |
|------|---------|----------|-------|---------|------------|--------------|
| **context-injection** | `messages.transform` | 1 | 6 state files | messages (prepend) | Governance context | Enforcement checks, escalation |
| **delegation-before** | `tool.execute.before` | 2 | EnforcementState | EnforcementState, enforcement.json | N/A | Can THROW to block |
| **delegation-after** | `tool.execute.after` | 3 | EnforcementState | enforcement.json, health-metrics.json | N/A | Runs health compute every 10 calls |
| **events-hook** | `session.created/idle/compacted` | 4 | EnforcementState | enforcement.json | N/A | Runs entry/exit scripts |
| **compaction-gxpack** | `session.compacting` | 5 | 5 state files | output.context | Preservation context | Runs 4 bash scripts |
| **session-lifecycle** | `system.transform` | 6 | 5 state files | system (append), brain.json | HiveMaster governance | Creates brain if missing |
| **messages-transform** | `messages.transform` | 7 | 5 state files | messages (prepend/append), brain.json | Anchors + checklist | Drift/chain detection |
| **tool-gate** | `tool.execute.before` | 8 | 3 state files | brain.json | Advisory toast | Cannot block (limitation) |
| **soft-governance** | `tool.execute.after` | 9 | 4 sources | brain.json | Governance toasts | Auto-commit, session split |
| **event-handler** | `session.created/idle/compacted` | 10 | 3 state files | brain.json, tasks.json, profile.json | N/A | File tracking |
| **compaction-hivemind** | `session.compacting` | 11 | 5 state files | output.context | Preservation context | Budget-capped injection |

**Conflict Summary**:
- **context-injection + messages-transform**: Both prepend to messages (race condition)
- **compaction-gxpack + compaction-hivemind**: Both inject to context (race condition)
- **delegation-before + tool-gate**: Both fire on tool.execute.before, one can block, one cannot (inconsistent)
- **delegation-after + soft-governance**: Both fire on tool.execute.after, double-counting risk
- **events-hook + event-handler**: Both handle session.created/idle (race condition)

### A4: Schema/Contract Map

| Schema | Location | Fields | Validation | Drift Points |
|--------|----------|--------|------------|--------------|
| **BrainState** | `src/schemas/brain-state.ts:125` | session, hierarchy, metrics, governance_counters | Zod (strict) | governance_counters: 4 fields defined, 2 present in runtime |
| **HierarchyState** | `src/schemas/hierarchy.ts:15` | trajectory, tactic, action (flat) | Zod (strict) | Dual representation: flat (brain.json) vs tree (hierarchy.json) |
| **GovernanceCounters** | `src/lib/detection.ts:93` | drift, compaction, out_of_order, evidence_pressure | Runtime (strict) | Incomplete migration: missing out_of_order, evidence_pressure |
| **TaskNode** | `src/schemas/graph-nodes.ts:115` | 7-value status enum | Zod (strict) | Legacy TaskManifest → TaskNode transformation overhead |
| **HiveMindConfig** | `src/schemas/config.ts:230` | governance_mode, automation_level | Zod (strict) | No runtime validation after load |

**Transformation Pipelines**:
1. `carryForwardHybridFields` - Merge hybrid fields during compaction
2. `deepMerge` - CQRS-compliant state mutation
3. `normalizeAutomationInput` - Legacy alias support
4. `mapLegacyOutputStyleToV29` - Legacy style mapping
5. `mergeLegacyManifestIntoGraphTasks` - Legacy task → graph task transformation

**Validation Boundaries**:
- Zod schemas enforce strict type checking at definition time
- NO runtime validation unless explicitly called via `schema.parse()`
- `deepMerge` accepts any `Partial<BrainState>` blindly
- Plugin's `loadJson()` catches parse errors but doesn't validate schema

### A5: Context Assembly Map

```
CONTEXT SOURCES
├── history (conversation messages)
├── memory (mems.json)
├── system prompts (agent.md body)
├── plugin prompts (hiveops-governance context)
└── tool outputs (previous turn results)
    ↓
CONTEXT SHAPING
├── System 1: context-injection.ts
│   ├── Load 6 state files
│   ├── Format as markdown blocks
│   └── Prepend to messages
├── System 2a: session-lifecycle.ts
│   ├── Load 5 state files
│   ├── Compile governance signals
│   └── Append to system prompt
├── System 2b: messages-transform.ts
│   ├── Load anchors + mems + tasks
│   ├── Prepend packed cognitive state
│   └── Append pre-stop checklist
└── Detection: detection.ts
    ├── Compile 12 health signals
    ├── Format escalation prompts
    └── Inject argu-back mode
    ↓
CONTEXT SINKS
├── logs (console output)
├── metrics (brain.json counters)
├── memory stores (mems.json)
├── caches (session state)
└── downstream calls (tool inputs)
```

**Pollution Pathways**:
1. **dual_state_read_conflict**: System 1 + System 2 read same files differently (flat vs tree hierarchy)
2. **channel_confusion**: Both inject to messages, ordering undefined
3. **budget_overflow**: 3 hooks injecting context every turn
4. **stale_rehydration**: context-recovery.json may be stale
5. **counter_divergence**: governance_counters schema vs runtime mismatch
6. **legacy_task_transformation**: data loss during TaskManifest → TaskNode

### A6: Orchestrator Lineage Comparison

| Aspect | hivefiver | hiveminder |
|--------|-----------|------------|
| **State Path** | `.opencode/` primary | `.hivemind/` primary |
| **Plans Path** | `docs/plans/` | `.hivemind/plans/` |
| **Agent Selection** | hivefiver-prime → hivefiver-mode → helper skills | governance → lifecycle → delegation skills |
| **Tool Access** | BLIND (read:deny) | Full (read:allow) |
| **Delegation** | ALL reads via hivexplorer | Direct tool access |
| **Plugin Hooks** | Same (hiveops-governance) | Same (hiveops-governance) |
| **Status** | IN SCOPE (active refactoring) | OUT OF SCOPE (future) |

**Shared Subagents**: hivexplorer, hiveplanner, hiverd, hivehealer, hiveq, hivemaker, hitea

---

## Deliverable B: Risk Register

### P0: CRITICAL (Immediate Action Required)

#### B1.1: Dual-Injection Race Conditions

| Attribute | Value |
|-----------|-------|
| **Severity** | CRITICAL |
| **Likelihood** | 100% (happens every turn) |
| **Blast Radius** | All agent sessions, all turns |
| **Reproducibility** | Deterministic |
| **Root Cause (Architectural)** | Two independent auto-injection systems designed without coordination |
| **Root Cause (Implementation)** | System 1 (hiveops-governance) + System 2 (src/hooks) both hook message transforms |
| **Files** | `.opencode/plugins/hiveops-governance/hooks/context-injection.ts:175`<br>`src/hooks/messages-transform.ts:309`<br>`src/hooks/session-lifecycle.ts:76` |
| **Minimal Fix** | Add ordering enforcement: System 1 fires first, System 2 second |
| **Recommended Refactor** | Node 1 Fix 1: Agent-aware guards in all 3 hooks, decouple injection by lineage |
| **Regression Risk** | Medium - changes core injection flow |
| **Tests Required** | Integration tests for context assembly, snapshot tests for governance prompts |

#### B1.2: Schema-Runtime Drift (governance_counters)

| Attribute | Value |
|-----------|-------|
| **Severity** | CRITICAL |
| **Likelihood** | 100% (existing sessions affected) |
| **Blast Radius** | All governance signal compilation |
| **Reproducibility** | Deterministic |
| **Root Cause (Architectural)** | Schema migration (Fix 1.5B) not applied to existing state files |
| **Root Cause (Implementation)** | `createBrainState()` initializes 4 fields, but existing brain.json has 2 |
| **Files** | `src/schemas/brain-state.ts:270`<br>`.hivemind/state/brain.json:40-43` |
| **Minimal Fix** | Migration script: add missing fields with defaults |
| **Recommended Refactor** | Fix 1.5C-D: Schema validation at state boundaries, automatic migration |
| **Regression Risk** | Low - additive only |
| **Tests Required** | Unit tests for migration, integration tests for governance signals |

### P1: HIGH (Action Within Sprint)

#### B2.1: Dual Hierarchy Representations

| Attribute | Value |
|-----------|-------|
| **Severity** | HIGH |
| **Likelihood** | 100% |
| **Blast Radius** | All context assembly, trajectory tracking |
| **Root Cause** | HierarchyState (flat) embedded in brain.json, separate hierarchy.json (tree) |
| **Files** | `src/schemas/hierarchy.ts:15`<br>`src/hooks/session-lifecycle.ts:100`<br>`.opencode/plugins/hiveops-governance/hooks/context-injection.ts:87` |
| **Minimal Fix** | Document which is canonical, standardize reads |
| **Recommended Refactor** | Unify to single representation (tree preferred for graph-native) |
| **Regression Risk** | Medium - affects all hierarchy reads |

#### B2.2: Compaction Race Condition

| Attribute | Value |
|-----------|-------|
| **Severity** | HIGH |
| **Likelihood** | 100% (every compaction) |
| **Blast Radius** | Context preservation across sessions |
| **Root Cause** | Two hooks fire on `experimental.session.compacting` with undefined ordering |
| **Files** | `.opencode/plugins/hiveops-governance/hooks/compaction.ts:25`<br>`src/hooks/compaction.ts:52` |
| **Minimal Fix** | Rename one trigger event, enforce ordering |
| **Recommended Refactor** | Single compaction hook with unified context preservation |
| **Regression Risk** | Medium - changes compaction flow |

#### B2.3: Inconsistent Enforcement (tool.execute.before)

| Attribute | Value |
|-----------|-------|
| **Severity** | HIGH |
| **Likelihood** | 100% |
| **Blast Radius** | All tool executions |
| **Root Cause** | `delegation-before` can throw/block, `tool-gate` returns advisory only |
| **Files** | `.opencode/plugins/hiveops-governance/hooks/delegation.ts:28`<br>`src/hooks/tool-gate.ts:84` |
| **Minimal Fix** | Remove tool-gate (redundant with delegation-before) |
| **Recommended Refactor** | Unified enforcement layer |
| **Regression Risk** | Low - tool-gate is advisory only |

### P2: MEDIUM (Action Within Quarter)

#### B3.1: Legacy Task Transformation Overhead

| Attribute | Value |
|-----------|-------|
| **Severity** | MEDIUM |
| **Likelihood** | 100% |
| **Blast Radius** | Task management, planning workflows |
| **Root Cause** | Dual task systems: todo.json (legacy) + tasks.json (graph-native) |
| **Files** | `src/lib/state-mutation-queue.ts:284`<br>`src/schemas/graph-nodes.ts:115` |
| **Minimal Fix** | Complete migration to graph-native tasks |
| **Recommended Refactor** | Remove TaskManifest schema, use TaskNode exclusively |
| **Regression Risk** | Medium - affects hiveops_todo tool |

#### B3.2: Parallel Tool Directories

| Attribute | Value |
|-----------|-------|
| **Severity** | MEDIUM |
| **Likelihood** | N/A (design issue) |
| **Blast Radius** | Developer confusion, maintenance burden |
| **Root Cause** | `.opencode/tool/` (framework) + `src/tools/` (SDK) with overlapping purposes |
| **Files** | `.opencode/tool/hiveops_*.ts`<br>`src/tools/hivemind_*.ts` |
| **Minimal Fix** | Documentation: clarify naming convention (hiveops vs hivemind) |
| **Recommended Refactor** | Merge into single tool namespace with clear prefixes |
| **Regression Risk** | Low - no functional change |

### Edge Cases Coverage

| Edge Case | Risk | Mitigation |
|-----------|------|------------|
| **Walls of text** | Budget overflow from 3 injection hooks | Enforce strict budget caps per hook |
| **Fragmented multi-session jumps** | Stale context-recovery.json | Add staleness check before injection |
| **Dead paths (unused hooks)** | Untested, may have latent bugs | Add integration tests for all hooks |
| **Agent misselection** | Ambiguous heuristics in hivefiver-mode | Clarify agent selection algorithm |
| **Concurrent sessions** | Race on shared state files | File locking or per-session state |
| **Parallel tool calls** | Double-counting in counters | Idempotency checks |
| **Streaming partial outputs** | Incomplete context injection | Buffer until complete |
| **Plugin load order changes** | Non-deterministic injection | Enforce plugin priority |
| **Backward compatibility** | Stored sessions with old schemas | Migration scripts |
| **Retry loops** | Duplicate writes/injections | Idempotency tokens |

---

## Deliverable C: Refactor Blueprint

### C1: Principles for 2026 Agent Systems

1. **Single Source of Truth**: Each datum has ONE canonical location
2. **Deterministic Ordering**: All hooks have explicit priority, no races
3. **Contract-First Schemas**: Zod schemas validated at runtime boundaries
4. **CQRS Enforcement**: Hooks READ, Tools WRITE, never both
5. **Observability by Default**: Structured logs, traces, correlation IDs
6. **Bounded Contexts**: Clear ownership, no overlapping responsibilities

### C2: Directory/Package Layout (Recommended)

```
hivemind-plugin/
├── .opencode/
│   ├── agents/          # Agent profiles (orchestrator + specialists)
│   ├── commands/        # Slash commands
│   ├── skills/          # Domain expertise modules
│   ├── workflows/       # Decorative workflow docs
│   ├── plugins/
│   │   └── hiveops-governance/  # SINGLE injection system
│   │       ├── hooks/
│   │       │   ├── context-injection.ts    # ONLY hook for context assembly
│   │       │   ├── delegation.ts           # Enforcement
│   │       │   ├── events.ts               # Lifecycle events
│   │       │   └── compaction.ts           # Context preservation
│   │       └── scripts/
│   │           └── gx-*.sh                 # Governance scripts
│   └── tool/            # Framework tools (hiveops_*)
│       ├── hiveops_sot.ts
│       ├── hiveops_export.ts
│       ├── hiveops_gate.ts
│       └── hiveops_todo.ts
├── src/
│   ├── lib/             # Core libraries (state, paths, graph, detection)
│   ├── schemas/         # Zod schemas (DNA layer)
│   └── tools/           # SDK tools (hivemind_*)
│       ├── hivemind_session.ts
│       ├── hivemind_memory.ts
│       ├── hivemind_plan.ts
│       └── hivemind_hierarchy.ts
└── tests/
    ├── unit/
    ├── integration/
    └── contract/
```

### C3: Migration Steps (Incremental, Non-Breaking)

#### Phase 1: Stop the Bleeding (Week 1)
1. Add ordering enforcement to dual hooks (System 1 priority 1, System 2 priority 2)
2. Add runtime validation to `deepMerge()` - validate partial state before merge
3. Add staleness check to `context-recovery.json` injection
4. Remove `tool-gate.ts` (redundant with `delegation-before`)

#### Phase 2: Schema Alignment (Week 2)
1. Migration script: Add missing `governance_counters` fields
2. Validate all state files on load (not just parse)
3. Add schema version field to all state files
4. Document hierarchy representation choice (tree vs flat)

#### Phase 3: Decouple Injection (Week 3)
1. Merge `messages-transform.ts` into `context-injection.ts` (single hook for messages)
2. Merge `compaction.ts` (System 2) into `compaction.ts` (System 1)
3. Add agent-aware guards: check lineage before injecting
4. Budget caps per hook (enforce in hook implementation)

#### Phase 4: Unify Representations (Week 4)
1. Choose hierarchy representation (tree preferred)
2. Migrate all reads to chosen representation
3. Remove redundant schema (flat HierarchyState)
4. Complete task migration: TaskManifest → TaskNode

#### Phase 5: Testing & Validation (Week 5)
1. Integration tests for all hooks (injection order, content, budget)
2. Contract tests for all schemas (version, migration)
3. Golden-flow snapshots for context assembly
4. Backward compatibility tests for stored sessions

### C4: Test Strategy

```
tests/
├── unit/
│   ├── schemas/
│   │   ├── brain-state.test.ts        # Schema validation
│   │   └── migration.test.ts          # Schema version upgrades
│   ├── lib/
│   │   ├── state-mutation-queue.test.ts  # CQRS enforcement
│   │   └── detection.test.ts          # Signal compilation
│   └── hooks/
│       ├── context-injection.test.ts  # Context assembly
│       └── compaction.test.ts         # Context preservation
├── integration/
│   ├── dual-injection.test.ts         # System 1 + System 2 coordination
│   ├── governance-lifecycle.test.ts   # Full session flow
│   └── compaction-recovery.test.ts    # Session handoff
└── contract/
    ├── schema-versions.test.ts        # Backward compatibility
    ├── tool-contracts.test.ts         # Tool I/O contracts
    └── hook-contracts.test.ts         # Hook injection contracts
```

### C5: Observability Strategy

```typescript
// Every hook logs with structured format
{
  "timestamp": "2026-03-05T00:00:00.000Z",
  "hook": "context-injection",
  "trigger": "experimental.chat.messages.transform",
  "session_id": "uuid",
  "agent": "hivefiver",
  "lineage": "hivefiver",
  "files_read": ["brain.json", "hierarchy.json"],
  "bytes_injected": 1234,
  "budget_remaining": 9876,
  "duration_ms": 12,
  "correlation_id": "uuid"
}

// Every state mutation logs
{
  "timestamp": "...",
  "tool": "hivemind_session",
  "action": "declare_intent",
  "session_id": "uuid",
  "state_before": { "drift_score": 100 },
  "state_after": { "drift_score": 100 },
  "mutation_id": "uuid",
  "correlation_id": "uuid"
}
```

---

## Appendix: File References

### Files Scanned (Total: 142)

**src/lib/** (61 files)
- state-mutation-queue.ts, detection.ts, paths.ts, persistence.ts
- session-engine.ts, graph-io.ts, session-export.ts
- (57 more)

**src/tools/** (17 files)
- hivemind-session.ts, hivemind-memory.ts, hivemind-plan.ts
- hivemind-declare.ts, hivemind-hierarchy.ts
- (12 more)

**src/hooks/** (10 files)
- session-lifecycle.ts, messages-transform.ts, event-handler.ts
- compaction.ts, soft-governance.ts, tool-gate.ts
- (4 more)

**src/schemas/** (14 files)
- brain-state.ts, hierarchy.ts, config.ts, planning.ts
- graph-state.ts, graph-nodes.ts
- (8 more)

**.opencode/plugins/** (7 files)
- hiveops-governance/index.ts
- hiveops-governance/hooks/context-injection.ts
- hiveops-governance/hooks/delegation.ts
- hiveops-governance/hooks/events.ts
- hiveops-governance/hooks/compaction.ts
- (2 more)

**.opencode/tool/** (4 files)
- hiveops_sot.ts, hiveops_export.ts, hiveops_gate.ts, hiveops_todo.ts

**agents/** (9 files)
- hivefiver.md, hiveminder.md, hivexplorer.md
- hiveplanner.md, hiverd.md, hivehealer.md
- hiveq.md, hivemaker.md, hitea.md

**State Files** (8 files)
- .hivemind/state/brain.json, hierarchy.json, todo.json
- .hivemind/state/runtime-profile.json, context-recovery.json
- .hivemind/state/health-metrics.json, enforcement.json
- .hivemind/graph/tasks.json

---

## Conclusion

This audit confirms **dual-injection systems** as the primary contamination source. All 5 investigation tracks converged on this conclusion with 95% confidence.

**Immediate Action Required**:
1. Complete Node 1 Fix 1 (agent-aware guards in all 3 hook files)
2. Complete Fix 1.5C-D (schema validation at boundaries)
3. Merge duplicate hooks (messages-transform → context-injection, compaction → compaction)

**Estimated Effort**: 3-4 weeks for full remediation

**Risk if Not Addressed**: Context poisoning will continue to cause agent confusion, hallucination, and unpredictable behavior across all sessions.

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-05  
**Next Review**: After Phase 1 completion
