# Phase P41-B: Add 8 Gap Fields to Session-Tracker Types + Redirect Writers — Research

**Researched:** 2026-05-31
**Domain:** State cluster redesign — write-side migration
**Confidence:** HIGH

## Summary

P41-B is the first implementation phase of the P41 state cluster redesign. It has two primary goals: (1) extend the `ChildSessionRecord` schema with 7 new optional fields that are currently only stored in legacy `delegations.json` and `session-continuity.json`, and (2) redirect 5 writer code paths to also write through the session-tracker (`ChildWriter.createChildFile()`, `HierarchyManifestWriter.addChild()`, and the new governance-state persistence module).

**Key constraint:** Old files are NOT deleted (P41-D). All old writer paths continue to function (dual-write). Readers are NOT modified (P41-C).

**Primary recommendation:** Proceed with the SPEC as written. All architectural assumptions have been verified against the codebase. The most significant risk is the sync→async impedance mismatch in `persistDelegations()` — mitigated by fire-and-forget dual-write since the old sync path continues to run.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-P41B-01 | Add `pendingNotifications?: PendingNotification[]` to `ChildSessionRecord` | Type import resolves: `../../shared/types.js`. Field is optional — no breaking change. 7 test records carry notification data, zero production. |
| REQ-P41B-02 | Add 6 MEDIUM optional fields (`queueKey`, `terminalKind`, `recoveryGuarantee`, `executionMode`, `compactionCheckpoint`, `lifecycle`) | All import paths verified. No circular dependencies. All types are plain serializable values. |
| REQ-P41B-03 | Create standalone `.hivemind/state/governance-state.json` | Path resolves via `getCanonicalStateDir()` — no collisions. Governance is cross-cutting, not per-session. |
| REQ-P41B-04 | Redirect `persistDelegations()` → `ChildWriter.createChildFile()` | Sync→async impedance identified. Fire-and-forget with `void childWriter.createChildFile(...)`. Field mapping table verified. `rootMainSessionID` gap identified for `HierarchyManifestWriter.addChild()`. |
| REQ-P41B-05 | Redirect `recordSessionContinuity()` / `patchSessionContinuity()` → session-tracker | `continuity/index.ts` can import `ChildWriter` without circular deps. Graceful skip on missing child file. |
| REQ-P41B-06 | All tests pass, typecheck clean | Dual-write preserves all old paths. Test field-count assertion risk identified (A23). |
| REQ-P41B-07 | All writers functional through new paths | 5 writer actors verified. Dual-write ensures old tests still validate old paths. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session metadata persistence | Session-tracker (`features/session-tracker/`) | — | Canonical storage for session-tracker child records |
| Delegation persistence | Task-management (`task-management/continuity/`) | Session-tracker (dual-write) | `persistDelegations()` is a delegation concern that now also writes to session-tracker |
| Continuity persistence | Task-management (`task-management/continuity/`) | Session-tracker (dual-write) | `recordSessionContinuity()`/`patchSessionContinuity()` also write lifecycle/pendingNotifications to session-tracker |
| Governance persistence | New standalone (`features/governance/persistence.ts`) | — | Governance is a cross-cutting concern, not per-session. Separate file. |
| Hierarchy tracking | Session-tracker (`features/session-tracker/persistence/hierarchy-manifest.ts`) | — | `HierarchyManifestWriter` is the canonical delegation tree source |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (project default) | Type definitions for session-tracker schema | Already part of the project — no new dependencies |
| Node.js `fs/promises` | built-in | Async file I/O for session-tracker writers | Existing session-tracker pattern |
| Node.js `fs` sync | built-in | Sync file I/O for legacy delegation/continuity writers | Existing legacy pattern (dual-write preserves this) |
| `atomicWriteJson` | project-internal | Atomic write (tmp→rename) for session-tracker files | Already in `session-tracker/persistence/atomic-write.js` |

### No new packages needed
All types, functions, and utilities already exist in the codebase. This phase adds zero external dependencies.

---

## Schema Change Analysis

### Context: Target Interface

The `ChildSessionRecord` interface (at `src/features/session-tracker/types.ts:211-236`) currently has:
- **Required fields:** `sessionID`, `parentSessionID`, `delegationDepth`, `delegatedBy`, `created`, `updated`, `status`, `mainAgent`, `turns`, `children` (10 fields)
- **Optional fields:** `lastMessage?`, `journey?` (2 fields)
- **7 new optional fields to add** (bringing total to 19)

### Field-by-Field Analysis

#### Field 1: `pendingNotifications` (HIGH)
| Property | Value |
|----------|-------|
| **Target interface** | `ChildSessionRecord` |
| **Type signature** | `pendingNotifications?: PendingNotification[]` |
| **Optional?** | YES — `?` prefix |
| **Import source** | `import type { PendingNotification } from "../../shared/types.js"` — resolves correctly from `src/features/session-tracker/types.ts` |
| **Which writer populates it** | `notification-handler.ts:219-229`, `plugin.ts:232-237` (via `patchSessionContinuity()` with `pendingNotifications`), also cleared by `lifecycle/index.ts:187` |
| **Which reader consumes it** | `notification-handler.ts:219` (`queuePendingNotification` reads via `getSessionContinuity()`), `plugin.ts:630-645` (`replayPendingDelegationNotifications` reads via `listSessionContinuity()`) |
| **Current storage** | `SessionContinuityMetadata.pendingNotifications` — in-memory only, persisted inside `session-continuity.json` |
| **Serialization** | Plain array of `TaskNotification`-derived objects — serializes cleanly via `JSON.stringify` |
| **VERIFIED** | [VERIFIED: codebase inspection] — type exists at `src/shared/types.ts:31`, is referenced in `continuity/index.ts:15` |

