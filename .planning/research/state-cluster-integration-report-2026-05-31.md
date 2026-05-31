# State File Cluster Integration Report

**Researched:** 2026-05-31  
**Domain:** State file cluster — 5 loosely integrated JSON files + 1 detached session-tracker store  
**Confidence:** HIGH (all claims verified against source code)

---

## Summary

The project has **5 state files** under `.hivemind/state/` and **1 separate state file** under `.hivemind/session-tracker/` (`project-continuity.json`). Although all 5 share the same state directory, they were built in different phases with inconsistent patterns for:

1. **Path resolution** — 3 different resolution strategies for the same directory
2. **Atomic writes** — 3 different patterns including one that skips atomicity entirely
3. **Corruption handling** — throws in 3 files, silently returns defaults in 3
4. **flushAllStores() coverage** — only 1 of 5 state files has shutdown persistence
5. **Boot initialization** — no single init path, order is implicit and undocumented
6. **Write locking** — only 1 file has serialized concurrent write protection

**Primary recommendation:** Consolidate to a single `StateStoreManager` authority with unified path resolution, atomic write primitive, corruption handling, and `flushAll()` registration.

---

## Per-File Analysis

### File 1: `session-continuity.json` (`.hivemind/state/session-continuity.json`)

| Property | Value |
|----------|-------|
| **Module** | `src/task-management/continuity/index.ts` |
| **Format** | `{ version, updatedAt, sessions: Record<string, SessionContinuityRecord>, governance: GovernancePersistenceState }` |
| **Writes** | `recordSessionContinuity()`, `patchSessionContinuity()`, `deleteSessionContinuity()`, `recordGovernancePersistenceState()` — all sync |
| **Reads** | `listSessionContinuity()`, `getSessionContinuity()` — uses in-memory cache |
| **Cache** | `store-cache.ts` → `Map<string, ContinuityStoreFile>` (by file path) |
| **Path resolution** | `getCanonicalStateDir()` → `resolve(root, ".hivemind", "state")` + env var overrides (`OPENCODE_HARNESS_CONTINUITY_FILE`, `OPENCODE_HARNESS_STATE_DIR`) |
| **Atomic writes** | ✅ `tmp + renameSync` with `randomUUID()` per write. Redacts sensitive fields before writing |
| **Corruption handling** | ✅ `quarantineCorruptFile()` — renames corrupt file to `file.corrupt-{ts}-{pid}-{uuid}`, then throws |
| **flushAllStores()** | ✅ Writes ALL cached stores on process exit/SIGINT/SIGTERM via `registerShutdownHandlers()` |
| **Locking** | None — but in-memory cache means most reads are cache hits. Single-threaded sync I/O |

**Lifecycle entry points in `plugin.ts`:**
1. `createHarnessLifecycleManager()` → `hydrateFromContinuity()` → reads all records to hydrate delegation state
2. `replayPendingDelegationNotifications()` → reads all records to drain pending notification queues
3. `HarnessLifecycleManager.handleEvent()` → patches session status/notifications on lifecycle events
4. Tool calls → `getSessionContinuity()`, `patchSessionContinuity()`, `recordSessionContinuity()`

**Shutdown:**
- `flushAllStores()` registered at module load via `registerShutdownHandlers()` (top-level side effect!)
- Dumps all in-memory caches to disk

---

### File 2: `delegations.json` (`.hivemind/state/delegations.json`)

| Property | Value |
|----------|-------|
| **Module** | `src/task-management/continuity/delegation-persistence.ts` |
| **Format** | `Delegation[]` — flat array |
| **Writes** | `persistDelegations()` — read-merge-write pattern. Called from `state-machine.ts` `persistAll()` and `retry-handler.ts` |
| **Reads** | `readPersistedDelegations()` — normalizes invalid entries to `null` silently |
| **Cache** | None — always reads from disk on each persist call |
| **Path resolution** | `getDelegationStoreDirectory()` → `dirname(getContinuityStoragePath())` — delegates to continuity module |
| **Atomic writes** | ✅ `tmp + renameSync` with `randomUUID()` per write. Redacts sensitive fields |
| **Corruption handling** | ✅ Same quarantine pattern as continuity. Throws after quarantine |
| **flushAllStores()** | ❌ NOT covered |
| **Locking** | None — read-merge-write has TOCTOU race if two processes write simultaneously |

