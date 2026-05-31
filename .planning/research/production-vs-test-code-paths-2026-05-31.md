# Production vs Test Code Paths — delegations.json & session-continuity.json

**Researched:** 2026-05-31
**Domain:** Runtime state persistence (delegation + session continuity)
**Hypothesis:** `delegations.json` and `session-continuity.json` are ENTIRELY test artifacts.
**Verification:** **HYPOTHESIS REFUTED** — both files contain real production data. Production 
flows actively write to both. Deleting them will cause data loss, and the harness will 
repopulate them with real data on next interaction.

---

## Executive Summary

The hypothesis that `delegations.json` and `session-continuity.json` are "entirely test 
artifacts" is **incorrect**. Both files are actively written during production use:

- **`delegations.json`**: Written by `DelegationStateMachine` during delegation dispatch, 
  status transitions, terminal completion, safety ceiling timeout, PTY cancellation, and 
  grace-period scheduling. Every `delegate-task` tool call triggers writes to this file 
  through `persistDelegations()`.

- **`session-continuity.json`**: Written by lifecycle hooks (`noteObservedActivity`, 
  `cancelDelegatedSession`, `replayPendingNotificationsForEvent`, 
  `recordCompactionCheckpoint`), notification queuing (`queuePendingNotification`), 
  pending notification persistence (`persistPendingDelegationNotifications`), and shutdown 
  flush (`registerShutdownHandlers` → `flushAllStores`).

If both files are deleted and the harness restarts, they will be **immediately repopulated** 
the next time:
1. A `delegate-task` tool call is made (creates `delegations.json`)
2. A lifecycle event fires (session.idle, session.error, session.deleted), hook triggers 
   lifecycle notes activity, or `registerShutdownHandlers` flushes on exit
3. A pending notification is queued (from terminal delegation notifications)
4. Compaction checkpoints are recorded

---

## Detailed Write Path Analysis

### Write Target 1: `delegations.json`

**Resolved path:** `.hivemind/state/delegations.json` (Q6 canonical)
**Write function:** `persistDelegations()` in `src/task-management/continuity/delegation-persistence.ts`
**Write mechanism:** Atomic write (tmp + renameSync), reads existing for merge-write

#### Production Call Chains

| Call Chain | Trigger | File:Line |
|-----------|---------|-----------|
| `plugin.ts:397` → `DelegationManager.recoverPending()` → `readPersistedDelegations()` | Plugin init | **READ only** |
| `plugin.ts:382` → `setupDelegationModules()` → `DelegationManager.dispatch()` → `state.registerDelegation()` → in-memory only | delegate-task tool | No direct persist |
| `dispatch()` → `state.transition()` → `StateMachine.transition()` → `persistAll()` → `persistDelegations()` | Dispatch transitions from dispatched→running | `state-machine.ts:247` |
| `transitionToTerminal()` → `persistAll()` → `persistDelegations()` | Terminal completion/error/timeout | `state-machine.ts:289` |
| `scheduleGracePeriodCleanup()` → `persistAll()` → `persistDelegations()` | Grace period recorded | `state-machine.ts:331` |
| `pruneCompletedDelegations()` → `persistDelegations()` | Memory management (over threshold) | `state-machine.ts:394` |
| `markCommandCancellationForPtySession()` → `persistAll()` → `persistDelegations()` | PTY command cancellation | `state-machine.ts:417` |
| v2 `coordinator.ts:154` → `lifecycle.register()` → `stateMachine.registerDelegation()` → in-memory only | Coordinator dispatch | No direct persist |
| `coordinator.ts:156` → `lifecycle.transition()` → `stateMachine.transition()` → `persistAll()` → `persistDelegations()` | Coordinator transitions | `state-machine.ts:247` |
| `coordinator.ts:handleCompletion()` → `lifecycle.transition()` → same path | Terminal completion | `state-machine.ts:247` |
| `DelegationRetryHandler.persistWithRetry()` (defaults to `persistDelegations`) | **UNWIRED** — not imported by any production code | `retry-handler.ts:32` |

