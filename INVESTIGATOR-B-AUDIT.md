# INVESTIGATOR-B Audit Report: Delegation-Related Code Paths

**Scope:** `src/lib/` and `src/shared/` — all delegation-related modules
**Date:** 2026-04-23
**Reviewer:** INVESTIGATOR-B (subagent)

---

## 1. `src/lib/delegation-manager.ts` (448 lines)

### Responsibility
Central orchestrator for all delegation operations. Owns the in-memory `delegations` Map, session-to-delegation index, safety/grace period timers, and delegates to `SdkDelegationHandler` and `CommandDelegationHandler`. Exposes `dispatch()`, `dispatchCommand()`, `handleSessionIdle()`, `handleSessionDeleted()`, and `recoverPending()`.

### Code Paths
1. `dispatch()` (lines 81–149): Validates nesting depth, resolves agent, acquires concurrency slot, spawns child session, builds Delegation record, registers it, sends prompt via SDK, returns immediately.
2. `dispatchCommand()` (lines 151–167): Validates nesting depth, acquires concurrency slot, delegates to `CommandDelegationHandler.dispatchCommand()`.
3. `handleSessionIdle()` (lines 169–182): Looks up delegation by session ID, transitions `dispatched`→`running`, schedules stability poll if not already polling.
4. `handleSessionDeleted()` (lines 184–193): Looks up delegation, transitions to error with message "Delegated session deleted before completion".
5. `recoverPending()` (lines 195–214): Iterates persisted delegations, re-registers running/dispatched SDK delegations via `sdkHandler.recoverSdkDelegation()`, re-registers PTY delegations via `commandHandler.recoverPtyDelegation()`, marks headless command delegations as unrecoverable error.
6. `transitionToTerminal()` (lines 291–323): Unified terminal state handler — sets status, `completedAt`, error, clears timers, persists, cleans up tracking, logs, schedules grace period, notifies parent.
7. `pruneCompletedDelegations()` (lines 246–271): Removes terminal delegations older than `maxAgeMs` from in-memory Map and syncs durable state.
8. `scheduleSafetyCeiling()` (lines 273–278): Computes remaining time, sets timeout calling `handleSafetyCeiling()`.
9. `handleSafetyCeiling()` (lines 280–285): Checks delegation still active, transitions to timeout, attempts SDK abort.
10. `validateAgent()` (lines 358–390): Fetches agent list from SDK, handles Zod validation errors gracefully, throws if agent not found.
11. `buildSpawnRequest()` (lines 422–440): Constructs `DelegationSpawnRequest` with hardcoded `permissionProfile.mode: "write-capable"` and tools list.

### NOT Implemented / Stubs / Gaps
- **No integration with `CompletionDetector`**: `delegation-manager.ts` instantiates `CompletionDetector` nowhere. The `lifecycle-manager.ts` has one (line 47) but `DelegationManager` does not use it. Dual-signal completion is implemented manually in `SdkDelegationHandler` via message-count polling, not via `CompletionDetector`.
- **No caller for `notifyParentSession()`**: `notifyDelegationTerminal()` (line 322) is called, but `notifyParentSession()` (the older system-reminder style notification) has no callers in `delegation-manager.ts`.
- **`buildSpawnRequest()` hardcodes permission profile** (lines 436–438): No override path from caller params.
- **No handling of `interrupt` status**: `TaskStatus` includes `"interrupt"` (from `types.ts`), but `transitionToTerminal()` only handles `"completed"`, `"error"`, `"timeout"`.
- **Nesting depth uses `delegationsBySession` only** (line 74–79): If parent session was not itself a delegation (e.g., root orchestrator), depth returns 1. This is correct but means cross-instance restart loses depth tracking because `delegationsBySession` is in-memory only.

### Tested
- `tests/lib/delegation-manager.test.ts` (~1400+ lines) — comprehensive coverage of dispatch, dual-signal completion, session lifecycle, persistence, recovery, command delegation via PTY/headless.

### NOT Tested
- **`pruneCompletedDelegations()`**: No test verifies the pruning logic or the `DEFAULT_PRUNE_MAX_AGE_MS` default.
- **`handleSafetyCeiling()` abort failure path**: No test for when `client.session.abort()` throws.
- **`validateAgent()` Zod fallback path**: The `message.includes("expected string, received undefined")` branch (line 370) is untested.
- **`buildSpawnRequest()` permission profile**: Not tested for override or correctness.
- **Grace period cleanup (`scheduleGracePeriodCleanup`)**: The timer callback at lines 336–340 is not tested — specifically that `delegations.delete()` removes from memory only.
- **Concurrent `dispatchCommand` + `dispatch` interaction**: No cross-mode concurrency test.

