---
id: "VERIFICATION-${TYPE}${ID}"
type: verification
scope: "${SCOPE}"
target: "${TYPE}${ID}"
phase: implementation
status: pending
created: "${DATE}"
last_updated: "${DATE}"
checks_passed: 0
checks_total: 0
git_range: ""
---

# Verification: ${TARGET_TITLE} — Implementation

> **Target**: [`${TYPE}${ID}-PLAN.md`](./${TYPE}${ID}-PLAN.md) | **Phase**: `implementation`
> **Git Range**: `${START_COMMIT}..${END_COMMIT}`

---

## Implementation Evidence

| # | Artifact | Expected | Actual | Status | Git Commit |
|---|----------|----------|--------|--------|-----------|
| 1 | <!-- file/artifact --> | <!-- what should exist --> | <!-- what exists --> | ⬜ | <!-- hash --> |
| 2 | | | | ⬜ | |

## Test Evidence

| # | Test Suite | Command | Result | Date |
|---|-----------|---------|--------|------|
| 1 | <!-- suite --> | `<!-- cmd -->` | ⬜ PASS/FAIL | |

## Regression Check

| # | Check | Command | Before | After | Status |
|---|-------|---------|--------|-------|--------|
| 1 | No test regressions | `npm test` | <!-- count --> | <!-- count --> | ⬜ |
| 2 | No parity drift | `diff root .opencode` | 0 | <!-- count --> | ⬜ |

---

## Acceptance Criteria Mapping

<!-- Map plan's completion criteria to evidence -->

| Criteria (from plan) | Evidence | Verdict |
|---------------------|----------|---------|
| <!-- criterion --> | <!-- proof --> | ⬜ MET / UNMET |

---

<footer>

## Verifier Notes

## Closing Summary

<!-- Written when verification completes. Status + residual risk + next. -->

</footer>