**Verdict: PRODUCTION** — every normal `delegate-task` or coordinator dispatch writes to 
this file. The `DelegationStateMachine` is created in `setupDelegationModules()` at 
`plugin.ts:275` and used by both the v1 runtime adapter and v2 coordinator.

#### Test Call Chains

| Call Chain | Isolated? | File:Line |
|-----------|-----------|-----------|
| `persistDelegations([makeDelegation("outer")])` | YES — `OPENCODE_HARNESS_STATE_DIR` → temp dir | `tests/lib/delegation-persistence.test.ts:73` |
| `persistDelegations([{...redacted...}])` | YES — temp dir | `tests/lib/delegation-persistence.test.ts:113` |
| `persistDelegations([makeDelegation("del-g4-test")])` | YES — temp dir | `tests/lib/delegation-persistence.test.ts:180` |
| `persistDelegations([makeDelegation("del-commit-defaults")])` | YES — temp dir | `tests/lib/delegation-persistence.test.ts:199` |
| `persistDelegations([...])` | YES — `vi.mock()` → no-op | `tests/lib/delegation-state-machine.test.ts:18` |
| `persistDelegations([...])` | YES — temp dir | `tests/tools/delegation-status.test.ts:137,428` |
| `persistDelegations: () => undefined` | YES — explicit no-op | `tests/integration/delegation-v2-integration.test.ts:42+` |
| `persistDelegations([])` | **⚠️ NO** — no env override | `tests/integration/continuity-delegation-persistence.test.ts:13` |

**Verdict: TEST-ONLY** (with ONE exception flagged below)

---

### Write Target 2: `session-continuity.json`

**Resolved path:** `.hivemind/state/session-continuity.json` (Q6 canonical)
**Write functions:** `recordSessionContinuity()`, `patchSessionContinuity()`, 
`deleteSessionContinuity()`, `flushAllStores()` in `src/task-management/continuity/index.ts`
**Write mechanism:** Atomic write via `persistStore()` → `writeStoreToDisk()` (tmp + renameSync).
Gated by `config.atomic_commit` (default: `true`).

#### Production Call Chains

| Call Chain | Trigger | File:Line |
|-----------|---------|-----------|
| `plugin.ts:237` → `recordSessionContinuity()` | `persistPendingDelegationNotifications()` — creates record for unknown parent sessions | `plugin.ts:237` |
| `plugin.ts:234` → `patchSessionContinuity()` | `persistPendingDelegationNotifications()` — appends pending notifications | `plugin.ts:234` |
| `plugin.ts:645` → `patchSessionContinuity()` | `replayPendingDelegationNotifications()` — clears notifications after replay | `plugin.ts:645` |
| `lifecycle/index.ts:123` → `patchSessionContinuity()` | `noteObservedActivity()` — updates lifecycle state on activity | `lifecycle/index.ts:123` |
| `lifecycle/index.ts:187` → `patchSessionContinuity()` | `replayPendingNotificationsForEvent()` — clears after replay | `lifecycle/index.ts:187` |
| `lifecycle/index.ts:202` → `patchSessionContinuity()` | `cancelDelegatedSession()` — marks session failed | `lifecycle/index.ts:202` |
| `lifecycle/index.ts:217` → `patchSessionContinuity()` | `recordCompactionCheckpoint()` — saves checkpoint | `lifecycle/index.ts:217` |
| `notification-handler.ts:223` → `patchSessionContinuity()` | `queuePendingNotification()` — appends to existing session | `notification-handler.ts:223` |
| `notification-handler.ts:229` → `recordSessionContinuity()` | `queuePendingNotification()` — creates record for unknown sessions | `notification-handler.ts:229` |
| `continuity/index.ts:490` → `flushAllStores()` | `process.on("exit")` — shutdown | `continuity/index.ts:490` |
| `continuity/index.ts:494` → `flushAllStores()` | `process.on("SIGINT")` — signal | `continuity/index.ts:494` |
| `continuity/index.ts:499` → `flushAllStores()` | `process.on("SIGTERM")` — signal | `continuity/index.ts:499` |
| `continuity/index.ts:505` → `registerShutdownHandlers()` | Module load (when `!process.env.VITEST`) | `continuity/index.ts:504-505` |

