---
name: wave-execution
description: >
  Use when executing parallel task groups with dependency ordering, decomposing work
  into execution waves, detecting file conflicts between parallel tasks, setting
  max-iteration limits on execution phases, or checkpointing multi-wave progress
  for recovery. Triggers: "wave execution", "parallel execution", "execute in waves",
  "wave-based dispatch", "dependency ordering", "wave dependency analysis",
  "checkpoint recovery", "max iteration guard", "file conflict detection",
  "parallel task ordering", "group tasks into waves", "conflict detection in parallel tasks",
  "premature completion", "over-parallelization".
  NOT for single-task dispatch, unstructured sequential execution, coordination patterns
  (hm-coord-loop), or loop control (iterative-loop).
---

# Wave Execution

## Overview

Execute parallel task groups in dependency-ordered waves. Each wave contains tasks
that can run concurrently without conflicts. Waves execute sequentially — all tasks
in the current wave must complete before the next wave begins.

The wave model prevents over-parallelization, detects file conflicts before dispatch,
and enforces max-iteration limits with checkpointable recovery points between waves.

## The Wave Model

```
Wave 1: Tasks with zero dependencies → dispatch all in parallel
  → Wait for ALL to complete
  → Validate results (no partial-wave progression)
Wave 2: Tasks depending ONLY on Wave 1 outputs → dispatch all in parallel
  → Wait for ALL to complete
  → Validate results
...
Wave N: Final tasks → dispatch all in parallel
  → Final validation
```

Each wave is a synchronization barrier. No task in Wave N+1 dispatches before all
tasks in Wave N report completion.

## Wave Dependency Analysis

### Building the Dependency Graph

Before dispatching, construct a directed acyclic graph from task dependency declarations:

1. Extract each task's `depends_on` list from its plan or task definition.
2. Topologically sort to determine wave assignment.
3. Assign wave numbers: a task's wave = max(wave of each dependency) + 1.
   Tasks with no dependencies → Wave 1.

```text
Task A (no deps)        → Wave 1
Task B (no deps)        → Wave 1
Task C (depends: A, B)  → Wave 2
Task D (depends: B)     → Wave 2
Task E (depends: C, D)  → Wave 3
```

### Validating the Graph

Before execution, validate the dependency graph:

- **Circular dependency check:** If topological sort fails, STOP. Report the cycle.
  Do not attempt heuristic resolution.
- **Orphan check:** If a task depends on a non-existent task, STOP. Flag the missing
  reference before any work begins.
- **Monotonic wave check:** Confirm wave numbers ascend without gaps or reversals.
  All Wave N tasks must only depend on tasks in waves < N.

Gate: If validation fails, fix the dependency declarations before executing any task.

## Conflict Detection

### Files Modified Overlap

Before dispatching a wave, scan the declared `files_modified` for each task within
the wave. If two or more tasks declare overlapping file targets, they cannot run
in parallel.

**Detection protocol:**
1. Collect `files_modified` lists from all tasks in the pending wave.
2. Compute pairwise intersections.
3. For each overlap found, remove ALL conflicting tasks from the current wave and
   serialize them: assign them to sequential sub-waves within the current wave index
   (e.g., Wave 2a, Wave 2b, Wave 2c).
4. Report each serialization decision with the conflicting file path and affected
   tasks.

**Example:**

```text
Wave 2 tasks:
  Task C: files_modified = [src/auth/login.ts, src/auth/types.ts]
  Task D: files_modified = [src/db/migrations.ts]
  Task E: files_modified = [src/auth/login.ts, src/ui/login.tsx]

Conflict detected: src/auth/login.ts (Task C ∩ Task E)
Resolution:
  Wave 2a: Task C, Task D  (parallel — no overlap)
  Wave 2b: Task E          (serialized after Task C)
```

**Overlap that is safe to ignore:** Tasks that only READ overlapping files but
write to disjoint paths may run in parallel. A file appearing in one task's
`files_modified` and another task's `files_read` is safe — only write-write
overlaps require serialization.

**When declarations are absent:** If tasks lack explicit `files_modified` declarations,
assume worst case — any two tasks in the same wave may conflict. In this scenario,
serialize all tasks unless the task source provides explicit file-level scoping.