#### Field 2: `queueKey` (MEDIUM)
| Property | Value |
|----------|-------|
| **Target interface** | `ChildSessionRecord` |
| **Type signature** | `queueKey?: string` |
| **Optional?** | YES |
| **Import source** | Inline primitive — no import needed |
| **Which writer populates it** | `delegation-persistence.ts:58` (`persistDelegations()`) — reads `Delegation.queueKey` |
| **Which reader consumes it** | `delegation-status.ts:429` (delegation status tool), `hivemind-session-view.ts:68-78` |
| **Current storage** | `Delegation.queueKey: string` — always populated per A21. Serialized in `delegations.json`. |
| **VERIFIED** | [VERIFIED: codebase inspection] — `Delegation.queueKey` at `coordination/delegation/types.ts:54` is required `string` |

#### Field 3: `terminalKind` (MEDIUM)
| Property | Value |
|----------|-------|
| **Target interface** | `ChildSessionRecord` |
| **Type signature** | `terminalKind?: DelegationTerminalKind` |
| **Optional?** | YES |
| **Import source** | `import type { DelegationTerminalKind } from "../../coordination/delegation/types.js"` |
| **Which writer populates it** | `delegation-persistence.ts:58` — reads `Delegation.terminalKind` |
| **Which reader consumes it** | `delegation-status.ts`, `buildDelegationResult()` |
| **Current storage** | `Delegation.terminalKind?: DelegationTerminalKind` — optional in `delegations.json` |
| **Circular dep risk** | LOW — `ChildSessionRecord` adding an import from `coordination/delegation/types.js` is safe. The types file exports only pure type interfaces (no runtime code). Verified by grep: zero reverse imports from `coordination/` to `features/session-tracker/`. |
| **VERIFIED** | [VERIFIED: codebase inspection] — `DelegationTerminalKind` at `coordination/delegation/types.ts:12-20` is a pure union type |

#### Field 4: `recoveryGuarantee` (MEDIUM)
| Property | Value |
|----------|-------|
| **Target interface** | `ChildSessionRecord` |
| **Type signature** | `recoveryGuarantee?: DelegationRecoveryGuarantee` |
| **Optional?** | YES |
| **Import source** | `import type { DelegationRecoveryGuarantee } from "../../coordination/delegation/types.js"` |
| **Which writer populates it** | `delegation-persistence.ts:58` — reads `Delegation.recoveryGuarantee` |
| **Current storage** | `Delegation.recoveryGuarantee?: DelegationRecoveryGuarantee` |
| **VERIFIED** | [VERIFIED: codebase inspection] — `DelegationRecoveryGuarantee` at `coordination/delegation/types.ts:10` |

#### Field 5: `executionMode` (MEDIUM)
| Property | Value |
|----------|-------|
| **Target interface** | `ChildSessionRecord` |
| **Type signature** | `executionMode?: "sdk" \| "pty" \| "headless"` |
| **Optional?** | YES |
| **Import source** | Inline union type — no import needed |
| **Which writer populates it** | `delegation-persistence.ts:58` — reads `Delegation.executionMode` (direct assignment, same union type) |
| **Current storage** | `Delegation.executionMode: "sdk" | "pty" | "headless"` — required field |
| **VERIFIED** | [VERIFIED: codebase inspection] — Same union at `coordination/delegation/types.ts:48` |

#### Field 6: `compactionCheckpoint` (MEDIUM — low priority)
| Property | Value |
|----------|-------|
| **Target interface** | `ChildSessionRecord` |
| **Type signature** | `compactionCheckpoint?: CompactionCheckpointData` |
| **Optional?** | YES |
| **Import source** | `import type { CompactionCheckpointData } from "../../shared/types.js"` |
| **Which writer populates it** | `lifecycle/index.ts:217` — via `patchSessionContinuity()` with `compactionCheckpoint` |
| **Which reader consumes it** | `continuity/index.ts` — deep-cloned by `cloneCompactionCheckpoint`, read by `getSessionContinuity()` |
| **Current storage** | In-memory continuity store only. "Never populated on disk" per SPEC (A11 confirmed) |
| **VERIFIED** | [VERIFIED: codebase inspection] — `CompactionCheckpointData` at `src/shared/types.ts:102` |

#### Field 7: `lifecycle` (MEDIUM — low priority)
| Property | Value |
|----------|-------|
| **Target interface** | `ChildSessionRecord` |
| **Type signature** | `lifecycle?: SessionLifecycleState` |
| **Optional?** | YES |
| **Import source** | `import type { SessionLifecycleState } from "../../shared/types.js"` |
| **Which writer populates it** | `lifecycle/index.ts:123` — via `patchSessionContinuity()` with lifecycle transitions |
| **Which reader consumes it** | `continuity/index.ts` — deep-cloned by `cloneLifecycleState`, read by `getSessionContinuity()` |
| **Current storage** | In-memory continuity store only. "Never populated on disk" per SPEC (A11 confirmed) |
| **VERIFIED** | [VERIFIED: codebase inspection] — `SessionLifecycleState` at `src/shared/types.ts:265` |