**Lifecycle entry points:**
1. `DelegationStateMachine.persistAll()` — called on every delegation status transition (including `transition()` and `transitionToTerminal()`)
2. `DelegationManager.recoverPending()` — reads persisted delegations at plugin startup
3. `manager-runtime.ts` constructor — reads persisted delegations for recovery

**Critical finding:** Read-merge-write pattern means every persist call re-reads the entire file from disk, merges in-memory state, then writes back. This is expensive for large delegation sets, and the merge logic has v1/v2 caller detection logic that can lose terminal delegations from the "other" subsystem.

---

### File 3: `trajectory-ledger.json` (`.hivemind/state/trajectory-ledger.json`)

| Property | Value |
|----------|-------|
| **Module** | `src/task-management/trajectory/ledger.ts` + `store-operations.ts` |
| **Format** | `{ version, updatedAt, trajectories: Record<string, TrajectoryRecord> }` |
| **Writes** | `writeTrajectoryLedger()`, `createPhaseTrajectory()`, `transitionTrajectory()`, `addTrajectoryEvent()`, etc. |
| **Reads** | `readTrajectoryLedger()` |
| **Cache** | None — always reads from disk |
| **Path resolution** | **HARDCODED** `resolve(projectRoot, ".hivemind", "state")` — does NOT use `getCanonicalStateDir()` or continuity module. Uses `assertPathWithinRoot()` for security |
| **Atomic writes** | ❌ **Direct `writeFileSync()` — NO tmp+rename** ⚠️ Crash during write corrupts the file |
| **Corruption handling** | ✅ `quarantineCorruptLedger()` — same pattern, throws after quarantine |
| **flushAllStores()** | ❌ NOT covered |
| **Locking** | None |

**Lifecycle entry points:**
1. Tools: `hivemind-trajectory` tool (all operations)
2. Cross-file: `agent-work-contracts/operations.ts` → `attachTrajectoryEvidence()` when creating agent work contracts
3. Pressure module: `hivemind-pressure` → `attach_event` action

**Security finding:** Uses `assertPathWithinRoot()` which is good, but constructs the state dir path independently instead of calling `getCanonicalStateDir()`. If the canonical state dir changes, trajectory-ledger will break silently.

---

### File 4: `agent-work-contracts.json` (`.hivemind/state/agent-work-contracts.json`)

| Property | Value |
|----------|-------|
| **Module** | `src/features/agent-work-contracts/store.ts` |
| **Format** | `{ version, updatedAt, contracts: Record<string, AgentWorkContract> }` |
| **Writes** | `persistAgentWorkContracts()`, `upsertAgentWorkContract()` |
| **Reads** | `readAgentWorkContracts()`, `getAgentWorkContract()`, `getActiveContractByAgent()` |
| **Cache** | None |
| **Path resolution** | **HARDCODED** `resolve(projectRoot, ".hivemind", "state")` — duplicates logic |
| **Atomic writes** | ✅ `tmp + renameSync` with `randomUUID()`. Unique per write |
| **Corruption handling** | ✅ `quarantineCorruptStore()` — renames corrupt file. **Returns empty store silently** |
| **flushAllStores()** | ❌ NOT covered |
| **Locking** | None |

**Lifecycle entry points:**
1. Tools: `hivemind-agent-work-create`, `hivemind-agent-work-export`
2. `plugin.ts` → `getActiveContractByAgent()` during `tool.execute.before` guard (contract enforcement)
3. `operations.ts` → writes trajectory-ledger evidence refs as side effect of creation

**Cross-file coupling:** Creating a contract writes to TWO state files (agent-work-contracts.json + trajectory-ledger.json). If the trajectory write fails, the contract already exists but has no evidence ref.

---

### File 5: `config-workflows.json` (`.hivemind/state/config-workflows.json`)

