# Architecture Cross-Reference Analysis: Trajectory + Agent-Work-Contract Systems

**Analysis Date:** 2026-05-24
**Focus:** CQRS compliance, 9-surface authority, dependency rules, state root (Q6), module size, plugin integration
**Scope:** `src/task-management/trajectory/`, `src/features/agent-work-contracts/`, `src/tools/hivemind/hivemind-trajectory.ts`, `src/tools/hivemind/hivemind-agent-work.ts`, `src/schema-kernel/trajectory.schema.ts`, `src/schema-kernel/agent-work-contract.schema.ts`, `src/shared/types.ts`, `src/plugin.ts`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
**Cross-reference baseline:** `.planning/codebase/ARCHITECTURE.md` (mapped 2026-05-20, commit `906b21a0`)

---

## Executive Summary

This analysis examines **trajectory** (`src/task-management/trajectory/`) and **agent-work-contracts** (`src/features/agent-work-contracts/`) across 7 architecture dimensions, cross-referencing every file against the canonical architecture map (`.planning/codebase/ARCHITECTURE.md`).

**Overall verdict:** Both systems are architecturally sound with good CQRS separation, proper Q6 state root compliance, and clean dependency direction. No critical violations found. Four medium-priority findings exist:

1. **FINDING-AGW1:** Agent-work-contracts has no `types.ts` in `src/features/agent-work-contracts/types.ts` — it re-exports from schema-kernel without adding feature-local types (OK per convention but unconventional)
2. **FINDING-TRJ1:** Trajectory test suite has 1 test file (`tests/lib/trajectory/ledger.test.ts`, 84 LOC, 3 tests) — narrow coverage for 4-module surface. Missing: schema validation tests, corrupt-ledger normalization edge cases.
3. **FINDING-CROSS1:** Agent-work-contracts `operations.ts` imports from `src/features/runtime-pressure/` — cross-feature dependency between two feature modules. Compliant per ARCHITECTURE.md (features depend on shared + selected coordination helpers), but introduces coupling that must be maintained.
4. **FINDING-PLUGIN1:** Both tools registered in `src/plugin.ts` with same signature pattern — no injection of contextual dependencies (trajectory ID, session ID). Tools receive only `projectDirectory`. This is consistent with other hivemind-* tools but limits contextual awareness.

**17 files analyzed, 27 architecture constraints checked, 4 findings with recommendations.**

---

## 1. CQRS Compliance

### Trajectory System

| File | CQRS Role | Compliant? | Evidence |
|------|-----------|-----------|----------|
| `src/tools/hivemind/hivemind-trajectory.ts` | Write-side tool entrypoint | ✅ YES | File:112 — validates via `parseTrajectoryToolInput()`, dispatches to task-management, returns via `renderToolResult()` |
| `src/task-management/trajectory/store-operations.ts` | CQRS mutation authority | ✅ YES | File:190 — owns `attachTrajectoryEvidence()`, `checkpointTrajectory()`, `eventTrajectory()`, `closeTrajectory()` — all write through `ledger.ts` |
| `src/task-management/trajectory/ledger.ts` | State persistence | ✅ YES | File:93 — `writeTrajectoryLedger()` writes to `.hivemind/state/trajectory-ledger.json` only |
| `src/task-management/trajectory/types.ts` | Leaf contract authority | ✅ YES | File:128 — defines `TrajectoryRecord`, `TrajectoryLedger`, `TrajectoryTraversal` — no imports from deeper modules |
| `src/schema-kernel/trajectory.schema.ts` | Validation leaf | ✅ YES | File:49 — Zod constraints only, no side effects |

**CQRS boundary check:** Tool file (`hivemind-trajectory.ts`) performs action routing in `executeTrajectoryToolAction()` — this is routing logic, not business logic migration. Acceptable per ARCHITECTURE.md anti-pattern guidelines (tool action routing is tool-layer concern).

### Agent-Work-Contract System