#### Field 8: `governance` (cross-cutting — separate file action)
| Property | Value |
|----------|-------|
| **Action** | Create standalone `.hivemind/state/governance-state.json` |
| **NOT added to `ChildSessionRecord`** | Governance is cross-cutting, not per-session. Confirmed by P41-A U1 decision. |
| **Current storage** | `ContinuityStoreFile.governance: GovernancePersistenceState` — inside `session-continuity.json` |
| **New writer** | `writeGovernanceState()` in `src/features/governance/persistence.ts` |
| **Old writer deprecation** | `recordGovernancePersistenceState()` → deprecated no-op with warning |
| **Path** | `<projectRoot>/.hivemind/state/governance-state.json` via `getCanonicalStateDir()` |
| **VERIFIED** | [VERIFIED: codebase inspection] — `GovernancePersistenceState` at `src/shared/types.ts:347`. Path is fresh per A13 (grep: zero references to `governance-state.json`). |

---

## Writer Redirect Plan

### Writer 1: `persistDelegations()` → `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()`

**Current call chain:**
```
DelegationStateMachine.persistAll() (state-machine.ts:214)
  → persistDelegations() (delegation-persistence.ts:58)
    → getDelegationsFilePath() → delegations.json
    → writeFileSync + renameSync (sync, atomic write)
```

**New call chain:**
```
DelegationStateMachine.persistAll() (state-machine.ts:214)
  → persistDelegations() (delegation-persistence.ts:58)
    → OLD PATH: write to delegations.json (sync — unchanged)
    → NEW PATH: fire-and-forget:
      → resolveWriteParent(childSessionId, parentSessionId)
      → childWriter.createChildFile(writeParent, childSessionID, childRecord) (async)
      → manifestWriter.addChild({ rootMainSessionID, childSessionID, ... }) (async)
```

**Sync vs Async Consideration:**
- `persistDelegations()` is **synchronous** (uses `writeFileSync`, `renameSync`)
- `ChildWriter.createChildFile()` is **async** (returns `Promise<void>`, uses `fs/promises`)
- **Resolution:** Fire-and-forget pattern `void childWriter.createChildFile(...)` — the old sync path continues to work. If the async write doesn't complete before process exit, no data is lost because the old path already wrote to `delegations.json`.
- **Edge case:** On `SIGTERM`/`SIGINT`, registered shutdown handlers (`flushAllStores`) do NOT flush session-tracker writes — they only flush continuity stores. The child-writer pending writes could be lost. Acceptable because old path still has the data.

**Field Mapping on Write:**
| `Delegation` field | `ChildSessionRecord` field | Conversion |
|---|---|---|
| `id` | `sessionID` | direct |
| `parentSessionId` | `parentSessionID` | direct |
| (derived) | `delegationDepth` | default `1` |
| `agent` | `delegatedBy.agentName` | direct |
| (dispatch context) | `delegatedBy.model` | `""` if unavailable |
| `"task"` | `delegatedBy.tool` | always `"task"` |
| `prompt` | `delegatedBy.description` | direct |
| (dispatch context) | `delegatedBy.subagentType` | `""` if unavailable |
| `createdAt` (Unix ms) | `created` | `new Date(createdAt).toISOString()` |
| `completedAt` (Unix ms) | `updated` | `new Date(completedAt).toISOString()` or `new Date().toISOString()` |
| `status` | `status` | mapped: dispatched/running→active, completed→completed, error/timeout→error |
| `agent` | `mainAgent.name` | direct |
| (dispatch context) | `mainAgent.model` | `""` if unavailable |
| — | `turns` | `[]` |
| — | `children` | `[]` |
| `queueKey` | `queueKey` | direct |
| `terminalKind` | `terminalKind` | direct |
| `recoveryGuarantee` | `recoveryGuarantee` | direct |
| `executionMode` | `executionMode` | direct |

**`rootMainSessionID` Gap for `HierarchyManifestWriter.addChild()`:**
- `HierarchyManifestWriter.addChild()` requires `rootMainSessionID`, `childSessionID`, `parentSessionID`, `delegationDepth`, `delegatedBy`, `subagentType`, `childFile`
- The `Delegation` interface does NOT carry `rootMainSessionID`
- **Resolution:** Use `HierarchyIndex.getRootMain(childSessionID)` if available, or fall back to `parentSessionId` (treating the immediate parent as the root — accurate for depth-1 delegations). If `hierarchyIndex` is not available from `persistDelegations()`, default to `parentSessionId`. This is APPROXIMATE but safe — the manifest can be regenerated from continuity in P41-C.

**Status Mapping:**
| `Delegation.status` | `ChildSessionRecord.status` |
|---|---|
| `"dispatched"` | `"active"` |
| `"running"` | `"active"` |
| `"completed"` | `"completed"` |
| `"error"` | `"error"` |
| `"timeout"` | `"error"` |

---

### Writer 2: `recordSessionContinuity()` → `ChildWriter` (via field mapping)

**Current call chain:**
```
recordSessionContinuity() (continuity/index.ts:367)
  → ensureStoreLoaded() → in-memory continuity store
  → persistStore() → session-continuity.json (sync)
```

**New call chain:**
```
recordSessionContinuity() (continuity/index.ts:367)
  → OLD PATH: persistStore() → session-continuity.json (unchanged)
  → NEW PATH: if sessionID starts with "ses_":
    → childWriter.createChildFile(parentSessionID, sessionID, childRecord) (async fire-and-forget)
      where childRecord contains:
        lifecycle ← record.metadata.lifecycle
        pendingNotifications ← record.metadata.pendingNotifications
        compactionCheckpoint ← record.metadata.compactionCheckpoint
        updated ← new Date().toISOString()
```

