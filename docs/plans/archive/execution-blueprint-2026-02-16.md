# HiveMind v3.0 — Two-Team Execution Blueprint
## Generated: 2026-02-16 | Session: ses_39cf3fca9ffemFpeNgt9oC23kC

---

## Executive Summary

**Scope**: 68 files, ~9,000 lines of changes
**Teams**: LOCAL (infrastructure/core) + JULES (cloud/integration)
**Duration**: 6 phases with auto-gating at each integration point
**Verification**: Continuous until 100% green

---

## Team Assignments

### LOCAL Team Responsibilities
- **Phase 1A**: Graph schemas (Zod) + FK validation
- **Phase 1B**: Dumb Tool Diet — extract ALL business logic to libs
- **Phase 2B**: Graph I/O CRUD layer
- **Phase 4A**: Migration engine (flat → graph)
- **Phase 4B**: Session Swarm (Actor Model)
- **Phase 5B**: Delete DEAD/ORPHAN tools

### JULES Team Responsibilities
- **Phase 1A**: Zod schema validation helpers
- **Phase 2A**: Cognitive Packer (Repomix-for-State)
- **Phase 2C**: Staleness engine (TTS + Time Machine)
- **Phase 3**: SDK Hook Injection + Pre-Stop Gate
- **Phase 5A**: Wire canonical unified tools
- **Phase 6**: Integration testing

### SHARED Responsibilities
- **Phase 5C**: Documentation updates
- **Phase 6**: Full regression testing

---

## Phase 1: Graph Schemas & Dumb Tool Diet

### 1A. Graph Schemas (Zod) — LOCAL + JULES

**New Files to Create**:

```
src/schemas/graph-nodes.ts          # LOCAL — Core node schemas
src/schemas/graph-state.ts          # LOCAL — Aggregate types
src/schemas/validation.ts           # JULES — FK validation helpers
src/lib/paths.ts (update)           # LOCAL — Add graph paths
```

**Schema Definitions** (src/schemas/graph-nodes.ts):

```typescript
// TrajectoryNode — The "Read-Head"
export const TrajectoryNodeSchema = z.object({
  id: z.string().uuid(),
  active_plan_id: z.string().uuid().nullable(),
  active_phase_id: z.string().uuid().nullable(),
  active_task_ids: z.array(z.string().uuid()),
  intent_shift_stamp: z.string().datetime().nullable(),
  updated_at: z.string().datetime(),
});

// PlanNode — Epics
export const PlanNodeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  sot_document_path: z.string(),
  status: z.enum(["draft", "active", "completed", "archived"]),
  phases: z.array(z.lazy(() => PhaseNodeSchema)),
  created_at: z.string().datetime(),
});

// PhaseNode — Plan phases
export const PhaseNodeSchema = z.object({
  id: z.string().uuid(),
  parent_plan_id: z.string().uuid(), // FK to PlanNode
  title: z.string().min(1).max(200),
  status: z.enum(["pending", "active", "completed", "blocked"]),
  order: z.number().int().min(0),
});

// TaskNode — Execution units
export const TaskNodeSchema = z.object({
  id: z.string().uuid(),
  parent_phase_id: z.string().uuid(), // FK to PhaseNode
  type: z.enum(["main", "sub"]),
  title: z.string().min(1).max(300),
  status: z.enum(["pending", "active", "complete", "blocked"]),
  assigned_session_id: z.string().uuid().nullable(),
  file_locks: z.array(z.string()),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
});

// MemNode — Knowledge units
export const MemNodeSchema = z.object({
  id: z.string().uuid(),
  origin_task_id: z.string().uuid().nullable(), // FK to TaskNode
  shelf: z.enum(["decisions", "cycle-intel", "false-paths", "patterns", "errors"]),
  content: z.string().min(1).max(5000),
  type: z.enum(["insight", "false_path"]),
  tags: z.array(z.string()),
  staleness_stamp: z.string().datetime(), // created_at + 72h
  relevance_score: z.number().min(0).max(1).default(0.5),
  session_id: z.string().uuid(),
  created_at: z.string().datetime(),
});
```

**FK Validation Helpers** (src/schemas/validation.ts):

```typescript
export function validateParentExists<T extends { id: string }>(
  parentId: string | null | undefined,
  collection: T[],
  context: string
): void {
  if (!parentId) return;
  const exists = collection.some(item => item.id === parentId);
  if (!exists) {
    throw new ValidationError(
      `${context}: Parent with id ${parentId} does not exist`
    );
  }
}

export function validateOrphanFree<T extends { id: string; parent_id?: string }>(
  nodes: T[],
  context: string
): void {
  const ids = new Set(nodes.map(n => n.id));
  const orphans = nodes.filter(n => n.parent_id && !ids.has(n.parent_id));
  if (orphans.length > 0) {
    throw new ValidationError(
      `${context}: Found ${orphans.length} orphaned nodes`
    );
  }
}
```

**Paths Update** (src/lib/paths.ts additions):

```typescript
export interface HivemindPaths {
  // ... existing paths ...
  graphDir: string;
  graphTrajectory: string;
  graphPlans: string;
  graphTasks: string;
  graphMems: string;
}

export function getGraphPaths(projectRoot: string) {
  const base = getEffectivePaths(projectRoot);
  return {
    graphDir: join(base.hivemind, "graph"),
    graphTrajectory: join(base.hivemind, "graph", "trajectory.json"),
    graphPlans: join(base.hivemind, "graph", "plans.json"),
    graphTasks: join(base.hivemind, "graph", "tasks.json"),
    graphMems: join(base.hivemind, "graph", "mems.json"),
  };
}
```