## Dispatch Rules: Sequential vs Parallel

### Parallel Dispatch (Within a Wave)

Tasks in the same wave dispatch in parallel when:
- No `files_modified` overlap exists between them.
- Each task's dependencies are confirmed complete.
- The wave's dependency gate has passed.

Dispatch all tasks simultaneously — do not stagger within a wave. Use the `task` tool
(preferred, full control) for code/artifact tasks, or `delegate-task` (async background
only) for research/audit/review tasks within the wave.

### Sequential Dispatch (Between Waves)

Waves execute in strict sequential order:
- Wave N+1 does not begin until all tasks in Wave N report completion.
- Completion is determined by: the task's return status, a completion marker file,
  or the delegation mechanism's completion signal.
- If any task in Wave N fails, do not proceed to Wave N+1. Abort the wave sequence
  and report the failure with the failed task's output and the list of downstream
  tasks that are now blocked.

### Serialized Dispatch (Conflict Resolution)

When file conflicts force serialization within a wave:
- Split the wave into sequential sub-waves.
- Each sub-wave completes before the next begins.
- Mark serialized sub-waves in the execution log with the conflict file path.

## Max-Iteration Guard

Prevent infinite execution loops with a hard iteration limit.

**Protocol:**
1. Define `MAX_WAVE_ITERATIONS` before execution begins. Default: 3 full wave cycles.
   A wave cycle is one complete pass through all waves (Wave 1 → Wave N).
2. Increment the iteration counter after each full cycle completes.
3. If a task fails and the remediation re-dispatches it in the same wave position,
   count that as a re-attempt, not a new cycle.
4. When the iteration counter exceeds `MAX_WAVE_ITERATIONS`:
   - Halt all execution.
   - Write a `MAX_ITERATIONS_REACHED` marker with the current wave state, failed
     tasks, and remaining work.
   - Report to the orchestrator or user. Do not retry.

**Adjusting the limit:** Increase `MAX_WAVE_ITERATIONS` only when a task's failure
is diagnosed as environment-dependent (network timeout, external service unavailability)
and the underlying issue is confirmed resolved. Never increase the limit to
accommodate persistent task failures without root cause analysis.

## Checkpoint Protocol

Write durable state between waves so execution can resume after interruption.

### State Files

Store checkpoint state under a project-local state root. Never use chat history
as the source of truth for what completed.

| State artifact | Purpose | Write timing |
|----------------|---------|-------------|
| `wave-execution/<execution-id>/waves/<N>/done.json` | Lists completed tasks in wave N with verification evidence | After wave N completes |
| `wave-execution/<execution-id>/waves/<N>/failures.json` | Lists failed tasks with error output | After any task in wave N fails |
| `wave-execution/<execution-id>/state.json` | Overall state: current wave, iteration count, max iterations | Written after each wave and at checkpoint |
| `wave-execution/<execution-id>/graph.json` | The validated dependency graph with wave assignments | Written once after validation |

### Checkpoint Flow

```
Before each wave:
  Read state.json → confirm current wave and iteration count.
  Read graph.json → confirm dependency assignments.

After each wave:
  If all tasks succeeded:
    Write done.json with per-task verification evidence.
    Write state.json with incremented wave and current iteration.
    Proceed to next wave.
  If any task failed:
    Write failures.json.
    Write state.json marking current wave as FAILED.
    Abort — do not proceed.

On recovery (interrupted mid-wave or between waves):
  Read state.json → determine which wave was in progress.
  Read done.json for completed waves → do NOT re-execute these.
  Read failures.json for failed waves → diagnose, fix, restart from failed wave.
  If a wave was in-flight (no done.json, no failures.json) → treat all tasks
    in that wave as incomplete. Re-execute the entire wave from scratch.
```

### Checkpoint Recovery