**Sync vs Async:**
- `recordSessionContinuity()` is synchonrous (sync fs via `persistStore()`)
- Same fire-and-forget pattern as Writer 1
- Graceful skip if sessionID doesn't start with `"ses_"` (A6: only test data has non-`ses_` IDs)

---

### Writer 3: `patchSessionContinuity()` → `ChildWriter` (via field updates)

**Current call chain:**
```
patchSessionContinuity(sessionID, patch) (continuity/index.ts:381)
  → ensureStoreLoaded() → in-memory continuity store
  → merge patch into continuity record
  → persistStore() → session-continuity.json (sync)
```

**New call chain:**
```
patchSessionContinuity(sessionID, patch) (continuity/index.ts:381)
  → OLD PATH: persistStore() → session-continuity.json (unchanged)
  → NEW PATH: if sessionID starts with "ses_":
    → Resolve writeParent via hierarchyIndex
    → Check childFileExists(writeParent, sessionID)
    → If exists: update relevant fields via ChildWriter methods:
      → patch.lifecycle → enqueueWrite to update lifecycle field
      → patch.pendingNotifications → enqueueWrite to update pendingNotifications
      → patch.compactionCheckpoint → enqueueWrite to update compactionCheckpoint
```

**Dual-write data field mapping for patch:**
| `patch` field | `ChildSessionRecord` field | Notes |
|---|---|---|
| `lifecycle` | `lifecycle` | Write via `mergeChildRecord({ lifecycle: patch.lifecycle })` |
| `pendingNotifications` | `pendingNotifications` | Write via `mergeChildRecord({ pendingNotifications: patch.pendingNotifications })` |
| `compactionCheckpoint` | `compactionCheckpoint` | Write via `mergeChildRecord({ compactionCheckpoint: patch.compactionCheckpoint })` |

**Callers that transitively benefit from this redirect:**
| Caller | Location | What it patches |
|---|---|---|
| `lifecycle/index.ts:123` | lifecycle phase transitions | `lifecycle` field |
| `lifecycle/index.ts:187` | session created event | `pendingNotifications: []` |
| `lifecycle/index.ts:202` | pending notification queue | `pendingNotifications` |
| `lifecycle/index.ts:217` | compaction checkpoint | `compactionCheckpoint` |
| `notification-handler.ts:223` | queue pending notification | `pendingNotifications` |
| `plugin.ts:234` | persist pending delegation notifications | `pendingNotifications` |
| `plugin.ts:645` | replay pending → clear after drain | `pendingNotifications: []` |

---

### Writer 4: Governance Engine Evaluator → `writeGovernanceState()`

**Current call chain:**
```
evaluateGovernance() (evaluator.ts:21)
  → getGovernancePersistenceState() (continuity/index.ts:460) — reads from continuity store
  → recordGovernancePersistenceState(state) (continuity/index.ts:464)
    → store.governance = next
    → persistStore() → session-continuity.json
```

**New call chain:**
```
evaluateGovernance() (evaluator.ts:21)
  → getGovernancePersistenceState() (continuity/index.ts:460) — still works (deprecated)
  → writeGovernanceState(state) (NEW: features/governance/persistence.ts)
    → atomic write to .hivemind/state/governance-state.json
  → OLD PATH FOR DUAL-WRITE: recordGovernancePersistenceState() (now NO-OP with warning)
```

**New governance persistence module shape:**
```typescript
// src/features/governance/persistence.ts
import { getCanonicalStateDir } from "../../task-management/continuity/index.js"

export function getGovernanceStatePath(projectRoot?: string): string
export function readGovernanceState(projectRoot?: string): GovernancePersistenceState
export function writeGovernanceState(state: GovernancePersistenceState, projectRoot?: string): void
export function emptyGovernanceState(): GovernancePersistenceState
```

**Note on import dependency from `continuity/index.ts`:**
- The governance persistence module imports `getCanonicalStateDir` from `continuity/index.ts`
- This is the same dependency direction as the existing `getGovernancePersistenceState()` which already lives in `continuity/index.ts`
- The evaluator (`evaluator.ts:97-99`) currently imports `recordGovernancePersistenceState` and `getGovernancePersistenceState` from `continuity/index.ts`
- After the redirect, evaluator imports the new `writeGovernanceState` from `features/governance/persistence.ts`
- The old `recordGovernancePersistenceState` call is REMOVED from evaluator (not dual-written — governance is new canonical file only, old continuity path deprecates)

---

## Dual-Write Strategy Summary

| Writer | Old Path (retained) | New Path (added) | Fire-and-Forget? |
|--------|-------------------|------------------|-------------------|
| `persistDelegations()` | `delegations.json` via sync `writeFileSync+renameSync` | `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()` | YES — `void childWriter.createChildFile(...)` |
| `recordSessionContinuity()` | `session-continuity.json` via `persistStore()` | `ChildWriter` lifecycle/pendingNotifications/compactionCheckpoint fields | YES — `void childWriter.mergeChildRecord(...)` |
| `patchSessionContinuity()` | `session-continuity.json` via `persistStore()` | `ChildWriter` lifecycle/pendingNotifications/compactionCheckpoint fields | YES — `void childWriter.mergeChildRecord(...)` |
| `recordGovernancePersistenceState()` | Deprecated NO-OP with warning | `writeGovernanceState()` to standalone file | N/A — sync write |

**Dual-write safety:** The old sync path guarantees data is written even if the process exits immediately after. The fire-and-forget async path is best-effort. No data loss scenario because the old path is never removed until P41-D.