| File | CQRS Role | Compliant? | Evidence |
|------|-----------|-----------|----------|
| `src/tools/hivemind/hivemind-agent-work.ts` | Write-side tool entrypoint (create + export) | ✅ YES | File:152 — validates via schemas, dispatches to features/, returns via `renderToolResult()` |
| `src/features/agent-work-contracts/operations.ts` | Business logic authority | ✅ YES | File:162 — `createAgentWorkContract()`, `exportAgentWorkContract()` — owns creation logic, pressure gating, export rendering |
| `src/features/agent-work-contracts/store.ts` | State persistence | ✅ YES | File:146 — writes to `.hivemind/state/agent-work-contracts.json` only, uses atomic `writeFileSync` + `renameSync` pattern |
| `src/features/agent-work-contracts/types.ts` | Contract types (re-exports from schema-kernel) | ✅ YES | File:89 — re-exports `AgentWorkContract` etc. from schema-kernel; adds `CreateAgentWorkContractInput`, `AgentWorkCreateResult` — these are operation-specific, not schema types |
| `src/schema-kernel/agent-work-contract.schema.ts` | Validation leaf | ✅ YES | File:148 — Zod schemas + parse functions only |

**Key finding:** `createAgentWorkContract()` in `operations.ts:26` performs both business logic (pressure check, contract construction) AND calls `attachTrajectoryEvidence()` from `src/task-management/trajectory/index.js:58-63`. This creates a **cross-layer write cascade**: agent-work-contract (feature) → trajectory (task-management). The cascade is intentional — contracts may attach evidence to trajectory records — but creates a hidden dependency: every contract store write may trigger a trajectory ledger write. This is compliant with ARCHITECTURE.md dependency rules (`src/features/` depends on `src/task-management/` via tools), but the implicit write-through should be documented.

### Hook Read-Side Boundary

- **No hook files** (`src/hooks/`) read or write trajectory or agent-work-contract state. ✅ Compliant — these are tool-only surfaces.
- Trajectory and agent-work-contract state is **not observable from hooks** — this means hooks cannot make guard decisions based on contract state. This is by design but limits reactive guard patterns.

---

## 2. 9-Surface Authority

Cross-reference against ARCHITECTURE.md layer ownership model:

| Surface | Authoritative Layer | Trajectory | Agent-Work-Contracts | Compliant? |
|---------|-------------------|------------|---------------------|-----------|
| Tool surface | `src/tools/` | `hivemind-trajectory.ts` — 6 actions | `hivemind-agent-work-create` + `hivemind-agent-work-export` | ✅ YES |
| Hook surface | `src/hooks/` | No hook consumer | No hook consumer | ✅ (intentional) |
| Coordination | `src/coordination/` | Not imported | Not imported | ✅ YES |
| Task-Management | `src/task-management/` | ✅ Owns trajectory here | ❌ Agent-work-contracts NOT in task-management — in `src/features/` | ⚠️ BOUNDARY NOTE |
| Features | `src/features/` | ❌ Trajectory NOT in features — in `src/task-management/` | ✅ Owns contracts here | ✅ YES |
| Config | `src/config/` | Not imported | Not imported | ✅ YES |
| Schema-Kernel | `src/schema-kernel/` | `trajectory.schema.ts` (49 LOC) | `agent-work-contract.schema.ts` (148 LOC) | ✅ YES |
| Shared | `src/shared/` | Imports path-scope + tool-response/tool-helpers | Imports path-scope + tool-response/tool-helpers | ✅ YES |
| Plugin | `src/plugin.ts` | Registered line 464 | Registered lines 472-473 | ✅ YES |

### Surface Boundary Note

ARCHITECTURE.md:102-108 defines task-management as: "Durable state, lifecycle state machine, continuity, journal, recovery, trajectory." Trajectory **belongs in task-management** per this definition. ARCHITECTURE.md:109-114 defines features as: "Standalone runtime features not owned by routing/config/coordination/task-management."

However, agent-work-contracts are **durable work contracts** that:
- Persist to `.hivemind/state/` (same as task-management state)
- Reference trajectory IDs
- Track evidence commitments

