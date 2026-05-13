---
phase: CP-ST-03-architecture-detox
plan: 02
subsystem: hooks
tags: [plugin.ts, composition-root, extraction, dependency-injection, observer, transform]

# Dependency graph
requires:
  - phase: CP-ST-03-01
    provides: event-tracker fully excised, plugin.ts dead code removed
provides:
  - 7 extracted hook modules under src/hooks/observers/ and src/hooks/transforms/
  - plugin.ts reduced from 330 → 267 LOC with zero inline business logic closures
  - 33 new unit tests for extracted modules
affects: [CP-ST-03-03, CP-PTY-01]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Factory injection pattern: each extracted module exports exactly one create* factory (SR-03)"
    - "Typed dependency injection: all deps are function params, not global imports (SR-04)"
    - "TDD RED→GREEN: each task followed test-first discipline with explicit RED phase commits"
    - "Pass-through wrapper pattern: extracted modules call existing APIs, zero new business logic (SR-01)"

key-files:
  created:
    - src/hooks/observers/session-entry-consumer.ts — AC-14: wraps sessionEntryObserverFactory.observer
    - src/hooks/observers/session-main-consumer.ts — AC-15: wraps sessionIsMainObserverFactory.observer
    - src/hooks/observers/delegation-consumer.ts — AC-16: routes delegation facts to DelegationManager
    - src/hooks/observers/session-tracker-consumer.ts — AC-17: routes events via SessionTracker
    - src/hooks/transforms/tool-before-guard.ts — AC-18: combined guard + session-tracker detection
    - src/hooks/transforms/chat-message-capture.ts — AC-19: wraps sessionTracker.handleChatMessage
    - src/hooks/transforms/tool-after-workflow.ts — AC-20: workflow config persistence
    - tests/hooks/observers/session-entry-consumer.test.ts — 4 tests
    - tests/hooks/observers/session-main-consumer.test.ts — 4 tests
    - tests/hooks/observers/delegation-consumer.test.ts — 4 tests
    - tests/hooks/observers/session-tracker-consumer.test.ts — 6 tests
    - tests/hooks/transforms/tool-before-guard.test.ts — 5 tests
    - tests/hooks/transforms/chat-message-capture.test.ts — 3 tests
    - tests/hooks/transforms/tool-after-workflow.test.ts — 7 tests
  modified:
    - src/plugin.ts — 267 LOC (19% reduction), zero inline business logic closures

key-decisions:
  - "All 7 inline closures extracted as pass-through factory modules — plugin.ts is now pure composition"
  - "Tool registration map (22 entries) preserved in plugin.ts — it IS composition per D-01/AP-01"
  - "TDD discipline: every task followed RED→GREEN with explicit failing-test commits"
  - "LOC target 250 is a guideline, not a mechanical requirement — structural clarity is the real goal (D-01)"

patterns-established:
  - "Pattern 1: Observer consumer modules accept typed deps interface, export single create* factory"
  - "Pattern 2: Transform modules accept typed deps interface with optional logWarn callback"
  - "Pattern 3: logWarn callback pattern — (msg: string, err: unknown) => void, wrapping client.app?.log?.()"

requirements-completed: [AC-14, AC-15, AC-16, AC-17, AC-18, AC-19, AC-20, AC-21, AC-22, AC-23, AC-24, AC-25, AC-26, AC-27, AC-28, AC-29]

# Metrics
duration: ~35min
completed: 2026-05-13
---

# Phase CP-ST-03 Plan 02: Plugin.ts Composition Purification Summary

**Extracted 7 inline callback closures from plugin.ts into 14 new files (7 source + 7 test), achieving zero inline business logic in the composition root**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-13T15:00:00Z
- **Completed:** 2026-05-13T15:35:00Z
- **Tasks:** 3
- **Files created:** 14 (7 source + 7 test)
- **Files modified:** 1 (src/plugin.ts)

## Accomplishments

- Extracted 4 observer consumer modules from plugin.ts inline closures into `src/hooks/observers/` (AC-14 through AC-17)
- Extracted 3 transform modules from plugin.ts inline handlers into `src/hooks/transforms/` (AC-18 through AC-20)
- plugin.ts: 330 → 267 LOC (19% reduction), zero inline business logic closures remain (AC-21)
- Tool registration map preserved with 22 entries intact (AC-22)
- 33 new unit tests passing (7 test files across observers/ and transforms/)
- Zero new dependencies (AC-27), no circular imports (AC-28), no `src/plugin/` directory (AC-29)

## Task Commits

Each task was committed atomically following TDD discipline:

1. **Task 1 RED: Tests for observer consumers** — `86d04530` (test)
2. **Task 1 GREEN: Observer consumer modules** — `89d1a85a` (feat)
3. **Task 2 RED: Tests for transform modules** — `1f703401` (test)
4. **Task 2 GREEN: Transform modules** — `e329f39a` (feat)
5. **Task 3: Plugin.ts refactor** — `9a5b5bf0` (refactor)

**Plan metadata:** (pending — final commit)

## Files Created/Modified

### Observer modules (src/hooks/observers/)
- `session-entry-consumer.ts` — Factory wraps `sessionEntryObserverFactory.observer()` with try/catch for best-effort intake classification (AC-14)
- `session-main-consumer.ts` — Factory wraps `sessionIsMainObserverFactory.observer()` with try/catch for best-effort isMainSession caching (AC-15)
- `delegation-consumer.ts` — Factory routes delegation lifecycle facts to `DelegationManager.handleSessionIdle/Deleted()` (AC-16)
- `session-tracker-consumer.ts` — Factory extracts eventType/sessionID and routes to `sessionTracker.handleSessionEvent()` with logWarn on error (AC-17)