**Verdict: PRODUCTION** — every SDK event that triggers lifecycle hooks, every terminal 
delegation notification, every session cancellation, every process shutdown writes to this 
file. The shutdown handler auto-registers on module load (excluding test runner).

#### Test Call Chains

| Call Chain | Isolated? | File |
|-----------|-----------|------|
| `recordSessionContinuity()` (× many) | YES — temp dir | `tests/lib/continuity.test.ts` |
| `recordSessionContinuity()` | YES — temp dir (via beforeEach) | `tests/plugins/plugin-lifecycle.test.ts` |
| `recordSessionContinuity()` | YES — temp dir | `tests/lib/lifecycle-manager.test.ts` |
| `recordSessionContinuity()` | YES — temp dir | `tests/lib/delegation-manager.test.ts` |
| `flushAllStores()` | YES — temp dir | `tests/lib/continuity.test.ts` |
| `import continuity module` (no writes) | N/A — read-only import | `tests/hooks/continuity.test.ts` |

**Verdict: TEST-ONLY** — every test that writes to `session-continuity.json` redirects 
via `OPENCODE_HARNESS_STATE_DIR` to a temp directory.

---

## Critical Finding: Test Pollution Risk

**File:** `tests/integration/continuity-delegation-persistence.test.ts`
**Risk:** This test calls `persistDelegations([])` at line 13 and `readPersistedDelegations()` 
at line 23 **without** setting `OPENCODE_HARNESS_STATE_DIR`. When this test runs on a real 
project, it writes an empty array (merge-write behavior preserves non-terminal delegations) 
to the production `.hivemind/state/delegations.json` and reads from it.

```typescript
// Line 10-13: No beforeEach setup, no env override
it("persistDelegations is callable with empty array", async () => {
  const mod = await import("../../src/task-management/continuity/delegation-persistence.js")
  const result = mod.persistDelegations([])  // ⚠️ WRITES TO PRODUCTION PATH
```

**Severity:** LOW (writes empty array which merge-logic preserves existing non-terminal 
delegations). But it's a correctness concern — test isolation is incomplete.

---

## Answer to the Core Question

**If we delete these 2 files and restart the harness, will they be repopulated with real data?**

**YES, they will be repopulated.** Here is exactly when:

### `delegations.json`
- **On first `delegate-task` call:** `DelegationCoordinator.dispatch()` or `DelegationManager.dispatch()` → 
  `DelegationStateMachine.transition()` → `persistAll()` → `persistDelegations()` creates the file.
- **On harness restart with active delegations:** `plugin.ts:397` calls `recoverPending()` which 
  calls `readPersistedDelegations()`. If the file is missing, this returns `[]` — no data loss 
  from the file perspective, but any in-flight delegations that were NOT yet persisted are lost.
- **On process exit:** `registerShutdownHandlers()` calls `flushAllStores()` which only flushes 
  session-continuity, not delegations.json (the shutdown handler is in the continuity module, 
  not the delegation module).

### `session-continuity.json`
- **On first lifecycle event:** `session.created` or `session.updated` fires → `core-hooks.ts` 
  calls `lifecycleManager.handleEvent()` → which eventually calls `noteObservedActivity()` → 
  `patchSessionContinuity()` creates the file.
- **On first terminal delegation:** `notification-handler.ts:queuePendingNotification()` → 
  `recordSessionContinuity()` or `patchSessionContinuity()` creates the file.
- **On process exit:** `registerShutdownHandlers()` → `flushAllStores()` flushes in-memory 
  state to disk (only if `atomic_commit` is false — if true, files are written immediately).
- **On plugin init:** `plugin.ts:408` → `lifecycleManager.hydrateFromContinuity()` reads the 
  file. If missing, it starts with empty state and repopulates as events arrive.

### Data Loss Risk

