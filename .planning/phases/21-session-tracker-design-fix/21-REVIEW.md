---
phase: 21-session-tracker-design-fix
reviewed: 2026-05-21T12:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/features/session-tracker/persistence/atomic-write.ts
  - src/features/session-tracker/persistence/hierarchy-manifest.ts
  - src/features/session-tracker/persistence/hierarchy-index.ts
  - src/features/session-tracker/persistence/project-index-writer.ts
  - src/features/session-tracker/persistence/child-writer.ts
  - src/features/session-tracker/initialization.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/tool-delegation.ts
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/orphan-cleanup.ts
  - src/task-management/continuity/delegation-persistence.ts
  - tests/features/session-tracker/persistence/atomic-write.test.ts
  - tests/features/session-tracker/persistence/hierarchy-manifest.test.ts
  - tests/features/session-tracker/persistence/project-index-writer.test.ts
  - tests/features/session-tracker/persistence/hierarchy-index.test.ts
  - tests/features/session-tracker/persistence/child-writer.test.ts
  - tests/features/session-tracker/session-tracker.test.ts
  - tests/features/session-tracker/integration/phase-21.test.ts
  - tests/lib/delegation-persistence.test.ts
findings:
  critical: 1
  warning: 4
  info: 6
  total: 11
status: issues_found
---

# Phase 21: Code Review Report

**Reviewed:** 2026-05-21T12:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed 19 files across the session-tracker persistence layer, event capture, tool delegation, orphan cleanup, and delegation persistence. The codebase shows strong adherence to architecture rules (CQRS, atomic writes, path safety), but several defects were found: one BLOCKER data-fidelity bug in hierarchy-manifest generation, four WARNING-level issues around race conditions and code duplication, and six INFO-level code quality observations.

---

## Critical Issues

### CR-01: `generateFromContinuity` assigns `delegatedBy` to both `delegatedBy` and `subagentType` — data fidelity loss

**File:** `src/features/session-tracker/persistence/hierarchy-manifest.ts:200-201`
**Issue:** Line 200 assigns `entry.delegatedBy ?? "unknown"` to `delegatedBy`, and line 201 assigns the **same** value to `subagentType`. These are semantically distinct fields:
- `delegatedBy` (line 113 of `types.ts`): "Who delegated this child (agent name)" — e.g., "hm-l0-orchestrator"
- `subagentType` (line 115 of `types.ts`): "Subagent type dispatched (e.g. 'hm-l2-researcher')" — e.g., "hm-l2-researcher"

The source `ChildHierarchyEntry` (line 252-263 of `types.ts`) has only `delegatedBy: string` with no separate `subagentType` field, so the generated manifest copies the delegator's name into both fields. Every manifest entry generated from continuity data will have `delegatedBy === subagentType`, making the `subagentType` field unreliable.

Per the test fixture at `hierarchy-manifest.test.ts:420`, where `delegatedBy: "child-1"` (a session ID), the generated `subagentType` becomes `"child-1"` — clearly wrong.

**Fix:** Either:
1. Add a `subagentType` field to `ChildHierarchyEntry` (in `types.ts`) and populate it when continuity entries are written, OR
2. Derive `subagentType` from `entry.delegatedBy` only as fallback, with a comment noting the limitation, OR
3. If `entry.delegatedBy` is known to always be the subagent type (not the delegator name), rename/align the field semantics.

If option 3 is chosen, the JSDoc on `ChildHierarchyEntry.delegatedBy` must be updated to reflect this, and all consumers of `delegatedBy` across the continuity tree must be audited for consistency.

---

## Warnings

### WR-01: `backfillChildMetadata` uses separate serial queue — concurrent race with `updateChildStatus`

**File:** `src/features/session-tracker/persistence/child-writer.ts:403`
**Issue:** Line 403 uses queue key `writeParent/${childSessionID}-backfill`, which is a different serial queue than the main `${writeParent}/${childSessionID}` used by `createChildFile`, `updateChildStatus`, `appendChildTurn`, and `appendJourneyEntry`.

Since `backfillChildMetadata` reads the full `ChildSessionRecord`, mutates it, and writes it back atomically, a concurrent `updateChildStatus` on the main queue can race with the backfill. Both queues are independent `Promise` chains. Timeline of a potential race:

1. Queue A (main): `updateChildStatus` reads record — status="active"
2. Queue B (backfill): `backfillChildMetadata` reads record — status="active"
3. Queue A: writes status="completed"
4. Queue B: writes backfilled agent name but `status` field is stale (overwrites "completed" with whatever was in the record from step 2)

