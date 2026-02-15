# HiveMind v3.0 — Relational Cognitive Engine Master Plan

Transform HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by CQRS, Graph-RAG, the Actor Model, and a strict architectural taxonomy — enforced via 4 sequential God Prompts.

---

## Part 1: The Architectural Taxonomy (The Biological Model)

### 1. Tools (`src/tools/`): The Conscious Limbs (Write-Only)

- **What**: LLM-facing API wrappers. Just Zod schemas and descriptions.
- **Purpose**: Constrained, predictable way to **mutate** state (e.g., `save_mem`, `mark_task_complete`, `flag_false_path`).
- **The Rule**: Zero complex business logic. Parse LLM's JSON args → call Library → return brief string. **>100 lines = architecturally flawed.**

### 2. Libraries (`src/lib/`): The Subconscious Engine (RAM/CPU)

- **What**: Pure, deterministic TypeScript logic. *LLMs do not know these exist.*
- **Purpose**: State manipulation, Graph traversal, TTS calculations, file I/O, XML compression.
- **The Rule**: Never returns conversational natural language. Returns strict JSON, Booleans, or dense XML strings.

### 3. Hooks (`src/hooks/`): The Autonomic Nervous System (Read-Auto)

- **What**: OpenCode SDK event listeners (`messages.transform`, `session.compacting`, `tool.execute.after`).
- **Purpose**: Programmatically *force* context upon the LLM without tool calls.
- **The Rule**: Call Libraries to compile `.hivemind` state into purified XML → inject as `synthetic: true` parts.

### 4. Schemas (`src/schemas/`): The DNA (Zod Validation Layer)

- **What**: Zod schemas for all graph nodes, config, and state.
- **The Rule**: Every graph node MUST have UUID `id` + explicit FK fields (`parent_id`, `origin_task_id`). Orphaned nodes fail validation.

### Enforcement Paradigms

- **CQRS**: Tools = Write-Only Commands. Hooks + Libs = Read-Only Queries. Agent writes via tools, NEVER reads its own memory via tools.
- **Graph-RAG**: All `graph/` entities are UUID-keyed JSON with FKs. Cognitive Packer traverses deterministically.
- **Actor Model**: Sessions are isolated containers. Sub-agent "swarms" run in headless child sessions via `client.session.create()` + `noReply: true`.

---

## Part 2: The `.hivemind` Relational Directory Tree

```text
.hivemind/
├── system/                            # CORE GOVERNANCE
│   ├── config.json                    # TTS thresholds, 80% split limits, governance mode
│   └── manifest.json                  # Master Index (Maps all active UUIDs)
│
├── graph/                             # THE RELATIONAL DATABASE
│   ├── trajectory.json                # The "Read-Head" (active_plan_id, phase_id, task_ids[], intent_shift_stamp)
│   ├── plans.json                     # Epics & Phases (symlinked to host SOT docs)
│   ├── tasks.json                     # Execution Graph (Main→Sub→File locks)
│   └── mems.json                      # Multi-shelf knowledgebase (type: "insight"|"false_path")
│
├── state/                             # HOT SESSION STATE (updated every turn)
│   ├── brain.json                     # Slim: session metadata + metrics only
│   ├── anchors.json                   # Immutable anchors (survive compaction)
│   └── hierarchy.json                 # Legacy tree (deprecated after migration)
│
├── sessions/                          # SDK CONTAINERS (The 80% Rule + Actor Model)
│   ├── active/
│   │   ├── session_main.json          # Primary orchestrator metadata
│   │   └── swarms/                    # Headless delegation sessions
│   └── archive/
│       ├── compacted/                 # Immutable /compact history
│       └── splits/                    # Context XML exports from pre-80% boundaries
│
└── artifacts/                         # HUMAN-READABLE OUTPUTS (never parsed by packer)
    ├── dashboards/                    # Ink TUI snapshot data
    └── synthesis/                     # Reports, markdown summaries
```