| Property | Value |
|----------|-------|
| **Module** | `src/config/workflow/workflow-persistence.ts` |
| **Format** | `{ version, updatedAt, workflows: Record<string, ConfigWorkflowState> }` |
| **Writes** | `persistWorkflows()`, `persistWorkflow()`, `deleteWorkflow()` |
| **Reads** | `readPersistedWorkflows()`, `readWorkflow()` |
| **Cache** | None |
| **Path resolution** | `join(dirname(getContinuityStoragePath()), "config-workflows.json")` — delegates to continuity. **CORRECT** |
| **Atomic writes** | ⚠️ `tmp + renameSync` but **not unique**: uses `filePath + ".tmp"` (no UUID). Concurrent writes can collide |
| **Corruption handling** | ❌ Silent: empty catch block returns empty map. No quarantine |
| **flushAllStores()** | ❌ NOT covered |
| **Locking** | None |

**Lifecycle entry points:**
1. `configure-primitive` tool with workflow turn params → `tool.execute.after` hook → `createToolAfterWorkflow()`

---

### File 6: `project-continuity.json` (`.hivemind/session-tracker/project-continuity.json`)

| Property | Value |
|----------|-------|
| **Module** | `src/features/session-tracker/persistence/project-index-writer.ts` |
| **Location** | `.hivemind/session-tracker/` — **NOT under `.hivemind/state/`** |
| **Format** | `{ version: "2.0", projectRoot, lastUpdated, sessions: Record<string, ProjectSessionEntry>, chronologicalOrder: string[] }` |
| **Writes** | `addSession()`, `updateSession()`, `incrementChildCount()`, `removeSession()`, `initializeIndex()` |
| **Reads** | `readIndex()` internal, plus tools via `sessionTrackerRoot()` |
| **Cache** | None |
| **Path resolution** | `resolve(sessionTrackerRoot(projectRoot), "project-continuity.json")` = `.hivemind/session-tracker/project-continuity.json` |
| **Atomic writes** | ✅ `atomicWriteJson()` — async tmp+rename with `Date.now()` |
| **Corruption handling** | ❌ Silent: returns default on parse failure |
| **flushAllStores()** | ❌ Not applicable (different root directory, async writes) |
| **Locking** | ✅ **Serial promise queue** per-write — only state file with write serialization |

**Why this is in a different directory:**
Session-tracker was designed as a separate sub-system for session knowledge capture. It stores per-session `.md` files, child `.json` records, and a hierarchy index — all organized by session ID under `.hivemind/session-tracker/`. The `project-continuity.json` is the project-level index of all sessions.

---

## Lifecycle Contribution Map

```
plugin.ts HarnessControlPlane()
│
├── SessionTracker.constructCoreDependencies()      [sync]  → creates 20+ internal deps
│   └── (no state files touched yet)
│
├── setupDelegationModules()                        [sync]  → creates DelegationManager
│   └── DelegationManager → RuntimeDelegationManager constructor
│       └── reads delegations.json                   [READ file: delegations.json]
│           └── readPersistedDelegations()
│
├── createHarnessLifecycleManager()                 [sync]
│   └── hydrateFromContinuity()                      [READ file: session-continuity.json]
│       └── listSessionContinuity()
│
├── lifecycleManager.hydrateFromContinuity()        [same as above]
│
├── replayPendingDelegationNotifications()           [READ file: session-continuity.json]
│   └── listSessionContinuity()
│
├── delegationManager.setCompletionDetector()       [no I/O]
│
├── sessionTracker.initialize()                     [async, fire-and-forget]
│   ├── hierarchyIndex.buildFromDisk()               [READ dir: .hivemind/session-tracker/*/session-continuity.json]
│   ├── projectIndexWriter.initializeIndex()         [WRITE file: project-continuity.json]
│   ├── recovery.initialize()                        [READ file: project-continuity.json]
│   └── projectContinuityChecker.ensureCompleteness() [READ dir: .hivemind/session-tracker/*/]
│
├── registerShutdownHandlers()                      [side effect at MODULE LOAD TIME]
│   └── process.on("exit") → flushAllStores()        [WRITE file: session-continuity.json]
│
└── runtime
    ├── tool.execute.before → getActiveContractByAgent()  [READ file: agent-work-contracts.json]
    ├── tool.execute.after → createToolAfterWorkflow()    [WRITE file: config-workflows.json]
    ├── session.created/updated/idle/deleted events
    │   └── HarnessLifecycleManager.handleEvent()         [WRITE file: session-continuity.json]
    │   └── SessionTracker.handleSessionEvent()           [WRITE file: project-continuity.json + per-session files]
    ├── delegation transitions
    │   └── DelegationStateMachine.persistAll()            [WRITE file: delegations.json]
    ├── hivemind-agent-work-create tool
    │   └── createAgentWorkContract()                     [WRITE file: agent-work-contracts.json]
    │   └── attachTrajectoryEvidence()                    [WRITE file: trajectory-ledger.json]
    ├── hivemind-trajectory tool
    │   └── various operations                           [WRITE file: trajectory-ledger.json]
    └── configure-primitive tool
        └── createToolAfterWorkflow()                     [WRITE file: config-workflows.json]
```

