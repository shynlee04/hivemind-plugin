---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "project lifecycle | milestones audits summary"
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  skill: true
---


Route to the appropriate project / milestone skill based on the user's intent.
`hm-plan-milestone-gaps` was deleted by #2790 — gap planning now happens
inline as part of `hm-audit-milestone`'s output.

| User wants | Invoke |
|---|---|
| Start a new project | hm-new-project |
| Create a new milestone | hm-new-milestone |
| Complete the current milestone | hm-complete-milestone |
| Audit a milestone for issues | hm-audit-milestone |
| Summarize milestone status | hm-milestone-summary |

Invoke the matched skill directly using the Skill tool.
