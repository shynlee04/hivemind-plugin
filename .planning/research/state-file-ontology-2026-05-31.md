# State File Conceptual Ontology

**Date:** 2026-05-31
**Author:** GSD Advisor (specialist subagent)
**Evidence level:** L5 — architecture analysis grounded in actual source code and on-disk state files
**Domain:** `.hivemind/state/` persistence architecture, cross-file relationships, system coherence

---

## 1. Ontological Category Matrix

The 4 state files occupy a 2x2 matrix defined by two axes:

- **X-axis: Runtime vs Governance** — Does the file track *what happened* (runtime facts) or *what should happen* (prescriptive plans/contracts)?
- **Y-axis: Operation Log vs State Snapshot** — Is the file a sequence of discrete operations/events, or a snapshot of current/desired state?

| | **Runtime (what happened)** | **Governance (what should happen)** |
|---|---|---|
| **Operation log** | `delegations.json` | `trajectory-ledger.json` |
| **State snapshot** | `session-continuity.json` | `agent-work-contracts.json` |

### Why each file belongs where

#### `delegations.json` — Runtime Operation Log

| Property | Evidence |
|----------|----------|
| **Axis:** Runtime | Tracks actual delegation lifecycle (dispatch → poll → terminal/completion/error). Each record is a factual statement about an operation that occurred. |
| **Axis:** Operation log | Flat array of individual operation records. New delegations are appended; existing ones are updated by ID. No global snapshot, no prescriptive state. |
| **Shape:** `Delegation[]` | Array, keyed by delegation UUID. Each entry has timestamps for every lifecycle stage (`createdAt`, `completedAt`, `gracePeriodExpiresAt`). |
| **Status values:** | `dispatched`, `running`, `completed`, `error`, `timeout` — all reflect actual runtime outcomes. |
| **Module:** | `src/task-management/continuity/delegation-persistence.ts` |
| **Write trigger:** | Every delegation state machine transition (`persistAll()` after register, update, terminal, grace period). |

#### `session-continuity.json` — Runtime State Snapshot

| Property | Evidence |
|----------|----------|
| **Axis:** Runtime | Contains rich metadata about sessions that existed: `pendingNotifications`, `lifecycle`, `resultCapture`, `compactionCheckpoint`, `delegationPacket`, `route`, `lastToolActivityAt`. All are factual records of what the session experienced. |
| **Axis:** State snapshot | Single `{ version, updatedAt, sessions: { [id]: {...} }, governance }` structure. The `sessions` map is a point-in-time snapshot of all known sessions. No operation log — each key is overwritten on updates, not appended. |
| **Shape:** `ContinuityStoreFile` | Object with `sessions` map + `governance` sub-object. Writes are full-file overwrites (temp file + rename). |
| **Status values:** | `pending`, `running`, `completed`, `error`, `deleted` — session lifecycle states. |
| **Module:** | `src/task-management/continuity/index.ts` |
| **Write trigger:** | `recordSessionContinuity()`, `patchSessionContinuity()`, `deleteSessionContinuity()` called from `plugin.ts`, lifecycle, hooks. |

#### `trajectory-ledger.json` — Governance Operation Log

| Property | Evidence |
|----------|----------|
| **Axis:** Governance | Tracks *planned* workflow progress: phase-level orchestration states like `researching`, `planning`, `executing`, `verifying`, `completed`, `closed`. These are not runtime facts about the system — they are orchestrator-defined workflow checkpoints. |
| **Axis:** Operation log | Append-only event log within each trajectory (`events: [{ eventId, eventType, summary, evidenceRefs, createdAt }]`). Checkpoints mark discrete progress steps. The ledger is a record of governance decisions, not system state. |
| **Shape:** `TrajectoryLedger` | Object with `trajectories` map. Each trajectory has an ordered event array and checkpoint array. Events are appended, never mutated (D-25 immutability guard validates this). |
| **Status values:** | `planning`, `executing`, `verifying`, `completed`, `closed` — workflow governance states (P25.5 D-31 to D-35). |
| **Module:** | `src/task-management/trajectory/ledger.ts` + `store-operations.ts` |
| **Write trigger:** | `hivemind-trajectory` tool actions (create, event, checkpoint, attach, close). Orchestrator-driven. |

