# Tool Consumer Chain Map

**Investigation Date:** 2026-03-31  
**Scope:** All 6 managing-layer HiveMind tools  
**Verification Method:** Grep + file read of all `src/` TypeScript files

---

## hivemind_trajectory

### Tool Definition
- **File:** `src/tools/trajectory/tools.ts` (lines 1-49)
- **Factory:** `createHivemindTrajectoryTool(directory)` at `src/plugin/opencode-plugin.ts:129`
- **Feature:** `src/features/trajectory/trajectory.ts` (lines 1-178)
- **State Authority:** trajectory

### Output Paths
| Path | Purpose |
|------|---------|
| `.hivemind/state/trajectory-ledger.json` | Master trajectory ledger (defined at `src/core/trajectory/trajectory-store.types.ts:13`) |

### Callers

| Caller | File:Line | Nature |
|--------|-----------|--------|
| `tool-governance.ts` | `src/hooks/runtime-loader/tool-governance.ts:33` | Hook records tool calls as trajectory events |
| `event-handler.ts` | `src/hooks/event-handler.ts:443` | Hook records events to trajectory on session changes |
| `handoff.ts` | `src/features/handoff/handoff.ts:40,154,190,197,240,247,264` | Records handoff lifecycle as trajectory events |
| `command.ts` | `src/features/runtime-entry/command.ts:291` | Records command execution to trajectory |
| `trajectory.ts` (self) | `src/features/trajectory/trajectory.ts:143` | Records events via `recordTrajectoryEvent` |

### Consumers of Output

| Consumer | File:Line | Purpose |
|---------|-----------|---------|
| `runtime-status.ts` | `src/sdk-supervisor/runtime-status.ts:149` | Reads trajectory ledger for runtime status |
| `recovery-engine.ts` | `src/recovery/recovery-engine.ts:126` | Checks for missing/corrupt trajectory ledger |
| `workflow-command-handler.ts` | `src/features/runtime-entry/workflow-command-handler.ts:55` | Resolves runtime IDs from trajectory |
| `inspection-command-handler.ts` | `src/features/runtime-entry/inspection-command-handler.ts:117` | Resolves runtime IDs from trajectory |
| `init.handler.ts` | `src/features/runtime-entry/init.handler.ts:170` | Bootstraps initial trajectory |
| `harness.ts` | `src/features/runtime-entry/harness.ts:239` | Reads active trajectory for harness |
| `doctor.ts` | `src/features/runtime-entry/doctor.ts:78` | Reads trajectory for diagnostics |
| `tool-precedence.test.ts` | `tests/unit/context-renderer/tool-precedence.test.ts:101` | Tests mandatory_reads path |

### Hook Dependencies
- **Yes:** `tool-governance.ts` (line 1 imports `recordTrajectoryEvent`)
- **Yes:** `event-handler.ts` (line 11 imports `recordTrajectoryEvent`)

### Cross-Tool Dependencies
- **Depends on `hivemind_task`:** `trajectory.ts:61` calls `readWorkflowTaskState()` to filter tasks by trajectory's `taskIds`
- **Writes events that `hivemind_handoff` consumes:** Handoff tool calls `recordTrajectoryEvent` at `handoff.ts:40`

### Impact if Removed

**CRITICAL BREAKAGE:**
1. No trajectory recording → all session history lost
2. `tool-governance` hook fails (imports `recordTrajectoryEvent`)
3. `event-handler` hook fails (imports `recordTrajectoryEvent`)
4. All runtime-entry handlers fail (workflow-command, inspection, init, harness, doctor)
5. Recovery engine cannot detect trajectory corruption
6. `hivemind_handoff` events not recorded
7. Context renderer `mandatory_reads` test path `.hivemind/trajectory.json` unusable

---

## hivemind_task

### Tool Definition
- **File:** `src/tools/task/tools.ts` (lines 1-42)
- **Factory:** `createHivemindTaskTool(directory)` at `src/plugin/opencode-plugin.ts:128`
- **Feature:** `src/features/workflow/task.ts` (lines 1-190)
- **State Authority:** workflow

### Output Paths
| Path | Purpose |
|------|---------|
| `.hivemind/state/tasks.json` | Workflow task state (defined at `src/core/workflow-management/task-lifecycle.ts:70`) |
| `.hivemind/graph/tasks.json` | Workflow task graph projection (defined at `src/core/workflow-management/task-lifecycle.ts:71`) |

### Callers

