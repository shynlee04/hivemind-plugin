# System Audit: Trajectory + Contract + Pressure

**Date:** 2026-05-29
**Auditor:** System audit against source code
**Scope:** `src/task-management/trajectory/`, `src/features/agent-work-contracts/`, `src/features/runtime-pressure/`, integration points in delegation, lifecycle, continuity, and plugin.ts

---

## Trajectory Module

### Source Files
| File | LOC | Purpose |
|------|-----|---------|
| `src/task-management/trajectory/types.ts` | 128 | Type definitions, version marker |
| `src/task-management/trajectory/ledger.ts` | 93 | Disk I/O, path resolution, corrupt quarantine |
| `src/task-management/trajectory/store-operations.ts` | 190 | All mutating operations + traversal |
| `src/task-management/trajectory/index.ts` | 3 | Barrel re-exports |

### Operations
| Operation | LOC | Tests | Works | Notes |
|-----------|-----|-------|-------|-------|
| `inspectTrajectoryLedger` | 20:23 | ✅ 2 tests | Yes | Read-only inspection, supports single-trajectory lookup |
| `attachTrajectoryEvidence` | 31:41 | ✅ 3 tests | Yes | Creates trajectory if missing, deduplicates evidence refs |
| `checkpointTrajectory` | 49:65 | ✅ 1 test | Yes | Creates checkpoint with auto-generated ID |
| `eventTrajectory` | 73:90 | ✅ 2 tests | Yes | Creates event with custom or auto-generated ID |
| `closeTrajectory` | 99:112 | ✅ 2 tests | Yes | Sets status to "closed", throws on missing trajectory |
| `traverseTrajectory` | 120:134 | ✅ 3 tests | Yes | Filters by rootSessionId, sessionId, or trajectoryId; builds parent-child edges |
| `createTrajectoryLedger` | 188:190 | ✅ 1 test | Yes | Empty ledger factory |
| `readTrajectoryLedger` | 41:58 | ✅ 4 tests | Yes | Corrupt quarantine, normalization of missing updatedAt |
| `writeTrajectoryLedger` | 67:72 | ✅ 1 test | Yes | Atomic write with mkdir |

### Test Files
| File | Tests | Coverage |
|------|-------|----------|
| `tests/task-management/trajectory/types.test.ts` | 8 | Type shape validation |
| `tests/task-management/trajectory/ledger.test.ts` | 7 | Read/write, corrupt handling, normalization |
| `tests/task-management/trajectory/store-operations.test.ts` | 14 | All operations + traversal filters |
| `tests/task-management/trajectory/index.test.ts` | 3 | Re-export verification |
| **Total** | **32** | |

### Integration
- **Used by delegation manager?** NO — `src/coordination/delegation/manager.ts` has zero imports from trajectory. No trajectory references found in the entire `src/coordination/delegation/` directory.
- **Used by lifecycle manager?** NO — `src/task-management/lifecycle/index.ts` has zero imports from trajectory.
- **Used by continuity module?** NO — `src/task-management/continuity/index.ts` has zero imports from trajectory.
- **Registered as tool?** YES — `hivemind-trajectory` registered in `plugin.ts:163` via `registerHivemindTools`. Tool implementation at `src/tools/hivemind/hivemind-trajectory.ts` (112 LOC) exposes all 6 actions.
- **In authority matrix?** YES — `authority-matrix.ts:141-149`: authority=state, mutatesState=true, evidenceAttachment=trajectory-ledger.

### Critical Finding: Closed Trajectories Are NOT Immutable
`closeTrajectory` (`store-operations.ts:99-112`) sets `status: "closed"` but **no operation checks status before mutation**. The `upsertTrajectory` function at line 136 updates existing trajectories without checking if they are closed. This means:
- `attachTrajectoryEvidence` on a closed trajectory **succeeds and mutates evidenceRefs**
- `checkpointTrajectory` on a closed trajectory **succeeds and appends checkpoints**
- `eventTrajectory` on a closed trajectory **succeeds and appends events**

