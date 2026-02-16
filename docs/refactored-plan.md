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

### Phase 3: SDK Hook Injection & Pre-Stop Gate ✅ COMPLETE
*God Prompt 3. Wire the Cognitive Packer into the LLM's cognition loop.*

**Status**: All user stories complete (US-015, US-016, US-017)

| US | Title | Status | Evidence |
|----|-------|--------|----------|
| US-015 | Wire packer to messages-transform | ✅ | Line 230: packCognitiveState(), prependSyntheticPart() |
| US-016 | Implement Pre-Stop Gate checklist | ✅ | Dual-read pattern, buildChecklist(), commit 0e309db |
| US-017 | Refactor session-lifecycle | ✅ | 165 lines (was 586), packer integrated line 75 |

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

## Part 5: Architectural Hardening (P0/P1 Patches)

> **CRITICAL**: These patches address systemic flaws discovered in architectural audit. Implement BEFORE Phase 4 (Swarms) to prevent data corruption, runtime deadlocks, and LLM hallucination loops.

### P0-1: Concurrency Safety in graph-io.ts

**Problem**: Standard Node.js JSON operations are `readFile → modify → writeFile`. Multiple concurrent writers (Main Session + Headless Swarms + Dashboard UI) cause **TOCTOU race conditions**. Data loss is mathematically guaranteed.

**Solution**: Add `proper-lockfile` to all `save*` and `add*` operations.

**Affected User Stories**: PATCH-US-014 (blocks US-021, US-048)

**Implementation**:
```typescript
// src/lib/graph-io.ts
import lockfile from 'proper-lockfile'

async function addGraphMem(projectRoot: string, mem: MemNode): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphMems
  const release = await lockfile.lock(filePath, { retries: 5, stale: 10000 })
  
  try {
    const current = await loadGraphMems(projectRoot)
    const memById = new Map(current.mems.map(m => [m.id, m]))
    memById.set(mem.id, mem)
    await saveGraphMems(projectRoot, { version: current.version, mems: Array.from(memById.values()) })
  } finally {
    await release()
  }
}
```

**Verification**: Concurrency test — spawn 4 parallel `addGraphMem` calls, verify all 4 mems present.

---

### P0-2: Node.js/Bun Runtime IPC Boundary

**Problem**: OpenTUI Dashboard requires **Bun runtime**. HiveMind core runs on **Node.js**. Both mutating same JSON files causes `EBUSY` locks and file truncation.

**Solution**: Dashboard spawns as **detached child process**. UI mutations written to `.hivemind/system/cmd_queue.jsonl`. Node.js hook polls queue.

**Affected User Stories**: US-032, US-038, US-041, US-048

**Implementation**:
```typescript
// US-041: Slash command spawns dashboard
import { spawn } from 'child_process'

function launchDashboard() {
  const proc = spawn('bun', ['run', 'src/dashboard/opentui/index.ts'], {
    detached: true,
    stdio: 'ignore'
  })
  proc.unref() // Don't wait for exit
}

// US-038: Dashboard writes to command queue (NOT direct graph-io)
import { appendFileSync } from 'fs'

function createMemFromDashboard(mem: MemNode) {
  const cmd = { type: 'add_mem', payload: mem, timestamp: Date.now() }
  appendFileSync(CMD_QUEUE_PATH, JSON.stringify(cmd) + '\n')
}

// Node.js hook polls queue
async function processCommandQueue() {
  const lines = readFileSync(CMD_QUEUE_PATH, 'utf-8').split('\n').filter(Boolean)
  for (const line of lines) {
    const cmd = JSON.parse(line)
    if (cmd.type === 'add_mem') await addGraphMem(root, cmd.payload)
  }
  // Truncate queue after processing
  writeFileSync(CMD_QUEUE_PATH, '')
}
```

**Verification**: Dashboard can create mem without crashing Node.js session.

---

### P0-3: Read-Time Zod Fault Tolerance

**Problem**: If user edits `tasks.json` and breaks JSON, or orphaned FK enters system, `loadGraphTasks()` throws Zod error. Because `packCognitiveState` runs on **every user message**, **entire agent is paralyzed**.

**Solution**: Strict validation on WRITE. **Quarantine/Soft-Fail on READ**.

**Affected User Stories**: PATCH-US-014, US-026

