# Command Routing Table

Complete intent → command mapping. The command is the user-facing surface
the user invokes; the agent is what the command dispatches to (see
`agent-routing-table.md`).

| # | Intent | Command (at `assets/commands/`) | Use when |
|---|---|---|---|
| 1 | spec | `hm-spec-phase` | User wants to lock a feature's spec with EARS-style requirements + acceptance matrix |
| 2 | test | `hm-execute-phase` (TDD variant) | User wants RED-GREEN-REFACTOR cycles on a test |
| 3 | debug | `hm-debug-systematic` | User reports a bug, regression, or unexpected behavior |
| 4 | refactor | `hm-arch-refactor` | User wants to restructure code without changing behavior |
| 5 | ship | `hm-ship` | User wants to prepare a release, deploy, or production readiness check |
| 6 | research | `hm-research-deep` | User wants a multi-source investigation with citations |
| 7 | cross-cut | `hm-cross-change` | User wants a change that touches multiple modules/surfaces |
| 8 | product | `hm-product-validation` | User wants RICE / product-lens / user-impact analysis |
| 9 | intent | `hm-intent-brainstorm` | User wants to explore what to build or clarify intent |
| 10 | coord | `hm-coord-loop` | User wants 3+ agents dispatched in parallel / wave / pipeline |

## Command Validation

Before invoking, verify the command file exists:

```
test -f assets/commands/<command>.md && echo "EXISTS" || echo "MISSING"
```

If MISSING, the command is not yet shipped. Either:
- Route to the nearest equivalent (e.g., `hm-execute-phase` is the TDD parent)
- Escalate to the user with the missing command name

## Multi-Intent Prompts

If the prompt contains 2+ intents, DO NOT pick one. Split the work and
load `hm-coord-loop` to dispatch multiple commands in sequence or wave.
