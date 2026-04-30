---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
plan: 06
subsystem: infra
tags: [delegation-manager, refactoring, loc-reduction, composition-pattern, handler-extraction]
requires:
  - phase: 16-05
    provides: Queue-key truth + real stability polling baseline
provides:
  - DelegationManager refactored from 687 → 309 LOC (target: <350)
  - CommandDelegationHandler extracted as standalone module (285 LOC)
  - SdkDelegationHandler extracted as standalone module (161 LOC)
  - Pure utilities extracted to helpers.ts (extractAllAssistantText, describeError)
  - All 462 tests pass without modification
affects: [delegation-manager, command-delegation, sdk-delegation, helpers]
tech-stack:
  added: []
  patterns: [callback-based-composition, handler-extraction, getter-proxy-for-test-internals]
key-files:
  created:
    - src/lib/command-delegation.ts
    - src/lib/sdk-delegation.ts
  modified:
    - src/lib/delegation-manager.ts
    - src/lib/helpers.ts
key-decisions:
  - "Extract command-delegation and sdk-delegation into separate handler classes with callback-based composition (not DM reference injection) to prevent circular dependencies."
  - "Add extractAllAssistantText() as a separate function from extractAssistantText() because they have different semantics: ALL messages vs LAST message only."
  - "Expose stabilityTimers via getter proxy on DelegationManager for backward compatibility with test internals access pattern (as unknown as ManagerInternals)."
patterns-established:
  - "Callback-based handler composition: handlers receive plain callback objects from DM, not a reference to DM itself, preventing circular imports."
  - "Getter proxy for test internals: DM exposes internal timer maps from handlers via getters so existing tests using type-casting patterns continue working."
  - "Arrow-function constructor binding: DM constructor captures `this` via `const dm = this` alias, then passes arrow functions that close over `dm` to handlers."
requirements-completed: [D-07, D-11]
duration: 15 min
completed: 2026-04-21
---

# Phase 16 Plan 06: DelegationManager LOC Reduction Summary

**DelegationManager refactored from 687 → 309 LOC by extracting CommandDelegationHandler and SdkDelegationHandler as composable modules. All 462 tests pass without any test modifications.**

## Performance

- **Duration:** 15 min
- **Completed:** 2026-04-21
- **Tasks:** 3 (helpers extraction, handler modules, DM rewrite)
- **Files created:** 2
- **Files modified:** 2

## Accomplishments

- Extracted pure utilities (`extractAllAssistantText`, `describeError`) to `helpers.ts` for reuse by handler modules.
- Created `CommandDelegationHandler` (285 LOC): PTY dispatch, headless command fallback, exit polling, environment building, PTY manager resolution.
- Created `SdkDelegationHandler` (161 LOC): stability polling, SDK finalization, recovery, timer map management.
- Rewrote `DelegationManager` (309 LOC) as thin composer wiring the two handlers via callback injection.
- All 462 tests pass with zero test file modifications — backward compatibility preserved through getter proxy pattern.

## Task Commits

Each step committed atomically:

| Commit | Description |
|--------|-------------|
| `6508cff3` | Extract pure utilities to helpers — extractAllAssistantText + describeError |
| `356c9e44` | Extract CommandDelegationHandler + SdkDelegationHandler modules (446 LOC added) |
| `a4db370b` | Rewrite DelegationManager as thin composer — 687→309 LOC (435 lines removed) |

## Verification

| Check | Result |
|-------|--------|
| `npm test` | ✅ 462 passed, 0 failed |
| `npm run typecheck` | ✅ Only pre-existing errors (bun-pty, SDK type mismatch) |
| `wc -l src/lib/delegation-manager.ts` | ✅ 309 LOC (target: <350) |
| `npm run build` | ✅ Same pre-existing errors, no new errors from refactoring |

## LOC Impact

| File | Before | After |
|------|--------|-------|
| `delegation-manager.ts` | 687 | 309 |
| `command-delegation.ts` | — | 285 |
| `sdk-delegation.ts` | — | 161 |
| `helpers.ts` | 213 | 257 |
| **Total** | **900** | **1012** |

> Note: Total increased by 112 LOC due to module boilerplate (imports, exports, class declarations, type annotations) but `delegation-manager.ts` itself dropped 378 LOC — a 55% reduction achieving the <350 target.

## Architecture Impact

- **No circular dependencies**: handlers import only from `types.ts` and `helpers.ts`
- **No downstream changes**: `delegate-task.ts`, `delegation-status.ts`, `run-background-command.ts`, `plugin.ts` all import unchanged from `delegation-manager.js`
- **Test compatibility**: Tests using `as unknown as ManagerInternals` casting still work via getter proxy on DM

## Key Discoveries

1. **Two different `extractAssistantText` functions**: The one in `helpers.ts` returns only the LAST assistant message; the delegation-manager version collects from ALL messages and joins with `\n`. Both are now available as distinct exports.
2. **Timer ownership split**: `commandPollTimers` and `headlessCommands` fully owned by `CommandDelegationHandler`; `stabilityTimers` owned by `SdkDelegationHandler` but exposed via DM getter for test compat; `safetyTimers` stays on DM.
3. **Callback-based composition pattern**: Handlers receive callback objects (not DM reference), preventing circular imports while allowing DM to control the flow.
