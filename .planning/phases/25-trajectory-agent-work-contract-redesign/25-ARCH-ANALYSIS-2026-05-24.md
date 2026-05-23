# Architecture Cross-Reference: Trajectory + Agent-Work-Contract (Round 3/3 Verification)

**Analysis Date:** 2026-05-24
**Scope:** `src/task-management/trajectory/` + `src/features/agent-work-contracts/` + plugin integration
**Sources:** All `.ts` files in both modules, `src/plugin.ts`, `src/shared/types.ts`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
**Round:** 3/3 — Verification of prior findings against current source

---

## Executive Summary

This round-3 verification cross-references the trajectory and agent-work-contract systems against the project's architecture rules. Of the 5 findings from round 2 (2026-05-23), **5 remain open** (0 fixed). One additional finding (Shared-Layer Violation) is elevated from INFO to MEDIUM. The primary architectural debt remains: `src/features/agent-work-contracts/operations.ts` directly imports and writes to `src/task-management/trajectory/`, an inter-layer dependency that violates both CQRS boundaries and the feature-layer dependency contract.

| Prior ID | Severity | Status |
|----------|----------|--------|
| V-01 | MEDIUM | 🔴 Still Open |
| V-02 | HIGH | 🔴 Still Open |
| V-03 | LOW | 🔴 Still Open |
| V-04 | LOW | 🔴 Still Open |
| V-05 | INFO | 🔴 Still Open |
| V-06 (new) | MEDIUM | 🔴 NEW |

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

### 🔴 V-01 (Still Open): Feature → Task-Management Direct Write Call

**`src/features/agent-work-contracts/operations.ts:58`** directly calls `attachTrajectoryEvidence` from `src/task-management/trajectory/store-operations.ts`:

```typescript
// operations.ts:57-64 (verified still present 2026-05-24)
if (input.trajectoryId && trajectoryEvidenceRef) {
  attachTrajectoryEvidence({
    projectRoot: input.projectRoot,
    trajectoryId: input.trajectoryId,
    sessionId: input.owner.sessionId,
    evidenceRef: trajectoryEvidenceRef,
  })
}
```

**Round 2 → Round 3 status:** Unchanged. The direct cross-module call is still present.

**Root cause:** `createAgentWorkContract()` (`operations.ts:26-67`) performs two writes atomically:
1. `upsertAgentWorkContract()` to its own durable store (line 56)
2. `attachTrajectoryEvidence()` to the trajectory ledger (lines 58-63)

The trajectory attach occurs **after** the contract upsert. If the trajectory attach throws, the contract has already been persisted — a partial-failure scenario with no rollback.

**Severity:** MEDIUM. No evidence of runtime failures, but the pattern violates CQRS boundaries.

---

## 2. 9-Surface Authority Mapping

Per `ARCHITECTURE.md:72-143` and source-plane architecture:

### Trajectory Surface Mapping

| Surface | Assignment | Authority | Evidence |
|---------|-----------|-----------|----------|
| Types | `types.ts` in `src/task-management/trajectory/` | Define `TrajectoryRecord`, `TrajectoryEvent`, `TrajectoryCheckpoint`, `TrajectoryLedger` | `types.ts:23-108` |
| Persistence | `ledger.ts` | Read/write `.hivemind/state/trajectory-ledger.json` | `ledger.ts:19-72` |
| Operations | `store-operations.ts` | CRUD on trajectory records | `store-operations.ts:20-134` |
| Barrel | `index.ts` | Re-export all public surfaces | `index.ts:1-3` |
| Schema | `src/schema-kernel/trajectory.schema.ts` | Zod validation for tool input | `trajectory.schema.ts:11-48` (49 LOC) |
| Tool | `src/tools/hivemind/hivemind-trajectory.ts` | CQRS write-side entry point | `hivemind-trajectory.ts:28-56` |

**Verdict:** Trajectory correctly spans all 6 surfaces: types → persistence → operations → barrel → schema → tool.

### Agent-Work-Contracts Surface Mapping

