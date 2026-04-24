# Phase 16/16.2 Comprehensive Forensic Audit & Gap Analysis
**Date:** 2026-04-23
**Scope:** Full delegation subsystem — src/lib/, src/hooks/, src/tools/, tests/
**Methodology:** 4 parallel subagent investigations + SPEC cross-reference
**Evidence Standard:** Every claim cites file:line; no assumptions

---

## Executive Summary

Phase 16.2 implemented **dispatch, status polling, and fire-and-forget notification** correctly. However, **5 critical gaps** make the delegation workflow non-functional for real agent use:

1. **Parent session never resumes** when child completes (orphaned notifications)
2. **`noReply: true` on notifications** prevents platform from generating assistant response
3. **`replayPendingNotificationsForEvent()` is broken** — clears queue without delivering
4. **`command-delegation.ts` treats signal-kill as success** — `exitCode ?? 0` bug
5. **Zero test coverage for hooks and notification delivery**

The UAT session (`ses_2491`) confirms: 78% of terminal states arrived after the parent had already declared work complete. Results were delivered as raw JSON blobs with no routing, no resumption, and no integration.

---

## Findings Cross-Referenced Against 16.2-SPEC

### SPEC Coverage Matrix

| SPEC ID | Requirement | Status in Code | Test Coverage | Gap Severity |
|---------|-------------|----------------|---------------|--------------|
| R-PTY-01 | Command → PTY primary | ✅ Implemented | Partial | — |
| R-PTY-02 | PTY output captured | ✅ Implemented | Partial | — |
| R-PTY-03 | PTY lifecycle transitions | ✅ Implemented | Partial | — |
| R-PTY-04 | SDK uses `client.session.prompt()` | ✅ Implemented | Yes | — |
| R-PTY-05 | PTY failures propagate | ⚠️ **BUG** — `exitCode ?? 0` | No | **CRITICAL** |
| R-LC-01 | Grace period timer | ✅ Implemented | Yes (1989-2034) | — |
| R-LC-02 | Grace period retrieval | ✅ Implemented | Partial | Minor |
| R-LC-03 | Grace expiry cleanup | ⚠️ Partial | No | Medium |
| R-LC-04 | Persistence file protected | ✅ Implemented | No | Medium |
| R-LC-05 | Unified `transitionToTerminal()` | ✅ Implemented | Partial | — |
| R-NOTIF-01 | Parent notified on terminal | ✅ **BROKEN** — orphaned JSON | No | **CRITICAL** |
| R-NOTIF-02 | Payload format | ✅ Implemented | No | High |
| R-NOTIF-03 | Notification failure non-blocking | ✅ Implemented | No | Medium |
| R-NOTIF-04 | Direct SDK call | ✅ Implemented | No | Medium |
| R-POLL-01 | Adaptive intervals | ✅ Implemented | Yes | — |
| R-POLL-02 | Fast completion deferral | ❌ Not found | No | High |
| R-POLL-03 | Stale session detection | ❌ Not found | No | High |
| R-POLL-04 | Dual stability gate | ✅ Implemented | Yes | — |
| R-NEST-01 | Nesting depth tracked | ✅ Implemented | Yes | — |
| R-NEST-02 | Default max depth 3 | ✅ Implemented | Yes | — |
| R-NEST-03 | Over-depth fails fast | ✅ Implemented | Yes | — |
| R-OBS-01 | All transitions logged | ⚠️ Partial | No | Medium |
| R-OBS-02 | Structured total count | ❌ Not found | No | Low |
| R-OBS-03 | Terminal path integration tests | ❌ **MISSING 4/6 paths** | No | **CRITICAL** |

**Coverage Score:** 14/24 implemented correctly (58%), 4 implemented but broken (17%), 6 missing (25%)

---

## Critical Finding 1: No Parent Session Resumption Mechanism