1. Trust `done.json` markers with verification evidence. Skip completed waves.
2. Inspect `failures.json` to understand which tasks blocked and why.
3. If no marker exists for a wave, assume nothing completed — re-execute fully.
4. Reconstruct state from disk, not from memory or chat context.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Over-Parallelization** | Dumping all tasks into one wave regardless of dependencies. Tasks fail because prerequisites are incomplete. | Construct dependency graph first. Only tasks with satisfied dependencies and no file conflicts belong in the same wave. |
| **Missing Dependencies** | Tasks reference outputs from tasks that have not been dispatched yet. Failures with "file not found" or "input not ready" mid-execution. | Validate the dependency graph before dispatch. Every task must declare its upstream dependencies. Reject tasks with unresolved references. |
| **Premature Completion** | Claiming "done" before all waves complete. Wave N+1 starts while Wave N tasks are still running. Incomplete verification. | Wait for every task in the wave to signal completion before advancing. Write done.json ONLY after all tasks in the wave return success with verification evidence. Never advance based on the first task to finish. |
| **Silent Serialization Failure** | Two tasks in the same wave modify the same file. The second task's write overwrites the first. No error, wrong output. | Run conflict detection before dispatching each wave. Check `files_modified` overlaps. When declarations are absent, serialize all tasks or require explicit declarations. |
| **The Uncommitted Wave** | Executing multiple waves without checkpointing. Interruption loses all progress. | Write checkpoint state after every wave. Commit state files so recovery can identify which waves completed. |
| **Limit Creep** | Repeatedly increasing `MAX_WAVE_ITERATIONS` to paper over persistent failures. | Fix the root cause or report the blocker. Increasing the limit without diagnosis hides systemic issues. |
| **Flat Dispatching** | Dispatching all tasks sequentially without grouping into waves. Missed parallelization opportunities. | Analyze the dependency graph. Any tasks with identical dependency sets and no file conflicts can run in parallel. |

## Quick Reference

### Execution Checklist

```
[ ] Validate dependency graph (no cycles, no orphans, monotonic waves)
[ ] Set MAX_WAVE_ITERATIONS (default: 3)
[ ] Write graph.json
[ ] For each wave, top to bottom:
    [ ] Run conflict detection on files_modified
    [ ] Serialize conflicting tasks into sub-waves
    [ ] Dispatch all wave tasks in parallel
    [ ] Wait for ALL to complete
    [ ] If any failed → write failures.json, abort
    [ ] If all succeeded → write done.json, write state.json
    [ ] Do NOT proceed to next wave until current wave is fully checkpointed
[ ] Return wave execution summary: completed waves, failed tasks, remaining work
```

### Failure Handling

| Scenario | Action |
|----------|--------|
| Task fails in wave | Write failure, abort remaining waves, report blocked downstream tasks |
| Interruption mid-wave | On recovery, re-execute entire wave (no partial-wave resume) |
| Interruption between waves | Read state.json, resume from next incomplete wave |
| MAX_WAVE_ITERATIONS exceeded | Halt, write marker, do not retry without diagnosis |
| File conflict detected | Serialize into sequential sub-waves, log conflict |
| Circular dependency detected | STOP — do not execute. Return the cycle for remediation. |

### State Files Reference

| Need | Read |
|------|------|
| Which wave am I on? | `state.json` → `currentWave` |
| How many iterations so far? | `state.json` → `iterationCount` |
| What tasks were in each wave? | `graph.json` → waves array |
| Did wave N complete? | `waves/<N>/done.json` exists |
| Why did wave N fail? | `waves/<N>/failures.json` |

## Cross-References

| Related Skill | Relationship | Boundary |
|---------------|-------------|----------|
| `hm-l2-phase-execution` | Wave execution refines phase execution's wave model with conflict detection and max-iteration guards | Wave execution is the ENGINE for how to build and run waves. Phase execution is the ORCHESTRATOR that applies waves to phases. |
| `hm-coord-loop` | Coordinates multi-agent dispatch — owns the delegation mechanics | Wave execution uses dispatch mechanics but does not teach coordination patterns. |
| `hm-l2-phase-loop` | Owns iterative loop semantics and entry/exit criteria | Wave execution's iteration guard is a safety mechanism, not a loop control pattern. |
| `hm-l2-completion-looping` | Owns completion detection and guardrail loops | Wave execution enforces wave-level completion but does not own loop-back semantics. |
