---
title: "hivemind_trajectory — Deep Responsibility Analysis"
date: 2026-03-31
agent: hivexplorer
scope: trajectory tool, feature, core, callers, tests
git_commit: 7da1d535
---

# hivemind_trajectory — Deep Responsibility Analysis — 2026-03-31

## Responsibility Statement

The `hivemind_trajectory` tool is the **canonical trajectory control surface** for the HiveMind runtime. It manages the lifecycle of "trajectories" — bounded execution narratives that tie a session to a workflow, tasks, and subtasks. A trajectory records what an agent is doing, why, and what evidence it produces. The tool exposes six actions (`inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close`) that allow agents to create, navigate, annotate, and terminate trajectories. All trajectory state persists to a single JSON ledger on disk at `.hivemind/state/trajectory-ledger.json`. The tool exists so that every agent session has a durable, queryable record of its execution context — enabling session resumption, compaction recovery, delegation handoffs, and runtime observability.

---

## Actions

### inspect

- **Args:** `action: 'inspect'`, `trajectoryId?: string`, `workflowId?: string` (all other args ignored)
- **Validation:** None — always succeeds. Reads the ledger and returns its current state.
- **Call chain:** `tools.ts:34` → `trajectory.ts:39-50` → `trajectory-store.ledger.ts:91-103` (loadTrajectoryLedger) → `trajectory-store.ledger.ts:129-166` (inspectTrajectoryLedger)
- **Files read:** `.hivemind/state/trajectory-ledger.json` (via `getTrajectoryLedgerPath` at `trajectory-store.types.ts:12-13`)
- **Files written:** None
- **Returns:** `{ inspection, activeTrajectoryId, lastClosedTrajectoryId, selectedTrajectory, pressureContract }` — the full ledger health status, active/closed trajectory IDs, the selected trajectory record (if any), and the pressure contract for this action.

### traverse

- **Args:** `action: 'traverse'`, `trajectoryId?: string`, `workflowId?: string`
- **Validation:** 
  - `trajectory.ts:52-54`: If no trajectory is available (no `trajectoryId` arg, no `activeTrajectoryId`, no `lastClosedTrajectoryId`), returns error `"No trajectory is available to traverse"`.
  - `trajectory.ts:56-59`: If the selected trajectory ID doesn't exist in the ledger, returns error `"Trajectory {id} was not found"`.
  - `trajectory.ts:61-64`: If workflow task state fails to load, returns error with the underlying message.
- **Call chain:** `tools.ts:34` → `trajectory.ts:51-81` → `trajectory-store.ledger.ts:91-103` (loadTrajectoryLedger) → `workflow-management/index.ts` (readWorkflowTaskState)
- **Files read:** `.hivemind/state/trajectory-ledger.json`, `.hivemind/state/tasks.json` (via readWorkflowTaskState)
- **Files written:** None
- **Returns:** `{ trajectory, workflows, tasks, subtasks, checkpoints, pressureContract }` — the trajectory record, its workflow IDs, the matching task/subtask objects from the task state, and all checkpoints belonging to this trajectory.

### attach

- **Args:** `action: 'attach'`, `trajectoryId: string` (required), `workflowId: string` (required), `sessionId?: string`, `lineage?: 'hivefiver'|'hiveminder'`, `purposeClass?: string`, `taskIds?: string` (comma-separated), `subtaskIds?: string` (comma-separated)
- **Validation:** `trajectory.ts:84-86`: If `trajectoryId` or `workflowId` is missing, returns error `"trajectoryId and workflowId are required for attach"`.
- **Call chain:** `tools.ts:34` → `trajectory.ts:83-114` → `trajectory-store.operations.ts:61-109` (bootstrapTrajectoryLedger) → `trajectory-store.ledger.ts:173-184` (ensureTrajectoryLedger) → `trajectory-store.ledger.ts:72-80` (saveTrajectoryLedger)
  - Also calls: `workflow-management/workflow-authority.ts` (bootstrapWorkflowAuthority) at `trajectory-store.operations.ts:65-71`
  - Also calls: `workflow-management/task-lifecycle.ts` (activateWorkflowTask) at `trajectory-store.operations.ts:72-87`
