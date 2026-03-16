---
description: Show current HiveMind runtime state, active bindings, and the smallest next recovery step.
agent: hiveminder
---

# HiveMind Status Check

Show the user the current source-backed HiveMind state.

## Actions

1. Call the live runtime inspection tool:

```ts
hivemind_runtime_status({})
```

2. If needed, read project planning artifacts for additional continuity:
- `task_plan.md`
- `findings.md`
- `progress.md`

3. If runtime health is blocked, recommend the next control-plane command instead of inventing legacy lifecycle calls.

## Report Format

Present:
- runtime attachment state
- trajectory/workflow/task bindings
- missing profile or bootstrap fields
- available `hm-*` command surfaces
- next recovery or execution step
