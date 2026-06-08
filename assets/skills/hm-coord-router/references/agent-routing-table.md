# Agent Routing Table

Complete command → agent mapping. Each row is the canonical pair. The agent is
the execution target; the command is the user-facing surface that loads the
agent.

| Command (at `assets/commands/`) | Agent (at `assets/agents/`) | Specialization | Custom tools |
|---|---|---|---|
| `hm-spec-phase` | `hm-specifier` | Spec-driven authoring, EARS, acceptance criteria | `hivemind-agent-work` |
| `hm-execute-phase` | `hm-executor` | TDD cycles, atomic commits, file ops | `delegate-task`, `hivemind-trajectory` |
| `hm-debug-systematic` | `hm-debugger` | Reproduce → minimize → hypothesize → instrument | `hivemind-trajectory` |
| `hm-arch-refactor` | `hm-architect` | ADR + clean-code refactor | `hivemind-doc` |
| `hm-ship` | `hm-shipper` | Production readiness, rollback, deploy | `validate-restart` |
| `hm-research-deep` | `hm-l3-deep-research` | Citation tracking, multi-source synthesis | `hivemind-doc` |
| `hm-cross-change` | `hm-l2-cross-cutting-change` | Pan-impact analysis, ordering governance | `hivemind-trajectory` |
| `hm-product-validation` | `hm-l2-product-validation` | RICE scoring, user impact | `hivemind-agent-work` |
| `hm-intent-brainstorm` | `hm-l2-brainstorm` | Socratic ideation, intent loop | `hivemind-doc` |
| `hm-coord-loop` | `hm-orchestrator` | Wave/parallel/pipeline dispatch + handoff | `delegate-task`, `hivemind-trajectory` |

## Agent Discovery Rule

If the user prompt is ambiguous about which command to invoke, run:

```
semantic-agent-selector({ agentList: "all" })
```

This returns the best agent match by semantic similarity. Use the result to
pick the corresponding command from the table.

## Agent Validation

Before dispatching, verify the agent file exists:

```
test -f assets/agents/<agent>.md && echo "EXISTS" || echo "MISSING"
```

If MISSING, the agent must be created or renamed before routing can succeed.
Do NOT dispatch to a non-existent agent — `delegate-task` will return an
error and the delegation will sit in `delegation-status` forever.