**Evidence:**
- INVESTIGATOR-C: *"NO RESUMPTION MECHANISM FOUND"* — searched all hooks, tools, lib files
- `src/hooks/create-session-hooks.ts:200-201`: *"Parent auto-loop stripped in 14-01 clean slate"*
- `src/lib/lifecycle-manager.ts:2-6`: Explicit stub — *"Plan 14-02 will replace this with a full implementation"*
- `src/lib/completion-detector.ts`: Only tracks child sessions, never wired to parent resumption
- UAT artifact: 7 of 9 terminal states arrived as orphaned JSON with no Assistant response

**Root Cause:** Phase 16.2 explicitly excluded session resumption from scope (SPEC Section 7: "Notification via webhooks/external channels" excluded). The design assumed `noReply: true` fire-and-forget was sufficient. It is not.

**Impact:** Parent agent cannot build workflows that depend on delegation results. Every delegation is a "hope and pray" — the parent has no mechanism to wait, resume, or integrate.

### Options (3+):

**Option A: Implement Blocking `waitForCompletion` Mode in `delegate-task`**
- Add `waitForCompletion: boolean` parameter (default `false`)
- When `true`, tool internally polls `delegation-status` until terminal state before returning
- Returns full result to parent agent in single tool call

**Pros:** Minimal API change; addresses 90% of use cases; no lifecycle manager needed
**Cons:** Blocks parent session (cannot do other work); doesn't solve batch wait scenarios
**Best for:** Simple sequential delegations where parent has nothing else to do

**Option B: Implement Session Resumption via `noReply: false` + Auto-Loop Hook**
- Change `notifyDelegationTerminal()` to use `noReply: false` instead of `noReply: true`
- This triggers the platform to generate an Assistant response when notification arrives
- Add `create-delegation-hooks.ts` that listens for delegation-completed events and enters auto-loop
- Persist parent session state with `pendingDelegationIds` in continuity store

**Pros:** Proper async workflow; parent can do other work; results integrated conversationally
**Cons:** Requires lifecycle manager implementation; `noReply: false` may have platform-side edge cases
**Best for:** Long-running background tasks where parent should continue working

**Option C: Add `wait-for-delegations` Tool (Batch Blocking)**
- New tool: `{ delegationIds: string[], timeoutMs: number, returnOn: "any" | "all" }`
- Blocks until specified delegations reach terminal state
- Returns aggregated results

**Pros:** Composable; explicit; doesn't change `delegate-task` behavior
**Cons:** Agent must remember to call it; doesn't solve notification queuing
**Best for:** Batch operations where parent dispatches N tasks then waits for all

**Option D: Hybrid — Blocking Mode + Batch Tool + Fixed Replay (RECOMMENDED)**
Combine A + C + partial B:
1. **Add `waitForCompletion` to `delegate-task`** (Option A) for simple cases
2. **Add `wait-for-delegations` tool** (Option C) for batch operations
3. **Fix `replayPendingNotificationsForEvent()`** to actually replay (Option B, partial)
4. **Document** that full session resumption is Phase 13+ scope

**Why D is best:** Addresses immediate user pain (blocking mode) without requiring full lifecycle manager rebuild. Batch tool covers common multi-delegation pattern. Fixing replay prevents notification loss. Scope remains bounded to Phase 16.2.

---

## Critical Finding 2: `noReply: true` Prevents Conversation Resumption

**Evidence:**
- `src/lib/notification-handler.ts:208-210`:
```typescript
await client.session.prompt({
  path: { id: delegation.parentSessionId },
  body: { noReply: true, parts: [{ type: "text", text: message }] },
})
```
- INVESTIGATOR-C: *"`noReply: true` means: 'Deliver this message but do NOT generate an assistant response'"*
- UAT artifact lines 996, 1000, 1512-1548: Terminal states arrive as raw `## User` JSON with no Assistant reply

**Root Cause:** SPEC R-NOTIF-04 says "direct SDK call with fire-and-forget semantics" but doesn't specify `noReply` value. Implementer chose `true` to avoid "unwanted" responses, inadvertently killing resumption.