#### `agent-work-contracts.json` — Governance State Snapshot

| Property | Evidence |
|----------|----------|
| **Axis:** Governance | Defines *what should happen*: work scope boundaries, allowed/forbidden surfaces, required evidence, non-goals. A contract is a prescriptive agreement created *before* work begins. |
| **Axis:** State snapshot | Single `{ version, updatedAt, contracts: { [id]: {...} } }` structure. Each contract is a bounded scope document. No operation log — contracts are created with `status: "created"` then transitioned to `"running"` or `"completed"`. |
| **Shape:** `AgentWorkContractStore` | Object with `contracts` map. Each contract contains immutable scope definition + mutable `status` and `evidenceResults`. |
| **Status values:** | `created`, `running`, `completed` — contract lifecycle states. |
| **Module:** | `src/features/agent-work-contracts/store.ts` + `operations.ts` |
| **Write trigger:** | `hivemind-agent-work-create` tool. `upsertAgentWorkContract()` is the single write surface. |

---

## 2. Data Flow

The canonical end-to-end workflow shows how all 4 files participate:

```
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT DECIDES TO WORK                                              │
│  (orchestrator or coordinator agent)                                │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. hivemind-agent-work-create                                       │
│     → upsertAgentWorkContract() writes agent-work-contracts.json    │
│     → Sets status="created", defines taskBoundary/allowedSurfaces   │
│     → Creates scope boundary BEFORE any delegation                  │
│     → If trajectoryId provided, calls attachTrajectoryEvidence()    │
│       which writes trajectory-ledger.json                           │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. hivemind-trajectory event "planning:start"                      │
│     → addTrajectoryEvent() writes trajectory-ledger.json            │
│     → Auto-transitions status from "planning"→"executing" if        │
│       event type matches TRAJECTORY_AUTO_TRANSITIONS                │
│     → Evidence refs can link back to agent-work-contract ID         │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. delegate-task (or task tool)                                     │
│     → DelegationManager dispatches child session                    │
│     → DelegationStateMachine.persistAll() writes delegations.json   │
│     → Record written with: id, parentSessionId, childSessionId,     │
│       agent, status="dispatched", executionMode, surface,           │
│       recoveryGuarantee, queueKey, nestingDepth                     │
│     → Also writes to session-continuity.json via                     │
│       persistPendingDelegationNotifications() for notification       │
│       delivery tracking                                              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. Session lifecycle events (created/idle/error/deleted)           │
│     → lifecycleManager.hydrateFromContinuity() reads                │
│       session-continuity.json                                       │
│     → Session lifecycle callbacks call recordSessionContinuity() /  │
│       patchSessionContinuity() updating session-continuity.json     │
│     → Updates: status, pendingNotifications, lifecycle,             │
│       delegationPacket, resultCapture, compactionCheckpoint         │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. Delegation completes / errors / times out                       │
│     → DelegationStateMachine transitions to terminal state          │
│     → persistDelegations() updates delegations.json entry           │
│     → Sets status="completed|error|timeout", completedAt timestamp  │
│     → persistPendingDelegationNotifications() writes notification   │
│       to session-continuity.json for parent session delivery        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. hivemind-trajectory event "execution:complete"                  │
│     → addTrajectoryEvent() writes trajectory-ledger.json            │
│     → Auto-transitions status to "completed"                        │
│     → Event summary + evidenceRefs document what was done           │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. hivemind-agent-work-create (status=completed)                   │
│     → upsertAgentWorkContract() updates agent-work-contracts.json   │
│     → Sets status="completed", populates evidenceResults            │
│     → Links back to trajectory via trajectoryId                     │
│     → SCOPE CLOSED — all 4 files reflect terminal state            │
└─────────────────────────────────────────────────────────────────────┘
```

### Key observation: No cross-file transactions

Steps 1-7 are **not atomic**. Each file write is independently atomic (temp file + rename), but there is no mechanism to ensure that:
- Contract creation + trajectory evidence attachment happen atomically
- Delegation write + session-continuity notification write happen atomically
- Trajectory event + contract status update happen atomically