**Fix:** Use the same queue key (without `-backfill` suffix) to ensure all operations on the same child file serialize through a single promise chain. The separate queue key was likely added to prevent queue deadlocks, but in practice the backfill should chain on the same queue.

```typescript
// child-writer.ts line 403 — change queue key
return this.enqueueWrite(
  `${writeParent}/${childSessionID}`,  // REMOVE "-backfill" suffix
  async () => {
    // ... existing backfill logic
  },
)
```

### WR-02: Polling failure for `session.children()` exits silently with no logging

**File:** `src/features/session-tracker/tool-delegation.ts:138-143`
**Issue:** The feature-detection guard at lines 138-143 checks `typeof this.client.session.children !== "function"` and returns early if the method is missing — **with zero logging**. If the OpenCode SDK version doesn't expose `session.children()`, child session discovery via polling silently fails. There's no warning or diagnostic emitted, making it extremely difficult to debug.

The catch block at line 169 (`catch { /* Server API may not be ready */ }`) compounds this — polling errors are swallowed without any logging until all 5 attempts are exhausted (line 178-184).

**Fix:** Add a `client.app.log` call at line 142 when `children` is not a function. Also consider adding per-attempt logging at the `warn` level inside the catch block (not just at exhaustion).

```typescript
if (!this.client?.session || typeof (this.client.session as unknown as Record<string, unknown>).children !== "function") {
  void this.client.app?.log?.({
    body: {
      service: "session-tracker",
      level: "warn",
      message: `[Harness] Session tracker: session.children() not available — polling disabled`,
    },
  })
  return
}
```

### WR-03: `writeManifest` duplicates atomic write logic without cross-volume rename detection

**File:** `src/features/session-tracker/persistence/hierarchy-manifest.ts:274-294`
**Issue:** The `writeManifest` method implements its own write-to-tmp + rename logic (lines 283-286) instead of calling `atomicWriteJson()` from `atomic-write.ts`. This means it lacks the cross-volume rename detection that `atomicWriteJson` has (lines 42-48 of `atomic-write.ts`). If the session tracker root is on a different filesystem volume, manifest write failures won't produce diagnostic warnings.

Additionally, any future improvements to `atomicWriteJson` (e.g., better cleanup, retry logic) won't apply to manifest writes, creating a maintenance divergence.

**Fix:** Replace the manual write logic with a call to `atomicWriteJson`, which already handles cross-volume detection, post-rename cleanup, and consistent temp file naming:

```typescript
private async writeManifest(rootMainSessionID: string, manifest: HierarchyManifest): Promise<void> {
  const filePath = safeSessionPath(this.projectRoot, rootMainSessionID, "hierarchy-manifest.json")
  await atomicWriteJson(filePath, manifest)
}
```

### WR-04: `updateSession` unconditionally overrides `childCount` and `totalDelegationDepth` from hierarchy index, ignoring caller-provided values

**File:** `src/features/session-tracker/persistence/project-index-writer.ts:226-228`
**Issue:** The `updateSession` method computes `childCount` and `totalDelegationDepth` from the hierarchy index and overwrites whatever the caller passed in the `updates` parameter. This is intentional per F-19 (hierarchy index is authoritative), but it creates a silent data override. If a caller explicitly passes `updates.childCount = 5`, that value is unconditionally replaced with `computeChildCount(sessionID)`.

This is surprising API behavior — the method says "merges partial updates" but two fields are always overridden. A caller who doesn't have a hierarchy index wired will always see `childCount: 0` and `totalDelegationDepth: 0` regardless of what they pass.

**Fix:** Add a JSDoc note on the `updates` parameter documenting that `childCount` and `totalDelegationDepth` are always sourced from the hierarchy index. Alternatively, only compute from hierarchy index when the caller does NOT provide these values.

---

## Info

### IN-01: Redundant `mkdirSync` in `persistDelegations`

**File:** `src/task-management/continuity/delegation-persistence.ts:76`
**Issue:** Line 66 creates the parent directory with `mkdirSync(dirname(filePath), { recursive: true })`. Line 76 does the exact same call again after writing the temp file. The second call is fully redundant since the directory already exists from the first call.

**Fix:** Remove line 76.

### IN-02: Dynamic import inside `cleanupOrphanedTmpFiles`