---

## Conflict Matrix

| Issue | session-continuity | delegations | trajectory-ledger | agent-work-contracts | config-workflows | project-continuity |
|-------|-------------------|-------------|-------------------|---------------------|-----------------|-------------------|
| **Directory** | `.hivemind/state/` | `.hivemind/state/` | `.hivemind/state/` | `.hivemind/state/` | `.hivemind/state/` | `.hivemind/session-tracker/` |
| **Path resolution style** | `getCanonicalStateDir()` | Delegates to continuity | HARDCODED `resolve()` | HARDCODED `resolve()` | Delegates to continuity | `sessionTrackerRoot()` |
| **Respects ENV overrides?** | ✅ `OPENCODE_HARNESS_*` | ✅ (via continuity) | ❌ | ❌ | ✅ (via continuity) | ❌ |
| **Atomic write** | ✅ UUID-based tmp | ✅ UUID-based tmp | ❌ Direct writeFileSync | ✅ UUID-based tmp | ⚠️ Fixed `.tmp` name | ✅ Date-based tmp |
| **Corruption: quarantine?** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Corruption: action** | Throw after quarantine | Throw after quarantine | Throw after quarantine | Silently return empty | Silently return empty | Silently return empty |
| **Schema validation** | Manual guards | Manual normalize | Manual type check | Zod safeParse | Manual normalize | None |
| **Redaction on write** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **In-memory cache** | ✅ Map by path | ❌ | ❌ | ❌ | ❌ | ❌ |
| **flushAllStores()** | ✅ Yes | ❌ | ❌ | ❌ | ❌ | N/A (async, different dir) |
| **Write serializer** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ✅ Promise queue |
| **Shutdown hook** | ✅ process.on("exit") | ❌ | ❌ | ❌ | ❌ | ❌ (fire-and-forget init) |
| **Reads from legacy path?** | ✅ Yes | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Remediation Clusters

### Cluster A: Unified Path Resolution (HIGH priority)
**Files affected:** `trajectory-ledger.json`, `agent-work-contracts.json`
**Problem:** These two completely hardcode `.hivemind/state/` without using `getCanonicalStateDir()` or the continuity module. If the canonical state directory changes (e.g., env override), they break silently.
**Fix:** Replace `resolve(projectRoot, ".hivemind", "state")` with a call to a shared path resolution authority (either `getCanonicalStateDir()` or a new `StateStoreManager`).

