---
name: hm-phase-loop
description: Manage iterative phase loops with entry gates, exit criteria, and checkpoint recovery. Use when running multi-plan phases, handling mid-phase interruptions, or iterating until completion. NOT for one-shot tasks or unplanned work.
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

## Overview

Manage iterative phase loops with entry gates, exit criteria, and checkpoint recovery. Use when running multi-plan phases, handling mid-phase interruptions, iterating until completion, or managing loop termination. Produces stable phase outcomes with max-iteration safeguards.

## Core Concept

A **phase loop** iterates on the same document/target with locked paths, applying incremental deltas until stable or max iterations reached.

Phase 30 rich-lineage hardening treats a phase loop as a deterministic workflow controller, not a conversational retry. The loop must persist a durable cursor, evaluate composable termination predicates, and pause at human interrupts with a concrete resume pointer.

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

### Durable Phase Cursor

Before every revision, checkpoint, or escalation, persist:

```yaml
phase_id: "<phase>"
plan_id: "<plan>"
locked_paths: ["<paths>"]
iteration: 1
prev_issue_count: 5
last_issue_count: 3
checker_command: "<validator>"
last_checker_status: WARNING
termination_predicates: [passed_marker, info_only, max_iterations, stall_detected, human_interrupt]
resume_pointer: "run checker after applying delta for issues 1-3"
```

The cursor may live in `.opencode/state/...`, `.planning/phases/.../STATE.md`, or an end-user project's equivalent state root. Document the adapter path in the phase artifact.

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
- [ ] Durable cursor written before pause/resume/escalation
- [ ] Termination predicates named in the loop artifact
- [ ] Human interrupts include payload, required response shape, and resume pointer

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

## Self-Correction

### When the Task Keeps Failing

If the loop keeps failing at the same gate, check whether the phase entry criteria are actually met before looping again — sometimes STATE.md says a phase is ready but the required artifacts don't exist on disk. Verify STATE.md reflects real progress by cross-referencing with actual file existence. If the same gate fails 3 consecutive iterations with no improvement in issue count, stop the loop and ask the user whether to rework the plan, accept the current state, or escalate. Do not silently increase the max iteration count beyond 3.

### When Unsure About the Next Step

Re-read the phase's PLAN.md for the specific verification criteria — the plan defines what "done" means, not the loop itself. If no PLAN.md exists for the phase, the phase may not be planned yet — suggest planning before execution rather than looping on undefined criteria. If you cannot determine whether issues are WARNINGS or BLOCKERS, treat them as BLOCKERS (the more conservative interpretation) and attempt revision. The safe default is always: re-read the plan, compare current state to acceptance criteria, and proceed only when the comparison is favorable.

### When the User Contradicts Skill Guidance

If the user says the phase is done but verification still shows issues, present the specific failing criteria and ask which to accept as-is versus which to rework — do not silently mark issues as resolved. If the user wants to skip the max-iteration cap, allow it but document why in `progress.md` and warn that stall detection is still active. The user's override takes precedence, but the skill must ensure the user is making an informed decision by showing the exact verification state.

### When an Edge Case Is Encountered

If a phase has zero plans listed, it was likely created but never planned — suggest running the planning workflow before attempting execution loops. If the checker/validator script exits with an unexpected error code (not 0 or 1), treat it as a BLOCKER and investigate the script before continuing the loop. If issue count oscillates (decreasing then increasing), this indicates the revision is introducing regressions — stop the loop, compare the current output against the previous iteration's output, and re-dispatch with a more focused fix scope.

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `hm-planning-persistence` | Owns persistent planning state in `.hivemind/state/planning/<session-id>/`. This skill reads phase plans from there when available. |
| `hm-phase-execution` | Owns wave-based execution mechanics. This skill adds iterative loop management on top. |
