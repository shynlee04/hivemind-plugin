---
namespace: hm
agent: hm-ecologist
subtask: true
description: "Map feature dependencies and cross-cutting impact across the project ecosystem — produces ECOSYSTEM.md."
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
Map feature dependencies and cross-cutting impact across the project ecosystem. Produces ECOSYSTEM.md with dependency graphs, conflict zones, and recommended delivery ordering.

Routes to hm-ecologist agent which executes the ecosystem mapping workflow.
</objective>

<context>
$ARGUMENTS
</context>

<process>
Execute end-to-end via hm-ecologist agent. Follow the ecosystem mapping flow: load feature list, map dependencies, detect circular dependencies, resolve ordering, assess impact, write ECOSYSTEM.md.
</process>
