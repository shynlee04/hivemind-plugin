# Architecture Cross-Reference: Trajectory + Agent-Work-Contract Systems

**Analysis Date:** 2026-05-24
**Source:** TASK-B round 4 — Phase 25 architecture cross-reference
**Round:** 4 (post-Phase 23 fix verification)
**Files analyzed:** 19 source files + 5 test files + 4 governance documents

---

## Executive Summary

This analysis cross-references the **Trajectory** (`src/task-management/trajectory/`) and **Agent-Work-Contract** (`src/features/agent-work-contracts/`) systems against the project's established architecture constraints: CQRS compliance, 9-surface mutation authority, dependency rules, Q6 state root, module size caps, and plugin integration patterns.

**Overall verdict:** Both subsystems are well-structured and substantially compliant. Key findings:

| Dimension | Trajectory | Agent-Work-Contracts |
|-----------|-----------|---------------------|
| CQRS | ✅ Clean read/write split | ✅ Clean read/write split |
| 9-Surface Authority | ✅ Correct evidence-ref-only | ✅ Correct `.hivemind/` writes |
| Dependency Rules | ✅ Leaf dependencies | ⚠️ Cross-feature dep on trajectory |
| State Root (Q6) | ✅ `.hivemind/state/` | ✅ `.hivemind/state/` |
| Module Size | ✅ All < 200 LOC | ✅ All < 200 LOC |
| Plugin Integration | ✅ Clean tool factory | ✅ Clean tool factory |
| Test Coverage | ⚠️ 5 tests (thin) | ⚠️ 6 tests (thin) |
| Lifecycle Completeness | ⚠️ No status state machine | ⚠️ `created` only — 4 statuses unused |

**Critical ROADMAP inaccuracy:** Phase 25 goal states "Add trajectory tests (zero currently)" — this is **incorrect**. Trajectory has **5 tests** (3 in `tests/lib/trajectory/ledger.test.ts` + 2 in `tests/tools/hivemind-trajectory.test.ts`). The ROADMAP was authored before tests existed and was never reconciled. The Phase 25 goal should read "Expand trajectory tests from 5 to X" rather than "add tests (zero currently)."

---

## 1. CQRS Compliance

### 1.1 Trajectory: ✅ Full CQRS Separation

The trajectory system follows a clean CQRS pattern across 4 layers:

```
hivemind-trajectory tool         ← CQRS Write/Read dispatcher (tool layer)
  → store-operations.ts          ← Operations layer (read + write logic)
    → ledger.ts                  ← Ledger persistence layer (file I/O)
      → types.ts                 ← Contract types (pure data)
```

**Read-side operations** (`store-operations.ts`):
- `inspectTrajectoryLedger()` — read-only ledger inspection (line 20)
- `traverseTrajectory()` — read-only traversal projection (line 120)

**Write-side operations** (`store-operations.ts`):
- `attachTrajectoryEvidence()` — create/update trajectory (line 31)
- `checkpointTrajectory()` — append checkpoint (line 49)
- `eventTrajectory()` — append event (line 73)
- `closeTrajectory()` — close status transition (line 99)

The tool dispatcher (`hivemind-trajectory.ts`) routes all 6 actions through `executeTrajectoryToolAction()` (line 66), which calls the appropriate store operation. This is textbook CQRS — the tool dispatch layer owns no business logic.

**No CQRS violations detected.** All write mutations go through `writeTrajectoryLedger()` in `ledger.ts` (line 67). No hidden writes in read-side code paths.

### 1.2 Agent-Work-Contracts: ✅ Full CQRS Separation

Identical pattern:

```
hivemind-agent-work tool          ← CQRS Write dispatcher (tool layer)
  → operations.ts                 ← Operations layer (business logic + I/O)
    → store.ts                    ← Store persistence layer (file I/O)
      → types.ts                  ← Re-exported contract types
```

