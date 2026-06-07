---
name: hm-coord-loop
description: Coordinate multi-agent dispatch with validation gates, handoff protocols, and bounded iteration. Use when 3+ tasks need parallel/wave/pipeline dispatch, when setting checkpoint gates in agent loops, when enforcing max-iteration limits, or when recovering orphan subagents. Tech-agnostic and framework-agnostic. NOT for single-agent execution, simple file edits, or quality-gate evaluation.
metadata:
  consumed-by:
    - "hm-orchestrator"
    - "hm-coordinator"
    - "hf-coordinator"
  lineage-scope: "hm-*"
  access: "STRICT"
  role: "coordinator"
  realm: "arch,clean-code"
  min-tasks: 2
allowed-tools: skill
---

## Overview

Coordinate multi-agent dispatch with validation gates, handoff protocols, and bounded iteration. Produces validated multi-agent workflows with error recovery, progress tracking, and explicit escape hatches. This skill is **tech-agnostic** — it works with any agent runtime, any tool stack, and any project domain. The skill's value is the structural pattern (decision matrix + dispatch protocols + verification), not the platform binding.

## GSD Compatibility

This skill is the canonical Hivemind replacement. If you're still on GSD:

| GSD skill | Hivemind equivalent | Behavior diff |
|-----------|--------------------|--------------|
| `gsd-execute-phase` | `hm-coord-loop` | GSD uses sequential plan execution with hardcoded checkboxes; Hivemind uses decision-matrix dispatch (parallel / wave / pipeline) with validation gates between waves. Hivemind exposes `delegate-task` and `hivemind-trajectory` custom tools for explicit agent lifecycle control. |

You can use either; the Hivemind path is canonical, the GSD path is supported via the equivalence map.

## When This Skill Loads — Do This First