The JSDoc on `closeTrajectory` says "preserving all existing evidence" but does not claim immutability. However, the `TrajectoryStatus` type (`types.ts:9`) only has `"active" | "closed"` — the closed state is decorative, not enforced.

---

## Agent-Work-Contract Module

### Source Files
| File | LOC | Purpose |
|------|-----|---------|
| `src/features/agent-work-contracts/types.ts` | 89 | Input/result types, re-exports from schema |
| `src/features/agent-work-contracts/store.ts` | 146 | Disk I/O, deep-clone, Zod validation on read |
| `src/features/agent-work-contracts/operations.ts` | 171 | Create, export, find-by-trajectory |
| `src/features/agent-work-contracts/lifecycle.ts` | 115 | State machine: start, block, complete, cancel |
| `src/features/agent-work-contracts/bounds.ts` | 21 | Compaction field limits (single source of truth) |
| `src/features/agent-work-contracts/index.ts` | 4 | Barrel re-exports |
| `src/schema-kernel/agent-work-contract.schema.ts` | 150 | Zod schemas, tool input parsers |

### Operations
| Operation | LOC | Tests | Works | Notes |
|-----------|-----|-------|-------|-------|
| `createAgentWorkContract` | operations.ts:22-64 | ✅ 5 tests (cross-linking) + 4 tests (store) | Yes | Pressure-gated, cross-links to trajectory |
| `exportAgentWorkContract` | operations.ts:73-82 | ✅ 1 test | Yes | JSON or Markdown, read-only |
| `findContractsByTrajectory` | operations.ts:168-171 | ✅ 3 tests | Yes | Filters store by trajectoryId |
| `startContract` | lifecycle.ts:35-38 | ✅ 2 tests | Yes | created→running, blocked→running |
| `blockContract` | lifecycle.ts:49-53 | ✅ 2 tests | Yes | running→blocked, stores reason |
| `completeContract` | lifecycle.ts:64-70 | ✅ 2 tests | Yes | running→completed, optional proof |
| `cancelContract` | lifecycle.ts:81-85 | ✅ 3 tests | Yes | created/running/blocked→cancelled |
| `readAgentWorkContracts` | store.ts:27-38 | ✅ 1 test | Yes | Zod validation, corrupt quarantine |
| `persistAgentWorkContracts` | store.ts:46-52 | ✅ (indirect) | Yes | Atomic write via tmp+rename |
| `upsertAgentWorkContract` | store.ts:61-70 | ✅ (indirect) | Yes | Read-modify-write |
| `getAgentWorkContract` | store.ts:79-82 | ✅ (indirect) | Yes | Deep-cloned single read |

### Test Files
| File | Tests | Coverage |
|------|-------|----------|
| `tests/features/agent-work-contracts/cross-linking.test.ts` | 6 | Trajectory cross-linking |
| `tests/features/agent-work-contracts/lifecycle.test.ts` | 12 | All lifecycle transitions + invalid transition errors |
| `tests/lib/agent-work-contracts/store.test.ts` | 5 | Store persistence, pressure gates, compaction bounds, export, deep-clone |
| **Total** | **23** | |

### Integration
- **Used by delegation manager?** NO — `src/coordination/delegation/manager.ts` has zero imports from agent-work-contracts.
- **Used by lifecycle manager?** NO — `src/task-management/lifecycle/index.ts` has zero imports from agent-work-contracts.
- **Registered as tool?** YES — Two tools in `plugin.ts:168-169`:
  - `hivemind-agent-work-create` → `src/tools/hivemind/hivemind-agent-work.ts` (152 LOC)
  - `hivemind-agent-work-export` → same file
- **In authority matrix?** YES — Both registered:
  - `hivemind-agent-work-create` at `authority-matrix.ts:181-189`: authority=state, mutatesState=true
  - `hivemind-agent-work-export` at `authority-matrix.ts:190-199`: authority=read, mutatesState=false

### Lifecycle State Machine
```
created → running, cancelled
running → blocked, completed, cancelled
blocked → running, cancelled
completed → (terminal)
cancelled → (terminal)
```
**Formally defined** at `lifecycle.ts:19-25` with `ALLOWED_TRANSITIONS` record. **Enforced** by `transitionContract` at `lifecycle.ts:99-114` which throws `[Harness]`-prefixed errors on invalid transitions.

