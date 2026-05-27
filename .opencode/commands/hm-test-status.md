---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Show git status"
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


Show the current git status:
!git status --short
