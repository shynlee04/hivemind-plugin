---
title: "hivemind_handoff — Deep Responsibility Analysis"
date: 2026-03-31
agent: hivexplorer
scope: src/tools/handoff/, src/features/handoff/, src/delegation/
git_commit: 7da1d535
---

# hivemind_handoff — Deep Responsibility Analysis — 2026-03-31

## Responsibility Statement

The `hivemind_handoff` tool manages the full lifecycle of **delegation handoffs** — bounded, resumable work packets that transfer responsibility from one agent session to another. It exists to enable multi-agent orchestration where an orchestrator can delegate a slice of work (with explicit scope, constraints, evidence requirements, and return contracts) to a target agent/session, track the handoff's state through open → validated → closed, and maintain continuity linkage to the workflow authority and agent-work contract. Every handoff is persisted as a JSON file under `.hivemind/handoffs/` and cross-referenced in workflow continuity records and contract delegation projections.

---

## Actions

### create

- **Args:** `targetAgent` (string, required), `workflowId` (string, required), `scope` (string, required), `summary` (string, required), plus optional: `id`, `sourceSessionId`, `targetSessionId`, `sourceAgent`, `trajectoryId`, `taskIds`, `subtaskIds`, `constraints`, `memoryScope`, `successMetrics`, `requiredEvidence`, `returnContract`, `evidenceContractId`, `returnGate`, `resumeTarget`, `nextSteps`, `evidence`
- **Validation:** Requires `targetAgent`, `workflowId`, `scope`, `summary` — returns error if any missing (`src/features/handoff/handoff.ts:211-212`)
- **Call chain:**
  1. `createHivemindHandoffTool()` (`src/tools/handoff/tools.ts:8-53`) receives args from LLM
  2. → `executeHivemindHandoffAction()` (`src/features/handoff/handoff.ts:89-271`)
  3. → `createDelegationHandoff()` (`src/delegation/delegation-store.ts:132-153`)
  4. → `createDelegationPacket()` (`src/delegation/delegation-packet.ts:31-72`) builds the packet with defaults
  5. → `writeHandoffRecord()` (`src/delegation/delegation-store.ts:122-126`) writes JSON to disk
  6. → `recordHandoffEvent()` (`src/features/handoff/handoff.ts:35-44`) records trajectory event
  7. → `syncDelegationContinuity()` (`src/features/handoff/handoff.ts:46-87`)
  8. → `upsertWorkflowDelegationContinuityLinkage()` (`src/features/runtime-entry/workflow-continuity.ts:232-279`)
  9. → `dispatchDelegationHandoffPacketAction()` (`src/features/agent-work-contract/engine/chain-executor.ts:215-293`)
- **Files read:** None (create-only)
- **Files written:**
  - `.hivemind/handoffs/{delegationId}.json` — the handoff record (`src/delegation/delegation-store.ts:124`)
  - `.hivemind/project/runtime-continuity/continuity-workflow-{workflowId}.json` — continuity linkage (`src/features/runtime-entry/workflow-continuity.ts:259`)
  - Agent-work contract file updated with `delegationProjection` (`src/features/agent-work-contract/engine/chain-executor.ts:261-264`)
- **Returns:** `{ kind: 'success', message: 'Created delegation handoff', data: { record, continuity, chainAction, pressureContract }, metadata: { title, metadata: { workflowId, targetAgent, safetyLevel } } }` (`src/features/handoff/handoff.ts:249-266`)

### read

- **Args:** `id` (string, required)
- **Validation:** Requires `id` — returns error if missing (`src/features/handoff/handoff.ts:107-108`)
- **Call chain:**
  1. `executeHivemindHandoffAction()` (`src/features/handoff/handoff.ts:106-117`)
  2. → `readDelegationHandoff()` (`src/delegation/delegation-store.ts:155-160`)
  3. → `readHandoffFile()` (`src/delegation/delegation-store.ts:113-120`)
  4. → `readHandoffFileResult()` (`src/delegation/delegation-store.ts:66-107`) — reads, parses JSON, validates against Zod schema
  5. → `validateDelegationRecord()` (`src/delegation/delegation-record.schema.ts:87-101`)
- **Files read:** `.hivemind/handoffs/{id}.json`
- **Files written:** None
- **Returns:** `{ kind: 'success', message: 'Loaded delegation handoff', data: { record, pressureContract } }` — `record` is `null` if not found or validation fails (`src/features/handoff/handoff.ts:110-117`)

### list

