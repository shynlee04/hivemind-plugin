---
title: "hivemind_task — Deep Responsibility Analysis"
date: 2026-03-31
agent: hivexplorer
scope: src/tools/task/, src/features/workflow/, src/core/workflow-management/
git_commit: 7da1d535
---

# hivemind_task — Deep Responsibility Analysis — 2026-03-31

## Responsibility Statement

The `hivemind_task` tool is the **canonical task and subtask authority** for HiveMind workflows. It manages the lifecycle of workflow-bound execution nodes — creating, inspecting, activating, rotating, verifying, and completing tasks. It exists to provide a single, durable, file-backed ledger of task state that agents can query and mutate during workflow execution, ensuring all task mutations are tracked, evidence-linked, and recoverable across sessions. The tool delegates all business logic to `src/features/workflow/task.ts` which in turn calls `src/core/workflow-management/task-lifecycle.ts` for disk I/O and state management.

---

## Actions

### create

- **Args:**
  - `action: 'create'` (required)
  - `workflowId: string` (required for mutation)
  - `taskId: string` (required for mutation)
  - `title?: string` — human-readable title override, defaults to `taskId`
  - `kind?: 'task' | 'subtask'` — defaults to `'task'`
  - `parentTaskId?: string` — parent task for subtask creation
  - `dependencyIds?: string` — comma-separated dependency IDs
  - `verificationContractId?: string` — verification contract reference
  - `evidenceRefs?: string` — comma-separated evidence references (not used in create)

- **Validation:**
  1. `workflowId` required — returns error if missing (`src/features/workflow/task.ts:69-71`)
  2. `taskId` required — returns error if missing (`src/features/workflow/task.ts:73-75`)
  3. Inspects workflow authority health (`src/features/workflow/task.ts:77-88`)
  4. If authority is unhealthy, bootstraps it first (`src/features/workflow/task.ts:96-101`)

- **Call chain:**
  ```
  tool.execute() → executeHivemindTaskAction() → inspectWorkflowAuthority()
    → [bootstrapWorkflowAuthority() if unhealthy]
    → createWorkflowTask() → readWorkflowTask() → return
  ```

- **Files read:**
  - `.hivemind/state/tasks.json` — via `loadLifecycleState()` (`src/core/workflow-management/task-lifecycle.ts:80-120`)
  - `.hivemind/graph/tasks.json` — via `inspectWorkflowAuthority()` (`src/core/workflow-management/workflow-authority.ts:57`)
  - `.hivemind/project/planning/` — authority check (`src/core/workflow-management/workflow-authority.ts:55`)

- **Files written:**
  - `.hivemind/state/tasks.json` — via `saveLifecycleState()` (`src/core/workflow-management/task-lifecycle.ts:122-130`)
  - `.hivemind/graph/tasks.json` — same content, dual-write (`src/core/workflow-management/task-lifecycle.ts:128`)
  - If bootstrapping: `.hivemind/project/planning/index.json`, `.hivemind/project/planning/project-state.json`, `.hivemind/project/planning/phases/00-control-plane/00-01-PLAN.md` (`src/core/workflow-management/workflow-authority.ts:156-183`)

- **Returns:**
  ```json
  {
    "status": "success",
    "message": "Created canonical workflow task",
    "data": {
      "result": { "activeTaskId": "...", "invalidatedTaskIds": [], "workflowVerificationState": "pending" },
      "task": { "id": "...", "workflowId": "...", "title": "...", "kind": "task", "status": "pending", ... },
      "pressureContract": { "id": "task-mutation", ... }
    },
    "metadata": {
      "title": "HiveMind task <taskId>",
      "metadata": { "action": "create", "workflowId": "...", "safetyLevel": "advisory" }
    }
  }
  ```

### list

- **Args:**
  - `action: 'list'` (required)
  - `workflowId?: string` — optional filter by workflow

- **Validation:** None beyond action enum. No workflowId required.

- **Call chain:**
  ```
  tool.execute() → executeHivemindTaskAction() → listWorkflowTasks()
    → readWorkflowTaskState() → loadLifecycleState() → filter by workflowId
  ```