**Read-side operations:**
- `getAgentWorkContract()` — single contract read (`store.ts:79`)
- `readAgentWorkContracts()` — full store load (`store.ts:27`)
- `exportAgentWorkContract()` — format-only export (`operations.ts:76`)

**Write-side operations:**
- `createAgentWorkContract()` — pressure-gated create (`operations.ts:26`)
- `upsertAgentWorkContract()` — direct store write (`store.ts:61`)

**No CQRS violations detected.** The export operation (`operations.ts:76`) is correctly classified as read-side — it reads the contract from the store and formats it without mutation. Verified by test assertion: `tests/lib/agent-work-contracts/store.test.ts:106` (`expect(after).toBe(before)`).

---

## 2. Nine-Surface Authority

### 2.1 Trajectory: ✅ Correct Evidence-Ref Pattern

Per `ARCHITECTURE.md:288`: *"Trajectory never owns or mutates journal, continuity, or delegation evidence — it references them via EvidenceRef strings."*

| Surface | Authority | Trajectory Interaction | Status |
|---------|-----------|----------------------|--------|
| Continuity | `.hivemind/state/session-continuity.json` | REFERENCES via `EvidenceRef` | ✅ Correct |
| Delegations | `.hivemind/state/delegations.json` | REFERENCES via `EvidenceRef` | ✅ Correct |
| Journal | `.hivemind/journal/` | REFERENCES via `EvidenceRef` | ✅ Correct |
| Documents | `.planning/` | REFERENCES via `EvidenceRef` | ✅ Correct |
| State | `.hivemind/state/trajectory-ledger.json` | OWNS trajectory records | ✅ Correct |
| Trajectory evidence | `TrajectoryRecord.evidenceRefs` | APPENDS refs without mutating sources | ✅ Correct |

**Evidence from type system** (`types.ts:18`): `export type EvidenceRef = string` — explicitly non-owning.

**Evidence from test** (`tests/lib/trajectory/ledger.test.ts:41-42`):
```typescript
expect(existsSync(join(projectRoot, ".hivemind", "state", "session-continuity.json"))).toBe(false)
expect(existsSync(join(projectRoot, ".hivemind", "state", "delegations.json"))).toBe(false)
```
The trajectory ledger test explicitly verifies it does NOT create continuity or delegation files.

### 2.2 Agent-Work-Contracts: ✅ Correct Surface Ownership

| Surface | Authority | Agent-Work-Contract Interaction | Status |
|---------|-----------|-------------------------------|--------|
| State | `.hivemind/state/agent-work-contracts.json` | OWNS contract persistence | ✅ Correct |
| Trajectory | Trajectory ledger | REFERENCES via `trajectoryEvidenceRef` | ✅ Correct |
| Pressure | Runtime-pressure feature | CONSUMES for gate decisions | ✅ Correct |
| Delegations | Delegation records | REFERENCES via IDs only | ✅ Correct |

**Evidence from test** (`tests/lib/agent-work-contracts/store.test.ts:65-66`):
```typescript
expect(existsSync(join(root, ".hivemind", "state", "delegations.json"))).toBe(false)
expect(existsSync(join(root, ".hivemind", "state", "session-continuity.json"))).toBe(false)
```

### 2.3 Cross-Reference: Agent-Work → Trajectory Integration

Notable: `operations.ts:57-63` explicitly calls `attachTrajectoryEvidence()` after contract creation when a `trajectoryId` is provided:

```typescript
if (input.trajectoryId && trajectoryEvidenceRef) {
    attachTrajectoryEvidence({
      projectRoot: input.projectRoot,
      trajectoryId: input.trajectoryId,
      sessionId: input.owner.sessionId,
      evidenceRef: trajectoryEvidenceRef,
    })
  }
```

This is a **legitimate cross-module CQRS call** — the agent-work-contract creates a trajectory evidence reference pointing back to itself. This creates a bidirectional reference:
- Contract → Trajectory: `contract.trajectoryId` + `contract.trajectoryEvidenceRef`
- Trajectory → Contract: `EvidenceRef = "agent-work-contract:{contractId}"`