- **Args:** None required
- **Validation:** None
- **Call chain:**
  1. `executeHivemindHandoffAction()` (`src/features/handoff/handoff.ts:97-105`)
  2. → `listDelegationHandoffs()` (`src/delegation/delegation-store.ts:162-179`)
  3. → `ensureHandoffDirectory()` creates `.hivemind/handoffs/` if missing
  4. → `fs.readdir()` reads all `.json` files
  5. → `readHandoffFileResult()` validates each file
  6. → Filters out invalid records, sorts by `updatedAt` descending
- **Files read:** All `.hivemind/handoffs/*.json` files
- **Files written:** None (directory created if missing)
- **Returns:** `{ kind: 'success', message: 'Listed delegation handoffs', data: { handoffs: DelegationHandoffRecord[], pressureContract } }` (`src/features/handoff/handoff.ts:98-105`)

### update

- **Args:** `id` (string, required), plus optional: `summary`, `nextSteps`, `evidence`
- **Validation:** Requires `id` — returns error if missing (`src/features/handoff/handoff.ts:177-178`). Returns error if handoff not found (`src/features/handoff/handoff.ts:187-188`)
- **Call chain:**
  1. `executeHivemindHandoffAction()` (`src/features/handoff/handoff.ts:176-209`)
  2. → `updateDelegationHandoff()` (`src/delegation/delegation-store.ts:181-204`)
  3. → `readHandoffFileResult()` reads existing record
  4. → Merges evidence arrays (appends new to existing)
  5. → `writeHandoffRecord()` writes updated record
  6. → `recordHandoffEvent()` records trajectory event
  7. → `syncDelegationContinuity()` updates continuity linkage
  8. → `dispatchDelegationHandoffPacketAction()` if chain action triggered
- **Files read:** `.hivemind/handoffs/{id}.json`
- **Files written:** `.hivemind/handoffs/{id}.json` (overwritten with merged data)
- **Returns:** `{ kind: 'success', message: 'Updated delegation handoff', data: { record, continuity, chainAction, pressureContract } }` (`src/features/handoff/handoff.ts:199-208`)

### validate

- **Args:** `id` (string, required)
- **Validation:** Requires `id` — returns error if missing (`src/features/handoff/handoff.ts:119-120`)
- **Call chain:**
  1. `executeHivemindHandoffAction()` (`src/features/handoff/handoff.ts:118-147`)
  2. → `validateDelegationHandoff()` (`src/delegation/delegation-store.ts:206-248`)
  3. → `readDelegationHandoff()` reads the record
  4. → Compares `record.evidence` against `record.packet.requiredEvidence` — identifies missing required evidence items
  5. → If all required evidence present and status is `'open'`, transitions status to `'validated'` and writes
  6. → `syncDelegationContinuity()` updates continuity linkage
  7. → `dispatchDelegationHandoffPacketAction()` if chain action triggered
  8. → `recordHandoffEvent()` records trajectory event if dispatched
- **Files read:** `.hivemind/handoffs/{id}.json`
- **Files written:** `.hivemind/handoffs/{id}.json` (only if validation passes and status transitions from `'open'` to `'validated'`)
- **Returns:** `{ kind: 'success', message: 'Validated delegation handoff', data: { valid, missingEvidence, evidenceRefs, record, continuity, chainAction, pressureContract } }` (`src/features/handoff/handoff.ts:137-146`)

### close

- **Args:** `id` (string, required), `summary` (string, required)
- **Validation:** Requires both `id` and `summary` — returns error if either missing (`src/features/handoff/handoff.ts:149-150`)
- **Call chain:**
  1. `executeHivemindHandoffAction()` (`src/features/handoff/handoff.ts:148-175`)
  2. → `closeDelegationHandoff()` (`src/delegation/delegation-store.ts:250-280`)
  3. → `validateDelegationHandoff()` — must pass validation first (gated)
  4. → If validation fails, returns the validation result without closing
  5. → If validation passes, writes record with `status: 'closed'` and `closeSummary`
  6. → `recordHandoffEvent()` records trajectory event
  7. → `syncDelegationContinuity()` updates continuity linkage
  8. → `dispatchDelegationHandoffPacketAction()` if chain action triggered
- **Files read:** `.hivemind/handoffs/{id}.json`
- **Files written:** `.hivemind/handoffs/{id}.json` (status → `'closed'`, `closeSummary` set)
- **Returns:** `{ kind: 'success', message: 'Closed delegation handoff', data: { valid, missingEvidence, evidenceRefs, record, continuity, chainAction, pressureContract } }` (`src/features/handoff/handoff.ts:165-174`)

---

## Data Model

### DelegationHandoffRecord (`src/delegation/delegation-store.ts:20-30`)

