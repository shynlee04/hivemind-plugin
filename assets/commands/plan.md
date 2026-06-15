---
description: "Enter strategic planning mode. Agent interviews you to build a detailed plan before any code is written."
agent: hm-l0-orchestrator
tools:
  - delegate-task
  - delegation-status
  - hivemind-trajectory
  - hivemind-steer
  - hivemind-pressure
  - semantic-agent-selector
subtask: false
---

Enter planning mode. Before writing any code:

1. Ask the user what they want to accomplish
2. Ask clarifying questions about scope, constraints, and requirements
3. Research the codebase to understand existing patterns
4. Create a detailed plan in task_plan.md with numbered phases
5. Each phase must have clear acceptance criteria
6. Present the plan for user approval
7. After approval, tell user to run /start-work to execute the plan through controlled `delegate-task` delegation

Key principles:
- Plan must be specific enough that no implementation decisions are left to the specialist
- Every phase must reference specific files and patterns in the codebase
- Acceptance criteria must be verifiable (not subjective)
- Planning stays separate from execution. Use `/start-work` when it is time to run phases through controlled delegation.