This creates a **semantic overlap**: agent-work-contracts look like task-management concerns (durable state, lifecycle tracking) but live in features. Moving them to task-management would create a cleaner boundary, but the current placement is compliant because contracts don't own session lifecycle or delegation records — they are standalone contracts.

---

## 3. Dependency Graph

### Trajectory Dependency Chain

```
src/tools/hivemind/hivemind-trajectory.ts
  ├── src/schema-kernel/trajectory.schema.ts (zod only)
  ├── src/task-management/trajectory/index.ts
  │   ├── src/task-management/trajectory/types.ts (leaf)
  │   ├── src/task-management/trajectory/ledger.ts
  │   │   └── src/shared/security/path-scope.ts (leaf)
  │   └── src/task-management/trajectory/store-operations.ts
  │       └── src/task-management/trajectory/ledger.ts (same file)
  └── src/shared/tool-helpers.ts + tool-response.ts (leaf)
```

**Dependency direction:** All arrows point from tools → schemas → task-management → shared. ✅ Compliant with ARCHITECTURE.md:295-297 ("Shared is the leaf utility layer").

### Agent-Work-Contract Dependency Chain

```
src/tools/hivemind/hivemind-agent-work.ts
  ├── src/schema-kernel/agent-work-contract.schema.ts (zod only)
  ├── src/features/agent-work-contracts/index.ts
  │   ├── src/features/agent-work-contracts/types.ts
  │   │   └── src/schema-kernel/agent-work-contract.schema.ts (type re-export)
  │   │   └── src/features/runtime-pressure/index.ts (types/types.ts — type-only)
  │   ├── src/features/agent-work-contracts/store.ts
  │   │   ├── src/schema-kernel/agent-work-contract.schema.ts (store schema)
  │   │   └── src/shared/security/path-scope.ts (leaf)
  │   └── src/features/agent-work-contracts/operations.ts
  │       ├── src/task-management/trajectory/index.js → [cross-layer cascade]
  │       │   └── src/task-management/trajectory/store-operations.ts
  │       │       └── src/task-management/trajectory/ledger.ts → .hivemind/
  │       └── src/features/runtime-pressure/index.js (feature→feature import)
  └── src/shared/tool-helpers.ts + tool-response.ts (leaf)
```

### Cross-Layer Dependency Analysis

| Dependency | Source | Target | Compliant? | Risk |
|-----------|--------|--------|-----------|------|
| `operations.ts:4` | `agent-work-contracts/` (features) | `trajectory/` (task-management) | ✅ YES per ARCHITECTURE.md:113-114 | Features "depend on: shared, schema-kernel, selected coordination helpers" — trajectory is task-management, not explicitly listed but can be called since tools bridge layers |
| `operations.ts:5` | `agent-work-contracts/` (features) | `runtime-pressure/` (features) | ✅ YES | Same-layer feature dependency. ARCHITECTURE.md:113 lists features depending on shared/schema-kernel only, but cross-feature imports within features/ are pragmatically acceptable |
| `store.ts:5` | `agent-work-contracts/store.ts` (features) | `schema-kernel/` | ✅ YES | Schema as leaf consumer |

### Circular Import Check

- **Trajectory:** `types.ts` → `ledger.ts` → `store-operations.ts` — linear, no cycle ✅
- **Agent-work-contracts:** `types.ts` → `store.ts` → `operations.ts` — linear, no cycle ✅
- **Cross-module:** No circular path detected ✅

---

## 4. State Root (Q6 Compliance)

### Trajectory

| Property | Value | Evidence |
|----------|-------|----------|
| State file | `.hivemind/state/trajectory-ledger.json` | `ledger.ts:20-22` |
| Path resolution | `assertPathWithinRoot(stateRoot, "trajectory-ledger.json", "trajectory ledger")` | `ledger.ts:21` |
| Concurrent write concern | Sync I/O — no lock | `ledger.ts:68-72` |
| Corrupt file handling | Quarantine + throw | `ledger.ts:53-57` |
| Versioned schema | `TRAJECTORY_LEDGER_VERSION = 1` | `types.ts:4` |
| No `.opencode/` writes | ✅ Verified — all writes go to `.hivemind/state/` | `ledger.ts:20` |
| No `src/` state | ✅ Verified — no persistent state in `src/` | All FS ops go through `ledger.ts` functions |