**Verdict:** This is architecturally valid. The tool is the CQRS dispatcher, so cross-module calls within the tool's execution scope are fine. No violation of the 9-surface model.

---

## 3. Dependency Graph

### 3.1 Trajectory Module Dependencies

```
trajectory/index.ts (barrel)
  ├── types.ts       → no deps (pure types, 128 LOC)
  ├── ledger.ts      → shared/security/path-scope.ts (path validation)
  │                  → types.ts (contracts)
  └── store-operations.ts → ledger.ts (persistence)
                           → types.ts (contracts)

hivemind-trajectory.ts (tool)
  → trajectory/index.js (all operations)
  → schema-kernel/trajectory.schema.js (validation)
  → shared/tool-helpers.js (rendering)
  → shared/tool-response.js (envelope)
```

**ARROW:** Trajectory module → `shared/security/path-scope.ts` only — clean leaf dependency.
**ARROW:** Tool → `schema-kernel/` + `shared/` + `task-management/trajectory/` — correct per `ARCHITECTURE.md:85-86`.

### 3.2 Agent-Work-Contract Module Dependencies

```
agent-work-contracts/index.ts (barrel)
  ├── types.ts       → schema-kernel/agent-work-contract.schema.js (types)
  │                  → features/runtime-pressure/index.js (PressureDecision)
  ├── store.ts       → schema-kernel/agent-work-contract.schema.js (schemas)
  │                  → shared/security/path-scope.js (path validation)
  └── operations.ts  → task-management/trajectory/index.js (attachTrajectoryEvidence)
                     → features/runtime-pressure/index.js (detectRuntimePressure)
                     → ./store.js (persistence)

hivemind-agent-work.ts (tool)
  → features/agent-work-contracts/index.js
  → schema-kernel/agent-work-contract.schema.js
  → shared/tool-helpers.js
  → shared/tool-response.js
```

**CRITICAL CROSS-FEATURE DEPENDENCY:** `operations.ts` imports from `task-management/trajectory/index.js` (line 3). Per `ARCHITECTURE.md:109-114`, features "depend on `src/shared/`, `src/schema-kernel/`, selected coordination helpers." The trajectory import is in `src/task-management/`, not `src/shared/` or `src/coordination/`.

**Verdict:** This is a **minor architectural expansion** of the features layer's stated dependency boundary. The feature layer's `AGENTS.md` (§4) lists consumers including `src/task-management/` which clarifies the intent, but `ARCHITECTURE.md:113` lists features as depending on `src/shared/`, `src/schema-kernel/`, and `selected coordination helpers` — not task-management. **Recommendation:** Update `ARCHITECTURE.md:113` to include `src/task-management/` as an allowed dependency for features, or consider whether the agent-work-contracts feature should live under `src/task-management/`.

### 3.3 Circular Import Check

| Import Path | Direction | Circular? |
|------------|-----------|-----------|
| `features/agent-work-contracts → task-management/trajectory` | Feature → Task-Mgmt | ✅ No (unidirectional) |
| `task-management/trajectory → shared/security/path-scope` | Task-Mgmt → Shared | ✅ No (unidirectional) |
| `tools/hivemind → features + task-mgmt + schema-kernel + shared` | Tool → All | ✅ No (unidirectional) |

**No circular imports detected** in any of the 12 source files analyzed.

---

## 4. State Root (Q6 Compliance)

### 4.1 Trajectory Ledger

- **Path:** `.hivemind/state/trajectory-ledger.json`
- **Resolution:** `ledger.ts:19-21` — `resolve(projectRoot, ".hivemind", "state")` + `assertPathWithinRoot()`
- **Path traversal protection:** Uses `shared/security/path-scope.ts` (`ledger.ts:5`) ✅
- **Format:** Versioned JSON with `TRAJECTORY_LEDGER_VERSION = 1` ✅
- **Corruption handling:** Quarantines corrupt files via `renameSync` before throwing (`ledger.ts:55`) ✅
- **Atomic write:** Direct `writeFileSync` — no temp file pattern (`ledger.ts:70`)

