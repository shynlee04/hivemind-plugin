---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
plan: 01
subsystem: infra
tags: [node-pty, pty, spawner, typescript, helpers, delegation]

# Dependency graph
requires:
  - phase: 14
    provides: WaiterModel dispatch, dual-signal completion, delegation-manager, continuity store
  - phase: 15
    provides: Security remediation baseline (explicit allowlists, coordinator-only orchestrator)
provides:
  - "node-pty runtime dependency installed at ^1.1.0"
  - "Canonical PTY execution contracts (PtyExecutionMode, PtySpawnRequest, PtySessionRecord, PtyReadResult, PtySpawnResult)"
  - "Canonical spawner contracts (WriteCapablePermissionProfile, DelegationSpawnRequest, DelegationSpawnResult)"
  - "Shared extractAssistantText helper in src/lib/helpers.ts"
affects: [16-02, 16-03, 16-04]

# Tech tracking
tech-stack:
  added: [node-pty ^1.1.0]
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
  - "node-pty ^1.1.0 chosen over bun-pty because project targets Node >=20, not Bun-first runtime"
  - "PtyExecutionMode union defined once in pty-types.ts and imported by spawner-types.ts to avoid duplication"
  - "extractAssistantText consolidated into helpers.ts as single source of truth per threat T-16-01"

patterns-established:
  - "Contract-first type modules: define interfaces before implementation so downstream plans can build against stable types"
  - "Shared helper extraction: eliminate duplicate implementations to prevent parsing drift"

requirements-completed: []

# Metrics
duration: 11min
completed: 2026-04-21
---

# Phase 16 Plan 01: Foundation Summary

**node-pty dependency installed, canonical PTY/spawner type contracts defined, and duplicate extractAssistantText consolidated into shared helpers**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-21T02:43:30Z
- **Completed:** 2026-04-21T02:54:36Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Root package can install node-pty for PTY-backed child process execution
- PTY and spawner layers have stable exported contracts for downstream plan implementation
- Single shared extractAssistantText helper eliminates hook-local duplication (threat T-16-01 mitigated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add PTY dependency and canonical PTY/spawner contracts** - `2fe87359` (feat)
2. **Task 2 (TDD RED): Add failing tests for extractAssistantText** - `07d17e9a` (test)
3. **Task 2 (TDD GREEN): Consolidate extractAssistantText into shared helpers** - `48cad113` (feat)

## Files Created/Modified
- `package.json` - Added node-pty ^1.1.0 dependency
- `package-lock.json` - Lockfile regenerated with node-pty
- `src/lib/pty/pty-types.ts` - PTY execution mode, spawn request, session record, read result, spawn result contracts
- `src/lib/spawner/spawner-types.ts` - Write-capable permission profile, delegation spawn request/result contracts
- `src/lib/helpers.ts` - Added extractAssistantText() as shared helper
- `src/hooks/create-session-hooks.ts` - Removed local extractAssistantText, imports from helpers
- `tests/lib/helpers.test.ts` - Added 6 tests for extractAssistantText (4 core + 2 edge cases)

## Decisions Made
- **node-pty ^1.1.0 over bun-pty:** Project targets Node >=20 (verified package.json); bun-pty is Bun-specific
- **Single PtyExecutionMode definition:** Defined in pty-types.ts and imported by spawner-types.ts to prevent contract drift
- **extractAssistantText to helpers.ts:** Centralizes assistant-text parsing per threat model T-16-01, preventing parsing logic divergence between hooks and future delegation runtime

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Vitest v1.6.1 does not support `-x` flag for fail-fast; ran without it. No impact on test results.

## Next Phase Readiness
- PTY and spawner contracts are stable — Plan 16-02 can implement against them
- Shared extractAssistantText is available for spawner and delegation-manager code in Plans 02-04
- 413 tests pass, typecheck clean, build verified

---
*Phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro*
*Completed: 2026-04-21*

## Self-Check: PASSED

All files verified present on disk. All 3 commits verified in git log.