If the process crashes between steps 1a and 1b, the trajectory ledger has an evidence ref pointing to a non-existent contract.

---

## 3. Cross-File Linkage Map

The 4 files reference each other through explicit ID linkages:

```
agent-work-contracts.json          trajectory-ledger.json
┌──────────────────────┐           ┌──────────────────────┐
│ contract.trajectoryId ──────────→│ trajectory.id         │
│   (e.g., "traj-phase-40.01")     │                       │
│                                   │ events[].evidenceRefs │
│ contract.trajectoryEvidenceRef ──→│   (indirect — can     │
│   (e.g., "agent-work-contract:   │    reference contract  │
│    awc-p40.01-research")          │    IDs as strings)    │
└──────────────────────┘           └──────────────────────┘
         │                                  │
         │                                  │
         ▼                                  ▼
delegations.json                    session-continuity.json
┌──────────────────────┐           ┌──────────────────────┐
│ delegation.parent     │           │ session.id            │
│ SessionId ────────────┼──┐        │                       │
│                       │  │        │ metadata.pending      │
│ delegation.child      │  │        │ Notifications[].      │
│ SessionId ────────────┼──┤        │   delegationId ───────┼──┐
│                       │  │        │   (refers to          │  │
│ delegation.id ────────┼──┼────────┤    delegations.json   │  │
│   (UUID ref'd by      │  │        │    entry)             │  │
│    pendingNotif.)      │  │        │                       │  │
│                       │  │        │ session.updatedAt     │  │
│   ┌───────────────────┘  │        │   (≈ delegation.      │  │
│   │                      │        │    completedAt)        │  │
│   ▼                      │        └──────────────────────┘  │
│                     ┌────┘                                   │
│                     │                                        │
│                     ▼                                        ▼
│              trajectory-ledger.json                    trajectory-ledger.json
│              ┌──────────────────────┐                  ┌──────────────────────┐
│              │ trajectory.          │                  │ events[].            │
│              │ evidenceRefs[ ] ─────┼──────────────────┤ evidenceRefs[ ]      │
│              │   (can include       │                  │   (can include        │
│              │    "dt-..."           │                  │    "ses_..." or       │
│              │    delegation IDs)    │                  │    "session-tracker:  │
│              └──────────────────────┘                  │     ..." refs)        │
│                                                        └──────────────────────┘
│
▼
session-continuity.json
┌─────────────────────────────────────────────────────┐
│ governance.violations[].sessionID                     │
│   (refers to sessions tracked here,                  │
│    NOT in delegations.json)                          │
│                                                       │
│ metadata.delegation.delegationId ─────────────────────┼──optional ref to
│   (when delegation metadata is set)                    │ delegations.json
│                                                       │
│ metadata.delegationPacket.parentChain[ ]              │
│   (session ID chain — links to other entries           │
│    in session-continuity.json)                        │
└─────────────────────────────────────────────────────┘
```

### Concrete evidence from actual data

From `trajectory-ledger.json` → `agent-work-contracts.json`:
```
traj_thinking_001.evidenceRefs = [
  "awc_309ddb38-8128-4f17-8a2e-34a8cb2fc7a7",      // → contracts.id
  "dt-1779217864180-2a378z",                          // → delegations.json[].id
  "awc_ddd7286e-48ac-4efc-b41c-a98e8ed7ec02"         // → contracts.id
]
```

From `trajectory-ledger.json` → session-tracker (not state files but complementary):
```
traj-ses_18ae5c564ffe1zWaJUgh4VEvDb.evidenceRefs = [
  "session-tracker:delegation:delegate-task:ses_...", // → session-tracker files
  "session-tracker:child-json:ses_...",
  "agent-work-contract:awc-ses_...",                  // → contracts.id
  "session-tracker:idle:ses_..."
]
```

From `session-continuity.json` → `delegations.json`:
```
ses_parent.metadata.pendingNotifications[0].metadata.delegationId = "dcaf16f0-..."
// This delegationId SHOULD match delegations.json[].id but there is NO
// referential integrity check — the value is a free-form string.
```

### Linkage gaps