---

### 1B. The "Dumb Tool" Refactor — LOCAL

**Extraction Target**: Move ALL business logic from tools/ to lib/

| Tool File | Lines | Extract To | Functions to Extract | Target Lines |
|-----------|-------|------------|---------------------|--------------|
| `compact-session.ts` | 440 | `src/lib/compaction-engine.ts` | `identifyTurningPoints()`, `generateNextCompactionReport()`, `executeCompaction()` | <100 |
| `scan-hierarchy.ts` | 425 | `src/lib/brownfield-scan.ts` | `executeOrchestration()`, `scanProject()`, `generateRecommendations()` | <100 |
| `map-context.ts` | 226 | `src/lib/hierarchy-tree.ts` (extend) | `updateHierarchyNode()`, `navigateTree()` | <80 |
| `think-back.ts` | 157 | `src/lib/context-refresh.ts` (NEW) | `refreshContext()`, `formatAncestry()` | <80 |
| `declare-intent.ts` | 156 | `src/lib/session-init.ts` (NEW) | `initializeSession()`, `createTreeRoot()` | <80 |
| `hierarchy.ts` | 155 | `src/lib/hierarchy-prune.ts` (NEW) | `pruneBranches()`, `migrateHierarchy()` | <80 |
| `export-cycle.ts` | 151 | `src/lib/cycle-capture.ts` (NEW) | `captureCycle()`, `formatCycleJSON()` | <80 |
| `recall-mems.ts` | 134 | `src/lib/mem-search.ts` (NEW) | `searchMems()`, `filterByShelf()` | <80 |
| `save-anchor.ts` | 104 | `src/lib/anchors.ts` (extend) | Already mostly extracted | <80 |

**Example Extraction** (compact-session.ts → compaction-engine.ts):

```typescript
// BEFORE: src/tools/compact-session.ts (440 lines)
export function createCompactSessionTool(directory: string) {
  return tool({
    name: "compact_session",
    description: "...",
    args: z.object({ summary: z.string().optional() }),
    execute: async ({ summary }) => {
      // 300+ lines of business logic inline!
      const turningPoints = identifyTurningPoints(tree, metrics);
      const report = generateNextCompactionReport(turningPoints);
      await executeCompaction(report);
      return "Session compacted";
    }
  });
}

function identifyTurningPoints(tree, metrics) { /* 87 lines */ }
function generateNextCompactionReport(points) { /* 120 lines */ }
function executeCompaction(report) { /* 90 lines */ }

// AFTER: src/tools/compact-session.ts (<100 lines)
import { executeCompaction } from "../lib/compaction-engine.js";

export function createCompactSessionTool(directory: string) {
  return tool({
    name: "compact_session",
    description: "...",
    args: z.object({ summary: z.string().optional() }),
    execute: async ({ summary }) => {
      const result = await executeCompaction(directory, { summary });
      return toJsonOutput(result);
    }
  });
}

// NEW: src/lib/compaction-engine.ts
export interface CompactionResult {
  turningPoints: TurningPoint[];
  report: CompactionReport;
  archived: string;
}

export async function executeCompaction(
  directory: string,
  options: { summary?: string }
): Promise<CompactionResult> {
  const tree = await loadHierarchyTree(directory);
  const metrics = await loadMetrics(directory);
  const turningPoints = identifyTurningPoints(tree, metrics);
  const report = generateNextCompactionReport(turningPoints);
  const archived = await archiveSession(directory, report, options.summary);
  return { turningPoints, report, archived };
}

export function identifyTurningPoints(
  tree: HierarchyTree,
  metrics: MetricsState
): TurningPoint[] { /* extracted logic */ }

export function generateNextCompactionReport(
  points: TurningPoint[]
): CompactionReport { /* extracted logic */ }
```

---

## Phase 2: The Cognitive Packer

### 2A. Cognitive Packer — JULES

**New File**: `src/lib/cognitive-packer.ts`

**Core Function**:

```typescript
export interface PackedState {
  xml: string;
  budgetUsed: number;
  budgetTotal: number;
  dropped: {
    stale: number;
    falsePath: number;
    lowRelevance: number;
  };
}

export async function packCognitiveState(
  directory: string,
  sessionId: string,
  options: {
    budgetChars?: number;
    includeFullMems?: boolean;
  } = {}
): Promise<PackedState> {
  const budget = options.budgetChars ?? 2000;
  
  // Step 1: Read trajectory (the "Read-Head")
  const trajectory = await loadTrajectory(directory);
  
  // Step 2: Resolve active chain via FK traversal
  const activePlan = trajectory.active_plan_id
    ? await loadPlan(directory, trajectory.active_plan_id)
    : null;
  const activePhase = trajectory.active_phase_id
    ? await loadPhase(directory, trajectory.active_phase_id)
    : null;
  const activeTasks = await Promise.all(
    trajectory.active_task_ids.map(id => loadTask(directory, id))
  );
  
  // Step 3: Load linked memories via FK
  const linkedMems = await loadLinkedMems(directory, trajectory.active_task_ids);
  
  // Step 4: Time Machine — drop false_path + invalidated
  const cleanTasks = activeTasks.filter(t => t.status !== "invalidated");
  const cleanMems = linkedMems.filter(m => m.type !== "false_path");
  
  // Step 5: TTS Filter — drop stale mems (unless linked to active task)
  const now = new Date();
  const freshMems = cleanMems.filter(m => {
    if (trajectory.active_task_ids.includes(m.origin_task_id ?? "")) {
      return true; // Always keep mems linked to active tasks
    }
    const staleDate = new Date(m.staleness_stamp);
    return staleDate > now;
  });
  
  // Step 6: Sort by relevance score, take top until budget
  const sortedMems = freshMems.sort((a, b) => b.relevance_score - a.relevance_score);
  const includedMems: MemNode[] = [];
  let remainingBudget = budget;
  
  // Reserve budget for core structure
  const coreXml = generateCoreXml(trajectory, activePlan, activePhase, cleanTasks);
  remainingBudget -= coreXml.length;
  
  // Fill remaining with mems
  for (const mem of sortedMems) {
    const memXml = serializeMem(mem, options.includeFullMems);
    if (memXml.length <= remainingBudget) {
      includedMems.push(mem);
      remainingBudget -= memXml.length;
    } else {
      break;
    }
  }
  
  // Step 7: Generate XML
  const xml = generateHivemindXml({
    trajectory,
    activePlan,
    activePhase,
    tasks: cleanTasks,
    mems: includedMems,
    budget: {
      used: budget - remainingBudget,
      total: budget,
    },
  });
  
  return {
    xml,
    budgetUsed: budget - remainingBudget,
    budgetTotal: budget,
    dropped: {
      stale: cleanMems.length - freshMems.length,
      falsePath: linkedMems.length - cleanMems.length,
      lowRelevance: freshMems.length - includedMems.length,
    },
  };
}

function generateHivemindXml(state: PackedStateInput): string {
  const timestamp = new Date().toISOString();
  return `<hivemind_state timestamp="${timestamp}" session="${state.trajectory.id}" compaction="#${state.compactionCount}">
  <trajectory intent="${state.trajectory.intent}" plan="${state.activePlan?.title ?? "none"}" phase="${state.activePhase?.title ?? "none"}" active_tasks="${state.tasks.length}" />
  <active_tasks>
    ${state.tasks.map(t => `<task id="${t.id}" parent_phase="${t.parent_phase_id}" status="${t.status}" files="${t.file_locks.length}">${t.title}</task>`).join("\n    ")}
  </active_tasks>
  <relevant_mems count="${state.mems.length}" stale_dropped="${state.dropped.stale}" false_path_pruned="${state.dropped.falsePath}">
    ${state.mems.map(m => `<mem id="${m.id}" shelf="${m.shelf}" stale_in="${calculateStaleIn(m)}" origin_task="${m.origin_task_id ?? "null"}">${m.content.substring(0, 100)}...</mem>`).join("\n    ")}
  </relevant_mems>
  <anchors>
    ${state.anchors.map(a => `<anchor key="${a.key}" age="${calculateAge(a)}">${a.value}</anchor>`).join("\n    ")}
  </anchors>
  <governance drift="${state.metrics.drift}" turns="${state.metrics.turns}" violations="${state.metrics.violations}" health="${state.metrics.health}" />
</hivemind_state>`;
}
```

---

### 2B. Graph I/O Layer — LOCAL

**New File**: `src/lib/graph-io.ts`

```typescript
import { TrajectoryNode, PlanNode, PhaseNode, TaskNode, MemNode } from "../schemas/graph-nodes.js";
import { getGraphPaths } from "./paths.js";
import { atomicWrite } from "./persistence.js";

// Trajectory CRUD
export async function loadTrajectory(directory: string): Promise<TrajectoryNode> {
  const paths = getGraphPaths(directory);
  const data = await readJson(paths.graphTrajectory);
  return TrajectoryNodeSchema.parse(data);
}

export async function saveTrajectory(
  directory: string,
  trajectory: TrajectoryNode
): Promise<void> {
  const paths = getGraphPaths(directory);
  const validated = TrajectoryNodeSchema.parse(trajectory);
  await atomicWrite(paths.graphTrajectory, JSON.stringify(validated, null, 2));
}

// Plans CRUD
export async function loadPlans(directory: string): Promise<PlanNode[]> {
  const paths = getGraphPaths(directory);
  const data = await readJson(paths.graphPlans);
  return z.array(PlanNodeSchema).parse(data);
}

export async function savePlans(directory: string, plans: PlanNode[]): Promise<void> {
  const paths = getGraphPaths(directory);
  const validated = z.array(PlanNodeSchema).parse(plans);
  await atomicWrite(paths.graphPlans, JSON.stringify(validated, null, 2));
}

export async function loadPlan(directory: string, id: string): Promise<PlanNode | null> {
  const plans = await loadPlans(directory);
  return plans.find(p => p.id === id) ?? null;
}

// Tasks CRUD
export async function loadGraphTasks(directory: string): Promise<TaskNode[]> {
  const paths = getGraphPaths(directory);
  const data = await readJson(paths.graphTasks);
  return z.array(TaskNodeSchema).parse(data);
}

export async function addGraphTask(
  directory: string,
  task: Omit<TaskNode, "id" | "created_at">
): Promise<TaskNode> {
  const tasks = await loadGraphTasks(directory);
  const newTask: TaskNode = {
    ...task,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  tasks.push(newTask);
  await saveGraphTasks(directory, tasks);
  return newTask;
}

export async function invalidateTask(directory: string, id: string): Promise<void> {
  const tasks = await loadGraphTasks(directory);
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = "invalidated";
    await saveGraphTasks(directory, tasks);
  }
}

// Mems CRUD
export async function loadGraphMems(directory: string): Promise<MemNode[]> {
  const paths = getGraphPaths(directory);
  const data = await readJson(paths.graphMems);
  return z.array(MemNodeSchema).parse(data);
}

export async function addGraphMem(
  directory: string,
  mem: Omit<MemNode, "id" | "created_at" | "staleness_stamp">
): Promise<MemNode> {
  const mems = await loadGraphMems(directory);
  const now = new Date();
  const newMem: MemNode = {
    ...mem,
    id: crypto.randomUUID(),
    created_at: now.toISOString(),
    staleness_stamp: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(),
  };
  mems.push(newMem);
  await saveGraphMems(directory, mems);
  return newMem;
}

export async function flagFalsePath(directory: string, id: string): Promise<void> {
  const mems = await loadGraphMems(directory);
  const mem = mems.find(m => m.id === id);
  if (mem) {
    mem.type = "false_path";
    await saveGraphMems(directory, mems);
  }
}

export async function loadLinkedMems(
  directory: string,
  taskIds: string[]
): Promise<MemNode[]> {
  const mems = await loadGraphMems(directory);
  return mems.filter(m => taskIds.includes(m.origin_task_id ?? ""));
}
```

