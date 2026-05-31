# ChildWriter ENOENT/TUI Leak — Root Cause Analysis

**Researched:** 2026-05-31
**Domain:** Session tracker persistence, error handling, retry queue
**Confidence:** HIGH

## Summary

The ChildWriter ENOENT/TUI leak occurs when `console.warn()` at `child-writer.ts:228` writes raw error text to stderr, which the OpenCode TUI renders as unformatted garbage. The root cause is that three `ChildWriter` methods — `updateChildStatus()`, `appendChildTurn()`, and `appendJourneyEntry()` — call `readChildFile()` **without a try-catch**. When the child `.json` file is missing, `readFile()` throws ENOENT, which propagates through `enqueueWrite()`'s catch chain and triggers `console.warn()`.

Two existing methods (`backfillChildMetadata()` and `backfillChildTurns()`) already demonstrate the correct pattern: wrap `readChildFile()` in a local try-catch INSIDE the `enqueueWrite` callback.

---

## 1. Research Questions

### Q1: Exactly Which Methods Lack try-catch Around `readChildFile()`?

| Method | File:Line | try-catch? | Error Behavior |
|--------|-----------|-----------|----------------|
| `updateChildStatus()` | `child-writer.ts:454` | **NO** | ENOENT → `enqueueWrite` catch → `console.warn` + retry queue (no retryData) |
| `appendChildTurn()` | `child-writer.ts:491` | **NO** | ENOENT → `enqueueWrite` catch → `console.warn` + retry queue (no retryData) |
| `appendJourneyEntry()` | `child-writer.ts:540` | **NO** | ENOENT → `enqueueWrite` catch → `console.warn` + retry queue (no retryData) |
| `backfillChildMetadata()` | `child-writer.ts:580-583` | **YES** | Silently returns — child file missing is a valid state |
| `backfillChildTurns()` | `child-writer.ts:622-627` | **YES** | Silently returns — child file missing is a valid state |
| `createChildFile()` | `child-writer.ts:250-251` (via `readExistingChildFile`) | **YES** | Returns `undefined` (graceful merge) |
| `readChildData()` | `child-writer.ts:359-393` (multiple calls) | **YES** | Returns `undefined` (graceful scan fallback) |

### Q2: Exact `enqueueWrite` Catch Handler Content

**First cascade (lines 203-222):**
```typescript
// child-writer.ts:203-222
const next = current.then(async () => {
  await fn()                         // <-- readChildFile() throws ENOENT here
  this.lastWriteTimes.set(queueKey, Date.now())
}).catch(async (err) => {
  // RC-5: Enqueue failed write to retry queue instead of swallowing
  if (retryData && this.retryQueue) {    // <-- retryData is undefined for updateChildStatus/appendChildTurn/appendJourneyEntry
    this.retryQueue.enqueue({ ... })
  }
  // Propagate error to caller
  throw err                              // <-- re-throws to the outer catch
})
```

**Second cascade (lines 223-233) — the TUI leak:**
```typescript
// child-writer.ts:223-233
this.writeQueues.set(
  queueKey,
  next.catch((err) => {
    // Error already propagated via throw at line 221+ and enters retry queue.
    // This catch prevents unhandled rejection while still logging for observability.
    console.warn(                          // <-- TUI LEAK: raw stderr output
      `[Harness] ChildWriter queue: write failed for "${queueKey}" (enqueued to retry queue):`,
      err instanceof Error ? err.message : String(err),
    )
  }),
)
```

The full call path when a method lacks try-catch:
1. `fn()` calls `readChildFile()` → `readFile()` throws ENOENT
2. `.catch()` at line 206 catches it — `retryData` is `undefined`, so nothing enqueued
3. `throw err` at line 221 propagates to the outer `.catch()` at line 225
4. `console.warn()` at line 228 writes to stderr → **TUI leak**

### Q3: Retry Queue — What and When Used?

The `ChildWriteRetryQueue` (`retry-queue.ts`) stores failed child writes and retries with exponential backoff (1s, 2s, 4s, 8s, 16s). After 5 failures, the record is marked `"degraded"` and persisted to `retry-degraded.json`. A 30-second periodic flush loop retries pending records.