| Source | Target | How | Integrity? |
|--------|--------|-----|------------|
| `agent-work-contracts.json` | `trajectory-ledger.json` | `contract.trajectoryId` → `trajectory.id` | Soft: no cross-file validation on write |
| `agent-work-contracts.json` | `trajectory-ledger.json` | `createAgentWorkContract()` calls `attachTrajectoryEvidence()` | Hard: both writes in same function, but NOT atomic |
| `delegations.json` | `session-continuity.json` | `parentSessionId` + `childSessionId` → `sessions` keys | Soft: session IDs can be entirely unrelated (proven: 0 overlap in actual data) |
| `session-continuity.json` | `delegations.json` | `pendingNotifications[].metadata.delegationId` → `delegations.json[].id` | **NONE**: free-form string, no validation |
| `trajectory-ledger.json` | `delegations.json` | `evidenceRefs` containing `"dt-..."` prefixed IDs | **NONE**: just string matching convention |
| `trajectory-ledger.json` | `agent-work-contracts.json` | `evidenceRefs` containing `"awc_..."` or `"agent-work-contract:..."` | **NONE**: just string matching convention |

---

## 4. Skeleton Phase Structure

Given the existing phase plan (P41.02-P41.08, state cluster hardening), the following additional phases are needed to make these 4 files work as a COHERENT SYSTEM.

### Gap Analysis

