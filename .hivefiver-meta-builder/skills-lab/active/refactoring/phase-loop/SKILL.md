---
name: phase-loop
description: This skill should be used when the user asks to "define loop semantics", "explain phase loop", "iterate on document", "phase loop architecture", "revision loop pattern", "check-revise-escalate", "how many iterations", "loop exit criteria", "stall detection", or "iterative phase execution".
version: 1.0.0
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Phase Loop Skill

Defines iterative loop semantics with the check-revise-escalate pattern for phase-based execution.

<files_to_read>
- references/revision-loop.md — detailed loop semantics, stall detection, and escalation patterns
</files_to_read>

## Core Concept

A **phase loop** iterates on the same document/target with locked paths, applying incremental deltas until stable or max iterations reached.

## Loop Definition

```
prev_issue_count = Infinity
iteration = 0

LOOP:
  1. Run checker/validator on current output
  2. Read checker results
  3. If PASSED or only INFO-level issues → exit loop
  4. If BLOCKER or WARNING issues found:
     a. iteration += 1
     b. If iteration > 3 → escalate to user
     c. Parse issue count from checker output
     d. If issue_count >= prev_issue_count → stall detected, escalate
     e. prev_issue_count = issue_count
      f. Re-spawn implementer subagent with critic subagent feedback
     g. Go to LOOP
```

## Key Semantics

| Term | Meaning |
|------|---------|
| **Loop** | Iterate on same document (not copy) |
| **Locked paths** | Same target files throughout |
| **Delta** | Incremental changes applied each iteration |
| **Exit** | Document stable OR max iterations reached |

## Issue Severity Levels

| Level | Action |
|-------|--------|
| **PASSED** | Exit loop immediately |
| **INFO** | Continue but treat as passed |
| **WARNING** | Include in issue count, attempt revision |
| **BLOCKER** | Include in issue count, attempt revision |

## Exit Criteria

- **PASSED** marker in checker output
- **Only INFO-level issues** remain
- **Max iterations (3)** reached → escalate to user

## Stall Detection

```
if issue_count >= prev_issue_count:
    escalate("Loop stalled - no progress made")
```

Stall = same or worse issue count after revision attempt.

## Validation Checklist

- [ ] Loop targets same document (not copies)
- [ ] File paths remain locked throughout
- [ ] Checker runs before each revision
- [ ] Issue count tracked per iteration
- [ ] Stall detection active
- [ ] Max 3 iterations enforced
- [ ] Escalation path clear

## Agent Integration

| Agent | Role | When to Use |
|-------|------|-------------|
| `intent-loop` | Phase 0 intent clarification before loop entry | When loop target is unclear |
| `phase-guardian` | Guardrail enforcement and loop termination | Enforce max iterations, checkpoint gates |
| `critic` | Checker/validator for each iteration | Quality gate before revision |
| `builder` | Implementer for each revision pass | Apply incremental fixes |

## Anti-Patterns

| Pattern | Detection | Correction |
|---------|-----------|------------|
| Copy loop | Creating new files each iteration | Lock paths, edit in place |
| Silent stall | No issue count comparison | Compare before/after counts |
| Infinite loop | iteration > 3 not enforced | Hard cap at 3, escalate |
| Premature exit | Exiting on first WARNING | Only exit on PASSED or INFO-only |

## Example Usage

An orchestrator runs a critic subagent to validate the current output, counts issues by severity, and compares the count to the previous iteration. If issues remain and the count is decreasing, the orchestrator re-spawns an implementer subagent with the critic's feedback. On stall (issue count not decreasing) or max iterations reached, the orchestrator escalates to the user.