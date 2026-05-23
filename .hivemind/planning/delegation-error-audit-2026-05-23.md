[LANGUAGE: Write this file in en per Language Governance.]
# Delegation Sector Error-Handling Audit — manager.ts + coordinator.ts

**Date:** 2026-05-23
**Scope:** `src/coordination/delegation/manager.ts` (362 LOC) + `src/coordination/delegation/coordinator.ts` (445 LOC)

## Summary

Across 807 lines: **2 CRITICAL**, **5 WARNING**, **3 INFO** findings.

---

## CRITICAL

### CR-01: Unhandled promise rejection — `void` on rejecting promise in `coordinator.ts` cleanup

**File:** `src/coordination/delegation/coordinator.ts:358`
**Code:**
```typescript
void this.deps.retryHandler.persistWithRetry(
  this.deps.lifecycle.list?.() ?? [...this.active.values()].map((entry) => entry.record)
)
```
**Issue:** `void` discards the promise. If `persistWithRetry` exhausts all 5 retries AND the degraded fallback `writeDegraded()` throws (disk full, permissions), the rejection is **unhandled**. Node.js emits `unhandledRejection`; future versions may crash on it.

**Fix:** Add `.catch()`:
```typescript
this.deps.retryHandler.persistWithRetry(...).catch((err) => {
  console.error(`[Harness] Failed to persist delegations during cleanup:`, err)
})
```

---

### CR-02: Empty catch swallows ALL `getSessionMessages` errors in `coordinator.ts`

**File:** `src/coordination/delegation/coordinator.ts:104-106`
**Code:**
```typescript
catch (err) {
  // Safe fallback - ignore error getting parent model
}
```
**Issue:** Swallows not just "session not found" but also network failures, auth token expiry, SDK contract violations. No log, no diagnostic. Downstream proceeds with `inheritedModel = undefined`, which may silently use the wrong provider/model.

**Fix:** Log before falling through:
```typescript
catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  void this.deps.client?.app?.log?.({
    body: {
      service: "delegation",
      level: "warn",
      message: `[Harness] Failed to read parent session messages for model inheritance: ${msg}`,
    },
  })
}
```

---

## WARNINGS

### WR-01: 7 `[Harness]` prefix casing violations in `manager.ts`

| Line | Current | Should be |
|------|---------|-----------|
| 181 | `cannot control terminal delegation` | `Cannot control terminal delegation` |
| 186 | `adjust-prompt requires running delegation` | `Adjust-prompt requires running delegation` |
| 200 | `adjust-prompt requires a restartPrompt` | `Adjust-prompt requires a restartPrompt` |
| 207 | `change-agent requires an agent name` | `Change-agent requires an agent name` |
| 213 | `change-agent requires a prompt` | `Change-agent requires a prompt` |
| 225 | `resume/chain requires a prompt` | `Resume/chain requires a prompt` |
| 276 | `restart/resume requires a persisted original prompt or restartPrompt` | `Restart/resume requires a persisted original prompt or restartPrompt` |

Every other `[Harness]` error in both files starts with uppercase. These 7 are inconsistent.

---

### WR-02: Non-404 errors silently fall through in `coordinator.ts` `markExecutionUnconfirmed()`

**File:** `src/coordination/delegation/coordinator.ts:193-201`
**Code:**
```typescript
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes("404") || msg.includes("not found")) {
    record.error = `[Harness] Child session ${record.childSessionId} was deleted or not found`
    record.executionState = "stalled"
    this.failDispatch(delegationId, new Error(record.error))
    return
  }
  // <-- NON-404 ERRORS FALL THROUGH SILENTLY
}
```
**Impact:** A transient network error during `getSessionMessages` is invisible. The method then proceeds to evaluate `elapsedSeconds >= 60` and may incorrectly mark the delegation as "stalled" when the real issue is a failed read.

**Fix:** Log non-404 errors:
```typescript
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes("404") || msg.includes("not found")) {
    // ... existing 404 handling ...
    return
  }
  void this.deps.client?.app?.log?.({
    body: {
      service: "delegation",
      level: "warn",
      message: `[Harness] Failed to check child session messages for ${delegationId}: ${msg}`,
    },
  })
}
```

---

### WR-03: `coordinator.ts` `chain()` lacks error handling around all async calls

**File:** `src/coordination/delegation/coordinator.ts:304-331`
**Issue:** `sendPromptAsync` (L310) and `this.dispatch` (L318) are called without try/catch. If step 3 of 5 fails, steps 1-2 succeeded but partial results are lost — the method throws, discarding all progress.

**Fix:** Wrap loop body in try/catch, capturing failure as a result entry:
```typescript
try {
  // ... existing logic ...
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  results.push({
    delegationId: this.createDelegationId(),
    status: "error",
    error: `[Harness] Chain step ${index} failed: ${msg}`,
  })
  break
}
```

---

### WR-04: `coordinator.ts` `cleanup()` has no exception safety — partial failure skips remaining cleanup

**File:** `src/coordination/delegation/coordinator.ts:343-359`
**Issue:** Sequential 7-step cleanup without try/catch. If `slotHandle.release()` or `detector.unwatch()` throws (step 7-8), steps 9-11 (deregister, map deletions, persist) are skipped, leaking router registrations and stale session mappings.

**Fix:** Wrap in try/catch + finally:
```typescript
try {
  active.slotHandle.release()
  this.deps.detector.unwatch(delegationId)
  this.deps.notificationRouter.deregister(delegationId)
} catch (err) {
  console.error(`[Harness] Cleanup error for delegation ${delegationId}:`, err)
} finally {
  this.active.delete(delegationId)
  this.delegationByChildSession.delete(active.record.childSessionId)
  void this.deps.retryHandler.persistWithRetry(...)
}
```