| Surface | Assignment | Authority | Evidence |
|---------|-----------|-----------|----------|
| Types | `types.ts` in `src/features/agent-work-contracts/` | Define `CreateAgentWorkContractInput`, `ExportAgentWorkContractInput`, result types | `types.ts:24-89` |
| Schema types | Re-exported from `src/schema-kernel/` | `AgentWorkContract`, `AgentWorkScope`, `AgentWorkEvidence` | `types.ts:10-19` |
| Persistence | `store.ts` | Read/write `.hivemind/state/agent-work-contracts.json` | `store.ts:16-52` |
| Operations | `operations.ts` | Create + export with pressure gates | `operations.ts:26-85` |
| Barrel | `index.ts` | Re-export all 3 public surfaces | `index.ts:1-3` |
| Schema | `src/schema-kernel/agent-work-contract.schema.ts` | Full Zod validation (148 LOC, 8 schemas) | `agent-work-contract.schema.ts` |
| Tool | `src/tools/hivemind/hivemind-agent-work.ts` | CQRS write-side (create + export) | `hivemind-agent-work.ts:28-150` |

**Verdict:** Correctly spans all required surfaces. Schema is notably comprehensive.

### Cross-Surface Dependencies (Both Systems)

Both systems use `assertPathWithinRoot` from `src/shared/security/path-scope.ts` for path traversal protection:
- `ledger.ts:21`
- `store.ts:18`

Both systems persist to `.hivemind/state/` — canonical Q6 state root. ✅

---

## 3. Dependency Graph

### Trajectory Import Graph

```
ledger.ts
  ├── node:crypto            (stdlib)
  ├── node:fs                (stdlib)
  ├── node:path              (stdlib)
  ├── ../../shared/security/path-scope.js   (leaf shared) ✅
  └── ./types.js             (own types)     ✅

store-operations.ts
  ├── node:crypto            (stdlib)
  ├── ./ledger.js            (own module)    ✅
  └── ./types.js             (own types)     ✅

types.ts
  └── (no imports, pure types + constants)
```

**Verdict:** Clean. Trajectory depends only on stdlib, `src/shared/security/path-scope.js`, and itself. No circular dependencies.

### Agent-Work-Contracts Import Graph

```
store.ts
  ├── node:crypto            (stdlib)
  ├── node:fs                (stdlib)
  ├── node:path              (stdlib)
  ├── ../../schema-kernel/agent-work-contract.schema.js  (schema kernel) ✅
  └── ../../shared/security/path-scope.js   (leaf shared) ✅

operations.ts
  ├── node:crypto            (stdlib)
  ├── ../../task-management/trajectory/index.js     ⚠️  V-02
  ├── ../runtime-pressure/index.js                  (sibling feature) ✅
  ├── ./store.js             (own module) ✅
  └── ./types.js             (own types) ✅

types.ts
  ├── ../../schema-kernel/agent-work-contract.schema.js  (schema kernel) ✅
  └── ../runtime-pressure/index.js                        (sibling feature) ✅
```

### 🔴 V-02 (Still Open): Feature Imports from Task-Management

`src/features/agent-work-contracts/operations.ts:3`:
```typescript
import { attachTrajectoryEvidence } from "../../task-management/trajectory/index.js"
```

**Rule violated:** Per `ARCHITECTURE.md:112-113`:
> **Feature Layer Depends on:** `src/shared/`, `src/schema-kernel/`, selected coordination helpers.

Task-management is NOT listed as a dependency of features. The architecture diagram (ARCHITECTURE.md:109-114) places features and task-management at the same horizontal level, with tools above them both. Features should not import from task-management.

**Round 2 → Round 3 status:** Unchanged. The import is still present.

**Severity:** HIGH. This is both a CQRS violation (cross-module write) and a dependency hierarchy violation.

### Resolution Paths (unchanged from round 2)

1. **Callback injection**: `operations.ts` accepts an optional `onContractCreated?` callback wired at the tool level in `hivemind-agent-work.ts`. The tool decides whether to call trajectory. Removes the direct import.
2. **Tool-level orchestration**: Move the `attachTrajectoryEvidence` call from `operations.ts` into the tool wrapper `hivemind-agent-work.ts:executeAgentWorkCreateToolAction()`.