**Critical finding: Only `createChildFile()` passes `retryData` to `enqueueWrite()`.**

```typescript
// child-writer.ts:416-432 — createChildFile passes retryData
return this.enqueueWrite(..., fn, {
  sessionID: childSessionID,
  parentID: writeParent,
  data: metadata as Record<string, unknown>,
})
```

```typescript
// child-writer.ts:451-469 — updateChildStatus does NOT pass retryData
return this.enqueueWrite(..., fn)  // no third argument
```

```typescript
// child-writer.ts:488-514 — appendChildTurn does NOT pass retryData
return this.enqueueWrite(..., fn)  // no third argument
```

```typescript
// child-writer.ts:537-550 — appendJourneyEntry does NOT pass retryData
return this.enqueueWrite(..., fn)  // no third argument
```

**Consequence:** When `updateChildStatus` / `appendChildTurn` / `appendJourneyEntry` fail ENOENT, the retry queue is never used. The error goes directly to `console.warn`. Even if it were queued, the retry would also fail (same `fn()` tries to read the same missing file).

### Q4: Is `console.warn` the Only Logging Method?

**Yes, within session-tracker.** There are exactly 2 uses of `console.warn`:
1. `src/features/session-tracker/persistence/child-writer.ts:228` — The enqueueWrite TUI leak
2. `src/features/session-tracker/persistence/session-index-writer.ts:225` — Parent-not-found fallback (also a TUI leak surface)

There is 1 use of `console.error`:
3. `src/features/session-tracker/persistence/retry-queue.ts:326` — Failed degraded-record persistence

All other logging in session-tracker uses the proper pattern: `this.client.app?.log?.({ body: { service: "session-tracker", level: "warn", message: "...", extra: {...} } })`.

### Q5: What Triggers Child File Deletion/Absence in Production?

1. **Race condition between hooks:** The `chat.message` hook fires for a child session **before** `tool.execute.after` creates the child `.json` file. `childWriter.appendChildTurn()` / `appendJourneyEntry()` tries to read a file that doesn't exist yet.

2. **Orphan cleanup:** `OrphanCleanup` may quarantine or remove child directories/files during `cleanupOrphanDirectories()`.

3. **SDK session deletion:** A user or system action deletes a session, removing its `.json` files from disk.

4. **Hierarchy index registration without file creation:** `hierarchyIndex.registerChild()` is in-memory only. If the process crashes between registration and `createChildFile()`, the index remembers a child that has no `.json` file.

5. **Normal lifecycle in tests:** The test at `child-writer.test.ts:205-211` explicitly validates the ENOENT-throw behavior for non-existent children.

### Q6: Reference Pattern — How `backfillChildMetadata` Handles ENOENT

```typescript
// child-writer.ts:575-583
return this.enqueueWrite(`${writeParent}/${childSessionID}`, async () => {
  let record: ChildSessionRecord
  try {
    record = await this.readChildFile(writeParent, childSessionID)
  } catch {
    // Child file doesn't exist yet — nothing to backfill
    return                           // <-- graceful exit, no TUI leak
  }
  // ... rest of logic (only runs if readChildFile succeeded)
})
```

The **key insight**: The try-catch is INSIDE the `enqueueWrite` callback. If `readChildFile()` throws, the callback returns early. The `enqueueWrite` pipeline sees a successful resolution (no throw), so the outer catch handler with `console.warn()` is never triggered.

`backfillChildTurns()` uses the identical pattern at lines 622-627.

---

## 2. Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Child file read (exists) | `ChildWriter.readChildFile()` | — | Direct `readFile()` with JSON parse |
| Child file read (no-exist guard) | `ChildWriter` per-method try-catch | `enqueueWrite()` fallthrough | Each method decides its own no-exist semantics |
| Retry queue for failed writes | `ChildWriteRetryQueue` | `enqueueWrite()` | Only used by `createChildFile()` today |
| TUI-safe logging | `client.app?.log?.()` | — | All session-tracker code except 2 `console.warn` sites |
| Child file existence check | `ChildWriter.childFileExists()` | `readExistingChildFile()` | Two-step: hierarchy index then directory scan |

