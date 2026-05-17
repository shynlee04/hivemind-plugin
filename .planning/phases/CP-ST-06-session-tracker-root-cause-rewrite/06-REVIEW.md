---
phase: CP-ST-06
reviewed: 2026-05-17T03:16:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/tool-delegation.ts
  - src/features/session-tracker/project-continuity.ts
  - src/features/session-tracker/classification.ts
  - src/features/session-tracker/session-router.ts
  - src/features/session-tracker/child-recorder.ts
  - src/features/session-tracker/persistence/hierarchy-index.ts
  - src/features/session-tracker/persistence/session-index-writer.ts
  - src/features/session-tracker/persistence/retry-queue.ts
  - src/features/session-tracker/persistence/child-writer.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/types.ts
  - tests/features/session-tracker/ensure-session-ready-classification.test.ts
  - tests/features/session-tracker/session-tracker.test.ts
  - tests/features/session-tracker/index.test.ts
  - tests/features/session-tracker/integration/pipeline.test.ts
  - tests/features/session-tracker/integration/cleanup.test.ts
  - tests/features/session-tracker/persistence/retry-queue.test.ts
  - tests/features/session-tracker/persistence/hierarchy-index.test.ts
  - tests/features/session-tracker/integration/default-sub.test.ts
  - tests/features/session-tracker/integration/parallel-children.test.ts
  - tests/features/session-tracker/integration/last-message.test.ts
findings:
  critical: 2
  warning: 4
  info: 4
  total: 10
status: issues_found
---

# Phase CP-ST-06: Code Review Report

**Reviewed:** 2026-05-17T03:16:00Z  
**Depth:** standard  
**Files Reviewed:** 22  
**Status:** issues_found

## Summary

Reviewed all 22 files in the CP-ST-06 Session Tracker Root Cause Rewrite phase — 12 source files and 10 test files. The architecture is solid: the CLASSIFY-BEFORE-IO pattern via `SessionRouter` + `SessionClassifier` correctly implements the three-gate fallback (SDK → hierarchy index → pending registry). All 6 root causes are addressed in the implementation. The 500 LOC module cap is satisfied (index.ts at 478, event-capture.ts is the sole exception at 581 lines — presplit is feasible). All 397 session-tracker tests pass. TypeScript strict mode passes on `src/` (root `tsconfig.json` excludes `tests/`).

**Key concerns:** Two silent error-swallowing patterns (empty catch blocks) were found that contradict the RC-5 fix spirit. The test file `parallel-children.test.ts` has type errors in two test helper calls that pass under vitest transpilation but would fail strict `tsc`. The `ToolDelegation.pollForChildSessions` method uses an unsafe runtime type assertion. One additional empty-catch found in `SessionIndexWriter.enqueueWrite` that silently drops write failures for session-continuity.json.

---

## Critical Issues

### CR-01: SessionIndexWriter.enqueueWrite silently swallows write errors

**File:** `src/features/session-tracker/persistence/session-index-writer.ts:118-120`
**Issue:** The `enqueueWrite` method catches write errors with an empty `catch(() => {})` — no logging, no retry, no notification. This means session-continuity.json write failures are silently discarded. The RC-5 fix focused on childWriter error propagation, but this parallel write queue in SessionIndexWriter repeats the same anti-pattern: errors are completely swallowed. A stuck or corrupted session-continuity.json will never be detected or reported.

**Fix:**
```typescript
// Replace:
.catch(() => {
  // Best-effort: swallow errors to keep queue alive
})

// With:
.catch((err) => {
  // Log the error but keep queue alive for subsequent writes
  console.error(
    `[Harness] SessionIndexWriter: write failed for session "${sessionID}":`,
    err instanceof Error ? err.message : String(err),
  )
})
```

---

### CR-02: SessionTracker.handleSessionEvent silently swallows fork child-copy errors

**File:** `src/features/session-tracker/index.ts:136-138`
**Issue:** The `handleSessionEvent` method wraps the `copyForkedChildren` call in a `try/catch` with an **empty catch block** (`catch {}`). If fork-child reference copying fails (e.g., disk error, corrupt parent index), the error is silently dropped. This means forked sessions can lose child delegation references without any logged evidence.

**Fix:**
```typescript
// Replace:
} catch {
  // Parent index may not exist — fork proceeds without children
}

// With:
} catch (err) {
  void this.client.app?.log?.({
    body: {
      service: "session-tracker",
      level: "warn",
      message: `[Harness] Session tracker: fork child-copy failed for "${event.sessionID}"`,
      extra: { error: err instanceof Error ? err.message : String(err) },
    },
  })
}
```

---

## Warnings

### WR-01: ChildRecorder passes hardcoded `turn: 0` contradicting documentation

**File:** `src/features/session-tracker/child-recorder.ts:100-109`
**Issue:** The `recordChildMessage` method comment at line 104 says: `turn: 0, // Computed from current turns count by appendChildTurn`. However, the code passes a hardcoded `turn: 0`. The `ChildWriter.appendChildTurn` does NOT compute turn numbers — it appends whatever it receives. This means every child-recorded turn will have `turn: 0`, regardless of how many turns actually exist in the child `.json` file. While child session turn indexing is less critical than main session turn indexing, this is misleading and produces incorrect data.

**Fix:** Either remove the misleading comment (if `turn: 0` is intentional for child sessions), or read existing turns from the child file and compute `turn: existingTurns.length + 1`.

