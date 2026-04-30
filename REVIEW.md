---
reviewed: 2026-04-26T20:23:55Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/lib/delegation-manager.ts
  - src/lib/continuity.ts
  - src/lib/concurrency.ts
  - src/lib/completion-detector.ts
  - src/lib/helpers.ts
  - src/lib/types.ts
  - src/lib/notification-handler.ts
  - src/lib/task-status.ts
  - src/lib/delegation-persistence.ts
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Code Review Report

**Reviewed:** 2026-04-26T20:23:55Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed 9 core library modules (`src/lib/`) totaling ~2,380 LOC. The codebase demonstrates strong architecture: clean separation of concerns, proper atomic file writes, deep-clone-on-read patterns, and correct error handling with `[Harness]` prefix convention. No critical security vulnerabilities or crash-inducing bugs were found.

Four warnings were identified: a duplicate `mkdirSync` call in persistence code, loose equality in a type guard, a duplicated `Set` allocation on every prune call, and duplicated utility functions across modules. Five informational items cover style improvements, near-limit module sizes, and import consolidation.

## Warnings

### WR-01: Redundant `mkdirSync` call in `persistDelegations`

**File:** `src/lib/delegation-persistence.ts:58-65`
**Issue:** `persistDelegations()` calls `mkdirSync(dirname(filePath), { recursive: true })` on line 58, then again on line 65. The second call is identical and completely redundant — the directory already exists by that point. While harmless in practice, it introduces unnecessary filesystem I/O on every delegation persistence write.
**Fix:**
```typescript
// Line 58: Keep this one
mkdirSync(dirname(filePath), { recursive: true })
// Line 65: Remove this duplicate
// mkdirSync(dirname(filePath), { recursive: true })
```

### WR-02: Loose equality `==` in `feedMessageCount` type guard

**File:** `src/lib/completion-detector.ts:88`
**Issue:** Uses `count == null` (loose equality) to check for null/undefined. Project code style (TypeScript strict mode) and general best practice favors `===`. The comment references "Bug F3: graceful no-op" suggesting this was a defensive patch, but the parameter is typed as `number` — the guard should use `===` consistently with project conventions.
**Fix:**
```typescript
// Before:
if (count == null || !Number.isFinite(count) || count < 0) return

// After:
if (!Number.isFinite(count) || count < 0) return
// Note: Since `count` is typed as `number`, `!Number.isFinite()` already
// catches NaN and Infinity. If null/undefined callers exist, they should
// be fixed at the call site rather than silently swallowed here.
```

### WR-03: `Set<DelegationStatus>` recreated on every `pruneCompletedDelegations` call

**File:** `src/lib/delegation-manager.ts:311`
**Issue:** `new Set(["completed", "error", "timeout"])` is instantiated on every call to `pruneCompletedDelegations()`. This method may be called frequently during high-throughput delegation workloads. The Set is immutable and should be a module-level constant.
**Fix:**
```typescript
// Move to module-level constant (near VALID_DELEGATION_TRANSITIONS):
const TERMINAL_DELEGATION_STATUSES: ReadonlySet<DelegationStatus> = new Set(["completed", "error", "timeout"])

// Then in pruneCompletedDelegations:
pruneCompletedDelegations(maxAgeMs: number = DEFAULT_PRUNE_MAX_AGE_MS): number {
  const now = Date.now()
  const toPrune: string[] = []
  for (const [id, delegation] of this.delegations) {
    if (!TERMINAL_DELEGATION_STATUSES.has(delegation.status)) continue
    // ...
```

### WR-04: Duplicated `deriveDelegationSurface` and `deriveRecoveryGuarantee` functions

**File:** `src/lib/delegation-manager.ts:30-42` and `src/lib/delegation-persistence.ts:20-34`
**Issue:** Both files contain identical implementations of `deriveDelegationSurface()` and `deriveRecoveryGuarantee()`. This violates DRY and creates a maintenance risk — if the logic changes, both copies must be updated in lockstep.
**Fix:**
Extract to a shared location (e.g., `helpers.ts` or a new `delegation-helpers.ts`), then import from both files:
```typescript
// In helpers.ts or a new delegation-helpers.ts:
export function deriveDelegationSurface(executionMode: Delegation["executionMode"]): DelegationSurface {
  return executionMode === "sdk" ? "agent-delegation" : "command-process"
}

export function deriveRecoveryGuarantee(executionMode: Delegation["executionMode"]): DelegationRecoveryGuarantee {
  if (executionMode === "sdk") return "resumable"
  if (executionMode === "pty") return "best-effort"
  return "non-resumable-after-restart"
}
```

## Info

### IN-01: Duplicate type imports in `notification-handler.ts`

**File:** `src/lib/notification-handler.ts:11-12`
**Issue:** Types from `./types.js` are imported across two separate `import type` lines:
```typescript
import type { Delegation } from "./types.js"
import type { SessionContinuityRecord, TaskNotification } from "./types.js"
```
**Fix:** Consolidate to a single import:
```typescript
import type { Delegation, SessionContinuityRecord, TaskNotification } from "./types.js"
```

### IN-02: Module-level `storeCache` singleton prevents isolated testing

**File:** `src/lib/continuity.ts:21`
**Issue:** The `let storeCache: ContinuityStoreFile | undefined` singleton at module scope makes it impossible to run isolated unit tests without leaking state between test cases. This is acknowledged in `src/lib/AGENTS.md` as a known code smell.
**Fix:** Consider adding a `_resetCache()` export for test use, or refactoring to accept a cache instance parameter.

### IN-03: `types.ts` approaching 500 LOC module size limit

**File:** `src/lib/types.ts:493`
**Issue:** At 493 lines, `types.ts` is 7 lines from the project's 500 LOC module size limit. It already re-exports config-workflow types (lines 485-493). Any new type additions will exceed the limit.
**Fix:** Consider moving the config-workflow re-exports to a separate barrel file, or splitting delegation-specific types into `delegation-types.ts`.

### IN-04: `continuity.ts` at 450 LOC — approaching module size limit

**File:** `src/lib/continuity.ts:450`
**Issue:** At 450 lines, this module has 50 lines of headroom before hitting the 500 LOC limit. The inline clone functions and normalizer logic are the bulk. Documented as a monitoring item in `src/lib/AGENTS.md`.
**Fix:** If growth is anticipated, extract clone helpers to a separate `continuity-clone.ts` module.

### IN-05: `normalizeContinuityRecord` uses unchecked `as` type assertions

**File:** `src/lib/continuity.ts:175-176`
**Issue:** `meta.status as SessionContinuityMetadata["status"]` uses a type assertion without runtime validation. If persisted data contains an invalid status string (e.g., `"unknown_state"`), it would propagate through without being caught. The normalizer does handle the fallback case via `?? "pending"` but doesn't validate the string is a valid `TaskStatus`.
**Fix:** Add explicit status validation:
```typescript
const VALID_TASK_STATUSES = new Set(["pending", "queued", "running", "completed", "failed", "error", "cancelled", "interrupt"])
// ...
status: VALID_TASK_STATUSES.has(meta.status) ? (meta.status as SessionContinuityMetadata["status"]) : "pending",
```

---

_Reviewed: 2026-04-26T20:23:55Z_
_Reviewer: gsd-code-reviewer (subagent)_
_Depth: standard_