---

## Common Pitfalls

### Pitfall 1: Sync→Async impedance in `persistDelegations()`
**What goes wrong:** The dual-write to session-tracker uses `await childWriter.createChildFile()` which requires the calling function to be async. `persistDelegations()` is synchronous.
**Why it happens:** `ChildWriter` methods use `fs/promises` for all I/O. `persistDelegations()` uses `writeFileSync`/`renameSync`.
**How to avoid:** Use fire-and-forget (`void childWriter.createChildFile(...)`) in `persistDelegations()`. The old sync path still runs and writes to `delegations.json`, so no data is ever lost.
**Warning signs:** If `persistAll()` in `state-machine.ts` becomes async, all callers (including `transition()`, `transitionToTerminal()`, `scheduleGracePeriodCleanup()`) must also change. Do NOT take this path.

### Pitfall 2: `rootMainSessionID` unavailable for `HierarchyManifestWriter.addChild()`
**What goes wrong:** The `addChild()` method requires `rootMainSessionID` but `Delegation` records don't carry this field.
**Why it happens:** `rootMainSessionID` is resolved by `HierarchyIndex.getRootMain(childSessionID)` which `persistDelegations()` doesn't have access to.
**How to avoid:** Fall back to `parentSessionId` as the rootMainSessionID (correct for depth-1). Or construct a `HierarchyIndex` instance from within `delegation-persistence.ts` if one isn't injected.
**Warning signs:** `HierarchyManifestWriter.addChild()` silently creates a manifest with wrong root if rootMainSessionID is incorrect. The manifest can be regenerated from continuity tree later (P41-C).

### Pitfall 3: `ChildSessionRecord` exists check in `patchSessionContinuity()` 
**What goes wrong:** `patchSessionContinuity()` is called before a child file was created (race condition during early lifecycle transitions).
**Why it happens:** The lifecycle in `lifecycle/index.ts` calls `patchSessionContinuity()` during `session.created` events. The child file may not exist yet if the delegation hasn't been persisted.
**How to avoid:** Use `childFileExists(parentSessionID, childSessionID)` before writing. Skip with warning log if the file doesn't exist.
**Warning signs:** Missing child files are benign — the lifecycle data flows through the old continuity store path. No data loss.

### Pitfall 4: Test assertions fail due to extra optional fields (A23)
**What goes wrong:** Tests using `toStrictEqual` on `ChildSessionRecord` objects fail because the runtime object has 7 extra optional fields (all `undefined`) that the test's expected object doesn't have.
**Why it happens:** `toStrictEqual` in Jest/Vitest checks all enumerable own properties. `undefined` values from optional fields are enumerable after `JSON.parse(JSON.stringify(obj))`.
**How to avoid:** Run `npm run test` as the phase gate. If failures occur, replace `toStrictEqual` with `toEqual` or `toMatchObject` on affected tests.
**Warning signs:** Tests passing during development but failing in CI due to different vitest configurations.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic file writes | Custom temp→rename logic | `atomicWriteJson` from `session-tracker/persistence/atomic-write.js` | Already battle-tested, handles cross-volume detection (G-5) and temp cleanup (F-01) |
| Session ID path safety | Manual path sanitization | `safeSessionPath` from `session-tracker/persistence/atomic-write.js` | Prevents path traversal, directory escape |
| Concurrent write safety | Manual mutex/lock | `ChildWriter.enqueueWrite()` per-child serial queue | Already tested, handles stale queue detection |
| Governance state I/O | Custom file I/O loop | New `features/governance/persistence.ts` module | Follows same atomic write pattern as existing continuity store |

---

## Package Legitimacy Audit

**No external packages.** All types, functions, and utilities already exist in the project codebase. No packages were considered for addition. The phase strictly modifies existing source files and creates one new file.

---

## Code Examples

### Pattern: Adding optional fields to `ChildSessionRecord`
```typescript
// In src/features/session-tracker/types.ts
import type {
  CompactionCheckpointData,
  PendingNotification,
  SessionLifecycleState,
} from "../../shared/types.js"
import type {
  DelegationRecoveryGuarantee,
  DelegationTerminalKind,
} from "../../coordination/delegation/types.js"

export interface ChildSessionRecord {
  // ... existing fields unchanged ...

  /** Pending notifications for this session (from continuity store). */
  pendingNotifications?: PendingNotification[]
  /** Queue key for slot-managed delegation (from delegation record). */
  queueKey?: string
  /** How the delegation terminated (from delegation record). */
  terminalKind?: DelegationTerminalKind
  /** Recovery guarantee level (from delegation record). */
  recoveryGuarantee?: DelegationRecoveryGuarantee
  /** How the child session was dispatched. */
  executionMode?: "sdk" | "pty" | "headless"
  /** Compaction checkpoint data (from continuity store). */
  compactionCheckpoint?: CompactionCheckpointData
  /** Session lifecycle state (from continuity store). */
  lifecycle?: SessionLifecycleState
}
```
Source: [VERIFIED: codebase inspection — types.ts:211-236]