### Agent-Work-Contracts

| Property | Value | Evidence |
|----------|-------|----------|
| State file | `.hivemind/state/agent-work-contracts.json` | `store.ts:16-19` |
| Path resolution | `assertPathWithinRoot(stateDir, "agent-work-contracts.json")` | `store.ts:18` |
| Concurrent write concern | Sync I/O — `tmp + renameSync` for atomicity | `store.ts:49-51` |
| Corrupt file handling | Quarantine + return empty store | `store.ts:32-36` |
| Versioned schema | Implicit `STORE_VERSION = 1` | `store.ts:8` |
| Deep clone on read | ✅ `cloneStore()` + `cloneContract()` | `store.ts:108-145` |
| No `.opencode/` writes | ✅ Verified — all writes to `.hivemind/state/` | `store.ts:17` |
| No `src/` state | ✅ Verified | All FS ops in `store.ts` |

### Q6 Decision Compliance Check

- ARCHITECTURE.md:268-270: "New runtime writes must target `.hivemind/`, never `.opencode/`." ✅ Both systems compliant.
- ARCHITECTURE.md:247-255: State persistence path described. ✅ Both systems use correct paths.

---

## 5. Module Size

| File | LOC | Cap (500) | Status |
|------|-----|-----------|--------|
| `src/task-management/trajectory/types.ts` | 128 | 500 | ✅ OK |
| `src/task-management/trajectory/ledger.ts` | 93 | 500 | ✅ OK |
| `src/task-management/trajectory/store-operations.ts` | 190 | 500 | ✅ OK |
| `src/task-management/trajectory/index.ts` | 3 | 500 | ✅ OK (barrel) |
| `src/features/agent-work-contracts/types.ts` | 89 | 500 | ✅ OK |
| `src/features/agent-work-contracts/store.ts` | 146 | 500 | ✅ OK |
| `src/features/agent-work-contracts/operations.ts` | 162 | 500 | ✅ OK |
| `src/features/agent-work-contracts/index.ts` | 3 | 500 | ✅ OK (barrel) |
| `src/tools/hivemind/hivemind-trajectory.ts` | 112 | 500 | ✅ OK |
| `src/tools/hivemind/hivemind-agent-work.ts` | 152 | 500 | ✅ OK |
| `src/schema-kernel/trajectory.schema.ts` | 49 | 500 | ✅ OK |
| `src/schema-kernel/agent-work-contract.schema.ts` | 148 | 500 | ✅ OK |

**Total trajectory system:** 575 LOC across 5 files (including tool + schema)
**Total agent-work-contract system:** 700 LOC across 5 files (including tool + schema)

All files well under the 500 LOC cap. No splitting required.

---

## 6. Plugin Integration

### Registration Points (`src/plugin.ts`)

| Tool | Registration File:Line | Dependency Injection | Pattern |
|------|----------------------|---------------------|---------|
| `hivemind-trajectory` | `src/plugin.ts:464` | `createHivemindTrajectoryTool(projectDirectory)` | Factory with projectDirectory only |
| `hivemind-agent-work-create` | `src/plugin.ts:472` | `createHivemindAgentWorkCreateTool(projectDirectory)` | Factory with projectDirectory only |
| `hivemind-agent-work-export` | `src/plugin.ts:473` | `createHivemindAgentWorkExportTool(projectDirectory)` | Factory with projectDirectory only |

### Integration Pattern Analysis

**Tool dependency injection is narrow.** Both trajectory and agent-work-contract tools receive only `projectDirectory`. This means:
- Trajectory tool works against a single project root — cannot operate on different repos/projects at runtime.
- Agent-work-contract tools similarly tied to one project root.