---

## 3. Affected Code Paths

### Path A: `recordChildMessage` → `appendChildTurn` / `appendJourneyEntry` (RACE)

```
ChildRecorder.recordChildMessage()          [child-recorder.ts:119-143]
  → childWriter.appendChildTurn()           [child-writer.ts:488-514]
    → enqueueWrite(..., fn)                  [no retryData]
      → fn() → readChildFile()              [child-writer.ts:491]  ← THROWS ENOENT
        → enqueueWrite catch → console.warn [child-writer.ts:228] ← TUI LEAK
```

**Why it happens:** The `chat.message` hook fires before `tool.execute.after` creates the child file.

### Path B: `recordChildTaskDelegation` → `appendJourneyEntry` / `appendChildTurn` (EDGE CASE)

```
ToolDelegation.recordChildTaskDelegation()  [tool-delegation.ts:300-367]
  → childWriter.createChildFile()           [line 300]
  → childWriter.appendJourneyEntry()        [line 303]  ← OK, file exists
  → childWriter.appendChildTurn()           [line 361]  ← OK, file exists
  → childWriter.updateChildStatus()         [line 367]  ← OK, file exists
```

This path is **usually safe** because `createChildFile()` runs first. BUT if `createChildFile` succeeds but the file is deleted between lines 300 and 367 (e.g., by orphan cleanup), the later calls will ENOENT.

### Path C: Event handlers with `childFileExists` guard (GUARDED)

```
session-idle-handler.ts:28      → childFileExists() check → updateChildStatus() ← GUARDED
session-deleted-handler.ts:26   → childFileExists() check → updateChildStatus() ← GUARDED
session-error-handler.ts:24     → childFileExists() check → updateChildStatus() ← GUARDED
session-compacted-handler.ts:42 → childFileExists() check → appendJourneyEntry() ← GUARDED
```

These event handlers check `childFileExists()` first, so they are protected. **However**, there's a TOCTOU race: file could be deleted between the check and the read.

### Path D: `recordChildToolJourney` (UNGUARDED)

```
ToolDelegation.recordChildToolJourney()     [tool-delegation.ts:213]
  → childWriter.appendJourneyEntry()        ← NO file existence check
```

No guard. If the child file was never created or was deleted, this triggers the TUI leak.

---

## 4. Root Cause

The root cause is a **three-layer failure**:

1. **Primary:** Three methods (`updateChildStatus`, `appendChildTurn`, `appendJourneyEntry`) call `readChildFile()` without a try-catch, unlike `backfillChildMetadata` and `backfillChildTurns` which show the correct pattern.

2. **Secondary:** `enqueueWrite()`'s catch handler uses `console.warn()` instead of `client.app?.log?.()` — the standard structured logging method used everywhere else in session-tracker.

3. **Tertiary:** The retry queue is wired to `enqueueWrite` but only `createChildFile()` provides `retryData`, so the other three methods never enter the retry pipeline anyway.

---

## 5. Remediation Comparison

| Approach | Complexity | Fixes Root Cause? | Fixes TUI Leak? | Risk |
|----------|-----------|-------------------|-----------------|------|
| **A: Add try-catch to 3 methods** (follow `backfillChildMetadata` pattern) | Low — 3 local try-catch blocks | **YES** — ENOENT handled at source | Yes — no error reaches `console.warn` | Low — proven pattern |
| **B: Replace `console.warn` with `client.app?.log?.()`** | Low — 2 lines changed | No — still logs garbage | **YES** — structured log, no TUI leak | Low — other code uses this pattern |
| **C: `fs.exists` check before `readFile`** | Medium — TOCTOU race potential | Partial | Partial | Medium — race condition |
| **D: Add `retryData` to all 4 methods** | Medium — retry queue still fails on missing file | No — retry reads same missing file | Partial — still hits `console.warn` | Low |
| **E: Change `readChildFile` to return undefined** | Low — 1 change | **YES** — central fix | Yes | Low — changes contract; callers expecting throw would silently no-op |
| **F: Silent `console.warn` (current)** | None | No | No | TUI leak persists |