### Pattern: Fire-and-forget dual-write in `persistDelegations()`
```typescript
// In delegation-persistence.ts (conceptual)
export function persistDelegations(delegations: Delegation[]): void {
  // --- OLD PATH: always runs, sync, guaranteed ---
  const filePath = getDelegationsFilePath()
  // ... existing read-merge-write logic unchanged ...
  
  // --- NEW PATH: fire-and-forget, best-effort ---
  for (const d of delegations) {
    if (!d.childSessionId || !d.parentSessionId) {
      console.warn(`[Harness] persistDelegations: skipping delegation ${d.id} — missing session IDs`)
      continue
    }
    
    const childRecord = buildChildRecordFromDelegation(d) // mapping helper
    void childWriter.createChildFile(
      d.parentSessionId,
      d.childSessionId,
      childRecord,
    )
    
    // Also update hierarchy manifest (if rootMainSessionID available)
    if (hierarchyIndex) {
      const rootMain = hierarchyIndex.getRootMain(d.childSessionId) ?? d.parentSessionId
      void manifestWriter.addChild({
        rootMainSessionID: rootMain,
        childSessionID: d.childSessionId,
        parentSessionID: d.parentSessionId,
        delegationDepth: d.nestingDepth ?? 1,
        delegatedBy: d.agent,
        subagentType: "",
        childFile: `${d.childSessionId}.json`,
      })
    }
  }
}
```

### Pattern: Governance state persistence module
```typescript
// In src/features/governance/persistence.ts (NEW)
import { readFileSync, renameSync, writeFileSync } from "node:fs"
import { existsSync, mkdirSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { resolve } from "node:path"
import { getCanonicalStateDir } from "../../task-management/continuity/index.js"
import type { GovernancePersistenceState } from "../../shared/types.js"

export function getGovernanceStatePath(projectRoot?: string): string {
  const stateDir = getCanonicalStateDir(projectRoot)
  return resolve(stateDir, "governance-state.json")
}

export function emptyGovernanceState(): GovernancePersistenceState {
  return { rules: [], violations: [], updatedAt: Date.now() }
}

export function readGovernanceState(projectRoot?: string): GovernancePersistenceState {
  const filePath = getGovernanceStatePath(projectRoot)
  if (!existsSync(filePath)) return emptyGovernanceState()
  try {
    const raw = readFileSync(filePath, "utf-8")
    return JSON.parse(raw) as GovernancePersistenceState
  } catch {
    return emptyGovernanceState()
  }
}

export function writeGovernanceState(state: GovernancePersistenceState, projectRoot?: string): void {
  const filePath = getGovernanceStatePath(projectRoot)
  mkdirSync(resolve(filePath, ".."), { recursive: true })
  const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(tmpFile, `${JSON.stringify(state, null, 2)}\n`, "utf-8")
  renameSync(tmpFile, filePath)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Delegation.queueKey` → delegations.json only | `queueKey` → ChildSessionRecord + delegations.json | P41-B | Dual-write ensures no data loss |
| `Delegation.terminalKind` → delegations.json only | `terminalKind` → ChildSessionRecord + delegations.json | P41-B | Same dual-write |
| `Delegation.executionMode` → delegations.json only | `executionMode` → ChildSessionRecord + delegations.json | P41-B | Same dual-write |
| `Delegation.recoveryGuarantee` → delegations.json only | `recoveryGuarantee` → ChildSessionRecord + delegations.json | P41-B | Same dual-write |
| `PendingNotification[]` → session-continuity.json only | `pendingNotifications` → ChildSessionRecord + session-continuity.json | P41-B | Same dual-write |
| `SessionLifecycleState` → session-continuity.json only | `lifecycle` → ChildSessionRecord + session-continuity.json | P41-B | Same dual-write |
| `CompactionCheckpointData` → session-continuity.json only | `compactionCheckpoint` → ChildSessionRecord + session-continuity.json | P41-B | Same dual-write |
| Governance data inside `session-continuity.json` | Standalone `.hivemind/state/governance-state.json` | P41-B | Old `recordGovernancePersistenceState()` deprecated to no-op |

---

## Risk Assessment

### BLOCKING Risks (will prevent `npm run test && npm run typecheck` from passing)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dual-write changes the sync→async signature of `persistDelegations()`, breaking 25+ call sites | LOW | HIGH | Use fire-and-forget (`void childWriter.createChildFile(...)`) — signature stays sync |
| Circular dependency from adding `coordination/delegation/types.js` import in `session-tracker/types.ts` | LOW | HIGH | Verified by grep: zero reverse imports from `coordination/` → `features/session-tracker/`. Pure type imports → no runtime cycle |
| Circular dependency from `continuity/index.ts` importing `session-tracker/persistence/child-writer.ts` | LOW | HIGH | Verified by grep: zero imports from `session-tracker/` → `task-management/continuity/`. One-way arrow: task-management → features |
| Test `toStrictEqual` assertion fails on `ChildSessionRecord` with 7 extra undefined fields | MEDIUM | MEDIUM | Run `npm run test` as gate. Replace `toStrictEqual` with `toEqual` if failures occur |
| `ChildWriter` not initialized when `persistDelegations()` runs during early startup | LOW | MEDIUM | Construct `ChildWriter` and `HierarchyManifestWriter` internally in `delegation-persistence.ts` using `projectRoot` from `getContinuityStoragePath()` |

### DEGRADED Risks (data not available in new location during transition)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `patchSessionContinuity()` tries to write lifecycle to child file that doesn't exist yet | MEDIUM | LOW | Graceful skip with warning. Data still flows through old continuity path |
| Fire-and-forget async write doesn't complete before `process.exit()` | LOW | LOW | Old sync path already wrote the data. Session-tracker file is empty/tombstoned until next write |
| `HierarchyManifestWriter.addChild()` gets wrong `rootMainSessionID` | MEDIUM | LOW | Manifest can be regenerated from continuity tree. Fallback to `parentSessionId` is safe for depth-1 |
| Governance evaluator imports new module but old test `continuity.test.ts:451` tests old function | MEDIUM | LOW | Old `recordGovernancePersistenceState()` becomes no-op. Tests that verify written data may need updating |

