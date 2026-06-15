---
phase: 21
fixed_at: 2026-05-21T22:26:00Z
review_path: .planning/phases/21-session-tracker-design-fix/21-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 21: Code Review Fix Report

**Fixed at:** 2026-05-21T22:26:00Z
**Source review:** `.planning/phases/21-session-tracker-design-fix/21-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### REQ-21-02: Cross-volume test is NO-OP (atomic-write.test.ts:312-328)

**Files modified:** `tests/features/session-tracker/persistence/atomic-write.test.ts`
**Commit:** `5d1b6a6e`
**Applied fix:** Replaced the no-op cross-volume test with a proper implementation using `vi.mock("node:fs/promises")` with a `vi.hoisted` flag. `stat` returns `{ dev: 1 }` for tmp paths and `{ dev: 2 }` for target paths when the flag is enabled. Asserts `process.emitWarning` is called with "Cross-volume rename detected" containing `tmp dev=1` and `target dev=2`. Also added a same-device negative test that asserts the warning is NOT emitted when stat returns real (same-dev) values. All existing tests continue using real `stat` when the hoisted flag is `false`.

### REQ-21-07: MAX_DEPTH source-grep only (session-tracker.test.ts:235-244)

**Files modified:** `tests/features/session-tracker/session-tracker.test.ts`
**Commit:** `ee054a4b`
**Applied fix:** Replaced the source-grep-only test (which read the source file as a string to check for "MAX_DEPTH" and "depth" text) with two proper runtime tests:
1. Direct guard test — calls `ensureAncestorRoute` with `depth=25` (exceeds `MAX_DEPTH=20`) and verifies it returns gracefully without throwing, plus verifies the warning is logged via `client.app.log`
2. Chain depth test — creates a mock chain of 25+ ancestor sessions via `getSessionSafely` mock, calls `ensureAncestorRoute` at `depth=0`, and verifies the recursion completes without stack overflow

Removed unused `readFileSync` and `resolve` imports.

### REQ-21-14: No orphan-cleanup.test.ts exists

**Files modified:** `tests/features/session-tracker/persistence/orphan-cleanup.test.ts` (new file)
**Commit:** `8304937c`
**Applied fix:** Created orphan-cleanup.test.ts with 7 tests across 3 describe blocks:
1. **checkContinuityTree** (3 tests) — returns `true` when continuity file exists, `false` when missing, `false` for non-existent session
2. **cleanupOrphanDirectories warning** (2 tests) — warning emitted when quarantining a session WITH a continuity tree entry; no false-positive warning when continuity file absent
3. **Temp directory lifecycle** (2 tests) — `mkdtempSync`/`rmSync` lifecycle works correctly, handles non-existent directory cleanup gracefully

Tests access the private `checkContinuityTree` method via `(cleanup as any)` and verify the full `cleanupOrphanDirectories` path with real temp directories.

### REQ-21-15: No warning emission test for depth truncation (hierarchy-index.test.ts:191-203)

**Files modified:** `tests/features/session-tracker/persistence/hierarchy-index.test.ts`
**Commit:** `a58094e2`
**Applied fix:** Added a new test `"should emit warning when delegation depth exceeds max L2 cap"` that uses `vi.spyOn(process, "emitWarning")` before registering a 3-level deep chain (L0→L1→L2→L3) and calling `getDepth("ses_l3")`. Asserts `process.emitWarning` was called with a message containing `"delegation depth 3 exceeds max 2"`. Spy is properly restored in a `finally` block.

---

_Fixed: 2026-05-21T22:26:00Z_
_Fixer: gsd-code-fixer_
_Iteration: 1_
