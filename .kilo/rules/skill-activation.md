# Skill Activation Sequence

Skills activate in this order. Each skill blocks until its prerequisites are met.

| Order | Skill | Triggers When | Blocks If |
|-------|-------|--------------|-----------|
| 1 | `brainstorming` | BEFORE writing code | Design not approved |
| 2 | `using-git-worktrees` | AFTER design approval | Working on main branch |
| 3 | `writing-plans` | WITH approved design | No plan written |
| 4 | `subagent-driven-development` or `executing-plans` | WITH plan | Coordinator executing directly |
| 5 | `test-driven-development` | DURING implementation | Code written before test |
| 6 | `requesting-code-review` | BETWEEN tasks | Critical issues unresolved |
| 7 | `finishing-a-development-branch` | WHEN tasks complete | Tests not passing |

## Background Skills (load before any core skill)

| Skill | Purpose |
|-------|---------|
| `opencode-platform-reference` | SDK, agents, commands, tools, configs, permissions |
| `repomix-exploration-guide` | Codebase exploration patterns |
| `opencode-non-interactive-shell` | Shell execution strategy |

## Core Skill Hierarchy

```
LAYER 0: meta-builder (routes intent)
    ↓
LAYER 1: user-intent-interactive-loop (confirms intent)
    ↓
LAYER 2: planning-with-files (creates task_plan.md)
    ↓
LAYER 3: coordinating-loop (dispatches subagents)
    ↓
LAYER 4: use-authoring-skills (domain execution)
```

Each layer verifies its prerequisites before executing. Missing prerequisites = block.
