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

## Overview

Systematic debugging workflow that maintains investigation state across context resets. Use when tracing root causes of complex failures, investigating intermittent issues, or performing structured failure analysis. Produces evidence-grounded diagnosis with hypothesis tracking and verification checkpoints.

## The Iron Law

```
NO FIXES BEFORE ROOT-CAUSE INVESTIGATION. Fix the cause, not the symptom. Verify the fix, not the hypothesis.
```

# Systematic Debugging
## On Load

1. Read `references/debug-state-machine.md` — structured debugging protocol
2. Read `references/evidence-framework.md` — how to collect and rank evidence

## The Debug Protocol

### Stop-the-Line Entry Gate

When debugging starts, stop feature work and preserve the failing evidence before changing code. This follows the third-party gated discipline pattern from `NousResearch/hermes-agent` systematic debugging and `addyosmani/agent-skills` debugging recovery guidance: reproduce, localize, reduce, prove root cause, guard recurrence, then resume.

**Required evidence before a fix:**

| Evidence | Required proof |
|----------|----------------|
| Failure capture | Exact command, input, stack trace, log, UI path, or user action that fails |
| Boundary trace | Where data/control enters, transforms, and exits the failing subsystem |
| Competing hypotheses | At least two plausible causes considered, with one selected for falsification |
| Root-cause prediction | “If this cause is true, then this experiment will show X” |
| Recurrence guard | Regression test, monitor, invariant, or documented manual verification that catches repeat failure |

If this evidence does not exist, stay in `REPRODUCE`, `GATHER`, or `ISOLATE`; do not enter `FIX`.

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

### Step 6: Guard Recurrence

After verification, add the smallest durable guard that would have caught the bug: regression test, assertion, structured log, invariant check, or runbook note. If the guard is intentionally deferred, write the reason and owner into the debug session state.

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

## RICH Gate Source Decisions

| Source | Decision | Local adaptation |
|--------|----------|------------------|
| `NousResearch/hermes-agent` systematic-debugging | ADOPT | “No fixes before root-cause investigation” is now an explicit iron-law clause. |
| `addyosmani/agent-skills` debugging-and-error-recovery | ADAPT | Stop-the-line, preserve evidence, root-cause fix, and recurrence guard mapped into the debug state machine. |
| GitHub agent skill resource model | ADAPT | Heavy details remain in references/evals; SKILL.md stays as the trigger and gate index. |

## Independence Notes

Default state path is `.debug/<bug-id>.md` in the end-user project. If a project already has a debug/journal convention, use that convention and record the path in the session state. Do not assume GSD, BMAD, or this repository's `.planning/` layout.

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

## Self-Correction

### When the Task Keeps Failing

[Detection] If reproduction, isolation, or fix attempts keep failing, first verify the reproduction steps are still valid against the current codebase state — other changes may have altered the failure scenario. Check whether the debug state file (`.debug/<bug-id>.md`) is up to date; stale state leads to looping on solved problems. If the same hypothesis fails 2 falsification attempts, discard it and form a new competing hypothesis rather than refining the same one. If 3 hypotheses fail to produce a root cause, escalate with the full evidence table, all experiments run, and the narrowed isolation boundary so the user can provide missing context or reassess scope.

[Recovery] Write to `.debug/<bug-id>.md` before each fix attempt. If stuck, restart from REPRODUCE with fresh reproduction — do not build on unverified isolation.

### When Unsure About the Next Step

[Detection] If you cannot determine whether to continue isolating, switch hypotheses, or attempt a fix, re-read the required evidence table — if any of the 5 evidence types (failure capture, boundary trace, competing hypotheses, root-cause prediction, recurrence guard) is missing, you are not ready to move forward. Default to GATHER more evidence if isolation is inconclusive, and to ISOLATE further if the root cause is not narrowed to a single function or module.

[Recovery] Re-read `references/evidence-framework.md` for evidence collection strategies. When in doubt, collect one more piece of evidence before deciding.

### When the User Contradicts Skill Guidance

[Detection] If the user wants to apply a fix without going through the full debug protocol (reproduce, isolate, hypothesize), acknowledge the request but warn that bypassing the protocol risks fixing symptoms rather than root causes. If the user insists, apply the fix but note in the debug state file which steps were skipped and why — skipped isolation means the root cause is unverified. If the user wants to fix a different bug mid-debug, complete or checkpoint the current debug session before switching.

[Recovery] Document user overrides in `.debug/<bug-id>.md` with timestamp and rationale. Tag any fix applied without root-cause verification as "symptom-level" in the debug state.

### When an Edge Case Is Encountered

[Detection] If the bug cannot be reproduced deterministically (intermittent failure, race condition, environment-specific), you cannot verify a fix. Switch to probabilistic reproduction: run N times, record success/failure ratio, narrow conditions (specific OS, concurrency level, data size). If the bug spans multiple services or repositories, document the cross-system boundary trace before attempting isolation. If the debug state file is corrupted or missing, reconstruct from git history (recent commits, test failures, error logs) and mark the reconstructed state as degraded evidence.

[Recovery] For non-deterministic bugs, increase reproduction attempts and document the probability. For multi-system bugs, isolate one system boundary at a time.

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-detective` | Investigates codebase structure. This skill investigates runtime behavior. |
| `hm-synthesis` | Synthesizes research findings. This skill synthesizes debug evidence. |
| `hm-planning-persistence` | Tracks task plans in `.hivemind/state/planning/<session-id>/`. This skill tracks debug session state. |
