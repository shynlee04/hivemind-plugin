---
phase: 13
plan: 02
subsystem: lifecycle-result-capture
tags: [result-capture, lifecycle, notification, type-fix]
dependency_graph:
  requires: [13-01]
  provides: [wired-result-capture-observer-process-runner]
  affects: [lifecycle-background-observer, lifecycle-process-runner, lifecycle-dispatcher, notification-handler]
tech_stack:
  added: []
  patterns: [capture-before-notification, type-alignment]
key_files:
  created: []
  modified:
    - src/lib/lifecycle-runner-shared.ts
    - src/lib/lifecycle-process-runner.ts
    - src/lib/lifecycle-background-observer.ts
    - src/lib/lifecycle-dispatcher.ts
    - src/lib/notification-handler.ts
    - tests/lib/lifecycle-background-observer.test.ts
    - tests/lib/lifecycle-process-runner.test.ts
    - tests/lib/notification-handler.test.ts
    - tests/lib/notification-handler-malformed.test.ts
    - tests/lib/delegate-task.test.ts
decisions:
  - Guard delegationPacket spread with existingPacket check to avoid undefined required fields
  - Updated tests to reflect MAX_PREVIEW_LENGTH change from 100 to 500
metrics:
  duration: 10m
  completed: 2026-04-15
  tasks: 4
  files: 11
---

# Phase 13 Plan 02: Wire Result Capture into Observer, Process Runner, and Notifications Summary

Fix `patchSessionContinuity` type signature mismatch across lifecycle components and wire missing call sites in dispatcher, enabling result capture before notification in async completion paths.

## What was done

### Type signature fix (6 errors → 0)

The previous executor added `patchSessionContinuity` with an incorrect type `(sessionID: string, patch: Record<string, unknown>) => boolean | void` in 3 locations. The real function from `continuity.ts` has signature `(sessionID: string, patch: Partial<SessionContinuityMetadata>) => SessionContinuityRecord | undefined`. Fixed in:

1. `lifecycle-runner-shared.ts` — `CommonRunnerArgs.patchSessionContinuity`
2. `lifecycle-process-runner.ts` — `RunLifecycleSubsessionArgs.patchSessionContinuity`
3. `lifecycle-background-observer.ts` — `observeBackgroundCompletion` args type

### Missing call-site arguments (3 errors → 0)

The sync dispatch path in `lifecycle-dispatcher.ts` was missing `patchSessionContinuity` in 3 call sites:
- Sync tmux runner call (~line 422)
- Sync process runner call (~line 449)
- Sync subsession runner call (~line 471)

### DelegationPacket spread guard

The spread pattern `{ ...(delegationPacket ?? {}) }` created optional required fields (`id`, `spec`). Fixed by checking `existingPacket` before spreading — only updating when a packet already exists.

### Test updates

- **notification-handler.test.ts**: Updated truncation test from 200-char input (under old 100 threshold) to 600-char input (over new 500 threshold)
- **notification-handler-malformed.test.ts**: Updated boundary test from 101 chars to 501 chars
- **delegate-task.test.ts**: Updated assertion from "completed work on" to match enriched notification content

### New tests (5 added)

- Observer: captures result on completion via patchSessionContinuity
- Observer: attempts partial capture on deleted session
- Observer: notification proceeds even when capture fails
- Process runner: async completion captures result to continuity
- Process runner: async notification includes captured result preview

## Verification

- `npx tsc --noEmit` — 0 errors
- `npm test` — 706 tests pass (5 new, 701 existing)
- `grep "captureSubsessionResult" src/lib/lifecycle-background-observer.ts` — import exists
- `grep "captureProcessResult" src/lib/lifecycle-process-runner.ts` — import exists
- `grep "resultCapture" src/lib/notification-handler.ts` — notification uses captured result
- All capture calls wrapped in try/catch (capture failure never blocks notification)

## Commits

| Hash | Message |
|------|---------|
| `ec5643cd` | feat(13-02): wire result capture into lifecycle components |
| `b8772efb` | test(13-02): add lifecycle result capture tests |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed patchSessionContinuity type mismatch**
- **Found during:** Initial typecheck
- **Issue:** Signature was `(sessionID: string, patch: Record<string, unknown>) => boolean | void` but real function returns `SessionContinuityRecord | undefined` and accepts `Partial<SessionContinuityMetadata>`
- **Fix:** Updated type in all 3 locations to match continuity.ts
- **Files:** lifecycle-runner-shared.ts, lifecycle-process-runner.ts, lifecycle-background-observer.ts

**2. [Rule 3 - Blocking] Missing patchSessionContinuity in sync call sites**
- **Found during:** Initial typecheck (3 TS2345 errors)
- **Issue:** Sync dispatch path missing `patchSessionContinuity` parameter in 3 runner calls
- **Fix:** Added `patchSessionContinuity` to all 3 call sites in lifecycle-dispatcher.ts
- **Files:** lifecycle-dispatcher.ts

**3. [Rule 1 - Bug] DelegationPacket spread creates optional required fields**
- **Found during:** Typecheck after initial fixes
- **Issue:** `{ ...(delegationPacket ?? {}) }` makes required `id` and `spec` fields optional
- **Fix:** Guard with `existingPacket` check before spreading
- **Files:** lifecycle-background-observer.ts, lifecycle-process-runner.ts

**4. [Rule 1 - Bug] Existing tests broken by MAX_PREVIEW_LENGTH and notification enrichment**
- **Found during:** Test run (3 failures)
- **Issue:** Plan changed MAX_PREVIEW_LENGTH from 100→500 and `buildTaskNotificationFromContinuity` now uses captured result text, but tests expected old behavior
- **Fix:** Updated test assertions to match new thresholds and enriched content
- **Files:** notification-handler.test.ts, notification-handler-malformed.test.ts, delegate-task.test.ts

## Self-Check

- `ec5643cd` exists in git log ✓
- `b8772efb` exists in git log ✓
- `src/lib/lifecycle-runner-shared.ts` modified ✓
- `src/lib/lifecycle-process-runner.ts` modified ✓
- `src/lib/lifecycle-background-observer.ts` modified ✓
- `src/lib/lifecycle-dispatcher.ts` modified ✓
- `npx tsc --noEmit` exits 0 ✓
- `npm test` passes 706 tests ✓