### Graph-RAG Topology

```
[PLAN] ─has many─▶ [PHASE] ─has many─▶ [TASK] ─generates─▶ [MEM]
  │                   │                   │                   │
  │ sot_doc_path      │ parent_plan_id    │ parent_phase_id   │ origin_task_id (FK)
  │ status            │ order, status     │ assigned_session   │ type: insight|false_path
  └─ phases[]         └─                  │ file_locks[]       │ staleness_stamp
                                          └─ status            └─ shelf, tags
```

**Dynamic Intent Shift**: `trajectory.json` stores `active_phase_id` + `active_task_ids[]`. When user says *"Wait, fix the UI first"*, Hook updates trajectory → Packer instantly pulls UI graph instead of Backend graph. **Agent pivots without reading files.**

---

## Part 3: The "Repomix-for-State" I/O Flow

### Step 1 — Write-Through (Tools → Graph)
Agent uses tools ONLY to write: `save_mem({ content, origin_task_id })`. Tool calls `lib/graph-io.ts::addGraphMem()` → Zod validates → assigns UUID → computes `staleness_stamp` → writes to `graph/mems.json`.

### Step 2 — Compilation (Lib: `cognitive-packer.ts`)
`packCognitiveState(directory, sessionId)`:
1. Reads `trajectory.json` → finds active plan/phase/task IDs (the "Read-Head")
2. Traverses `tasks.json` via FK `parent_phase_id` → resolves active task chain
3. Traverses `mems.json` via FK `origin_task_id` → pulls linked mems
4. **The "Time Machine"**: DROPS `MemNode`/`TaskNode` with `type: "false_path"` or `status: "invalidated"`
5. **TTS Filter**: Drops `MemNode`s past `staleness_stamp` UNLESS linked to active task
6. Resolves `plans.json` → active plan/phase context

### Step 3 — Compression (Lib → XML)
```xml
<hivemind_state timestamp="..." session="..." compaction="#N">
  <trajectory intent="..." plan="..." phase="..." active_tasks="3" />
  <active_tasks>
    <task id="..." parent_phase="..." status="active" files="2">content</task>
  </active_tasks>
  <relevant_mems count="5" stale_dropped="12" false_path_pruned="3">
    <mem id="..." shelf="decisions" stale_in="24h" origin_task="...">content</mem>
  </relevant_mems>
  <anchors>
    <anchor key="DB_SCHEMA" age="2h">value</anchor>
  </anchors>
  <governance drift="75" turns="12" violations="0" health="85" />
</hivemind_state>
```
Budget: 2000 chars (configurable). Lowest-relevance mems dropped first.

### Step 4 — Injection (Hook → LLM)
`experimental.chat.messages.transform` fires on every user prompt. Injects TWO `synthetic: true` parts:
1. **Context Payload**: The `<hivemind_state>` XML
2. **Pre-Stop Gate**: `<system-reminder>BEFORE completing your turn, VERIFY: 1. Hierarchy updated? 2. Artifacts saved? 3. Commit threshold met? If NO → execute required tools NOW.</system-reminder>`

**Result**: Pristine context every turn. Zero tool-call token cost.

---

## Part 4: Current State Audit

### A. Dual Tool Registry — 2,168 Lines Dead Code
- `src/index.ts` registers 10 OLD tools. 6 NEW unified tools (hivemind-*.ts) exist but are **NEVER WIRED**.

### B. "Dumb Tool" Violations
| File | Lines | Status | Issue |
|------|-------|--------|-------|
| `hivemind-session.ts` | 669 | DEAD | fs.writeFile, tree creation inline |
| `compact-session.ts` | 440 | ACTIVE | Purification scripts IN tool file |
| `hivemind-inspect.ts` | 433 | DEAD | State reading, chain analysis |
| `scan-hierarchy.ts` | 425 | ACTIVE | Brownfield scan, anchor upserts inline |
| `map-context.ts` | 226 | ACTIVE | Hierarchy update + formatting |
| `declare-intent.ts` | 156 | ACTIVE | Session init logic |