### Cluster B: Atomic Write Primitive (HIGH priority)
**Files affected:** `trajectory-ledger.json` (severe), `config-workflows.json` (moderate)
**Problem:** 
- `trajectory-ledger.json` uses direct `writeFileSync()` — crash during write corrupts the entire ledger
- `config-workflows.json` uses a fixed `.tmp` filename — concurrent writes from overlapping tool calls can collide
**Fix:** 
- Trajectory: Switch to sync tmp+rename with UUID (same pattern as `delegation-persistence.ts`)
- Config workflows: Add `randomUUID()` to the tmp filename
- **Consider:** Extract atomic write into a shared utility (like `session-tracker`'s `atomicWriteJson` but sync-compatible for all 5 sync-write files)

### Cluster C: flushAllStores() Expansion (HIGH priority)
**Files affected:** `delegations.json`, `trajectory-ledger.json`, `agent-work-contracts.json`, `config-workflows.json`
**Problem:** Only `session-continuity.json` flushes to disk on shutdown. The other 4 state files lose unpersisted data on crash if they have in-memory state.
**Note:** Currently only `session-continuity.json` has an in-memory cache. The others write synchronously on every operation, so the practical risk is lower. But if any gain an in-memory layer, they become vulnerable.
**Fix:** Either (a) register all 5 for shutdown persistence or (b) document that the 4 files without caches are always disk-synchronized.

### Cluster D: Corruption Handling Consistency (MEDIUM priority)
**Files affected:** `config-workflows.json`, `project-continuity.json`, `agent-work-contracts.json` (silent return vs throw)
**Problem:** Three distinct corruption handling strategies create unpredictable behavior:
- `session-continuity`, `delegations`, `trajectory-ledger`: Quarantine + throw (crash plugin)
- `agent-work-contracts`: Quarantine + silent empty return
- `config-workflows`: Silent empty return (no quarantine at all!)
- `project-continuity`: Silent default return (no quarantine)

**Fix:** Standardize on quarantine + throw for all `.hivemind/state/` files. The session-tracker files in `.hivemind/session-tracker/` can differ because they have async I/O and per-session isolation.

### Cluster E: Boot Initialization Order (MEDIUM priority)
**Problem:** `plugin.ts` init has implicit ordering:
1. SessionTracker deps constructed (sync, no I/O)
2. Delegation modules setup → reads delegations.json
3. Lifecycle manager → reads session-continuity.json
4. SessionTracker.initialize() → writes project-continuity.json (fire-and-forget!)
5. Shutdown handlers registered at MODULE LOAD time (side effect in continuity/index.ts `if (typeof process !== "undefined" && !process.env.VITEST)`)

**Risks:**
- SessionTracker.initialize() is fire-and-forget — errors are caught but the init could complete AFTER the first session events arrive
- `registerShutdownHandlers()` is a top-level side effect — happens when the module is first imported, regardless of whether it's actually used (though guarded by `!VITEST`)
- The trajectory and agent-work-contracts stores have NO explicit initialization — they are created lazily on first write

**Fix:** Extract state file initialization into a single `initializeStateStores()` function in plugin.ts with documented ordering dependencies.

### Cluster F: Cross-File Transaction Gap (MEDIUM priority)
**Problem:** `agent-work-contracts/operations.ts::createAgentWorkContract()` writes to `agent-work-contracts.json` AND `trajectory-ledger.json` (via `attachTrajectoryEvidence()`). If the second write fails, the contract exists without an evidence ref. There is no rollback.

**Files affected:** 
- `agent-work-contracts.json` ↔ `trajectory-ledger.json`
- `persistPendingDelegationNotifications()` → `session-continuity.json` (continuity) and `delegations.json` (via `persistDelegations` in state machine)

**Fix:** Consider (a) wrapping in a try-catch with contract deletion rollback, or (b) making trajectory evidence refs soft-linked (the contract store already has `trajectoryId` — the ref is reconstructable).

### Cluster G: Session-Tracker Separation (LOW priority)
**File:** `project-continuity.json` lives in `.hivemind/session-tracker/` instead of `.hivemind/state/`.

**Design rationale:** Session-tracker stores per-session `.md` files and child `.json` records organized by session ID. The project-continuity.json is the index of all these files. Keeping it alongside the session files makes sense for this sub-system.

**Naming collision note:** There are now TWO files named `session-continuity.json`:
- `.hivemind/state/session-continuity.json` — the continuity module's session records (lifecycle)
- `.hivemind/session-tracker/{sessionID}/session-continuity.json` — the session-tracker's per-session hierarchy index

These are completely different formats and purposes, but the name collision is confusing.

---

## Boot Order Dependencies

```
Plugin init sequence (simplified, with state file reads/writes):

  1. Import continuity/index.ts              ← side effect: registerShutdownHandlers()
  2. new SessionTracker(client, projectRoot)
     └── constructCoreDependencies()         ← no I/O
  3. DelegationManager constructor           ← READ delegations.json
     └── readPersistedDelegations()
  4. createHarnessLifecycleManager()
     └── hydrateFromContinuity()              ← READ session-continuity.json
  5. lifecycleManager.hydrateFromContinuity()
     └── same as step 4
  6. replayPendingDelegationNotifications()   ← READ session-continuity.json (again)
  7. sessionTracker.initialize()              ← ASYNC, FIRE-AND-FORGET
     ├── hierarchyIndex.buildFromDisk()       ← READ .hivemind/session-tracker/
     ├── projectIndexWriter.initializeIndex() ← WRITE project-continuity.json
     ├── recovery.initialize()                ← READ project-continuity.json
     └── ProjectContinuityChecker.ensureCompleteness() ← READ/WRITE project-continuity.json
  8. Plugin hooks fire on runtime events      ← READ/WRITE all state files

State files created lazily (NOT on boot):
  - trajectory-ledger.json   ← created on first tool call
  - agent-work-contracts.json ← created on first tool call
  - config-workflows.json    ← created on first tool call
  - delegations.json         ← created on first delegation dispatch
  - session-continuity.json  ← created on first session record/write
  - project-continuity.json  ← created on first session bootstrap or initializeIndex()
```

---

## Atomic Write Pattern Comparison

| Implementation | Pattern | Unique Tmp? | Crash Safety | Concurrent Write Safety |
|---------------|---------|-------------|--------------|------------------------|
| `continuity/index.ts` | `writeFileSync(tmp)` + `renameSync(tmp, file)` | ✅ `uuid.tmp` | ✅ Full | ⚠️ Single-threaded, but two processes would collide |
| `delegation-persistence.ts` | Same pattern | ✅ `uuid.tmp` | ✅ Full | ⚠️ Same |
| `trajectory/ledger.ts` | Direct `writeFileSync()` | N/A | ❌ Corrupts file | ❌ Concurrent writes corrupt |
| `agent-work-contracts/store.ts` | Same as continuity | ✅ `uuid.tmp` | ✅ Full | ⚠️ Same |
| `config/workflow/workflow-persistence.ts` | `writeFileSync(.tmp)` + rename | ❌ Fixed `.tmp` | ⚠️ Temp file collision risk | ⚠️ Concurrent writes may share temp |
| `session-tracker/atomic-write.ts` | `writeFile(tmp, content)` + `rename(tmp, file)` (async) | ✅ `Date.now().tmp` | ✅ Full | ⚠️ Async, two callers may collide on rare timestamp collisions |

---

## State File Content Overlap / Data Duplication

| Data Element | Stored In | Also In | Risk |
|-------------|-----------|---------|------|
| Session status | `session-continuity.json.metadata.status` | `project-continuity.json.sessions[].status` | Drift — updated by different code paths |
| Delegation notifications | `session-continuity.json.metadata.pendingNotifications` | (in-memory delegation state) | Duplicate replay on crash |
| Delegation status | `delegations.json[].status` | `session-continuity.json.metadata.delegation` | Two sources of truth for delegation state |
| Contract ←→ trajectory link | `agent-work-contracts.json.contracts[].trajectoryId` | `trajectory-ledger.json` evidence refs | Cross-link available in both directions |
| Turn count | `project-continuity.json` (not stored) | `session-tracker/{id}/session-continuity.json.turnCount` | Only in per-session index |

---

## What Happens When Each File Is Missing or Corrupt

| File | Missing Behavior | Corrupt Behavior | Recovery |
|------|-----------------|------------------|----------|
| `session-continuity.json` | Returns empty store gracefully | Quarantine + throws `[Harness] Failed to read continuity store` | Plugin init fails hard |
| `delegations.json` | Returns empty array gracefully | Quarantine + throws | Plugin init fails hard |
| `trajectory-ledger.json` | Returns empty ledger gracefully | Quarantine + throws | Tool call fails with error |
| `agent-work-contracts.json` | Returns empty store gracefully | Quarantine + silently returns empty | Contract enforcement disabled |
| `config-workflows.json` | Returns empty map gracefully | Silently returns empty | Workflow resume fails |
| `project-continuity.json` | Default returned gracefully | Silently returns default | Session index reset |

---

## Key Structural Observations

1. **No single state authority:** Each file has its own I/O module. There is no `StateStoreManager`, no shared atomic-write utility (except session-tracker's internal one), and no unified flush mechanism.

2. **Module-load side effects:** `continuity/index.ts` registers shutdown handlers on import — this is the only case where a state file module self-registers lifecycle behavior. The other 4 files are purely passive (called by other modules).

3. **Two `session-continuity.json` files:** The continuity module's file at `.hivemind/state/session-continuity.json` is completely different from the session-tracker's per-session files at `.hivemind/session-tracker/{id}/session-continuity.json`. Same name, different data, different modules, different directories.

4. **Trajectory ledger has no atomic writes:** This is the most dangerous finding. A crash during `writeTrajectoryLedger()` silently corrupts the trajectory ledger, and the next read will quarantine it. Since trajectory writes happen during contract creation, pressure events, and tool calls, this is a realistic crash scenario.

5. **Config workflows has a fixed tmp filename:** `persistWorkflows()` uses `filePath + ".tmp"` without a unique suffix. If two tool calls trigger concurrent writes, they may share/overwrite the same temp file, though `writeFileSync` + `renameSync` on the same file from different processes is undefined behavior.

6. **No write locking across files that have cross-dependencies:** When `createAgentWorkContract()` writes to both `agent-work-contracts.json` and `trajectory-ledger.json`, there's no two-phase commit or rollback. A crash between the two writes leaves the system in an inconsistent state.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The config-workflows fixed `.tmp` filename can cause real-world corruption | Cluster B | Edge case: only happens with concurrent configure-primitive calls |
| A2 | The two `session-continuity.json` files (state/ vs session-tracker/) never have their paths confused | Cluster G | A developer new to the codebase could easily confuse them |
| A3 | Boot order matters for state file init | Boot Order | Current ordering works in practice but has no guardrails against regressions |

---

## Sources

### Primary (HIGH confidence)
- `src/task-management/continuity/index.ts` (506 lines) — session-continuity.json I/O, store cache, shutdown handlers
- `src/task-management/continuity/delegation-persistence.ts` (251 lines) — delegations.json persist/read/merge
- `src/task-management/continuity/store-cache.ts` (48 lines) — in-memory cache for continuity store
- `src/task-management/trajectory/ledger.ts` (93 lines) — trajectory-ledger.json I/O (NO atomic writes!)
- `src/task-management/trajectory/store-operations.ts` (416 lines) — trajectory mutation operations
- `src/task-management/trajectory/types.ts` (226 lines) — trajectory types and state machine
- `src/task-management/lifecycle/index.ts` (242 lines) — HarnessLifecycleManager, hydrateFromContinuity
- `src/features/agent-work-contracts/store.ts` (164 lines) — agent-work-contracts.json I/O
- `src/features/agent-work-contracts/operations.ts` (159 lines) — cross-file writes (contract → trajectory)
- `src/config/workflow/workflow-persistence.ts` (182 lines) — config-workflows.json I/O (fixed .tmp!)
- `src/config/workflow/workflow-state.ts` (185 lines) — workflow state machine (pure functions)
- `src/features/session-tracker/index.ts` (626 lines) — SessionTracker class
- `src/features/session-tracker/initialization.ts` (280 lines) — dependency construction
- `src/features/session-tracker/bootstrap.ts` (167 lines) — lazy bootstrap
- `src/features/session-tracker/persistence/project-index-writer.ts` (401 lines) — project-continuity.json writes
- `src/features/session-tracker/persistence/session-index-writer.ts` (334 lines) — per-session continuity
- `src/features/session-tracker/persistence/hierarchy-index.ts` (382 lines) — in-memory hierarchy
- `src/features/session-tracker/persistence/hierarchy-manifest.ts` (319 lines) — manifest writer
- `src/features/session-tracker/persistence/atomic-write.ts` (180 lines) — async atomic write utility
- `src/features/session-tracker/project-continuity.ts` (129 lines) — completeness checker
- `src/coordination/delegation/manager.ts` (409 lines) — DelegationManager facade
- `src/coordination/delegation/manager-runtime.ts` (510 lines) — runtime delegation manager with recovery
- `src/coordination/delegation/state-machine.ts` (443 lines) — state machine, persistAll() entry
- `src/plugin.ts` (649 lines) — composition root, initialization sequence

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read and analyzed
- Architecture patterns: HIGH — lifecycle map derived from actual code paths
- Pitfalls: HIGH — all issues verified against actual implementation code

**Research date:** 2026-05-31  
**Valid until:** No external dependencies — stable as long as source modules remain unchanged