---

### 2C. Staleness Engine — JULES

**New File**: `src/lib/staleness.ts` (enhancement)

```typescript
export interface StalenessConfig {
  defaultTtlHours: number;
  activeTaskExtensionHours: number;
  maxRelevanceBoost: number;
}

export function isMemStale(
  mem: MemNode,
  activeTaskIds: string[],
  config: StalenessConfig
): boolean {
  // Mems linked to active tasks never go stale
  if (mem.origin_task_id && activeTaskIds.includes(mem.origin_task_id)) {
    return false;
  }
  
  const now = new Date();
  const staleDate = new Date(mem.staleness_stamp);
  return staleDate <= now;
}

export function calculateRelevanceScore(
  mem: MemNode,
  trajectory: TrajectoryNode
): number {
  let score = mem.relevance_score;
  
  // Boost if linked to active task
  if (mem.origin_task_id && trajectory.active_task_ids.includes(mem.origin_task_id)) {
    score += 0.3;
  }
  
  // Boost recent mems
  const ageHours = (Date.now() - new Date(mem.created_at).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) {
    score += 0.2;
  }
  
  // Boost decision mems
  if (mem.shelf === "decisions") {
    score += 0.15;
  }
  
  return Math.min(score, 1.0);
}

export function pruneContaminated(
  mems: MemNode[],
  tasks: TaskNode[]
): { clean: MemNode[]; pruned: MemNode[] } {
  const invalidatedTaskIds = new Set(
    tasks.filter(t => t.status === "invalidated").map(t => t.id)
  );
  
  const clean: MemNode[] = [];
  const pruned: MemNode[] = [];
  
  for (const mem of mems) {
    // Prune false paths
    if (mem.type === "false_path") {
      pruned.push(mem);
      continue;
    }
    
    // Prune mems linked to invalidated tasks
    if (mem.origin_task_id && invalidatedTaskIds.has(mem.origin_task_id)) {
      pruned.push(mem);
      continue;
    }
    
    clean.push(mem);
  }
  
  return { clean, pruned };
}
```

---

## Phase 3: SDK Hook Injection

### 3A. Messages Transform Hook — JULES

**Modified File**: `src/hooks/messages-transform.ts`

```typescript
import { packCognitiveState } from "../lib/cognitive-packer.js";

export function createMessagesTransformHook(directory: string) {
  return {
    name: "experimental.chat.messages.transform",
    handler: async (
      input: { sessionID: string; messages: Message[] },
      output: { parts: Part[] }
    ) => {
      const lastMessage = input.messages[input.messages.length - 1];
      
      // Only inject on user messages
      if (lastMessage.role !== "user") return;
      
      // 1. Context Injection — call Cognitive Packer
      const packedState = await packCognitiveState(directory, input.sessionID, {
        budgetChars: 2000,
      });
      
      output.parts.push({
        type: "text",
        text: packedState.xml,
        synthetic: true,
      });
      
      // 2. Pre-Stop Gate Checklist
      output.parts.push({
        type: "text",
        text: `<system-reminder>BEFORE completing your turn, you MUST verify:
1. Is the hierarchy updated in the graph?
2. Are artifacts saved and linked?
3. Have you committed changes if threshold met?
If NO, DO NOT STOP. Execute required tools NOW.</system-reminder>`,
        synthetic: true,
      });
    },
  };
}
```

---

### 3B. Session Lifecycle Refactor — LOCAL + JULES

**Modified File**: `src/hooks/session-lifecycle.ts`

**Target**: Reduce from 586 lines to ≤200 lines