### Bugs
- **Race condition in `dispatch()` prompt sending** (lines 126–144): `client.session.prompt()` is fire-and-forget with `.then().catch()`. If the prompt succeeds but the `setTimeout` scheduling `status = "running"` fires AFTER `handleSessionIdle()` has already been called by an event, `current.status === "dispatched"` guard prevents double-transition, but the `.catch()` path also uses `setTimeout(0)` — both race against each other. The microtask/macrotask ordering is fragile.
- **`persistAllDelegations()` called synchronously after `registerDelegation()`** (line 125) but before prompt `.then()` fires — if process crashes between registration and prompt send, recovery will find a "dispatched" delegation with no evidence of prompt delivery. This is by design but documented as risk.
- **`transitionToTerminal()` silent return on non-running/dispatched** (lines 297–298): If called twice (e.g., safety ceiling + session deleted), second call silently returns. This is defensive but can mask double-transition bugs.

---

## 2. `src/lib/sdk-delegation.ts` (204 lines)

### Responsibility
Manages SDK delegation lifecycle: stability polling, result extraction, and recovery. Owned by `DelegationManager`. Owns `stabilityTimers` Map.

### Code Paths
1. `scheduleStabilityPoll()` (lines 64–76): Computes adaptive interval, sets timeout calling `performStabilityPoll()`.
2. `performStabilityPoll()` (lines 129–184): Fetches message count, compares to `lastMessageCount`, updates `stablePollCount`, checks stale timeout, checks MIN_IDLE_TIME_MS, checks dual stability gate (MIN_STABILITY_TIME_MS + STABLE_POLLS_REQUIRED), calls `finalizeSdkDelegation()` or reschedules.
3. `finalizeSdkDelegation()` (lines 186–203): Fetches messages via `client.session.messages()`, extracts assistant text, calls `onTerminal("completed")`.
4. `recoverSdkDelegation()` (lines 79–104): Fetches session status with 5s timeout protection, checks if idle/busy/missing, routes accordingly.
5. `calculateAdaptiveInterval()` (lines 53–61): Returns interval based on idle time.

### NOT Implemented / Stubs / Gaps
- **No `interrupt` handling**: Same gap as delegation-manager — `interrupt` status is not considered in polling logic.
- **`recoverSdkDelegation()` only checks `status.type`** (lines 89–99): If the child session exists but status structure is different from expected, it falls through to `scheduleSafetyCeiling`. No validation of session health beyond type string.

### Tested
- `tests/lib/sdk-delegation.test.ts` (456 lines) — adaptive polling, fast-completion deferral, stale detection, dual stability gate, recovery, timer management.

### NOT Tested
- **`finalizeSdkDelegation()` error path**: When `client.session.messages()` throws, `onTerminal("error")` is called but not tested.
- **`performStabilityPoll()` when `getSessionMessageCount` returns null**: Lines 136–140 — reschedules poll, but the `!this.stabilityTimers.has()` check before rescheduling is not explicitly verified.
- **Adaptive interval edge cases**: The branch where `idleTime < 30000` returns `POLL_INTERVAL_BASE_MS` is tested implicitly, but the exact boundary at 30s and 5min is not verified with fake timers at those exact boundaries.

### Bugs
- **Stale timeout check uses `DEFAULT_STALE_TIMEOUT_MS` unconditionally** (line 158): A delegation with a custom `safetyCeilingMs` shorter than `DEFAULT_STALE_TIMEOUT_MS` (10 min) will hit the safety ceiling first, but if `safetyCeilingMs` is longer, stale timeout could fire before safety ceiling. This is by design but means there are TWO independent timeout mechanisms with no coordination.
- **`recoverSdkDelegation()` Promise.race timeout is 5s** (lines 84–88): If the SDK is slow but not dead, recovery gives up at 5s and marks delegation error. This is conservative but could falsely error healthy delegations.

---

## 3. `src/lib/command-delegation.ts` (280 lines)

### Responsibility
Manages PTY and headless command delegation lifecycle. Owned by `DelegationManager`. Owns `commandPollTimers` and `headlessCommands` Maps.

