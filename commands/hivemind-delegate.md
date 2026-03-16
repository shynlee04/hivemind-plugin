---
description: "Validate delegation context and produce a bounded packet using current task and handoff surfaces."
agent: hiveminder
subtask: false
---

# HiveMind Delegation Validator

Use this helper before dispatching a subagent.

## Current Runtime-Safe Flow

1. Confirm current runtime and active work state:

```ts
hivemind_runtime_status({})
```

2. Read the local planning and source context directly.

3. Build a bounded `task(...)` packet with:
- objective
- scope
- constraints
- acceptance criteria
- return format

4. If delegated work needs preservation, use the live handoff surface after verification:

```ts
hivemind_handoff({ action: "create" })
```

## Guardrails

- Do not call removed lifecycle or memory verbs.
- Do not accept delegated success without independent verification.
- Prefer sequential delegation unless file ownership and dependencies are clearly independent.
