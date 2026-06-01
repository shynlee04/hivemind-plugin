---
phase: "45-vendor-sync-script"
plan: "45-02"
subsystem: testing
tags: [bats, shell-testing, git-integration, ci-pipeline]

# Dependency graph
requires:
  - phase: 45-01
    provides: scripts/sync-fork.sh with pinned-file conflict detection
provides:
  - bats test suite (3 scenarios) for sync-fork.sh
  - Integration test pattern for shell scripts using local git fixtures
affects: [45-run-ci, integration-testing]

# Tech tracking
tech-stack:
  added: [bats ^1.13.0]
  patterns:
    - BATS_TEST_TMPDIR for per-test isolated git repos
    - Subshell-based git ops (no global cd persistence)
    - Local bare repo as upstream fixture (zero network)

key-files:
  created:
    - tests/scripts/sync-fork.bats
    - tests/scripts/.gitkeep
  modified:
    - package.json

key-decisions:
  - "Use session-manager.ts (actually pinned) for Scenario 3, NOT tmux.ts (user's brief typo)"
  - "WORK repo must NOT push its marker commit to the upstream bare — divergence needed for merge-tree detection"
  - "Subshell pattern for script invocation isolates cwd: bash -c \"cd '$WORK' && ...\""
  - "bats only (no bats-assert/bats-support) per user instruction"

patterns-established:
  - "Local git fixture pattern: bare upstream → fork-wt (populator) → test repo (SUT)"
  - "3-way merge detection via git merge-tree --write-tree --name-only --no-messages"

requirements-completed: [REQ-01, REQ-02, REQ-03, REQ-04, REQ-05]

# Metrics
duration: 28min
completed: 2026-06-01
---

# Phase 45 Plan 2: Bats Test Suite for sync-fork.sh Summary

**3-scenario integration test suite for scripts/sync-fork.sh using local bare git fixtures, covering clean fast-forward merge, 3-way non-pinned conflict, and pinned-file conflict detection — all zero-network**

## Performance

- **Duration:** ~28 min (research + setup + write + debug)
- **Started:** 2026-06-01
- **Completed:** 2026-06-01
- **Tasks:** 3 (install bats, write tests, summary)
- **Files modified:** 4

## Accomplishments

- Installed bats ^1.13.0 as dev dependency and created `tests/scripts/` directory
- Wrote `tests/scripts/sync-fork.bats` with 3 integration scenarios using local bare git repos (zero network calls)
- All 3 tests pass consistently: `npx bats tests/scripts/` → 3/3 ok
- Verified `git merge-tree --write-tree --name-only --no-messages` exit code = 1 on conflict (git 2.54.0) — script's logic is correct

## Task Commits

Each task was committed atomically:

1. **Task 1: Install bats and create test directory** - `5e16f64d` (feat)
2. **Task 2: Write 3-scenario bats test suite** - `daf6458c` (feat)

**Plan metadata:** (pending — final docs commit)

## Files Created/Modified

- `tests/scripts/sync-fork.bats` — 210-line integration test suite with 3 scenarios, fixture setup/teardown, and helper functions
- `tests/scripts/.gitkeep` — Directory registration (created Task 1)
- `package.json` — Added `bats: ^1.13.0` to devDependencies (Task 1)

## Decisions Made

- **Used session-manager.ts for pinned-file test (Scenario 3):** User's brief said `tmux.ts` but that file is NOT in `PINNED_FILES`. Used `session-manager.ts` (actually pinned) to test real behavior.
- **WORK repo must NOT push marker to upstream bare:** The test repo ("monorepo") has a local marker commit that creates divergence from the upstream bare. The bare must only contain upstream commits via fork-wt pushes, or fork-wt's refs go stale and all pushes fail.
- **Subshell isolation:** All 3 tests use `bash -c "cd '$WORK' && SYNC_FORK_REMOTE_URL='$FORK_BARE' '$SYNC_FORK_SH'"` to avoid cwd pollution across tests.
- **bats-only (no extras):** Per user instruction, no bats-assert or bats-support libraries installed.
- **`upstream_commit()` helper:** Reusable function that pushes to the bare from a separate fork-wt working tree, simulating a real upstream push.

## Deviations from Plan

None — plan executed exactly as written.

### Investigation Note: git merge-tree exit code

Before writing the test suite, I investigated whether `git merge-tree --write-tree` returns exit code 1 on conflict (as the script assumes). Earlier test used `|| true` which masked the true exit code (returning 0). Reproduced correctly without the mask: git 2.54.0 **does** return exit 1 on conflict. Script's `[ $rc -eq 1 ]` check is correct.

## Issues Encountered

- **fork-wt stale refs on second run:** Setup cloned fork-wt BEFORE the WORK repo pushed its marker. When WORK pushed, fork-wt's local main fell behind. The fix: WORK does NOT push the marker to the bare. The bare only tracks upstream (fork-wt) commits.
- **Path resolution:** `HARNESS_ROOT` derived from `${BATS_TEST_FILENAME%/*}/../..` resolves correctly to the project root regardless of where bats is invoked from.

## Test Details

| # | Scenario | File Modified | Expected Exit | Actual |
|---|----------|---------------|---------------|--------|
| 1 | Clean fast-forward, non-pinned upstream change | tmux.ts | 0 | 0 ✓ |
| 2 | 3-way conflict, same non-pinned file | config.ts | non-zero | 1 ✓ |
| 3 | Pinned file conflict | session-manager.ts | 1 | 1 ✓ |

**Coverage mapping:**
- REQ-01 (github-action-ready): Tested via `SYNC_FORK_REMOTE_URL` env var override in all 3 tests
- REQ-02 (pinned-file protection): Scenario 3 explicitly tests pinned-file conflict → exit 1
- REQ-03 (conflict detection): All 3 tests exercise merge-tree conflict detection path
- REQ-04 (dry-run mode): Not tested in this plan (out of scope per PLAN.md)
- REQ-05 (output to stdout/err): Scenario 3 checks "pinned" in output; Scenario 2 checks "Non-pinned conflicts detected"

## Next Phase Readiness

- Test suite ready for CI integration (phase 45-run-ci)
- Pattern established for future bats-based integration tests
- No blockers

---

*Phase: 45-vendor-sync-script*
*Completed: 2026-06-01*
