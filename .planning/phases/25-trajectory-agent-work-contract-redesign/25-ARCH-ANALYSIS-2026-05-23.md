# Architecture Cross-Reference: Trajectory + Agent-Work-Contract

**Analysis Date:** 2026-05-23
**Scope:** `src/task-management/trajectory/` + `src/features/agent-work-contracts/` + plugin integration
**Sources:** All `.ts` files in both modules, `src/plugin.ts`, `src/shared/types.ts`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`

---

## 1. CQRS Compliance

### Trajectory (`src/task-management/trajectory/`)

| Operation | Direction | File:Line | CQRS Compliant? |
|-----------|-----------|-----------|-----------------|
| `inspectTrajectoryLedger` | READ | `store-operations.ts:20` | ✅ |
| `traverseTrajectory` | READ | `store-operations.ts:120` | ✅ |
| `attachTrajectoryEvidence` | WRITE | `store-operations.ts:31` | ✅ (called via tool) |
| `checkpointTrajectory` | WRITE | `store-operations.ts:49` | ✅ (called via tool) |
| `eventTrajectory` | WRITE | `store-operations.ts:73` | ✅ (called via tool) |
| `closeTrajectory` | WRITE | `store-operations.ts:99` | ✅ (called via tool) |

Tool wrapper at `src/tools/hivemind/hivemind-trajectory.ts:28-56` correctly acts as the CQRS write-side entry point. All mutations go through the tool → schema validation → `store-operations.ts` path. **Trajectory is CQRS compliant.**

### Agent-Work-Contracts (`src/features/agent-work-contracts/`)

| Operation | Direction | File:Line | CQRS Compliant? |
|-----------|-----------|-----------|-----------------|
| `readAgentWorkContracts` | READ | `store.ts:27` | ✅ |
| `getAgentWorkContract` | READ | `store.ts:79` | ✅ |
| `upsertAgentWorkContract` | WRITE | `store.ts:61` | ✅ (called via tool) |
| `createAgentWorkContract` | WRITE | `operations.ts:26` | ✅ (called via tool) |
| `exportAgentWorkContract` | READ | `operations.ts:76` | ✅ (called via tool) |

Tool wrappers at `src/tools/hivemind/hivemind-agent-work.ts:28-69` and `:78-96` correctly act as the CQRS write-side entry points.

### ⚠️ CQRS Violation Found

**`src/features/agent-work-contracts/operations.ts:58`** directly calls `attachTrajectoryEvidence` from `src/task-management/trajectory/store-operations.ts`.

```typescript
// operations.ts:57-64
if (input.trajectoryId && trajectoryEvidenceRef) {
  attachTrajectoryEvidence({
    projectRoot: input.projectRoot,
    trajectoryId: input.trajectoryId,
    sessionId: input.owner.sessionId,
    evidenceRef: trajectoryEvidenceRef,
  })
}
```

This is a **Feature → Task-Management direct write call**, bypassing the tool layer. The `createAgentWorkContract` function performs both:
1. A write to agent-work-contracts store (its own domain — correct)
2. A write to the trajectory ledger (cross-domain — bypasses CQRS boundaries)

**Severity:** MEDIUM. The agent-work-contracts feature module is performing a cross-module durable write that should be routed through the tool layer or through an injected callback from `plugin.ts`.

---

## 2. 9-Surface Authority Mapping

Per `ARCHITECTURE.md` and source-plane architecture:

### Trajectory

| Surface | Assignment | Authority | Evidence |
|---------|-----------|-----------|----------|
| Types | `types.ts` in `src/task-management/trajectory/` | Define `TrajectoryRecord`, `TrajectoryEvent`, `TrajectoryCheckpoint`, `TrajectoryLedger` | `types.ts:23-108` |
| Persistence | `ledger.ts` in same module | Read/write `.hivemind/state/trajectory-ledger.json` | `ledger.ts:19-72` |
| Operations | `store-operations.ts` in same module | CRUD on trajectory records | `store-operations.ts:20-134` |
| Barrel | `index.ts` | Re-export all 3 public surfaces | `index.ts:1-3` |
| Schema | `src/schema-kernel/trajectory.schema.ts` | Zod validation for tool input | `trajectory.schema.ts:11-48` |
| Tool | `src/tools/hivemind/hivemind-trajectory.ts` | CQRS write-side entry point | `hivemind-trajectory.ts:28-56` |

**Verdict:** Trajectory correctly spans types → persistence → operations → schema → tool. All 5 layers are present and separated.

### Agent-Work-Contracts

| Surface | Assignment | Authority | Evidence |
|---------|-----------|-----------|----------|
| Types | `types.ts` in `src/features/agent-work-contracts/` | Define `CreateAgentWorkContractInput`, result types | `types.ts:24-89` |
| Schema types | Re-exported from `src/schema-kernel/` | `AgentWorkContract`, `AgentWorkScope`, etc. | `types.ts:10-19` |
| Persistence | `store.ts` in same module | Read/write `.hivemind/state/agent-work-contracts.json` | `store.ts:16-52` |
| Operations | `operations.ts` in same module | Create + export logic with pressure gates | `operations.ts:26-85` |
| Barrel | `index.ts` | Re-export all 3 public surfaces | `index.ts:1-3` |
| Schema | `src/schema-kernel/agent-work-contract.schema.ts` | Full Zod validation (148 lines) | `agent-work-contract.schema.ts:1-148` |
| Tool | `src/tools/hivemind/hivemind-agent-work.ts` | CQRS write-side (create + export) | `hivemind-agent-work.ts:28-150` |

**Verdict:** Correctly spans all required layers. Schema file is notably comprehensive (148 lines) with 8 distinct Zod schemas.

---

## 3. Dependency Graph Analysis

### Trajectory Import Graph

```
ledger.ts
  ├── node:crypto (stdlib)
  ├── node:fs (stdlib)
  ├── node:path (stdlib)
  ├── ../../shared/security/path-scope.js (leaf shared) ✅
  └── ./types.js (own types) ✅