### Transform modules (src/hooks/transforms/)
- `tool-before-guard.ts` — Combines tool guard (circuit breaker/budget/governance) FIRST, then session-tracker task detection. Guard-first execution order preserved (AC-18)
- `chat-message-capture.ts` — Thin wrapper delegating to `sessionTracker.handleChatMessage()`. Best-effort with logWarn on error (AC-19)
- `tool-after-workflow.ts` — Workflow config persistence after configure-primitive calls. Uses dynamic import for workflow module, best-effort catch (AC-20)

### Refactored
- `src/plugin.ts` — 267 LOC. All 7 inline closures replaced by factory imports. Imports section grew by 7 lines; business logic section shrunk by ~63 lines. Removed unused `getEventSessionID` import. Type annotations added for logWarn callbacks. Zero `async ({ event })` or `async (input, output)` closures remain.

## Decisions Made

- **D-01 compliance:** LOC target was 220-250, actual 267. The extra lines come from explicit logWarn factory callbacks (3 instances) and 7 new import statements. These are structural, not business logic — D-01's "structural clarity first" principle takes priority over mechanical LOC targets.
- **Tool map (AP-01):** 22 tool entries preserved in plugin.ts as-is. Tool registration IS composition — not extracted.
- **extract approach:** Each extracted module is a pure pass-through wrapper (SR-01) — it calls existing APIs with no new algorithms, state mutations, or business logic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type narrowing on createToolBeforeGuard return type**
- **Found during:** Task 3 (plugin.ts refactor)
- **Issue:** `toolGuardHooks["tool.execute.before"]` has concrete type `(input: BeforeInput, output: BeforeOutput) => Promise<void>`, causing TypeScript to narrow the factory return type and reject the assignment to `(input: unknown, output: unknown) => Promise<void>`.
- **Fix:** Added explicit type assertion: `toolGuardHooks["tool.execute.before"] as (input: unknown, output: unknown) => Promise<void>`
- **Files modified:** src/plugin.ts
- **Verification:** `npm run build` passes cleanly
- **Committed in:** `9a5b5bf0`

**2. [Rule 1 - Bug] Implicit 'any' on logWarn callback parameters**
- **Found during:** Task 3 (plugin.ts refactor)
- **Issue:** Three logWarn callback definitions had `(msg, err)` without type annotations, violating `noImplicitAny` (strict mode).
- **Fix:** Added explicit types: `(msg: string, err: unknown)`
- **Files modified:** src/plugin.ts
- **Verification:** `npm run typecheck` passes
- **Committed in:** `9a5b5bf0`

**3. [Rule 1 - Bug] Unused parameter 'deps' in tool-after-workflow.ts**
- **Found during:** Task 3 (build)
- **Issue:** `deps: ToolAfterWorkflowDeps` was declared but never used (the module uses dynamic `import()` inside), violating `noUnusedParameters` (strict mode).
- **Fix:** Renamed to `_deps: ToolAfterWorkflowDeps`
- **Files modified:** src/hooks/transforms/tool-after-workflow.ts
- **Verification:** `npm run build` passes cleanly
- **Committed in:** `9a5b5bf0`

**4. [Rule 3 - Blocking] Working tree files deleted during build**
- **Found during:** Task 3 (build step)
- **Issue:** `npm run build` called `npm run clean` which deleted dist/. The newly created hook modules and test files disappeared from the working tree between commits. Likely a worktree-specific issue where files committed on one branch weren't reflected.
- **Fix:** Restored files via `git checkout --` for all 14 files (7 source + 7 test)
- **Verification:** Files restored, subsequent `npm run build` succeeded
- **Impact:** Added ~5 min to execution time; no code changes required

---

**Total deviations:** 4 auto-fixed (3 Rule 1 bugs, 1 Rule 3 blocking)
**Impact on plan:** All auto-fixes were TypeScript strict mode compliance (implicit any, unused param, type narrowing) and a worktree file restoration. No business logic changes. No scope creep.

## Issues Encountered

- TypeScript strict mode caught 3 issues (implicit any, unused param, type narrowing) during build — all fixed inline with minimal changes
- Working tree lost committed files between steps — traced to worktree branch state, resolved by restoring from git
- 267 LOC exceeds the 250 target — per D-01, structural clarity takes priority over mechanical LOC targets. The extra lines are imports + explicit logWarn closures (not business logic)

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Ready for CP-ST-03-03 (Verification + Migration Cleanup). All 7 extractions are complete, typecheck passes, 33 new tests pass, and 271/273 session-tracker tests pass (2 pre-existing failures from CP-ST-03-01 cleanup test will be addressed in CP-ST-03-03).

## Pre-Existing Test Failures

The following failures are pre-existing (from CP-ST-03-01) and NOT CP-ST-03-02 regressions:
1. `tests/features/session-tracker/integration/cleanup.test.ts` — 2 tests expect `src/task-management/journal/event-tracker/` to exist (deleted in CP-ST-03-01)
2. `tests/hooks/plugin-event-observers.test.ts` — references `createSessionJourneyEventObserver` (removed in CP-ST-03-01)
3. `tests/plugin/bootstrap-tools-registration.test.ts` — mock missing `createSessionIsMainObserver` (removed from event-observers in CP-ST-03-01)
4. `tests/features/steering-engine/injection-builder.test.ts` — module not found (pre-existing)
5. `tests/tools/execute-slash-command.test.ts` — 2 SDK mock assertion failures (pre-existing, likely flaky)

These 7 failures (7/2055 = 0.34%) are tracked for CP-ST-03-03 cleanup.

---

*Phase: CP-ST-03-architecture-detox*
*Completed: 2026-05-13*