**Impact:** Even if a resumption mechanism existed, the notification wouldn't trigger it. The message is injected as dead text.

### Options:

**Option A: Change to `noReply: false` (Simple Fix)**
- Single-line change: `noReply: false`
- Platform generates Assistant response when notification arrives
- Assistant can then process the result

**Pros:** One-line fix; enables conversational resumption
**Cons:** May generate unwanted Assistant responses in some contexts; platform behavior may vary
**Risk:** MEDIUM — needs runtime verification

**Option B: Make `noReply` Configurable per Delegation**
- Add `notifyWithReply: boolean` to `DelegateTaskInputSchema`
- Default `false` for backward compatibility
- When `true`, use `noReply: false`

**Pros:** Backward compatible; explicit control
**Cons:** Adds API surface; most users won't know when to use it
**Risk:** LOW

**Option C: Use `noReply: true` + Explicit Session Wake (RECOMMENDED)**
- Keep `noReply: true` for fire-and-forget safety
- Add separate "wake parent" mechanism: `client.session.createMessage()` or platform-specific wake API
- If no wake API exists, use `noReply: false` as fallback

**Why C is best:** Preserves fire-and-forget safety while still enabling resumption. Requires investigating if OpenCode has a wake API. If not, falls back to A.

---

## Critical Finding 3: `replayPendingNotificationsForEvent()` Is Broken

**Evidence:**
- `src/hooks/create-core-hooks.ts:52-76`:
```typescript
const replayPendingNotificationsForEvent = async (
  sessionID: string,
  eventType: string,
): Promise<void> => {
  const continuity = getSessionContinuity(sessionID)
  const pendingNotifications = continuity?.metadata.pendingNotifications ?? []
  if (pendingNotifications.length === 0) { return }

  const shouldReplay =
    (eventType === "session.created" && continuity?.metadata.lifecycle?.phase === "created") ||
    eventType === "session.updated"

  if (!shouldReplay) { return }

  // Clear pending notifications after replay attempt
  try {
    patchSessionContinuity(sessionID, { pendingNotifications: [] })
  } catch {
    // Best-effort replay
  }
}
```
- INVESTIGATOR-C: *"The function claims to replay pending notifications but NEVER actually delivers them"*
- No loop over `pendingNotifications`; no delivery call; just clears the array

**Root Cause:** Implementation was abandoned mid-way. The function was written to clear the queue but the delivery loop was never added.

**Impact:** If parent session restarts, any queued notifications are silently lost. This is supposed to be the recovery mechanism for missed notifications.

### Options:

**Option A: Complete the Implementation (Add Delivery Loop)**
```typescript
for (const notification of pendingNotifications) {
  await client.session.prompt({
    path: { id: sessionID },
    body: { noReply: false, parts: [{ type: "text", text: notification }] }
  })
}
```

**Pros:** Fixes the bug; enables notification recovery
**Cons:** Requires `client` reference in hooks; may need architectural change
**Risk:** LOW

**Option B: Remove the Function and Document Limitation**
- Delete `replayPendingNotificationsForEvent()`
- Document that notification replay is not supported
- Rely on `delegation-status` polling for recovery

**Pros:** Removes broken code; honest about limitations
**Cons:** Users lose notification recovery; not a real fix
**Risk:** LOW

**Option C: Move Replay to `delegation-status` Tool (RECOMMENDED)**
- When `delegation-status` is called, check `pendingNotifications` for that session
- Return pending notifications in the response
- Agent can then process them explicitly

**Why C is best:** Doesn't require `client` reference in hooks; leverages existing polling pattern; keeps recovery explicit and testable.

---

## Critical Finding 4: `command-delegation.ts` Treats Signal-Kill as Success