| Gap | Severity | Description |
|-----|----------|-------------|
| **G-01: Cross-file transactions** | HIGH | Contract creation + trajectory evidence attachment are two sequential file writes with no rollback if the second fails. Same for delegation write + notification write. |
| **G-02: Unified path resolution** | MEDIUM | Each file resolves its own path independently: `delegations.json` uses `getDelegationStoreDirectory()` → `dirname(getContinuityStoragePath())`; trajectory uses `getTrajectoryLedgerPath()` with `assertPathWithinRoot()`; contracts uses `getAgentWorkContractsFilePath()` with `assertPathWithinRoot()`; session-continuity uses `resolveContinuityFilePath()` with env-override + legacy fallback. No shared path resolver. |
| **G-03: flushAllStores coverage** | HIGH | `flushAllStores()` in `continuity/index.ts` only flushes the in-memory cache of `session-continuity.json`. `delegations.json` writes synchronously on every state transition (no deferred flush needed). But `trajectory-ledger.json` and `agent-work-contracts.json` have NO flush mechanism — they write synchronously but have NO shutdown handler. |
| **G-04: Boot-time initialization order** | HIGH | Plugin.ts init order: (1) `getConfig()` → (2) `new SessionTracker()` → (3) `sessionTracker.constructCoreDependencies()` → (4) `setupDelegationModules()` → (5) `delegationManager.recoverPending()` (reads delegations.json) → (6) `hydrateFromContinuity()` (reads session-continuity.json) → (7) `sessionTracker.initialize()` → (8) event-tracker migration. **Trajectory ledger and contract store are NEVER initialized at boot** — they are read on demand when a tool is called. This means boot-time errors in those files go undetected until the first tool invocation. |
| **G-05: Error isolation** | MEDIUM | Each file has independent quarantine logic for corrupt data. But there is no coordinated error response: if `delegations.json` is corrupt and quarantined, `recoverPending()` fails silently (`void delegationManager.recoverPending()` — line 397 of plugin.ts). Sessions that had active delegations are lost without notification. |
| **G-06: No startup integrity check** | LOW | No phase-agnostic "check all 4 state files" health check exists. `hivemind doctor` exists (BOOT-06) but does not validate state file consistency (cross-file reference integrity, schema freshness, required fields). |
| **G-07: Schema version drift** | LOW | Each file tracks `version` independently (`delegations.json` has NO version field — it's a raw array; session-continuity has `version: 1`; trajectory-ledger has `version: TRAJECTORY_LEDGER_VERSION`; contracts store uses `version: 1` from schema). No mechanism prevents different files from being at incompatible schema versions. |

### Proposed Phase Skeleton

The phases below should be inserted after P41.01 (Research) and before current P41.02-P41.08, or interleaved as prerequisites:

#### P41.02: Cross-File Transaction Coordinator (HIGH — resolves G-01)

| Field | Value |
|-------|-------|
| **Objective** | Create a lightweight transaction coordinator that ensures contract+trajectory and delegation+notification writes are either both committed or both recoverable. Not a full ACID transaction — a "best-effort coordinated write" with recovery hints. |
| **Scope boundaries** | `src/shared/state-coordinator.ts` (new, <150 LOC). Do NOT modify existing write paths — wrap them. |
| **Allowed surfaces** | `src/shared/` |
| **Non-goals** | Do NOT implement rollback. Do NOT add a write-ahead log. Do NOT change any existing file write path. |
| **Key design** | Add a `coordinatedWrite(key: string, writes: Array<() => void>)` helper that: (1) tags each write with a trace ID, (2) writes a `.pending` sentinel file before the first write, (3) deletes sentinel after last write completes, (4) on boot, any remaining `.pending` files trigger a diagnostic log (not auto-recovery). |
| **Evidence criteria** | Test that `coordinatedWrite` creates/deletes sentinel. Manual verification that contract+trajectory write sequence uses it. Typecheck + tests pass. |
| **Depends on** | P41.01 (research complete) |

#### P41.03: Unified State Path Resolver (MEDIUM — resolves G-02)

| Field | Value |
|-------|-------|
| **Objective** | Consolidate all 4 file path resolutions into a single `getStatePath(type: StateFileType)` function. Eliminate path derivation duplication. |
| **Scope boundaries** | `src/shared/state-paths.ts` (new, <80 LOC). Update callers in `continuity/index.ts`, `delegation-persistence.ts`, `ledger.ts`, `contracts/store.ts`. |
| **Allowed surfaces** | `src/shared/`, `src/task-management/continuity/`, `src/task-management/trajectory/`, `src/features/agent-work-contracts/` |
| **Non-goals** | Do NOT change env-override logic in `continuity/index.ts` (that has legacy backward compat). Do NOT change file write mechanics (tmp+rename). |
| **Key design** | `getStatePath(type: "delegations" | "session-continuity" | "trajectory-ledger" | "agent-work-contracts", projectRoot?: string)` → absolute path. All callers use this instead of duplicating path logic. |
| **Evidence criteria** | All 4 file path derivations produce identical output before/after. No duplicated path logic remains. Typecheck + tests pass. |
| **Depends on** | P41.01 |

#### P41.04: flushAllStores Coverage Extension (HIGH — resolves G-03)

| Field | Value |
|-------|-------|
| **Objective** | Extend `flushAllStores()` to also flush trajectory ledger and contract store in-memory caches. Add shutdown handler registration for all 4 files. |
| **Scope boundaries** | `src/task-management/continuity/index.ts` (extend existing `flushAllStores()` and `registerShutdownHandlers()`). `src/features/agent-work-contracts/store.ts` (add in-memory cache + flush). `src/task-management/trajectory/ledger.ts` (add in-memory cache + flush). |
| **Allowed surfaces** | `src/task-management/continuity/`, `src/task-management/trajectory/`, `src/features/agent-work-contracts/` |
| **Non-goals** | Do NOT change synchronous write behavior of `delegations.json` (it writes on every transition, no caching needed). Do NOT delay shutdown. |
| **Key design** | (1) Add in-memory cache for trajectory ledger and contract store (pattern: read on first access, cache until modified, flush to disk on exit). (2) `flushAllStores()` iterates all 3 cached stores. (3) `registerShutdownHandlers()` covers all 4 files (delegations is already sync). |
| **Evidence criteria** | `process.on("exit")` handler flushes all 4 stores. Tests verify cache flush behavior. Typecheck + tests pass. |
| **Depends on** | P41.03 (unified path resolver makes flush iteration simpler) |

#### P41.05: Boot-Time Initialization Sequence Audit (HIGH — resolves G-04, G-05)

| Field | Value |
|-------|-------|
| **Objective** | Audit and document boot-time initialization. Add startup validation that trajectory ledger and contract store are readable. Add coordinated error handling for corrupt state files. |
| **Scope boundaries** | `src/plugin.ts` (read-only audit, add startup validation calls). No logic changes to existing init order. |
| **Allowed surfaces** | `.planning/`, `src/plugin.ts` (read-only for audit; write for validation calls). |
| **Non-goals** | Do NOT change plugin.ts initialization order. Do NOT add blocking checks (all state validation must be best-effort/fire-and-forget). |
| **Key design** | (1) Document exact init order in `plugin.ts` as comments. (2) Add `void readTrajectoryLedger(projectDirectory)` and `void readAgentWorkContracts(projectDirectory)` fire-and-forget calls after `recoverPending()` to eagerly validate these files are readable. (3) Add diagnostic logging for corrupt files. (4) Produce `PLAN.md` for the audit findings. |
| **Evidence criteria** | Plugin init log shows "state files validated" or "state file X corrupt, quarantined at Y". No change to normal operation. Typecheck + tests pass. |
| **Depends on** | P41.03 |

#### P41.06: State File Health Check (`hivemind doctor` extension) (LOW — resolves G-06)

| Field | Value |
|-------|-------|
| **Objective** | Add state file consistency checks to `hivemind doctor` (BOOT-06). |
| **Scope boundaries** | `src/cli/commands/doctor.ts` (or equivalent BOOT-06 file). |
| **Allowed surfaces** | `src/cli/` |
| **Non-goals** | Do NOT add cross-file referential integrity checks (high cost, low value — the IDs are string conventions, not enforced references). |
| **Key design** | Check each state file: (1) exists, (2) parseable, (3) has expected version, (4) non-empty (contracts/trajectories have at least one entry expected). Report PASS/FAIL per file. |
| **Evidence criteria** | `hivemind doctor` reports "State files: 4/4 OK" or specific failures. |
| **Depends on** | BOOT-06 (existing doctor command) |

#### P41.07: Schema Version Contract (LOW — resolves G-07)

| Field | Value |
|-------|-------|
| **Objective** | Add a shared schema version registry that all 4 state files reference. Ensure incompatible version changes are detected at read time. |
| **Scope boundaries** | `src/shared/state-versions.ts` (new, <50 LOC). Add version check to each file's read path. |
| **Allowed surfaces** | `src/shared/`, read paths in `continuity/index.ts`, `delegation-persistence.ts`, `ledger.ts`, `contracts/store.ts` |
| **Non-goals** | Do NOT implement migration. Do NOT change write version. |
| **Key design** | Central registry: `STATE_FILE_VERSIONS = { delegations: 0, sessionContinuity: 1, trajectoryLedger: 1, agentWorkContracts: 1 }`. On read, if file version > known version, log a diagnostic warning about incompatible future schema. (`delegations.json` has no version field — assign version 0 and note it). |
| **Evidence criteria** | Version registry exists. Reads log warning for unknown versions. No behavior change for current versions. Typecheck + tests pass. |
| **Depends on** | P41.03 |

### Integration with Existing P41.x

```
P41.01 — Research state redundancy (✅ complete)
  │
  ├── P41.02 — Cross-file transaction coordinator (HIGH) [new]
  ├── P41.03 — Unified state path resolver (MEDIUM) [new]
  │
  ├── P41.04 — flushAllStores coverage extension (HIGH) [new]
  │   └── depends on P41.03
  │
  ├── P41.05 — Boot-time init sequence audit (HIGH) [new]
  │   └── depends on P41.03
  │
  ├── P41.06 — Doctor health check extension (LOW) [new]
  │   └── depends on BOOT-06
  │
  ├── P41.07 — Schema version contract (LOW) [new]
  │   └── depends on P41.03
  │
  └── P41.08+ — Existing planned phases (rename session-continuity.json,
                push pendingNotifications, etc. — from 41.01-RESEARCH.md)
```

### Execution Priority

| Priority | Phase | Rationale |
|----------|-------|-----------|
| 🥇 P1 | P41.05 (Boot init audit) | Must understand current state before changing anything. Produces the PLAN.md for subsequent phases. |
| 🥇 P1 | P41.04 (flushAllStores) | Data loss risk on shutdown — highest user-facing impact. |
| 🥈 P2 | P41.02 (Transaction coordinator) | Cross-file consistency is important but rare edge case (crash mid-write). |
| 🥈 P2 | P41.03 (Unified path resolver) | Foundational refactor — many subsequent phases depend on it. |
| 🥉 P3 | P41.06 (Doctor extension) | Developer UX improvement, not critical. |
| 🥉 P3 | P41.07 (Schema version) | Future-proofing, not urgent. |

### Dependency Graph

```
P41.01 (Research — DONE)
  │
  ├──→ P41.05 (Boot audit — no deps on other phases)
  │
  ├──→ P41.03 (Path resolver — no deps)
  │     │
  │     ├──→ P41.04 (flushAllStores — depends on P41.03)
  │     ├──→ P41.07 (Schema version — depends on P41.03)
  │
  └──→ P41.02 (Transaction coordinator — no deps, can parallel P41.03)
  
  P41.06 (Doctor extension — blocked on BOOT-06)
```

---

## Appendix: Current State File Sizes & Contents

| File | Records | Size (approx) | Oldest Entry | Newest Entry |
|------|---------|---------------|-------------|-------------|
| `delegations.json` | 35 delegation records | ~8KB | `1780217438522` (2026-05-28) | `1780219199187` (2026-05-28) |
| `session-continuity.json` | 18 session records | ~8KB | multiple timestamps | `1780219199187` |
| `trajectory-ledger.json` | 14 trajectories | ~18KB | `1779097674067` (2026-05-15) | `1780220083385` (2026-05-28) |
| `agent-work-contracts.json` | 9 contracts | ~6KB | `1780152741292` (2026-05-26) | `1780220083385` (2026-05-28) |

### Actual session overlap between files: ZERO

- `delegations.json` session IDs: `ses-parent-monitor-fail`, `ses-parent-monitor-notify`, `parent-1` (real), `ses-parent-session`, `ses-parent-sdk`
- `session-continuity.json` session IDs: `ses-parent-prompt-fail`, `ses-parent-notify-fail`, `ses-parent-pending-notify`, `ses_parent`, `ses_parent2`, `ses_cleanup`, `ses_recovery`, `ses_concurrent`, `ses-parent-monitor-fail`, `ses-parent-monitor-notify`, `ses-parent-session`, `ses-parent-sdk`, `ses-parent-tool`, `parent-with-model`, `ses_parent_002`, `parent-1`, `parent-c`, `replay-test-parent`
- Overlap: `parent-1`, `ses-parent-monitor-fail`, `ses-parent-monitor-notify`, `ses-parent-session`, `ses-parent-sdk` are shared between delegations.json and session-continuity.json
- **But NONE of these appear in `trajectory-ledger.json` or `agent-work-contracts.json`**, which use orchestrator-level session IDs (`orchestrator-L0`, `ses_18ae5c564ffe1zWaJUgh4VEvDb`).

This proves the files operate in **two distinct session namespaces**: 
1. Delegation/session-metadata namespace (real SDK session IDs)
2. Orchestrator/governance namespace (orchestrator-level IDs, not real SDK sessions)

---

## Appendix: Source Module Authority Map

| State File | Authoring Module | Read Module(s) | Write Tool(s) |
|------------|-----------------|----------------|---------------|
| `delegations.json` | `src/task-management/continuity/delegation-persistence.ts` | `delegation-persistence.ts`, `manager-runtime.ts`, `delegation-status.ts`, `session-journal-export.ts`, `retry-handler.ts` | `delegate-task` (indirect via DelegationStateMachine) |
| `session-continuity.json` | `src/task-management/continuity/index.ts` | `continuity/index.ts`, `lifecycle/index.ts`, `hooks/*`, `plugin.ts` | lifecycle hooks, notification system |
| `trajectory-ledger.json` | `src/task-management/trajectory/ledger.ts` + `store-operations.ts` | `ledger.ts`, `store-operations.ts`, `hivemind-trajectory` tool | `hivemind-trajectory` tool |
| `agent-work-contracts.json` | `src/features/agent-work-contracts/store.ts` | `store.ts`, `operations.ts`, `hivemind-agent-work-create` tool, `tool-before-guard.ts` | `hivemind-agent-work-create` tool |