### Public API Re-Export (NOTE, not a violation)

`src/index.ts:20-22` re-exports both:
```typescript
export * from "./task-management/trajectory/index.js"
export * from "./features/agent-work-contracts/index.js"
```

This is correct — the package's public API barrel should expose both modules. Other npm consumers may legitimately import either.

---

## 4. State Root Compliance (Q6)

Both systems correctly persist to `.hivemind/state/`:

| System | File Path | Code Evidence |
|--------|-----------|---------------|
| Trajectory | `.hivemind/state/trajectory-ledger.json` | `ledger.ts:20-21` |
| Agent-Work-Contracts | `.hivemind/state/agent-work-contracts.json` | `store.ts:16-18` |

Both use `assertPathWithinRoot()` for path traversal security ✅. Neither writes to `.opencode/` ✅.

### Corruption Handling

| System | Quarantine Mechanism | Location |
|--------|---------------------|----------|
| Trajectory | Renames corrupt file to `.corrupt-{ts}-{pid}-{uuid}` | `ledger.ts:74-78` |
| Agent-Work-Contracts | Same pattern | `store.ts:98-100` |
| Agent-Work-Contracts | Atomic write (tmp → rename) | `store.ts:49-51` |

Agent-work-contracts has **atomic writes** (write to `.tmp` then `renameSync`). Trajectory does **not** use atomic writes — `writeTrajectoryLedger()` writes directly to the target file (`ledger.ts:68-71`). This creates a brief window where a partial write could corrupt the ledger.

### 🔴 V-05 (Still Open): Version Constant Inconsistency

| System | Version Source | Exported? | Validation Mechanism |
|--------|---------------|-----------|---------------------|
| Trajectory | `types.ts:4` — `TRAJECTORY_LEDGER_VERSION = 1` | ✅ Exported | Runtime check in `ledger.ts:80-85` (`isTrajectoryLedger`) |
| Agent-Work-Contracts | `store.ts:8` — `STORE_VERSION = 1` | ❌ Module-private | Zod schema literal `z.literal(1)` in `AgentWorkContractStoreSchema` |

**Round 2 → Round 3 status:** Unchanged. `STORE_VERSION` remains non-exported.

### 🔴 NEW V-06 (MEDIUM): Trajectory Lacks Atomic Writes

`src/task-management/trajectory/ledger.ts:68-71`:
```typescript
export function writeTrajectoryLedger(projectRoot: string, ledger: TrajectoryLedger): string {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  mkdirSync(resolve(ledgerPath, ".."), { recursive: true })
  writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf-8")  // ← direct write
  return ledgerPath
}
```

Compare with `store.ts:49-51` which uses atomic write:
```typescript
const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
writeFileSync(tmpFile, ...)
renameSync(tmpFile, filePath)
```

**Risk:** If the process crashes mid-write, `trajectory-ledger.json` could contain partial JSON, triggering the quarantine path on next read and losing all trajectory data. The corruption quarantine in `ledger.ts:54-56` handles this gracefully (renames corrupt file), but data is still lost.

**Recommendation:** Add atomic write pattern to `writeTrajectoryLedger()` matching `store.ts:49-51`.

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
| Trajectory tool | `hivemind-trajectory.ts` | 112 | ✅ |
| Agent-work tool | `hivemind-agent-work.ts` | 152 | ✅ |
| Trajectory schema | `trajectory.schema.ts` | 49 | ✅ |
| Agent-work-contract schema | `agent-work-contract.schema.ts` | 148 | ✅ |
| Shared types | `types.ts` | 412 | ✅ |

**Verdict:** All modules well under 500 LOC ✅. No split needed.

### shared/types.ts Module Size Note

At 412 lines, `src/shared/types.ts` is approaching the 500 LOC threshold. It currently re-exports types from `src/coordination/delegation/types.js` (lines 371-396) and `src/config/workflow/workflow-types.js` (lines 404-412) to maintain backward compatibility. Per ARCHITECTURE.md:269, this is a known pressure point. The re-exports would ideally be removed to reduce LOC, but they serve legitimate backward-compat purposes.

