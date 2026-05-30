---
description: "Execute a task plan with full orchestration. Reads plan and runs pending phases through controlled delegation."
agent: hm-l2-conductor
subtask: false
---

Read the task_plan.md in the project root. If it doesn't exist, tell the user to create one first with /plan or by describing their work to the conductor agent.

If task_plan.md exists:

1. Read the plan and identify all phases
2. Check which phases are complete vs pending
3. Start with the first pending phase
4. Execute each pending phase by calling `delegate-task` with the appropriate specialist (researcher for investigation, builder for implementation, critic for verification)
5. After each phase, update task_plan.md status
6. Continue phase-by-phase through `delegate-task` until all phases are complete
7. Report final results

Control rule: the conductor does not rely on generic built-in task delegation for phase execution. Pending work is routed through `delegate-task` so the plugin can enforce permissions and orchestration rules.

If this is a resumption (continuation), check progress.md for the previous session's context.
