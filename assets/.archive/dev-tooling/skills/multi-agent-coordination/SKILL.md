---
name: multi-agent-coordination
description: Coordinate multiple AI agents through structured dispatch patterns. Use when dispatching subagents, running parallel agent tasks, organizing wave-based execution, designing multi-agent workflows, batching related agent delegations, avoiding over-delegation, setting checkpoint gates in agent loops, enforcing max-iteration limits, recovering orphan subagents, or choosing between parallel vs pipeline vs wave dispatch. NOT for single-agent delegation mechanics or quality-gate evaluation — those are separate skill domains.
---

# Multi-Agent Coordination

## Overview

This skill teaches **when and how to coordinate multiple agents** — not the mechanics of any single delegation tool, but the structural patterns that determine whether a multi-agent workflow succeeds or collapses under its own complexity.

The core insight: **coordination failure is the silent killer of multi-agent workflows.** Agents complete their individual tasks, but the whole fails because no one owned the handoffs, the ordering, the completeness check, or the escalation path.

## When to Use This Skill

Load this skill when:
- You have 3+ independent or semi-dependent tasks to dispatch
- The user asks you to "run these in parallel," "batch process," or "dispatch to agents"
- You need to decide between running tasks inline vs delegating vs batching
- You are designing a multi-step workflow carried out by different specialist agents
- You find yourself dispatching agents without a clear completion or error-handling plan
- A previous multi-agent workflow failed due to orphans, missed handoffs, or infinite loops

Do NOT load this skill for:
- A single-task delegation (use your delegation tool directly)
- Quality gate evaluation (belongs to quality-gate skills)
- Tool/command mechanics (belongs to platform-specific reference skills)

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

1. **Inventory tasks.** Write each as a discrete work item: "TASK-1: audit src/auth/*.ts", "TASK-2: fix tests/auth/*.test.ts"
2. **Cap at 5 parallel agents.** Beyond 5, coordination overhead dominates. If you have 8 tasks, batch them into waves of 4+4.
3. **Dispatch all in one turn.** Launch all agents concurrently — do NOT dispatch one, wait, then dispatch the next.
4. **Track all delegation IDs.** Store returned IDs in a list. Poll `delegation-status` for completion.
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

## Reference Material

- **[references/terminology-map.md](references/terminology-map.md)** — Load when you need to understand how coordination concepts differ across GSD (wave-based phase execution), OMO (agent pool architecture), and Hivemind (WaiterModel + session tree). Explains why the same word means different things in different frameworks.
- **[references/philosophy.md](references/philosophy.md)** — Load when designing a new coordination pattern or when an existing pattern fails. Explains why WaiterModel beats blocking, why checkpoint gates prevent drift, and why max-iteration enforcement is non-negotiable.

**Loading guidance:**
- Start with SKILL.md (this file). The decision matrix and patterns are sufficient for 80% of coordination tasks.
- Load `terminology-map.md` only when comparing frameworks or cross-referencing patterns from GSD/OMO.
- Load `philosophy.md` only when debating architectural choices or troubleshooting a coordination failure.
