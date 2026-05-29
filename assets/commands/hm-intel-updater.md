---
namespace: hm
agent: hm-intel-updater
subtask: true
description: "Maintain codebase intelligence files in .planning/intel/ with structured JSON summaries."
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  agent: true
  question: true
---

<objective>
Maintain codebase intelligence files in .planning/intel/ with structured JSON summaries of project state, module boundaries, and key interfaces.

Routes to hm-intel-updater agent which executes the intel update workflow.
</objective>

<context>
$ARGUMENTS
</context>

<process>
Execute end-to-end via hm-intel-updater agent. Follow the intel update flow: read codebase changes, identify intel impacts, update existing intel files, create new intel files, commit intel updates.
</process>
