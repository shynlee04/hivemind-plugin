---
name: meta-builder
description: Use when creating, editing, auditing, or combining agent skills, commands, tools, or platform configurations. Routes user intent to specialist skills. Triggers on "create a skill", "build an agent", "configure OpenCode", "stack skills", "audit skill", "fix skill trigger".
metadata:
  layer: "0"
  role: "router"
  version: "3.0.0"
---

# meta-builder

Routes meta-concept requests to the right specialist skill. This skill routes — it does not execute domain work. If you catch yourself editing skill files directly, STOP and delegate to `use-authoring-skills`.

## On Load

1. **Load background skill** relevant to the routing decision (e.g. `opencode-platform-reference` for agent/command/tool questions).
2. **Read planning files if they exist:** `task_plan.md`, `findings.md`, `progress.md`.
3. If the task involves multi-node traversal, optionally run `scripts/graph-init.sh` and `scripts/validate-graph.sh` as fact-probes.

## Graph Structure

The meta-builder routes through a node-based graph defined in `.meta-builder/graph.json`. Nodes represent skills/agents; edges define execution relationships. For full graph structure, load `references/01-mindsnetwork-graph.md`.

**Edge types:**
- `PARENT_OF` — Hierarchical relationship (parent delegates to child)
- `DEPENDS_ON` — Sequential dependency (node B waits for node A)
- `SEQUENCES_WITH` — Ordered execution (A then B)
- `PARALLEL_TO` — Independent execution (A and B simultaneously)

For execution protocol details, load `references/02-deterministic-control.md` when traversing multi-node paths.

## Routing Table

| User Says | Route To |
|-----------|----------|
| "create a skill" | `use-authoring-skills` |
| "create a skill like this @file" | `use-authoring-skills` + `skill-creator` |
| "audit this skill" | `use-authoring-skills` |
| "create an agent" | `opencode-platform-reference` |
| "set up a command" | `opencode-platform-reference` |
| "build a custom tool" | `opencode-tool-architect` |
| "configure OpenCode" | `opencode-platform-reference` |
| "stack skills" / "combine skills" | This skill + target skills |

**Not for me:** If the request doesn't match any row above, do NOT activate this skill. Route to the appropriate specialist directly.

## Skills Chaining

Max 3 skills per stack. Load order matters. For skill stacking recipes and loading order, load `references/04-skills-chaining.md`.

## Long-Horizon Sessions

For cross-session state management and recovery, load `references/03-long-horizon-persistence.md`. On session restart, read `task_plan.md` and `progress.md` first.

## Question Discipline

- **Max 3 questions per session.**
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- After 3 questions, make a best-effort routing decision and proceed. Document the assumption in `progress.md`.
- Never ask questions when the routing table already determines a clear path.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Blind Router** — routing without context | Routed before reading intent | Read planning files and relevant skill first. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/01-mindsnetwork-graph.md` | Graph structure, node types, edge semantics |
| `references/02-deterministic-control.md` | Execution protocol, rollback rules, retry logic |
| `references/03-long-horizon-persistence.md` | Session recovery, cross-session state, checkpoints |
| `references/04-skills-chaining.md` | Multi-skill stacks, loading order, composition |
| `references/05-hivefiver-agent.md` | Hivefiver orchestrator agent definition |
