---
description: "Enforce context-before-actions discipline using the current runtime and direct codebase reads."
agent: hiveminder
---

# HiveMind Context-First Enforcer

Use this helper before broad changes or when context feels thin.

## Current Runtime-Safe Flow

1. Inspect the live runtime first:

```ts
hivemind_runtime_status({})
```

2. Read the real authority and planning surfaces for the current project:
- `AGENTS.md`
- `README.md`
- `task_plan.md`
- `findings.md`
- `progress.md`

3. Explore the codebase directly:

```ts
glob({ pattern: "**/*keyword*.{ts,js,md}" })
grep({ pattern: "relevant_pattern" })
read({ filePath: "/absolute/path/to/file.ts" })
```

4. If runtime state is missing or unhealthy, recover with the live command surface:

```ts
hivemind_runtime_command({ command: "hm-init" })
// or
hivemind_runtime_command({ command: "hm-doctor" })
```

## Output Contract

Report in this order:
1. Runtime readiness
2. Files and artifacts reviewed
3. Key patterns or risks found
4. Smallest safe next step