---

### WR-05: `coordinator.ts` `controlDelegation()` nativeTask catch re-throws — caller may not handle

**File:** `src/coordination/delegation/manager.ts:291-298`
**Code:**
```typescript
try {
  const nativeResult = await request.nativeTask({...})
  // ...
} catch (caughtError) {
  this.options.coordinator?.failDispatch?.(replacement.delegationId, caughtError)
  throw caughtError  // <-- re-throws to caller
}
```
**Issue:** The method catches the nativeTask error, properly fails the replacement delegation, but then **re-throws**. This means the original caller of `controlDelegation()` gets the raw error — not a structured `DelegationResult`. If the caller is a tool handler, the tool will show the unformatted error to the user.

This is by design for the native task path (the caller initiated the work), but unlike every other error path in this method which returns `DelegationResult`, this path re-throws an opaque error.

**Severity:** Warning — not a correctness bug but a behavioral inconsistency.

---

## INFO

### IN-01: `coordinator.ts` `dispatch()` monitors with placeholder childSessionId before real session

**File:** `src/coordination/delegation/coordinator.ts:109-135`
**Issue:** When `childSessionStarter` is not configured (falsy at L109), the method skips the try/catch and proceeds to L128-134 which call `monitor.start()` and `detector.watchDualSignal()` with `record.childSessionId`. The `createRecord` at L434 sets `childSessionId: delegationId` — a synthetic UUID, not a real OpenCode session. The completion detector will be watching a non-existent session ID.

---

### IN-02: `coordinator.ts` `dispatched` return when `childSessionStarter` is present but succeeds very fast

**File:** `src/coordination/delegation/coordinator.ts:133-134`
**Issue:** The return status is read from `this.deps.lifecycle.getStatus?.(delegationId)?.status ?? "dispatched"`. If `childSessionStarter.start()` resolves but the subsequent `lifecycle.transition(delegationId, "running")` at L122 happens before the getStatus read, the status is `"running"`. If `transition()` fails silently (returns false due to invalid state), status remains `"dispatched"`. The caller sees a non-terminal `"dispatched"` status but the child session may already be running.

---

### IN-03: `manager.ts` property getters throw when runtime is null — intentional but undocumented

**File:** `src/coordination/delegation/manager.ts:332-338`
**Issue:** Getters (`stabilityTimers`, `delegations`, etc.) call `this.requireRuntime()` which throws `[Harness] DelegationManager runtime adapter is not configured.`. If any test or caller accesses a property when in v2-only mode (no client), they get an exception. This is intentional but has no JSDoc warning.

---

## Unhandled Promise Rejections (Summary)

| Location | Risk | Status |
|----------|------|--------|
| `coordinator.ts:358` `void persistWithRetry(...)` | **Unhandled rejection** if `writeDegraded` throws | **OPEN** — see CR-01 |
| `manager.ts:215` `coordinator?.abortDelegation(...)` | Safe — sync method | ✅ |
| `manager.ts:217` `await sendPromptAsync(...)` | Await is captured | ✅ |
| `manager.ts:291` `await request.nativeTask(...)` | Caught by try/catch | ✅ |
| `coordinator.ts:86` `await getSessionMessages(...)` | Caught by try/catch (empty — see CR-02) | ❌ see CR-02 |

## Throw Site Coverage (both files)

| Throw | File:Line | Caught? | Impact if thrown |
|-------|-----------|---------|------------------|
| Constructor guard | manager.ts:63 | ❌ — propagates | Construction fails — caller sees error |
| Delegation not found | manager.ts:176 | ❌ — propagates | Caller gets raw Error |
| Terminal control | manager.ts:181 | ❌ — propagates | Caller gets raw Error |
| adjust-prompt status | manager.ts:186 | ❌ — propagates | Caller gets raw Error |
| adjust-prompt no session | manager.ts:197 | ❌ — propagates | Caller gets raw Error |
| adjust-prompt no prompt | manager.ts:200 | ❌ — propagates | Caller gets raw Error |
| change-agent no agent | manager.ts:207 | ❌ — propagates | Caller gets raw Error |
| change-agent no session | manager.ts:210 | ❌ — propagates | Caller gets raw Error |
| change-agent no prompt | manager.ts:213 | ❌ — propagates | Caller gets raw Error |
| resume/chain no prompt | manager.ts:225 | ❌ — propagates | Caller gets raw Error |
| restart no prompt | manager.ts:276 | ❌ — propagates | Caller gets raw Error |
| requireRuntime null | manager.ts:359 | ❌ — propagates | Caller gets raw Error |
| nativeTask failure | manager.ts:295 | ✅ caught, re-thrown | See WR-05 |
| getSessionMessages | coordinator.ts:86 | ✅ caught — **empty** | See CR-02 |
| childSessionStarter fail | coordinator.ts:123 | ✅ caught — `errorResult` | Returns structured error |
| getSessionMessages (monitor) | coordinator.ts:175 | ✅ caught — partial | See WR-02 |

**Verification commands used:**
```bash
grep -n 'throw new Error' src/coordination/delegation/manager.ts src/coordination/delegation/coordinator.ts
grep -n 'catch' src/coordination/delegation/manager.ts src/coordination/delegation/coordinator.ts
grep -n 'void ' src/coordination/delegation/manager.ts src/coordination/delegation/coordinator.ts
```

_Reviewed: 2026-05-23_
_Scope: manager.ts + coordinator.ts only_