### Code Paths
1. `dispatchCommand()` (lines 54–112): Attempts PTY spawn, falls back to headless on PTY null/unsupported/throw.
2. `dispatchHeadlessCommand()` (lines 146–195): Spawns `child_process`, registers stdout/stderr/exit handlers, registers delegation, returns immediately.
3. `schedulePtyExitPoll()` (lines 201–225): Polls PTY session every 250ms for `exitCode`.
4. `finalizeCommandDelegation()` (lines 227–249): Sets result, transitions to completed/error based on exit code or error.
5. `recoverPtyDelegation()` (lines 115–131): Looks up PTY session, finalizes if already exited, or restarts polling.
6. `resolvePtyManager()` (lines 255–265): Checks if PTY manager exists and `isSupported()`.
7. `buildMinimalEnv()` (lines 267–279): Whitelist-based environment filtering.

### NOT Implemented / Stubs / Gaps
- **No headless command recovery**: `recoverPending()` in delegation-manager marks headless command delegations as error (lines 209–212). This is by design but means ALL headless commands are unrecoverable across restart.
- **No timeout for PTY exit poll**: `schedulePtyExitPoll()` runs indefinitely every 250ms if `exitCode` never arrives. There is no safety ceiling for PTY delegations.
- **`buildMinimalEnv()` hardcodes allowed keys** (line 268): `PATH`, `HOME`, `TERM`, `LANG`, `PWD`. Missing `USER`, `SHELL`, `TMPDIR`, and other common environment variables. This could break commands that depend on them.
- **Headless command `child.stdin` is never closed** (line 154–158): `stdio: ["pipe", "pipe", "pipe"]` opens stdin but no code writes to or closes it. For long-running commands that wait for EOF, this could hang.

### Tested
- `tests/lib/command-delegation.test.ts` (428 lines) — PTY primary routing, headless fallback, PTY output capture, lifecycle status transitions, failure propagation, timer cleanup.

### NOT Tested
- **`recoverPtyDelegation()`**: No test for the recovery path (lines 115–131).
- **`finalizeCommandDelegation()` when delegation not found** (lines 231–234): The early-return path is untested.
- **`buildMinimalEnv()`**: No test for environment filtering.
- **Headless process `error` event** (lines 184–185): The `child.on("error")` path is untested.
- **`resolvePtyManager()` when `isSupported` is not a function** (line 260): The `typeof this.ptyManager.isSupported === "function"` check is untested.
- **PTY spawn exception fallback** (lines 101–105): Only one test covers PTY spawn throw, but does not verify the fallbackReason contains the original error message.

### Bugs
- **Memory leak in `headlessCommands` Map** (lines 191, 247): `headlessCommands.set()` stores process reference, `headlessCommands.delete()` only runs on terminal transition. If `finalizeCommandDelegation()` returns early because delegation not found (line 232), the headless process and its handlers are never cleaned up from the Map.
- **PTY exit poll ignores `fallbackReason`** (line 218): When PTY exits, `finalizeCommandDelegation()` does not pass any `fallbackReason`, but the delegation might have one from earlier fallback paths. Not a bug per se but inconsistent.
- **Headless process `exit` event with `null` exitCode** (line 188): `exitCode ?? 0` treats `null` (process killed by signal) as success (`0`). This is incorrect — a signal-killed process should be error, not completed.

---

## 4. `src/lib/notification-handler.ts` (218 lines)

### Responsibility
Fire-and-forget notification delivery for parent sessions. Re-activated in Phase 16.2. Contains `buildNotificationMessage()`, `formatToastMessage()`, `buildTaskNotificationFromContinuity()`, `notifyParentSession()`, and `notifyDelegationTerminal()`.

### Code Paths
1. `buildNotificationMessage()` (lines 25–76): Formats `TaskNotification` into `<system_reminder>` block with conditional fields.
2. `formatToastMessage()` (lines 78–89): One-line toast format with icon.
3. `buildTaskNotificationFromContinuity()` (lines 91–141): Builds `TaskNotification` from `SessionContinuityRecord` with category-aware summary text.
4. `notifyParentSession()` (lines 145–177): Sends prompt to parent session with `noReply`, best-effort toast.
5. `notifyDelegationTerminal()` (lines 186–216): Sends JSON payload to parent session with taskId, terminalState, resultSummary, duration.