```typescript
// BEFORE: 586 lines of ad-hoc section assembly
// AFTER: ~180 lines using Cognitive Packer

import { packCognitiveState } from "../lib/cognitive-packer.js";

export async function buildLifecycleContext(
  directory: string,
  state: SessionState
): Promise<string[]> {
  const sections: string[] = [];
  
  // P-1: Read first lines (keep - bootstrap info)
  sections.push(await buildBootstrapBlock(directory));
  
  // P0-P2: Use Cognitive Packer instead of manual assembly
  const packedState = await packCognitiveState(directory, state.session.id, {
    budgetChars: 1500, // Reserve space for bootstrap
  });
  sections.push(packedState.xml);
  
  // Keep: Setup guidance, governance signals
  sections.push(buildSetupGuidance(state));
  sections.push(buildGovernanceBlock(state));
  
  return sections;
}
```

---

### 3C. Soft Governance Refactor — LOCAL

**Modified File**: `src/hooks/soft-governance.ts`

**Target**: Reduce from 670 lines to ≤400 lines

**Extract to**: `src/lib/session-split.ts`

```typescript
// NEW: src/lib/session-split.ts
export interface SplitRecommendation {
  shouldSplit: boolean;
  reason?: string;
  newSessionId?: string;
}

export async function maybeCreateNonDisruptiveSessionSplit(
  directory: string,
  state: SessionState,
  client: OpenCodeClient
): Promise<SplitRecommendation> {
  const contextPercent = estimateContextPercent(
    state.metrics.turn_count,
    state.config.compact_threshold
  );
  
  if (contextPercent < 80) {
    return { shouldSplit: false };
  }
  
  // Pack state for injection
  const packedState = await packCognitiveState(directory, state.session.id, {
    budgetChars: 2000,
  });
  
  // Create new session
  const newSessionId = crypto.randomUUID();
  await client.session.create({
    id: newSessionId,
    parentId: state.session.id,
  });
  
  // Inject packed state as Turn 0
  await client.session.prompt({
    sessionId: newSessionId,
    parts: [{ type: "text", text: packedState.xml }],
    noReply: true,
  });
  
  return {
    shouldSplit: true,
    reason: `Context at ${contextPercent}%, split at 80% threshold`,
    newSessionId,
  };
}
```

---

## Phase 4: Migration & Session Swarms

### 4A. Graph Migration Engine — LOCAL

**New File**: `src/lib/graph-migrate.ts`

```typescript
export interface MigrationResult {
  success: boolean;
  migrated: {
    trajectory: boolean;
    tasks: number;
    mems: number;
  };
  backups: string[];
  errors: string[];
}

export async function migrateToGraph(directory: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migrated: { trajectory: false, tasks: 0, mems: 0 },
    backups: [],
    errors: [],
  };
  
  try {
    // Check if already migrated
    const paths = getGraphPaths(directory);
    if (await fileExists(paths.graphTrajectory)) {
      return { ...result, success: true }; // Already migrated
    }
    
    // Create graph directory
    await mkdir(paths.graphDir, { recursive: true });
    
    // Migrate trajectory from brain.json
    const brain = await loadBrain(directory);
    const trajectory: TrajectoryNode = {
      id: crypto.randomUUID(),
      active_plan_id: null,
      active_phase_id: null,
      active_task_ids: [],
      intent_shift_stamp: null,
      updated_at: new Date().toISOString(),
    };
    
    if (brain.trajectory) {
      trajectory.active_task_ids = brain.trajectory.active_tasks?.map(() => crypto.randomUUID()) ?? [];
    }
    
    await saveTrajectory(directory, trajectory);
    result.migrated.trajectory = true;
    
    // Migrate tasks from tasks.json
    const oldTasks = await loadLegacyTasks(directory);
    const newTasks: TaskNode[] = oldTasks.map(t => ({
      id: crypto.randomUUID(),
      parent_phase_id: "", // Will be linked later
      type: t.type === "sub" ? "sub" : "main",
      title: t.content ?? "Untitled",
      status: t.status ?? "pending",
      assigned_session_id: null,
      file_locks: t.file_locks ?? [],
      created_at: new Date(t.timestamp).toISOString(),
      completed_at: t.status === "complete" ? new Date(t.timestamp).toISOString() : null,
    }));
    
    await saveGraphTasks(directory, newTasks);
    result.migrated.tasks = newTasks.length;
    
    // Migrate mems from mems.json
    const oldMems = await loadLegacyMems(directory);
    const newMems: MemNode[] = oldMems.map(m => {
      const createdAt = new Date(m.created_at);
      return {
        id: crypto.randomUUID(),
        origin_task_id: null, // Flat mems have no task link
        shelf: m.shelf ?? "insights",
        content: m.content,
        type: "insight",
        tags: m.tags ?? [],
        staleness_stamp: new Date(createdAt.getTime() + 72 * 60 * 60 * 1000).toISOString(),
        relevance_score: 0.5,
        session_id: m.session_id ?? "",
        created_at: createdAt.toISOString(),
      };
    });
    
    await saveGraphMems(directory, newMems);
    result.migrated.mems = newMems.length;
    
    // Create backups
    result.backups = await createBackups(directory, [
      "state/brain.json",
      "memory/mems.json",
      "tasks.json",
    ]);
    
    result.success = true;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }
  
  return result;
}

// Dual-read strategy helper
export async function loadTasksWithFallback(directory: string): Promise<TaskNode[]> {
  try {
    return await loadGraphTasks(directory);
  } catch {
    // Fallback to legacy format
    return await loadLegacyTasks(directory);
  }
}
```

---

### 4B. Session Swarm (Actor Model) — LOCAL