| Caller | File:Line | Nature |
|--------|-----------|--------|
| `tool-governance.ts` | `src/hooks/runtime-loader/tool-governance.ts:10,23-37` | Hook tracks task tool calls |
| `tool-precedence.test.ts` | `tests/unit/context-renderer/tool-precedence.test.ts:34,48-49,183` | Tests task tool precedence |
| `plugin-runtime.test.ts` | `tests/plugin-runtime.test.ts:376,383` | Integration tests |

### Consumers of Output

| Consumer | File:Line | Purpose |
|---------|-----------|---------|
| `trajectory.ts` | `src/features/trajectory/trajectory.ts:61,67-68` | Filters tasks by trajectory.taskIds |
| `planning-projection.ts` | `src/governance/planning-projection.ts:24` | Reads task state for planning |
| `workflow-authority.ts` | `src/core/workflow-management/workflow-authority.ts:56-57,78-79` | Validates task files exist |
| `task-lifecycle.test.ts` | `tests/task-lifecycle-corruption.test.ts:67,98,123,153` | Tests corruption scenarios |

### Hook Dependencies
- **Indirect:** `tool-governance.ts` line 10 lists `hivemind_task` in `HIVEMIND_MANAGED_TOOLS`, line 23-37 records trajectory events for task calls

### Cross-Tool Dependencies
- **`hivemind_trajectory` consumes task output:** `trajectory.ts:61` reads task state to associate tasks with trajectories
- **No other tools depend on task output directly**

### Impact if Removed

**CRITICAL BREAKAGE:**
1. No workflow task management possible
2. `tool-governance` cannot track task tool calls
3. `trajectory.ts` traverse action fails (cannot read task state)
4. `planning-projection` cannot read task state
5. All workflow-authority blocking checks fail
6. Task-related integration tests fail

---

## hivemind_journal

### Tool Definition
- **File:** `src/tools/hivemind-journal.ts` (lines 1-196)
- **Factory:** `createHivemindJournalTool(directory)` at `src/plugin/opencode-plugin.ts:131`
- **State Authority:** plugin-control-plane

### Output Paths
| Path | Purpose |
|------|---------|
| `.hivemind/sessions/journey-events/{sessionId}.md` | Session journey events markdown |
| `.hivemind/sessions/journey-events/{sessionId}.json` | Session consolidated JSON |
| `.hivemind/sessions/error-logs/{sessionId}.log` | Session error logs |

### Callers

| Caller | File:Line | Nature |
|--------|-----------|--------|
| `tool-governance.ts` | `src/hooks/runtime-loader/tool-governance.ts:13` | Listed in HIVEMIND_MANAGED_TOOLS |
| `runtime-tools.test.ts` | `tests/runtime-tools.test.ts:31` | Smoke test listing |
| `plugin-assembly-smoke.test.ts` | `tests/plugin-assembly-smoke.test.ts:133` | Assembly smoke test |

### Consumers of Output
- **No internal consumers found** — this is a terminal write surface
- **Note:** Side-car app at `apps/side-car/app/api/sessions/route.ts:7` mentions reading from `.hivemind/activity/sessions/` (future phase)

### Hook Dependencies
- **None** — this is the write-side journaling entry point; hooks read from event-tracker features

### Cross-Tool Dependencies
- **Used by hooks via event-tracker:** `event-handler.ts` calls `addEvent()` and `addDiagnostic()` from `src/features/event-tracker/consolidated-writer.js` which write journey events

### Impact if Removed

**HIGH BREAKAGE:**
1. No session journaling possible
2. Agent session history not persisted
3. Debugging/tracing of sessions not possible
4. Error logs not written

---

## hivemind_handoff

### Tool Definition
- **File:** `src/tools/handoff/tools.ts` (lines 1-54)
- **Factory:** `createHivemindHandoffTool(directory)` at `src/plugin/opencode-plugin.ts:130`
- **Feature:** `src/features/handoff/handoff.ts` (lines 1-271)
- **State Authority:** delegation

### Output Paths
| Path | Purpose |
|------|---------|
| `.hivemind/handoffs/{id}.json` | Delegation handoff records (defined at `src/delegation/delegation-store.ts:51`) |

### Callers

