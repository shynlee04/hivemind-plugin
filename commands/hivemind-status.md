---
description: Explain the current HiveMind runtime state through the live inspection tool; this is not a shipped public status CLI.
agent: hiveminder
subtask: false
---

# HiveMind Status Check

This is an in-OpenCode status-check workflow, not a live public `status` CLI in the current `ecosystem-revamp` runtime.

Show the user the current source-backed HiveMind state.

## Actions

1. Call the live runtime inspection tool:

```ts
hivemind_runtime_status({})
```

2. If needed, read the active continuity artifacts for additional context:
- `MASTER.active.md`
- `task_plan.active.md`
- `progress.active.md`

3. If runtime health is blocked, recommend the next control-plane command instead of inventing legacy lifecycle calls.

## Report Format

Present:
- runtime attachment state
- trajectory/workflow/task bindings
- missing profile or bootstrap fields
- available `hm-*` command surfaces
- next recovery or execution step