**New File**: `src/lib/session-swarm.ts`

```typescript
export interface SwarmSession {
  id: string;
  parentId: string;
  purpose: string;
  status: "active" | "completed" | "failed";
  spawnedAt: string;
  completedAt?: string;
}

export interface EightyPercentSplit {
  triggered: boolean;
  oldSessionId: string;
  newSessionId: string;
  exportedContext: string;
}

/**
 * The 80% Splitter — Monitor session token pressure
 */
export async function splitAt80Percent(
  directory: string,
  state: SessionState,
  client: OpenCodeClient
): Promise<EightyPercentSplit> {
  const contextPercent = estimateContextPercent(
    state.metrics.turn_count,
    state.config.compact_threshold
  );
  
  if (contextPercent < 80) {
    return { triggered: false, oldSessionId: "", newSessionId: "", exportedContext: "" };
  }
  
  // Pack state for pure context export
  const packedState = await packCognitiveState(directory, state.session.id, {
    budgetChars: 2000,
  });
  
  // Save export to archive
  const exportPath = join(
    getEffectivePaths(directory).sessions,
    "archive",
    "splits",
    `${state.session.id}-${Date.now()}.xml`
  );
  await writeFile(exportPath, packedState.xml);
  
  // Create new session container
  const newSessionId = crypto.randomUUID();
  await client.session.create({
    id: newSessionId,
    parentId: state.session.id,
  });
  
  // Inject XML as Turn 0 with noReply
  await client.session.prompt({
    sessionId: newSessionId,
    parts: [{ type: "text", text: packedState.xml }],
    noReply: true,
  });
  
  return {
    triggered: true,
    oldSessionId: state.session.id,
    newSessionId,
    exportedContext: exportPath,
  };
}

/**
 * Headless Researcher — Spawn sub-session for background work
 */
export async function spawnHeadlessResearcher(
  client: OpenCodeClient,
  parentId: string,
  prompt: string,
  options: {
    originTaskId?: string;
    timeout?: number;
  } = {}
): Promise<SwarmSession> {
  const sessionId = crypto.randomUUID();
  
  // Create child session
  await client.session.create({
    id: sessionId,
    parentId,
  });
  
  // Construct research prompt with save instruction
  const researchPrompt = `${prompt}

When complete, save your findings using:
save_mem({
  shelf: "cycle-intel",
  content: "Your findings here",
  tags: ["research", "swarm"],
  ${options.originTaskId ? `origin_task_id: "${options.originTaskId}"` : ""}
})

Return: outcome (success/partial/failure) + 1-2 sentence summary.`;
  
  // Spawn with noReply (background execution)
  await client.session.prompt({
    sessionId,
    parts: [{ type: "text", text: researchPrompt }],
    noReply: true,
  });
  
  // Track in swarm registry
  const swarmSession: SwarmSession = {
    id: sessionId,
    parentId,
    purpose: prompt.substring(0, 100),
    status: "active",
    spawnedAt: new Date().toISOString(),
  };
  
  await trackSwarmSession(directory, swarmSession);
  
  return swarmSession;
}

async function trackSwarmSession(
  directory: string,
  session: SwarmSession
): Promise<void> {
  const swarmDir = join(getEffectivePaths(directory).sessions, "active", "swarms");
  await mkdir(swarmDir, { recursive: true });
  
  const swarmPath = join(swarmDir, `${session.id}.json`);
  await writeFile(swarmPath, JSON.stringify(session, null, 2));
}
```

---

## Phase 5: Tool Consolidation & Cleanup

### 5A. Wire Canonical Tools — JULES

**Modified File**: `src/tools/index.ts`

**Export 6 canonical unified tools** (strip business logic to libs in Phase 1B):

```typescript
// src/tools/index.ts — NEW EXPORTS

export { createHivemindSessionTool } from "./hivemind-session.js";
export { createHivemindInspectTool } from "./hivemind-inspect.js";
export { createHivemindMemoryTool } from "./hivemind-memory.js";
export { createHivemindAnchorTool } from "./hivemind-anchor.js";
export { createHivemindHierarchyTool } from "./hivemind-hierarchy.js";
export { createHivemindCycleTool } from "./hivemind-cycle.js";
```

**Tool Mappings** (OLD → NEW):

| Old Tool(s) | New Unified Tool | Functions |
|-------------|------------------|-----------|
| declare_intent + map_context + compact_session | hivemind_session | start/update/close/status/resume |
| scan_hierarchy + think_back | hivemind_inspect | scan/deep/drift |
| save_mem + recall_mems | hivemind_memory | save/recall/list |
| save_anchor | hivemind_anchor | save/list/get |
| hierarchy_manage | hivemind_hierarchy | prune/migrate/status |
| export_cycle | hivemind_cycle | export/list/prune |

**Example Unified Tool** (hivemind-session.ts):