- **Files read:**
  - `.hivemind/state/tasks.json` — via `loadLifecycleState()` (`src/core/workflow-management/task-lifecycle.ts:80-120`)

- **Files written:** None

- **Returns:**
  ```json
  {
    "status": "success",
    "message": "Listed canonical workflow tasks",
    "data": {
      "workflowId": "...",
      "tasks": [ { "id": "...", "workflowId": "...", "title": "...", "status": "...", ... } ],
      "pressureContract": { "id": "steady-state", ... }
    }
  }
  ```

### get

- **Args:**
  - `action: 'get'` (required)
  - `taskId: string` (required)

- **Validation:**
  1. `taskId` required — returns error if missing (`src/features/workflow/task.ts:50-51`)
  2. Task must exist — returns error if not found (`src/features/workflow/task.ts:55-56`)

- **Call chain:**
  ```
  tool.execute() → executeHivemindTaskAction() → readWorkflowTask()
    → loadLifecycleState() → find task by ID
  ```

- **Files read:**
  - `.hivemind/state/tasks.json` — via `loadLifecycleState()` (`src/core/workflow-management/task-lifecycle.ts:327-336`)

- **Files written:** None

- **Returns:**
  ```json
  {
    "status": "success",
    "message": "Loaded canonical workflow task",
    "data": {
      "task": { "id": "...", "workflowId": "...", "title": "...", "status": "...", ... },
      "pressureContract": { "id": "steady-state", ... }
    }
  }
  ```

### activate

- **Args:**
  - `action: 'activate'` (required)
  - `workflowId: string` (required)
  - `taskId: string` (required)
  - `title?: string`
  - `kind?: 'task' | 'subtask'`
  - `parentTaskId?: string`
  - `dependencyIds?: string` — comma-separated

- **Validation:**
  1. `workflowId` required (`src/features/workflow/task.ts:69-71`)
  2. `taskId` required (`src/features/workflow/task.ts:73-75`)
  3. Workflow authority must be healthy (`src/features/workflow/task.ts:82-88`)

- **Call chain:**
  ```
  tool.execute() → executeHivemindTaskAction() → inspectWorkflowAuthority()
    → activateWorkflowTask() → readWorkflowTask() → return
  ```

- **Files read:**
  - `.hivemind/state/tasks.json` — load state
  - `.hivemind/graph/tasks.json` — authority check

- **Files written:**
  - `.hivemind/state/tasks.json` — task status set to `'in_progress'`
  - `.hivemind/graph/tasks.json` — dual-write

- **Returns:**
  ```json
  {
    "status": "success",
    "message": "Activated canonical workflow task",
    "data": {
      "result": { "activeTaskId": "...", "invalidatedTaskIds": [], "workflowVerificationState": "pending" },
      "task": { ... },
      "pressureContract": { "id": "task-mutation", ... }
    }
  }
  ```

### rotate

- **Args:** Same as `activate`

- **Validation:** Same as `activate`

- **Call chain:**
  ```
  tool.execute() → executeHivemindTaskAction() → inspectWorkflowAuthority()
    → activateWorkflowTask(forceNewActive: true) → readWorkflowTask() → return
  ```

- **Key difference from activate:** When `forceNewActive: true`, any existing `in_progress` task with the same `workflowId`, `kind`, and `parentTaskId` is set to `'invalidated'` status (`src/core/workflow-management/task-lifecycle.ts:195-209`)

- **Files read:** `.hivemind/state/tasks.json`, `.hivemind/graph/tasks.json`
- **Files written:** `.hivemind/state/tasks.json`, `.hivemind/graph/tasks.json`

- **Returns:** Same structure as `activate`, with `invalidatedTaskIds` populated if a prior task was replaced

### verify

- **Args:**
  - `action: 'verify'` (required)
  - `workflowId: string` (required)
  - `taskId: string` (required)
  - `verificationContractId: string` (required — returns error if missing, `src/features/workflow/task.ts:152-154`)

