---
phase: 22-coordination-status-error-unification
plan: 02
subsystem: coordination
tags: notification-router, retry, TTL, pending, replay-cleanup
requires:
  - phase: 22-01
    provides: DelegationError types, HarnessStatus types
provides:
  - Retry counter for failed notification deliveries (maxRetries=1 default)
  - TTL expiry for stale pending notifications (5min default)
  - Updated PendingNotificationRecord with retryCount, maxRetries, expiresAt
  - replayPending() cleanup that purges expired records from in-memory Map
affects:
  - 22-03 (PendingNotification in shared/types.ts — separate schema)
  - 25 (continuity persistence — serialization format)

tech-stack:
  added: []
  patterns:
    - Retry state tracked via Map<string, RetryState>, separate from this.routes
    - shouldQueuePending() gate method filters expired/exhausted before queue
    - replayPending() TTL check purges stale records at replay time
    - deregister() cleans up retryState to prevent memory leak

key-files:
  created: []
  modified:
    - src/coordination/delegation/notification-router.ts
    - tests/lib/coordination/delegation/notification-router.test.ts

key-decisions:
  - "Retry exhaustion filter at queuePending-time (not replay-time) — already-queued notifications are returned on replay; only NEW delivery attempts are blocked"
  - "TTL check at BOTH queue time and replay time — primary gate at shouldQueuePending(), safety net at replayPending() for records queued before expiry"
  - "RetryState tracked redundantly alongside PendingNotificationRecord — retryState Map is in-memory only; persisted via PendingNotificationRecord during serialization"
  - "Default maxRetries=1, default TTL=5min — matches SPEC.md requirements"
  - "retryCount starts at 1 on first failed delivery (not 0) — simplifies exhaustion check: retryCount >= maxRetries means 'at least maxRetries attempts already made'"

patterns-established:
  - "Retry/TTL gate: shouldQueuePending() called before queuePending() in both sync route() and async finalizeDelivery() paths"
  - "Memory safety: retryState cleaned up on deregister(), TTL expiry in replayPending(), and retry exhaustion in shouldQueuePending()"
  - "Persist fidelity: persistAllPending() reads retryState entries() to attach retryCount/maxRetries/expiresAt to each PendingNotificationRecord"

requirements-completed:
  - P22-05
  - P22-06
  - P22-07a
  - P22-08

duration: 12min
completed: 2026-05-22
---

# Phase 22 Plan 02: Notification Routing — Summary

**Retry counter, TTL expiry, PendingNotificationRecord schema update, and replayPending() memory cleanup for the NotificationRouter**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-22T21:19:28Z
- **Completed:** 2026-05-22T21:25:34Z
- **Tasks:** 3 (RED + GREEN + REFACTOR) committed as 2 atomic commits
- **Files modified:** 2 (1 source, 1 test)

## Accomplishments

- **P22-07a:** Extended `PendingNotificationRecord` interface with `retryCount`, `maxRetries`, `expiresAt` fields — existing fields preserved
- **P22-05:** Added `shouldQueuePending()` gate that checks `retryCount >= maxRetries` before queueing a failed delivery; first failure increments retryCount (0→1), second failure drops (1 >= 1)
- **P22-06:** Added TTL expiry check (`expiresAt <= Date.now()`) in `shouldQueuePending()` with 5-minute default; also checked at `replayPending()` time as safety net for records queued before expiry
- **P22-08:** `replayPending()` iterates `this.routes.entries()` to look up retryState per delegationId; expired records are purged — route.notifications cleared, retryState deleted, delegation excluded from replay results
- **P22-08:** `deregister()` cleans up both `this.routes` and `this.retryState` to prevent memory leak
- **P22-08:** `persistAllPending()` now serializes retry fields from retryState Map into each `PendingNotificationRecord`
- All 25 tests pass (10 existing + 5 new), typecheck clean

## Task Commits

Each task was committed atomically:

1. **RED: Add failing tests** — `e9df64c3` (test: phase-22)
   - 5 new tests for retry, TTL, schema, and replayPending cleanup
2. **GREEN: Implement features** — `3061b9c6` (feat: phase-22)
   - Retry counter, TTL check, schema update, replayPending cleanup, deregister cleanup, persist serialization

## Files Created/Modified

- `src/coordination/delegation/notification-router.ts` — +49/-3 lines:
  - PendingNotificationRecord: +3 fields (retryCount, maxRetries, expiresAt)
  - RetryState type and `this.retryState` Map added
  - `shouldQueuePending()` — new private gate method handling retry + TTL
  - `route()` sync path: calls `shouldQueuePending()` before `queuePending()`
  - `finalizeDelivery()` async path: calls `shouldQueuePending()` before `queuePending()`
  - `deregister()`: now cleans up `retryState`
  - `replayPending()`: TTL filter + retryState cleanup
  - `persistAllPending()`: serializes retry/TTL fields from retryState Map
- `tests/lib/coordination/delegation/notification-router.test.ts` — +104/-1 lines:
  - 5 new tests: schema verification, retry exhaustion, TTL expiry (past & future), replayPending purge (expired & exhausted)

## Decisions Made

- **Retry exhaustion at queue time, not replay time** — once a notification is successfully queued, it's returned on replay. Only NEW delivery attempts are blocked by retry exhaustion. This prevents valid queued notifications from being silently dropped at replay time.
- **TTL check at both points** — `shouldQueuePending()` blocks new queue entries after expiry (primary). `replayPending()` also checks expiry and purges stale records (safety net for records queued before TTL expired).
- **retryState Map for in-memory tracking** — separate from `this.routes` to enable per-delegation retry state without coupling to notification storage.
- **retryCount starts at 1 on first failure** — simplifies the exhaustion check: `retryCount >= maxRetries` means "already tried maxRetries times, drop this one."
- **Existing `queuePending()` public API unchanged** — retry/TTL logic is injected as a gate BEFORE `queuePending()` is called, not inside it. This preserves backward compatibility for tests that call `queuePending()` directly.

## Deviations from Plan

**None — plan executed exactly as written.**

- All 4 requirements (P22-05, P22-06, P22-07a, P22-08) implemented
- TDD pattern followed: RED (failing tests) → GREEN (implementation) → verification
- Scope boundary respected: no changes to `PendingNotification` in `shared/types.ts` or `continuity/index.ts`
- Threat mitigations applied: T-22-03 (retryState Map leak) mitigated via cleanup in `queuePending()`, `replayPending()`, and `deregister()`

### Design Note

The plan's Task 3 correction was followed: retry/TTL filter is applied at `shouldQueuePending()` time (Task 2), NOT at `replayPending()` time for retry exhaustion. `replayPending()` only checks TTL expiry as a safety net. This is the correct design because:
- Retry exhaustion prevents NEW queue entries (the second delivery failure is dropped)
- TTL expiry is checked at entry time AND at replay time (records queued before TTL expiry are caught at replay)
- Already-queued notifications with `retryCount >= maxRetries` are still returned on replay (they survived the gate)

## Issues Encountered

None.

## Threat Surface

No new threat surface introduced — retryState is in-memory only with cleanup on deregister/expiry/exhaustion. No new network endpoints, auth paths, or file access patterns added.

## Self-Check

```
npx vitest run tests/lib/coordination/delegation/notification-router.test.ts → 25 passed (25)
npm run typecheck                                    → clean
```

## Next Phase Readiness

- NotificationRouter now has retry/TTL for pending notifications
- Plan 03 (P22-07b) can safely update `PendingNotification` in `shared/types.ts` without conflicting with `PendingNotificationRecord` changes in this plan
- Continuity persistence (Phase 25) should consume the serialized `PendingNotificationRecord` retry fields

---
*Phase: 22-coordination-status-error-unification*
*Completed: 2026-05-22*