```typescript
// AFTER REFACTOR: <100 lines, delegates to lib
import { startSession, updateSession, closeSession, getSessionStatus, resumeSession } from "../lib/session-engine.js";

export function createHivemindSessionTool(directory: string) {
  return tool({
    name: "hivemind_session",
    description: "Unified session management: start, update, close, status, resume",
    args: z.object({
      operation: z.enum(["start", "update", "close", "status", "resume"]),
      mode: z.enum(["plan_driven", "quick_fix", "exploration"]).optional(),
      focus: z.string().optional(),
      level: z.enum(["trajectory", "tactic", "action"]).optional(),
      content: z.string().optional(),
      status: z.enum(["pending", "active", "complete", "blocked"]).optional(),
      summary: z.string().optional(),
    }),
    execute: async (args) => {
      switch (args.operation) {
        case "start":
          return toJsonOutput(await startSession(directory, args));
        case "update":
          return toJsonOutput(await updateSession(directory, args));
        case "close":
          return toJsonOutput(await closeSession(directory, args));
        case "status":
          return toJsonOutput(await getSessionStatus(directory));
        case "resume":
          return toJsonOutput(await resumeSession(directory, args));
        default:
          throw new Error(`Unknown operation: ${args.operation}`);
      }
    },
  });
}
```

---

### 5B. Delete Old Tools — LOCAL

**Files to DELETE** (13 files):

```bash
# DEAD tools (6 files)
src/tools/hivemind-session.ts      # 669 lines
src/tools/hivemind-inspect.ts      # 433 lines
src/tools/hivemind-memory.ts       # 283 lines
src/tools/hivemind-anchor.ts       # 227 lines
src/tools/hivemind-hierarchy.ts    # 281 lines
src/tools/hivemind-cycle.ts        # 276 lines

# Old split tools (7 files) - replaced by unified tools
src/tools/declare-intent.ts        # 156 lines
src/tools/map-context.ts           # 226 lines
src/tools/compact-session.ts       # 440 lines
src/tools/scan-hierarchy.ts        # 424 lines
src/tools/save-anchor.ts           # 104 lines
src/tools/think-back.ts            # 157 lines
src/tools/hierarchy.ts             # 155 lines
src/tools/export-cycle.ts          # 151 lines
src/tools/recall-mems.ts           # 134 lines
src/tools/save-mem.ts              # 62 lines
src/tools/check-drift.ts           # 82 lines (orphan)
src/tools/list-shelves.ts          # 68 lines (orphan)
src/tools/self-rate.ts             # 86 lines (orphan)
```

**Total Lines Deleted**: ~3,400 lines

---

### 5C. Update References — SHARED

**Files to Update**:

```typescript
// src/tools/index.ts — Export only 6 canonical tools
export {
  createHivemindSessionTool,
  createHivemindInspectTool,
  createHivemindMemoryTool,
  createHivemindAnchorTool,
  createHivemindHierarchyTool,
  createHivemindCycleTool,
};

// src/index.ts — Register 6 tools (was 10)
import {
  createHivemindSessionTool,
  createHivemindInspectTool,
  createHivemindMemoryTool,
  createHivemindAnchorTool,
  createHivemindHierarchyTool,
  createHivemindCycleTool,
} from "./tools/index.js";

// In activate():
tools.register(createHivemindSessionTool(directory));
tools.register(createHivemindInspectTool(directory));
tools.register(createHivemindMemoryTool(directory));
tools.register(createHivemindAnchorTool(directory));
tools.register(createHivemindHierarchyTool(directory));
tools.register(createHivemindCycleTool(directory));

// src/lib/detection.ts — Update classifyTool()
function classifyTool(toolName: string): ToolCategory {
  const hivemindTools = [
    "hivemind_session",      // NEW
    "hivemind_inspect",      // NEW
    "hivemind_memory",       // NEW
    "hivemind_anchor",       // NEW
    "hivemind_hierarchy",    // NEW
    "hivemind_cycle",        // NEW
  ];
  // Remove old tool names from classification
}

// AGENTS.md — Update tool documentation
// README.md — Update examples
// CLI help text — Update descriptions
```

---

## Phase 6: Testing

### Test Files to Create — SHARED

```
tests/graph-nodes.test.ts          # Zod schema validation, FK constraints
tests/cognitive-packer.test.ts     # XML output, TTS filtering, Time Machine
tests/graph-io.test.ts             # CRUD, atomic writes, Zod validation
tests/graph-migrate.test.ts        # Old→new format, backup, dual-read
tests/session-engine.test.ts       # Extracted session logic
tests/compaction-engine.test.ts    # Extracted compaction logic
tests/inspect-engine.test.ts       # Extracted inspect logic
tests/session-swarm.test.ts        # 80% split, headless spawn, noReply
```

### Test Examples

```typescript
// tests/graph-nodes.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";
import { TrajectoryNodeSchema, TaskNodeSchema } from "../src/schemas/graph-nodes.js";

describe("Graph Node Schemas", () => {
  it("should validate valid trajectory node", () => {
    const valid = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      active_plan_id: null,
      active_phase_id: null,
      active_task_ids: [],
      intent_shift_stamp: null,
      updated_at: "2026-02-16T10:00:00Z",
    };
    assert.doesNotThrow(() => TrajectoryNodeSchema.parse(valid));
  });
  
  it("should reject invalid UUID", () => {
    const invalid = {
      id: "not-a-uuid",
      active_plan_id: null,
      active_phase_id: null,
      active_task_ids: [],
      intent_shift_stamp: null,
      updated_at: "2026-02-16T10:00:00Z",
    };
    assert.throws(() => TrajectoryNodeSchema.parse(invalid));
  });
});

// tests/cognitive-packer.test.ts
import { packCognitiveState } from "../src/lib/cognitive-packer.js";

describe("Cognitive Packer", () => {
  it("should pack state within budget", async () => {
    const packed = await packCognitiveState(testDir, "session-1", {
      budgetChars: 2000,
    });
    assert.ok(packed.xml.length <= 2000);
    assert.ok(packed.budgetUsed <= packed.budgetTotal);
  });
  
  it("should prune false_path mems", async () => {
    // Setup: create mem with type: "false_path"
    const packed = await packCognitiveState(testDir, "session-1");
    assert.ok(packed.dropped.falsePath > 0);
  });
  
  it("should keep mems linked to active tasks", async () => {
    // Setup: create mem linked to active task
    const packed = await packCognitiveState(testDir, "session-1");
    // Should not be in dropped.stale even if past staleness_stamp
  });
});
```

