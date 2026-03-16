---
description: "Invoke hiveminder for current-runtime planning, analysis, and orchestration without legacy lifecycle verbs."
agent: hiveminder
subtask: false
---

# HiveMind Orchestration Command

Use this helper for strategic planning, review, or orchestration.

## Workflow

1. Check runtime readiness with `hivemind_runtime_status({})`.
2. Read the current authority and planning files directly.
3. Analyze the relevant source paths with `glob`, `grep`, and `read`.
4. Produce one bounded plan or one bounded delegation packet.
5. Verify delegated returns before reporting back.

## Output Format

Return:
- current runtime state
- key findings
- bounded plan or delegation route
- explicit verification gate for the next step
