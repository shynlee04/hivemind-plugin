---
phase: BOOT-09
plan: 02
subsystem: hooks
tags: language governance, system.transform, isMainSession, plugin wiring

requires:
  - phase: BOOT-09-01
    provides: config schema with language fields, createSessionIsMainObserver factory, HookDependencies.isMainSession type
provides:
  - Language Governance block injected at output.system[0] for main sessions
  - isMainSession observer wired in plugin.ts
  - hivemindConfig passed to createToolGuardHooks
affects: [BOOT-09-03, BOOT-09-04]

tech-stack:
  added: []
  patterns:
    - Language governance block unshifted at position 0 (before governance block)
    - isMainSession wired via HookDependencies (matching getBehavioralProfile pattern)

key-files:
  created: []
  modified:
    - src/hooks/lifecycle/core-hooks.ts
    - src/plugin.ts
    - tests/hooks/create-core-hooks.test.ts

key-decisions:
  - Language block injected BEFORE governance block at output.system[0] per D-05
  - governance block format LOCKED — buildGovernanceBlock() not modified per D-06
  - isMainSession wired via observer factory matching getBehavioralProfile pattern per D-04

patterns-established:
  - Language governance as a separate block before governance block
  - isMainSession via cached observer factory (matching session-entry pattern)

requirements-completed: [REQ-01, REQ-02]

duration: 9min
completed: 2026-05-11
---

# Phase BOOT-09 Plan 02: Language Governance Injection — Summary

**Language governance block injected at output.system[0] for main sessions via system.transform, isMainSession observer wired in plugin.ts**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-11T22:04:18Z
- **Completed:** 2026-05-11T22:13:26Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Language Governance block injected at `output.system[0]` for main sessions via `system.transform` with header, `CRITICAL:` prefix, `MUST respond in` imperative, override behavior, and document paths
- Child/delegated sessions correctly excluded from language block via `deps.isMainSession` per REQ-01
- `isMainSession` observer factory (`createSessionIsMainObserver`) wired in `plugin.ts` — import, factory creation, deps injection, and event observer registration
- `hivemindConfig` passed to `createToolGuardHooks` for downstream Plan 03 usage
- 13 new TDD tests (RED/GREEN per task) exercising language block content, conditional injection, language changes, and real-factory integration

## Task Commits

Each task was committed atomically with RED→GREEN discipline:

1. **Task 1: Language Governance block in core-hooks.ts**
   - `0124e60` (test) — RED: failing tests for language governance block
   - `05088f5` (feat) — GREEN: inject language governance block in core-hooks

2. **Task 2: Wire isMainSession observer in plugin.ts**
   - `e2b1531` (test) — RED: integration tests for isMainSession factory through createCoreHooks
   - `451a165` (feat) — GREEN: wire isMainSession observer and hivemindConfig in plugin.ts

## Files Created/Modified
- `src/hooks/lifecycle/core-hooks.ts` — Language governance block injection at output.system[0] before governance block
- `src/plugin.ts` — Import createSessionIsMainObserver, factory creation, deps wiring, observer registration, hivemindConfig passed to tool guard hooks
- `tests/hooks/create-core-hooks.test.ts` — 13 TDD tests (11 for Task 1, 2 integration tests for Task 2)

## Decisions Made
- Language block injected BEFORE governance block at `output.system[0]` per D-05 — uses `.unshift()` to prepend
- `buildGovernanceBlock()` NOT modified — governance block format LOCKED per D-06
- `isMainSession` wired via HookDependencies matching `getBehavioralProfile` pattern per D-04
- `consumeIsMainSessionFact` wrapped in try/catch — best-effort, never blocks canonical event handling

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- Test helper had `??` nullish coalescing that prevented passing `undefined` for `hivemindConfig` — fixed by using `"hivemindConfig" in options` instead
- Integration test used flat event shape instead of nested `properties.info` format — fixed per existing event-observers test pattern
- **These were test-only bugs in RED phase, caught and fixed during GREEN implementation**

## Self-Check

- `npx vitest run tests/hooks/create-core-hooks.test.ts` — 45/45 passed
- `npx vitest run tests/hooks/` — 108/108 passed (all hook tests)
- `npm run typecheck` — passed (0 errors)
- `npx vitest run` — 2103/2108 passed (3 pre-existing session-journal taxonomy failures)

## Self-Check: PASSED

## Next Phase Readiness
- Language governance block complete and tested
- `isMainSession` wiring ready for Plan 03 (tool guard layer)
- `hivemindConfig` already in `ToolGuardDependencies` — Plan 03 can proceed without type errors

---

*Phase: BOOT-09-mvp-config-schema-entry-init*
*Completed: 2026-05-11*
