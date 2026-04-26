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

## Overview

Execute phase plans with wave-based parallelization and checkpoint recovery. Use when running multi-plan phases, managing plan dependencies, recovering from mid-phase interruptions, or coordinating parallel plan execution across sessions. Produces completed phase plans with per-task verification and atomic commits.

## The Iron Law

```
A phase is not a todo list. A phase is a directed acyclic graph of plans grouped into waves.
```

# Phase Execution
## On Load

1. Read `references/wave-protocol.md` — how to group plans into waves
2. Read `references/checkpoint-recovery.md` — mid-phase interruption recovery

## Phase Execution Protocol

## File-Backed Execution State Machine

Adapted from Nanostack conductor's claim/dependency/artifact/stale-lock pattern, but mapped to HiveMind/OpenCode project conventions. Use durable state files so a later agent can recover without trusting chat history.

| State artifact | Purpose | Notes |
|----------------|---------|-------|
| `.opencode/state/opencode-harness/phase-execution/<phase>/claims/<plan>.json` | Records active executor, started time, wave, dependencies | Atomic creation preferred; never overwrite another active claim without stale evidence |
| `.opencode/state/opencode-harness/phase-execution/<phase>/artifacts/<plan>.md` | Handoff summary, files changed, validations, blockers | Written before checkpoint or completion |
| `.opencode/state/opencode-harness/phase-execution/<phase>/done/<plan>.json` | Completion marker with verification evidence | Created only after plan verification passes |
| `.opencode/state/opencode-harness/phase-execution/<phase>/failures/<plan>.json` | Failure/blocker evidence | Blocks downstream waves until resolved |

Do not import `.nanostack/` paths. If the end-user project has a different state root, use it and document the adapter path in the artifact.

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

### Step 2.5: Claim Runnable Plans

Before dispatching a plan in a wave, create a claim record with executor identity, command/session id if available, dependency list, and stale-after timestamp. If claim creation fails because another live executor owns it, skip that plan and report the owner. If a claim is stale, record the stale evidence before taking over.

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

Every failure writes `failures/<plan>.json` with the failed command, output path, affected dependencies, and next recovery action. Never let a downstream wave consume a failed or missing upstream artifact.

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

Recovery order:

1. Trust `done/*.json` markers with verification evidence.
2. Inspect `failures/*.json` and return blockers before executing downstream waves.
3. Inspect active claims; only resume/take over if the stale-after time has passed or the coordinator explicitly authorizes recovery.
4. Reconstruct missing artifacts from commits/files only when state markers are absent, and label reconstruction as degraded evidence.

## RICH Gate Source Decisions

| Source | Decision | Local adaptation |
|--------|----------|------------------|
| `garagon/nanostack` conductor | ADAPT | File-backed claims, dependency checks, artifacts, and stale-lock recovery mapped to `.opencode/state/opencode-harness/`. |
| `github/awesome-copilot` create-implementation-plan | ADAPT | Deterministic plan identifiers and measurable validation criteria are reinforced in wave artifacts. |
| GitHub agent skill resource model | ADAPT | State template and evals are bundled resources; SKILL.md remains the execution index. |

## Independence Notes

This skill does not require GSD. For non-GSD projects, treat any directory of plan files as the phase graph and store execution state under `.opencode/state/opencode-harness/phase-execution/` unless the project provides a safer local state root.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Todo Lister** | Treats phase as sequential todo list | Group into waves, parallelize where possible |
| **The Silent Skip** | Failed plan doesn't halt subsequent waves | Enforce strict wave validation |
| **The Re-Executer** | Re-runs already completed plans after interruption | Read phase state, skip completed plans |
| **The Uncommitted Wave** | Executes multiple waves without committing | Commit after each wave |

## Self-Correction

### When the Task Keeps Failing

If a wave plan fails, do not continue to the next wave — abort subsequent waves and investigate the failure first. Check whether the failure is a dependency issue (the plan references files or state from a previous wave that didn't complete correctly) versus a plan-content issue (the plan references non-existent files or has invalid commands). Validate file references against disk before re-dispatching. If the same plan fails twice with the same error, report the failure to the orchestrator with the full error output, the plan's `depends_on` chain, and your diagnosis — do not retry a third time without human input.

### When Unsure About the Next Step

Check the PLAN.md frontmatter for `wave` and `depends_on` fields — these determine execution order, not intuition. If a plan's dependencies are not all marked complete in STATE.md, skip this plan and come back after its prerequisites finish. If the phase directory has no PLAN.md files at all, the phase may need planning before execution — suggest running the planning workflow rather than attempting to execute an empty phase.

### When the User Contradicts Skill Guidance

If the user wants to run plans out of wave order (e.g., execute Wave 2 before Wave 1 completes), warn about specific dependency risks — list which plans depend on which outputs — but allow it if the user explicitly confirms. Document the out-of-order execution in STATE.md with the user's rationale. If the user wants to re-run a completed plan, allow it but note that this may create merge conflicts with subsequent plans that already consumed the original output.

### When an Edge Case Is Encountered

If two plans in the same wave touch the same file, they cannot run in parallel — serialize them and note the file conflict in the wave execution log. If a plan's `verify.sh` script is missing, skip the script-based verification but flag it as a gap in the phase summary. If checkpoint recovery finds a plan that was partially executed (some files committed, others not), treat it as incomplete and re-execute the entire plan rather than attempting to resume mid-task.

## Reference Map

| File | When to Read |
|------|-------------|
| `references/wave-protocol.md` | Grouping plans into waves |
| `references/checkpoint-recovery.md` | Recovering from mid-phase interruption |
| `references/execution-state-template.md` | Claim/artifact/done/failure state schema |
| `evals/evals.json` | Trigger and pressure scenarios for wave recovery |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | Owns general multi-agent dispatch. This skill applies wave-based dispatch to phases. |
| `hm-planning-with-files` | Owns task_plan.md tracking. This skill reads and updates phase plans. |
| `hm-phase-loop` | Owns iterative loop semantics. This skill handles loop-back within phase execution. |
| `hm-subagent-delegation-patterns` | Owns delegation mechanics. This skill uses those mechanics for plan dispatch. |
