---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Socratic ideation and idea routing — think through ideas before committing to plans"
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  write: true
  bash: true
  grep: true
  glob: true
  agent: true
  question: true
---

<objective>
Open-ended Socratic ideation session. Guides the developer through exploring an idea via
probing questions, optionally spawns research, then routes outputs to the appropriate Hivemind
artifacts (notes, todos, seeds, research questions, requirements, or new phases).

Accepts an optional topic argument: `/hm-explore authentication strategy`
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-explore.md
</execution_context>

<process>
Execute end-to-end.
</process>
