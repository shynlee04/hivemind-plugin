---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "List files in the current directory"
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


List all files in the current directory:
!ls -la
