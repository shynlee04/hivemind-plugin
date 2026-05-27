---
description: "Start phase discussion to clarify intent, lock decisions, and establish boundaries before planning."
---

# hm-discuss

## Goal
Clarify the operator's intent, identify assumptions, establish bounds, and lock decisions to produce `CONTEXT.md`.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Intent loop | hm-intent-loop | Interact with user to gather phase requirements and decisions |
| User profiler | hm-user-profiler | Extract user preferences and behavioral context |

## Execution Phases
1. **Discover Requirements**: Probe for phase bounds, target stack, and non-negotiables.
2. **Resolve Assumptions**: Enumerate architectural constraints.
3. **Verify Compliance**: Scan for potential conflicts with existing components.
4. **Emit Context**: Output parsed requirements to `CONTEXT.md` in `.planning/phases/`.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Choose whether to proceed to planning or gather more information |
| `human-verify` | Review `CONTEXT.md` to ensure all decisions are correctly documented |

## Exit Criteria
- `CONTEXT.md` contains scope fences, locked decisions, and assumptions.
- User explicitly approves the context before planning begins.
