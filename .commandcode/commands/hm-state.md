---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "View project state and progress: current phase status, completed phases, pending work, blockers, and next recommended action. Use when you need a quick status check or to determine what to work on next."
argument-hint: "[--detailed] [--json]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  bash: true
  glob: true
  grep: true
---


<objective>
Aggregate project state from .planning/STATE.md, .hivemind/state/, and git log to produce a concise state report showing current phase, completion percentage, blockers, and next recommended action.
</objective>

<execution_context>
@.opencode/workflows/hm-state.md
</execution_context>

<context>
Namespace: hm
Routed Agent: hm-planner
</context>

<process>
Execute end-to-end via hm-state workflow. Produces state report with progress, blockers, and recommendations.
</process>
