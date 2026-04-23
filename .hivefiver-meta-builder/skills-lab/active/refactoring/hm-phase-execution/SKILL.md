---
name: hm-phase-execution
description: >
  Execute GSD-style phase plans with wave-based parallelization and checkpoint recovery.
  Use when running a multi-plan phase, managing plan dependencies, recovering from mid-phase interruptions,
  when plans need to run in parallel, when execution needs checkpoint gates, or when phase work
  spans multiple sessions. Even when the user says "run the phase" or "execute the plan."
  Triggers: "execute phase", "run phase", "phase execution", "wave-based execution",
  "parallel plans", "checkpoint recovery", "plan dependencies".
  NOT for single-task execution or unstructured work.
metadata:
  layer: "1"
  role: "orchestrator"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

<!-- ONBOARDING-HEADING-HERE -->

## The Iron Law

```
A phase is not a todo list. A phase is a directed acyclic graph of plans grouped into waves.
```

# Phase Execution
## On Load

1. Read `references/wave-protocol.md` — how to group plans into waves
2. Read `references/checkpoint-recovery.md` — mid-phase interruption recovery

## Phase Execution Protocol

### Step 1: Load Plan Index

```bash
# Read phase plan index
ls .planning/phases/${PHASE}/
# Identify all PLAN.md files and their wave numbers
```

### Step 2: Validate Dependencies

```bash
# Check for circular dependencies
# Verify all depends_on references exist
# Confirm wave numbers are monotonic
```

**Gate:** If validation fails, STOP. Fix plans before executing.

### Step 3: Execute Wave by Wave

```
Wave 1: Plans with no dependencies → parallel dispatch
  → Wait for all to complete
  → Validate results
Wave 2: Plans depending on Wave 1 → parallel dispatch
  → Wait for all to complete
  → Validate results
...
Wave N: Final plans → parallel dispatch
  → Wait for all to complete
  → Final validation
```

### Step 4: Handle Failures

| Scenario | Action |
|----------|--------|
| Plan in wave fails | Abort subsequent waves; log failure; return DONE_WITH_CONCERNS |
| Plan returns BLOCKED | Escalate to orchestrator; do not proceed |
| Plan returns NEEDS_CONTEXT | Provide context; re-dispatch same plan |
| All plans succeed | Proceed to verification |

### Step 5: Verify and Commit

```bash
# Run phase verification script if available
bash .planning/phases/${PHASE}/verify.sh 2>/dev/null

# Commit all changes with phase-scoped message
git add <phase-files>
git commit -m "phase: ${PHASE} — <summary>"
```

## Checkpoint Recovery

If interrupted mid-phase:

```bash
# Read phase state
.cat .planning/phases/${PHASE}/STATE.md 2>/dev/null

# Identify incomplete plans
# Re-execute only incomplete plans
# Do NOT re-execute completed plans
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Todo Lister** | Treats phase as sequential todo list | Group into waves, parallelize where possible |
| **The Silent Skip** | Failed plan doesn't halt subsequent waves | Enforce strict wave validation |
| **The Re-Executer** | Re-runs already completed plans after interruption | Read phase state, skip completed plans |
| **The Uncommitted Wave** | Executes multiple waves without committing | Commit after each wave |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/wave-protocol.md` | Grouping plans into waves |
| `references/checkpoint-recovery.md` | Recovering from mid-phase interruption |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | Owns general multi-agent dispatch. This skill applies wave-based dispatch to phases. |
| `hm-planning-with-files` | Owns task_plan.md tracking. This skill reads and updates phase plans. |
| `hm-phase-loop` | Owns iterative loop semantics. This skill handles loop-back within phase execution. |
| `hm-subagent-delegation-patterns` | Owns delegation mechanics. This skill uses those mechanics for plan dispatch. |