```typescript
interface DelegationHandoffRecord {
  id: string                          // e.g. "dlg_m5xk2p" or custom
  createdAt: string                   // ISO 8601
  updatedAt: string                   // ISO 8601
  status: 'open' | 'validated' | 'closed'
  summary: string                     // Human-readable summary
  nextSteps: string[]                 // Recommended next steps
  packet: DelegationPacket            // The delegation packet (see below)
  evidence: DelegationEvidenceRecord[] // Attached evidence items
  closeSummary?: string               // Set on close
}
```

### DelegationPacket (`src/delegation/delegation-packet.ts:9-29`)

```typescript
interface DelegationPacket {
  delegationId?: string
  sourceSessionId: string
  targetSessionId: string
  sourceAgent: string
  targetAgent: string
  trajectoryId?: string
  workflowId: string
  taskIds: string[]
  subtaskIds: string[]
  scope: string
  constraints: string[]
  memoryScope: string[]
  successMetrics: string[]
  evidenceContractId?: string
  requiredEvidence: DelegationEvidenceItem[]
  returnContract: string
  returnGate?: string
  resumeTarget?: string
  pressureContractId: RuntimePressureId  // default: 'delegated-handoff'
}
```

### DelegationEvidenceItem (`src/delegation/delegation-packet.ts:3-7`)

```typescript
interface DelegationEvidenceItem {
  kind: 'command_output' | 'file_diff' | 'test_report' | 'trace' | 'citation'
  description: string
  required: boolean
}
```

### DelegationEvidenceRecord (`src/delegation/delegation-store.ts:14-18`)

```typescript
interface DelegationEvidenceRecord {
  kind: DelegationEvidenceItem['kind']
  description: string
  createdAt: string  // ISO 8601
}
```

### Zod Schema (`src/delegation/delegation-record.schema.ts:25-75`)

Three Zod schemas validate the data model at read time:
- `DelegationEvidenceRecordSchema` (line 25)
- `DelegationPacketSchema` (line 34)
- `DelegationHandoffRecordSchema` (line 65)

---

## Disk Format

### Handoff Records

**Path:** `.hivemind/handoffs/{delegationId}.json`

**Format:** 2-space indented JSON (`src/delegation/delegation-store.ts:124`)

**ID generation:** `buildDelegationId()` (`src/delegation/delegation-store.ts:128-130`) — uses existing ID or generates `dlg_{Date.now().toString(36)}`

### Continuity Linkages

**Path:** `.hivemind/project/runtime-continuity/continuity-workflow-{workflowId}.json`

**Format:** `WorkflowContinuityTransactionV1` with `delegationId`, `handoffRef`, `targetSessionId`, `resumeTarget`, `delegationStatus` fields (`src/features/runtime-entry/workflow-continuity.ts:261-280`)

### Agent-Work Contract Projection

The agent-work contract file (managed by `ContractStore`) is updated with a `delegationProjection` field containing an array of handoff entries with `delegationId`, `taskRefs`, `subtaskRefs`, `status` (`src/features/agent-work-contract/engine/chain-executor.ts:256-264`)

### Trajectory Events

Handoff actions emit trajectory events via `recordTrajectoryEvent()` (`src/core/trajectory/trajectory-store.operations.ts:118-139`) with kind `'handoff'` and summary like `handoff:{id}:created`, `handoff:{id}:updated`, `handoff:{id}:closed`, `handoff:{id}:delegation-dispatched`

---

## Test Coverage

### Direct Tests

| Test File | What It Tests | Lines |
|-----------|--------------|-------|
| `tests/delegation-schema-validation.test.ts` | Zod schema validation: malformed records, invalid evidence kinds, invalid status, missing packet fields, valid records accepted | Full file (214 lines) |
| `tests/runtime-resilience.test.ts` | Resilience: read returns null for missing, update returns null for missing, list returns empty for missing dir, corrupted JSON handling (documents indistinguishability issue) | Lines 218-252 |
| `tests/runtime-resilience.test.ts` | Happy path: `createDelegationHandoff` works correctly | Lines 254+ |
| `tests/runtime-entry-contract.test.ts` | Integration: handoff creation persists delegation continuity, preserves linked contract, chain action executes | Lines 275-365 |
| `tests/plugin-runtime.test.ts` | Integration: handoff creation via `executeHivemindHandoffAction`, continuity linkage verified | Lines 709-757 |
| `tests/runtime-tools.test.ts` | Tool catalog: `hivemind_handoff` listed in managed tools, chain action support verified | Lines 27, 180 |
| `tests/plugin-assembly-smoke.test.ts` | Plugin assembly: `hivemind_handoff` registered in plugin tool map | Lines 51, 129 |
| `src/features/agent-work-contract/engine/chain-executor.test.ts` | `dispatchDelegationHandoffPacketAction` projects delegation refs without mutating canonical task state | Lines 252-380 |