**Evidence:**
- `src/lib/command-delegation.ts:188`:
```typescript
const exitCode = delegation.ptySessionId
  ? ptyManager.getExitCode(delegation.ptySessionId) ?? 0
  : headlessProcess.exitCode ?? 0
```
- INVESTIGATOR-B: *"Headless `exitCode ?? 0` treats signal-kill as success"*
- If process is killed by signal (e.g., SIGTERM), `exitCode` is `null` but `signal` is set
- `?? 0` converts `null` to `0`, marking it as success

**Root Cause:** Code only checks `exitCode`, not `signal`. Null coalescing hides signal termination.

**Impact:** Delegations killed by OOM killer or manual intervention appear as "completed" instead of "error".

### Options:

**Option A: Check `signal` Before Coalescing**
```typescript
const exitCode = delegation.ptySessionId
  ? ptyManager.getExitCode(delegation.ptySessionId)
  : headlessProcess.exitCode
const signal = headlessProcess.signalCode

if (signal !== null) {
  return transitionToTerminal(delegationId, "error", `Killed by signal ${signal}`)
}
if (exitCode === null) {
  return transitionToTerminal(delegationId, "error", "Process exited with unknown code")
}
if (exitCode !== 0) {
  return transitionToTerminal(delegationId, "error", `Exited with code ${exitCode}`)
}
```

**Pros:** Correctly handles all termination cases
**Cons:** Slightly more code
**Risk:** LOW

**Option B: Use `child_process` `exit` Event Properly**
- Listen for `exit` event which provides `(code, signal)`
- Store both on delegation record
- Check signal first in finalization

**Pros:** Clean separation of concerns
**Cons:** Requires refactoring event listeners
**Risk:** MEDIUM

**Option C: Treat Any Non-Zero or Null Exit as Error (Simplest)**
```typescript
const exitCode = headlessProcess.exitCode
if (!exitCode || exitCode !== 0) {
  return transitionToTerminal(delegationId, "error", ...)
}
```

**Pros:** One-line fix
**Cons:** Treats `null` as error even if process hasn't exited yet (race condition)
**Risk:** MEDIUM

**RECOMMENDATION: Option A** — Explicit, correct, no race conditions.

---

## High Finding 5: Zero Test Coverage for Hooks

**Evidence:**
- INVESTIGATOR-D: `create-core-hooks.ts` — **NO TEST FILE**
- INVESTIGATOR-D: `create-session-hooks.ts` — **NO TEST FILE**
- INVESTIGATOR-C: `create-delegation-hooks.ts` — **FILE DOES NOT EXIST**

**Impact:** Hook logic (event routing, auto-loop, replay) is completely unverified. Changes to hooks risk regressions with no detection.

### Options:

**Option A: Write Unit Tests for Each Hook**
- Mock OpenCode plugin API
- Test event routing, auto-loop logic, replay behavior

**Pros:** Fast feedback; isolated testing
**Cons:** Mock-heavy; may not catch integration issues

**Option B: Write Integration Tests with In-Memory SDK Adapter**
- Use D-20 pattern from Phase 9.1: in-memory SDK adapter
- Test hooks with real (but fake) SDK calls

**Pros:** More realistic; catches integration issues
**Cons:** More complex setup

**Option C: Add Hook Tests to Existing Test Files (RECOMMENDED)**
- `tests/lib/delegation-manager.test.ts` already tests delegation lifecycle
- Add hook integration tests that wire real hooks + mock SDK
- Avoid creating new mock-heavy test files

**Why C is best:** Leverages existing test infrastructure; keeps test count manageable; integration-level coverage without full mock ecosystem.

---

## High Finding 6: `notification-handler.ts` Completely Untested

**Evidence:**
- INVESTIGATOR-D: `notification-handler.test.ts` exists (262 lines) but tests only `notifyParentSession()`, not `notifyDelegationTerminal()`
- INVESTIGATOR-B: `notifyDelegationTerminal()` is the ONLY active notification function and is **completely untested**
- INVESTIGATOR-C: `tests/lib/delegation-manager.test.ts:1563` references it in a comment but test does NOT mock `client.session.prompt` for notification

