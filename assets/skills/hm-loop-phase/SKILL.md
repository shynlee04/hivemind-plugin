---
name: hm-loop-phase
description: >
  Run iterative phase loops with bounded iteration, durable cursors, exit criteria,
  and checkpoint recovery. Use when executing multi-plan phases, iterating a
  document until stable, retry-with-correction, progressive refinement, or when
  the same delta must be re-applied until a checker passes. Triggers on:
  "iterative loop", "loop until complete", "iteration control", "loop with max iterations",
  "multi-round refinement", "progressive improvement", "retry-with-correction",
  "phase loop", "bounded iteration", "iteration guard", "checkpoint recovery in loop",
  "fix → verify → repeat", "stall detection", "durable phase cursor".
  NOT for wave-based parallel execution (wave-execution), guardrail against
  premature completion claims (hm-loop-completion), or single-pass tasks
  with no iteration.
metadata:
  consumed-by:
    - "hm-guardian"
    - "hm-operator"
    - "hm-executor"
    - "hm-coord-loop"
  lineage-scope: "hm-*"
  access: "STRICT"
  role: "iteration-controller"
  realm: "test,clean-code"
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

## GSD Compatibility

This skill is the canonical Hivemind replacement. If you're still on GSD:

| GSD skill | Hivemind equivalent | Behavior diff |
|-----------|--------------------|--------------|
| `gsd-execute-phase` | `hm-loop-phase` | GSD runs sequential phase plans with hardcoded checkboxes; Hivemind uses 5-phase iterative loop protocol (Setup → Execute → Verify → Gate → Exit) with durable cursors and stall detection. Hivemind exposes `hivemind-trajectory` and `delegation-status` for orchestrator lifecycle. |

You can use either; the Hivemind path is canonical, the GSD path is supported via the equivalence map.

## Overview

`hm-loop-phase` is the iteration controller for phase plans. It merges two layers:

1. **Loop discipline** (from `iterative-loop`): the 5-phase loop protocol (Setup → Execute → Verify → Gate → Exit), decision matrix, max-iteration guard, checkpoint recovery, anti-patterns.
2. **Phase-specific mechanics** (from `hm-l2-phase-loop`): durable phase cursor, issue severity levels (PASSED / INFO / WARNING / BLOCKER), exit criteria, stall detection.

The skill is **tech-agnostic** in discipline; the Hivemind binding layer names the runtime tools that make the loop executable end-to-end.

## When This Skill Loads — Do This First

1. **Classify the work.** Use the Decision Matrix below. If the work is one-shot, do not enter a loop.
2. **Write the Loop Contract** before iteration 1. Define entry criteria, exit criteria, max iterations, checkpoint path.
3. **Persist a durable phase cursor** before iteration 1 (in `.hivemind/state/loops/<phase_id>.yaml`).
4. **Set the max-iteration guard.** Default 3 for refinement, 5 for retry. Hard cap: do not exceed without explicit re-authorization.
5. **Define the issue severity rubric** (PASSED / INFO / WARNING / BLOCKER) before iteration 1.

## The Iron Law

```
Every loop needs an exit. Every exit needs evidence. No evidence → no exit.
```

A loop without exit criteria is an infinite loop disguised as a good idea. A loop without a max-iteration guard is a denial-of-service attack on your own context budget.

## Decision Matrix

| Situation | Needs Loop? | What Kind |
|-----------|-------------|-----------|
| One-shot code change, single verify | **No** | N/A — do once, verify, done |
| Bug fix: apply → test fails → fix again | **Yes** | Retry-with-correction (3 iters) |
| Code review: submit → review → revise | **Yes** | Refinement loop (5 iters) |
| Quality gate: run → fix → re-run | **Yes** | Iteration until PASS (5 iters) |
| Implementation plan: write once, done | **No** | Linear, no iteration |
| Open-ended research, no fixed stopping condition | **No** | Use time-budget or `hm-loop-completion` |
| Multi-wave parallel execution | **No** | Use `wave-execution` |