store-operations.ts
  ├── node:crypto (stdlib)
  ├── ./ledger.js (own module) ✅
  └── ./types.js (own types) ✅
```

**Verdict:** Clean, no circular dependencies, no violations. Trajectory depends only on shared leaf and itself.

### Agent-Work-Contracts Import Graph

```
store.ts
  ├── node:crypto (stdlib)
  ├── node:fs (stdlib)
  ├── node:path (stdlib)
  ├── ../../schema-kernel/agent-work-contract.schema.js (schema kernel) ✅
  └── ../../shared/security/path-scope.js (leaf shared) ✅

operations.ts
  ├── node:crypto (stdlib)
  ├── ../../task-management/trajectory/index.js (TASK-MANAGEMENT) ⚠️
  ├── ../runtime-pressure/index.js (sibling feature) ✅
  ├── ./store.js (own module) ✅
  └── ./types.js (own types) ✅

types.ts
  ├── ../../schema-kernel/agent-work-contract.schema.js (schema kernel) ✅
  └── ../runtime-pressure/index.js (sibling feature) ✅
```

### ⚠️ Dependency Rule Violation

`src/features/agent-work-contracts/operations.ts:3` imports from `../../task-management/trajectory/index.js`.

Per `ARCHITECTURE.md:112-113`:
> **Feature Layer Depends on:** `src/shared/`, `src/schema-kernel/`, selected coordination helpers.

Task-management is NOT listed as a dependency of features. The architecture diagram (`ARCHITECTURE.md:109-114`) places features at the same horizontal level as task-management, with tools above them both. Features should not import from task-management.

**Severity:** HIGH. This is both a CQRS violation (cross-module write) and a dependency hierarchy violation (feature depends on task-management).

### Resolution Path for Phase 25

The dependency must be inverted. Options:

1. **Callback injection**: `operations.ts` accepts an optional `onContractCreated?(contract, trajectoryId)` callback wired at the tool level in `hivemind-agent-work.ts`. The tool then decides whether to call trajectory. This removes the direct import and keeps both modules independent.

2. **Event surface**: Define a thin event surface in `src/shared/` or `src/features/` that both trajectory and agent-work-contracts implement. Not justified for a single use case.

3. **Tool-level orchestration**: Move the `attachTrajectoryEvidence` call from `operations.ts` into the tool wrapper `hivemind-agent-work.ts:executeAgentWorkCreateToolAction()`, keeping both feature modules independent. The tool becomes the orchestrator.

---

## 4. State Root Compliance (Q6)

Both systems correctly persist to `.hivemind/state/`:

| System | File Path | Evidence |
|--------|-----------|----------|
| Trajectory | `.hivemind/state/trajectory-ledger.json` | `ledger.ts:21` — `resolve(projectRoot, ".hivemind", "state")` |
| Agent-Work-Contracts | `.hivemind/state/agent-work-contracts.json` | `store.ts:17` — `resolve(projectRoot, ".hivemind", "state")` |

Both use `assertPathWithinRoot()` for path traversal protection:
- `ledger.ts:21` — `assertPathWithinRoot(stateRoot, "trajectory-ledger.json", "trajectory ledger")`
- `store.ts:18` — `assertPathWithinRoot(stateDir, "agent-work-contracts.json", "agent work contracts")`

Neither system writes to `.opencode/`. ✅

### Additional State-Root Observations

- Trajectory ledger has a quarantine mechanism for corrupt JSON (`ledger.ts:74-78`) — renames corrupt files to `.corrupt-{timestamp}-{pid}-{uuid}`.
- Agent-work-contracts store has a similar quarantine (`store.ts:98-100`) and also uses atomic writes (write to `.tmp` then `renameSync` at `store.ts:49-51`).
- Trajectory uses a schema version constant (`TRAJECTORY_LEDGER_VERSION = 1`, `types.ts:4`) embedded in the JSON.
- Agent-work-contracts uses a local `STORE_VERSION = 1` (`store.ts:8`) — not exported like trajectory's.

**Minor inconsistency:** Trajectory exports its version constant (`TRAJECTORY_LEDGER_VERSION`) and uses it for runtime schema validation in `ledger.ts:80-85`. Agent-work-contracts does its version check only through the Zod schema (`AgentWorkContractStoreSchema` uses `z.literal(1)`).

---

## 5. Module Size Audit

| Module | File | LOC | Under 500? |
|--------|------|-----|------------|
| Trajectory types | `types.ts` | 128 | ✅ |
| Trajectory ledger | `ledger.ts` | 93 | ✅ |
| Trajectory operations | `store-operations.ts` | 190 | ✅ |
| Trajectory barrel | `index.ts` | 3 | ✅ |
| Agent-work-contract types | `types.ts` | 89 | ✅ |
| Agent-work-contract store | `store.ts` | 146 | ✅ |
| Agent-work-contract operations | `operations.ts` | 162 | ✅ |
| Agent-work-contract barrel | `index.ts` | 3 | ✅ |
| Trajectory tool | `src/tools/hivemind/hivemind-trajectory.ts` | 112 | ✅ |
| Agent-work tool | `src/tools/hivemind/hivemind-agent-work.ts` | 152 | ✅ |
| Trajectory schema | `src/schema-kernel/trajectory.schema.ts` | 49 | ✅ |
| Agent-work-contract schema | `src/schema-kernel/agent-work-contract.schema.ts` | 148 | ✅ |

**Verdict:** All modules well under 500 LOC. ✅ No split needed.

---

## 6. Plugin Integration Points

Both systems are wired through `src/plugin.ts` at tool registration:

```typescript
// plugin.ts:442
"hivemind-trajectory": createHivemindTrajectoryTool(projectDirectory),

