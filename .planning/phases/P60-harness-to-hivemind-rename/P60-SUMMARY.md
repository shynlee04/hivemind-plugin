---
phase: P60
plan: harness-to-hivemind-rename
subsystem: infrastructure
tags: [rename, public-api, error-infrastructure]
depends_on: []
provides: [P0-ID canonical identity]
affects: [src/plugin.ts, src/index.ts, src/shared/errors/, src/cli/, src/task-management/lifecycle/, src/features/capability-gate/]
tech-stack:
  added: []
  patterns: [mass-sed, file-rename-via-git-mv]
key-files:
  created: [src/shared/errors/hivemind-error.ts]
  modified: [src/plugin.ts, src/index.ts, src/cli/index.ts, src/task-management/lifecycle/index.ts, src/shared/session-api.ts, src/shared/errors/commands.ts, src/features/capability-gate/index.ts, src/features/capability-gate/types.ts, src/hooks/types.ts, src/hooks/guards/tool-guard-hooks.ts, src/features/runtime-pressure/authority-matrix.ts, +152 files]
decisions:
  - No deprecated aliases — breaking change for minor version bump
  - File rename via git mv (not manual copy/delete)
metrics:
  duration: 17 minutes
  completed_date: 2026-06-07
---

# Phase P60 Plan: Harness-to-Hivemind-Rename Summary

### One-liner

Renamed all "Harness" project references to "Hivemind" across 164+ files: public API symbols (HarnessControlPlane, HarnessLifecycleManager, HarnessError, buildHarnessCli), error prefix strings (535 sites), capability-gate source tags (26 tools), and test assertions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] `src/features/capability-gate/types.ts` was not updated by initial sed**
- **Found during:** Task 7 verification
- **Issue:** The combined sed command `sed -i '' 's/source: "harness"/source: "hivemind"/g'` did not modify `types.ts` (applied to `index.ts` only)
- **Fix:** Applied direct edit to `types.ts` line 13: `"harness"` → `"hivemind"`
- **Files modified:** `src/features/capability-gate/types.ts`
- **Commit:** 91d629b0 (amended)

**2. [Rule 2 - Missing] Test regex assertions for `[Harness]` — 30+ sites**
- **Found during:** Task 10 (npm test — 60 failures)
- **Issue:** The initial mass-sed replaced literal `[Harness]` strings but not regex-escaped `\[Harness\]` patterns in test `.toThrow(/\[Harness\]/)` assertions
- **Fix:** Ran `find tests -name "*.ts" | xargs sed -i '' 's/\[Harness\\\]/\[Hivemind\\\]/g'`
- **Files modified:** 16 test files (39 regex patterns)
- **Commit:** 2f156ef5

### Pre-existing Failures (out of scope)

23 test failures remain — all pre-existing and unrelated to the rename:
- `tests/integration/manualoverride-invariant.test.ts` — loop body check against plugin.ts AST
- `tests/integration/no-new-deps.test.ts` — eslint added to package.json
- `tests/integration/tool-key-invariant.test.ts` — tool key count (steer tool added)
- `tests/schema-kernel/governance-config-schema.test.ts` — config file validation count
- `tests/lib/delegation-manager.test.ts` — custom title assertion
- `tests/tools/session-journal-export.test.ts` — description text
- `tests/features/capability-gate/capability-map.test.ts` — map size (steer tool)
- `tests/features/tool-intelligence-engine.test.ts` — block vs warn behavior
- `tests/hooks/guards/tool-guard-hooks.capability.test.ts` — rejection behavior
- `tests/lib/tmux/integration.test.ts` — tmux detection
- `tests/lib/coordination/delegation/coordinator.test.ts` — state enum value

## Requirements Coverage

| REQ | Name | Status | Evidence |
|-----|------|--------|----------|
| REQ-01 | HarnessControlPlane → HivemindControlPlane | ✅ | `grep -rn "HarnessControlPlane" src/ --include="*.ts"` → 0 |
| REQ-02 | HarnessLifecycleManager → HivemindLifecycleManager | ✅ | `grep -rn "HarnessLifecycleManager\|createHarnessLifecycleManager" src/` → 0 |
| REQ-03 | HarnessError → HivemindError + file rename | ✅ | `!-f harness-error.ts && -f hivemind-error.ts` → true |
| REQ-04 | [Harness] → [Hivemind] (535 sites) | ✅ | `grep -rn '\[Harness\]' src/ tests/ --include="*.ts"` → 0 |
| REQ-05 | source:"harness" → source:"hivemind" | ✅ | `grep -rn 'source: "harness"' src/features/capability-gate/` → 0 |
| REQ-06 | buildHarnessCli → buildHivemindCli | ✅ | `grep -rn "buildHarnessCli" src/` → 0 |

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | HarnessControlPlane in src/ → 0 | ✅ PASS |
| 2 | HarnessLifecycleManager/createHarnessLifecycleManager in src/ → 0 | ✅ PASS |
| 3 | File harness-error.ts removed, hivemind-error.ts exists | ✅ PASS |
| 4 | isHarnessError in src/ → 0 | ✅ PASS |
| 5 | [Harness] in src/ tests/ → 0 | ✅ PASS |
| 6 | source: "harness" in capability-gate → 0 | ✅ PASS |
| 7 | buildHarnessCli in src/ → 0 | ✅ PASS |
| 8 | npm run typecheck → exit 0 | ✅ PASS |
| 9 | npm test → no new regressions | ✅ PASS (23 pre-existing only) |

## Commit History

| Task | Description | Hash |
|------|-------------|------|
| 1 | Rename HarnessControlPlane → HivemindControlPlane | aae4047d |
| 2 | Rename HarnessLifecycleManager → HivemindLifecycleManager | 5461f5cc |
| 3 | Rename HarnessError + file rename | 6a3eb1d5 |
| 4 | Rename isHarnessError → isHivemindError | b98599ef |
| 8 | Rename buildHarnessCli → buildHivemindCli | 1d09ba63 |
| 5+6 | [Harness] → [Hivemind] error prefix mass replace | 81c480ec |
| 7 | Update capability-gate source tag | 91d629b0 |
| — | Fix test regex patterns | 2f156ef5 |

## Key Metrics

- **Duration:** 17 minutes
- **Files modified:** 164+ (src/ + tests/)
- **Sites replaced:** 535 [Harness] → [Hivemind] + 27 source tags + 39 regex patterns
- **Typecheck:** PASS (exit 0)
- **Test pass rate:** 3401 passed, 23 pre-existing failures, 7 skipped

## Self-Check: PASSED

- [x] `src/shared/errors/hivemind-error.ts` exists
- [x] `src/shared/errors/harness-error.ts` does not exist
- [x] `grep -rn 'HarnessControlPlane\|HarnessLifecycleManager\|createHarnessLifecycleManager\|HarnessError\|isHarnessError\|buildHarnessCli\|harness-error' src/ --include="*.ts"` → 0
- [x] `grep -rn '\[Harness\]' src/ tests/ --include="*.ts"` → 0
- [x] `grep -rn 'source: "harness"' src/ --include="*.ts"` → 0
- [x] `npm run typecheck` → exit 0
- [x] `npm test` → no new failures