- **Files read:** `.hivemind/state/trajectory-ledger.json`
- **Files written:** `.hivemind/state/trajectory-ledger.json` (updated with new/merged trajectory record)
- **Returns:** `{ activeTrajectoryId, trajectory, pressureContract }` plus metadata `{ title, metadata: { action, workflowId, safetyLevel } }`. The metadata is pushed to the OpenCode context via `context.metadata()` at `tools.ts:42-44`.

### checkpoint

- **Args:** `action: 'checkpoint'`, `trajectoryId?: string`, `workflowId: string` (required), `taskIds?: string`, `subtaskIds?: string`, `source?: string`, `resumeTarget?: string`
- **Validation:** `trajectory.ts:117-119`: If no `selectedTrajectoryId` or no `workflowId`, returns error `"trajectoryId and workflowId are required for checkpoint"`.
- **Call chain:** `tools.ts:34` → `trajectory.ts:116-136` → `trajectory-store.operations.ts:180-206` (createTrajectoryCheckpoint) → `trajectory-store.ledger.ts:173-184` (ensureTrajectoryLedger) → `trajectory-store.ledger.ts:72-80` (saveTrajectoryLedger)
- **Files read:** `.hivemind/state/trajectory-ledger.json`
- **Files written:** `.hivemind/state/trajectory-ledger.json` (checkpoint appended to `checkpoints` array)
- **Returns:** `{ checkpoint, pressureContract }` — the created checkpoint object with auto-generated ID `chk_{trajectoryId}_{n}`.

### event