### NOT Implemented / Stubs / Gaps
- **`notifyParentSession()` has ZERO callers in the codebase** (confirmed by grep): This function and `buildNotificationMessage()`, `formatToastMessage()`, `buildTaskNotificationFromContinuity()` are all dead code from the old notification system. Only `notifyDelegationTerminal()` is actively used (called from `delegation-manager.ts:322`).
- **`notifyDelegationTerminal()` uses raw JSON string** (lines 199–204): The parent session receives a JSON string in a text part. There is no structured schema validation on the parent side.
- **`notifyDelegationTerminal()` does not include `result` field** (line 195): Only `resultSummary` (truncated) is sent, not the full `delegation.result`. Parents cannot access complete output without calling `getStatus`.

### Tested
- `tests/lib/notification-handler.test.ts` (262 lines) — `buildNotificationMessage`, `formatToastMessage`, `notifyParentSession`, `buildTaskNotificationFromContinuity`.

### NOT Tested
- **`notifyDelegationTerminal()`**: Zero tests. This is the ONLY actively-used notification function and it is completely untested.
- **Notification delivery failure path**: `catch (error)` at line 211 logs to stderr but no test verifies the log format or behavior.
- **`buildTaskNotificationFromContinuity()` with `capturedResult`**: The artifact/commit/preview branches (lines 115–126) are not tested.

### Bugs
- **`notifyDelegationTerminal()` sends `resultSummary` that may be empty string** (lines 194–197): If both `delegation.result` and `delegation.error` are undefined/empty, `resultSummary` becomes `""`. Then line 202 sets `resultSummary: resultSummary || undefined` — but the JSON.stringify will omit the key entirely. Parent receives no summary. Not a crash but an information gap.
- **Duration calculation may be negative** (lines 190–192): If `completedAt` is somehow less than `createdAt` (clock skew), duration is negative. No guard.

---

## 5. `src/lib/lifecycle-manager.ts` (152 lines)

### Responsibility
Session lifecycle state machine — **STUB**. Provides `isValidTransition()`, `hydrateFromContinuity()`, `handleEvent()`, `cancelDelegatedSession()`, `launchDelegatedSession()`, and wraps `CompletionDetector`.

