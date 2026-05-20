---
phase: 18-root-cleanup-sync-boundary-sync-manifest
reviewed: 2026-05-21T05:30:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/task-management/continuity/store-cache.ts
  - src/task-management/continuity/index.ts
  - tests/task-management/continuity/store-cache.test.ts
  - tests/lib/continuity.test.ts
  - src/index.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 18: Code Review Report

**Reviewed:** 2026-05-21T05:30:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed 5 source files across Phase 18 — the `store-cache.ts` extraction, continuity/index.ts import updates, barrel narrowing in src/index.ts, and the corresponding tests.

**No CRITICAL bugs found.** The architectural split of `storeCache` into a dedicated module (`store-cache.ts`) with `get/set/reset` API is clean and follows the CQRS surface model correctly. Import paths use correct `.js` ESM extensions. No circular dependencies introduced.

**Two WARNING-level findings:**
1. **WR-01** — Semantic duplicate tests in `continuity.test.ts` (pairs of tests covering identical code paths)
2. **WR-02** — Stale `resetStoreCache` import reference renders the explicit reset calls ineffective after `vi.resetModules()`, creating a fragile isolation dependency

**Two INFO-level findings:** `as any` type erosion in cache mock objects; missing barrel re-export of store-cache.

## Warnings

### WR-01: Semantic duplicate tests in continuity.test.ts

**Files:**
- `tests/lib/continuity.test.ts:49` — `"quarantines corrupt canonical session-continuity.json and throws visibly"`
- `tests/lib/continuity.test.ts:180` — `"should handle corrupt continuity file by quarantining and throwing"`

**Issue:** Two tests cover the identical scenario — write garbage JSON to the continuity file, verify `[Harness]` error is thrown, verify the file is quarantined. Test bodies differ only in the garbage content (`"NOT JSON {{{"` vs `"NOT JSON {{{ GARBAGE }}}"`) and the assertion style (`some()` vs `filter().length`). These exercise the same code path in `loadStoreFromDisk()` → `quarantineCorruptFile()`.

**Fix:** Remove the duplicate at line 180-197; the test at line 49-57 is more concise and covers the same contract. If the intent was to test multiple payload shapes, add a parameterized test or an explicit `it.each`:

```typescript
it.each(["NOT JSON {{{", "NOT JSON {{{ GARBAGE }}}", "", "{"]})(
  "quarantines corrupt payload: %s",
  (payload) => { ... }
)
```

---

**Files:**
- `tests/lib/continuity.test.ts:199` — `"should handle missing continuity file gracefully"`
- `tests/lib/continuity.test.ts:214` — `"should handle empty continuity file"`

**Issue:** Both tests write `"{}"` to the continuity file and expect `listSessionContinuity()` to return `[]`. Despite having different names ("missing" vs "empty"), the implementation is identical — both write a valid empty JSON object `"{}"` to disk. Neither actually tests a "missing" file scenario (no file at all).

The "missing" test at line 199 writes `"{}"` specifically to prevent legacy fallback (as the inline comment explains), but this makes it functionally identical to the "empty" test.

**Fix:** Merge into one test that covers "empty store on disk" or differentiate them:
- Test "missing file" by actually deleting the file and expecting graceful empty state
- Test "empty file" by writing `"{}"` and expecting empty sessions

### WR-02: Fragile stale import of `resetStoreCache` after `vi.resetModules()`

**File:** `tests/lib/continuity.test.ts:7`
**Lines called at:** `170`, `274`

**Issue:** The `resetStoreCache` function is imported at line 7 during test-file parse time.`beforeEach` (line 31) calls `vi.resetModules()`, which clears the Node.js module registry. After this, the `resetStoreCache` reference at line 7 still points to the *original* (now stale) module instance, not the one used by the freshly imported `continuity/index.js`.