1. **Count the tasks.** If only one task, do NOT load this skill. Execute directly.
2. **Classify the work.** Use the [Decision Matrix](#decision-matrix-task-complexity--coordination-pattern) below to pick a pattern BEFORE dispatching any agents.
3. **Bound the iterations.** Declare a max-iteration budget before the first dispatch (default: 5; never exceed 5 without explicit re-authorization).
4. **Define a completion criterion.** Write the literal condition: "Loop exits when: `_____`." If you cannot fill the blank, the loop is unbounded — refuse to dispatch.

## Decision Matrix: Task Complexity → Coordination Pattern

Before dispatching ANY agents, classify the work. The pattern you pick determines whether the workflow completes or silently fails.

| Situation | Pattern | Key Trait |
|-----------|---------|-----------|
| 3+ tasks, no dependencies between them | **Parallel dispatch** | All agents run concurrently; results merged at end |
| Tasks form layers (layer 2 needs layer 1 results) | **Wave-based** | Dispatch wave → gate → next wave → gate → … |
| Tasks form a strict dependency chain (B needs A, C needs B) | **Pipeline** | Sequential dispatch with handoff between stages |
| 1–2 simple tasks, no specialist needed | **Do inline** | No subagent overhead; execute directly |
| 2 tasks, different domains, no shared files | **Parallel (2 max)** | Dispatch 2 specialists concurrently |
| Unknown complexity or unclear dependencies | **Assess first** | Map the task graph before choosing a pattern |

### Decision Flowchart

```
How many tasks?
  ├─ 1 → Do inline (no coordination needed)
  ├─ 2 → Different domains, no shared state? → Parallel (2 max)
  │       Same domain or shared state? → Do inline or pipeline
  └─ 3+ →
         │
         All independent (no shared files, no ordering)?
         ├─ Yes → Parallel dispatch
         └─ No  →
                  Have clear dependency layers?
                  ├─ Yes → Wave-based dispatch
                  ├─ No, chain → Pipeline
                  └─ Can't tell → Assess first (map dependencies, then dispatch)
```

## Pattern 1: Parallel Dispatch

Use when tasks share **no files, no state, and no ordering constraints.**

### Protocol

1. **Inventory tasks.** Write each as a discrete work item: "TASK-1: audit module A", "TASK-2: fix tests in module B"
2. **Cap at 5 parallel agents.** Beyond 5, coordination overhead dominates. If you have 8 tasks, batch them into waves of 4+4.
3. **Dispatch all in one turn.** Launch all agents concurrently — do NOT dispatch one, wait, then dispatch the next.
4. **Track all delegation IDs.** Store returned IDs in a list. Poll for completion.
5. **Merge results.** After all complete, synthesize findings into a single report. If any agent failed, decide: retry individual, escalate, or skip with a gap note.
6. **Verify completeness.** Check that every task item has a corresponding result.

### When NOT to use parallel

- Tasks modify the same file → pipeline or inline instead (merge conflict guarantee)
- Tasks form a dependency chain → wave or pipeline
- One task's output is another task's input → pipeline
- You cannot track more than 5 agents concurrently → reduce batch size

## Pattern 2: Wave-Based Dispatch

Use when tasks form **dependency layers** — wave N+1 cannot start until wave N completes.

### Protocol

1. **Map the dependency graph.** Identify layers: Wave 1 = no-dependency tasks, Wave 2 = depends on Wave 1, etc.
2. **Set a gate between waves.** Before launching wave N+1, verify: (a) all Wave N agents completed, (b) all required outputs exist, (c) no errors that cascade.
3. **Enforce max 3 waves.** Beyond 3 waves, coordination debt compounds. If you need more layers, reconsider whether this is truly multi-agent work or should be a pipeline.
4. **Checkpoint after each wave.** Document what was produced, what's pending, and what the next wave needs as input.
5. **Escalate on gate failure.** If a gate fails (agent error, missing output, stale state), STOP the wave sequence. Do NOT dispatch the next wave hoping it fixes itself.

### Wave Gate Checklist

```
- [ ] All agents in current wave completed (not timed out, not errored)
- [ ] Required output files exist and are non-empty
- [ ] No shared-file conflicts between completed agents
- [ ] Next wave's input dependencies are satisfied
- [ ] Human approval obtained if this is a human-gate checkpoint
```

## Pattern 3: Pipeline (Sequential Dispatch)

Use when tasks form a **strict linear chain** — each step consumes the previous step's output.

### Protocol

1. **Define the handoff contract.** Before dispatching agent 1, specify exactly what output agent 2 needs (file path, format, exact field names).
2. **Dispatch sequentially with verification.** Agent 1 completes → verify output → dispatch agent 2 with explicit input reference → verify → dispatch agent 3…
3. **Limit to 5 stages.** Pipelines longer than 5 stages become fragile. Split into sub-pipelines with checkpoints.
4. **Handle mid-pipeline failure.** If stage N fails, do NOT restart from stage 1. Resume from the last successful stage with corrected input.

## Handoff Protocol — Minimum Viable Envelope

Every delegated agent receives a **Task Envelope** with exactly 5 required sections:

| Section | Required Content |
|---------|-----------------|
| **Task** | One-sentence description of what to do |
| **Scope** | Include/exclude file lists — concrete paths |
| **Context** | Only what is needed — error messages, relevant snippets (max 50 lines), patterns to follow |
| **Expected Output** | Concrete deliverables with format and acceptance criteria |
| **Verification** | Exact command or check the agent must run and report |

Add a handoff metadata block:

```yaml
source_agent: "<coordinator>"
target_agent: "<child>"
handoff_reason: "<domain/file boundary>"
allowed_destinations: []
history_policy: "<what context is included/filtered>"
expected_return: "DONE|DONE_WITH_CONCERNS|NEEDS_CONTEXT|BLOCKED + artifacts + evidence"
resume_pointer: "<where to continue after interruption>"
```

## Checkpoint Protocol: Human-Gate Checkpoints in Agent Loops

Multi-agent workflows that run without human oversight tend to drift. Insert checkpoints at critical decision points.

### When to insert a human-gate checkpoint

- **Before a wave with irreversible side effects** (file deletion, schema migration, permission changes)
- **After every 3 agent completions** in a long-running workflow
- **When the agent reports an ambiguous result** ("partially fixed," "found issues but unclear if critical")
- **At the boundary between planning and execution**

### Checkpoint format

Present the user with:
1. **What was done** (list of completed tasks with evidence)
2. **What was found** (issues, risks, discoveries)
3. **What comes next** (next wave plan, which agents, expected duration)
4. **Decision required** (yes/no/change-direction — exactly one clear question)

Do NOT present a checkpoint that says "everything is fine, continuing" — that is not a checkpoint, it is a progress update.

## Max-Iteration Enforcement + Escalation

### The rule

**No agent loop may exceed 5 total iterations without explicit human re-authorization.**

A "loop" = any repeated dispatch pattern: retry-on-failure, wave re-execution, gate-recheck cycles.

### Enforcement

1. **Track iteration count per workflow.** Maintain a counter: `iteration: 1/5`, `iteration: 2/5`, etc.
2. **At iteration 3:** Emit a warning. "This workflow has looped 3 times. The remaining budget is 2 iterations."
3. **At iteration 5:** HARD STOP. Do NOT dispatch another agent. Instead:
   - Summarize what has been tried (iterations 1–5)
   - Identify what remains unresolved
   - Present an escalation: "I have tried 5 iterations of [pattern]. The unresolved issue is [X]. Options: (1) human takes over this specific item, (2) change the approach and re-authorize 3 more iterations, (3) accept the partial result."
4. **Never silently exceed the limit.** An agent that says "one more try" at iteration 6 is violating the contract.

### Escalation triggers (stop and ask human immediately)

| Trigger | Action |
|---------|--------|
| Same error across 3 different agents | Pattern, not a fluke — escalate |
| Agent dispatch fails twice with same tool error | Tool/permission issue — escalate |
| 2+ agents produce conflicting results on same file | Merge conflict — escalate |
| An agent times out without producing output | Don't retry blindly — escalate with timeout context |
| Dependency graph has a cycle | Structural issue — escalate |

## Ralph-Loop Integration — Validate → Fix → Re-dispatch

After each agent returns, run a validation cycle:

```
Agent returns
    │
    ▼
Validator checks:
  1. Output file exists at expected path
  2. Output matches expected format from envelope
  3. Verification command from envelope was run and passed
  4. No files modified outside scope boundaries
  5. Agent returned a summary (even on failure)
    │
    ├── All pass → Accept agent output, continue
    │
    └── Any fail → Read validation report
         │
         ├── Cycle < 3 → Fix issues, re-dispatch agent, loop
         │
         └── Cycle = 3 → Escalate to user with summary
```

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|-------------|-------------|-----|
| **Over-delegation** — dispatching an agent for a 5-line edit | Subagent overhead > task complexity. Context waste. | Do inline for any task under 20 lines of expected change. |
| **Orphan subagents** — dispatching then forgetting to collect results | Agent completes but output never synthesized. Work lost. | Always store delegation IDs. Poll completion. Never dispatch without a collection plan. |
| **Merge-conflict batching** — 2 agents editing the same file | Whichever writes last wins. First agent's work silently destroyed. | Assign disjoint file sets. If overlap is unavoidable, pipeline them. |
| **Infinite retry loops** — "failed, trying again" without change | Same input → same output → same failure. Burns context. | After 2 identical failures, change the approach or escalate. |
| **Silent wave drift** — launching wave 2 before wave 1 fully settles | Agents in wave 2 read stale state. Undefined behavior. | Always gate-check before launching next wave. |
| **Checkpoint theater** — presenting progress updates disguised as checkpoints | User trains to auto-approve. Real decisions get buried. | Only checkpoint when a decision is actually needed. |
| **Dependency graph denial** — assuming tasks are independent when they share a dependency | Subagent A changes function X. Subagent B also changes function X. Merge hell. | Map dependencies BEFORE dispatch. If uncertain, pipeline. |
| **Context exhaustion** — dispatching 5 agents, each with 200-line prompts | Total context consumed exceeds budget. Later agents get degraded reasoning. | Compress prompts. Use reference files instead of inline content. |
| **The Coordinator Executor** — Parent does agent's work | Parent modified files assigned to agent. | Stop. Delegate. Only integrate. |
| **The Infinite Retry** — Retry without changing approach | Retry count > 1 per task | Escalate to user. |

## Verification Protocol

After every multi-agent workflow, run this verification before claiming completion:

```
- [ ] Every dispatched agent returned a result (no orphans)
- [ ] All task items in the inventory have a corresponding output
- [ ] No two agents modified the same file without coordination
- [ ] Checkpoint decisions are documented (what was approved/rejected)
- [ ] Iteration count stayed within budget (≤5 per loop)
- [ ] Escalation triggers were honored (none silently suppressed)
- [ ] Final output is coherent — the pieces fit together, not 5 disjoint fragments
```

## Self-Correction

### When the Task Keeps Failing

If an agent repeatedly returns failing results, first check whether the files referenced in its envelope actually exist on disk — plans sometimes reference paths that were never created. Next, verify the agent name in your dispatch matches a real agent file; typos in agent names cause silent dispatch failures on some platforms. If both check out, simplify the task decomposition: reduce the number of parallel agents, merge overlapping tasks, and re-dispatch with narrower scopes. If the same task fails 3 times with the same error, stop retrying and escalate to the user with the exact error output and your diagnosis.

### When Unsure About the Next Step

Default to sequential dispatch instead of parallel — sequential is safer and easier to debug. Log the decision point by writing to a progress file with what you know, what you're uncertain about, and which option you're proceeding with. If you cannot determine whether tasks share mutable state, treat them as shared and serialize. The safest default is always: one agent at a time, verify each result before dispatching the next.

### When the User Contradicts Skill Guidance

If the user requests a different dispatch strategy than what this skill recommends (e.g., wants parallel when the flowchart says sequential), use the user's choice but explicitly note in the progress file that this deviates from the recommended coordination pattern and may affect file conflict safety. If the user wants a different agent than recommended, dispatch their preferred agent but include a note about the potential mismatch in the task envelope. The user's explicit instruction always overrides skill guidance — document the deviation and proceed.

## Platform Adaptation

This skill is **framework-agnostic** — its core patterns (decision matrix, 3 dispatch modes, handoff envelope, max-iteration enforcement, anti-patterns) work with any agent runtime. Platform-specific bindings (which delegation tool, which command syntax, which session file format) belong in platform-specific reference skills, not here.

For Hivemind-specific bindings (custom tools `delegate-task`, `hivemind-trajectory`, `hivemind-sdk-supervisor`, and the `.hivemind/state/` state root), load the platform reference skill when needed.

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| Quality-gate evaluation skills | Quality-gate skills own the "did this pass" check. This skill owns "how do I dispatch the check." |
| Single-task delegation mechanics | Platform-specific tools own single delegation. This skill owns multi-agent orchestration on top. |
| Intent clarification skills | Intent skills run BEFORE coordination. This skill runs after intent is clear. |
| Task-level persistent memory skills | Persistence skills own durable state. This skill reads/writes that state as part of coordination. |