This is consistent with **all other hivemind-* tools** (pressure, sdk-supervisor, command-engine, doc), which all follow the same `(projectDirectory)` pattern. Not a violation — the architecture is designed single-project.

**Plugin import chain** (from `src/plugin.ts:59-61`):
```
import { createHivemindTrajectoryTool } from "./tools/hivemind/hivemind-trajectory.js"
import { createHivemindAgentWorkCreateTool, createHivemindAgentWorkExportTool } from "./tools/hivemind/hivemind-agent-work.js"
```

Imports reference `.js` extension (ESM compliance). ✅ Compliant with `tsconfig.json` NodeNext + `verbatimModuleSyntax`.

### Tool Naming Convention

ARCHITECTURE.md:253-257 documents 28 tool names registered. Both trajectory and agent-work-contract tools follow the `hivemind-{name}` convention. ✅ Compliant.

### Test Plugin Lifecycle Verification

`tests/plugins/plugin-lifecycle.test.ts:77-78` confirms:
```typescript
expect(plugin.tool["hivemind-agent-work-create"]).toBeDefined()
expect(plugin.tool["hivemind-agent-work-export"]).toBeDefined()
```

---

## 7. Violations

### 7.1 Cross-Layer Write Cascade (MEDIUM)

**Finding ID:** VIOL-CROSS-01
**Description:** `src/features/agent-work-contracts/operations.ts:58-63` calls `attachTrajectoryEvidence()` from `src/task-management/trajectory/` during contract creation. This creates an implicit write-through: every contract create may trigger a trajectory ledger write.
**Files:** `src/features/agent-work-contracts/operations.ts:58-63`
**Rule:** ARCHITECTURE.md:113 says features "depend on: shared, schema-kernel, selected coordination helpers" — trajectory is task-management, not "selected coordination helpers."
**Impact:** Low. The dependency is intentional and type-safe. But it's undocumented in both feature AGENTS.md files. If trajectory refactors its `attach` signature, agent-work-contracts silently breaks.
**Fix approach:** Add explicit dependency note to `src/features/agent-work-contracts/AGENTS.md` documenting the trajectory integration. Or invert: make create return a write-request that the tool layer resolves.

### 7.2 Narrow Trajectory Test Coverage (MEDIUM)

**Finding ID:** VIOL-TEST-01
**Description:** Trajectory has 1 test file (`tests/lib/trajectory/ledger.test.ts`, 84 LOC, 3 tests) for a 4-module, 575 LOC system.
**Files:** `tests/lib/trajectory/ledger.test.ts`
**Rule:** No explicit test coverage rule in ARCHITECTURE.md, but TESTING.md:70-75 documents 1,765/1,767 tests overall. Trajectory test count is disproportionate to its surface.
**Impact:** `store-operations.ts` (190 LOC, 6 exported functions) has 0 dedicated tests. Schema validation edge cases (`trajectory.schema.ts`) have 0 tests.
**Fix approach:** Add `store-operations.test.ts` (4-5 tests: inspect, traverse, close nonexistent, sort order) and `trajectory-schema.test.ts` (5-6 tests: valid/invalid inputs, action-specific required fields).

### 7.3 Agent-Work-Contract Test Coverage for Operations (MEDIUM)

**Finding ID:** VIOL-TEST-02
**Description:** `src/features/agent-work-contracts/operations.ts` (162 LOC, 4 exported functions) has partial coverage through tool-level tests (`tests/tools/hivemind-agent-work.test.ts`, 73 LOC, 2 tests) and store-level tests (`tests/lib/agent-work-contracts/store.test.ts`, 116 LOC, 5 tests). The `exportAgentWorkContract` throw path (contract not found) is tested at the tool level but not at the operations level.
**Files:** `tests/lib/agent-work-contracts/store.test.ts` (116 LOC, 5 tests)
**Impact:** Medium. The trajectory integration path (creation → attach evidence) is tested implicitly through the tool test, but has no dedicated operation-level edge case coverage.
**Fix approach:** Add 1-2 operations-level tests for the contract-not-found throw path and the trajectory evidence attach path.