**⚠️ Minor concern:** Unlike `store.ts` (agent-work contracts) which uses atomic write (temp file + `renameSync` at line 49-51), `ledger.ts` writes directly via `writeFileSync`. On filesystem error mid-write, this can produce a partial/corrupt ledger file that would be detected on next read. Consider adopting the same temp-file + rename pattern used by `store.ts`.

### 4.2 Agent-Work-Contracts Store

- **Path:** `.hivemind/state/agent-work-contracts.json`
- **Resolution:** `store.ts:16-18` — `resolve(projectRoot, ".hivemind", "state")` + `assertPathWithinRoot()`
- **Path traversal protection:** Uses `shared/security/path-scope.ts` (`store.ts:6`) ✅
- **Format:** Versioned JSON with `STORE_VERSION = 1` ✅
- **Corruption handling:** Quarantines corrupt files via `renameSync` before resetting to empty (`store.ts:33`) ✅
- **Atomic write:** Uses temp file (`${filePath}.${process.pid}.${randomUUID()}.tmp`) + `renameSync` (`store.ts:49-51`) ✅
- **Deep clone:** `cloneStore()` at `store.ts:108` ensures mutation isolation ✅

### 4.3 No `.opencode/state/` References

Both subsystems exclusively target `.hivemind/state/` paths. No legacy `.opencode/state/` references found in any of the 12 source files analyzed. ✅ Full Q6 compliance.

---

## 5. Module Size Analysis

All modules are well within the 500 LOC cap:

| Module | File | LOC | Status |
|--------|------|-----|--------|
| Trajectory types | `src/task-management/trajectory/types.ts` | 128 | ✅ |
| Trajectory ledger | `src/task-management/trajectory/ledger.ts` | 93 | ✅ |
| Trajectory store ops | `src/task-management/trajectory/store-operations.ts` | 190 | ✅ |
| Trajectory barrel | `src/task-management/trajectory/index.ts` | 3 | ✅ |
| Trajectory tool | `src/tools/hivemind/hivemind-trajectory.ts` | 112 | ✅ |
| Trajectory schema | `src/schema-kernel/trajectory.schema.ts` | 49 | ✅ |
| AWC types | `src/features/agent-work-contracts/types.ts` | 89 | ✅ |
| AWC store | `src/features/agent-work-contracts/store.ts` | 146 | ✅ |
| AWC operations | `src/features/agent-work-contracts/operations.ts` | 162 | ✅ |
| AWC barrel | `src/features/agent-work-contracts/index.ts` | 3 | ✅ |
| AWC tool | `src/tools/hivemind/hivemind-agent-work.ts` | 152 | ✅ |
| AWC schema | `src/schema-kernel/agent-work-contract.schema.ts` | 148 | ✅ |

**Total controlled surface:** ~1,275 LOC across 12 implementation files. Well-scoped for Phase 25 redesign work.

---

## 6. Plugin Integration

### 6.1 Tool Registration Pattern

Both tools follow the same registration pattern in `src/plugin.ts`:

```
createHivemindTrajectoryTool(projectRoot)        → tool instance
createHivemindAgentWorkCreateTool(projectRoot)    → tool instance
createHivemindAgentWorkExportTool(projectRoot)    → tool instance
```

**Pattern analysis:**
- `projectRoot` injected at creation time ✅
- Uses `@opencode-ai/plugin/tool` SDK ✅
- Uses `tool.schema` for argument definitions ✅
- Uses `parse*ToolInput()` for Zod validation inside `execute()` ✅
- Uses `renderToolResult(success()/error())` for response envelope ✅

### 6.2 Schema Validation Boundary

