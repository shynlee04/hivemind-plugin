---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Echo back the user's message"
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  bash: true
---


Echo back exactly what the user said: $ARGUMENTS