### What's NOT Tested

1. **No dedicated test file for `src/tools/handoff/tools.ts`** — the tool factory itself has no unit tests. Testing occurs indirectly through integration tests that call `executeHivemindHandoffAction()`.
2. **No tests for `list` action** — only the resilience test checks empty directory case.
3. **No tests for `update` action** — only resilience test checks non-existent ID case.
4. **No tests for `validate` action** — only the store-level `validateDelegationHandoff` is tested indirectly through `close`.
5. **No tests for `close` action** — only tested as part of the integration test in `runtime-entry-contract.test.ts`.
6. **No tests for the pressure contract wiring** (`handoffActionPressureContracts` in `types.ts:111-118`).
7. **No tests for `syncDelegationContinuity()`** — tested only as a side effect of integration tests.
8. **No tests for the `metadata` output** passed via `context.metadata()` (`src/tools/handoff/tools.ts:47-49`).

---

## Callers

### Primary Caller: OpenCode Plugin Assembly

**File:** `src/plugin/opencode-plugin.ts:130`

```typescript
hivemind_handoff: createHivemindHandoffTool(directory),
```

The tool is registered in the plugin's `tool` map, making it available to all agents during sessions.

### Tool Governance

**File:** `src/hooks/runtime-loader/tool-governance.ts:12`

`hivemind_handoff` is listed in `HIVEMIND_MANAGED_TOOLS` set, enabling trajectory event recording on tool calls.

### Agent Tool Catalog

**File:** `src/tools/index.ts:57-64`

Registered in `agentToolCatalog` with:
- `stateAuthority: 'delegation'`
- `workflowPhase: 'recovery-checkpoint'`
- `purposeClasses: ['research', 'implementation', 'gatekeeping', 'course-correction']`
- `pressureContract: 'handoff-validation'`

### Pressure Contracts

**File:** `src/shared/pressure-contract.ts:190-257`

Two pressure contracts apply:
- `'delegated-handoff'` (line 190) — for `create` action. Safety level: `'gated'`. Required artifacts: `handoff-record`, `route-decision`.
- `'handoff-validation'` (line 241) — for `read`, `list`, `update`, `validate`, `close` actions. Safety level: `'gated'`. Required artifacts: `handoff-record`, `validation-result`.

### Downstream Consumers

| Consumer | File | What It Consumes |
|----------|------|-----------------|
| Chain Executor | `src/features/agent-work-contract/engine/chain-executor.ts:215-293` | Receives handoff record, projects delegation onto contract |
| Workflow Continuity | `src/features/runtime-entry/workflow-continuity.ts:232-279` | Upserts continuity linkage with delegation metadata |
| Trajectory Store | `src/core/trajectory/trajectory-store.operations.ts:118-139` | Records handoff events on the trajectory ledger |

### Indirect Callers (via `executeHivemindHandoffAction`)

- `tests/runtime-entry-contract.test.ts:304` — integration test
- `tests/plugin-runtime.test.ts:709` — plugin runtime test

---

## Architecture Notes

### CQRS Boundary

The handoff tool follows the CQRS pattern established in AGENTS.md:
- **Write-side:** `createDelegationHandoff`, `updateDelegationHandoff`, `closeDelegationHandoff` in `delegation-store.ts`
- **Read-side:** `readDelegationHandoff`, `listDelegationHandoffs`, `validateDelegationHandoff` in `delegation-store.ts`
- **Feature layer:** `executeHivemindHandoffAction` in `handoff.ts` orchestrates, does not persist directly
- **Tool layer:** `createHivemindHandoffTool` in `tools.ts` is the thin LLM-facing adapter

### State Machine

Handoff status transitions:
```
open → validated → closed
```
- `create` → status: `'open'`
- `validate` → status: `'validated'` (only if all required evidence present)
- `close` → status: `'closed'` (only if validation passes first — gated)
- `update` → status unchanged (only merges summary, nextSteps, evidence)

### Known Design Issue

**File:** `tests/runtime-resilience.test.ts:233-252`

The `readHandoffFile()` function (`src/delegation/delegation-store.ts:113-120`) returns `null` for both "file not found" and "corrupted JSON" cases. Callers cannot distinguish between a handoff that was never created versus one that existed but became corrupted. The `readHandoffFileResult()` function (line 66) does distinguish these cases with structured `ValidationError` types, but the simpler `readHandoffFile()` discards that information.