Both tools validate tool input via schema-kernel:
- `hivemind-trajectory.ts:48` — `parseTrajectoryToolInput(rawArgs)` via `trajectory.schema.ts`
- `hivemind-agent-work.ts:58` — `parseAgentWorkCreateToolInput(rawArgs)` via `agent-work-contract.schema.ts`

Both schemas use strict `z.object().parse()` which throws on invalid input — caught by the `try/catch` block in the execute function. ✅

### 6.3 Tool Registration Count

As of the current plugin composition (referenced in `STATE.md`), there are 24+ custom tools. The trajectory and agent-work tools are registered alongside `hivemind-pressure`, `hivemind-session-view`, `hivemind-doc`, `hivemind-command-engine`, and other hivemind tools. All share the `projectRoot` injection pattern via HoC closure.

### 6.4 P23-06 Assessment Findings

From `23-W4-SYNTHESIS.md:58-61`, the Phase 23 Wave 4 assessment classified both trajectory and agent-work as **PARTIAL**:

| Tool | Status | Assessment |
|------|--------|------------|
| `hivemind-trajectory` | 🟡 PARTIAL | "State machine untested. Redesign pending. NOT for WORKFLOW skills." |
| `hivemind-agent-work` | 🟡 PARTIAL | "Lifecycle untested. Redesign pending. NOT for WORKFLOW skills." |

Both were **excluded from Phase 23 WORKFLOW skills** scope pending their Phase 25 redesign. This exclusion is the source of the Phase 25 goal: "Fix trajectory state transitions. Add trajectory tests. Fix agent-work-contract lifecycle."

---

## 7. Violations and Concerns

### 7.1 Trajectory Lifecycle State Machine Incomplete (⚠️ MEDIUM)

**Files:** `store-operations.ts:99-111`, `types.ts:9`

`TrajectoryStatus` supports only 2 values: `"active" | "closed"`. The state machine is binary — no intermediate states, no error status, no cancellation. When a trajectory is created via `upsertTrajectory()` (`store-operations.ts:136`), it starts as `active`. The only transition is `active → closed` via `closeTrajectory()` (`store-operations.ts:99`).

**Impact:** A trajectory cannot represent failure, cancellation, or suspension states. Any system that needs to query "is this trajectory still valid?" has only the binary active/closed distinction.

**Fix approach:** Extend `TrajectoryStatus` with `"failed" | "cancelled"` or adopt a richer state machine similar to `HarnessStatus` in `src/shared/types.ts:144-153`.

### 7.2 Agent-Work-Contract Status Never Progresses (⚠️ MEDIUM)

**Files:** `agent-work-contract.schema.ts:17`, `operations.ts:26`, `store.ts:61`

`AgentWorkStatusSchema` defines 5 statuses: `["created", "running", "blocked", "completed", "cancelled"]`. However, `createAgentWorkContract()` (`operations.ts:26`) always sets `status: "created"` (line 45). The `store.ts` upsert function simply persists whatever status is passed — there is **no lifecycle transition logic anywhere** in the codebase.

**Impact:** The schema declares a state machine that the implementation never actuates. All contracts remain in `created` status forever. If any system queries contracts by status, it will always find them in `created`.

**Fix approach:** 
1. Add a `transitionAgentWorkContract()` operation that validates status transitions
2. Wire to the trajectory lifecycle for synchronization
3. Add status transition tests

### 7.3 Trajectory Ledger Write Not Atomic (⚠️ LOW)

**File:** `ledger.ts:67-71`

```typescript
export function writeTrajectoryLedger(projectRoot: string, ledger: TrajectoryLedger): string {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  mkdirSync(resolve(ledgerPath, ".."), { recursive: true })
  writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, "utf-8")
  return ledgerPath
}
```

Contrast with `store.ts:49-51` for agent-work contracts:

