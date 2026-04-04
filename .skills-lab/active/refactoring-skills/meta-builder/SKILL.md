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
3. For skill stacking (max 3 per stack), load `references/04-skills-chaining.md`.

## The Iron Law

```
NO STACK WITHOUT A REASON
```

Max 3 skills per stack. If you can't explain why each skill is needed, don't load it. Context window is shared — every unnecessary skill dilutes the ones that matter.

### What agents actually rationalize

| What agents say | What they actually did | Reality |
|-----------------|----------------------|---------|
| "I'll load all the skills to be thorough" | Loaded 6+ skills, context blown, ignored all of them | Max 3. Load order matters. |
| "The routing table says route to X, but I think Y is better" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| "I can handle this myself, no need to delegate" | Edited files directly, broke patterns | meta-builder routes. It doesn't execute. |
| "I'll just edit the skill file directly" | Created skill that doesn't trigger | Delegate to skill-authoring. Always. |

## Routing Table

| User Says | Route To |
|-----------|----------|
| "create a skill" | `use-authoring-skills` |
| "create a skill like this @file" | `use-authoring-skills` + `skill-creator` |
| "audit this skill" | `use-authoring-skills` |
| "create an agent" | `agents-and-subagents-dev` |
| "set up a command" | `command-dev` |
| "build a custom tool" | `custom-tools-dev` |
| "configure OpenCode" | `opencode-platform-reference` |
| "stack skills" / "combine skills" | This skill + target skills (max 3) |

**Not for me:** If the request doesn't match any row above, do NOT activate this skill. Route to the appropriate specialist directly.

## Stacking Recipes

Max 3 skills per stack. If you can't explain why each skill is needed, don't load it.

| User Intent | Stack | Why |
|-------------|-------|-----|
| "Create a skill + command for it" | skill-authoring + command-dev | Skill creation + command wrapper |
| "Build an agent + custom tool" | agents-and-subagents-dev + custom-tools-dev | Agent def + tool implementation |
| "Audit this skill" | use-authoring-skills | Domain skill for skill quality |
| "Deep research on X" | opencode-platform-reference + coordinating-loop | SDK patterns + subagent dispatch |

For loading order details, load `references/04-skills-chaining.md`.

## Question Discipline

- **Max 3 questions per session.**
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- After 3 questions, make a best-effort routing decision and proceed. Document the assumption in `progress.md`.
- Never ask questions when the routing table already determines a clear path.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Hoarder** — loading 4+ skills "to be safe" | Context blown, skills ignored | Max 3. If you can't explain why each is needed, don't load it. |
| **The Improviser** — "routing table says X but I'll do Y" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/04-skills-chaining.md` | Multi-skill stacks, loading order, composition |
| `references/05-hivefiver-agent.md` | Hivefiver orchestrator agent definition |

**Removed:** 01-mindsnetwork-graph.md, 02-deterministic-control.md, 03-long-horizon-persistence.md — these referenced the deleted graph structure and have been deleted.