**Impact:** All R-NOTIF requirements (R-NOTIF-01 through R-NOTIF-04) have zero direct test coverage.

### Options:

**Option A: Add Direct Tests to `notification-handler.test.ts`**
- Mock `client.session.prompt`
- Test `notifyDelegationTerminal()` for all terminal states
- Test error handling (try/catch)

**Pros:** Direct coverage; easy to write
**Cons:** Another mock-heavy test file

**Option B: Test Via `delegation-manager.test.ts` Integration**
- Already tests `transitionToTerminal()`
- Add assertions that `client.session.prompt` was called with correct payload

**Pros:** Integration-level; tests the actual call path
**Cons:** Harder to debug failures

**Option C: Both (RECOMMENDED)**
- Unit tests in `notification-handler.test.ts` for payload format, error handling
- Integration tests in `delegation-manager.test.ts` for end-to-end notification path

---

## High Finding 7: Missing Test Files

**Evidence:**
- INVESTIGATOR-D: `tests/lib/continuity.test.ts` — **DOES NOT EXIST**
- INVESTIGATOR-D: `tests/lib/lifecycle-manager.test.ts` — **DOES NOT EXIST**
- INVESTIGATOR-B: `tests/lib/runtime.test.ts` — **DOES NOT EXIST**

**Impact:** Core infrastructure has no regression protection.

### Options:

**Option A: Create Missing Test Files**
- `continuity.test.ts`: Test persistence, hydration, patching
- `lifecycle-manager.test.ts`: Test state transitions (when implemented)
- `runtime.test.ts`: Test event mapping

**Pros:** Complete coverage
**Cons:** Time-consuming; some files are stubs

**Option B: Document as Known Gap and Defer**
- Add to `STATE.md` technical debt table
- Defer to Phase 11 (Clean Architecture Restructuring)

**Pros:** Honest about scope; avoids mock-heavy tests for stubs
**Cons:** No protection against regressions

**Option C: Create Minimal Smoke Tests (RECOMMENDED)**
- `continuity.test.ts`: Test `persistStore()` / `loadStore()` round-trip
- `lifecycle-manager.test.ts`: Test stub throws `[Harness] Not implemented`
- `runtime.test.ts`: Test `requireEvidence` parameter passthrough

**Why C is best:** Low effort; catches basic breakage; doesn't over-invest in stub testing.

---

## High Finding 8: `lifecycle-manager.ts` Is a Stub

**Evidence:**
- `src/lib/lifecycle-manager.ts:2-6`:
```typescript
/**
 * STUB: Plan 14-02 will replace this with a full implementation
 * that manages session lifecycle states and transitions.
 */
```
- INVESTIGATOR-B: `isValidTransition()` is a complete stub
- INVESTIGATOR-B: `CompletionDetector` is orphaned (not wired to DelegationManager)

**Root Cause:** Phase 14-02 was supposed to implement this but never did. The stub was left as a compile-safe placeholder.

**Impact:** Session resumption, lifecycle transitions, and completion detection integration are all blocked.

### Options:

**Option A: Implement Minimal Lifecycle Manager Now**
- Track session states: `idle`, `waiting`, `running`, `completed`
- Wire `CompletionDetector` to transition states
- Enable session resumption

**Pros:** Unblocks resumption
**Cons:** Large scope; risks breaking existing code

**Option B: Remove Stub and Document Dependency**
- Delete `lifecycle-manager.ts`
- Update all imports to remove dependency
- Document that session lifecycle is Phase 13+ scope

**Pros:** Removes dead code; honest about state
**Cons:** Requires refactoring imports

**Option C: Keep Stub, Add Minimal State Tracking (RECOMMENDED)**
- Add `sessionStates: Map<string, SessionState>` to track parent session status
- Add `markWaitingForDelegations(sessionID, delegationIds)` method
- Add `markResumed(sessionID)` method
- Don't implement full state machine — just enough for resumption