| Caller | File:Line | Nature |
|--------|-----------|--------|
| `tool-governance.ts` | `src/hooks/runtime-loader/tool-governance.ts:12` | Listed in HIVEMIND_MANAGED_TOOLS |
| `runtime-tools.test.ts` | `tests/runtime-tools.test.ts:27` | Smoke test listing |
| `plugin-assembly-smoke.test.ts` | `tests/plugin-assembly-smoke.test.ts:129` | Assembly smoke test |
| `chain-executor.test.ts` | `src/features/agent-work-contract/engine/chain-executor.test.ts:323,336,358` | Tests reference handoff path |

### Consumers of Output

| Consumer | File:Line | Purpose |
|---------|-----------|---------|
| `handoff.ts` (self) | `src/features/handoff/handoff.ts:114` | Reads handoff for validate/close |
| `chain-executor.ts` | `src/features/agent-work-contract/engine/chain-executor.ts:323,336,358` | References handoff path for contract linkage |
| `handoff.ts:54` | `src/features/handoff/handoff.ts:54` | Gets handoff path for continuity linkage |

### Hook Dependencies
- **Indirect:** `tool-governance.ts` line 12 lists in HIVEMIND_MANAGED_TOOLS

### Cross-Tool Dependencies
- **Depends on `hivemind_trajectory`:** `handoff.ts:40,154,190,197,240,247,264` calls `recordTrajectoryEvent()` to log handoff lifecycle
- **Depends on `hivemind_agent_work_create_contract`:** `handoff.ts:13` imports `dispatchDelegationHandoffPacketAction` which uses contract store
- **Writes handoffRef that contract chain-executor reads:** `chain-executor.ts:323` references `.hivemind/handoffs/dlg_123.json`

### Impact if Removed

**CRITICAL BREAKAGE:**
1. No delegation handoffs possible
2. `handoff.ts` fails (imports `recordTrajectoryEvent`)
3. Contract chain-executor cannot dispatch handoff packets
4. Workflow continuity linkage broken
5. Delegation validation/closure not possible

---

## hivemind_agent_work_create_contract

### Tool Definition
- **File:** `src/features/agent-work-contract/tools/create-contract-tool.ts` (lines 1-155)
- **Factory:** `createAgentWorkCreateContractTool(directory)` at `src/plugin/opencode-plugin.ts:125`
- **State Authority:** workflow

### Output Paths
| Path | Purpose |
|------|---------|
| `.hivemind/agent-work-contract/{contractId}.json` | Contract records (defined at `src/features/agent-work-contract/engine/contract-store.types.ts:14`) |

### Callers

| Caller | File:Line | Nature |
|--------|-----------|--------|
| `tool-governance.ts` | `src/hooks/runtime-loader/tool-governance.ts:8` | Listed in HIVEMIND_MANAGED_TOOLS |
| `runtime-tools.test.ts` | `tests/runtime-tools.test.ts:24` | Smoke test listing |
| `plugin-runtime.test.ts` | `tests/plugin-runtime.test.ts:428` | Tests tool existence |
| `plugin-assembly-smoke.test.ts` | `tests/plugin-assembly-smoke.test.ts:126` | Assembly smoke test |
| `opencode-plugin.ts` | `src/plugin/opencode-plugin.ts:23` | Tool registration |

### Consumers of Output

| Consumer | File:Line | Purpose |
|---------|-----------|---------|
| `export-contract-tool.ts` | `src/features/agent-work-contract/tools/export-contract-tool.ts:41` | Reads contract for export |
| `event-handler.ts` | `src/hooks/event-handler.ts:4,149` | Reads contract for compaction events |
| `contract-store.crud.ts` | `src/features/agent-work-contract/engine/contract-store.crud.ts` | CRUD operations |
| `command-session-contract.ts` | `src/features/agent-work-contract/engine/command-session-contract.ts:203,243` | Links contracts to sessions |
| `chain-executor.ts` | `src/features/agent-work-contract/engine/chain-executor.ts:226` | Chain action dispatch |
| `side-car/route.ts` | `apps/side-car/app/api/contracts/route.ts:5` | Side-car API reads contracts |
| `runtime-entry/command.ts` | `src/features/runtime-entry/command.ts:266` | References contract in session |
| `runtime-observability/status.ts` | `src/features/runtime-observability/status.ts:6` | Reads contracts for status |

### Hook Dependencies
- **Yes:** `event-handler.ts` line 4 imports `ContractStore`, line 149 checks `agent-work-contract:*` events

### Cross-Tool Dependencies
- **Used by `hivemind_handoff`:** `handoff.ts:13` imports `dispatchDelegationHandoffPacketAction` which operates on contracts
- **Used by `hivemind_agent_work_export_contract`:** `export-contract-tool.ts:40` uses `ContractStore` to read contracts

