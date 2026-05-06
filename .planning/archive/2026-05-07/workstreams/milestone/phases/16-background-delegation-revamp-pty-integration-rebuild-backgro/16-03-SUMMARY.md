---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
plan: 03
subsystem: infra
tags: [delegation, spawner, pty, concurrency, session-api, vitest]
requires:
  - phase: 16-01
    provides: PTY buffer and manager primitives used by spawner runtime setup
  - phase: 16-02
    provides: phase context and plan scaffolding for spawner extraction
provides:
  - Canonical provider-aware delegation queue-key policy in src/lib/concurrency.ts
  - Thin spawner adapters for concurrency-key and working-directory resolution
  - Parent-linked write-capable session creation and PTY-first runtime bootstrap
affects: [delegation-manager, phase-16-04, background-delegation]
tech-stack:
  added: []
  patterns: [tdd, canonical-policy-owner, thin-spawner-adapter, pty-first-fallback]
key-files:
  created:
    - src/lib/spawner/concurrency-key.ts
    - src/lib/spawner/parent-directory.ts
    - src/lib/spawner/session-creator.ts
    - src/lib/spawner/pty-setup.ts
    - tests/lib/spawner/concurrency-key.test.ts
    - tests/lib/spawner/parent-directory.test.ts
    - tests/lib/spawner/session-creator.test.ts
    - tests/lib/spawner/pty-setup.test.ts
  modified:
    - src/lib/concurrency.ts
    - src/lib/session-api.ts
    - tests/lib/concurrency.test.ts
    - tests/lib/session-api.test.ts
key-decisions:
  - "Extended src/lib/concurrency.ts instead of creating a second queue-key authority in the spawner layer."
  - "Spawner session creation uses an explicit 8-rule write-capable permission profile that denies nested delegate-task/task recursion."
  - "PTY runtime bootstrap returns explicit headless fallback metadata instead of silently degrading."
patterns-established:
  - "Canonical policy owner: shared queue-key formatting lives only in src/lib/concurrency.ts."
  - "Thin spawner adapters: spawner modules wrap shared helpers without redefining behavior."
requirements-completed: []
duration: 5min
completed: 2026-04-21
---

# Phase 16 Plan 03: Spawner Canonicalization Summary

**Canonical provider-aware queue keys, thin spawner adapters, parent-linked write-capable child sessions, and PTY-first fallback scaffolding for the Phase 16 background delegation rebuild**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-21T11:29:00Z
- **Completed:** 2026-04-21T11:34:10Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Added RED tests that pin the canonical queue-key precedence and define spawner helper contracts before implementation.
- Made `src/lib/concurrency.ts` the sole delegation queue-key authority, with provider+model precedence ahead of existing fallback lanes.
- Added spawner modules for queue-key delegation, working-directory resolution, parent-linked child-session creation, and PTY-first runtime startup with explicit headless fallback.

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — write failing canonical-policy and spawner boundary tests** - `e3c0600a` (test)
2. **Task 2: GREEN — make concurrency.ts canonical and add thin helpers** - `619797d6` (feat)
3. **Task 3: GREEN/REFACTOR — finish spawner session and PTY setup modules** - `b7f5ac5f` (feat)

## Files Created/Modified
- `src/lib/concurrency.ts` - canonical delegation queue-key builder now supports provider+model precedence.
- `src/lib/session-api.ts` - `createSession()` now forwards explicit permission payloads unchanged.
- `src/lib/spawner/concurrency-key.ts` - thin adapter over the canonical queue-key builder.
- `src/lib/spawner/parent-directory.ts` - deterministic working-directory precedence resolver.
- `src/lib/spawner/session-creator.ts` - parent-linked child-session creation with fixed write-capable permission rules.
- `src/lib/spawner/pty-setup.ts` - PTY-first runtime bootstrap with explicit headless fallback metadata.
- `tests/lib/concurrency.test.ts` - canonical precedence coverage for provider/model and legacy fallback lanes.
- `tests/lib/session-api.test.ts` - permission forwarding coverage for session creation.
- `tests/lib/spawner/concurrency-key.test.ts` - adapter-only behavior coverage.
- `tests/lib/spawner/parent-directory.test.ts` - working-directory precedence coverage.
- `tests/lib/spawner/session-creator.test.ts` - parent lineage and write-capable permission coverage.
- `tests/lib/spawner/pty-setup.test.ts` - PTY success and fallback coverage.

## Decisions Made
- Kept queue-key formatting centralized in `src/lib/concurrency.ts` so Phase 16-04 can consume the same policy for live runtime adoption.
- Used the exact 8-rule permission list from the plan and threat model so delegated child sessions stay write-capable without permitting nested delegation.
- Returned explicit `fallbackReason` metadata from PTY startup failures to keep runtime-mode degradation observable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The new `spawnDelegatedSession()` implementation needed `getSessionID()` from `session-api`, but the RED test fully mocked that module and hid the export. The test was corrected to use a partial mock so it still isolates `createSession()` while exercising the real session-ID helper.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 16-04 to migrate live `DelegationManager` runtime usage onto the canonical queue-key and spawner pathways.
- No blockers found inside this plan's scope.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: `.planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-03-SUMMARY.md`
- FOUND commit: `e3c0600a`
- FOUND commit: `619797d6`
- FOUND commit: `b7f5ac5f`