### Shared Layer Violation: Known, Not New

`src/shared/types.ts:1` imports from `src/coordination/delegation/types.js`:
```typescript
import type { DelegationRecoveryGuarantee, DelegationSignalSource, DelegationStatus } from "../coordination/delegation/types.js"
```

This is a **pre-existing violation** of the shared leaf constraint (ARCHITECTURE.md:139: "no deep runtime imports"). The violation is explicitly acknowledged — the types are re-exported for backward compatibility only (annotated at `types.ts:366-396`). This issue is tracked in ARCHITECTURE.md:293-297 as a known anti-pattern ("Deep Imports into `src/shared/`"). It is NOT a new finding for this phase, but Phase 25 should consider removing these re-exports and fixing the importers directly.

---

## 6. Plugin Integration

Both systems are correctly wired through `src/plugin.ts`:

```typescript
// plugin.ts:59, 61 — imports
import { createHivemindTrajectoryTool } from "./tools/hivemind/hivemind-trajectory.js"
import { createHivemindAgentWorkCreateTool, createHivemindAgentWorkExportTool } from "./tools/hivemind/hivemind-agent-work.js"

// plugin.ts:449 — tool registration
"hivemind-trajectory": createHivemindTrajectoryTool(projectDirectory),

// plugin.ts:457-458
"hivemind-agent-work-create": createHivemindAgentWorkCreateTool(projectDirectory),
"hivemind-agent-work-export": createHivemindAgentWorkExportTool(projectDirectory),
```

### Integration Pattern

Both follow the same composition pattern:
1. Tool factory receives `projectDirectory` at composition time (line 449, 457-458)
2. Factory creates `tool()` with inline Zod-flavored `args` schema
3. On `execute()`, the tool parses raw args through schema validation, then delegates to deeper module operations
4. Deeper modules perform I/O directly — no dependency injection for file paths

### 🔴 V-03 (Still Open): No Startup Recovery

`src/plugin.ts` has startup recovery for delegation only (`plugin.ts:275` — `delegationManager.recoverPending()`). Neither trajectory nor agent-work-contracts scan for stale records:

- **Trajectory:** No `recoverOpenTrajectories()` call at plugin startup. After a restart, trajectories that were `active` at crash time remain `active` forever.
- **Agent-Work-Contracts:** No startup verification of store integrity. The store only validates on read.

**Round 2 → Round 3 status:** Still present.

### 🔴 V-04 (Still Open): No Lifecycle Hooks

No lifecycle hooks exist for automatic trajectory creation or contract lifecycle tracking. Both systems are purely tool-triggered:
- No `tool.execute.after` hook captures delegation completions as trajectory evidence automatically
- No lifecycle hook bridges delegation completion → trajectory checkpoint
- No automatic agent-work-contract state transitions on session events

**Round 2 → Round 3 status:** Still present.

### Cross-Tool Dependency: `src/tools/hivemind/hivemind-pressure.ts:3`

`hivemind-pressure.ts` imports `eventTrajectory` directly:
```typescript
import { eventTrajectory } from "../../task-management/trajectory/index.js"
```

This is **correct** — tools may import from task-management (ARCHITECTURE.md:81-85: "Tool layer depends on task-management"). Unlike the agent-work-contracts feature module, the tool layer has explicit authority to consume task-management operations. This is NOT a violation.

---

## 7. Violations Summary

