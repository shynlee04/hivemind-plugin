---
phase: CP-ST-05
reviewed: 2026-05-16T19:20:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/orphan-cleanup.ts
  - src/features/session-tracker/persistence/hierarchy-index.ts
  - tests/features/session-tracker/integration/e2e-verification.test.ts
  - tests/features/session-tracker/orphan-cleanup-preserve.test.ts
  - tests/features/session-tracker/persistence/hierarchy-index.test.ts
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase CP-ST-05: Code Review Report — Iteration 2

**Reviewed:** 2026-05-16T19:20:00Z
**Depth:** standard
**Files Reviewed:** 6
**Commit:** `a5eeebdd` — "CP-ST-05: add child tool routing, orphan preservation, recursive hierarchy"
**Status:** issues_found

## Summary

This iteration addresses CR-01, CR-03, and WR-01 from iteration 1 by introducing child-session tool routing (`recordChildToolJourney`, `recordChildTaskDelegation`), orphan hierarchy preservation (`preserveOrphanHierarchy`), and recursive hierarchy index rebuilding (`registerChildrenFromTree`). The architectural intent is sound: child sessions write JSON under root main without creating subdirectories, and orphan cleanup merges nested child records before quarantine.

However, `index.ts` now stands at **1038 lines** — more than double the 500 LOC cap. The new child-routing methods (~230 LOC) should be extracted to a dedicated module. Additionally, `handleToolExecuteAfter` lacks the `this.childWriter` guard that `handleChatMessage` has, and `recordChildTaskDelegation` performs 6 sequential writes without transactional coordination.

TypeScript typecheck passes. All 41 tests in the changed test files pass. Pre-existing failures (21 tests in cleanup.test.ts, pipeline.test.ts, etc.) are unrelated to this commit.

---

## Critical Issues

### CR-01: 500 LOC Cap Violation — index.ts at 1038 Lines

**File:** `src/features/session-tracker/index.ts:1-1038`
**Issue:** The module is 1038 lines, exceeding the project's 500 LOC cap by 108%. This was already flagged in iteration 1 and has worsened — the commit added ~230 lines of child-routing methods (`recordChildToolJourney`, `ensureChildRoute`, `ensureAncestorRoute`, `recordChildTaskDelegation`, `pruneToolInput`, `pruneToolOutput`, `extractTaskID`, `asRecord`). Per `AGENTS.md`: "SessionTracker SHALL NOT exceed the 500 LOC module cap."
**Fix:** Extract child-routing methods into `src/features/session-tracker/child-routing.ts`:
```typescript
// src/features/session-tracker/child-routing.ts
export class ChildRouting {
  constructor(
    private hierarchyIndex: HierarchyIndex,
    private childWriter: ChildWriter,
    private sessionIndexWriter: SessionIndexWriter,
    private projectIndexWriter: ProjectIndexWriter,
    private manifestWriter: HierarchyManifestWriter,
  ) {}

  async recordToolJourney(parentID: string, input: ..., output: ...): Promise<void> { ... }
  async recordTaskDelegation(parentID: string, input: ..., output: ...): Promise<void> { ... }
  // ... pruneToolInput, pruneToolOutput, extractTaskID, asRecord, ensureChildRoute, ensureAncestorRoute
}
```
Then in `index.ts`, delegate to `this.childRouting.recordToolJourney(...)`.

### CR-02: Missing childWriter Guard in handleToolExecuteAfter

**File:** `src/features/session-tracker/index.ts:370-382`
**Issue:** `handleToolExecuteAfter` checks `if (parentID)` (line 370) and immediately calls `this.recordChildToolJourney(parentID, input, output)`, which in turn calls `this.childWriter.appendJourneyEntry(...)`. In contrast, `handleChatMessage` at line 283 correctly guards with `if (parentID && this.childWriter)`. If `handleToolExecuteAfter` fires before `initialize()` completes (e.g., during a race condition or partial initialization), `this.childWriter` is `undefined` and the call throws `TypeError: Cannot read properties of undefined`.
**Fix:** Add the same guard used in `handleChatMessage`:
```typescript
if (parentID && this.childWriter) {
  this.bootstrappedSessions.add(input.sessionID)
  await this.recordChildToolJourney(parentID, input, output)
  // ...
}
```

---

## Warnings

### WR-01: Non-Transactional Sequential Writes in recordChildTaskDelegation

**File:** `src/features/session-tracker/index.ts:527-555`
**Issue:** `recordChildTaskDelegation` performs 6 sequential async writes:
1. `childWriter.createChildFile(...)`
2. `childWriter.appendChildTurn(...)`
3. `sessionIndexWriter.addChild(...)`
4. `projectIndexWriter.incrementChildCount(...)`
5. `projectIndexWriter.addSession(...)`
6. `manifestWriter.addChild(...)`