- **Validation:**
  1. `workflowId` required
  2. `taskId` required
  3. `verificationContractId` required
  4. Workflow authority must be healthy

- **Call chain:**
  ```
  tool.execute() → executeHivemindTaskAction() → inspectWorkflowAuthority()
    → verifyWorkflowTask() → readWorkflowTask() → return
  ```

- **Files read:** `.hivemind/state/tasks.json`, `.hivemind/graph/tasks.json`
- **Files written:** `.hivemind/state/tasks.json`, `.hivemind/graph/tasks.json` — task status set to `'verifying'`

- **Returns:**
  ```json
  {
    "status": "success",
    "message": "Marked workflow task as verifying",
    "data": {
      "result": { "activeTaskId": "...", "invalidatedTaskIds": [], "workflowVerificationState": "verifying" },
      "task": { "status": "verifying", "verificationContractId": "...", ... },
      "pressureContract": { "id": "task-mutation", ... }
    }
  }
  ```

### complete

- **Args:**
  - `action: 'complete'` (required)
  - `workflowId: string` (required)
  - `taskId: string` (required)
  - `evidenceRefs?: string` — comma-separated evidence references

- **Validation:**
  1. `workflowId` required
  2. `taskId` required
  3. Workflow authority must be healthy

- **Call chain:**
  ```
  tool.execute() → executeHivemindTaskAction() → inspectWorkflowAuthority()
    → completeWorkflowTask() → readWorkflowTask() → return
  ```

- **Files read:** `.hivemind/state/tasks.json`, `.hivemind/graph/tasks.json`
- **Files written:** `.hivemind/state/tasks.json`, `.hivemind/graph/tasks.json` — task status set to `'complete'`, evidenceRefs merged with deduplication (`src/core/workflow-management/task-lifecycle.ts:312`)

- **Returns:**
  ```json
  {
    "status": "success",
    "message": "Completed canonical workflow task",
    "data": {
      "result": { "completedTaskId": "...", "invalidatedTaskIds": [], "workflowVerificationState": "validated" },
      "task": { "status": "complete", "evidenceRefs": [...], ... },
      "pressureContract": { "id": "task-mutation", ... }
    }
  }
  ```

---

## Data Model

### TaskRecord (`src/core/workflow-management/task-lifecycle.ts:10-21`)

```typescript
interface TaskRecord {
  id: string
  workflowId: string
  title: string
  kind: 'task' | 'subtask'
  status: 'pending' | 'in_progress' | 'blocked' | 'invalidated' | 'verifying' | 'complete'
  parentTaskId?: string
  dependencyIds: string[]
  verificationContractId?: string
  evidenceRefs: string[]
  updatedAt: string  // ISO 8601
}
```

### TaskLifecycleState (`src/core/workflow-management/task-lifecycle.ts:23-26`)

```typescript
interface TaskLifecycleState {
  version: string  // '1.0.0'
  tasks: TaskRecord[]
}
```

### TaskLifecycleResult (`src/core/workflow-management/task-lifecycle.ts:60-65`)

```typescript
interface TaskLifecycleResult {
  activeTaskId?: string
  completedTaskId?: string
  invalidatedTaskIds: string[]
  workflowVerificationState: 'pending' | 'verifying' | 'validated'
}
```

### HivemindTaskToolArgs (`src/tools/task/types.ts:13-23`)

```typescript
interface HivemindTaskToolArgs {
  action: 'create' | 'list' | 'get' | 'activate' | 'rotate' | 'verify' | 'complete'
  workflowId?: string
  taskId?: string
  title?: string
  kind?: 'task' | 'subtask'
  parentTaskId?: string
  dependencyIds?: string       // comma-separated
  verificationContractId?: string
  evidenceRefs?: string        // comma-separated
}
```

### Pressure Contracts (`src/tools/task/types.ts:25-33`)

