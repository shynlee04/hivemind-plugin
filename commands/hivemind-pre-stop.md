---
description: "Run before stopping work to summarize progress, verify state, and prepare a clean continuation handoff."
agent: hiveminder
subtask: false
---

# HiveMind Pre-Stop Gate

Use this helper before pausing work.

## Current Runtime-Safe Checklist

1. Review unfinished work in:
- `task_plan.md`
- `findings.md`
- `progress.md`

2. Re-run the appropriate verification commands for the work you just completed.

3. Inspect current runtime state if needed:

```ts
hivemind_runtime_status({})
```

4. If delegated work or checkpoint output must be preserved, capture it with the live handoff surface rather than removed export or memory verbs.

5. Produce a concise continuation summary with completed work, remaining blockers, and the exact next bounded step.

## Important

Session compaction is handled by OpenCode plus HiveMind's compaction hook. Do not call removed tools such as `compact_session`.
