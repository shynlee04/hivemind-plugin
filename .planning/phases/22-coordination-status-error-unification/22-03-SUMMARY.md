---
phase: 22-coordination-status-error-unification
plan: 03
name: Shared Schema + Phase Gate
type: execute
subsystem: coordination
tags:
  - P22-07b
  - P22-09
  - pending-notification
  - schema
  - phase-gate
requires:
  - 22-02
provides:
  - P22-07b (PendingNotification retryCount + maxRetries)
  - P22-09 (Scope boundary verification)
affects:
  - src/shared/types.ts
  - src/coordination/completion/notification-handler.ts
  - src/plugin.ts
  - tests/lib/coordination/delegation/status-mapping.test.ts
tech-stack:
  added: []
  patterns:
    - Additive schema fields for backward-compatible type extensions
key-files:
  created: []
  modified:
    - src/shared/types.ts
    - src/coordination/completion/notification-handler.ts
    - src/plugin.ts
    - tests/lib/coordination/delegation/status-mapping.test.ts
decisions:
  - "PendingNotification fields retryCount and maxRetries are required (not optional) to ensure callers explicitly initialize retry state"
  - "Default values: retryCount=0, maxRetries=3 for all existing callers"
  - "Type propagation fixups applied to notification-handler.ts and plugin.ts (Rule 3)"
metrics:
  duration: ~12 minutes
  completed: "2026-05-22"
---

# Phase 22 Plan 03: Shared Schema + Phase Gate Summary

Updated `PendingNotification` type with `retryCount` and `maxRetries` fields for continuity persistence compatibility (P22-07b). Verified `TERMINAL_EVENTS` in `detector.ts` (read-only, correct). Ran full coordination test suite (176 tests, all pass), typecheck (clean), and scope boundary verification (P22-09) — all pass.

## Success Criteria

| Criterion | Status |
|-----------|--------|
| PendingNotification has retryCount and maxRetries; createdAt preserved | ✅ |
| TERMINAL_EVENTS verified correct — no code change needed | ✅ |
| Tests for P22-07b pass in status-mapping.test.ts | ✅ (4/4) |
| `npx vitest run tests/lib/coordination/` passes | ✅ (176/176) |
| `npm run typecheck` passes | ✅ |
| `git diff --name-only` shows only allowed + Rule 3 fixup files | ✅ (see deviation) |
| No changes to lifecycle/, ralph-loop/, auto-loop/, etc. | ✅ |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Type propagation fixups for notification-handler.ts and plugin.ts**

- **Found during:** Task 2 (GREEN) — typecheck failed after updating PendingNotification
- **Issue:** Adding `retryCount: number` and `maxRetries: number` as required fields broke typecheck in 2 files that construct `PendingNotification` objects without these fields:
  - `src/coordination/completion/notification-handler.ts:141` — `queuedNotification` object
  - `src/plugin.ts:104` — `notification` object
- **Fix:** Added `retryCount: 0` and `maxRetries: 3` to both locations
- **Files modified:** `src/coordination/completion/notification-handler.ts`, `src/plugin.ts`
- **Commits:** `d0bc0e63`

### Scope Boundary Note (P22-09)

The 2 files above are NOT in the plan's allowed list but were required fixups for typecheck to pass. This is a valid Rule 3 deviation — the type propagation was unavoidable when adding required fields to a shared type consumed by callers.

**Allowed files vs actual changes:**

| File | Status |
|------|--------|
| `src/shared/types.ts` | ✅ Allowed |
| `tests/lib/coordination/delegation/status-mapping.test.ts` | ✅ Allowed |
| `src/coordination/completion/notification-handler.ts` | ⚠️ Rule 3 fixup |
| `src/plugin.ts` | ⚠️ Rule 3 fixup |
| `src/coordination/completion/detector.ts` | ✅ Read-only verify (no change) |

No files outside the Phase 22 scope (lifecycle/, ralph-loop/, auto-loop/, etc.) were touched.

## TERMINAL_EVENTS Verification

Read-only verification of `src/coordination/completion/detector.ts`:

| Mapping | Source | Verified |
|---------|--------|----------|
| `"session.idle"` → `"idle"` | TERMINAL_EVENTS constant | ✅ |
| `"session.error"` → `"error"` | TERMINAL_EVENTS constant | ✅ |
| `"session.deleted"` → `"deleted"` | TERMINAL_EVENTS constant | ✅ |
| `timeout` | `watch()` setTimeout (line 76) | ✅ |
| `cancelled` | `cancel()` method (line 164) | ✅ |
| `isTerminalStatus()` | DelegationStatus: `completed/error/timeout` | ✅ |

**Verdict:** TERMINAL_EVENTS mapping is correct — no code change needed.

## Threat Model Check

Per threat register T-22-05 (Tampering): PendingNotification type extension with additive-only fields. Existing serialized data continues to work (no mandatory migration needed) ✅.

Per T-22-06 (Information Disclosure): TERMINAL_EVENTS read-only verification — no behavioral change ✅.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `e8a9416c` | test | Add failing type-level tests for P22-07b PendingNotification schema |
| `d0bc0e63` | feat | Add retryCount and maxRetries to PendingNotification type (with type propagation fixups) |

## Self-Check: PASSED

- ✅ `src/shared/types.ts` — `retryCount` and `maxRetries` added to `PendingNotification`, `createdAt` preserved
- ✅ `src/coordination/completion/detector.ts` — unchanged, TERMINAL_EVENTS verified correct
- ✅ `tests/lib/coordination/delegation/status-mapping.test.ts` — 4 P22-07b tests present and passing
- ✅ Full coordination suite: 176 tests, 14 files, all pass
- ✅ Typecheck: clean
- ✅ Scope boundary: only allowed files + Rule 3 fixups