| Action | Pressure Contract | Safety Level |
|--------|------------------|--------------|
| `create` | `task-mutation` | advisory |
| `list` | `steady-state` | steady |
| `get` | `steady-state` | steady |
| `activate` | `task-mutation` | advisory |
| `rotate` | `task-mutation` | advisory |
| `verify` | `task-mutation` | advisory |
| `complete` | `task-mutation` | advisory |

---

## Disk Format

### Primary Ledger: `.hivemind/state/tasks.json`

```json
{
  "version": "1.0.0",
  "tasks": [
    {
      "id": "task-1",
      "workflowId": "wf-1",
      "title": "Implement feature X",
      "kind": "task",
      "status": "in_progress",
      "parentTaskId": null,
      "dependencyIds": [],
      "verificationContractId": null,
      "evidenceRefs": [],
      "updatedAt": "2026-03-31T12:00:00.000Z"
    }
  ]
}
```

### Graph Projection: `.hivemind/graph/tasks.json`

Identical content to `state/tasks.json` — dual-written by `saveLifecycleState()` (`src/core/workflow-management/task-lifecycle.ts:122-130`).

### Authority Files (created by bootstrap)

- `.hivemind/project/planning/index.json` — workflow index
- `.hivemind/project/planning/project-state.json` — project state with lineage
- `.hivemind/project/planning/phases/00-control-plane/00-01-PLAN.md` — control plane anchor

---

## Test Coverage

### Direct Tests

| Test File | What It Tests | Coverage |
|-----------|--------------|----------|
| `tests/task-lifecycle-corruption.test.ts` | Corruption recovery for task ledger | Tests `readWorkflowTaskState`, `activateWorkflowTask`, `createWorkflowTask` with malformed JSON — verifies `CorruptionError` is surfaced, not silently masked |
| `tests/runtime-tools.test.ts:34` | Tool registration | Asserts `hivemind_task` is in `AUTHORITATIVE_RUNTIME_TOOL_IDS` |
| `tests/plugin-runtime.test.ts:376-383` | Tool execution tracking | Verifies `tool.execute.after` hook records `tool:hivemind_task:ses_123` event in trajectory ledger |
| `tests/plugin-assembly-smoke.test.ts:136` | Plugin assembly | Asserts `hivemind_task` is in registered tool IDs |

### Indirect Tests (references hivemind_task)

| Test File | What It Tests |
|-----------|--------------|
| `tests/unit/context-renderer/tool-precedence.test.ts:12,34,48-49,183` | Tool precedence chain rendering with `hivemind_task` entries |
| `src/features/event-tracker/markdown-writer.test.ts:234,239,527,536` | Markdown journal rendering of `hivemind_task` tool calls |
| `src/features/event-tracker/consolidated-writer.test.ts:185` | Consolidated writer with `hivemind_task` data |

### Gaps

- **No unit tests** for `executeHivemindTaskAction()` directly — the feature-level dispatcher
- **No tests** for `complete` action end-to-end
- **No tests** for `verify` action end-to-end
- **No tests** for `rotate` action (invalidation of prior tasks)
- **No tests** for `list` with workflowId filter
- **No tests** for dependency resolution or blocking behavior
- **No tests** for the `parseList()` helper used for comma-separated args

---

## Callers

### Plugin Assembly (Primary Caller)

- **`src/plugin/opencode-plugin.ts:128`** — Registers the tool as `hivemind_task` in the plugin's `tool` surface:
  ```typescript
  hivemind_task: createTaskTool(directory),
  ```
  This makes it callable by any agent session through the OpenCode tool interface.

### Tool Catalog

- **`src/tools/index.ts:39-46`** — Registered in `agentToolCatalog` with metadata:
  - `stateAuthority: 'workflow'`
  - `workflowPhase: 'tool-execution'`
  - `purposeClasses: ['implementation', 'gatekeeping', 'tdd', 'course-correction']`
  - `pressureContract: 'task-mutation'`

### Tool Governance

- **`src/hooks/runtime-loader/tool-governance.ts:10`** — Listed in `HIVEMIND_MANAGED_TOOLS` set, enabling:
  - Tool execution tracking via `recordToolEvent()` (`src/hooks/runtime-loader/tool-governance.ts:23-37`)
  - Trajectory event recording on `tool.execute.after` hook