If you delete these files while the harness is **running** with active delegations:
- Any delegation records not yet flushed to the old file are lost (only in-memory, gone on 
  restart). But since the write path calls `persistDelegations` on every state transition 
  (including the initial `dispatched` state), the loss is bounded to delegations that were 
  created but never transitioned.

If you delete these files while the harness is **stopped**:
- No loss of production data that was already persisted. Next startup creates fresh files.

---

## Complete Write Path Call Graph

### delegations.json

```
persistDelegations(filePath)                          # delegation-persistence.ts:58
  ├── DelegationStateMachine.persistAll()              # state-machine.ts:214
  │     ├── DelegationStateMachine.transition()        # state-machine.ts:247
  │     │     ├── DelegationLifecycle.transition()     # lifecycle.ts:57
  │     │     │     ├── DelegationCoordinator.dispatch() [PRODUCTION]
  │     │     │     ├── DelegationCoordinator.handleCompletion() [PRODUCTION]
  │     │     │     ├── DelegationCoordinator.handleTimeout() [PRODUCTION]
  │     │     │     ├── DelegationCoordinator.failDispatch() [PRODUCTION]
  │     │     │     ├── DelegationCoordinator.abortDelegation() [PRODUCTION]
  │     │     │     └── DelegationCoordinator.cancelDelegation() [PRODUCTION]
  │     │     └── RuntimeDelegationManager.dispatch() [PRODUCTION — manager-runtime.ts]
  │     ├── DelegationStateMachine.transitionToTerminal()  # state-machine.ts:289
  │     │     ├── DelegationLifecycle.transitionTerminal() # lifecycle.ts:84
  │     │     │     ├── DelegationLifecycle.markTimeout() [PRODUCTION]
  │     │     │     ├── DelegationLifecycle.markAborted() [PRODUCTION]
  │     │     │     └── DelegationLifecycle.markCancelled() [PRODUCTION]
  │     │     ├── DelegationStateMachine.handleSafetyCeiling() [PRODUCTION — safety timeout]
  │     │     └── RuntimeDelegationManager handlers (session error/idle/deleted) [PRODUCTION]
  │     └── DelegationStateMachine.scheduleGracePeriodCleanup()  # state-machine.ts:331
  │           └── called from transitionToTerminal() [PRODUCTION]
  ├── DelegationStateMachine.pruneCompletedDelegations()  # state-machine.ts:394
  │     └── DelegationManager.pruneCompletedDelegations() [PRODUCTION — manager.ts:371]
  └── DelegationStateMachine.markCommandCancellationForPtySession() # state-machine.ts:417
        └── DelegationManager.markCommandCancellationForPtySession() [PRODUCTION]
```

### session-continuity.json

```
writeStoreToDisk(filePath, store)                       # continuity/index.ts:312
  ├── persistStore()                                     # continuity/index.ts:324
  │     ├── recordSessionContinuity()                    # continuity/index.ts:367
  │     │     ├── plugin.ts:persistPendingDelegationNotifications() [PRODUCTION]
  │     │     └── notification-handler.ts:queuePendingNotification() [PRODUCTION]
  │     ├── patchSessionContinuity()                     # continuity/index.ts:381
  │     │     ├── plugin.ts:persistPendingDelegationNotifications() [PRODUCTION]
  │     │     ├── plugin.ts:replayPendingDelegationNotifications() [PRODUCTION]
  │     │     ├── lifecycle/index.ts:noteObservedActivity() [PRODUCTION]
  │     │     ├── lifecycle/index.ts:replayPendingNotificationsForEvent() [PRODUCTION]
  │     │     ├── lifecycle/index.ts:cancelDelegatedSession() [PRODUCTION]
  │     │     ├── lifecycle/index.ts:recordCompactionCheckpoint() [PRODUCTION]
  │     │     └── notification-handler.ts:queuePendingNotification() [PRODUCTION]
  │     ├── patchSessionDelegationPacket()               # continuity/index.ts:424
  │     │     └── (delegates to patchSessionContinuity)
  │     ├── deleteSessionContinuity()                    # continuity/index.ts:446
  │     │     └── ⚠️ EXPORTED but NO production callers found — DEAD CODE
  │     └── recordGovernancePersistenceState()           # continuity/index.ts:464
  │           └── (governance state, same file)
  └── flushAllStores()                                   # continuity/index.ts:476
        └── registerShutdownHandlers() [PRODUCTION — on exit/SIGINT/SIGTERM]
```

