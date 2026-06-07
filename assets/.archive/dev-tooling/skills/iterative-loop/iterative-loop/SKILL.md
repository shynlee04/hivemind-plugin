---
name: iterative-loop
description: >
  Use when running iterative refinement loops with bounded iteration control,
  entry/exit criteria enforcement, max-iteration guards, and checkpoint-based
  recovery between cycles. Triggers on: "iterative loop", "loop until complete",
  "iteration control", "loop with max iterations", "multi-round refinement",
  "progressive improvement", "retry-with-correction", "repeat until condition",
  "loop with exit criteria", "loop termination", "bounded iteration",
  "iteration guard", "checkpoint recovery in loop", "rerun with fixes",
  "fix → verify → repeat", "loop until criteria met", "iteration budget".
  NOT for wave-based parallel execution (wave-execution), guardrail against
  premature completion claims (hm-loop-completion), or multi-agent
  coordination patterns (hm-coord-loop).
metadata:
  layer: "2"
  role: "execution-engine"
  pattern: P2
  version: "1.0.0"
---

# Iterative Loop

## The Iron Law

```
Every loop needs an exit. Every exit needs evidence. No evidence → no exit.
```

## Overview

Iterative looping is the discipline of **bounded repetition** — running a body of work multiple times with controlled conditions for continuation, termination, and recovery. Unlike unbounded retries or simple recursion, iterative loops carry explicit:

- **Entry criteria** — what must be true before the first iteration
- **Exit criteria** — what terminates the loop (success or fail)
- **Max-iteration guard** — hard upper bound preventing infinite loops
- **Checkpoint state** — recoverable snapshot between iterations

The danger is not looping itself — it is looping without discipline. A loop without exit criteria is an infinite loop disguised as a good idea. A loop without a max-iteration guard is a denial-of-service attack on your own context budget.

## When to Use / When NOT to Use

**Load this skill when:**
- You need to repeat a process until a condition is met (multi-round refinement)
- You need bounded retry-with-correction cycles
- You are implementing a progressive improvement workflow (e.g., fix → verify → fix again)
- You need to enforce max-iteration limits on an execution phase
- You need checkpoint recovery between loop cycles
- A task description says "repeat until X" or "iterate until Y"

**Do NOT load this skill for:**
- Simple sequential steps (just run them in order — no loop needed)
- Parallel wave execution (use wave-execution)
- Guardrailing against premature "done" claims (use hm-loop-completion)
- Coordinating multiple agents in a workflow (use hm-coord-loop)
- Unbounded exploration or open-ended research (no exit criteria = no loop)

## Decision Matrix: What Needs Looping vs What Does Not

Before applying iterative looping, classify the work:

| Situation | Needs Loop? | What Kind |
|-----------|------------|-----------|
| One-shot code change with single verify | **No** — do once, verify, done | N/A |
| Bug fix: apply fix, test fails, fix again | **Yes** — retry-with-correction | Fix → Verify → Fix → ... → Exit on PASS |
| Code review: submit → review → revise → re-submit | **Yes** — refinement loop | Submit → Review → Revise → ... → Exit on APPROVE |
| Quality gate: run → fix → re-run → ... | **Yes** — iteration until PASS | Test → Fix → Test → ... → Exit on all PASS |
| Implementation plan: write once, done | **No** — linear, no iteration | N/A |
| Open-ended research: no fixed stopping condition | **No** — no exit criteria = infinite loop | Use hm-loop-completion or time-budget instead |
| Multi-wave parallel execution | **No** — wave-execution handles this | Use wave-execution |

### Quick Decision Flowchart

```
Is there a clear stopping condition?
  ├─ NO → This is not an iterative loop problem.
  │        Use time-budgeting or hm-loop-completion instead.
  └─ YES →
         Is this a one-shot task (do once, verify, done)?
         ├─ YES → No loop needed. Execute sequentially.
         └─ NO  →
                  Can work be structured as: Do → Verify → Fix → Repeat?
                  ├─ NO → Consider wave-execution or linear steps instead.
                  └─ YES → Use iterative loop protocol below.
```

## Loop Protocol

Every iterative loop follows this five-phase structure:

### Phase 1: Setup — Define the Loop Contract

Before entering the loop, establish:

1. **Entry criteria** — what must be true before iteration 1 starts.
   - Example: "Source code compiles" or "All test files exist"
2. **Exit criteria** — what condition(s) terminate the loop.
   - Must be falsifiable (checkable with a command or file read).
   - Example: "All tests pass" or "Code review score ≥ 3/5"
   - **Separate success exit from fail exit.** Success = criteria met. Fail = max iterations reached + criteria still unmet.
3. **Max iterations** — hard upper bound.
   - Default: 3 for refinement loops, 5 for retry loops.
   - Document why you chose this number.
4. **Checkpoint path** — where to save state between iterations.
   - Example: `.scratch/loop-checkpoint-N.md`

**Loop contract template:**

```
Loop: [short name]
Entry criteria:
  - [checkable condition 1]
  - [checkable condition 2]
Exit criteria:
  - [checkable condition 1 for success]
  - [checkable condition 2 for success]
Max iterations: [N]
Checkpoint path: [path]
On fail: [what to do if max iterations reached without success]
```

### Phase 2: Execute — Run One Iteration

Each iteration runs the same body of work:

1. Load checkpoint state from previous iteration (if any).
2. Execute the work body (fix, refine, adjust, explore).
3. Save checkpoint state to `checkpoint path` for this iteration.
4. Signal completion of this iteration's work.

