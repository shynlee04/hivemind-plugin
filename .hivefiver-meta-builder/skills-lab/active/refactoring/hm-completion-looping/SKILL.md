---
name: hm-completion-looping
description: >
  Guardrail workflows against regression with non-completion detection and automatic loop-back.
  Use when a task must loop until verified complete, when guarding against premature success claims,
  when implementing self-verifying subagent dispatch, when agents report "done" but verification fails,
  when building autonomous loops that need completion gates, or when tasks keep failing silently.
  Even when the user says "make sure it actually works" or "verify before claiming done."
  Triggers: "loop until complete", "verify completion", "completion detection", "guardrail",
  "regression guard", "self-verifying", "autonomous loop", "completion gate".
  NOT for one-shot tasks or simple retry loops.
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

Guardrail skill that prevents premature task completion by enforcing verification loops. Use when building autonomous agent workflows, verifying subagent results, or ensuring tasks actually complete before moving on. Produces self-verifying execution flows with automatic loop-back on failure detection.

## The Iron Law

```
A task is not done when the subagent says it is done. A task is done when verification proves it is done.
```

# Completion Looping
## On Load

1. Read `references/verification-checklist.md` — criteria for true completion
2. Read `references/loop-patterns.md` — loop types and when to use each

## Completion Detection

### The Three Gates

| Gate | Check | Failure Action |
|------|-------|---------------|
| **Output Gate** | Did the subagent produce the expected artifacts? | Re-dispatch with corrected scope |
| **Quality Gate** | Do artifacts pass basic validation (syntax, structure, references)? | Return DONE_WITH_CONCERNS, fix then re-verify |
| **Scope Gate** | Does output match the task envelope (nothing extra, nothing missing)? | Re-dispatch with spec-compliance emphasis |

### Loop Types

| Type | Use When | Max Iterations |
|------|----------|---------------|
| **Verify-After** | Subagent returns → verify → loop if fail | 5 |
| **Verify-During** | Subagent works in iterations, verifies each | 10 |
| **Guardrail** | External monitor watches for premature completion | 3 |

## Self-Verification Envelope

When dispatching a subagent that must self-verify:

```
## Your Task
<full task text>

## Verification Requirements
Before returning DONE, you MUST:
1. [ ] Run <verification command>
2. [ ] Confirm <output condition>
3. [ ] If any check fails, return DONE_WITH_CONCERNS, not DONE

## Loop-Back Trigger
If verification fails, you will be re-dispatched with:
- Previous attempt findings
- Specific check that failed
- Corrected scope if needed
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Premature Done** | Subagent returns DONE without running tests/validation | Enforce verification requirements in task envelope |
| **The Infinite Loop** | Same failing approach retried >5 times | Cap iterations, escalate to orchestrator |
| **The Silent Fix** | Loop iteration makes changes without logging | Require progress logging in each iteration |
| **The Skipped Gate** | Quality gate passes but scope gate fails | Run ALL gates before accepting completion |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/verification-checklist.md` | Need criteria for true completion |
| `references/loop-patterns.md` | Need to choose loop type for a task |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | Owns general multi-agent dispatch. This skill adds completion guardrails to that dispatch. |
| `hm-phase-loop` | Owns iterative phase semantics. This skill owns the verification logic within iterations. |
| `hm-planning-with-files` | Owns task_plan.md tracking. This skill updates verification status in the plan. |
