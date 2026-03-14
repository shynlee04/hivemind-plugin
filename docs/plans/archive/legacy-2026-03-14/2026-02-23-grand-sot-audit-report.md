# HiveMind Framework — Grand SOT Audit Report

> **Date:** 2026-02-23
> **Session:** 4a625473-9caa-4f4e-a2b0-de1bd7704283
> **Branch:** dev-v3
> **Methodology:** 4 parallel scanner agents (Architecture, Schema, Orchestration, Runtime) + cross-domain synthesis + user journey simulation
> **Purpose:** Source of Truth for consolidation plan (Option 1: Contract-First Consolidation)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Map](#2-system-architecture-map)
3. [Critical Findings — Cross-Domain](#3-critical-findings--cross-domain)
4. [Domain A: Architecture Layer](#4-domain-a-architecture-layer)
5. [Domain B: Schema & Data Model](#5-domain-b-schema--data-model)
6. [Domain C: Orchestration & Integration](#6-domain-c-orchestration--integration)
7. [Domain D: Runtime State & Pipeline](#7-domain-d-runtime-state--pipeline)
8. [Cross-Domain Integration Analysis](#8-cross-domain-integration-analysis)
9. [User Journey Simulations](#9-user-journey-simulations)
10. [Consolidated Issue Registry](#10-consolidated-issue-registry)
11. [Consolidation Recommendations](#11-consolidation-recommendations)
12. [Appendix: File Registry](#appendix-file-registry)

---

## 1. Executive Summary

### Verdict: STRUCTURALLY SOUND, OPERATIONALLY FRAGMENTED

The HiveMind framework has **correct architectural intent** — CQRS boundaries work, tool-hook separation is enforced, and FK validation in the graph layer is comprehensive. However, the system suffers from **three systemic fragmentation patterns** that compound into operational complexity:

| Pattern | Impact | Severity |
|---------|--------|----------|
| **Dual State Systems** | 3 pairs of competing state stores with no sync | CRITICAL |
| **Missing Runtime Validation** | 4 core schemas lack Zod, allowing silent corruption | CRITICAL |
| **Surface Area Explosion** | 30 commands, 17 skills, 7 workflows with significant overlap | HIGH |

### Health Scorecard

| Domain | Score | Status |
|--------|-------|--------|
| Architecture Boundaries (CQRS) | 7/10 | 4 lib→hook import violations |
| Schema Type Safety | 5/10 | 4 core schemas lack Zod validation |
| Integration Coherence | 6/10 | Command/skill overlap, dual agent definitions |
| Runtime Data Integrity | 4/10 | Dual state systems, inconsistent locking, orphan bloat |
| Test Coverage | 8/10 | 500+ tests, all passing, but no concurrency tests |
| Overall | **6/10** | Functional but fragile under stress |

### Previously Fixed (Cycles 1-7)

| Issue | Fix | Commit |
|-------|-----|--------|
| Persistence any-cast | Reflect.deleteProperty | 92c048e |
| Planning-fs any-cast | Partial<SessionManifestEntry> | b9b2e60 |
| Session-ID parity drift | normalizeSessionIdToUuid() + resolveCanonicalSessionId() | 4d05bd2 |
| Stale task reconciliation | invalidateOrphanedActiveTasks() + reconcileStaleTasks() | e281233 |
| Session-token continuity | Todo session_id canonicalization | 4e288a5 |

---

## 2. System Architecture Map

### Layer Ownership Model

```
┌─────────────────────────────────────────────────────────┐
│  ENTRY POINT: src/index.ts                              │
│  Plugin bootstrap → SDK init → tool/hook registration   │
└─────────────┬───────────────────────────┬───────────────┘
              │                           │
    ┌─────────▼─────────┐     ┌──────────▼──────────┐
    │  src/tools/ (6)    │     │  src/hooks/ (13)     │
    │  WRITE-ONLY        │     │  READ/INJECT         │
    │  Mutation           │     │  + queueStateMutation│
    │  Orchestrators      │     │  Adapters            │
    └─────────┬──────────┘     └──────────┬───────────┘
              │                           │
              │    ┌──────────────────┐   │
              └────► src/lib/ (42)    ◄───┘
                   │  PURE ENGINE     │
                   │  Business Logic  │
                   └────────┬─────────┘
                            │
                   ┌────────▼─────────┐
                   │ src/schemas/ (8)  │
                   │ CONTRACTS (Zod)   │
                   └──────────────────┘
```

### Persistence Topology

```
.hivemind/
├── state/                    ← Cognitive runtime state
│   ├── brain.json           [LOCKED] Core session state
│   ├── hierarchy.json       [UNLOCKED] 3-level cognitive tree
│   ├── tasks.json           [UNLOCKED] HiveFiver task ledger ◄── DUAL #1
│   └── anchors.json         [UNLOCKED] Immutable decisions
├── graph/                    ← Enterprise lineage state
│   ├── trajectory.json      [UNLOCKED] Root lineage node ◄── DUAL #3
│   ├── tasks.json           [LOCKED] FK-linked tasks ◄── DUAL #1
│   ├── mems.json            [LOCKED] FK-linked memories ◄── DUAL #2
│   ├── orphans.json         [UNLOCKED] Quarantine (BLOATED)
│   ├── phases.json          [ORPHANED] Not referenced in code
│   └── task-id-lineage-map.json  Migration map
├── memory/
│   └── mems.json            [UNLOCKED] Legacy memories ◄── DUAL #2
├── sessions/
│   ├── manifest.json        Session registry
│   ├── active.md            Current session notes
│   └── archive/             Exported sessions
├── codemap/
│   └── manifest.json        [EMPTY PLACEHOLDER]
├── codewiki/
│   └── manifest.json        [EMPTY PLACEHOLDER]
└── manifest.json            Root manifest chain
```

### Dual State Pairs (The Core Problem)

| Pair | Location A | Location B | Sync Mechanism | Risk |
|------|-----------|-----------|----------------|------|
| **#1 Tasks** | `state/tasks.json` (HiveFiver fields: hivefiver_action, next_step_menu, canonical_command) | `graph/tasks.json` (FK-linked: parent_phase_id, plan_id) | **NONE** | CRITICAL |
| **#2 Memories** | `memory/mems.json` (legacy Mem format) | `graph/mems.json` (MemNode with FK: session_id, origin_task_id) | Fallback in cognitive-packer (tries graph first) | HIGH |
| **#3 Trajectory** | `state/hierarchy.json` (3-level: trajectory/tactic/action strings) | `graph/trajectory.json` (TrajectoryNode with FK: session_id, active_plan_id) | **NONE** — independent writes | HIGH |

---

## 3. Critical Findings — Cross-Domain

### CF-01: DUAL STATE SYSTEMS WITHOUT SYNC [CRITICAL]

**What:** Three pairs of state files store overlapping data with no synchronization mechanism. `state/tasks.json` and `graph/tasks.json` both track tasks but with different schemas, different fields, and different write paths.

**Where:** `src/lib/manifest.ts` (state/tasks), `src/lib/graph-io.ts` (graph/tasks), `src/lib/hierarchy-tree.ts` (state/hierarchy), `src/lib/graph-io.ts` (graph/trajectory)

**Impact:** State divergence is inevitable. During the audit, `brain.json` session.id was `4a625473` while `trajectory.json` session_id was `b564faed` — evidence of live divergence.

**Cross-Domain Touch Points:**
- Architecture: Both tools and hooks write to different state stores
- Schema: TaskItem (no Zod) vs TaskNodeSchema (strict Zod) — incompatible validation
- Runtime: No reconciliation runs between the two task systems
- Integration: HiveFiver commands use state/tasks, graph tools use graph/tasks

---

### CF-02: MISSING RUNTIME VALIDATION FOR CORE STATE [CRITICAL]

**What:** BrainState (14 fields, 5 nested interfaces), HierarchyState, HiveMindConfig, and TaskItem use TypeScript interfaces only — no Zod schemas. All are deserialized via `JSON.parse() as T` without validation.

**Where:**
- `src/schemas/brain-state.ts` — interfaces only
- `src/schemas/hierarchy.ts` — types only
- `src/schemas/config.ts` — interfaces only
- `src/schemas/manifest.ts` — interfaces only
- `src/lib/persistence.ts:159` — `JSON.parse(data) as BrainState` (unsafe)

**Impact:** Schema evolution (adding/removing fields) will silently corrupt state. No migration path exists for these artifacts. A single malformed field in brain.json crashes the entire plugin.

**Cross-Domain Touch Points:**
- Schema: Inconsistency — graph schemas are strict Zod, cognitive schemas are loose TS
- Runtime: Every session start/resume reads brain.json without validation
- Architecture: persistence.ts violates "schema = contract" principle

---

### CF-03: IMPORT DIRECTION VIOLATIONS [HIGH]

**What:** 4 lib files import from hooks, inverting the dependency direction.

| lib file | imports from hooks/ | Why |
|----------|-------------------|-----|
| `session-governance.ts` | `session-lifecycle-helpers.ts` | Needs collectProjectSnapshot() |
| `session_coherence.ts` | `session_coherence/types.ts` | Needs type definitions |
| `compaction-engine.ts` | `sdk-context.ts` | Needs getClient() for SDK operations |
| `auto-commit.ts` | `sdk-context.ts` | Needs getShell() for git operations |

**Root Cause:** SDK client/shell access is trapped in `hooks/sdk-context.ts`. Lib needs SDK access but the current layer model forbids lib→hooks imports.

**Fix:** Create `src/sdk/` layer for SDK access primitives. Extract types to `src/schemas/`.

---

### CF-04: LOC EXPLOSION IN CORE FILES [HIGH]

**What:** 9 files exceed the 300 LOC strategic limit. The worst offender is `graph-io.ts` at 1350 LOC (4.5x limit).

| File | LOC | Multiplier | Functions |
|------|-----|-----------|-----------|
| `lib/graph-io.ts` | 1350 | 4.5x | 30+ functions including FK validation, CRUD, reconciliation, Ralph bridge |
| `lib/detection.ts` | 882 | 2.9x | Drift detection, governance signals |
| `lib/session-engine.ts` | 635 | 2.1x | Session start/resume/update/close |
| `lib/session_coherence.ts` | 605 | 2.0x | First-turn context retrieval |
| `hooks/soft-governance.ts` | 571 | 1.9x | Counter/detection engine |
| `hooks/messages-transform.ts` | 543 | 1.8x | First-turn context + checklist injection |
| `lib/compaction-engine.ts` | 447 | 1.5x | Compaction execution |
| `hooks/tool-gate.ts` | 409 | 1.4x | Pre-tool governance |
| `hooks/event-handler.ts` | 400 | 1.3x | Event processing |

---

### CF-05: INCONSISTENT CONCURRENCY PROTECTION [HIGH]

**What:** Only 3 of 10+ state files have file locking. Two different locking mechanisms coexist.

| File | Lock Type | Protected? |
|------|----------|-----------|
| `state/brain.json` | Custom FileLock (persistence.ts:52-124) | YES |
| `graph/tasks.json` | proper-lockfile (file-lock.ts) | YES |
| `graph/mems.json` | proper-lockfile (file-lock.ts) | YES |
| `state/hierarchy.json` | NONE | NO |
| `state/tasks.json` | NONE | NO |
| `state/anchors.json` | NONE | NO |
| `memory/mems.json` | NONE | NO |
| `graph/trajectory.json` | NONE | NO |
| `graph/orphans.json` | NONE | NO |
| `sessions/manifest.json` | NONE | NO |

**Impact:** Multiple agents writing hierarchy.json or state/tasks.json simultaneously will corrupt data. This is a real scenario during parallel subagent execution.

---

### CF-06: FK VALIDATION ON READ ONLY [MEDIUM]

**What:** `graph-io.ts` validates FK chains (parent_phase_id, plan_id, session_id) during `loadGraphTasks()` and `loadGraphMems()` — but NOT during `addGraphTask()` or `addGraphMem()`. Only Zod schema validation runs on write.

**Impact:** Invalid FK references can be written to disk and will only be caught on next read — potentially quarantining legitimate data as orphans.

---

### CF-07: COMMAND/SKILL/WORKFLOW SURFACE EXPLOSION [MEDIUM]

**What:** 30 commands, 17 skills, 7 workflows with significant overlap.

**Command Aliases (exact duplication):**
- `hivefiver-init` ↔ `hivefiver-start` (same functionality)
- `hivefiver-spec` ↔ `hivefiver-specforge` (alias)
- `hivefiver-audit` ↔ `hivefiver-doctor` (near-identical)
- `hivefiver-build` → delegates to `hivefiver-gsd-bridge`
- `hivefiver-validate` → delegates to `hivefiver-ralph-bridge`

**Skill Overlap:**
- `delegation-intelligence` ↔ `sequential-orchestration` ↔ `context-first-gatekeeping`: All three cover parallel vs sequential delegation and gatekeeping rules

**Workflow Overlap:**
- `hivefiver-enterprise` ↔ `hivefiver-enterprise-architect`: Both serve enterprise persona with different step sequences

---

### CF-08: HIERARCHY MODEL MISMATCH [MEDIUM]

**What:** Two incompatible hierarchy models coexist without formal mapping.

| Aspect | 3-Level Cognitive | 6-Level Enterprise |
|--------|------------------|-------------------|
| Levels | trajectory → tactic → action | project → milestone → phase → plan → task → verification |
| Schema Type | TypeScript interfaces (no Zod) | Zod schemas (strict) |
| Persistence | `.hivemind/state/hierarchy.json` | `.hivemind/graph/trajectory.json` |
| FK Chains | None | Full UUID-enforced chain |
| Runtime Users | BrainState, map_context tool | graph-io.ts, cognitive-packer |

**Mapping Gap:** `tactic` and `action` have no enterprise equivalent. `project`, `milestone`, `verification` have no cognitive equivalent. Only `trajectory` loosely maps to `TrajectoryNode`.

---

### CF-09: MANIFEST CHAIN INCOMPLETE [MEDIUM]

**What:** The declared governance chain `codemap → codewiki → plans → sessions → tasks → sub_tasks` is only partially materialized.

| Link | Status |
|------|--------|
| codemap | EMPTY PLACEHOLDER — `.hivemind/codemap/manifest.json` exists but no materializer |
| codewiki | EMPTY PLACEHOLDER — `.hivemind/codewiki/manifest.json` exists but no materializer |
| plans | Materialized (minimal) |
| sessions | Materialized (working) |
| tasks | Materialized (dual: state + graph) |
| sub_tasks | NOT IMPLEMENTED |

---

### CF-10: ORPHAN QUARANTINE BLOAT [LOW]

**What:** `.hivemind/graph/orphans.json` has 60+ entries including duplicates of the same IDs (e.g., same UUID quarantined 6+ times). Race condition between `loadOrphansFile()` read and `quarantineOrphan()` write allows duplicate creation.

---

## 4. Domain A: Architecture Layer

### Boundary Compliance Matrix

| Layer | Rule | Compliant? | Violations |
|-------|------|-----------|------------|
| `src/tools/` | Write-only mutation orchestrators | YES | 0 violations |
| `src/hooks/` | Read/inject + queueStateMutation only | YES | 0 CQRS violations (uses queue correctly) |
| `src/lib/` | Pure deterministic, import schemas only | **NO** | 4 files import from hooks/ |
| `src/schemas/` | Contracts only | YES | 0 violations |

### Positive Findings

1. **CQRS mutation queue works correctly** — All hooks use `queueStateMutation()` instead of direct state writes
2. **All 6 tools are boundary-compliant** — Properly delegate to lib layer
3. **Plugin bootstrap is well-structured** — Clear init order in src/index.ts
4. **Event bus architecture is clean** — `event-bus.ts` + `watcher.ts` with proper debouncing

### Code Smell Inventory

| Smell | Count | Files |
|-------|-------|-------|
| Silent error swallowing (empty catch) | 5 | graph-io.ts, session-engine.ts, compaction-engine.ts, session_coherence.ts |
| Dynamic require() | 1 | swarm-executor.ts |
| Complex type assertions | 2 | event-handler.ts, session_coherence.ts |
| Magic constants | 1 | graph-io.ts (UUID namespace) |

---

## 5. Domain B: Schema & Data Model

### Validation Coverage

| Schema Category | Total | Zod Validated | TypeScript Only | Gap |
|----------------|-------|--------------|----------------|-----|
| Graph Node Schemas | 6 | 6 (100%) | 0 | NONE |
| Graph State Wrappers | 4 | 4 (100%) | 0 | NONE |
| Event Schemas | 2 | 2 (100%) | 0 | NONE |
| Cognitive/Brain Schemas | 6 | 0 (0%) | 6 | **CRITICAL** |
| Config Schemas | 5 | 0 (0%) | 5 | **HIGH** |
| Manifest Schemas | 2 | 0 (0%) | 2 | **MEDIUM** |
| **Total** | **25** | **12 (48%)** | **13 (52%)** | |

### FK Chain Map (Graph Layer)

```
TrajectoryNode (root, session_id=UUID)
├── active_plan_id → PlanNode.id
├── active_phase_id → PhaseNode.id
├── active_task_ids[] → TaskNode.id[]
│
├── PlanNode (trajectory_id → Trajectory)
│   ├── phases[] → PhaseNode[]
│   │   └── PhaseNode (plan_id → PlanNode)
│   │       └── TaskNode (parent_phase_id → PhaseNode, plan_id → PlanNode)
│   │           └── MemNode (origin_task_id → TaskNode, nullable)
│   │
│   └── project_id, milestone_id (optional FK, no target schema)
│
└── MemNode (session_id → TrajectoryNode.session_id)
    └── verification_id (optional, no target schema)
```

**FK Gaps:**
- `project_id`, `milestone_id` on PlanNode/TaskNode — reference entities with no defined schema
- `verification_id` on MemNode — no VerificationNode schema exists
- `RalphUserStory.graph_task_id` — optional, not enforced

---

## 6. Domain C: Orchestration & Integration

### Asset Inventory Summary

| Asset Type | Count | Location | Issues |
|-----------|-------|----------|--------|
| Tools | 6 | `src/tools/` | Clean |
| Hooks | 13 | `src/hooks/` | Clean (CQRS compliant) |
| Commands | 30 | `commands/` | 5 alias pairs, overlap |
| Workflows | 7 | `workflows/` | 1 overlap pair |
| Skills | 17 | `.opencode/skills/` | 3-way delegation overlap |
| Agents | 7 | `.opencode/agents/` + `opencode.json` | Dual definition risk |
| MCP Providers | 5 | `opencode.json` | Only 2/5 enabled |

### Agent Dual Definition Risk

Agents are defined in TWO places:
1. **`opencode.json`** → `agent` block (machine config: model, tools, permissions)
2. **`.opencode/agents/*.md`** → Markdown files (behavioral instructions, role description)

If these diverge, the agent has conflicting identity — its tool permissions (from JSON) may not match its behavioral instructions (from MD).

### MCP Provider Status

| Provider | Status | Used By | Impact |
|----------|--------|---------|--------|
| DeepWiki | ENABLED | `hivefiver-mcp-research-loop` skill | Research capability |
| Stitch | ENABLED | UI design generation | Design workflow |
| Context7 | DISABLED | Research loop | Limits library documentation access |
| Tavily | DISABLED | Research loop | Limits web search capability |
| Exa | DISABLED | Research loop | Limits semantic search |

---

## 7. Domain D: Runtime State & Pipeline

### Session Lifecycle Pipeline

```
START ──► RESUME ──► UPDATE ──► COMPACT ──► CLOSE
  │          │          │          │          │
  │ Creates:  │ Restores: │ Mutates: │ Archives:│ Exports:
  │ brain.json│ hierarchy │ hierarchy│ session  │ archive/
  │ hierarchy │ brain     │ brain    │ mems     │ brain reset
  │ manifest  │ (best-    │ tasks    │ brain    │ hierarchy
  │           │  effort)  │          │ reset    │  reset
  └───────────┘───────────┘──────────┘──────────┘──────────┘
```

### Persistence Safety Matrix

| Artifact | Atomicity | Locking | Backup | Recovery | Overall |
|----------|-----------|---------|--------|----------|---------|
| brain.json | HIGH (temp+rename) | YES (FileLock) | YES (3 rotations) | YES | GOOD |
| graph/tasks.json | HIGH (temp+rename) | YES (proper-lockfile) | NO | Temp cleanup | GOOD |
| graph/mems.json | HIGH (temp+rename) | YES (proper-lockfile) | NO | Temp cleanup | GOOD |
| hierarchy.json | LOW (direct write) | NO | NO | NO | POOR |
| state/tasks.json | LOW (direct write) | NO | NO | NO | POOR |
| anchors.json | LOW (direct write) | NO | NO | NO | POOR |
| memory/mems.json | LOW (direct write) | NO | NO | NO | POOR |
| trajectory.json | MED (temp+rename) | NO | NO | Temp cleanup | FAIR |
| sessions/manifest.json | MED (temp+rename) | NO | NO | NO | FAIR |

### Cognitive Packer Budget

- Default context window: 128,000 tokens
- Default budget percentage: 12%
- Effective char budget: ~15,360 characters
- Priority: anchors > active tasks > mems (by relevance score)
- Anti-patterns section: separate 500-char budget
- Truncation: lowest-relevance mems dropped first

---

## 8. Cross-Domain Integration Analysis

### Integration Point Matrix

| Source → Target | Mechanism | Integrity | Risk |
|----------------|-----------|-----------|------|
| Tools → Lib | Direct function call | STRONG | Low |
| Hooks → Lib | Direct function call | STRONG | Low |
| Lib → Schemas | Zod parse/safeParse | STRONG (graph) / WEAK (cognitive) | Medium |
| Hooks → State (brain) | queueStateMutation → StateManager | STRONG | Low |
| Hooks → State (hierarchy) | Direct write via lib | WEAK (no lock) | High |
| Tools → Graph | graph-io.ts with FK validation | STRONG on read, WEAK on write | Medium |
| Cognitive Packer → All State | Read-only aggregation | STRONG | Low |
| Commands → Tools | OpenCode SDK dispatch | STRONG | Low |
| Skills → Agent Behavior | System prompt injection | STRONG | Low |
| Agent Definitions → Runtime | Dual source (JSON + MD) | WEAK (divergence risk) | Medium |

### Data Flow Through User Actions

```
User Action: "declare_intent({ mode: 'plan_driven', focus: '...' })"
    │
    ├─► tool-gate.ts (before hook) — governance check
    │       └─► detection.ts — drift/framework detection
    │
    ├─► hivemind-session.ts (tool execute)
    │       ├─► session-engine.ts:startSession()
    │       │       ├─► persistence.ts:createStateManager() → brain.json [LOCKED]
    │       │       ├─► hierarchy-tree.ts:saveTree() → hierarchy.json [UNLOCKED]
    │       │       └─► manifest.ts:registerSessionInManifest() → sessions/manifest.json
    │       │
    │       ├─► graph-io.ts:saveTrajectory() → graph/trajectory.json [UNLOCKED]
    │       └─► reconcileStaleTasks() → graph/tasks.json [LOCKED]
    │
    ├─► soft-governance.ts (after hook)
    │       └─► queueStateMutation() → brain.json [QUEUED]
    │
    └─► session-lifecycle.ts (system prompt hook)
            └─► cognitive-packer.ts:packContext() → XML context string
                    ├─► reads: trajectory.json, tasks.json, mems.json, anchors.json
                    └─► applies: staleness filter, relevance scoring, budget truncation
```

### Gap: Session Resume Path

```
User Action: "resume_session()"
    │
    ├─► session-engine.ts:resumeSession()
    │       ├─► Creates NEW session ID (doesn't reuse old)
    │       ├─► Tries to restore hierarchy from old session
    │       │       └─► BEST-EFFORT: Falls back to empty on any error
    │       ├─► Does NOT restore graph trajectory linkage
    │       └─► Does NOT reconcile old session's stale tasks
    │
    └─► Result: New session with partial state, trajectory.json
         still references old session_id → DIVERGENCE
```

---

## 9. User Journey Simulations

### Journey 1: Greenfield Fresh Start (Happy Path)

```
Scenario: New project, first-time HiveMind init, expert user
Expected: Clean state creation, all artifacts initialized

Step 1: npx hivemind init
  ├─► cli/init.ts → creates .hivemind/ directory structure ✅
  ├─► Creates empty manifests (codemap, codewiki, plans) ✅
  ├─► Does NOT create brain.json (created on first session) ⚠️
  └─► Does NOT register in graph layer ⚠️

Step 2: declare_intent({ mode: "plan_driven", focus: "Build auth system" })
  ├─► session-engine.ts:startSession() ✅
  ├─► Creates brain.json with new session ✅
  ├─► Creates hierarchy.json ✅
  ├─► Creates trajectory.json ✅
  ├─► Session IDs match between brain + trajectory ✅
  └─► RESULT: Clean state, all artifacts aligned ✅

Verdict: PASS — Greenfield works correctly
Risk: codemap/codewiki manifests created but never materialized (benign)
```

### Journey 2: Brownfield Resume (Risky Path)

```
Scenario: Existing project, resuming after session gap, intermediate user
Expected: State restored from previous session

Step 1: Agent starts (no explicit declare_intent)
  ├─► session-lifecycle.ts hook fires
  ├─► Checks for active session in brain.json ✅
  ├─► Loads hierarchy from hierarchy.json ✅
  ├─► Loads trajectory from trajectory.json ✅
  ├─► BUT: session_id in brain.json may not match trajectory.json ⚠️
  └─► No reconciliation between state/ and graph/ ⚠️

Step 2: User runs map_context({ level: "action", content: "Continue auth" })
  ├─► Updates hierarchy.json ✅
  ├─► Updates brain.json ✅
  ├─► Does NOT update trajectory.json graph state ⚠️
  └─► DIVERGENCE: hierarchy.json action ≠ graph trajectory's active state

Step 3: save_mem({ shelf: "decisions", content: "Chose JWT" })
  ├─► Writes to graph/mems.json ✅
  ├─► Uses current session UUID for session_id FK ✅
  ├─► BUT: if trajectory.json has stale session_id, FK validation may quarantine ⚠️

Verdict: PARTIAL PASS — Works in practice but divergence accumulates
Risk: After multiple resume cycles, state/graph divergence becomes unrecoverable
```

### Journey 3: Wrong Agent Selected (Protection Test)

```
Scenario: User selects 'build' agent for orchestration task
Expected: Framework detects mismatch and warns

Step 1: Build agent starts
  ├─► session-lifecycle.ts fires (all agents) ✅
  ├─► soft-governance.ts fires (all agents) ✅
  ├─► tool-gate.ts — framework detection is ADVISORY only ⚠️
  └─► No hard block on wrong agent for wrong task

Step 2: Build agent tries to orchestrate (spawn subagents)
  ├─► AGENTS.md says build should "implement, verify, return evidence" ✅
  ├─► BUT: build agent has 'task' tool access in opencode.json ⚠️
  ├─► Can technically spawn subagents (no enforcement) ⚠️
  └─► Governance violation detected but only logged, not blocked

Verdict: FAIL — Advisory enforcement allows wrong-agent operation
Risk: Role confusion between orchestrator and implementer
Fix Needed: Hard gate in tool-gate.ts for role-specific tool access
```

### Journey 4: Incorrect Session Resume (Error Recovery)

```
Scenario: User resumes with corrupted brain.json (field missing or malformed)
Expected: Graceful recovery or clear error

Step 1: Plugin loads
  ├─► persistence.ts:load() reads brain.json
  ├─► JSON.parse(data) as BrainState — NO VALIDATION ❌
  ├─► If field missing: undefined access → runtime crash
  ├─► If field wrong type: silent corruption propagates

Step 2: Crash scenario
  ├─► brain.json has session.id = null (corruption)
  ├─► session-lifecycle.ts tries to use session.id → TypeError ❌
  ├─► Plugin hook crashes → OpenCode gets no system prompt
  ├─► User sees blank governance context with no explanation

Verdict: FAIL — No validation, no recovery path
Risk: Any brain.json corruption crashes the entire plugin
Fix Needed: BrainStateSchema (Zod) + safeParse with fallback to createBrainState()
```

### Journey 5: Novice vs Expert (Complexity Adaptation)

```
Scenario: Compare vibecoder (novice) vs enterprise_architect (expert) paths

NOVICE (vibecoder):
  ├─► /hivefiver start → hivefiver-start.md → persona-routing skill
  ├─► Detects vibecoder persona ✅
  ├─► Routes to hivefiver-vibecoder.yaml workflow ✅
  ├─► 7-step workflow: bootstrap → intake → spec → research → tutor → export
  ├─► Simpler language, guided prompts ✅
  └─► WORKS: Clean path with appropriate complexity

EXPERT (enterprise_architect):
  ├─► /hivefiver start → hivefiver-start.md → persona-routing skill
  ├─► Detects enterprise_architect persona ✅
  ├─► Routes to... hivefiver-enterprise.yaml OR hivefiver-enterprise-architect.yaml? ⚠️
  ├─► TWO competing workflows for same persona ❌
  ├─► hivefiver-enterprise: 8 steps with gsd-bridge
  ├─► hivefiver-enterprise-architect: 7 steps with orchestration + ralph-export
  └─► AMBIGUITY: Which workflow is canonical?

Verdict: NOVICE=PASS, EXPERT=PARTIAL (workflow ambiguity)
```

### Journey 6: Parallel Subagent Execution (Stress Test)

```
Scenario: Hiveminder dispatches 3 scanner agents simultaneously
Expected: All write to state safely, no corruption

Step 1: 3 scanners start
  ├─► Each creates its own session context in brain.json
  ├─► brain.json uses FileLock → concurrent-safe ✅

Step 2: All 3 try to save_mem simultaneously
  ├─► graph/mems.json uses proper-lockfile → concurrent-safe ✅
  ├─► memory/mems.json has NO lock → potential corruption ⚠️

Step 3: All 3 finish and orchestrator calls export_cycle
  ├─► Writes to hierarchy.json → NO lock → potential corruption ⚠️
  ├─► Writes to state/tasks.json → NO lock → potential corruption ⚠️
  ├─► Writes to anchors.json → NO lock → potential corruption ⚠️

Verdict: PARTIAL PASS — Graph layer safe, cognitive layer vulnerable
Risk: Parallel subagents can corrupt hierarchy.json and state/tasks.json
```

---

## 10. Consolidated Issue Registry

### Priority Matrix

| ID | Issue | Severity | Domain | Fix Complexity | Dependencies |
|----|-------|----------|--------|---------------|-------------|
| CF-01 | Dual state systems (3 pairs) | CRITICAL | Runtime+Schema | HIGH | Requires architectural decision on canonical SOT |
| CF-02 | Missing Zod for BrainState/HierarchyState/Config/TaskItem | CRITICAL | Schema | MEDIUM | None — pure addition |
| CF-03 | 4 lib→hooks import violations | HIGH | Architecture | MEDIUM | Create src/sdk/ layer |
| CF-04 | 9 files exceed 300 LOC | HIGH | Architecture | HIGH | Decomposition plan needed |
| CF-05 | Inconsistent locking (7/10 files unlocked) | HIGH | Runtime | MEDIUM | Extend proper-lockfile usage |
| CF-06 | FK validation on read only | MEDIUM | Runtime+Schema | LOW | Add validation in addGraphTask/addGraphMem |
| CF-07 | Command/skill/workflow surface explosion | MEDIUM | Orchestration | MEDIUM | Consolidation into canonical forms |
| CF-08 | Hierarchy model mismatch | MEDIUM | Schema | HIGH | Requires formal mapping design |
| CF-09 | Manifest chain incomplete | MEDIUM | Runtime | LOW | Implement codemap/codewiki materializers or remove placeholders |
| CF-10 | Orphan quarantine bloat | LOW | Runtime | LOW | Add idempotency check + deduplicate |
| CF-11 | Agent dual definition | MEDIUM | Orchestration | LOW | Choose single SOT |
| CF-12 | Framework enforcement advisory-only | MEDIUM | Architecture | MEDIUM | Convert tool-gate.ts to hard gate |
| CF-13 | Silent error swallowing | MEDIUM | Architecture | LOW | Add structured logging |
| CF-14 | Resume best-effort semantics | HIGH | Runtime | MEDIUM | Implement strict lineage lock |
| CF-15 | MCP provider partial coverage | LOW | Orchestration | LOW | Enable Context7/Tavily |
| CF-16 | graph/phases.json orphaned file | LOW | Runtime | LOW | Remove or document |
| CF-17 | brain.json backup rotation only | LOW | Runtime | LOW | Extend to critical files |

### Dependency Graph for Fixes

```
CF-02 (Zod schemas) ──────► CF-01 (Dual state unification)
                                      │
CF-03 (SDK layer) ──────────────────► │
                                      │
CF-05 (Locking) ────────────────────► │
                                      │
CF-06 (FK write validation) ────────► │
                                      ▼
                            CF-14 (Strict resume)
                                      │
CF-08 (Hierarchy mapping) ──────────► │
                                      ▼
                            CF-04 (LOC decomposition)
                                      │
CF-07 (Surface consolidation) ──────► │
                                      ▼
                            CF-09 (Manifest materialization)
```

---

## 11. Consolidation Recommendations

### Phase 1: Foundation Safety (Week 1)

**Goal:** Make the system crash-proof

| Task | Files | Effort |
|------|-------|--------|
| Create BrainStateSchema (Zod) + safeParse everywhere | schemas/brain-state.ts, persistence.ts | 2 days |
| Create HierarchyStateSchema (Zod) | schemas/hierarchy.ts | 0.5 days |
| Create HiveMindConfigSchema (Zod) | schemas/config.ts | 0.5 days |
| Create TaskItemSchema (Zod) | schemas/manifest.ts | 1 day |
| Extend proper-lockfile to hierarchy.json, anchors.json, state/tasks.json | lib/hierarchy-tree.ts, lib/anchors.ts, lib/manifest.ts | 1 day |
| Add FK validation on write in addGraphTask/addGraphMem | lib/graph-io.ts | 0.5 days |
| Fix orphan quarantine idempotency | lib/orphan-quarantine.ts | 0.5 days |

### Phase 2: Architecture Repair (Week 2)

**Goal:** Fix boundary violations and decompose monoliths

| Task | Files | Effort |
|------|-------|--------|
| Create `src/sdk/` layer — move sdk-context.ts | hooks/sdk-context.ts → sdk/ | 1 day |
| Extract types from hooks to schemas | hooks/session_coherence/types.ts → schemas/ | 0.5 days |
| Extract helpers from hooks to lib | hooks/session-lifecycle-helpers.ts → lib/ | 0.5 days |
| Decompose graph-io.ts (1350 LOC) into 3 files | lib/graph-persistence.ts, lib/graph-fk.ts, lib/graph-ralph.ts | 2 days |
| Decompose detection.ts (882 LOC) | lib/drift-detection.ts, lib/governance-signals.ts | 1 day |
| Add structured error logging (replace silent catches) | 5 files | 1 day |

### Phase 3: State Unification (Week 3-4)

**Goal:** Resolve dual state systems into canonical SOT

| Task | Files | Effort |
|------|-------|--------|
| Design canonical lifecycle contract (the core of Option 1) | New: schemas/lifecycle-contract.ts | 2 days |
| Unify task systems: state/tasks.json ← graph/tasks.json merge | manifest.ts, graph-io.ts, event-handler.ts | 3 days |
| Unify memory systems: deprecate memory/mems.json → graph/mems.json only | mems.ts, cognitive-packer.ts | 1 day |
| Unify trajectory: deprecate state/hierarchy.json → merge into graph/trajectory.json | hierarchy-tree.ts, graph-io.ts, session-engine.ts | 3 days |
| Implement strict resume with lineage lock | session-engine.ts | 2 days |

### Phase 4: Surface Consolidation (Week 5)

**Goal:** Reduce operational surface area

| Task | Files | Effort |
|------|-------|--------|
| Consolidate command aliases (30 → ~18 canonical) | commands/ | 1 day |
| Merge overlapping skills (17 → ~12) | .opencode/skills/ | 1 day |
| Resolve enterprise workflow duplication | workflows/ | 0.5 days |
| Choose single agent definition SOT (MD vs JSON) | opencode.json, .opencode/agents/ | 0.5 days |
| Remove orphaned graph/phases.json | .hivemind/graph/ | 0.1 days |
| Enable Context7/Tavily MCP providers | opencode.json | 0.5 days |

### Phase 5: Hardening (Week 6)

**Goal:** Stress-test and verify

| Task | Files | Effort |
|------|-------|--------|
| Add concurrency tests for parallel agent writes | tests/ | 2 days |
| Add schema migration tests | tests/ | 1 day |
| Add user journey integration tests | tests/ | 2 days |
| Convert tool-gate.ts advisory → hard enforcement | hooks/tool-gate.ts | 1 day |
| Full regression + documentation update | All | 1 day |

---

## Appendix: File Registry

### Source Files by Layer (97 files)

#### src/tools/ (7 files)
| File | LOC | Boundary | Status |
|------|-----|----------|--------|
| hivemind-session.ts | 305 | COMPLIANT | Near limit |
| hivemind-memory.ts | 370 | COMPLIANT | Over limit |
| hivemind-cycle.ts | 258 | COMPLIANT | OK |
| hivemind-hierarchy.ts | 205 | COMPLIANT | OK |
| hivemind-anchor.ts | 140 | COMPLIANT | OK |
| hivemind-inspect.ts | 55 | COMPLIANT | OK |
| index.ts | 19 | N/A | OK |

#### src/hooks/ (13 files)
| File | LOC | Boundary | Status |
|------|-----|----------|--------|
| soft-governance.ts | 571 | COMPLIANT (CQRS) | Over limit |
| messages-transform.ts | 543 | COMPLIANT | Over limit |
| tool-gate.ts | 409 | COMPLIANT | Over limit |
| event-handler.ts | 400 | COMPLIANT | Over limit |
| session-lifecycle-helpers.ts | 387 | COMPLIANT | Over limit |
| compaction.ts | 224 | COMPLIANT | OK |
| session-lifecycle.ts | 179 | COMPLIANT | OK |
| sdk-context.ts | 148 | N/A (should be src/sdk/) | Misplaced |
| swarm-executor.ts | 101 | COMPLIANT | OK |
| session_coherence/index.ts | 8 | N/A | OK |
| index.ts | 21 | N/A | OK |

#### src/lib/ (42+ files) — Top 10 by LOC
| File | LOC | Boundary | Status |
|------|-----|----------|--------|
| graph-io.ts | 1350 | VIOLATION (4 hook imports) | CRITICAL decompose |
| detection.ts | 882 | COMPLIANT | Decompose |
| session-engine.ts | 635 | COMPLIANT | Decompose |
| session_coherence.ts | 605 | VIOLATION (hook type import) | Decompose + fix |
| compaction-engine.ts | 447 | VIOLATION (hook SDK import) | Fix import |
| session-governance.ts | 313 | VIOLATION (hook helper import) | Fix import |
| hierarchy-tree.ts | ~250 | COMPLIANT | OK |
| auto-commit.ts | 103 | VIOLATION (hook SDK import) | Fix import |
| persistence.ts | ~200 | COMPLIANT | OK |
| paths.ts | ~100 | COMPLIANT | OK |

#### src/schemas/ (8 files)
| File | Schemas | Zod? | Status |
|------|---------|------|--------|
| graph-nodes.ts | 6 node + 2 enum | YES | STRONG |
| graph-state.ts | 4 wrappers | YES | STRONG |
| events.ts | 2 schemas | YES | OK (loose payload) |
| brain-state.ts | 6 interfaces | **NO** | CRITICAL gap |
| hierarchy.ts | 3 types | **NO** | HIGH gap |
| config.ts | 5 interfaces | **NO** | MEDIUM gap |
| manifest.ts | 2 interfaces | **NO** | MEDIUM gap |
| index.ts | Barrel exports | N/A | OK |

### Test Coverage (30+ files, 500+ tests, all passing)

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| Cycle 4 (Session-ID parity) | 2 | 15 | GREEN |
| Cycle 7 (Lifecycle continuity) | 1 | 2 | GREEN |
| Phase 5 (Lifecycle + FK chain) | 1 | 7 | GREEN |
| Hardening (persistence, planning-fs) | 2 | 2 | GREEN |
| Event handler | 1 | 8 | GREEN |
| Other | 23+ | 466+ | GREEN |

---

## Document Control

| Field | Value |
|-------|-------|
| Author | hiveminder (orchestrator) via 4 parallel scanner agents |
| Date | 2026-02-23 |
| Session | 4a625473-9caa-4f4e-a2b0-de1bd7704283 |
| Branch | dev-v3 |
| Commits Referenced | 92c048e, b9b2e60, 4d05bd2, e281233, 4e288a5, 38810da, 5c54427 |
| Scanner Agents | Architecture (ses_374e34e0), Schema (ses_374e2f8f), Orchestration (ses_374e29621), Runtime (ses_374e225db) |
| Supersedes | 2026-02-19-hivefiver-final-audit-inventory.md |
| Next Action | Grand consolidation plan based on this SOT |