---

## Verification Commands — SHARED

```bash
# Type-check
npx tsc --noEmit

# Run all tests
npm test

# Source file audit
node bin/hivemind-tools.cjs source-audit

# Ecosystem health check
node bin/hivemind-tools.cjs ecosystem-check

# Full integration test
npm run test:integration
```

---

## Integration Points & Auto-Gating

### Gating Checkpoints

```
Phase 1A Complete (Zod Schemas)
    ↓
    Gate: All schemas validate? FK constraints enforced?
    ↓ YES
Phase 1B Complete (Dumb Tool Diet)
    ↓
    Gate: All tools <100 lines? Business logic in libs?
    ↓ YES
Phase 2 Complete (Cognitive Packer + Graph I/O)
    ↓
    Gate: Packer produces valid XML? Graph I/O atomic?
    ↓ YES
Phase 3 Complete (Hook Injection)
    ↓
    Gate: XML injects correctly? Pre-Stop Gate works?
    ↓ YES
Phase 4 Complete (Migration + Swarms)
    ↓
    Gate: Migration preserves data? Dual-read works? Swarms spawn?
    ↓ YES
Phase 5 Complete (Tool Consolidation)
    ↓
    Gate: All 6 tools callable? Old tools deleted? Tests pass?
    ↓ YES
Phase 6 Complete (Full Verification)
    ↓
    FINAL GATE: 100% tests green? Type check clean? Audit clean?
    ↓ YES
RELEASE v3.0.0
```

### Continuous Verification

After EVERY file change:
1. Run affected tests
2. Type-check
3. Update hierarchy
4. Export cycle

After EVERY phase:
1. Full test suite
2. Integration tests
3. Source audit
4. Update documentation

---

## Estimated Scope

| Phase | New Files | Modified | Deleted | Net Lines |
|-------|-----------|----------|---------|-----------|
| 1 (Schema+Diet) | 8 | 12 | 0 | +300 (schemas) ~0 (moves) |
| 2 (Packer) | 3 | 2 | 0 | +600 |
| 3 (Hooks) | 1 | 3 | 0 | -500 (slim hooks) |
| 4 (Migration+Swarms) | 2 | 4 | 0 | +500 |
| 5 (Consolidation) | 0 | 3 | 13 | -2,500 |
| 6 (Tests) | 8 | 10 | 0 | +1,000 |
| **Total** | **22** | **~34** | **13** | **~-600** |

**Final State**:
- 6 canonical tools (was 19)
- 0 tools >100 lines (was 13)
- 100% Zod validation coverage
- Full Actor Model support
- Cognitive Packer context injection

---

## Team Communication

### LOCAL Team Deliverables
1. Graph schemas with FK validation
2. Extracted library functions
3. Migration engine
4. Session swarm implementation
5. Deleted old tool files

### JULES Team Deliverables
1. Zod validation helpers
2. Cognitive Packer implementation
3. Staleness engine
4. SDK hook injection
5. Unified tool wiring
6. Test suite

### Shared Deliverables
1. Documentation updates
2. Integration tests
3. Verification reports
4. GitHub issues for tracking

---

## GitHub Issues Template

Create the following issues in the repo:

**Issue #1**: [LOCAL] Phase 1A: Graph Schemas & Zod Validation
**Issue #2**: [LOCAL] Phase 1B: Dumb Tool Diet — Business Logic Extraction
**Issue #3**: [JULES] Phase 2A: Cognitive Packer Implementation
**Issue #4**: [JULES] Phase 2C: Staleness Engine (TTS + Time Machine)
**Issue #5**: [JULES] Phase 3: SDK Hook Injection & Pre-Stop Gate
**Issue #6**: [LOCAL] Phase 4A: Graph Migration Engine
**Issue #7**: [LOCAL] Phase 4B: Session Swarm (Actor Model)
**Issue #8**: [JULES] Phase 5A: Wire Canonical Unified Tools
**Issue #9**: [LOCAL] Phase 5B: Delete Old Tool Files
**Issue #10**: [SHARED] Phase 6: Testing & Verification

---

## Next Steps

1. **LOCAL Team**: Start with Phase 1A (graph-nodes.ts schemas)
2. **JULES Team**: Start with Phase 2A (cognitive-packer.ts design)
3. **Both Teams**: Review this blueprint, ask questions, align on interfaces
4. **Coordinator**: Create GitHub issues, assign to teams
5. **Daily Sync**: 15-min standup to track progress, resolve blockers

**Success Criteria**: All gates green, 100% tests passing, type check clean, 6 canonical tools working.

---

*Blueprint generated by HiveMind Agent Build v3.0*
*Session: ses_39cf3fca9ffemFpeNgt9oC23kC*
*Timestamp: 2026-02-16*