## Loop Protocol (5 Phases)

### Phase 1: Setup — Define the Loop Contract

Before iteration 1, establish:
- **Entry criteria** — what must be true before iteration 1 starts
- **Exit criteria** — falsifiable conditions that terminate the loop (separate success from fail)
- **Max iterations** — hard upper bound (default 3-5)
- **Checkpoint path** — where to save state between iterations

### Phase 2: Execute — Run One Iteration

1. Load checkpoint state from previous iteration (if any).
2. Execute the work body (fix, refine, adjust, explore).
3. Save checkpoint state for this iteration.
4. Signal completion of this iteration.

### Phase 3: Verify — Check Exit Criteria

After each iteration, verify with **fresh evidence**:
1. Run the exit criteria check(s) with the actual current state.
2. Record PASS, FAIL, or PARTIAL.
3. **Evidence rule:** Use the same commands and assertions every iteration. Do not change the bar.

### Phase 4: Gate — Continue or Escalate

| Condition | Action |
|-----------|--------|
| Exit criteria PASS | → Exit (Phase 5, success) |
| Exit criteria FAIL + iter < max | → Continue (Phase 2 with increment) |
| Exit criteria FAIL + iter = max | → Escalate (Phase 5, fail) |
| **Degradation** (worse than best iteration) | → STOP immediately, escalate |

### Phase 5: Exit — Success or Fail

- **Success exit:** Confirm criteria met, document final iteration, clean up checkpoints.
- **Fail exit:** Report "Reached max iterations (N) without meeting criteria." Document what improved, what did not. Recommend next approach.
- **After exit, the loop is closed.** Do not re-enter without re-establishing the contract.

## Durable Phase Cursor

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

The cursor may live in `.hivemind/state/loops/<phase_id>.yaml`, `.planning/phases/.../STATE.md`, or an end-user project's equivalent state root. Document the adapter path in the phase artifact.

## Issue Severity Levels

| Level | Action |
|-------|--------|
| **PASSED** | Exit loop immediately |
| **INFO** | Continue but treat as passed |
| **WARNING** | Include in issue count, attempt revision |
| **BLOCKER** | Include in issue count, attempt revision |

## Exit Criteria

- **PASSED** marker in checker output → exit
- **Only INFO-level issues** remain → exit
- **Max iterations (3-5)** reached → escalate

## Stall Detection

```
if issue_count >= prev_issue_count:
    escalate("Loop stalled — no progress made")
```

Stall = same or worse issue count after a revision attempt. On stall, STOP the loop. Continuing is exponentially expensive.

## Max-Iteration Guard

| Loop Type | Recommended Max | Rationale |
|-----------|----------------|-----------|
| Fix → Verify (bug fix) | 3 | Beyond 3 = wrong diagnosis |
| Code review → Revise | 5 | Beyond 5 = deeper design issue |
| Quality gate fix loop | 5 | Beyond 5 = test or impl needs redesign |
| Progressive refinement | 3 | Beyond 3 = diminishing returns |
| Retry-with-correction | 3 | Beyond 3 = pattern failure |

**Override protocol:** If you need more iterations, document the new max and why. Do not override silently.

## Checkpoint Recovery

### What to Save Each Iteration

```
Checkpoint N:
- Iteration number: N
- Exit criteria result: PASS / FAIL / PARTIAL
- What changed: [summary]
- What did NOT change: [unchanged items]
- Degradation check: [score vs best so far]
- Next iteration target: [focus]
```

### Recovery After Interruption

1. Read the latest checkpoint (highest iteration number).
2. Confirm entry criteria still hold.
3. Restart from the **same iteration** that was interrupted.
4. Re-run verification for the interrupted iteration (do not skip).

## Loop Contract Template

```markdown
## Loop Contract

**Name:** [short descriptive name]

**Entry criteria:**
- [ ] [checkable condition 1]
- [ ] [checkable condition 2]

**Exit criteria (success):**
- [ ] [checkable condition — all must PASS]

**Max iterations:** [3-5]
**Checkpoint path:** `.hivemind/state/loops/[name]/`
**On success:** [what to do]
**On fail:** [what to do]

---

**Iteration log:**

| # | Result | Summary | Link |
|---|--------|---------|------|
| 1 | | | |
| 2 | | | |
```