### Impact if Removed

**CRITICAL BREAKAGE:**
1. No agent-work contracts can be created/updated
2. `event-handler` cannot process compaction events
3. Contract chain-executor cannot dispatch actions
4. Session-command linkage broken
5. Side-car API has no contract data
6. Runtime observability status incomplete

---

## hivemind_agent_work_export_contract

### Tool Definition
- **File:** `src/features/agent-work-contract/tools/export-contract-tool.ts` (lines 1-67)
- **Factory:** `createAgentWorkExportContractTool(directory)` at `src/plugin/opencode-plugin.ts:126`
- **State Authority:** workflow

### Output Paths
| Path | Purpose |
|------|---------|
| (Read-only) — reads from `.hivemind/agent-work-contract/{contractId}.json` | N/A |

### Callers

| Caller | File:Line | Nature |
|--------|-----------|--------|
| `tool-governance.ts` | `src/hooks/runtime-loader/tool-governance.ts:9` | Listed in HIVEMIND_MANAGED_TOOLS |
| `runtime-tools.test.ts` | `tests/runtime-tools.test.ts:25` | Smoke test listing |
| `plugin-assembly-smoke.test.ts` | `tests/plugin-assembly-smoke.test.ts:127` | Assembly smoke test |

### Consumers of Output
- **No internal consumers** — this is a terminal read/export surface
- **Used by agents directly** to export contract state for planning or compaction

### Hook Dependencies
- **None** — read-only tool

### Cross-Tool Dependencies
- **Depends on `hivemind_agent_work_create_contract`:** Reads contracts created by create-contract tool via `ContractStore`

### Impact if Removed

**HIGH BREAKAGE:**
1. Contracts cannot be exported for planning/compaction
2. Agents lose ability to see contract state
3. Compaction preservation cannot export contracts

---

## Cross-Tool Dependency Graph

```
hivemind_trajectory
├── (reads) hivemind_task (.hivemind/state/tasks.json)
├── (records events from) hivemind_handoff
└── (recorded by) tool-governance hook, event-handler hook

hivemind_task
└── (feeds to) hivemind_trajectory (traverse action filters by taskIds)

hivemind_handoff
├── (calls) hivemind_trajectory (recordTrajectoryEvent on handoff lifecycle)
└── (dispatches to) hivemind_agent_work_create_contract (chain-executor)

hivemind_agent_work_create_contract
├── (read by) hivemind_agent_work_export_contract
└── (used by) hivemind_handoff (dispatchDelegationHandoffPacketAction)

hivemind_agent_work_export_contract
└── (reads contracts created by) hivemind_agent_work_create_contract

hivemind_journal
└── (write surface for) event-handler hooks (addEvent, addDiagnostic)
```

---

## Summary: Impact if Each Tool Removed

| Tool | Impact Level | Key Breakage |
|------|-------------|--------------|
| `hivemind_trajectory` | **CRITICAL** | 7+ features fail: all runtime-entry handlers, recovery, hooks, handoff events |
| `hivemind_task` | **CRITICAL** | Trajectory traverse fails, planning projection fails, workflow authority broken |
| `hivemind_journal` | **HIGH** | No session history, no error logs, debugging impossible |
| `hivemind_handoff` | **CRITICAL** | No delegation possible, chain-executor broken, trajectory events missing |
| `hivemind_agent_work_create_contract` | **CRITICAL** | No contracts, compaction fails, side-car API broken, session linkage broken |
| `hivemind_agent_work_export_contract` | **HIGH** | Contract export unavailable, compaction preservation incomplete |

---

## Files Written by Each Tool

| Tool | Primary Write Path |
|------|-------------------|
| `hivemind_trajectory` | `.hivemind/state/trajectory-ledger.json` |
| `hivemind_task` | `.hivemind/state/tasks.json`, `.hivemind/graph/tasks.json` |
| `hivemind_journal` | `.hivemind/sessions/journey-events/{sessionId}.md`, `.hivemind/sessions/error-logs/{sessionId}.log` |
| `hivemind_handoff` | `.hivemind/handoffs/{id}.json` |
| `hivemind_agent_work_create_contract` | `.hivemind/agent-work-contract/{contractId}.json` |
| `hivemind_agent_work_export_contract` | *(read-only)* |

---

## Verification Evidence

All findings verified by grep + file read with exact file:line references. No speculation.  
Investigation conducted at git commit with `git status` confirming clean working tree.