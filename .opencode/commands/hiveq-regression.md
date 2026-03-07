---
description: Detect regressions across recent changes by comparing against baselines.
agent: hiveq
---

# HiveQ Regression

## Objective

Detect regressions introduced by recent changes. Compare current test results, type check output, and LOC counts against saved baselines.

## Process

1. **Load baseline** — Retrieve previous verification results from `hivemind_memory` or git history.
2. **Run current checks** — Execute `npm test`, `npx tsc --noEmit`, LOC counts.
3. **Diff analysis** — Compare current vs baseline: new failures, new type errors, LOC increases.
4. **Impact assessment** — Classify regressions by severity and blast radius.
5. **Report** — List regressions with before/after evidence.

## Arguments

- `$ARGUMENTS` — Scope of regression check (e.g., "full", "tests only", "since last commit").

## Output

A regression report with:
- Baseline reference (commit hash, date, or memory ID)
- Current state summary
- Regressions found (new failures, new errors, LOC growth)
- Impact classification per regression
- Recommended actions