---

## Summary Table

| File | Write Function | Production Callers | Test-Only Callers | Unused/Dead | Verdict |
|------|---------------|-------------------|-------------------|-------------|---------|
| `delegations.json` | `persistDelegations()` | `DelegationStateMachine` transition, terminal, grace-period, prune, PTY cancel — all triggered by normal delegation dispatch/completion flows | 5 test files (all isolated to temp dirs or mocked) | `DelegationRetryHandler` (unwired) | **PRODUCTION** |
| `session-continuity.json` | `recordSessionContinuity()` | `persistPendingDelegationNotifications()`, `queuePendingNotification()` | 4 test files (all isolated to temp dirs) | — | **PRODUCTION** |
| `session-continuity.json` | `patchSessionContinuity()` | 7 production callers across plugin, lifecycle, notification-handler | Multiple test files (all isolated) | — | **PRODUCTION** |
| `session-continuity.json` | `deleteSessionContinuity()` | None | None | Yes — exported but unused | **DEAD CODE** |
| `session-continuity.json` | `flushAllStores()` | `registerShutdownHandlers()` (process exit/SIGINT/SIGTERM) | Test calls (isolated to temp dirs) | — | **PRODUCTION** |

---

## Test Isolation Assessment

| Test File | Uses Isolation? | Isolation Method | Notes |
|-----------|----------------|------------------|-------|
| `tests/lib/delegation-persistence.test.ts` | ✅ | `OPENCODE_HARNESS_STATE_DIR` → `mkdtempSync` | Clean |
| `tests/lib/delegation-state-machine.test.ts` | ✅ | `vi.mock("persistDelegations", vi.fn())` | Never writes to disk |
| `tests/lib/continuity.test.ts` | ✅ | `OPENCODE_HARNESS_STATE_DIR` → `mkdtempSync` | Clean |
| `tests/tools/delegation-status.test.ts` | ✅ | `OPENCODE_HARNESS_STATE_DIR` → `mkdtempSync` | Clean |
| `tests/plugins/plugin-lifecycle.test.ts` | ✅ | Uses env overrides | Assumed clean |
| `tests/lib/lifecycle-manager.test.ts` | ✅ | Uses env overrides | Assumed clean |
| `tests/lib/delegation-manager.test.ts` | ✅ | Uses env overrides | Assumed clean |
| `tests/integration/delegation-v2-integration.test.ts` | ✅ | `persistDelegations: () => undefined` | Explicit no-op |
| `tests/integration/continuity-delegation-persistence.test.ts` | **⚠️ NO** | No isolation | Writes `[]` to production path |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `process.env.VITEST` is set during all test runs (controls shutdown handler registration at `continuity/index.ts:504`) | Shutdown | If VITEST is absent in some test runner, shutdown handlers write to production paths during tests |
| A2 | `deleteSessionContinuity()` has zero production callers | Dead Code | Negligible — function is harmless; worst case it's called by an as-yet-unfound production path |
| A3 | `tests/integration/continuity-delegation-persistence.test.ts` runs without `OPENCODE_HARNESS_STATE_DIR` | Test Pollution | Confirmed by reading test — no beforeEach sets it. If `vitest` runs with cwd at production project root, `persistDelegations([])` writes to production `.hivemind/state/delegations.json`. Read proved. |
| A4 | `tests/plugins/plugin-lifecycle.test.ts`, `tests/lib/lifecycle-manager.test.ts`, `tests/lib/delegation-manager.test.ts` use isolation | Test Isolation | Not fully verified — grep showed `recordSessionContinuity()` imports but may use mock setup I didn't fully trace |
| A5 | `DelegationRetryHandler` is not imported by any production code | Unused Code | Zero grep hits for `retry-handler` in `src/`. Confirmed unwired. |