**Implementation**:
```typescript
// src/lib/graph-io.ts
async function loadGraphTasks(projectRoot: string): Promise<GraphTasksState> {
  const filePath = getEffectivePaths(projectRoot).graphTasks
  if (!existsSync(filePath)) return EMPTY_TASKS_STATE
  
  const raw = await readFile(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as unknown
  
  // Use .catch() to quarantine invalid nodes
  const result = GraphTasksStateSchema.safeParse(parsed)
  if (!result.success) {
    // Extract valid tasks, quarantine invalid
    const validTasks: TaskNode[] = []
    const orphanTasks: unknown[] = []
    
    if (Array.isArray((parsed as any)?.tasks)) {
      for (const task of (parsed as any).tasks) {
        const taskResult = TaskNodeSchema.safeParse(task)
        if (taskResult.success) {
          validTasks.push(taskResult.data)
        } else {
          orphanTasks.push(task)
        }
      }
    }
    
    // Write orphans to quarantine
    if (orphanTasks.length > 0) {
      await writeFile(
        getEffectivePaths(projectRoot).graphOrphans,
        JSON.stringify({ quarantined_at: new Date().toISOString(), tasks: orphanTasks }, null, 2)
      )
    }
    
    return { version: GRAPH_STATE_VERSION, tasks: validTasks }
  }
  
  return result.data
}
```

**Verification**: Corrupt tasks.json — agent still boots, orphans quarantined.

---

### P1-1: 80% Splitter Mid-Thought Amnesia Fix

**Problem**: At 80% capacity, splitter packs Graph State XML but **drops Short-Term Conversational Tail**. If user gave nuanced instruction in Turn 49, Turn 0 of new session has no idea.

**Solution**: Capture last 6 messages as `<recent_dialogue>`.

**Affected User Stories**: PATCH-US-020

**Implementation**:
```typescript
// src/lib/session-swarm.ts
async function splitSession(client: OpenCodeClient, messages: Message[]): Promise<void> {
  const packedXml = packCognitiveState(directory)
  
  // Capture last 6 messages (3 user/assistant exchanges)
  const recentMessages = messages.slice(-6)
  const dialogueXml = recentMessages.map(m => 
    `<message role="${m.role}">${m.content}</message>`
  ).join('\n')
  
  const turn0Content = `
${packedXml}

<recent_dialogue>
${dialogueXml}
</recent_dialogue>
`
  
  await client.session.create()
  await client.session.prompt({ content: turn0Content, noReply: true })
}
```

**Verification**: Split at Turn 50 — new session remembers Turn 49 instruction.

---

### P1-2: Time Machine Anti-Pattern Preservation

**Problem**: Completely hiding agent's failures causes **amnesia loop** — agent repeats same failing approach, burning tokens.

**Solution**: Compress false_path nodes to `<anti_patterns>` instead of dropping.

**Affected User Stories**: PATCH-US-011

**Implementation**:
```typescript
// src/lib/cognitive-packer.ts
function buildAntiPatternsBlock(falsePaths: MemNode[]): string {
  if (falsePaths.length === 0) return ''
  
  const compressed = falsePaths.slice(0, 3).map(fp => 
    `<avoid task="${fp.origin_task_id || 'unknown'}">${fp.content.slice(0, 100)}</avoid>`
  ).join('\n')
  
  return `<anti_patterns>\n${compressed}\n</anti_patterns>`
}
```

**Verification**: Agent sees why previous approach failed.

---

### P1-3: Tool ID Echo

**Problem**: Tool returns `"Success"` without generated UUID. Agent can't attach memory to created task.

**Solution**: Tools MUST echo generated UUID.

**Affected User Stories**: PATCH-US-009

**Implementation**:
```typescript
// src/lib/tool-response.ts
export function toSuccessOutput(entityId?: string): string {
  if (entityId) {
    return JSON.stringify({ status: 'success', entity_id: entityId })
  }
  return JSON.stringify({ status: 'success' })
}

export function toErrorOutput(error: string): string {
  return JSON.stringify({ status: 'error', error })
}
```

**Verification**: `addGraphTask` returns UUID, agent uses it in next `save_mem` call.

---

### P1-4: Dynamic XML Budget

**Problem**: 2000-char hardcoded budget is too small for dense relational graph (~500 tokens). Causes context starvation.

**Solution**: Budget = 10-15% of model's context window.

**Affected User Stories**: PATCH-US-013

**Implementation**:
```typescript
// src/lib/cognitive-packer.ts
interface PackOptions {
  budget?: number  // Default: 15000 (was 2000)
  contextWindow?: number  // e.g., 128000 for Claude
}

export function packCognitiveState(
  projectRoot: string, 
  options?: PackOptions
): string {
  const contextWindow = options?.contextWindow ?? 128000
  const budget = options?.budget ?? Math.floor(contextWindow * 0.12)  // 12% = ~15000 chars
  // ...
}
```

