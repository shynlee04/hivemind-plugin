---
name: hm-subagent-delegation-patterns
description: Document and apply subagent delegation patterns for OpenCode. Use when dispatching subagents, resuming interrupted sessions, implementing checkpoint protocols, or designing wave-based execution. NOT for general task planning or project inspection.
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
  - Task
---

# Subagent Delegation Patterns

## The Iron Law

```
Delegation without session tracking is fire-and-forget. Always track, always resume, never recreate.
```

## On Load

1. Read `references/delegation-envelopes.md` — canonical dispatch envelope templates
2. Read `references/checkpoint-protocols.md` — checkpoint types, return formats, resume logic
3. Read `references/wave-execution.md` — wave-based parallel execution patterns

## Delegation Protocol

### The Real Execution Model

Subagent dispatch is NOT fire-and-forget. It is:

```bash
# 1. INIT — load context via CLI tool or state file
INIT=$(cat .planning/STATE.md 2>/dev/null)

# 2. PARSE — extract current phase, incomplete plans, session state
# Fields: current_phase, completed_plans, incomplete_plans, blockers

# 3. CONNECT — verify session exists and is resumable
# Check task_id from previous delegation; if absent, treat as new

# 4. LAUNCH — execute with explicit session tracking
# Each task gets atomic commit with hash tracking
git add <specific-files>  # NEVER git add .
git commit -m "phase: {phase}-{plan} — {description}"
TASK_COMMIT=$(git rev-parse --short HEAD)

# 5. FAIL/RESUME — checkpoint detection
grep -n "type=\"checkpoint\"" [plan-path]
# Pattern A: No checkpoints → execute all
# Pattern B: Has checkpoints → execute until checkpoint, STOP, return structured message
# Pattern C: Continuation → verify commits exist, resume from specified task
```

### Resume by Session ID (NEVER Recreate)

When a session disconnects:
1. **DO NOT create new tasks** — resume the existing delegated task
2. Use the session ID from the previous `task` call
3. The task tool supports `task_id` parameter for resuming
4. Check `.planning/phases/NN-name/SUMMARY.md` for completion status
5. Re-query plan index to get incomplete plans
6. Re-execute only incomplete plans

### Checkpoint Return Format

When a checkpoint is reached, the subagent returns:

```markdown
## CHECKPOINT REACHED
**Type:** [human-verify | decision | human-action]
**Plan:** {phase}-{plan}
**Progress:** {completed}/{total} tasks

### Completed Tasks
| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1    | [name] | [hash] | [key files] |

### Current Task
**Task {N}:** [name]
**Status:** [blocked | awaiting verification | awaiting decision]
**Blocked by:** [specific blocker]
```

### Deviation Rules (Auto-Fix Protocol)

| Rule | Action | When |
|------|--------|------|
| 1 | Auto-fix bugs | Broken behavior, errors, null pointers |
| 2 | Auto-add missing functionality | Error handling, auth, validation |
| 3 | Auto-fix blocking issues | Missing deps, broken imports |
| 4 | Stop and ask | Architectural changes (new DB tables, major schema) |

**Fix attempt limit:** 3 per task → STOP, document in SUMMARY.md

### Wave-Based Parallel Execution

```
Phase → Plans grouped by wave number
Wave 1: Plans with depends_on: [] (run parallel via Promise.allSettled)
Wave 2: Plans with depends_on: ["01"] (run after Wave 1 completes)
Wave N: Plans with depends_on: [previous waves]
```

## Context Continuity

### Session ID Tracking

Every delegation MUST capture and persist the session ID:

```bash
# After dispatch, record the task_id
TASK_ID="${DELEGATION_RESULT}"
echo "$TASK_ID" > .planning/phases/${PHASE}/.last-delegation-id
```

### State Persistence Across Sessions

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `.planning/STATE.md` | Project state, phase completion | After every phase |
| `.planning/phases/NN/.last-delegation-id` | Last delegated task ID | After every delegation |
| `.planning/phases/NN/SUMMARY.md` | Phase execution summary | After phase completes |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Fire-and-Forget** | Dispatches subagents without session tracking | Track session IDs, support resume |
| **The Re-Creator** | Creates new tasks instead of resuming existing ones | Use session ID to resume delegated tasks |
| **The Context Polluter** | Passes session history to subagents | Construct fresh context: task text + scene-setting + scope |
| **The Silent Fail** | Subagent returns without checkpoint or status | Enforce structured return format on every delegation |
| **The Infinite Retry** | Retries same failing approach >3 times | STOP at 3, document, escalate |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/delegation-envelopes.md` | Always — canonical dispatch envelopes |
| `references/checkpoint-protocols.md` | When implementing checkpoint/resume logic |
| `references/wave-execution.md` | When executing multi-plan phases with dependencies |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hivefiver-agents-and-subagents-dev` | Owns agent definitions and permission profiles. This skill owns the dispatch patterns and resume protocols. |
| `hm-coordinating-loop` | Owns general multi-agent dispatch and orchestration. This skill owns the subagent-specific execution mechanics. |
| `hm-planning-with-files` | Owns task_plan.md/findings.md/progress.md. This skill consumes those files for state-aware dispatch. |
