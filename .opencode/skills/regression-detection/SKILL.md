---
name: regression-detection
description: "Baseline comparison, delta analysis, impact assessment for code changes."
---

# Regression Detection

Use this skill when checking whether recent changes introduced regressions compared to a known baseline.

## Baseline Sources

1. **HiveMind Memory**: Previous verification results saved via `hivemind_memory` with shelf `verification`
2. **Git History**: Previous commit's test results, type check status, LOC counts
3. **Anchored State**: Baseline anchored via `hivemind_anchor` (e.g., `phase-b-baseline`)

## Delta Analysis Process

### Test Regressions
1. Load baseline test count and failure list.
2. Run `npm test` and capture current results.
3. Compare:
   - New failures (tests that passed before, fail now) → **REGRESSION**
   - New passes (tests that failed before, pass now) → **IMPROVEMENT**
   - Changed test count (tests added/removed) → **STRUCTURAL CHANGE**

### Type Check Regressions
1. Load baseline error count.
2. Run `npx tsc --noEmit` and capture current results.
3. Compare:
   - New errors → **REGRESSION**
   - Resolved errors → **IMPROVEMENT**
   - Changed error types → **SHIFT** (may need investigation)

### LOC Regressions
1. Load baseline LOC counts for tracked files.
2. Run `wc -l` on same files.
3. Compare:
   - File grew past 550 LOC threshold → **REGRESSION**
   - File shrunk significantly → **IMPROVEMENT** (verify not data loss)
   - New files exceeding threshold → **NEW VIOLATION**

## Impact Classification

| Severity | Criteria | Action |
|----------|----------|--------|
| P0 — Blocking | Test suite fails, type errors in core modules | Must fix before proceeding |
| P1 — High | Test failures in non-core modules, LOC violations | Fix before milestone |
| P2 — Medium | Minor LOC growth, non-blocking warnings | Track as tech debt |

## Report Format

For each regression:
```
Type: [test/typecheck/loc]
Severity: [P0/P1/P2]
Baseline: [what it was]
Current: [what it is now]
Delta: [what changed]
Likely Cause: [recent file changes from git diff]
```