---

### WR-02: ToolDelegation.pollForChildSessions uses unsafe runtime type cast

**File:** `src/features/session-tracker/tool-delegation.ts:137-143`
**Issue:** The `pollForChildSessions` method casts `this.client` as `OpenCodeClient & { session: { children(params: ...) } }` — an intersection type with a method (`session.children`) that is not part of the `OpenCodeClient` interface. If the actual runtime client doesn't support `session.children`, this will fail at runtime with a `TypeError`. The method has a try/catch that swallows the error, so the failure will manifest as "polling exhausted" — misleading when the real cause is a missing API method.

**Fix:** Use a feature-detection guard instead of a type assertion:
```typescript
const children = (this.client as Record<string, unknown>).session as 
  { children?: (params: { path: { id: string } }) => Promise<{ data?: Array<{ id: string }> }> } | undefined
if (typeof children?.children !== "function") return
const result = await children.children({ path: { id: parentID } })
```

---

### WR-03: EventCapture uses truthiness check for parentID instead of explicit null/undefined

**File:** `src/features/session-tracker/capture/event-capture.ts:219`
**Issue:** At line 219, the code tests `if (parentID)` to determine if a session has a parent. While session IDs are `"ses_*"` strings (never empty), using truthiness is a fragile pattern. If a bug elsewhere produces an empty string `""` as parentID, it would be silently treated as "no parent" and the child would be incorrectly initialized as a root session. The branch at line 226 uses the correct explicit check `if (parentID === null || parentID === undefined)`. The inconsistency between these two adjacent checks is a quality concern.

**Fix:** Replace `if (parentID)` with `if (parentID !== null && parentID !== undefined)` for consistency and defensive correctness.

---

### WR-04: Test file type errors in parallel-children.test.ts

**File:** `tests/features/session-tracker/integration/parallel-children.test.ts:45, 129`
**Issue:** Two type errors exist in the test file:
1. **Line 45:** `makeChildRecord` creates `delegatedBy: { type: "task", callID: ... }` which does not satisfy the `DelegatedBy` interface (required fields: `agentName`, `model`, `tool`, `description`, `subagentType`).
2. **Line 129:** `childWriter.appendChildTurn(...)` receives `{ actor: string; content: string }` but the `Turn` type requires `turn: number` and `tools: ToolRecord[]`.

These pass under vitest's esbuild transpilation (which is more lenient) but would fail with `tsc --noEmit` on test files. The tests produce runtime objects with missing required fields, meaning the test assertions validate data that would not survive strict type checking.

**Fix:**
```typescript
// Line 45: Provide complete DelegatedBy
delegatedBy: {
  agentName: "test-agent",
  model: "test-model",
  tool: "task",
  description: `Delegate to ${overrides.sessionID}`,
  subagentType: "test-agent",
},

// Line 129: Provide complete Turn
{
  turn: 0,
  actor: "assistant",
  content: `Turn for ${childID} #${index}`,
  tools: [],
}
```

---

## Info

### IN-01: Dynamic import inside loop in ProjectContinuityChecker

**File:** `src/features/session-tracker/project-continuity.ts:81`
**Issue:** `const { resolve } = await import("node:path")` is called inside a `for` loop (line 76). While V8 caches the module, this triggers a dynamic import on each iteration. Move to the top of the method or to the module level. `index.ts` already has a static `import { resolve } from "node:path"` at line 41 — this module should do the same.

**Fix:** Replace the dynamic import with a static `import { resolve } from "node:path"` at the top of the file.

---

### IN-02: Regex-based path dirname extraction in RetryQueue

**File:** `src/features/session-tracker/persistence/retry-queue.ts:309`
**Issue:** `degradedPath.replace(/\/[^/]+$/, "")` uses a regex to strip the file name, which is effectively reimplementing `path.dirname()`. Using `dirname()` would be more readable and handle edge cases (e.g., trailing slashes) correctly.

**Fix:** Replace with `import { dirname } from "node:path"` and use `dirname(degradedPath)`.

---

### IN-03: event-capture.ts exceeds 500 LOC module cap

**File:** `src/features/session-tracker/capture/event-capture.ts (581 lines)`
**Issue:** Exceeds the project's 500 LOC module cap. The file could be split into `event-capture-root.ts` (root session lifecycle) and `event-capture-child.ts` (child session lifecycle — `handleSessionIdle`, `handleSessionDeleted`, `handleSessionError` share nearly identical patterns). This is noted as a pre-existing exception, not a new violation.

---

### IN-04: Duplicate dynamic import pattern in project-continuity.ts

**File:** `src/features/session-tracker/project-continuity.ts:62-63, 81`
**Issue:** The file uses two dynamic imports: `const { readdir } = await import("node:fs/promises")` and `const { resolve } = await import("node:path")`. Since this module has no circular dependency concerns (it only imports `isValidSessionID`, `ProjectIndexWriter`, and `sessionTrackerRoot`), these should be static imports for consistency with the rest of the codebase and better tooling support (tree shaking, type-checking).

**Fix:** Replace with static imports at the top: `import { readdir } from "node:fs/promises"` and `import { resolve } from "node:path"`.

---

_Reviewed: 2026-05-17T03:16:00Z_  
_Reviewer: gsd-code-reviewer (subagent)_  
_Depth: standard_
