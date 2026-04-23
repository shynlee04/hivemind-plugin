# Revision Loop Pattern

The revision loop is a deterministic iteration pattern used to drive documents toward stable/pass state through repeated check-revise cycles.

## Pattern Overview

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
      f. Re-spawn implementer subagent with checker feedback
     g. Go to LOOP
```

## Phase Flow: Check → Revise → Escalate

### 1. Check (Validator)

The checker examines current output and returns structured results with three fields:

- **status:** One of `PASSED`, `WARNING`, or `BLOCKER`
- **issues:** A list of individual findings, each with a severity level (`INFO`, `WARNING`, `BLOCKER`), a message, and an optional location
- **summary:** A human-readable summary of the check outcome

**Checker's job:**
- Run once per iteration
- Emit structured issue list
- Include PASSED marker when no blocking issues

### 2. Revise (Producer)

On BLOCKER or WARNING:

```
Re-spawn producer with:
  - Same document context
  - Checker feedback as delta
  - Locked target paths
  
Producer applies incremental fix, not full rewrite.
```

**Reviser's job:**
- Address issues raised by checker
- Apply minimal delta (not wholesale replacement)
- Preserve document identity (same file, same path)

### 3. Escalate (Exit Conditions)

Escalation triggers:

| Condition | Action |
|-----------|--------|
| `iteration > 3` | Hard stop, user intervention required |
| `issue_count >= prev_issue_count` | Stall detected, user intervention required |
| `status === PASSED` | Clean exit |
| `issues.onlyInfo()` | Clean exit (info doesn't block) |

Escalation message should include:
- Current iteration count
- Issue count trend
- Last checker output summary

## Issue Count Tracking

The loop maintains `prev_issue_count` to detect stalls:

```
iteration=1: issues=5, prev=Infinity → proceed
iteration=2: issues=3, prev=5 → proceed (improved)
iteration=3: issues=4, prev=3 → STALL (4 >= 3)
```

Stall = no improvement or regression.

## Iteration Limits

**Max 3 iterations.** Why?

| Iteration | Purpose | Expected Outcome |
|-----------|---------|-------------------|
| 1 | Initial fix attempt | Resolves obvious issues |
| 2 | Follow-up on residual | Catches what iteration 1 missed |
| 3 | Final push | Last chance before escalation |

After 3 iterations:
- Loop exits
- User receives summary of what was attempted
- Document state preserved for manual intervention

## Re-spawn Prompt Structure

When re-spawning the producer:

```
## Context
Document: [locked path]
Iteration: N/3

## Previous Output Issues
[Checker output parsed into list]

## Your Task
Address the above issues. Apply minimal delta.
Do not rewrite the entire document.
```

## Anti-Patterns to Avoid

### Copy Loop (Wrong)
```
Loop:
  produce_v1 → check → produce_v2 → check → produce_v3
  (Each iteration creates new file, loses context)
```

### Silent Stall (Wrong)
```
Loop:
  check → revise → check → revise → check → revise
  (Issue count never decreases but loop continues)
```

### Flat Signal (Wrong)
```
if issues: try_again  # No severity differentiation
```
Should distinguish INFO (ok) from WARNING/BLOCKER (actionable).

## Integration Points

The revision loop is called by:

1. **Phase orchestration** - Coordinates multiple phases, each using revision loop
2. **Quality gates** - Entry/exit criteria for document progression
3. **Agent supervision** - Parent agent spawns subagent with loop semantics

## Example: Loop Execution Walkthrough

An orchestrator implements the revision loop by:

1. Initializing `prevIssueCount` to infinity and `iteration` to 0
2. Running the checker (a critic subagent) on the current document
3. If the checker returns PASSED or only INFO-level issues → exit with success
4. Increment the iteration counter
5. If iteration exceeds 3 → exit with MAX_ITERATIONS and escalate to user
6. Count WARNING and BLOCKER issues from the checker output
7. If the count is greater than or equal to `prevIssueCount` → exit with STALLED and escalate
8. Store the current count as `prevIssueCount`
9. Re-spawn an implementer subagent with the checker's feedback as revision instructions
10. Return to step 2

This pattern ensures deterministic termination, progress visibility through issue count tracking, stall detection when revisions stop improving the document, and clean escalation when automatic resolution fails.

## Summary

The revision loop pattern provides:

- **Deterministic termination** - Max 3 iterations or explicit pass
- **Progress visibility** - Issue count tracking shows improvement/regression
- **Stall detection** - Prevents infinite loops with no progress
- **Clean escalation** - User informed when automatic resolution fails
- **Minimal delta** - Incremental fixes, not full rewrites