// plugin.ts:450-451
"hivemind-agent-work-create": createHivemindAgentWorkCreateTool(projectDirectory),
"hivemind-agent-work-export": createHivemindAgentWorkExportTool(projectDirectory),
```

### Integration Pattern

Both follow the same pattern:
1. Tool factory receives `projectDirectory` at composition time.
2. Tool factory creates a `tool()` instance with Zod-flavored args schema.
3. On execution, the tool calls schema validation, then delegates to deeper module operations.
4. Deeper modules (`store-operations.ts`, `operations.ts`) perform I/O directly — no dependency injection for file paths or store references.

### What's Missing

- **No hook integration:** Neither trajectory nor agent-work-contracts has any hook consumer. They are purely tool-triggered.
- **No lifecycle integration:** Trajectory records are created manually via tool calls, not automatically during delegation dispatch or session completion. Agent-work-contracts are similarly manual.
- **No automatic startup recovery:** Agent-work-contracts have no startup recovery path (unlike delegation which has `recoverPending()` in `plugin.ts:275`). Trajectory has no startup recovery either.

---

## 7. Violations Found

| ID | Severity | Description | File:Line | Rule |
|----|----------|-------------|-----------|------|
| V-01 | **MEDIUM** | Feature → Task-Management direct write call | `src/features/agent-work-contracts/operations.ts:58` | CQRS: cross-module write bypasses tool layer |
| V-02 | **HIGH** | Feature imports from Task-Management | `src/features/agent-work-contracts/operations.ts:3` | ARCHITECTURE.md:112-113 — features must not depend on task-management |
| V-03 | **LOW** | No startup recovery for trajectory or agent-work-contracts | `src/plugin.ts:275` (only delegation recovers) | Resiliency gap: records can be stale after restart |
| V-04 | **LOW** | No lifecycle hooks for trajectory/agent-work-contracts | No hooks wiring in `plugin.ts` | Automatic trajectory creation during session lifecycle is unimplemented |
| V-05 | **INFO** | Inconsistency: trajectory exports version constant for validation; agent-work-contracts keeps it as module-private | `types.ts:4` vs `store.ts:8` | Convention drift |

---

## 8. Recommendations

### For Phase 25 (Trajectory + Agent-Work-Contract Redesign)

1. **Fix V-01/V-02 (HIGH):** Remove the direct `attachTrajectoryEvidence` call from `operations.ts:58`. Wire it through the tool layer instead:
   - Add an optional callback to `createAgentWorkContract()`: `onContractCreated?: (contract, trajectoryId) => void`
   - Pass the callback from the tool wrapper `executeAgentWorkCreateToolAction()` in `hivemind-agent-work.ts`
   - The tool calls `attachTrajectoryEvidence` itself, keeping both feature modules independent

2. **Fix V-03 (LOW):** Add startup recovery for trajectory and agent-work-contracts in `plugin.ts`:
   - Scan trajectory ledger for open trajectories and log warnings
   - Verify agent-work-contracts store integrity on plugin init

3. **Fix V-05 (INFO):** Export `STORE_VERSION` from `agent-work-contracts/store.ts` for consistency with trajectory's exported `TRAJECTORY_LEDGER_VERSION`.

4. **DOCUMENTATION UPDATE:** Update `ARCHITECTURE.md` Feature Layer dependency rules to clarify that features may consume selected task-management contracts only through injected callbacks, never through direct `import` of deep module functions.

---

*Analysis: 2026-05-23 | Sources: 14 files read (9 source, 2 tool, 3 schema + plugin.ts) | Findings: 1 HIGH, 1 MEDIUM, 2 LOW, 1 INFO*
