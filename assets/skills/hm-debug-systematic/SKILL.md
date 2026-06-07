---
name: hm-debug-systematic
description: >
  Hypothesis-driven debugging. Use when the user reports a bug, regression,
  flaky test, stack trace, or unexpected behavior. Triggers on verbs like
  "debug", "diagnose", "fix", "broken", "doesn't work", "stack trace",
  "regression". Pattern 3 Process — multi-step: reproduce → minimize →
  hypothesize → instrument → fix → regression-test. Tech-agnostic +
  stack-agnostic. NOT for spec authoring (load `hm-spec-authoring`), NOT
  for test writing (load `hm-test-driven`), NOT for refactor (load
  `hm-arch-refactor`).
metadata:
  consumed-by:
    - "hm-debugger"
    - "hm-executor"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "specialist"
  pattern: "P3-Process"
  realm: "test,arch,spec,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Edit
  - Write
  - delegate-task
  - hivemind-trajectory
---

# Systematic Debugging

The 6-step protocol: reproduce → minimize → hypothesize → instrument →
fix → regression-test. Each step produces evidence.

## When This Skill Loads — Do This First

1. **Capture the symptom verbatim.** What did the user see? Stack trace,
   error message, screenshot, log lines, timing.
2. **Establish the goal.** What does "fixed" look like? (Usually: a
   regression test that fails before the fix and passes after.)
3. **Check the prior art.** Has this been debugged before? Search the
   journal, session continuity, and skill evals for similar issues.

## The 6-Step Protocol

### Step 1: Reproduce

Write a reproduction test or command that reliably produces the symptom.

The reproduction MUST match the user's environment as closely as possible:
- Same inputs (or representative ones)
- Same execution path
- Same configuration
- Same data state

**Evidence required:** Command + output. Save to `evidence/repro-<id>.txt`.

### Step 2: Minimize

Reduce the reproduction to the smallest input that still triggers the
symptom. Goal: isolate the trigger.

Techniques:
- Bisect: binary search on input parameters
- Strip dependencies: remove optional features until symptom disappears
- Time-shift: try the same input at different times (cache? clock?)
- State-shift: try with clean state vs. dirty state

**Evidence required:** The minimized repro + the symptom it produces.

### Step 3: Hypothesize

List 3+ candidate root causes. Rank by likelihood. For each:
- What evidence supports it?
- What evidence refutes it?
- What's the cheapest way to test it?

Common hypothesis categories:
- **State**: stale data, race condition, missing initialization
- **Boundary**: off-by-one, null vs. empty, integer overflow
- **Type**: implicit conversion, missing type guard, union misuse
- **API**: contract mismatch, version drift, deprecated signature
- **Env**: missing env var, wrong cwd, file permissions
- **Config**: stale config, default value changed, env override

**Evidence required:** Ranked hypothesis list (1-2 sentences each).

### Step 4: Instrument

Add the cheapest possible measurement to test the top hypothesis.
Options (cheapest first):
- Log line / print
- Conditional breakpoint
- Tracer / debugger
- Bisect commit (git log --oneline, git checkout, repeat)
- Profiler

**Evidence required:** Instrumented output that supports or refutes
each top hypothesis. Narrow to the ONE root cause.

### Step 5: Fix

Apply the smallest change that addresses the root cause. Not the
symptom — the cause. If the symptom is "TypeError: cannot read X of
undefined", the fix is to handle the undefined case, not to add a
try/catch.

**Anti-pattern:** Fixing the symptom (e.g., null check) without
addressing the cause (e.g., upstream not setting the value).

**Evidence required:** The fix as a diff. The repro test should now
fail differently (or pass).

### Step 6: Regression-test

Convert the repro into a permanent test. This test:
- Was in the test suite before the fix
- Fails before the fix (proves the test is real)
- Passes after the fix (proves the fix is correct)
- Stays in the suite forever (regression guard)

**Evidence required:** Test output showing failure (revert fix
temporarily) and pass (re-apply fix). Or git bisect output if
historical.

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Skipping reproduction | You can't fix what you can't trigger | Always start with a repro |
| Fixing the symptom, not the cause | Symptom returns in a different form | Step 3: identify the CAUSE, not the symptom |
| "Just one more try" without changing approach | Loop theater | After 3 same-hypothesis attempts, escalate |
| Bisect over thousands of commits | Too slow | Tag the broken commit first, then bisect between tags |
| Adding try/catch to suppress error | Hides the bug | Fix the cause, then decide if error handling is needed |
| Test that doesn't reproduce the original | "Fix" doesn't actually fix | Step 1 reproduction MUST match the user's environment |

## Retry Budget

After 3 focused attempts on the SAME hypothesis, stop and return a
blocked handoff. The handoff must include:
- The command(s) attempted
- The output of each
- The hypothesis being tested
- What new evidence is needed to resume

## Cross-References

| Skill | Boundary |
|---|---|
| `hm-test-driven` | Provides the regression test format + RED-GREEN-REFACTOR discipline |
| `hm-spec-authoring` | When the bug reveals a missing spec, route to spec authoring |
| `hm-arch-refactor` | When the fix requires structural change, escalate to refactor |
| `hm-coord-loop` | Multi-investigator coordination when 1 debugger is insufficient |

## Additional Resources

### Reference Files
- **`references/hypothesis-catalog.md`** — common bug categories with examples
- **`references/instrumentation-toolkit.md`** — cheapest-to-most-expensive options
- **`references/bisect-recipes.md`** — git bisect patterns

### Templates
- **`templates/debug-report.md`** — output structure for the 6-step protocol
- **`templates/root-cause-statement.md`** — one-sentence cause + supporting evidence

### Workflows
- **`workflows/six-step-protocol.md`** — detailed sequence with decision points

### Scripts
- **`scripts/repro-template.sh`** — shell template for capturing reproduction

### Evaluation
- **`evals/evals.json`** — 5 debug cases (bug → diagnosis)
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