### C. Flat File Fallacy
`state/brain.json` = monolithic blob. `memory/mems.json` = flat array (no `origin_task_id`, no `staleness_stamp`, no `type` field). No UUID FKs. No relational chaining.

### D. No Cognitive Packer
`session-lifecycle.ts` (586L) does ad-hoc string concatenation. No graph traversal, no TTS, no false_path pruning, no structured XML.

### E. Session Boundary — Primitive
`session-boundary.ts` (111L) has `shouldCreateNewSession()` but: no actual SDK session creation, no swarm spawning, no `noReply` injection, no 80% capacity monitoring.

---

## Execution Phases (Aligned to God Prompts)

### Phase 1: Graph Schemas & The "Dumb Tool" Diet
*God Prompt 1. Foundation — everything depends on this.*

#### 1A. Build `src/schemas/graph-nodes.ts` (Zod)

```typescript
// All IDs are UUIDs. All FKs are validated.
TrajectoryNode: { active_plan_id, active_phase_id, active_task_ids[], intent_shift_stamp, updated_at }
PlanNode:       { id, title, sot_document_path, status, phases: PhaseNode[], created_at }
PhaseNode:      { id, parent_plan_id (FK), title, status, order }
TaskNode:       { id, parent_phase_id (FK), type: "main"|"sub", status, assigned_session_id, file_locks[] }
MemNode:        { id, origin_task_id (FK, nullable), shelf, content, type: "insight"|"false_path",
                  tags[], staleness_stamp, relevance_score, session_id, created_at }
```

