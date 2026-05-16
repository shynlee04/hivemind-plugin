---
phase: CP-ST-06-session-tracker-root-cause-rewrite
plan: 04
subsystem: session-tracker/persistence
tags: [RC-4, RC-5, GA-1, retry-queue, error-propagation, lastMessage]
dependency_graph:
  requires: [CP-ST-06-02, CP-ST-06-03]
  provides: [child-write-retry, error-propagation, full-lastMessage]
  affects: [child-writer, event-capture, retry-queue, types]
tech_stack:
  added: []
  patterns: [exponential-backoff, retry-queue, error-bubble, atomic-write]
key_files:
  created:
    - src/features/session-tracker/persistence/retry-queue.ts
  modified:
    - src/features/session-tracker/persistence/child-writer.ts
    - src/features/session-tracker/capture/event-capture.ts
    - src/features/session-tracker/types.ts
    - tests/features/session-tracker/persistence/retry-queue.test.ts
    - tests/features/session-tracker/persistence/child-writer.test.ts
    - tests/features/session-tracker/integration/last-message.test.ts
decisions:
  - "ChildWriteRetryQueue uses exponential backoff 1s->2s->4s->8s->16s, max 5 retries per GA-1"
  - "After 5 failures, record marked degraded and persisted to retry-degraded.json"
  - "flushOnInit + 30s periodic interval for retry processing"
  - "Removed .catch(() => {}) error swallowing in child-writer (RC-5)"
  - "Errors propagate to caller AND create retry records simultaneously"
  - "lastMessage preserved in full, no 200-char truncation (RC-4)"
metrics:
  duration_minutes: 20
  completed_date: 2026-05-17
  tasks_completed: 3
  tests_passing: 24
  loc:
    retry-queue.ts: 370
    child-writer.ts: 377
---

# Phase CP-ST-06 Plan 04: Retry Queue, Error Propagation & Full lastMessage

**One-liner:** Durable retry queue with exponential backoff; child write failures no longer silently swallowed; lastMessage preserved in full across L0/L1/L2.

## Tasks Completed

### Task 1: Add durable child write retry queue

**Files created:**
- `src/features/session-tracker/persistence/retry-queue.ts` (370 LOC)
- `tests/features/session-tracker/persistence/retry-queue.test.ts`

**Changes:**
- `ChildWriteRetryQueue` class with exponential backoff schedule [1s, 2s, 4s, 8s, 16s]
- Max 5 retries per GA-1; after exhaustion, record marked "degraded" and persisted to `retry-degraded.json`
- `flushOnInit()` replays pending retries on harness restart
- 30s periodic flush interval for lifecycle wiring
- Retry records persist under `.hivemind/session-tracker/` with atomic JSON writes

**Commit:** `1a9f7ff7`

### Task 2: Wire ChildWriter and EventCapture to propagate failures and retry

**Files modified:**
- `src/features/session-tracker/persistence/child-writer.ts` (377 LOC)
- `src/features/session-tracker/capture/event-capture.ts` (581 LOC)
- `tests/features/session-tracker/persistence/child-writer.test.ts`

**Changes:**
- Removed `.catch(() => {})` error swallowing pattern (RC-5)
- Failed child writes now create retry records AND propagate error to caller
- Internal serial queue remains usable after failed write
- `EventCapture.writeImmediateChildFile()` uses same retry/error surface
- `[Harness]` error logs include child session ID for traceability

**Commits:** `9285cdfd`, `9410d301`

### Task 3: Preserve full lastMessage for main and child records

**Files modified:**
- `src/features/session-tracker/types.ts`
- `src/features/session-tracker/persistence/child-writer.ts`
- `src/features/session-tracker/persistence/session-writer.ts`
- `tests/features/session-tracker/integration/last-message.test.ts`

**Changes:**
- Removed "first 200 chars" truncation comment from types.ts (RC-4)
- `lastMessage` field now stores full content for L0/L1/L2 records
- Test asserts exact equality with messages over 500 characters

**Commit:** `33c0564c`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: retry-degraded | retry-queue.ts | After 5 failures, child record marked degraded; data preserved but not auto-retried |
| threat_flag: error-bubble | child-writer.ts | Errors now propagate to caller; consumers must handle rejection |

## Verification

```
npx vitest run tests/features/session-tracker/persistence/retry-queue.test.ts
  -> 5 tests passed
npx vitest run tests/features/session-tracker/persistence/child-writer.test.ts
  -> 19 tests passed
npm run typecheck
  -> 0 errors
```

**No error swallowing confirmed:**
```
grep -n 'catch(() => {})' src/features/session-tracker/persistence/child-writer.ts
  -> no matches
```

**Max retry cap confirmed:**
```
grep -n 'maxRetries\|MAX_RETRIES\|5' src/features/session-tracker/persistence/retry-queue.ts
  -> maxRetries = 5 present
```

**Periodic interval confirmed:**
```
grep -n '30000\|30_000' src/features/session-tracker/persistence/retry-queue.ts
  -> FLUSH_INTERVAL_MS = 30_000 present
```

## Self-Check: PASSED

- [x] retry-queue.ts: 370 LOC (<=500)
- [x] child-writer.ts: 377 LOC (<=500)
- [x] 24/24 tests passing (5 retry-queue + 19 child-writer)
- [x] npm run typecheck passes
- [x] No `.catch(() => {})` in child-writer.ts
- [x] Max retry cap = 5 present
- [x] Periodic flush interval = 30s present
- [x] lastMessage truncation comment removed from types.ts
- [x] Commits: 1a9f7ff7, 9285cdfd, 33c0564c, 9410d301