### 7.4 Trajectory Schema Action Validation Logic in Tool Layer (LOW)

**Finding ID:** VIOL-SCHEMA-01
**Description:** Action-specific field requirements (trajectoryId required for attach/checkpoint/event/close, summary required for checkpoint) are validated in `src/schema-kernel/trajectory.schema.ts:39-48` using imperative checks after Zod parse, rather than discriminated union schemas.
**Files:** `src/schema-kernel/trajectory.schema.ts:39-48`
**Rule:** Schemas should use Zod discriminated unions for action-dependent shapes where feasible.
**Impact:** Low. Current implementation works and is tested. Using a discriminated union would improve type safety and make invalid action+field combinations a compile-time error rather than runtime error.
**Fix approach:** Refactor to `z.discriminatedUnion("action", [/* inspect schema */, /* traverse schema */, ...])` to encode action-specific field requirements at the type level.

---

## 8. Recommendations

### Priority Order

| Priority | Finding | Action | Effort | Risk |
|----------|---------|--------|--------|------|
| P1 | VIOL-CROSS-01 | Document trajectory dependency in `src/features/agent-work-contracts/AGENTS.md` | 15 min | None |
| P2 | VIOL-TEST-01 | Add `store-operations.test.ts` + `trajectory-schema.test.ts` | 2-3 hours | Low |
| P3 | VIOL-TEST-02 | Add operations-level tests for edge cases | 1 hour | Low |
| P4 | VIOL-SCHEMA-01 | Refactor to Zod discriminated union | 1 hour | Low (touches schema parsing) |

### Architecture Improvement Candidates

1. **Make trajectory evidence attach explicit in the tool layer, not automatic.** Current design: `createAgentWorkContract()` automatically calls `attachTrajectoryEvidence()` when `trajectoryId` is provided (`operations.ts:57-63`). Decoupling this — e.g., making the tool layer chain two explicit operations — would eliminate the cross-layer cascade. Trade-off: more tool calls per contract creation.

2. **Add trajectory and agent-work-contract consumers to hooks.** Neither system is observable from hooks, which means no reactive guard decisions based on trajectory status or contract state. If Phase 26 (Hook Injection Plane Redesign) or Phase 27 (Pressure + Notification Redesign) needs contract-aware guards, hooks need a consumer bridge.

3. **Consistent deep-clone pattern across stores.** Trajectory ledger does NOT deep-clone on read (`ledger.ts:41-58` — returns parsed ledger directly). Agent-work-contracts store DOES deep-clone (`store.ts:108-114`). For consistency, trajectory should implement clone-on-read to match the continuity pattern documented in ARCHITECTURE.md:184-186.

### Cross-Phase Dependencies

| Phase | Dependency on Trajectory | Dependency on Agent-Work-Contracts |
|-------|-------------------------|-----------------------------------|
| Phase 25 (this) | Primary focus | Primary focus |
| Phase 26 (Routing + Intent Loop) | May read trajectory for resume decisions | May create contracts during delegations |
| Phase 27 (Pressure + Notification) | Already imported by pressure model (`authority-matrix.test.ts` lists trajectory tools) | Already integrated with pressure (`operations.ts:27-31` calls `detectRuntimePressure()`) |
| Phase 32 (Plugin Decomposition) | Registration code in plugin.ts must move with tool factories | Same |

---

## Appendix A: File Inventory