The work body itself is not prescribed — it depends on the domain. The loop protocol only governs the repetition, not the content.

### Phase 3: Verify — Check Exit Criteria

After each iteration, verify:

1. Run the exit criteria check(s) with **fresh evidence**.
2. Record the result: PASS, FAIL, or PARTIAL.
3. If PASS → proceed to Phase 5 (Exit).
4. If FAIL or PARTIAL → proceed to Phase 4 (Continue or Escalate).

**Evidence rule:** Verification must use the same commands and assertions each iteration. Do not change the bar between iterations.

### Phase 4: Gate — Continue or Escalate

| Condition | Action |
|-----------|--------|
| Exit criteria PASS | → Exit (Phase 5) |
| Exit criteria FAIL + iteration < max | → Continue (Phase 2 with increment) |
| Exit criteria FAIL + iteration = max | → Escalate (Phase 5, fail exit) |
| Loop degraded (worse than previous iteration) | → STOP immediately, escalate |

**Degradation detection:** If the exit criteria score is **worse** than the best iteration so far, STOP. Continuing is exponentially expensive. Escalate.

### Phase 5: Exit — Success or Fail

**Success exit:**
- Confirm exit criteria met with evidence.
- Document the final iteration number and outcome.
- Clean up checkpoint artifacts (or archive them).

**Fail exit:**
- Report: "Reached max iterations (N) without meeting exit criteria."
- Document: what improved, what did not, what convergence looks like.
- Recommend: switch to a different approach, widen the loop contract, or escalate to human.
- Clean up checkpoint artifacts.

**After exit, the loop is closed.** Do not re-enter the loop without re-establishing the contract.

## Max-Iteration Guard

The max-iteration guard is **non-negotiable.** Every loop must declare a maximum iteration count before entry. Without it, loops silently become infinite.

### Setting the Guard

| Loop Type | Recommended Max | Rationale |
|-----------|----------------|-----------|
| Fix → Verify (bug fix) | 3 | Beyond 3 = fundamentally wrong diagnosis |
| Code review → Revise | 5 | Beyond 5 = deeper design issue, not minor polish |
| Quality gate fix loop | 5 | Beyond 5 = test or implementation needs redesign |
| Progressive refinement | 3 | Beyond 3 = diminishing returns, need fresh approach |
| Retry-with-correction | 3 | Beyond 3 = pattern failure, not transient issue |

### Override Protocol

If you genuinely need more iterations:
1. State the reason in one sentence: "Need more iterations because <reason>"
2. Document the new max and why the original estimate was wrong.
3. Proceed with increased max.

Do NOT override silently. Document every guard adjustment.

## Checkpoint Recovery

Between iterations, save state for recovery in case of interruption.

### What to Save Each Iteration

```
Checkpoint N:
- Iteration number: N
- Exit criteria result: PASS / FAIL / PARTIAL
- What changed this iteration: [summary of changes]
- What did NOT change: [unchanged items]
- Degradation check: [score compared to best so far]
- Next iteration target: [what the next iteration should focus on]
```

### Recovery After Interruption

1. Read the latest checkpoint (highest iteration number).
2. Confirm entry criteria still hold (or re-establish them).
3. Restart from the **same iteration** that was interrupted.
4. Do NOT skip verification for the interrupted iteration — re-run it.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Missing exit criteria** | Loop has no stated stopping condition | Define 1-3 falsifiable exit criteria before entering |
| **No max-iteration guard** | Loop contract has no max iterations value | Set max iterations (default 3-5) before entering |
| **Asymmetric evidence** | Verification bar is lowered after failure | Use same verification commands every iteration |
| **Degradation tolerance** | Loop continues even though results are getting worse | Add degradation check: if score drops below best, STOP |
| **Phantom progress** | "Something changed" but exit criteria haven't moved | Track exit criteria PASS/FAIL per iteration, not just "work done" |
| **Unbounded refinement** | "Let's keep improving until it's perfect" | Perfect is not an exit criterion. Set a measurable threshold. |
| **Checkpoint amnesia** | No state saved between iterations | Save checkpoint after every iteration |
| **Loop stacking** | A loop inside a loop inside a loop | Flatten to a single loop with compound exit criteria |
| **Goalpost moving** | Exit criteria change mid-loop to avoid failure | Lock exit criteria at loop entry. Escalate instead of moving the bar. |

## Loop Contract Template

Copy this template before entering any iterative loop:

```markdown
## Loop Contract

**Name:** [short descriptive name]

**Entry criteria:**
- [ ] [checkable condition]
- [ ] [checkable condition]

**Exit criteria (success):**
- [ ] [checkable condition — all must PASS]

**Max iterations:** [3-5]

**Checkpoint path:** `.scratch/loop-[name]/`

**On success:** [what to do — e.g., commit changes, report completion]

**On fail (max iterations reached):** [what to do — e.g., escalate, change approach]

---

**Iteration log:**

| # | Result | Summary | Link |
|---|--------|---------|------|
| 1 | | | |
| 2 | | | |
| ... | | | |
```

## Cross-References

- **hm-loop-completion** — Guard against false completion claims inside loop iterations. Verify each iteration's output before deciding to continue or exit.
- **wave-execution** — For parallel task groups with dependency ordering. Iterative loops are sequential; wave execution is parallel-wave-gated.
- **hm-coord-loop** — For coordinating agents across tasks. Iterative loops focus on a single repeatable process within a task.
- **phase-execution** — For running phase plans with checkpoint recovery. Iterative loops are a tool you may use inside a phase.