Line 170:
```typescript
resetStoreCache()  // ← modifies STALE module's cache — no effect on fresh import
const continuity2 = await import("../../src/task-management/continuity/index.js")  // ← fresh, clean cache
```

This means:
1. The explicit `resetStoreCache()` calls at lines 170 and 274 are **dead code** — they modify the old module instance's cache, not the fresh one
2. Test isolation relies entirely on `vi.resetModules()` in `beforeEach`, but the `resetStoreCache()` calls create a misleading appearance of explicit self-isolation
3. If `vi.resetModules()` is ever removed from `beforeEach`, the stale `resetStoreCache` would still be the *only* reference (accidentally correct by closure), creating a hidden dependency

**Fix:** For the "rehydrate" and "preserve all delegation records" tests (lines 161, 228), remove the redundant `resetStoreCache()` call since `vi.resetModules()` already guarantees a fresh cache. If explicit cache reset is desired as a safety net, import `resetStoreCache` dynamically alongside the continuity module:

```typescript
const continuity2 = await import("../../src/task-management/continuity/index.js")
const { resetStoreCache: resetFresh } = await import("../../src/task-management/continuity/store-cache.js")
resetFresh()  // ← operates on the same fresh module instance
```

## Info

### IN-01: `as any` type erosion in store-cache.test.ts

**File:** `tests/task-management/continuity/store-cache.test.ts`
**Lines:** `14`, `20`, `27`

**Issue:** Three test mocks use `as any` type assertions, bypassing `ContinuityStoreFile` type validation:

```typescript
const mockCache = { version: 1, sessions: {} } as any
```

The `as any` casts bypass the missing `governance` and `updatedAt` fields. While this is acceptable for a generic cache (the module stores/returns `T | undefined` with no behavioral dependence on shape), it means type regressions in `ContinuityStoreFile` would not be caught by these tests.

**Fix:** Use `Partial<ContinuityStoreFile> as ContinuityStoreFile` or construct full mock objects with the `emptyStore()` pattern:

```typescript
const mockCache: ContinuityStoreFile = { version: 1, sessions: {}, governance: { rules: [], violations: [], updatedAt: 0 }, updatedAt: Date.now() }
```

### IN-02: No barrel re-export of store-cache from continuity/index.ts

**File:** `src/task-management/continuity/index.ts`
**Check:** Line 7 imports from `./store-cache.js`

**Issue:** The `store-cache.ts` module is not re-exported from the `continuity/index.ts` barrel. This is intentional (documented with `@internal`) and follows the principle of hiding implementation details. However, `src/index.ts`'s `export * from "./task-management/continuity/index.js"` will NOT expose `getStoreCache/setStoreCache/resetStoreCache` to package consumers.

**Impact:** Minimal — the `@internal` annotation is correct. Downstream tests that need `resetStoreCache` must use the deep import path `src/task-management/continuity/store-cache.js`, which is the expected pattern for internal test utilities. No change required unless a public consumer needs cache manipulation.

## Files with no issues

- **`src/task-management/continuity/store-cache.ts`** — Clean implementation (34 LOC). Correct `import type` for `ContinuityStoreFile`. Proper JSDoc with `@internal` annotation. Module-level variable pattern is explicit and well-documented. No security concerns (no secrets, no I/O, no eval).
- **`src/task-management/continuity/index.ts`** — Import path `./store-cache.js` is correct with `.js` ESM extension. `ensureStoreLoaded()` uses `getStoreCache()`/`setStoreCache()` correctly. All 8 public API functions properly delegate through `ensureStoreLoaded()`. No circular dependencies introduced (store-cache.ts imports only from shared/types.ts, index.ts imports from store-cache.ts — leaf dependency).
- **`src/index.ts`** — Barrel correctly excludes `store-cache` exports since they are `@internal`. No dead or circular exports.

---

_Reviewed: 2026-05-21T05:30:00Z_
_Reviewer: gsd-code-reviewer (mimo-v2.5-pro-precision)_
_Depth: standard_