### Code Paths
1. `isValidTransition()` (lines 39–43): Stub — always returns `true`.
2. `HarnessLifecycleManager` class (lines 45–146): Holds `CompletionDetector`, `client`, optional `delegationManager`.
3. `hydrateFromContinuity()` (lines 64–70): Iterates continuity records, hydrates delegation state.
4. `handleEvent()` (lines 80–90): Extracts status signal from event, feeds `completionDetector` for idle detection.
5. `cancelDelegatedSession()` (lines 92–108): Best-effort abort, cancels completion detector, patches continuity.
6. `launchDelegatedSession()` (lines 126–141: Facade over `delegationManager.dispatch()`.
7. `requestAutoLoopRetry()` (lines 110–119): Sends prompt to session.

### NOT Implemented / Stubs / Gaps
- **`isValidTransition()` is a complete stub** (line 39–43): Comment says "Full validation restored in Plan 14-02." This is a known gap.
- **`noteObservedActivity()` is no-op** (lines 76–78): Comment says "No-op stub — full implementation in Plan 14-02."
- **`backgroundManager` is typed as `unknown`** (line 23): Never used.
- **`CompletionDetector` is instantiated but never wired to delegation completion** (line 47): The `lifecycle-manager` feeds it events, but `DelegationManager` does not call `lifecycleManager.getCompletionDetector()` or use its results. Two independent completion detection systems exist:
  - `CompletionDetector` in `lifecycle-manager` (event-driven idle)
  - `SdkDelegationHandler.performStabilityPoll()` (message-count-driven idle)
  They do not share state or cross-validate.
- **`concurrencyLimit` from env** (lines 54–57): Reads `OPENCODE_HARNESS_CONCURRENCY_LIMIT`, defaults to 3. Not connected to `DelegationConcurrencyQueue` which has its own default of 3.

### Tested
- **No dedicated test file exists** (`tests/lib/lifecycle-manager.test.ts` does not exist).

### NOT Tested
- Entire file is effectively untested except indirectly through integration.

### Bugs
- **`handleEvent()` swallows non-idle events** (lines 80–90): Only `statusSignal === "idle"` or `eventType === "session.idle"` are fed to `CompletionDetector`. `session.error`, `session.deleted`, and tool-activity events are ignored by the lifecycle manager's completion detector, even though `CompletionDetector.feed()` supports them.
- **`launchDelegatedSession()` ignores `constraints` and `model` params partially** (lines 131–138): `model` is passed to `dispatch()` but `constraints` are dropped.

---

## 6. `src/lib/continuity.ts` (405 lines)

### Responsibility
Durable JSON persistence + normalization + deep-clone for session continuity and governance state.

### Code Paths
1. `resolveContinuityFilePath()` (lines 26–35): Resolves from env or default.
2. `loadStoreFromDisk()` (lines 218–259): Reads JSON, normalizes sessions, validates governance.
3. `persistStore()` (lines 261–271): Atomic write via temp file + rename.
4. `recordSessionContinuity()` (lines 298–310): Writes full record.
5. `patchSessionContinuity()` (lines 312–353): Merges partial metadata patch.
6. `patchSessionDelegationPacket()` (lines 355–375): Specialized patch for delegation packet.
7. `normalizeContinuityRecord()` (lines 128–165): Normalizes raw JSON into `SessionContinuityRecord`.
8. Clone functions (lines 62–122): Deep-clone-on-read for all nested structures.

### NOT Implemented / Stubs / Gaps
- **`storeCache` is module-level singleton** (line 19): Prevents isolated unit testing. Comment in AGENTS.md acknowledges this as code smell.
- **`asString` is duplicated** from `helpers.ts` — acknowledged in AGENTS.md.
- **`normalizeContinuityRecord()` does not validate `delegationPacket.spec`** (lines 78–86): `cloneDelegationPacket()` clones `parentChain` and `artifacts` but does not validate spec structure.

### Tested
- No dedicated test file (`tests/lib/continuity.test.ts` does not exist).
- Indirectly tested via `delegation-manager.test.ts` persistence assertions.

### NOT Tested
- **`loadStoreFromDisk()` corruption handling**: Empty file, invalid JSON, missing `sessions` object, `isParsedStore()` false path.
- **`persistStore()` atomic write failure**: What if `writeFileSync` or `renameSync` throws?
- **`patchSessionContinuity()` with `undefined` current record**: Line 317–320 early return.
- **`cloneGovernanceState()`**: No tests for governance persistence.
- **`deleteSessionContinuity()`**: No tests.

### Bugs
- **`normalizeContinuityRecord()` unsafe type assertions** (lines 148–159): Multiple `as` casts (e.g., `meta.status as SessionContinuityMetadata["status"]`) assume valid strings. If the JSON contains an invalid status string, it passes through unchecked.
- **`persistStore()` race condition**: Atomic rename prevents corrupt reads but multiple concurrent `persistStore()` calls from different async contexts can interleave writes. No file-level locking.
- **`patchSessionContinuity()` does not deep-merge nested objects** (lines 322–348): It replaces top-level metadata fields and conditionally clones nested ones, but if `patch.constraints` is provided, it replaces entirely rather than merging. This is by design but could lose data.

---

## 7. `src/lib/state.ts` (251 lines)

### Responsibility
In-memory Maps for session stats, root budgets, session-to-root mapping, delegation metadata, and subagent registry.

### Code Paths
1. `TaskStateManager` class (lines 8–182): Encapsulates all Maps.
2. `ensureStats()`, `getStats()`, `addWarning()`, `resetStats()` (lines 19–51).
3. `reserveDescendant()`, `commitDescendant()`, `rollbackReservation()` (lines 57–99).
4. `setSessionRoot()`, `getSessionRoot()`, `inheritRootFromParent()` (lines 105–116).
5. `getDelegationMeta()`, `setDelegationMeta()`, `hydrateDelegationState()` (lines 122–135).
6. `registerSubagent()`, `getSubagents()` (lines 141–152).
7. `forgetSession()`, `clear()` (lines 158–181).
8. Backward-compatible wrapper functions (lines 195–251).

### NOT Implemented / Stubs / Gaps
- **`commitDescendant()` does not check if sessionID already committed** (lines 85–91): Calling twice adds to `descendants` Set (idempotent) but decrements `reserved` again on second call. Actually, `descendants.add()` is idempotent but `reserved = Math.max(0, reserved - 1)` would underflow if called twice. This is a bug.

### Tested
- `tests/lib/state.test.ts` (207 lines) — construction, session stats, root budget, session-to-root mapping, delegation metadata, subagent registry, cleanup.

### NOT Tested
- **`hydrateDelegationState()`**: No test verifies the full hydration path (lines 130–135).
- **`inheritRootFromParent()`**: No test.
- **`forgetSession()` when session has no rootID**: The `if (rootID)` branch (line 161) is tested but not the case where rootID is undefined.
- **Double `commitDescendant()` bug**: Not tested.

### Bugs
- **`commitDescendant()` double-call underflow** (line 87): If called twice for same `sessionID`, `budget.reserved` is decremented twice but `descendants.add()` is idempotent. If `reserved` was 1, it becomes -1 → `Math.max(0, -1)` = 0. If called a third time, it becomes -1 again. Not catastrophic due to `Math.max` but indicates logic flaw.
- **`forgetSession()` does not remove session from parent subagent registries** (lines 158–173): If `sid-forget` is a child in `subagentSessions.get("parent-X")`, `forgetSession("sid-forget")` only deletes `subagentSessions.delete("sid-forget")` (the session as a parent), not the session as a child of other parents. Children remain orphaned in parent Sets.

---

## 8. `src/lib/completion-detector.ts` (126 lines)

### Responsibility
Two-signal completion detection: session.idle + stability timer.

### Code Paths
1. `feed()` (lines 28–55): Maps terminal events to signals, clears stability timer, resolves watcher or caches result.
2. `watch()` (lines 57–72): Returns cached result or creates watcher with timeout.
3. `cancel()` (lines 74–85): Cancels watcher or caches cancelled.
4. `feedMessageCount()` (lines 87–98): Tracks message counts, starts/resets stability timer.
5. `startStabilityTimer()` (lines 100–116): Sets timeout that resolves idle when message count stable.
6. `clearStabilityTimer()` (lines 118–125): Clears timer and removes count.

### NOT Implemented / Stubs / Gaps
- **No crash signal**: `session.idle` from a crashed agent is indistinguishable from normal completion. Documented in `completion-detector-crash.test.ts` as GAP G-2.
- **`feed()` does not cache `session.idle`** (lines 51–53): Idle events are NOT cached if no watcher exists. This means if `feed("session.idle")` fires before `watch()`, a subsequent `watch()` will timeout instead of resolving idle. This is by design (commented in crash tests) but creates a gap where fast completions can be missed.

### Tested
- `tests/lib/completion-detector.test.ts` (326 lines) — feed+watch, cache before watch, timeout, cancel, feedMessageCount stability, multiple sessions, input guards.
- `tests/lib/completion-detector-crash.test.ts` (238 lines) — crash scenarios, stability heuristic, session.error, session.deleted, cached results.

### NOT Tested
- **`clearStabilityTimer()` when timer already fired**: The timer callback at lines 101–116 deletes from `stabilityTimers` and `messageCounts`. Calling `clearStabilityTimer()` after the timer fires is a no-op but not tested.
- **`feedMessageCount()` with `count == null`**: The guard at line 88 (`count == null`) uses loose equality. Tested with `NaN`, `undefined`, `-1`, `0`, and positive integers, but not with `null` explicitly.

### Bugs
- **Loose equality in `feedMessageCount()`** (line 88): `count == null` catches both `null` and `undefined`. This is intentional but inconsistent with strict TypeScript style elsewhere.
- **Cached `idle` from stability timer vs. cached `error`/`deleted` asymmetry**: `feed()` does not cache idle (line 51–53) but `startStabilityTimer()` DOES cache idle (line 111). This means idle from `feedMessageCount` is cached but idle from `feed("session.idle")` is not. Inconsistent behavior.

---

## 9. `src/lib/task-status.ts` (22 lines)

### Responsibility
Task status type system + transition guards.

### Code Paths
1. `VALID_TASK_STATUSES` (line 3): Array of 8 statuses.
2. `VALID_TRANSITIONS` (lines 5–14): Transition map.
3. `canTransition()` (lines 16–18): Lookup guard.
4. `isTerminal()` (lines 20–22): Terminal check.

### NOT Implemented / Stubs / Gaps
- **Delegations use a DIFFERENT status type**: `Delegation.status` is typed as `DelegationStatus` (from `types.ts`) which is `"pending" | "queued" | "running" | "completed" | "error" | "timeout" | "cancelled"`. This includes `"timeout"` but NOT `"failed"` or `"interrupt"` from `TaskStatus`. The `task-status.ts` module is NOT used by delegation-manager; delegations have their own status union. This is architectural drift.

### Tested
- `tests/lib/task-status.test.ts` (199 lines) — exhaustive transition and terminal tests.

### NOT Tested
- Nothing significant untested; the module is trivial.

### Bugs
- **Architectural drift**: `task-status.ts` defines a 7-value `TaskStatus` (actually 8 with "interrupt") but `Delegation` uses a 7-value `DelegationStatus` that swaps `"failed"` and `"interrupt"` for `"timeout"`. Two parallel status systems exist. `canTransition()` and `isTerminal()` are unused by the delegation flow.

---

## 10. `src/lib/concurrency.ts` (304 lines)

### Responsibility
Keyed semaphore (FIFO queue per model+agent+category key) + spawn reservation budget tracking.

### Code Paths
1. `buildDelegationQueueKey()` (lines 27–58): Canonical key builder with fallback dimensions.
2. `DelegationConcurrencyQueue` class (lines 62–225): `acquire()`, `enqueue()`, `dequeue()`, `peek()`, `queueSize()`, `snapshot()`.
3. `reserveSubagentSpawn()` (lines 272–303): Budget-aware reservation with release/rollback.

### NOT Implemented / Stubs / Gaps
- **`enqueue()`/`dequeue()` are not used by `DelegationManager`**: The queue has task enqueue/dequeue API but `DelegationManager` only uses `acquire()`/`release()`. The task queue system appears to be a planned but unused feature.
- **`acquire()` timeout only rejects the pending promise** (lines 79–98): It does not remove the resolver from `lane.pending` via the timeout callback, but the callback does splice the resolver out. This is correct but the timeout callback stores `resolve` in `lane.pending` and then tries to find it by reference. If the same resolver is queued twice (bug unlikely), `indexOf` would find the first.

### Tested
- `tests/lib/concurrency.test.ts` (432 lines) — acquire/release, timeout, edge cases, queue key building, spawn reservation.

### NOT Tested
- **`snapshot()`**: No test.
- **`dequeue()` by taskID**: Lines 120–122 — the `taskID` path is not tested.
- **`cleanupLane()` when lane becomes empty**: Indirectly tested but not explicitly verified.
- **`reserveSubagentSpawn()` with custom `maxDescendants`**: Not tested.

### Bugs
- **`makeRelease()` does not handle double-release with concurrent next pending** (lines 205–224): If `release()` is called, it sets `released = true`, then shifts `next` from `lane.pending`. If a second `release()` is called on the same release function, it returns early. But if the first release's `next()` callback is invoked synchronously and that callback also tries to release, the idempotency of `makeRelease()` handles it. This is actually safe.
- **`lane.limit` can be changed per-acquire but is sticky** (line 69): `acquire(key, limit)` uses `limit` when creating the lane but subsequent acquires with different limits reuse the lane with the original limit. This means the first caller's limit sticks for the lifetime of the lane.

---

## 11. `src/lib/runtime.ts` (95 lines)

### Responsibility
Event→status mapping only. Infers continuity status from transport events.

### Code Paths
1. `getStatusSignal()` (lines 4–24): Extracts status string from multiple nested paths.
2. `inferContinuityStatusFromEvent()` (lines 38–95): Maps signals to continuity statuses with evidence gating.

### NOT Implemented / Stubs / Gaps
- **`requireEvidence` parameter is never used by delegation-manager**: The delegation flow does not pass `requireEvidence` or `existingLastToolActivityAt`.

### Tested
- No dedicated test file (`tests/lib/runtime.test.ts` does not exist).
- `runtime-policy.test.ts` exists but tests `runtime-policy.ts`, not `runtime.ts`.

### NOT Tested
- All paths untested.

### Bugs
- **`getStatusSignal()` returns `"idle"` for `status.type === "idle"`** but also for `status === "idle"` at path `["status"]`. If an event has `status: { type: "idle", foo: "bar" }`, it extracts `"idle"` correctly. If `status` is a number or object, `asString()` returns `""` and it falls through. This is defensive.
- **"busy" signals return current status when `requireEvidence` is true** (lines 69–71): If `args.currentStatus` is undefined, returns `undefined`. This could lose the "running" inference.

---

## 12. `src/shared/tool-response.ts` (71 lines)

### Responsibility
Standard tool-response envelope for prompt-enhance pipeline.

### Code Paths
1. `success()`, `error()`, `pending()` (lines 19–53): Response constructors.
2. `isSuccess()`, `isError()` (lines 58–71): Type guards.

### NOT Implemented / Stubs / Gaps
- `isPending()` type guard is missing. Only `isSuccess` and `isError` exist.

### Tested
- No dedicated test file (`tests/shared/tool-response.test.ts` does not exist).

### NOT Tested
- Entire file untested.

### Bugs
- None significant.

---

## 13. `src/shared/tool-helpers.ts` (9 lines)

### Responsibility
Render tool result as JSON string.

### Code Paths
1. `renderToolResult()` (lines 7–9): `JSON.stringify(result, null, 2)`.

### NOT Implemented / Stubs / Gaps
- Trivial; no gaps.

### Tested
- No dedicated test file.

### NOT Tested
- Entire file untested.

### Bugs
- `JSON.stringify` on circular objects will throw. No `try/catch`. This is a known JavaScript behavior but unhandled.

---

## Cross-File Integration Gaps

### Gap I-1: `CompletionDetector` is orphaned
**Files:** `lifecycle-manager.ts`, `delegation-manager.ts`, `sdk-delegation.ts`
- `lifecycle-manager.ts` instantiates `CompletionDetector` and feeds it events (line 88).
- `delegation-manager.ts` never reads from this `CompletionDetector`.
- `sdk-delegation.ts` implements its own completion detection via `performStabilityPoll()`.
- **Result:** Two independent completion detection systems. The `CompletionDetector` in `lifecycle-manager` is dead weight for delegation flow.

### Gap I-2: `TaskStatus` vs `DelegationStatus` drift
**Files:** `task-status.ts`, `types.ts`
- `task-status.ts` defines 8-value `TaskStatus` with `"failed"`, `"interrupt"`.
- `types.ts` defines 7-value `DelegationStatus` with `"timeout"` instead.
- `delegation-manager.ts` uses `DelegationStatus` exclusively.
- `task-status.ts` is effectively unused by the delegation subsystem.

### Gap I-3: Notification system split
**Files:** `notification-handler.ts`, `delegation-manager.ts`
- `notifyDelegationTerminal()` (new, JSON payload) is actively used.
- `notifyParentSession()` + `buildNotificationMessage()` + `formatToastMessage()` + `buildTaskNotificationFromContinuity()` (old, system-reminder style) are dead code with zero callers.
- **Risk:** Dead code bloat and maintenance burden.

### Gap I-4: Concurrency limit inconsistency
**Files:** `lifecycle-manager.ts`, `concurrency.ts`
- `lifecycle-manager.ts` reads `OPENCODE_HARNESS_CONCURRENCY_LIMIT` (line 54).
- `concurrency.ts` `DelegationConcurrencyQueue` uses `DEFAULT_CONCURRENCY_LIMIT = 3` (line 60).
- These are not connected. Changing the env var does not affect delegation queue limits.

### Gap I-5: Headless command unrecoverable
**Files:** `command-delegation.ts`, `delegation-manager.ts`
- `recoverPending()` marks all headless command delegations as error (lines 209–212).
- No headless command state is persisted beyond the delegation record.
- **Result:** All headless commands are lost on process restart.

### Gap I-6: Environment variable whitelist too restrictive
**Files:** `command-delegation.ts`
- `buildMinimalEnv()` only allows `PATH`, `HOME`, `TERM`, `LANG`, `PWD`.
- Commands that need `USER`, `SHELL`, `TMPDIR`, `NODE_ENV`, `OPENCODE_*` env vars will fail.

---

## Severity Summary

| Severity | Count | Categories |
|----------|-------|------------|
| **Critical** | 1 | Headless `exitCode ?? 0` treats signal-kill as success (`command-delegation.ts:188`) |
| **Warning** | 6 | Dead code (notification-handler), double-commit underflow (state.ts), orphaned CompletionDetector, unrecoverable headless commands, stale timeout / safety ceiling non-coordination, memory leak in headlessCommands |
| **Info** | 8 | Missing tests (notifyDelegationTerminal, lifecycle-manager, runtime.ts, tool-response, tool-helpers, pruneCompletedDelegations, validateAgent Zod fallback, commitDescendant double-call), architectural drift (TaskStatus vs DelegationStatus) |

---

*End of INVESTIGATOR-B Audit Report*
