---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
plan: 01
subsystem: infra
tags: [bun-pty, pty, spawner, typescript, helpers, delegation]

# Dependency graph
requires:
  - phase: 14
    provides: WaiterModel dispatch, dual-signal completion, delegation-manager, continuity store
  - phase: 15
    provides: Security remediation baseline (explicit allowlists, coordinator-only orchestrator)
provides:
  - "bun-pty runtime dependency installed at ^0.4.8"
  - "Canonical PTY execution contracts (PtyExecutionMode, PtySpawnRequest, PtySessionRecord, PtyReadResult, PtySpawnResult)"
  - "Canonical spawner contracts (WriteCapablePermissionProfile, DelegationSpawnRequest, DelegationSpawnResult)"
  - "Shared extractAssistantText helper in src/lib/helpers.ts"
affects: [16-02, 16-03, 16-04]

# Tech tracking
tech-stack:
  added: [bun-pty ^0.4.8]
  patterns: [pty-types contract module, spawner-types contract module, shared text extraction]

key-files:
  created:
    - src/lib/pty/pty-types.ts
    - src/lib/spawner/spawner-types.ts
  modified:
    - package.json
    - package-lock.json
    - src/lib/helpers.ts
    - src/hooks/create-session-hooks.ts
    - tests/lib/helpers.test.ts

key-decisions:
  - "bun-pty ^0.4.8 chosen because OpenCode plugins run on Bun runtime (confirmed: BunProc.install, PluginInput.$ Bun shell API)"
  - "PtyExecutionMode union defined once in pty-types.ts and imported by spawner-types.ts to avoid duplication"
  - "extractAssistantText added to helpers.ts as shared helper; delegation-manager.ts duplicate still requires removal"

patterns-established:
  - "Contract-first type modules: define interfaces before implementation so downstream plans can build against stable types"
  - "Shared helper extraction in helpers.ts; delegation-manager.ts duplicate still pending removal"

requirements-completed: []

# Metrics
duration: 11min
completed: 2026-04-21
---

# Phase 16 Plan 01: Foundation Summary

**bun-pty dependency installed via the repo's npm/package-lock flow, canonical PTY/spawner type contracts defined, and hook-local extractAssistantText duplication removed by introducing a shared helper**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-21T02:43:30Z
- **Completed:** 2026-04-21T02:54:36Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Root package now installs `bun-pty` through the repo's npm/package-lock workflow while still targeting Bun at runtime for PTY-backed child process execution
- PTY and spawner layers have stable exported contracts for downstream plan implementation
- Shared extractAssistantText helper in helpers.ts eliminates hook-local duplication (threat T-16-01 mitigated); note: delegation-manager.ts still has a duplicate that needs follow-up removal

## Task Commits

Each task was committed atomically:

1. **Task 1: Add PTY dependency and canonical PTY/spawner contracts** - `2fe87359` (feat)
2. **Task 2 (TDD RED): Add failing tests for extractAssistantText** - `07d17e9a` (test)
3. **Task 2 (TDD GREEN): Consolidate extractAssistantText into shared helpers** - `48cad113` (feat)

## Files Created/Modified
- `package.json` - Added bun-pty ^0.4.8 dependency
- `package-lock.json` - Lockfile updated with bun-pty
- `src/lib/pty/pty-types.ts` - PTY execution mode, spawn request, session record, read result, spawn result contracts
- `src/lib/spawner/spawner-types.ts` - Write-capable permission profile, delegation spawn request/result contracts
- `src/lib/helpers.ts` - Added extractAssistantText() as shared helper
- `src/hooks/create-session-hooks.ts` - Removed local extractAssistantText, imports from helpers
- `tests/lib/helpers.test.ts` - Added 6 tests for extractAssistantText (4 core + 2 edge cases)

## Decisions Made
- **bun-pty ^0.4.8 selected:** OpenCode plugins run on Bun runtime (confirmed BunProc.install, PluginInput.$); bun-pty is the correct PTY library for this runtime
- **Single PtyExecutionMode definition:** Defined in pty-types.ts and imported by spawner-types.ts to prevent contract drift
- **extractAssistantText to helpers.ts:** Centralizes session-hook assistant-text parsing per threat model T-16-01 and creates the shared helper that later Phase 16 work can adopt in `delegation-manager.ts`

## Deviations from Plan

No implementation drift in the delivered files, but artifact wording needed follow-up cleanup: the original plan/summary language overstated full parser unification, and the install wording is now aligned to this repo's npm/package-lock workflow.

## Issues Encountered
- Vitest v1.6.1 does not support `-x` flag for fail-fast; ran without it. No impact on test results.

## Next Phase Readiness
- PTY and spawner contracts are stable — Plan 16-02 can implement against them
- Shared extractAssistantText is available for later Phase 16 work, including delegation-manager follow-up in Plans 16-02 through 16-04
- 413 tests pass, typecheck clean, build verified

---
*Phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro*
*Completed: 2026-04-21*

## Self-Check: PASSED

All files verified present on disk. All 3 commits verified in git log.
