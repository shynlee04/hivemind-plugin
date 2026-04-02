---
name: coordinating-loop
description: Use when managing coordination between multiple agents or skills, dispatching parallel agents, deciding between sequential vs parallel execution, maintaining parent-child agent cycles, integrating ralph-loop patterns, or orchestrating multi-agent workflows. Triggers: "dispatch agents", "parallel agents", "coordinate agents", "agent handoff", "sequential vs parallel", "ralph loop", "agent lifecycle", "multi-agent workflow", "orchestrate", "loop until pass", "agent coordination".
---

# coordinating-loop

Central coordination hub for multi-agent workflows. Manages hand-offs, execution mode decisions, parent-child cycles, and ralph-loop integration. This is the glue that makes the meta-builder work as a system.

---

## Required Skill Loads

| Purpose | Skills |
|---------|--------|
| Parallel dispatch | `dispatching-parallel-agents` |
| User intent capture | `user-intent-interactive-loop` |
| Long-running planning | `planning-with-files` |
| Creating/improving | `skill-creator`, `skill-development`, `writing-skills` |
| Git-backed memory | `gcc` |

---

## When to Load

| Situation | Route |
|-----------|-------|
| Multiple independent tasks to run concurrently | → `references/02-sequential-vs-parallel.md` + `dispatching-parallel-agents` |
| Context must transfer between agents | → `references/01-handoff-protocols.md` |
| Parent agent monitors child agents | → `references/03-parent-child-cycles.md` |
| Loop until acceptance criteria pass | → `references/04-ralph-loop-integration.md` |
| Deciding execution mode for a batch of work | → Decision flowchart below |
| Recovery after agent failure | → `references/03-parent-child-cycles.md` (Error Recovery) |

---

## Core Coordination Loop

```
ASSESS → DECIDE MODE → DISPATCH → MONITOR → INTEGRATE → REPEAT
```

1. **Assess** — What work exists? Group by independence, dependencies, and failure domains.
2. **Decide Mode** — Sequential or parallel? Use the decision flowchart below.
3. **Dispatch** — Hand off context using protocols from `references/01-handoff-protocols.md`.
4. **Monitor** — Track child agent progress, detect failures, enforce budgets.
5. **Integrate** — Merge results, verify no conflicts, run validation gates.
6. **Repeat** — If gates fail, loop back with ralph-loop pattern.

---

## Decision Flowchart: Sequential vs Parallel

```
Multiple tasks? → No → Execute directly
  ↓ Yes
Tasks independent (no shared state, no file overlap)? → No → Sequential
  ↓ Yes
Tasks touch same files or resources? → Yes → Sequential
  ↓ No
Tasks have different root causes or domains? → No → Sequential (investigate together)
  ↓ Yes
3+ tasks? → Yes → Parallel dispatch
  ↓ No (1-2 tasks) → Sequential (overhead not worth it)
```

**Parallel when:** Independent domains, no shared files, 3+ tasks, different root causes.
**Sequential when:** Related failures, shared state, exploratory debugging, 1-2 tasks.

→ Full framework: `references/02-sequential-vs-parallel.md`

---

## Hand-off Protocol Summary

Every hand-off between agents must include:

| Element | Required | Example |
|---------|----------|---------|
| Task description | Yes | "Fix 3 failing tests in auth.test.ts" |
| Scope boundaries | Yes | "Do NOT modify production code" |
| Context to include | Yes | Error messages, file paths, relevant code |
| Context to exclude | Yes | "Ignore unrelated test failures" |
| Expected output | Yes | "Return summary of root cause and changes" |
| Verification step | Yes | "Run `npm test` before returning" |

→ Full protocol: `references/01-handoff-protocols.md`

---

## Loop Phases (Ralph-Loop Compatible)

| Phase | Gate | Pass Criteria | Script |
|-------|------|---------------|--------|
| G1: Assess | Context complete | All tasks identified and grouped | `scripts/coordination-check.sh` |
| G2: Dispatch | Agents launched | Each agent has focused prompt | — |
| G3: Monitor | Progress tracked | No hung agents, budgets respected | `scripts/loop-status.sh` |
| G4: Integrate | Results merged | No conflicts, validation passes | — |
| G5: Verify | Gates pass | All acceptance criteria met | `scripts/coordination-check.sh` |

**All gates must pass before proceeding.** Failure in any gate loops back to that phase.

→ Ralph-loop integration: `references/04-ralph-loop-integration.md`

---

## Parent-Child Cycle Summary

The parent agent:
- **Creates** child agents with isolated, self-contained prompts
- **Monitors** progress without inheriting child context
- **Handles failures** with retry (1 attempt) or escalate (to user)
- **Aggregates results** into a single integration report
- **Preserves its own context** for coordination work

**Never** let child agents inherit the parent's full session history. Construct exactly what each child needs.

→ Full lifecycle: `references/03-parent-child-cycles.md`

---

## Kit Bundle Contents

This skill ships as a ready-to-deploy kit:

| Component | Purpose |
|-----------|---------|
| `SKILL.md` | Entry point with decision flowcharts and quick reference |
| `references/01-handoff-protocols.md` | Context transfer patterns between agents |
| `references/02-sequential-vs-parallel.md` | Execution mode decision framework |
| `references/03-parent-child-cycles.md` | Nested agent lifecycle management |
| `references/04-ralph-loop-integration.md` | Scripting patterns, hooks, automation |
| `scripts/coordination-check.sh` | Validates coordination state and gate passage |
| `scripts/loop-status.sh` | Reports current loop phase and progress |

**Deploy:** Copy the entire `coordinating-loop/` directory into your project's `.agents/skills/` or equivalent skill directory.

---

## Anti-Patterns

1. **The Broadcast** — Sending full session history to every child agent. Construct focused prompts instead.
2. **The Fire-and-Forget** — Dispatching agents with no monitoring or integration plan.
3. **The False Parallel** — Dispatching parallel agents for related tasks that share state or files.
4. **The Orphan Loop** — Starting a ralph-loop with no exit condition or acceptance criteria.
5. **The Context Leak** — Child agents modifying files outside their scope.
6. **The Silent Failure** — Child agent fails but parent doesn't detect it. Always verify exit state.
7. **The Coordinator Executor** — Parent agent starts doing the child's work. Delegate, don't execute.
8. **The Infinite Retry** — Retrying failed agents without changing the approach. Max 1 retry, then escalate.

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `dispatching-parallel-agents` | This skill builds ON TOP of it. Use for parallel dispatch patterns. |
| `user-intent-interactive-loop` | Captures user intent before coordination begins. |
| `planning-with-files` | Maintains task_plan.md, findings.md, progress.md for long-running coordination. |
| `skill-creator` | Use when creating new skills as part of coordinated workflows. |
| `gcc` | Git-backed memory for coordination state across sessions. |

---

## Recovery Protocol

When coordination state is lost or session interrupted:

1. Run `scripts/loop-status.sh` — What phase were we in?
2. Run `scripts/coordination-check.sh` — What gates passed?
3. Read `progress.md` (if using `planning-with-files`) — What was decided?
4. Re-assess remaining work from current state, not from memory.
5. Resume from the last passed gate.