```typescript
const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
writeFileSync(tmpFile, `${JSON.stringify({ ...store, updatedAt: Date.now() }, null, 2)}\n`, "utf-8")
renameSync(tmpFile, filePath)
```

The trajectory ledger writes directly — a crash mid-write could corrupt the file. The corruption recovery (quarantine on parse failure) handles this on next read, but the window for data loss exists.

**Fix approach:** Adopt the same temp-file + renameSync pattern used by `store.ts`.

### 7.4 Operation Re-exports Create Hidden Public Surface (⚠️ LOW)

**File:** `trajectory/index.ts:1-3`

```typescript
export * from "./types.js"
export * from "./ledger.js"
export * from "./store-operations.js"
```

The barrel uses wildcard `export *`. This re-exports `createEmptyTrajectoryLedger()` and `compareTrajectoryRecords()` from `ledger.ts` plus `createTrajectoryLedger()` from `store-operations.ts` — internal helpers that should not be part of the public surface. The tool only needs the 6 action functions.

**Fix approach:** Narrow to explicit named exports, matching the pattern applied to command-engine in Phase 18 (`D-18-06`).

### 7.5 Trajectory Tests Are Thin (⚠️ MEDIUM)

| Test file | Tests | Coverage |
|-----------|-------|----------|
| `tests/lib/trajectory/ledger.test.ts` | 3 | attach, full CRUD lifecycle, corruption handling |
| `tests/tools/hivemind-trajectory.test.ts` | 2 | E2E tool flow, validation error |

**Total: 5 tests.**

**Gaps:**
- No test for `traverseTrajectory()` with `sessionId` or `trajectoryId` filters
- No test for closing a non-existent trajectory (error path)
- No test for concurrent writes to the same trajectory
- No test for ledger version migration/compatibility
- No test for `createEmptyTrajectoryLedger()` (used by `createTrajectoryLedger()` alias)
- No test for `getTrajectoryLedgerPath()` path traversal guard

### 7.6 Agent-Work-Contract Tests Are Thin (⚠️ MEDIUM)

| Test file | Tests | Coverage |
|-----------|-------|----------|
| `tests/lib/agent-work-contracts/store.test.ts` | 4 | create, pressure block, compaction bounds, export, deep clone |
| `tests/tools/hivemind-agent-work.test.ts` | 2 | create+export, pressure block |

**Total: 6 tests.**

**Gaps:**
- No test for `getAgentWorkContract()` when contract doesn't exist (undefined path)
- No test for `exportAgentWorkContract()` when contract doesn't exist (error path)
- No test for concurrent upserts to the same contract ID
- No test for `trajectoryId` cross-reference integration (creating a contract with trajectoryId and verifying the trajectory evidence ref is created)
- No test for the `require_approval` pressure path (line 36-38 in operations.ts)

### 7.7 Cycle 3 ROADMAP Inaccuracy (⚠️ HIGH)

**File:** `.planning/ROADMAP.md:680`

> Phase 25 goal: "Add trajectory tests (zero currently)"

**Reality:** Trajectory has **5 tests** (3 unit + 2 tool).

This discrepancy means a Phase 25 executor could see "zero tests" and skip running existing tests, potentially breaking them, or waste time writing tests for code that already has them.

**Fix approach:** Update ROADMAP.md Phase 25 goal to accurately state current test count.

---

## 8. Recommendations

### 8.1 Phase 25 Redesign Scope

Based on this analysis, the Phase 25 redesign should prioritize:

