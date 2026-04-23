---
name: hm-debug
description: >
  Systematically debug issues with persistent state across context resets.
  Use when investigating bugs, tracing root causes, performing structured failure analysis,
  when agents get stuck in loops, when tests pass locally but fail in CI, when issues
  appear intermittently, or when multiple attempts to fix have failed.
  Even when the user says "it's broken" or "something's wrong" without specifics.
  Triggers: "debug", "investigate", "root cause", "failure analysis", "systematic debugging",
  "trace the issue", "find the bug", "why is this failing".
  NOT for syntax errors or issues solvable by a single log read.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Systematic Debugging

## The Iron Law

```
Fix the cause, not the symptom. Verify the fix, not the hypothesis.
```

## On Load

1. Read `references/debug-state-machine.md` — structured debugging protocol
2. Read `references/evidence-framework.md` — how to collect and rank evidence

## The Debug Protocol

### Step 1: Reproduce

```bash
# Can you make it fail on demand?
# If no → gather more context, ask for reproduction steps
# If yes → proceed to isolation
```

**Gate:** If you cannot reproduce, you cannot verify a fix.

### Step 2: Isolate

```bash
# Binary search: comment out half the code
# Does it still fail?
#   YES → bug is in remaining half
#   NO  → bug is in commented half
# Repeat until single line/function identified
```

**Gate:** If isolation stalls, collect more evidence (logs, traces, inputs).

### Step 3: Hypothesize

Form exactly one hypothesis:

```
HYPOTHESIS: <specific mechanism causing the bug>
PREDICTION: <if hypothesis is true, then X will happen when Y>
```

**Gate:** If you have multiple hypotheses, test them one at a time.

### Step 4: Test Hypothesis

```bash
# Run experiment that distinguishes hypothesis from alternatives
# Record result
```

**Gate:** If experiment is inconclusive, refine hypothesis or gather more data.

### Step 5: Fix and Verify

```bash
# Apply minimal fix
# Reproduce original failure scenario
# Confirm failure is gone
# Run regression tests to ensure no new failures
```

**Gate:** If fix passes but regression tests fail, revert and reconsider.

## Persistent Debug State

Across context resets, persist:

```markdown
## Debug Session: <bug-id>
**Status:** [reproducing | isolating | hypothesizing | fixing | verified]
**Reproduction:** <exact steps>
**Isolation:** <narrowed to file/function/line>
**Hypothesis:** <current hypothesis>
**Experiments Run:** <list with results>
**Fix Applied:** <commit hash>
**Verification:** <test results>
```

Store in `.debug/<bug-id>.md`.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Guesser** | Changes code without reproduction or isolation | Stop. Reproduce first, then isolate. |
| **The Symptom Fixer** | Fixes output without understanding cause | Ask "why" 5 times to reach root cause |
| **The Unverified Fix** | Claims fix without running reproduction | Run reproduction. Fresh output or no claim. |
| **The Scattershot** | Tries 3 fixes at once | One hypothesis, one fix, one verification at a time |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/debug-state-machine.md` | Structured protocol for each debug phase |
| `references/evidence-framework.md` | How to collect, rank, and test evidence |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-detective` | Investigates codebase structure. This skill investigates runtime behavior. |
| `hm-synthesis` | Synthesizes research findings. This skill synthesizes debug evidence. |
| `hm-planning-with-files` | Tracks task plans. This skill tracks debug session state. |