**File:** `src/features/session-tracker/orphan-cleanup.ts:360`
**Issue:** Line 360 uses `const { unlink } = await import("node:fs/promises")` inside the method body, despite `node:fs/promises` already being imported at the top of the file (line 17, importing `readdir`, `access`, `readFile`, `rename`). The dynamic import is unnecessary and inconsistent with the static imports. `unlink` could simply be added to the top-level import.

**Fix:** Add `unlink` to the existing import on line 17 and remove the dynamic import on line 360.

### IN-03: Double logging of unrecognized event types in `handleSessionEvent`

**File:** `src/features/session-tracker/capture/event-capture.ts:124-160`
**Issue:** Lines 124-134 validate `event.eventType` against the `validEventTypes` array and log a warning for unrecognized types, but intentionally do **not** return (per the comment "Continue for unrecognized types"). The event then falls through to the `switch` statement's `default` block (lines 152-159), which also logs a warning for the same unrecognized type. This produces two identical warnings for every unrecognized event type.

**Fix:** Either add a `return` after the first warning (breaking the fall-through), or remove the first warning since the `default` block already covers it.

### IN-04: `!` assertions on all private fields with deferred initialization via `Object.assign`

**File:** `src/features/session-tracker/index.ts:68-93`
**Issue:** All 26 private fields use the `!` definite assignment assertion (e.g., `private eventCapture!: ...`), and their actual values are set later via `Object.assign(this, deps)` in `initialize()`. This means:

1. If any code path accesses these fields **before** `initialize()` completes, the value is `undefined` — no compile-time protection.
2. TypeScript's type checking is effectively disabled for these fields since the types resolve through `Parameters<typeof constructDependencies>[0]` which is `ClientLike` (i.e., `any`).
3. If `initialize()` throws before `Object.assign`, the object is in a partially constructed state with no compiler warning.

**Fix:** Consider using a more explicit initialization pattern, such as passing deps through a private constructor and using a static factory method, or moving `Object.assign` to the constructor when deps are available.

### IN-05: Test uses fragile `as any` assignments for private fields

**File:** `tests/features/session-tracker/session-tracker.test.ts:48-79`
**Issue:** The `wireTracker()` test helper directly assigns to private fields using `(tracker as any).fieldName = ...`. This is tightly coupled to implementation details — if any field name changes in `index.ts`, the tests silently fail (the assignments become no-ops that set new properties instead of the renamed ones).

**Fix:** Consider exposing a test helper method or using a public setter, or at minimum adding a comment warning about the coupling.

### IN-06: MAX_DEPTH test reads source file as string rather than testing runtime behavior

**File:** `tests/features/session-tracker/session-tracker.test.ts:235-244`
**Issue:** The MAX_DEPTH guard test reads `index.ts` as a raw text file and checks that the string contains "MAX_DEPTH" and "depth". This is a compile-time content check, not a runtime behavior test. It would pass even if the constants were in dead code paths or comments. A proper test would exercise `ensureAncestorRoute` with a deep chain and verify the warning is emitted.

**Fix:** Replace with a runtime test that constructs a deep ancestor chain and verifies the cycle guard or depth limit behavior.

---

## Files Without Issues

The following files were reviewed and found to have no material defects:

- `src/features/session-tracker/persistence/atomic-write.ts` — clean atomic write implementations with proper cross-volume detection and post-rename cleanup
- `src/features/session-tracker/persistence/hierarchy-index.ts` — correct O(1) lookup, proper cycle guards, thorough root-main resolution
- `src/features/session-tracker/initialization.ts` — clean dependency construction with correct DI wiring
- `src/features/session-tracker/tool-delegation.ts` — correct polling pattern (WR-02 aside), proper pruned metadata extraction
- `tests/features/session-tracker/persistence/atomic-write.test.ts` — comprehensive F-01 temp leak coverage
- `tests/features/session-tracker/persistence/project-index-writer.test.ts` — good G-3 status-preservation test
- `tests/features/session-tracker/persistence/hierarchy-index.test.ts` — thorough root-main resolution tests
- `tests/features/session-tracker/persistence/child-writer.test.ts` — good D-03 root-main routing and F-18 backfill tests
- `tests/features/session-tracker/integration/phase-21.test.ts` — strong end-to-end scenario coverage
- `tests/lib/delegation-persistence.test.ts` — good G-4 unconditional persistence and redaction tests

---

_Reviewed: 2026-05-21T12:00:00Z_
_Reviewer: mimo-v2.5-pro-precision (gsd-code-reviewer)_
_Depth: standard_