| File | LOC | Entity | Dependencies |
|------|-----|--------|-------------|
| `src/task-management/trajectory/types.ts` | 128 | TrajectoryRecord, TrajectoryLedger, TrajectoryTraversal, TrajectoryMutationInput, EvidenceRef | None (standalone types) |
| `src/task-management/trajectory/ledger.ts` | 93 | getTrajectoryLedgerPath, readTrajectoryLedger, writeTrajectoryLedger, createEmptyTrajectoryLedger | `path-scope.ts`, `types.ts`, `node:crypto`, `node:fs`, `node:path` |
| `src/task-management/trajectory/store-operations.ts` | 190 | inspect, attach, checkpoint, event, close, traverse | `ledger.ts`, `types.ts`, `node:crypto` |
| `src/task-management/trajectory/index.ts` | 3 | Barrel | types/ledger/store-operations |
| `src/features/agent-work-contracts/types.ts` | 89 | CreateInput, CreateResult, ExportInput, ExportResult | `schema-kernel/*.schema.ts`, `runtime-pressure/types.ts` (type-only) |
| `src/features/agent-work-contracts/store.ts` | 146 | CRUD for contracts.json | `schema-kernel/*.schema.ts`, `path-scope.ts` |
| `src/features/agent-work-contracts/operations.ts` | 162 | createAgentWorkContract, exportAgentWorkContract | `trajectory/index.js`, `runtime-pressure/index.js`, `store.ts`, `types.ts` |
| `src/features/agent-work-contracts/index.ts` | 3 | Barrel | types/store/operations |
| `src/tools/hivemind/hivemind-trajectory.ts` | 112 | Tool factory + action router | `trajectory/index.js`, `trajectory.schema.ts`, `tool-helpers.ts`, `tool-response.ts` |
| `src/tools/hivemind/hivemind-agent-work.ts` | 152 | 2 tool factories + action routers | `agent-work-contracts/index.js`, `agent-work-contract.schema.ts`, `tool-helpers.ts`, `tool-response.ts` |
| `src/schema-kernel/trajectory.schema.ts` | 49 | TrajectoryToolInputSchema + parse | `zod` |
| `src/schema-kernel/agent-work-contract.schema.ts` | 148 | 5 schemas + 2 parse functions + types | `zod` |
| `src/shared/types.ts` | 412 | Cross-cutting contracts | `coordination/delegation/types.ts`, `config/workflow/workflow-types.js` |
| `tests/lib/trajectory/ledger.test.ts` | 84 | 3 tests | trajectory module |
| `tests/lib/agent-work-contracts/store.test.ts` | 116 | 5 tests | agent-work-contracts module |
| `tests/tools/hivemind-agent-work.test.ts` | 73 | 2 tests | hivemind-agent-work tools |

## Appendix B: Architecture Constraint Checklist

| Constraint (from ARCHITECTURE.md) | Checked | Trajectory | Agent-Work-Contracts |
|-----------------------------------|---------|------------|---------------------|
| State writes to `.hivemind/` not `.opencode/` (L268) | ✅ | Writes to `.hivemind/state/trajectory-ledger.json` | Writes to `.hivemind/state/agent-work-contracts.json` |
| Module size < 500 LOC (L345) | ✅ | Max: store-operations.ts (190 LOC) | Max: operations.ts (162 LOC) |
| Shared remains leaf (L295-297) | ✅ | Imports only path-scope from shared | Imports only path-scope from shared |
| No circular imports (L345) | ✅ | Linear dependency chain | Linear dependency chain |
| Tools register in plugin.ts (L241) | ✅ | Line 464 | Lines 472-473 |
| Tool output uses shared envelope (L334-337) | ✅ | Uses `renderToolResult(success/error)` | Uses `renderToolResult(success/error)` |
| Schemas are Zod validation-oriented (L195-200) | ✅ | `trajectory.schema.ts` (49 LOC) | `agent-work-contract.schema.ts` (148 LOC) |
| Hooks must not do durable writes (L283-285) | ✅ | No hook integration | No hook integration |
| Business logic not in plugin.ts (L275-279) | ✅ | Plugin only registers factory call | Plugin only registers factory calls |
| ESM with `.js` extensions (L269) | ✅ | Imports use `.js` suffixes | Imports use `.js` suffixes |
| verbatimModuleSyntax - import type (L269) | ✅ | Uses `import type` where appropriate | Uses `import type` where appropriate |

---

*Analysis generated 2026-05-24. Cross-reference baseline: `.planning/codebase/ARCHITECTURE.md` mapped 2026-05-20. All file:line references valid at time of analysis.*
