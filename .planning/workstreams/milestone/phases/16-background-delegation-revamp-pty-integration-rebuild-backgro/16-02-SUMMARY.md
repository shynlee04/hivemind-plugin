---
phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro
plan: 02
subsystem: infra
tags: [bun-pty, pty, buffer, runtime, typescript, vitest]

# Dependency graph
requires:
  - phase: 16-01
    provides: bun-pty dependency, canonical PTY contracts, phase 16 PTY type definitions
provides:
  - "PtyManager session registry with spawn, read, write, terminate, and getSession APIs"
  - "Bounded PTY output buffer with deterministic incremental offsets and truncation signaling"
  - "Runtime-truthful PTY tests covering spawn, output capture, exit persistence, and cleanup"
affects: [16-03, 16-04, delegation-manager, spawner]

# Tech tracking
tech-stack:
  added: []
  patterns: [bounded incremental output buffers, PTY session registry, explicit cleanup after exit]

key-files:
  created:
    - src/lib/pty/pty-buffer.ts
    - src/lib/pty/pty-manager.ts
    - tests/lib/pty/pty-buffer.test.ts
    - tests/lib/pty/pty-manager.test.ts
  modified:
    - tests/lib/pty/pty-manager.test.ts

key-decisions:
  - "PTY buffers track global character offsets so truncated readers can recover deterministically from any offset"
  - "PTY exit updates the session record first and leaves cleanup to explicit terminate() so orchestration can inspect terminal state"
  - "PtyManager support detection requires both bun-pty availability and Bun runtime presence"

patterns-established:
  - "PTY runtime modules stay under src/lib/pty and expose narrow APIs instead of embedding process state in orchestration"
  - "Truncation remains true until a reader catches up to the latest known offset after buffer overflow"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-04-21
---

# Phase 16 Plan 02: PTY Runtime Summary

**PTY-backed child session management now ships with a bounded output buffer, explicit exit-state tracking, and deterministic cleanup APIs for downstream spawner integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-21T10:19:57Z
- **Completed:** 2026-04-21T10:25:02Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `createPtyBuffer()` with bounded character storage, incremental reads, and truncation signaling
- Added `PtyManager` with PTY spawn, read, write, terminate, and session lookup behavior over a private registry
- Proved PTY runtime behavior with focused tests for spawn registration, buffered reads, exit persistence, and cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — write PTY manager and buffer tests before implementation** - `d1c8fa79` (test)
2. **Task 2: GREEN/REFACTOR — implement bounded PTY runtime modules** - `54869495` (feat)

## Files Created/Modified
- `src/lib/pty/pty-buffer.ts` - Bounded incremental PTY output buffer keyed by global character offsets
- `src/lib/pty/pty-manager.ts` - PTY lifecycle manager with registry-backed spawn, read, write, terminate, and exit tracking
- `tests/lib/pty/pty-buffer.test.ts` - Buffer-level tests for exact reads and truncation semantics
- `tests/lib/pty/pty-manager.test.ts` - PTY manager tests covering spawn registration, PTY output, exit state, and cleanup

## Decisions Made
- Used global character offsets instead of line-based buffering so downstream status polling can resume from deterministic offsets
- Preserved exited session records until `terminate()` so orchestration can inspect `exitCode` before cleanup
- Treated PTY support as a Bun-runtime capability check instead of assuming bun-pty import alone guarantees usable PTY execution

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected PTY manager truncation expectation discovered during GREEN verification**
- **Found during:** Task 2 (GREEN/REFACTOR — implement bounded PTY runtime modules)
- **Issue:** The original manager test expected `truncated: false` after buffer overflow even though the plan requires truncation to remain signaled until the reader catches up
- **Fix:** Updated the PTY manager test expectation to match the bounded buffer contract proved in `pty-buffer.test.ts`
- **Files modified:** tests/lib/pty/pty-manager.test.ts
- **Verification:** `npx vitest run tests/lib/pty/pty-manager.test.ts tests/lib/pty/pty-buffer.test.ts && npm run typecheck`
- **Committed in:** `54869495` (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The auto-fix aligned the RED expectation with the intended truncation contract and did not change scope.

## Issues Encountered
- `npm run typecheck` initially failed because PTY event callback parameters lacked explicit types; adding `string` and `IExitEvent` annotations resolved the issue without changing runtime behavior.

## TDD Gate Compliance
- RED gate commit present: `d1c8fa79`
- GREEN gate commit present: `54869495`
- REFACTOR gate commit not needed; cleanup folded into the GREEN task while keeping tests green

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 16-03 can now build spawner integration against a tested `PtyManager` and bounded PTY buffer
- PTY runtime surface remains isolated under `src/lib/pty`, so downstream orchestration changes can import it without re-embedding PTY concerns

---
*Phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro*
*Completed: 2026-04-21*

## Self-Check: PASSED

- Found file: `src/lib/pty/pty-buffer.ts`
- Found file: `src/lib/pty/pty-manager.ts`
- Found file: `tests/lib/pty/pty-buffer.test.ts`
- Found file: `tests/lib/pty/pty-manager.test.ts`
- Found commit: `d1c8fa79`
- Found commit: `54869495`