If write #3 fails, writes #1-2 have already persisted but #4-6 have not, leaving the hierarchy in an inconsistent state (child JSON exists but indexes are incomplete).
**Fix:** Either wrap in a transaction-like pattern (collect all writes, execute with rollback on failure) or reorder so that index writes happen first (they're idempotent) and the child JSON file is created last as the "commit" step.

### WR-02: extractTaskID Regex Only Matches ses_ Prefix

**File:** `src/features/session-tracker/index.ts:613-617`
**Issue:** `extractTaskID` uses `/\bses_[A-Za-z0-9_-]+\b/` which only matches session IDs with the `ses_` prefix. If OpenCode's task tool returns a task ID in a different format (e.g., `task_abc123` or a UUID), the L2 child JSON will never be created and the delegation will be silently lost.
**Fix:** Make the regex configurable or broaden it to also match `task_` prefix:
```typescript
private extractTaskID(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const match = value.match(/\b(ses_|task_)[A-Za-z0-9_-]+\b/)
  return match?.[0]
}
```

### WR-03: pruneToolInput Returns Undefined Properties Without Validation

**File:** `src/features/session-tracker/index.ts:565-581`
**Issue:** `pruneToolInput` accesses `record.filePath`, `record.name`, `record.description`, `record.subagent_type`, `record.callID` without checking if these properties exist on the record. For unknown tools, it returns `{ callID: record.callID }` which will be `{ callID: undefined }` if `callID` is absent. While `undefined` values serialize to nothing in JSON, this indicates the pruning logic assumes specific argument shapes that may not hold for all tool calls.
**Fix:** Add existence checks:
```typescript
private pruneToolInput(tool: string, args: unknown): Record<string, unknown> {
  const record = this.asRecord(args)
  const result: Record<string, unknown> = {}
  if (tool === "read" && record.filePath) result.filePath = record.filePath
  else if (tool === "skill" && record.name) result.name = record.name
  else if (tool === "task") {
    if (record.description) result.description = record.description
    if (record.subagent_type) result.subagent_type = record.subagent_type
    const taskId = this.extractTaskID(record.task_id)
    if (taskId) result.task_id = taskId
  } else if (record.callID) {
    result.callID = record.callID
  }
  return result
}
```

### WR-04: ensureAncestorRoute Has No Error Handling for getSessionSafely

**File:** `src/features/session-tracker/index.ts:463-476`
**Issue:** `ensureAncestorRoute` calls `await this.getSessionSafely(sessionID)` without a try-catch. If the SDK call throws (network error, timeout, malformed response), the exception propagates up through `ensureChildRoute` → `recordChildToolJourney` → `handleToolExecuteAfter`. While the outer try-catch catches it, the ancestor chain registration is silently abandoned, meaning child writes may resolve to the wrong parent directory.
**Fix:** Add best-effort error handling:
```typescript
private async ensureAncestorRoute(sessionID: string, seen: Set<string>): Promise<void> {
  if (seen.has(sessionID)) return
  seen.add(sessionID)
  let session: unknown
  try {
    session = await this.getSessionSafely(sessionID)
  } catch {
    return // Best-effort: SDK unavailable, skip ancestor resolution
  }
  // ... rest unchanged
}
```

---

## Info

### IN-01: Type Assertion in ensureAncestorRoute Could Be Stricter

**File:** `src/features/session-tracker/index.ts:467-470`
**Issue:** Uses `(session as { parentID?: string }).parentID` after runtime narrowing. The `as` cast bypasses TypeScript's type checking. While the runtime check (`typeof session === "object" && "parentID" in session`) is correct, a type guard function would be cleaner.
**Fix:** Extract a type guard:
```typescript
function hasParentID(obj: unknown): obj is { parentID?: string } {
  return typeof obj === "object" && obj !== null && "parentID" in obj
}
```

### IN-02: Test Mocks Use `as never` Casts

**File:** `tests/features/session-tracker/integration/e2e-verification.test.ts:135, 193, 250`
**Issue:** E2E tests use `as never` casts for mock OpenCode client objects (e.g., `{ session: { get: vi.fn() } } as never`). This bypasses type checking entirely. While acceptable in test mocks, it means type mismatches in the mock shape won't be caught at compile time.
**Fix:** Use `vi.mocked()` with proper partial typing or `Partial<OpenCodeClient>` instead of `as never`.

### IN-03: Empty Catch Blocks in moveChildJsonToRoot

**File:** `src/features/session-tracker/orphan-cleanup.ts:247-260`
**Issue:** Two empty catch blocks in `moveChildJsonToRoot` — one for missing target file (intentional), one for missing source file (acceptable for best-effort). The comments explain the intent, but consider adding a debug log for the source-missing case to aid forensics.
**Fix:** Add optional logging:
```typescript
try {
  await rename(sourcePath, targetPath)
} catch {
  // Source may not exist; hierarchy merge still preserves the reference.
  void this.client.app?.log?.({ body: { level: "debug", message: `Child file not found: ${childFile}` } })
}
```

---

## Findings Summary

| ID | Severity | File | Description |
|----|----------|------|-------------|
| CR-01 | Critical | index.ts:1-1038 | 500 LOC cap violated (1038 lines) |
| CR-02 | Critical | index.ts:370-382 | Missing childWriter guard in handleToolExecuteAfter |
| WR-01 | Warning | index.ts:527-555 | Non-transactional sequential writes in recordChildTaskDelegation |
| WR-02 | Warning | index.ts:613-617 | extractTaskID regex only matches ses_ prefix |
| WR-03 | Warning | index.ts:565-581 | pruneToolInput returns undefined properties |
| WR-04 | Warning | index.ts:463-476 | No error handling in ensureAncestorRoute for SDK failures |
| IN-01 | Info | index.ts:467-470 | Type assertion could be stricter with type guard |
| IN-02 | Info | e2e-verification.test.ts | Test mocks use `as never` casts |
| IN-03 | Info | orphan-cleanup.ts:247-260 | Empty catch blocks could benefit from debug logging |

---

_Reviewed: 2026-05-16T19:20:00Z_
_Reviewer: gsd-code-reviewer (iteration 2)_
_Depth: standard_