**Verification**: Packed XML contains more mems, agent has better context.

---

## Patch Implementation Order

```
P0-1 (Concurrency) ────► P0-3 (Fault Tolerance)
         │
         └────────────────► US-021 (Swarms) ──► P1-1 (Amnesia Fix)
                                   │
                                   └──────────────► US-048 (Dashboard)
                                                          │
P0-2 (Runtime IPC) ──────────────────────────────────────┘

P1-2 (Anti-Pattern) ──► P1-4 (Budget) ──► P1-3 (ID Echo) [Independent track]
```

**Risk Assessment**:
| Patch | Risk if Skipped | Severity |
|-------|-----------------|----------|
| P0-1 | Data loss, corruption | CRITICAL |
| P0-2 | Cross-process crashes | CRITICAL |
| P0-3 | Agent paralysis on bad JSON | CRITICAL |
| P1-1 | Context amnesia | HIGH |
| P1-2 | Infinite retry loops | HIGH |
| P1-3 | FK chaining impossible | HIGH |
| P1-4 | Context starvation | MEDIUM |

---

## Appendix: The God Prompts (Copy-Paste Sequential Execution)

### God Prompt 1: Graph Database & Dumb Tool Diet
> You are transitioning HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by the OpenCode SDK. We are enforcing CQRS: Tools are WRITE-ONLY. Hooks are READ-AUTO.
>
> **MISSION: GRAPH SCHEMAS & TOOL DIET**
> 1. Build `src/schemas/graph-nodes.ts` (Zod) — strict relational schemas, all IDs UUIDs: TrajectoryNode, PlanNode, PhaseNode, TaskNode (parent_phase_id FK), MemNode (origin_task_id FK, type: "insight"|"false_path", staleness_stamp)
> 2. The "Dumb Tool" Refactor — extract ALL business logic from src/tools/ into src/lib/ engine files. Tools must ONLY define Zod schema + call lib + return string. ≤100 lines each.
>
> **CRITICAL SAFETY**: Tools that create nodes MUST echo the generated UUID back to the agent in the success string so it can chain relational FKs. All `graph-io.ts` reads must be fault-tolerant; invalid nodes go to quarantine, they do NOT crash the read loop.

### God Prompt 2: The Cognitive Packer
> Build `src/lib/cognitive-packer.ts` — a deterministic Context Compiler (Repomix-for-State).
> `packCognitiveState(sessionId)`: reads trajectory.json Read-Head → traverses graph via FK → Time Machine prunes false_path/invalidated → TTS filters stale mems → compresses to `<hivemind_state>` XML.
> This file contains NO LLM prompts and NO tool definitions. Pure subconscious data-structuring.
>
> **CRITICAL SAFETY**: Do not permanently delete `false_path` nodes in the Time Machine filter. Compress them into an `<anti_patterns>` XML block so the agent does not repeat its mistakes. The budget cap must be at least 15,000 characters (10-15% of context window), NOT a hardcoded 2000 characters.

### God Prompt 3: SDK Mid-Turn Injection & Pre-Stop Gate
> Wire `cognitive-packer.ts` output into the LLM cognition loop via OpenCode SDK.
> Hook `experimental.chat.messages.transform`: push TWO `synthetic: true` parts: (1) packCognitiveState XML, (2) Pre-Stop Gate checklist forcing hierarchy/artifact/commit verification before stopping.
> Refactor session-lifecycle.ts from 586L → ≤200L by replacing ad-hoc assembly with packer call.

### God Prompt 4: Session Swarms & The 80% Split
> Build `src/lib/session-swarm.ts` — SDK session manipulation + Actor Model.
> (1) 80% Splitter: monitor token pressure → packCognitiveState → client.session.create() → noReply inject XML as Turn 0.
> (2) Headless Researcher: spawnHeadlessResearcher(client, parentId, prompt) → sub-session saves findings to graph/mems.json.
> Migrate flat .hivemind/ → graph/ with auto-trigger + dual-read backward compat.
>
> **CRITICAL SAFETY**: You MUST implement a File Mutex queue in `graph-io.ts` for all writes to prevent Lost Updates when Headless Researchers concurrently write alongside the main thread. Use `proper-lockfile` with retries=5, stale=10000ms. The 80% split MUST carry over the last 6 conversational messages alongside the XML so the agent does not suffer immediate short-term amnesia.