## Hivemind Runtime Bindings

| Concern | Hivemind binding |
|---------|-----------------|
| Poll orchestrator / subagent return | `delegation-status({ action: "list" })` |
| Audit loop log for regression | `hivemind-trajectory({ rootSessionId, depth: "summary" })` |
| Re-dispatch on failure | `delegate-task({ agent, prompt, stackOnSessionId })` |
| Persist a durable cursor | write to `.hivemind/state/loops/<phase_id>.yaml` |
| Verify session lifecycle | `hivemind-sdk-supervisor({ sessionId })` |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|--------------|-----------|------------|
| **Missing exit criteria** | Loop has no stated stopping condition | Define 1-3 falsifiable exit criteria before entry |
| **No max-iteration guard** | Loop contract has no max value | Set max (default 3-5) before entry |
| **Asymmetric evidence** | Verification bar is lowered after failure | Use same verification commands every iteration |
| **Degradation tolerance** | Loop continues even when getting worse | Add degradation check; STOP on regression |
| **Phantom progress** | "Something changed" but exit criteria haven't moved | Track PASS/FAIL per iteration, not "work done" |
| **Unbounded refinement** | "Let's keep improving until perfect" | Perfect is not an exit criterion |
| **Checkpoint amnesia** | No state saved between iterations | Save checkpoint after every iteration |
| **Loop stacking** | A loop inside a loop inside a loop | Flatten to single loop with compound exit criteria |
| **Goalpost moving** | Exit criteria change mid-loop | Lock criteria at entry; escalate instead |
| **Copy loop** | Creating new files each iteration | Lock paths, edit in place |
| **Silent stall** | No issue count comparison | Compare before/after counts |
| **Infinite loop** | iter > max not enforced | Hard cap, escalate on exceed |
| **Premature exit** | Exiting on first WARNING | Only exit on PASSED or INFO-only |

## Self-Correction

### When the Task Keeps Failing

If the loop keeps failing at the same gate, check whether entry criteria are actually met before looping again — sometimes STATE.md says a phase is ready but artifacts don't exist on disk. If the same gate fails 3 consecutive iterations with no improvement in issue count, stop the loop and ask the user whether to rework the plan, accept the current state, or escalate. Do not silently increase the max iteration count.

### When Unsure About the Next Step

Re-read the phase's PLAN.md for the specific verification criteria — the plan defines "done," not the loop itself. If you cannot determine whether issues are WARNINGS or BLOCKERS, treat them as BLOCKERS (conservative) and attempt revision. Safe default: re-read the plan, compare current state to acceptance criteria, proceed only when favorable.

### When the User Contradicts Skill Guidance

If the user says the phase is done but verification shows issues, present the specific failing criteria and ask which to accept as-is versus rework. If the user wants to skip the max-iteration cap, allow it but document why and warn that stall detection is still active. User override is allowed, but the user must be making an informed decision.

### When an Edge Case Is Encountered

If a phase has zero plans listed, suggest running the planning workflow first. If the checker/validator script exits with an unexpected error code (not 0 or 1), treat as BLOCKER and investigate. If issue count oscillates (decreasing then increasing), this indicates regressions — stop, compare outputs, re-dispatch with a more focused fix scope.

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-loop-completion` | Guardrail against false completion inside loop iterations. Verify each iteration's output before continuing or exiting. |
| `hm-coord-loop` | Coordinates multiple agents in a workflow. `hm-loop-phase` is a single repeatable process within a task. |
| `wave-execution` | For parallel task groups with dependency ordering. Iterative loops are sequential. |
| `hivemind-trajectory` | Runtime tool for audit. This skill uses it to log loop history. |
| `delegation-status` | Runtime tool for orchestrator polling. This skill uses it to confirm subagent returns. |