### Recommendation: Approach A + Approach B

**Approach A** (primary fix): Add try-catch around `readChildFile()` in `updateChildStatus()`, `appendChildTurn()`, and `appendJourneyEntry()`, following the identical pattern used in `backfillChildMetadata()` and `backfillChildTurns()`:

```typescript
// In each method's enqueueWrite lambda:
async () => {
  let record: ChildSessionRecord
  try {
    record = await this.readChildFile(writeParent, childSessionID)
  } catch {
    return  // Child file doesn't exist — nothing to update
  }
  // ... rest of logic
}
```

**Approach B** (safety net): Replace `console.warn` at `child-writer.ts:228` and `session-index-writer.ts:225` with `client.app?.log?.()`. This is the standard logging pattern used throughout the harness — no other module uses `console.warn` for runtime logging.

### Secondary Consideration: Add `retryData` to the three ENOENT-vulnerable methods

If the methods should be retried (when file exists but write fails, not when file is missing), add `retryData` parameters. However, this is a separate concern from the ENOENT/TUI leak — the try-catch handles ENOENT; the retry queue handles transient write failures.

---

## 6. Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `retryData` is only passed by `createChildFile()` | Q3 | Verified by code — all 3 vulnerable methods omit the third argument to `enqueueWrite()` |
| A2 | `console.warn` output leaks to the OpenCode TUI as garbage text | Summary | User-reported; `console.warn` writes directly to stderr which TUI captures |
| A3 | Event handlers (session-idle-handler.ts et al.) check `childFileExists` before calling ChildWriter methods | Path C | Verified by grep — all 4 handlers have `childFileExists` guard |
| A4 | `backfillChildMetadata` and `backfillChildTurns` are the correct reference pattern | Q6 | Verified by code — these are the only methods that attempt `readChildFile` inside a try-catch inside `enqueueWrite` |

---

## 7. Open Questions

1. **Should `appendChildTurn` / `appendJourneyEntry` / `updateChildStatus` silently no-op when the child file is missing?**
   - **What we know:** `backfillChildMetadata` and `backfillChildTurns` already no-op. The event handlers already guard with `childFileExists`.
   - **What's unclear:** Whether a missing file during `recordChildToolJourney` or `recordChildMessage` is a bug that should be surfaced or a valid state that should be silently handled.
   - **Recommendation:** Silent no-op is safe — if the child file is missing, the `createChildFile` already failed (or was never called), and retrying the same `readChildFile` will continue to fail. The missing data is already lost.

2. **Why was `console.warn` chosen over `client.app?.log?.()?`**
   - **What we know:** Everything else in session-tracker uses `client.app?.log?.()`.
   - **What we can infer:** `console.warn` was chosen in `enqueueWrite` because at this point in the catch chain, the original error context (which includes `client`) is not available without passing it through. The method doesn't have access to `client` or a logging callback.
   - **Recommendation:** Either (a) inject a logger into `ChildWriter` (too invasive), (b) add a `onWriteError` callback parameter, or (c) accept the minimal risk by adding try-catch to the 3 methods (Approach A) and replacing `console.warn` with a zero-dependency alternative.

---

## 8. Sources

### Primary (HIGH confidence)
- `src/features/session-tracker/persistence/child-writer.ts` — Full source analysis (658 lines)
- `src/features/session-tracker/persistence/retry-queue.ts` — Retry queue mechanics (370 lines)
- `src/features/session-tracker/persistence/session-index-writer.ts` — Second `console.warn` site (334 lines)
- `src/features/session-tracker/tool-delegation.ts` — All callers of ChildWriter methods (473 lines)
- `src/features/session-tracker/child-recorder.ts` — `recordChildMessage` calls (145 lines)
- `src/features/session-tracker/index.ts` — SessionTracker harness (626 lines)
- `src/features/session-tracker/initialization.ts` — Dependency wiring (280 lines)
- `tests/features/session-tracker/persistence/child-writer.test.ts` — Test coverage (864 lines)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All file contents verified directly
- Architecture: HIGH — Full call chain traced from hooks to persistence
- Pitfalls: HIGH — Root cause and remediation verified against code

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (stable)