---

## Runtime-Pressure Module

### Source Files
| File | LOC | Purpose |
|------|-----|---------|
| `src/features/runtime-pressure/types.ts` | 156 | All types: tiers, bands, outcomes, authority, behaviors |
| `src/features/runtime-pressure/model.ts` | 52 | Pure classifier: tier clamping, band mapping |
| `src/features/runtime-pressure/control-plane.ts` | 161 | Pure detector: outcome resolution, severity, rationale |
| `src/features/runtime-pressure/authority-matrix.ts` | 252 | Tool catalog: 16 registered tools, behavior templates |
| `src/features/runtime-pressure/index.ts` | 4 | Barrel re-exports |

### Operations
| Operation | LOC | Tests | Works | Notes |
|-----------|-----|-------|-------|-------|
| `classifyRuntimePressure` | model.ts:37-40 | ✅ 6 tests | Yes | Pure: score→tier→band |
| `getPressureBand` | model.ts:24-29 | ✅ 4 tests | Yes | Pure: tier→band mapping |
| `clampPressureTier` | model.ts:48-52 | ✅ (indirect) | Yes | Clamps NaN, negatives, >9 |
| `detectRuntimePressure` | control-plane.ts:30-49 | ✅ 4 tests + 6 conformance tests | Yes | Pure: full decision with severity, rationale, recommended action |
| `getToolAuthority` | authority-matrix.ts:237-241 | ✅ 3 tests | Yes | Lookup by name, deep-cloned |
| `inspectToolAuthorityCatalog` | authority-matrix.ts:227-229 | ✅ 3 tests | Yes | Full catalog copy |

### Test Files
| File | Tests | Coverage |
|------|-------|----------|
| `tests/lib/runtime-pressure/model.test.ts` | 6 | Band mapping, clamping, tier verbatim |
| `tests/lib/runtime-pressure/control-plane.test.ts` | 4 | All 5 outcomes, tool-specific decisions |
| `tests/lib/runtime-pressure/authority-matrix.test.ts` | 2 | Catalog coverage, authority levels |
| `tests/lib/runtime-pressure/phase59-authority-matrix.test.ts` | 1 | Supervisor + command engine entries |
| `tests/lib/runtime-pressure/phase67-conformance.test.ts` | 5 | Full Phase 57 contract conformance |
| `tests/tools/hivemind-pressure.test.ts` | 2 | Tool integration: classify, detect, inspect, attach_event |
| **Total** | **20** | |

### Integration
- **Used by contract creation?** YES — `operations.ts:4` imports `detectRuntimePressure` from `../runtime-pressure/index.js`. Called at `operations.ts:23-27` to gate contract creation. Pressure-blocked contracts return `AgentWorkCreatePressureBlocked` without touching the store.
- **Registered as tool?** YES — `hivemind-pressure` registered in `plugin.ts:164` via `registerHivemindTools`. Tool at `src/tools/hivemind/hivemind-pressure.ts` (94 LOC) exposes 4 actions: classify, detect, inspect_tool_catalog, attach_event.
- **Authority matrix coverage:** 16 tools registered (`authority-matrix.ts:59-220`).

### Authority Matrix — Registered Tools (16)
| Tool | Authority | mutatesState | canExecute | State Surface | Evidence Attachment |
|------|-----------|-------------|------------|---------------|-------------------|
| delegate-task | execute | true | true | external-command | execution-lineage |
| delegation-status | read | false | false | read-only | none |
| run-background-command | execute | false | true | external-command | execution-lineage |
| prompt-skim | read | false | false | read-only | none |
| prompt-analyze | read | false | false | read-only | none |
| session-patch | write | true | false | hivemind-state | session-journal |
| session-journal-export | read | false | false | read-only | none |
| hivemind-doc | read | false | false | read-only | none |
| hivemind-trajectory | state | true | false | hivemind-state | trajectory-ledger |
| hivemind-pressure | state | true | false | hivemind-state | trajectory-ledger |
| hivemind-sdk-supervisor | read | false | false | read-only | none |
| hivemind-command-engine | read | false | false | read-only | none |
| hivemind-agent-work-create | state | true | false | hivemind-state | trajectory-ledger |
| hivemind-agent-work-export | read | false | false | read-only | none |
| configure-primitive | write | true | false | opencode-primitive | execution-lineage |
| validate-restart | read | false | false | read-only | none |