**Why C is best:** Minimal viable implementation; unblocks Phase 16.2 resumption without full lifecycle rebuild.

---

## Medium Finding 9: `TaskStatus` vs `DelegationStatus` Drift

**Evidence:**
- INVESTIGATOR-B: `TaskStatus` (8 values) is unused by delegation system
- Delegation system uses `DelegationStatus` (7 values: `dispatched`, `running`, `completed`, `error`, `timeout`, `deleted`, `pruned`)
- Two parallel status systems create confusion

**Impact:** Code maintenance burden; risk of using wrong status type.

### Options:

**Option A: Remove `TaskStatus` and Standardize on `DelegationStatus`**
- Delete `TaskStatus` from `types.ts`
- Update all references

**Pros:** Single source of truth
**Cons:** May break non-delegation code that uses `TaskStatus`

**Option B: Rename `TaskStatus` to `LegacyTaskStatus` and Deprecate**
- Keep for backward compatibility
- Mark as deprecated

**Pros:** Safe; no breakage
**Cons:** Technical debt accumulates

**Option C: Audit All Usage and Consolidate (RECOMMENDED)**
- Search codebase for `TaskStatus` usage
- If only delegation system uses it, remove
- If other modules use it, document the distinction

---

## Medium Finding 10: Concurrency Limit Env Var Not Connected

**Evidence:**
- INVESTIGATOR-B: `OPENCODE_HARNESS_CONCURRENCY_LIMIT` env var exists but is **not connected** to `DelegationConcurrencyQueue`
- `src/lib/concurrency.ts` has `lane.limit` but it's sticky from first acquire

**Impact:** Users cannot configure concurrency limits via environment variable.

### Options:

**Option A: Wire Env Var to `DelegationManager` Constructor**
- Read `OPENCODE_HARNESS_CONCURRENCY_LIMIT` in `plugin.ts`
- Pass to `DelegationManager` which sets queue limit

**Pros:** Simple; addresses user need
**Cons:** Requires plugin.ts change

**Option B: Add RuntimePolicy Integration**
- Use existing `runtime-policy.ts` module
- Load concurrency limit from policy file

**Pros:** Consistent with Phase 02 architecture
**Cons:** More complex; policy file may not exist

**Option C: Both (Env Var + Policy Fallback)**
- Env var takes precedence
- Policy file provides default
- Hardcoded constant is final fallback

**Why C is best:** Follows standard configuration hierarchy.

---

## GSD Routing: Strict Guardrails & Gatekeeping

### What Needs GSD Planning

The following items require formal GSD phase planning:

1. **Phase 16.2 Remediation:** Fix CR-01 through CR-04 (notification, replay, resumption, command-delegation bug)
2. **Phase 16.2 Test Hardening:** Add missing tests for hooks, notifications, terminal paths
3. **Phase 13: Session Resumption + Result Integration** (out of scope for 16.2 but needed for real use)

### Gatekeeping Checklist

Before any implementation:
- [ ] User confirms which Option to pursue for each Critical Finding
- [ ] SPEC is updated to reflect any scope changes
- [ ] Test plan is written before code (TDD)
- [ ] Impact analysis confirms no regression to existing 351 tests
- [ ] Implementation is split into waves (per SPEC Section 9)

### Recommended Next Steps

1. **Immediate (Wave A):** Fix `command-delegation.ts` signal-kill bug (Option A) + add test
2. **Short-term (Wave B):** Fix `replayPendingNotificationsForEvent()` (Option C) + add test
3. **Medium-term (Wave C):** Implement blocking `waitForCompletion` mode (Option D, partial A)
4. **Long-term (Phase 13):** Full session resumption with lifecycle manager

---

*Audit completed by 4 parallel subagents on 2026-04-23*
*Evidence sources: session artifact ses_2491, src/lib/ (13 files), src/hooks/ (2 files), src/tools/ (5 files), tests/ (12 files), 16.2-SPEC*