Create `src/schemas/graph-state.ts` — aggregate types for each graph/*.json file.
Add FK validation helpers: `validateParentExists()`, `validateOrphanFree()`.
Update `src/lib/paths.ts` — add `graphDir`, `graphTrajectory`, `graphPlans`, `graphTasks`, `graphMems` to `HivemindPaths`.

#### 1B. The "Dumb Tool" Refactor

Extract ALL business logic from tools → new lib files:

| From (Tool/Hook) | Extract To (Library) | Functions |
|-------------------|---------------------|-----------|
| `compact-session.ts` | `src/lib/compaction-engine.ts` | `identifyTurningPoints()`, `generateNextCompactionReport()`, `executeCompaction()` |
| `scan-hierarchy.ts` | `src/lib/brownfield-scan.ts` | `executeOrchestration()` (anchor upserts + mem saving) |
| `hivemind-session.ts` | `src/lib/session-engine.ts` | `startSession()`, `updateSession()`, `closeSession()`, `getSessionStatus()`, `resumeSession()` |
| `hivemind-inspect.ts` | `src/lib/inspect-engine.ts` | `scanState()`, `deepInspect()`, `driftReport()` |
| `soft-governance.ts` | `src/lib/session-split.ts` | `maybeCreateNonDisruptiveSessionSplit()` |

Slim every tool to: `tool({ description, args: z.object(...), execute(args) { return lib.fn(dir, args) } })`
Move shared `toJsonOutput()` → `src/lib/tool-response.ts`

#### 1C. Enforce Zod Chain Constraints
Every state-mutating tool's Zod schema MUST require `parent_id` or `origin_task_id`. If orphaned → tool returns error.

**Tests**: Schema validation (valid/invalid nodes, FK constraints). Extracted lib function unit tests.
**Risk**: Medium — large move but no behavioral change. Tests catch regressions.

---

### Phase 2: The Cognitive Packer (Repomix-for-State)
*God Prompt 2. The Context Compiler — pure subconscious data-structuring.*

#### 2A. Build `src/lib/cognitive-packer.ts`

`packCognitiveState(directory, sessionId): string`
- NO LLM prompts, NO tool definitions inside this file
- Reads `trajectory.json` → resolves Read-Head
- Traverses graph via FK resolution (plans → tasks → mems)
- **Time Machine**: Drops `false_path` + `invalidated` nodes
- **TTS**: Filters expired mems (unless linked to active task)
- **Budget**: 2000-char cap, drops lowest-relevance mems first
- Outputs dense `<hivemind_state>` XML (see Part 3 above)

#### 2B. Build `src/lib/graph-io.ts`

CRUD layer for graph/*.json using atomic writes:
- `loadTrajectory()` / `saveTrajectory()`
- `loadPlans()` / `savePlans()`
- `loadGraphTasks()` / `saveGraphTasks()` / `addGraphTask()` / `invalidateTask()`
- `loadGraphMems()` / `saveGraphMems()` / `addGraphMem()` / `flagFalsePath()`
- All validate via Phase 1 Zod schemas on read AND write

#### 2C. Enhance `src/lib/staleness.ts`

- `isMemStale(mem, activeTasks, config): boolean` — TTS logic
- `calculateRelevanceScore(mem, trajectory): number` — priority sorting
- `pruneContaminated(mems, tasks): { clean, pruned }` — Time Machine filter

**Tests**: Packer unit tests with mock graph data. TTS filtering. XML output validation. Contamination pruning.
**Risk**: Medium — new system, additive. Old system untouched until Phase 4.

---

### Phase 3: SDK Hook Injection & Pre-Stop Gate
*God Prompt 3. Wire the Cognitive Packer into the LLM's cognition loop.*

#### 3A. Refactor `messages-transform.ts`

Hook into `experimental.chat.messages.transform`. For last user message, push TWO `synthetic: true` parts:

1. **Context Injection**: Call `packCognitiveState(directory, sessionId)` → inject XML
2. **Pre-Stop Gate Checklist**:
   ```xml
   <system-reminder>BEFORE completing your turn, you MUST verify:
   1. Is the hierarchy updated in the graph?
   2. Are artifacts saved and linked?
   3. Have you committed changes if threshold met?
   If NO, DO NOT STOP. Execute required tools NOW.</system-reminder>
   ```

Current `buildAnchorContext()` → reads from packed state instead of raw brain.json.
Checklist items derived from `trajectory.json` active tasks.

#### 3B. Refactor `session-lifecycle.ts`

Replace 300+ lines of ad-hoc section assembly with:
```typescript
const packedState = await packCognitiveState(directory, state.session.id)
output.system.push(packedState)
```
Keep: bootstrap block (first 2 turns), setup guidance, governance signals.
Move: brownfield detection, framework conflict routing → `src/lib/onboarding.ts`.
**Target: ≤200 lines** (from 586).

#### 3C. Refactor `soft-governance.ts`

Extract `maybeCreateNonDisruptiveSessionSplit()` → `src/lib/session-split.ts`.
Keep only: counter engine, detection state writes, toast emission.
**Target: ≤400 lines** (from 670).

**Tests**: Hook integration tests. XML injection format verification. Budget cap tests.
**Risk**: High — changes prompt injection (agent behavior may shift). A/B test old vs new.

---

### Phase 4: .hivemind Graph Migration & Session Swarms
*God Prompt 4. Non-disruptive migration + Actor Model swarms.*

#### 4A. Build `src/lib/graph-migrate.ts`

`migrateToGraph(directory)` — one-time, auto-triggered on first hook if `graph/` missing:
- `brain.json` hierarchy → `trajectory.json` (extract active intent)
- `tasks.json` flat → `graph/tasks.json` with `parent_phase_id` (FK)
- `mems.json` flat → `graph/mems.json` with `staleness_stamp` (= `created_at + 72h`), `type: "insight"`, `origin_task_id: null`
- Creates empty `graph/plans.json` (plans linked later by user)
- Preserves old files as `.bak` backups
- Dual-read strategy: graph-aware functions check `graph/` first, fall back to `state/`

#### 4B. Build `src/lib/session-swarm.ts` (Actor Model)

Evolve `session-boundary.ts` into full SDK session manipulation:

1. **The 80% Splitter**: Monitor session token pressure. At 80% capacity:
   - Call `packCognitiveState()` for pure context export
   - `client.session.create()` → spawn pristine session container
   - `client.session.prompt({ noReply: true })` → inject XML as Turn 0
   - Save export to `sessions/archive/splits/`

2. **Headless Context Extraction** (Swarms):
   - `spawnHeadlessResearcher(client, parentId, prompt)` → spawns sub-session
   - Uses `noReply: true` to force background research
   - Commands sub-agent to save findings to `graph/mems.json` with `origin_task_id`
   - Metadata tracked in `sessions/active/swarms/`

3. **Trajectory Write-Through in Tools**:
   - `declare_intent` → sets `trajectory.active_plan_id`, clears phase/task
   - `map_context(trajectory)` → updates intent shift stamp
   - `map_context(tactic/action)` → updates `active_phase_id` / `active_task_ids`

**Tests**: Migration tests (old→new format, FK verification). Dual-read tests. Swarm spawn/inject tests (mock SDK client).
**Risk**: High — persistence layer + SDK integration. Backup + dual-read mitigates migration risk. Swarms are additive.

---

### Phase 5: Tool Consolidation & Cleanup

#### 5A. Wire Canonical Unified Tools
Use the 6 existing `hivemind-*.ts` as canonical (strip their business logic to libs in Phase 1B):
- `hivemind_session` (start/update/close/status/resume) → replaces declare_intent + map_context + compact_session
- `hivemind_inspect` (scan/deep/drift) → replaces scan_hierarchy + think_back
- `hivemind_memory` (save/recall/list) → replaces save_mem + recall_mems
- `hivemind_anchor` (save/list/get) → replaces save_anchor
- `hivemind_hierarchy` (prune/migrate/status) → replaces hierarchy_manage
- `hivemind_cycle` (export/list/prune) → replaces export_cycle

#### 5B. Delete Old Tools
Remove: declare-intent.ts, map-context.ts, compact-session.ts, scan-hierarchy.ts, save-anchor.ts, think-back.ts, save-mem.ts, recall-mems.ts, hierarchy.ts, export-cycle.ts, check-drift.ts, list-shelves.ts, self-rate.ts (13 files)

#### 5C. Update References
- `src/tools/index.ts` → export 6 canonical tools
- `src/index.ts` → register 6 tools (was 10)
- `classifyTool()` in detection.ts → recognize new names
- AGENTS.md, README.md, CLI help text

**Tests**: Full regression. All 6 tools callable. Hooks recognize new names.
**Risk**: Medium — breaking change. Semver v3.0.0 bump.

---

### Phase 6: Testing & Verification

#### New Test Files
| Test File | Covers |
|-----------|--------|
| `tests/graph-nodes.test.ts` | Zod schema validation, FK constraints |
| `tests/cognitive-packer.test.ts` | XML output, TTS filtering, Time Machine, FK resolution |
| `tests/graph-io.test.ts` | CRUD, atomic writes, Zod validation on I/O |
| `tests/graph-migrate.test.ts` | Old→new format, backup, dual-read |
| `tests/session-engine.test.ts` | Extracted session logic |
| `tests/compaction-engine.test.ts` | Extracted compaction logic |
| `tests/inspect-engine.test.ts` | Extracted inspect logic |
| `tests/session-swarm.test.ts` | 80% split, headless spawn, noReply injection |

#### Verification Commands
```bash
npx tsc --noEmit                              # Type-check
npm test                                       # All TAP nodes
node bin/hivemind-tools.cjs source-audit       # Source file audit
node bin/hivemind-tools.cjs ecosystem-check    # Ecosystem health
```

#### Integration Test
Full lifecycle: start session → update hierarchy → save mem with origin_task_id → inspect → trigger packer → verify XML output → compact → verify graph state → verify swarm spawn

---

## Execution Order & Dependencies

```
Phase 1 (Schema + Tool Diet)     ← No deps, start here [God Prompt 1]
    ↓
Phase 2 (Cognitive Packer)       ← Depends on Phase 1 schemas + graph-io [God Prompt 2]
    ↓
Phase 3 (Hook Injection)         ← Depends on Phase 2 packer [God Prompt 3]
    ↓
Phase 4 (Migration + Swarms)     ← Depends on Phase 1-2 schemas + graph-io [God Prompt 4]
    ↓
Phase 5 (Tool Consolidation)     ← Depends on Phase 1 slim tools + Phase 3 hooks
    ↓
Phase 6 (Testing)                ← Runs throughout, final verification here
```

## Estimated Scope

| Phase | New Files | Modified | Deleted | Net Lines |
|-------|-----------|----------|---------|-----------|
| 1 (Schema+Diet) | 8 | 12 | 0 | +300 (schemas) ~0 (moves) |
| 2 (Packer) | 3 | 2 | 0 | +600 |
| 3 (Hooks) | 1 | 3 | 0 | -500 (slim hooks) |
| 4 (Migration+Swarms) | 2 | 4 | 0 | +500 |
| 5 (Consolidation) | 0 | 3 | 13 | -2500 |
| 6 (Tests) | 8 | 10 | 0 | +1000 |
| **Total** | **22** | **~34** | **13** | **~-600** |

---

## Appendix: The God Prompts (Copy-Paste Sequential Execution)

### God Prompt 1: Graph Database & Dumb Tool Diet
> You are transitioning HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by the OpenCode SDK. We are enforcing CQRS: Tools are WRITE-ONLY. Hooks are READ-AUTO.
>
> **MISSION: GRAPH SCHEMAS & TOOL DIET**
> 1. Build `src/schemas/graph-nodes.ts` (Zod) — strict relational schemas, all IDs UUIDs: TrajectoryNode, PlanNode, PhaseNode, TaskNode (parent_phase_id FK), MemNode (origin_task_id FK, type: "insight"|"false_path", staleness_stamp)
> 2. The "Dumb Tool" Refactor — extract ALL business logic from src/tools/ into src/lib/ engine files. Tools must ONLY define Zod schema + call lib + return string. ≤100 lines each.

### God Prompt 2: The Cognitive Packer
> Build `src/lib/cognitive-packer.ts` — a deterministic Context Compiler (Repomix-for-State).
> `packCognitiveState(sessionId)`: reads trajectory.json Read-Head → traverses graph via FK → Time Machine prunes false_path/invalidated → TTS filters stale mems → compresses to `<hivemind_state>` XML.
> This file contains NO LLM prompts and NO tool definitions. Pure subconscious data-structuring.

### God Prompt 3: SDK Mid-Turn Injection & Pre-Stop Gate
> Wire `cognitive-packer.ts` output into the LLM cognition loop via OpenCode SDK.
> Hook `experimental.chat.messages.transform`: push TWO `synthetic: true` parts: (1) packCognitiveState XML, (2) Pre-Stop Gate checklist forcing hierarchy/artifact/commit verification before stopping.
> Refactor session-lifecycle.ts from 586L → ≤200L by replacing ad-hoc assembly with packer call.

### God Prompt 4: Session Swarms & The 80% Split
> Build `src/lib/session-swarm.ts` — SDK session manipulation + Actor Model.
> (1) 80% Splitter: monitor token pressure → packCognitiveState → client.session.create() → noReply inject XML as Turn 0.
> (2) Headless Researcher: spawnHeadlessResearcher(client, parentId, prompt) → sub-session saves findings to graph/mems.json.
> Migrate flat .hivemind/ → graph/ with auto-trigger + dual-read backward compat.