---

## Cross-Module Integration Map

### Actual Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    plugin.ts (composition root)          │
│                                                         │
│  registerHivemindTools() registers:                     │
│    hivemind-trajectory ──→ trajectory/store-operations   │
│    hivemind-pressure   ──→ runtime-pressure + trajectory │
│    hivemind-agent-work-create ──→ contracts/operations   │
│    hivemind-agent-work-export ──→ contracts/operations   │
│                                                         │
│  registerDelegationTools() registers:                   │
│    delegate-task ──→ delegation/manager (NO trajectory)  │
│    delegation-status ──→ delegation/manager (NO contract)│
└─────────────────────────────────────────────────────────┘

Cross-module connections:
  contracts/operations.ts ──imports──→ trajectory/index.ts
  contracts/operations.ts ──imports──→ runtime-pressure/index.ts
  pressure tool ──imports──→ trajectory/index.ts (for attach_event)
  delegation/manager.ts ──imports──→ NOTHING from trajectory/contract/pressure
  lifecycle/index.ts    ──imports──→ NOTHING from trajectory/contract/pressure
  continuity/index.ts   ──imports──→ NOTHING from trajectory/contract/pressure
```

### What Connects
1. **Contract → Trajectory**: `createAgentWorkContract` calls `attachTrajectoryEvidence` when `trajectoryId` is provided (`operations.ts:53-61`). This cross-links contract creation to the trajectory ledger.
2. **Contract → Pressure**: `createAgentWorkContract` calls `detectRuntimePressure` to gate writes (`operations.ts:23-34`). Blocking pressure prevents store mutation.
3. **Pressure → Trajectory**: The `hivemind-pressure` tool's `attach_event` action calls `eventTrajectory` to write pressure evidence to the trajectory ledger (`hivemind-pressure.ts:78-89`).

### What Does NOT Connect
1. **Delegation → Trajectory**: The delegation manager (`manager.ts`, 416 LOC) has zero awareness of trajectories. Delegation dispatch, completion, abort, and cancel operations never write trajectory evidence.
2. **Delegation → Contracts**: The delegation manager has zero awareness of agent work contracts. Delegation lifecycle events never create, start, block, or complete contracts.
3. **Lifecycle → Trajectory**: The lifecycle manager (`lifecycle/index.ts`, 242 LOC) manages session lifecycle phases (created→queued→dispatching→running→completed/failed) but never writes trajectory checkpoints or events.
4. **Lifecycle → Contracts**: The lifecycle manager has zero awareness of contracts. Session lifecycle transitions don't trigger contract lifecycle transitions.
5. **Continuity → Trajectory**: The continuity module (`continuity/index.ts`, 467 LOC) manages session continuity records but never references trajectory IDs or writes trajectory evidence.

---

## Gaps Found

### GAP-1: 8 Plugin Tools Missing from Authority Matrix (CRITICAL)
The plugin registers 23 tools but the authority matrix only covers 16. Missing tools:

| Missing Tool | Registered At | Risk |
|-------------|---------------|------|
| `execute-slash-command` | `plugin.ts:142` | Executes arbitrary commands — should be external-command |
| `session-tracker` | `plugin.ts:145` | Reads/writes session tracker state |
| `session-hierarchy` | `plugin.ts:146` | Reads session hierarchy |
| `session-context` | `plugin.ts:147` | Reads session context |
| `create-governance-session` | `plugin.ts:148` | Creates governance sessions — mutates state |
| `bootstrap-init` | `plugin.ts:183` | Initializes project state |
| `bootstrap-recover` | `plugin.ts:184` | Recovers project state |
| `hivemind-session-view` | `plugin.ts:168` | Reads session view |

**Impact:** `detectRuntimePressure` called with any of these tool names falls back to `unknownToolFallback` (`control-plane.ts:70-81`) which is conservative (allow/advise/require_approval/block by band). This means these tools bypass per-tool pressure behavior customization.

### GAP-2: Delegation Manager Completely Disconnected from Trajectory/Contracts (HIGH)
The delegation manager (`src/coordination/delegation/manager.ts`) is the primary session dispatch mechanism. It handles dispatch, completion, abort, cancel, resume, chain, and restart. None of these operations:
- Write trajectory evidence (checkpoints, events, evidence refs)
- Create or transition agent work contracts
- Check runtime pressure before dispatching

This means delegated sessions have no trajectory trail and no contract boundaries unless the tool caller explicitly creates them via `hivemind-trajectory` and `hivemind-agent-work-create` tools.

### GAP-3: Closed Trajectories Are Not Immutable (MEDIUM)
`closeTrajectory` sets `status: "closed"` but `upsertTrajectory` (`store-operations.ts:136-163`) does not check status before allowing mutations. All evidence-attaching, checkpoint, and event operations succeed on closed trajectories.

### GAP-4: No Runtime-Pressure Tests in `tests/features/runtime-pressure/` (LOW)
The directory `tests/features/runtime-pressure/` does not exist. All pressure tests live in `tests/lib/runtime-pressure/` (5 files, 18 tests) and `tests/tools/hivemind-pressure.test.ts` (2 tests). This is a directory convention inconsistency — other feature tests use `tests/features/`.

### GAP-5: Lifecycle Manager Disconnected from Contracts (MEDIUM)
The lifecycle manager tracks session phases (created→queued→dispatching→running→completed/failed) via `patchSessionContinuity`. When a session completes or fails, no corresponding contract lifecycle transition (e.g., `completeContract`, `cancelContract`) is triggered. The two state machines are independent.

### GAP-6: No Contract Status Transition on Delegation Terminal Events (MEDIUM)
When a delegation completes (`completed`), errors (`error`), or times out (`timeout`), the delegation manager marks the delegation record but does not check if a corresponding agent work contract exists to transition it. A contract in `running` status can remain `running` indefinitely even after the underlying delegation has terminated.

### GAP-7: `run-background-command` Authority Entry Anomaly (LOW)
At `authority-matrix.ts:81-89`, `run-background-command` has `mutatesState: false` and `canExecute: true`. This is technically correct (it doesn't mutate `.hivemind/state/`), but the tool *does* spawn external processes with unbounded side effects. The `EXTERNAL_COMMAND_RUNNER` behavior template is correctly applied.

### GAP-8: Contract Store Uses Zod Validation on Read but Not on Write (LOW)
`readAgentWorkContracts` (`store.ts:31`) validates via `AgentWorkContractStoreSchema.safeParse`. But `persistAgentWorkContracts` (`store.ts:46-52`) writes the store object directly without re-validation. A corrupted in-memory store could be persisted without schema validation.

---

## Summary

| Module | Source LOC | Test Count | Tool Registered | Authority Matrix | Delegation Integration | Lifecycle Integration |
|--------|-----------|------------|----------------|-----------------|----------------------|---------------------|
| Trajectory | 414 | 32 | ✅ `hivemind-trajectory` | ✅ | ❌ None | ❌ None |
| Agent-Work-Contracts | 596 | 23 | ✅ `hivemind-agent-work-create` + `export` | ✅ | ❌ None | ❌ None |
| Runtime-Pressure | 525 | 20 | ✅ `hivemind-pressure` | ✅ (16/23 tools) | ❌ None | ❌ None |

**Bottom line:** All three modules are internally well-tested and correctly wired as OpenCode tools. The runtime-pressure module correctly gates contract creation. Contracts correctly cross-link to trajectories. However, all three modules are **completely disconnected from the delegation and lifecycle managers** — the two primary runtime subsystems that manage session dispatch and lifecycle transitions. The authority matrix is missing 8 of 23 registered tools.