### Event Tracker

- **`src/features/event-tracker/markdown-writer.test.ts:234`** — Tool calls are logged to markdown journals
- **`src/features/event-tracker/consolidated-writer.test.ts:185`** — Tool calls are written to consolidated event logs

### Context Renderer

- **`tests/unit/context-renderer/tool-precedence.test.ts`** — `hivemind_task` appears in tool precedence chains, used to guide agent execution order

### No Direct Feature Callers

No other feature module directly calls `executeHivemindTaskAction()` or `createHivemindTaskTool()`. The tool is exclusively agent-callable through the OpenCode plugin surface.

---

## Full Call Chain Summary

```
Agent calls hivemind_task
  │
  ├─ src/plugin/opencode-plugin.ts:128
  │   └─ createTaskTool(directory)
  │       │
  │       └─ src/tools/task/tools.ts:10-42
  │           └─ execute(args, context)
  │               │
  │               └─ executeHivemindTaskAction(projectRoot, args, { sessionID })
  │                   │
  │                   └─ src/features/workflow/task.ts:30-190
  │                       │
  │                       ├─ [list] → listWorkflowTasks()
  │                       ├─ [get]  → readWorkflowTask()
  │                       ├─ [create] → inspectWorkflowAuthority()
  │                       │             → [bootstrap if unhealthy]
  │                       │             → createWorkflowTask()
  │                       │             → readWorkflowTask()
  │                       ├─ [activate/rotate] → inspectWorkflowAuthority()
  │                       │                      → activateWorkflowTask()
  │                       │                      → readWorkflowTask()
  │                       ├─ [verify] → inspectWorkflowAuthority()
  │                       │             → verifyWorkflowTask()
  │                       │             → readWorkflowTask()
  │                       └─ [complete] → inspectWorkflowAuthority()
  │                                       → completeWorkflowTask()
  │                                       → readWorkflowTask()
  │
  │   All core functions in:
  │   └─ src/core/workflow-management/task-lifecycle.ts
  │       ├─ loadLifecycleState() → reads .hivemind/state/tasks.json
  │       ├─ saveLifecycleState() → writes .hivemind/state/tasks.json + .hivemind/graph/tasks.json
  │       ├─ ensureTaskRecord() → upsert task in state
  │       ├─ computeWorkflowVerificationState() → derives verification state
  │       └─ [activate/create/verify/complete]WorkflowTask()
  │
  └─ Authority checks in:
      └─ src/core/workflow-management/workflow-authority.ts
          ├─ inspectWorkflowAuthority() → checks .hivemind/ structure health
          └─ bootstrapWorkflowAuthority() → creates missing authority files
```

---

## Key Observations

1. **Dual-write pattern:** Every mutation writes to both `.hivemind/state/tasks.json` and `.hivemind/graph/tasks.json` with identical content (`task-lifecycle.ts:127-128`). This is a projection pattern — state is the source of truth, graph is a read-optimized projection.

2. **No dependency enforcement:** The `dependencyIds` field exists on `TaskRecord` but is never checked during activation. A task with unmet dependencies can be activated without warning.

3. **Silent task creation on verify:** If the task doesn't exist during `verify`, a new task record is created on-the-fly (`task-lifecycle.ts:269-279`). This bypasses the normal `create` path and its authority bootstrap.

4. **Corruption handling:** `loadLifecycleState()` returns a `Result<TaskLifecycleState, CorruptionError>` discriminated union. Missing files return empty state (ok). Malformed JSON returns error. Mutation functions throw on error (`task-lifecycle.ts:187-189`).

5. **String-to-array parsing:** `dependencyIds` and `evidenceRefs` arrive as comma-separated strings from the tool args and are parsed via `parseList()` (`src/features/workflow/task.ts:91-92`).

6. **Metadata injection:** Only the `create` action injects metadata into the OpenCode context (`src/features/workflow/task.ts:120-127`). Other actions do not.