### SILENT Risks (field added but never populated)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `compactionCheckpoint` added to ChildSessionRecord but no writer populates it during P41-B | HIGH (by design) | LOW | Populated in lifecycle/index.ts:217 which is redirected via `patchSessionContinuity()` dual-write — actually populated |
| `lifecycle` added to ChildSessionRecord but only populated for sessions with lifecycle events | MEDIUM (expected) | LOW | Lifecycle transitions are normal. Sessions without lifecycle events simply have `undefined` |
| `queueKey` is `""` for old delegations without queue context | LOW | LOW | Empty string is valid. P41-C readers can check for falsy values |

---

## Validation Architecture

> nyquist_validation is enabled in `.planning/config.json:13`

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project standard) |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run --reporter=verbose -t "delegation-persistence\|continuity\|governance\|session-tracker"` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|------------------|
| REQ-P41B-01/02 | New fields compile without errors | typecheck | `npm run typecheck` |
| REQ-P41B-03 | Governance state file written/read correctly | unit | `npx vitest run tests/lib/continuity.test.ts` (governance tests) |
| REQ-P41B-04 | persistDelegations dual-writes to session-tracker | unit | `npx vitest run -t "persistDelegations"` |
| REQ-P41B-05 | continuity redirect writes to child files | unit | `npx vitest run -t "recordSessionContinuity\|patchSessionContinuity"` |
| REQ-P41B-06 | Full gate | unit+typecheck | `npm run typecheck && npm run test` |
| REQ-P41B-07 | All writer smoke tests | integration | `npm run test` |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose -t "delegation\|continuity\|governance\|session-tracker"` (relevant test subset)
- **Per wave merge:** `npm run test`
- **Phase gate:** `npm run typecheck && npm run test` — both must pass green

### Wave 0 Gaps
- [ ] New tests for governance persistence module (`src/features/governance/persistence.ts`) — RECOMMENDED but not required per SPEC
- [ ] New tests for dual-write redirect behavior in `delegation-persistence.ts` — RECOMMENDED but not required per SPEC
- [ ] New tests for `ChildSessionRecord` with 7 new fields — RECOMMENDED but not required per SPEC

---

## Security Domain

**Applicable ASVS categories:** None directly. This phase adds schema fields and redirects writers but does not introduce new authentication, session management, access control, or input validation surfaces.

**Threat consideration:** Dual-write to session-tracker files uses the existing `atomicWriteJson()` pattern (write temp → rename) — no new attack surface. The governance state file is local filesystem-only (no network exposure).

**Known threat patterns:**
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal in session ID | Tampering | `safeSessionPath()` already prevents directory escape |
| Temp file hijacking | Tampering | `atomicWriteJson()` uses `randomUUID()` in temp names — collision probability negligible |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All I/O | ✓ | >=20.0.0 | — |
| TypeScript | Type definitions | ✓ | Project dep | — |
| Vitest | Test suite | ✓ | Project devDep | — |

**Missing dependencies with no fallback:** None. All tools are already present in the project.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Adding optional fields to `ChildSessionRecord` will not break any existing construction site | Schema Analysis | LOW — typecheck fails immediately, trivial fix |
| A2 | The `PendingNotification` type import path resolves correctly | Schema Analysis | LOW — typecheck catches import errors |
| A3 | No circular dependency from delegation type imports | Schema Analysis | LOW — pure type imports, runtime-safe even if cycle exists |
| A4 | `persistDelegations()` can call `ChildWriter.createChildFile()` without architectural violation | Writer Redirect | **HIGH** — sync→async fire-and-forget required; acceptable because old path still runs |
| A5 | Status mapping covers all delegation values | Writer Redirect | LOW — `ChildSessionRecord.status` is `string`, accepts any value |
| A6 | `childSessionId` and `parentSessionId` are always populated by persist time | Writer Redirect | LOW — SPEC mandates graceful skip with warning |
| A7 | `ChildWriter` constructable from `delegation-persistence.ts` | Writer Redirect | MEDIUM — can construct internally from `projectRoot` |
| A8 | `executionMode` maps directly without transformation | Schema Analysis | HIGH — same union type |
| A9 | Date conversion (Unix ms → ISO 8601) is correct | Writer Redirect | HIGH — standard `new Date(n).toISOString()` |
| A10 | `recordSessionContinuity()`/`patchSessionContinuity()` can access `ChildWriter` | Writer Redirect | MEDIUM — import direction is one-way (task-management → features) |
| A11 | `compactionCheckpoint`/`lifecycle` never populated on disk | Schema Analysis | HIGH — confirmed by P41-A investigation |
| A12 | Field mapping sufficient for P41-C readers | Writer Redirect | MEDIUM — unmapped fields still in old path if needed |
| A13 | `governance-state.json` path is fresh | Writer Redirect | HIGH — zero existing references confirmed by grep |
| A14 | Governance evaluator redirect works | Writer Redirect | HIGH — single function call change |
| A15 | Tests pass with additive dual-write | Testing | MEDIUM — depends on `projectRoot` being correctly threaded |
| A16 | `rootMainSessionID` resolvable for `HierarchyManifestWriter.addChild()` | Writer Redirect | **MEDIUM** — fallback to `parentSessionId` for depth-1 |
| A17 | JSON serialization safe for all 7 new fields | Schema Analysis | HIGH — all plain serializable types |
| A18 | Governance data coexistence safe | Writer Redirect | HIGH — old continuity `governance` field becomes stale but functional |
| A19 | Empty string fallbacks for `model`/`subagentType` | Writer Redirect | HIGH — valid for required `string` fields |
| A20 | No circular dep from continuity → session-tracker | Writer Redirect | **MEDIUM** — confirmed safe by grep, but must not add reverse import |
| A21 | `queueKey` always available | Writer Redirect | HIGH — always populated; empty string valid |
| A22 | Serial write queues prevent concurrent-write corruption | Writer Redirect | HIGH — `ChildWriter.enqueueWrite()` already designed for this |
| A23 | No test asserts exact field count on `ChildSessionRecord` | Testing | **MEDIUM** — run full test suite as gate |