| ID | Severity | Description | File:Line | Rule | Round 2 → 3 |
|----|----------|-------------|-----------|------|-------------|
| V-01 | MEDIUM | Feature → Task-Management direct write call | `operations.ts:58` | CQRS: cross-module write bypasses tool layer | 🔴 Unfixed |
| V-02 | **HIGH** | Feature imports from Task-Management | `operations.ts:3` | ARCHITECTURE.md:112-113 — features must not depend on task-management | 🔴 Unfixed |
| V-03 | LOW | No startup recovery for trajectory or agent-work-contracts | `plugin.ts:275` (only delegation recovers) | Resiliency gap: stale records after restart | 🔴 Unfixed |
| V-04 | LOW | No lifecycle hooks for trajectory or agent-work-contracts | No hooks wiring | Automatic session→trajectory flow unimplemented | 🔴 Unfixed |
| V-05 | INFO | Inconsistency: trajectory exports version constant; agent-work-contracts keeps private | `types.ts:4` vs `store.ts:8` | Convention drift | 🔴 Unfixed |
| V-06 | **MEDIUM** | Trajectory ledger lacks atomic writes | `ledger.ts:68-71` | Crash-safe persistence | 🆕 NEW |
| V-07 | INFO (known) | `shared/types.ts` imports from coordination | `types.ts:1` | Shared leaf constraint (known pre-existing) | 🟡 Known |

### Regression Risk Assessment

| Risk | Level | Rationale |
|------|-------|-----------|
| Feature-layer dependency leak (V-01, V-02) is exposed to future refactors | 🟡 MODERATE | If trajectory API changes, agent-work-contracts breaks. Current stable API mitigates. |
| Partial-failure scenario (V-01) | 🟢 LOW | Contract persisted before trajectory attach; if trajectory fails, contract exists but has dangling `trajectoryEvidenceRef`. No evidence of runtime failures. |
| Data loss on crash (V-06) | 🟡 MODERATE | Window is small (synchronous write), but a crash in `writeFileSync` could corrupt the full ledger. 8 trajectory writes happen per full create+checkpoint+event sequence. |
| Shared-types backward-compat (V-07) | 🟢 LOW | Type-only re-exports. Will resolve naturally when importers are migrated. |

---

## 8. Recommendations (Prioritized)

### P0: Fix V-02 / V-01 (HIGH/MEDIUM) — Dependency Inversion

Remove the direct `attachTrajectoryEvidence` call from `operations.ts:58-63`. Two cleanup options:

**Option A (Tool-level rewrite):** Move the `attachTrajectoryEvidence` call from `operations.ts:58` into `executeAgentWorkCreateToolAction()` in `hivemind-agent-work.ts`. The tool orchestrates both writes, keeping feature modules independent.

**Option B (Callback wiring):** Add `onContractCreated?: (contract, trajectoryId) => void` parameter to `createAgentWorkContract()` in `operations.ts`. Wire the callback in `hivemind-agent-work.ts:executeAgentWorkCreateToolAction()` to call `attachTrajectoryEvidence`. Keep `operations.ts` dependency-free.

**Recommendation:** Option A is simpler — the tool layer already has authority to import task-management.

### P1: Fix V-06 (MEDIUM) — Atomic Writes for Trajectory

Add the temp-file + renameSync pattern to `writeTrajectoryLedger()` in `ledger.ts`:
```typescript
// Before (ledger.ts:68-71) — direct write
writeFileSync(ledgerPath, ...)

// After — atomic write (matching store.ts:49-51)
const tmpFile = `${ledgerPath}.${process.pid}.${randomUUID()}.tmp`
writeFileSync(tmpFile, ...)
renameSync(tmpFile, ledgerPath)
```

### P2: Fix V-03 (LOW) — Startup Recovery

Add startup recovery calls in `plugin.ts`:
```typescript
// After delegation recovery:
const openTrajectories = inspectTrajectoryLedger({ projectRoot }).ledger
// Log warning for any active trajectories
// Optionally: close stale trajectories or flag them
```

### P3: Fix V-04 (LOW) — Lifecycle Integration

Consider adding a `tool.execute.after` hook that captures delegation completions as trajectory evidence automatically (deferred to Phase 27 Hook Injection Plane Redesign).

### P4: Fix V-05 (INFO) — Version Consistency

Export `STORE_VERSION` from `store.ts` for consistency with trajectory's `TRAJECTORY_LEDGER_VERSION`.

---

*Analysis: 2026-05-24 | Round: 3/3 verification | Sources: 14 source files read | Findings: 1 HIGH (unfixed), 2 MEDIUM (1 unfixed, 1 new), 2 LOW (unfixed), 2 INFO (1 unfixed, 1 known)*