| Priority | Item | Impact |
|----------|------|--------|
| **P0** | Implement trajectory status state machine (active→closed→failed/cancelled) | Closes 7.1 |
| **P0** | Implement agent-work-contract lifecycle transitions (created→running→blocked→completed→cancelled) | Closes 7.2 |
| **P1** | Expand trajectory tests from 5 to 15+ (error paths, filters, concurrent access) | Closes 7.5 |
| **P1** | Expand agent-work-contract tests from 6 to 12+ (missing paths, cross-ref integration) | Closes 7.6 |
| **P1** | Fix trajectory ledger to use atomic temp-file write | Closes 7.3 |
| **P2** | Narrow trajectory barrel from `export *` to explicit exports | Closes 7.4 |
| **P2** | Update ROADMAP.md Phase 25 test count from "zero" to "5" | Closes 7.7 |
| **P3** | Update ARCHITECTURE.md:113 to include `src/task-management/` in features' allowed deps | Closes §3.2 |
| **P3** | Wire agent-work-contract status transitions to trajectory checkpoint/event system | Cross-feature |

### 8.2 Integration Points

When trajectory and agent-work-contract lifecycles are synchronized:

```
contract: created ──→ running ──→ blocked ──→ completed
                         │           │            │
                         ▼           ▼            ▼
trajectory: active ── checkpoint ── checkpoint ──→ closed
```

The `trajectoryId` field in `AgentWorkContract` (`agent-work-contract.schema.ts:69-70`) and the `trajectoryEvidenceRef` already provide the wiring foundation. Phase 25 should extend this to status-synced checkpoints:

- Contract transitions to `running` → trajectory checkpoint "Contract entered running state"
- Contract transitions to `blocked` → trajectory checkpoint "Contract blocked" with evidence
- Contract transitions to `completed` → trajectory checkpoint + `closeTrajectory()`

### 8.3 DeriveSurface Deduplication

The Phase 25 ROADMAP mentions "Deduplicate deriveSurface()." This function was not found in either trajectory or agent-work-contract modules — it likely exists elsewhere (e.g., `src/tools/delegation/` or `src/coordination/delegation/`). The Phase 25 executor should:
1. Search for `deriveSurface` across `src/` using `grep`
2. If found in multiple locations, extract to a shared utility
3. If not found, remove the ROADMAP reference as stale

---

## Appendix: File Manifest

| # | File | LOC | Role | Analyzed |
|---|------|-----|------|----------|
| 1 | `src/task-management/trajectory/types.ts` | 128 | Trajectory type contracts | ✅ |
| 2 | `src/task-management/trajectory/ledger.ts` | 93 | Ledger file I/O | ✅ |
| 3 | `src/task-management/trajectory/store-operations.ts` | 190 | CRUD operations | ✅ |
| 4 | `src/task-management/trajectory/index.ts` | 3 | Barrel export | ✅ |
| 5 | `src/features/agent-work-contracts/types.ts` | 89 | AWC type contracts | ✅ |
| 6 | `src/features/agent-work-contracts/store.ts` | 146 | AWC store persistence | ✅ |
| 7 | `src/features/agent-work-contracts/operations.ts` | 162 | AWC business logic | ✅ |
| 8 | `src/features/agent-work-contracts/index.ts` | 3 | Barrel export | ✅ |
| 9 | `src/schema-kernel/trajectory.schema.ts` | 49 | Trajectory tool validation | ✅ |
| 10 | `src/schema-kernel/agent-work-contract.schema.ts` | 148 | AWC tool validation | ✅ |
| 11 | `src/tools/hivemind/hivemind-trajectory.ts` | 112 | Trajectory tool | ✅ |
| 12 | `src/tools/hivemind/hivemind-agent-work.ts` | 152 | AWC tools | ✅ |
| 13 | `src/shared/types.ts` | 412 | Shared contracts | ✅ |
| 14 | `tests/lib/trajectory/ledger.test.ts` | 84 | Trajectory unit tests | ✅ |
| 15 | `tests/tools/hivemind-trajectory.test.ts` | 62 | Trajectory tool tests | ✅ |
| 16 | `tests/lib/agent-work-contracts/store.test.ts` | 116 | AWC unit tests | ✅ |
| 17 | `tests/tools/hivemind-agent-work.test.ts` | 73 | AWC tool tests | ✅ |

---

*Cross-reference analysis: ${new Date().toISOString().split('T')[0]}*