- **Args:** `action: 'event'`, `trajectoryId?: string`, `summary: string` (required), `kind?: 'summary'|'handoff'|'evidence'|'transition'|'note'`, `evidenceRefs?: string` (comma-separated)
- **Validation:** `trajectory.ts:139-141`: If no `selectedTrajectoryId` or no `summary`, returns error `"trajectoryId and summary are required for event"`.
- **Call chain:** `tools.ts:34` → `trajectory.ts:138-155` → `trajectory-store.operations.ts:118-139` (recordTrajectoryEvent) → `trajectory-store.ledger.ts:173-184` (ensureTrajectoryLedger) → `trajectory-store.ledger.ts:72-80` (saveTrajectoryLedger)
- **Files read:** `.hivemind/state/trajectory-ledger.json`
- **Files written:** `.hivemind/state/trajectory-ledger.json` (event pushed to trajectory's `events` array, `eventSummaries` and `evidenceRefs` merged)
- **Returns:** `{ trajectory, pressureContract }` — the updated trajectory record with the new event appended.

### close

- **Args:** `action: 'close'`, `trajectoryId?: string`, `summary: string` (required)
- **Validation:** `trajectory.ts:158-160`: If no `selectedTrajectoryId` or no `summary`, returns error `"trajectoryId and summary are required for close"`.
- **Call chain:** `tools.ts:34` → `trajectory.ts:157-173` → `trajectory-store.operations.ts:148-172` (closeTrajectory) → `trajectory-store.ledger.ts:173-184` (ensureTrajectoryLedger) → `trajectory-store.ledger.ts:72-80` (saveTrajectoryLedger)
- **Files read:** `.hivemind/state/trajectory-ledger.json`
- **Files written:** `.hivemind/state/trajectory-ledger.json` (trajectory status set to `'closed'`, `closedAt`/`closingSummary` set, `activeTrajectoryId` cleared, `lastClosedTrajectoryId` set)
- **Returns:** `{ trajectory, lastClosedTrajectoryId, pressureContract }` — the closed trajectory record and the new last-closed ID.

---

## Data Model

### TrajectoryLedger (`trajectory-types.ts:87-94`)

The top-level container persisted to disk:

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Ledger schema version, currently `"1.0.0"` (`trajectory-store.types.ts:5`) |
| `activeTrajectoryId` | `string \| null` | ID of the currently active trajectory |
| `lastClosedTrajectoryId` | `string \| null` | ID of the most recently closed trajectory |
| `trajectories` | `TrajectoryRecord[]` | All trajectory records |
| `checkpoints` | `TrajectoryCheckpoint[]` | All checkpoints across all trajectories |
| `recoveryLog` | `TrajectoryRecoveryLogEntry[]` | Recovery operation history |

### TrajectoryRecord (`trajectory-types.ts:58-65`)

Composed via intersection of four sub-interfaces:

**TrajectoryCore** (`trajectory-types.ts:22-29`):
| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique trajectory identifier |
| `lineage` | `'hivefiver' \| 'hiveminder'` | Agent lineage that owns this trajectory |
| `purposeClass` | `'discovery' \| 'brainstorming' \| 'research' \| 'planning' \| 'implementation' \| 'gatekeeping' \| 'tdd' \| 'course-correction'` | Purpose classification |
| `status` | `'active' \| 'closed'` | Lifecycle status |
| `createdAt` | `string` | ISO 8601 creation timestamp |
| `updatedAt` | `string` | ISO 8601 last-update timestamp |

**TrajectoryBindings** (`trajectory-types.ts:32-38`):
| Field | Type | Description |
|-------|------|-------------|
| `workflowIds` | `string[]` | Associated workflow IDs |
| `sessionIds` | `string[]` | Associated session IDs |
| `taskIds` | `string[]` | Associated task IDs |
| `subtaskIds` | `string[]` | Associated subtask IDs |
| `delegationIds` | `string[]` | Associated delegation IDs |

**TrajectoryEvidence** (`trajectory-types.ts:41-46`):
| Field | Type | Description |
|-------|------|-------------|
| `events` | `TrajectoryEvent[]` | Event history |
| `eventSummaries` | `string[]` | Deduplicated event summary strings |
| `evidenceRefs` | `string[]` | Evidence reference strings |
| `checkpointIds` | `string[]` | Checkpoint IDs linked to this trajectory |

**TrajectoryPlanning** (`trajectory-types.ts:49-55`):
| Field | Type | Description |
|-------|------|-------------|
| `planningRefs` | `string[]` | Planning reference strings |
| `graphNodeBindings` | `string[]` | Graph node bindings |
| `rerouteNotes` | `string[]` | Reroute annotations |
| `branchNotes` | `string[]` | Branch annotations |
| `nextAllowedTransitions` | `string[]` | Allowed next transitions (default: `['command:hm-harness', 'command:hm-plan', 'command:hm-implement']`) |

**Additional fields** (`trajectory-types.ts:63-64`):
| Field | Type | Description |
|-------|------|-------------|
| `closedAt?` | `string` | ISO 8601 close timestamp |
| `closingSummary?` | `string` | Summary text on close |

### TrajectoryEvent (`trajectory-types.ts:14-19`)

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `'summary' \| 'handoff' \| 'evidence' \| 'transition' \| 'note'` | Event classification |
| `summary` | `string` | Event description text |
| `evidenceRefs?` | `string[]` | Evidence references |
| `createdAt?` | `string` | ISO 8601 timestamp |

### TrajectoryCheckpoint (`trajectory-types.ts:67-76`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Auto-generated: `chk_{trajectoryId}_{n}` |
| `trajectoryId` | `string` | Parent trajectory ID |
| `workflowId` | `string` | Associated workflow ID |
| `taskIds` | `string[]` | Task IDs at checkpoint time |
| `subtaskIds` | `string[]` | Subtask IDs at checkpoint time |
| `source` | `string` | Checkpoint source label (e.g., `'tool:hivemind_trajectory'`, `'event:session.compacted'`) |
| `resumeTarget` | `string` | Suggested resume target (e.g., `'command:hm-harness'`) |
| `createdAt` | `string` | ISO 8601 timestamp |

---

## Disk Format

### Primary File: `.hivemind/state/trajectory-ledger.json`

- **Path resolution:** `trajectory-store.types.ts:12-13` — `path.join(getHivemindPath(projectRoot), 'state', 'trajectory-ledger.json')`
- **Format:** JSON, 2-space indent (`trajectory-store.ledger.ts:78`)
- **Schema:** `TrajectoryLedger` interface
- **Version:** `"1.0.0"` constant at `trajectory-store.types.ts:5`

### Ledger Operations on Disk

| Operation | File | Read/Write | Location |
|-----------|------|-----------|----------|
| `loadTrajectoryLedger` | `trajectory-ledger.json` | Read | `trajectory-store.ledger.ts:91-103` |
| `loadTrajectoryLedgerSync` | `trajectory-ledger.json` | Read (sync) | `trajectory-store.ledger.ts:110-122` |
| `saveTrajectoryLedger` | `trajectory-ledger.json` | Write | `trajectory-store.ledger.ts:72-80` |
| `inspectTrajectoryLedger` | `trajectory-ledger.json` | Read (sync) | `trajectory-store.ledger.ts:129-166` |
| `ensureTrajectoryLedger` | `trajectory-ledger.json` | Read + conditional Write | `trajectory-store.ledger.ts:173-184` |
| `bootstrapTrajectoryLedger` | `trajectory-ledger.json` | Read + Write | `trajectory-store.operations.ts:61-109` |
| `recordTrajectoryEvent` | `trajectory-ledger.json` | Read + Write | `trajectory-store.operations.ts:118-139` |
| `closeTrajectory` | `trajectory-ledger.json` | Read + Write | `trajectory-store.operations.ts:148-172` |
| `createTrajectoryCheckpoint` | `trajectory-ledger.json` | Read + Write | `trajectory-store.operations.ts:180-206` |
| `recordTrajectoryRecoveryOutcome` | `trajectory-ledger.json` | Read + Write | `trajectory-store.operations.ts:214-230` |

### Directory Creation

`saveTrajectoryLedger` at `trajectory-store.ledger.ts:77` creates the parent directory with `fs.mkdir(path.dirname(ledgerPath), { recursive: true })` before writing.

---

## Test Coverage

### No Dedicated Trajectory Tool Tests

There are **zero** test files matching `*trajectory*.test.*` or `*trajectory*.spec.*` patterns. The trajectory tool itself (`tools.ts`) has no unit tests.

### Indirect Test Coverage

| Test File | What It Tests | Trajectory Relevance |
|-----------|--------------|---------------------|
| `tests/runtime-tools.test.ts:35` | Verifies `hivemind_trajectory` is in `AUTHORITATIVE_RUNTIME_TOOL_IDS` | Registration proof |
| `tests/runtime-tools.test.ts:60-67` | `bootstrapReadyRuntime()` calls `bootstrapTrajectoryLedger` with test data | Bootstrap integration |
| `tests/runtime-tools.test.ts:71-93` | Plugin registers all runtime tools including trajectory | Plugin wiring |
| `tests/plugin-runtime.test.ts:7` | Imports `bootstrapTrajectoryLedger, loadTrajectoryLedger` | Core function usage |
| `tests/plugin-runtime.test.ts:317-347` | Tests event hook skips trajectory writes when session doesn't match | Event-to-trajectory bridge |
| `tests/plugin-runtime.test.ts:350-392` | Tests event hook records trajectory events for matching sessions | Event recording |
| `tests/plugin-runtime.test.ts:394-417` | Tests event hook skips when no trajectory ID in snapshot | Guard behavior |
| `tests/plugin-runtime.test.ts:770-792` | Tests trajectory event summaries after session.compacted | Compaction checkpoint |
| `tests/runtime-authority-live-sanity.test.ts:11,50` | Imports and calls `bootstrapTrajectoryLedger` | Live sanity check |
| `tests/hooks/start-work/start-work-router.test.ts:29-65` | Tests `attach-active` trajectory assessment | Entry routing |
| `tests/hooks/start-work/start-work-router.test.ts:67-102` | Tests `resume-closed` trajectory assessment | Resume routing |
| `tests/plugin-assembly-smoke.test.ts:137` | Verifies `hivemind_trajectory` in tool list | Smoke test |

### Coverage Gaps

- **No tests for the tool's `execute()` function** — no direct invocation of `createHivemindTrajectoryTool` with each action.
- **No tests for `traverse` action** — the task-state joining logic is untested.
- **No tests for `checkpoint` action** — checkpoint creation via the tool is untested.
- **No tests for `close` action** — trajectory closure via the tool is untested.
- **No tests for `event` action** — event recording via the tool is untested.
- **No tests for `inspect` action** — ledger inspection via the tool is untested.
- **No tests for error paths** — missing args, missing trajectories, corrupted ledger.

---

## Callers

### Direct Tool Registration

| Caller | File:Line | Role |
|--------|-----------|------|
| Plugin assembly | `plugin/opencode-plugin.ts:32` | Imports `createHivemindTrajectoryTool` |
| Plugin assembly | `plugin/opencode-plugin.ts:129` | Registers as `hivemind_trajectory: createTrajectoryTool(directory)` |
| Tool barrel | `tools/index.ts:9` | Re-exports from `./trajectory/index.js` |
| Tool catalog | `tools/index.ts:48-55` | Catalog entry: `stateAuthority: 'trajectory'`, `workflowPhase: 'trajectory-attachment'` |

### Hook-Based Callers (Automatic, Not Agent-Initiated)

| Caller | File:Line | What It Does |
|--------|-----------|-------------|
| `tool-governance.ts` | `hooks/runtime-loader/tool-governance.ts:11` | Lists `hivemind_trajectory` in `HIVEMIND_MANAGED_TOOLS` set |
| `tool-governance.ts` | `hooks/runtime-loader/tool-governance.ts:23-37` | `recordToolEvent()` calls `recordTrajectoryEvent()` for every managed tool execution, recording a `transition` event on the active trajectory |
| `event-handler.ts` | `hooks/event-handler.ts:3,11` | Imports `loadTrajectoryLedger` and `recordTrajectoryEvent` |
| `event-handler.ts` | `hooks/event-handler.ts:427-457` | On every OpenCode event, if a trajectory is active and session matches, records a `note` event. On `session.compacted`, creates a recovery checkpoint via `createRecoveryCheckpoint` |
| `start-work-router.ts` | `hooks/start-work/start-work-router.ts:1,41-50` | Calls `assessTrajectoryEntrySync()` on every user turn to determine if the session should attach to an active trajectory, resume a closed one, or create a new one |
| `start-work-router-helpers.ts` | `hooks/start-work/start-work-router-helpers.ts:1-124` | Helper functions that interpret `TrajectoryAssessmentAction` values for routing decisions, pressure signals, and risk levels |

### Context Rendering (Read-Side)

| Caller | File:Line | What It Does |
|--------|-----------|-------------|
| `context-renderer.builder.ts` | `plugin/context-renderer.builder.ts:87` | Resolves `trajectory` field from snapshot's `trajectoryId` |
| `context-renderer.renderers.ts` | `plugin/context-renderer.renderers.ts:47,79` | Renders `trajectory` and `trajectory_path` fields into the context packet |
| `context-renderer.compaction-renderers.ts` | `plugin/context-renderer.compaction-renderers.ts:221` | Renders `trajectory` field in compaction context |
| `messages-transform-adapter.ts` | `plugin/messages-transform-adapter.ts:110-111` | Includes `trajectory_path` in message transform output |
| `context-renderer.constants.ts` | `plugin/context-renderer.constants.ts:14` | Lists `trajectory` as a context field |
| `context-renderer.types.ts` | `plugin/context-renderer.types.ts:15,132` | Types for `trajectory` and `trajectory_path` fields |

### Plugin Runtime Snapshot

| Caller | File:Line | What It Does |
|--------|-----------|-------------|
| `opencode-plugin.ts` | `plugin/opencode-plugin.ts:173-217` | Records tool execution intent for trajectory tracking; sets `HIVEMIND_ACTIVE_TRAJECTORY` env var; includes trajectory in mandatory reads and context strings |

### Agent Tool Catalog

The tool is cataloged at `tools/index.ts:48-55` with:
- `id: 'hivemind_trajectory'`
- `contractFile: 'src/tools/trajectory/tools.ts'`
- `hostEvent: 'tool.call'`
- `workflowPhase: 'trajectory-attachment'`
- `purposeClasses: ['planning', 'implementation', 'gatekeeping', 'course-correction']`
- `stateAuthority: 'trajectory'`
- `pressureContract: getRuntimePressureContract('trajectory-control')`

### Pressure Contracts

Each action maps to a pressure contract at `types.ts:28-35`:
- `inspect` → `'steady-state'`
- `traverse` → `'trajectory-control'`
- `attach` → `'trajectory-continuation'`
- `checkpoint` → `'trajectory-control'`
- `event` → `'trajectory-control'`
- `close` → `'trajectory-control'`

---

## Summary of Responsibility Boundaries

The `hivemind_trajectory` tool is the **sole agent-facing interface** for trajectory management. It delegates all persistence to `src/core/trajectory/` (the ledger CRUD layer) and all business logic to `src/features/trajectory/trajectory.ts` (the action router). The tool itself (`tools.ts`) is a thin 49-line wrapper that:

1. Accepts typed args via Zod schema (`tool.schema.enum`, `tool.schema.string`)
2. Delegates to `executeHivemindTrajectoryAction` in the feature layer
3. Renders success/error responses via shared helpers
4. Pushes metadata to the OpenCode context for TUI display

The trajectory system is deeply woven into the runtime: every tool execution auto-records a transition event, every OpenCode event auto-records a note event, every session start assesses trajectory continuity, and every compaction creates a recovery checkpoint. The tool is the manual control surface; the hooks are the automatic recording layer.