### Highest-Risk Assumptions
- **A4 (sync→async impedance):** Fire-and-forget is acceptable but must be clearly documented. Old sync path guarantees no data loss.
- **A16 (rootMainSessionID resolution):** The most likely failure mode. `HierarchyManifestWriter.addChild()` silently writes wrong root. The manifest is a derivative cache (regeneratable from continuity), so wrong data is recoverable.
- **A20 (circular dependency):** Currently clean. Must verify after all import changes that no cycle was accidentally introduced.
- **A23 (test field count assertion):** The most insidious — silent test failure. Run full suite as gate.

---

## Open Questions

1. **How should `persistDelegations()` obtain the `ChildWriter` instance?**
   - What we know: `delegation-persistence.ts` is a module-level function, not a class. It doesn't receive DI.
   - Options: (a) construct `ChildWriter` internally using `projectRoot` from `getContinuityStoragePath()`, (b) add `childWriter` parameter to `persistDelegations()` signature (breaking change), (c) use a module-level singleton set during initialization.
   - **Recommendation:** Option (a) — construct `{ projectRoot: dirname(dirname(getDelegationsFilePath())) }`. The session-tracker `ChildWriter` constructor is cheap. This avoids changing the function signature.

2. **How should `persistDelegations()` obtain the `HierarchyManifestWriter` instance?**
   - What we know: Same as above — module-level function, no DI.
   - **Recommendation:** Same approach — construct `{ projectRoot }` internally. Or construct both `ChildWriter` and `HierarchyManifestWriter` together from the same `projectRoot`.

3. **How should `continuity/index.ts` obtain the `ChildWriter` instance?**
   - What we know: `continuity/index.ts` is also a module-level function set, not a class.
   - **Recommendation:** Same internal construction pattern. Construct `ChildWriter` with `{ projectRoot: getCanonicalStateDir().parent.parent }` or re-derive from `process.cwd()`. This avoids changing all 39+ function call sites.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: codebase inspection] — `src/features/session-tracker/types.ts:211-236` — Current `ChildSessionRecord` interface with 2 optional fields
- [VERIFIED: codebase inspection] — `src/features/session-tracker/persistence/child-writer.ts:408-433` — `createChildFile()` method signature (async, uses `enqueueWrite`)
- [VERIFIED: codebase inspection] — `src/task-management/continuity/delegation-persistence.ts:58-134` — `persistDelegations()` (sync, uses `writeFileSync`+`renameSync`)
- [VERIFIED: codebase inspection] — `src/task-management/continuity/index.ts:367-422` — `recordSessionContinuity()` and `patchSessionContinuity()` (sync, uses `persistStore`)
- [VERIFIED: codebase inspection] — `src/coordination/delegation/state-machine.ts:214-219` — `persistAll()` calls `persistDelegations()`, called from `transition()` and `transitionToTerminal()`
- [VERIFIED: codebase inspection] — `src/features/governance-engine/evaluator.ts:95-103` — Governance evaluator calls `recordGovernancePersistenceState()`
- [VERIFIED: codebase inspection] — `src/features/session-tracker/persistence/hierarchy-manifest.ts:62-94` — `HierarchyManifestWriter.addChild()` requires `rootMainSessionID`
- [VERIFIED: codebase inspection] — `src/features/session-tracker/initialization.ts:96-270` — `constructDependencies()` builds `ChildWriter` and `HierarchyManifestWriter`
- [VERIFIED: codebase inspection] — `src/coordination/delegation/types.ts:10-20` — `DelegationRecoveryGuarantee` and `DelegationTerminalKind` types
- [VERIFIED: codebase inspection] — `src/shared/types.ts:31,102,265,347` — `PendingNotification`, `CompactionCheckpointData`, `SessionLifecycleState`, `GovernancePersistenceState`
- [VERIFIED: P41-A-SUMMARY.md] — Zero production data confirmed, gap fields identified, actor map for 5+ writer redirect targets

### Secondary (MEDIUM confidence)
- [VERIFIED: P41-B-SPEC.md] — Full spec with requirements, field mapping table, status mapping, boundary definitions
- [VERIFIED: P41-B-ASSUMPTIONS.md] — 23 assumptions with evidence and confidence levels

---

## Metadata

**Confidence breakdown:**
- Schema change analysis: HIGH — all types verified against codebase
- Writer redirect plan: HIGH — all call chains verified against codebase
- Risk assessment: MEDIUM — some edge cases (test assertion patterns, `rootMainSessionID` resolution) need runtime verification

**Research date:** 2026-05-31
**Valid until:** 2026-07-01 (stable codebase, no fast-moving dependencies)
