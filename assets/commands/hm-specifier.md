---
namespace: hm
agent: hm-specifier
subtask: true
description: "Author formal design contracts (SPEC.md, UI-SPEC.md, AI-SPEC.md) from requirements and context."
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
Author formal design contracts (SPEC.md, UI-SPEC.md, AI-SPEC.md) from requirements and context. Transforms requirements and intent into formal, falsifiable specifications with EARS acceptance criteria and verification methods.

Routes to hm-specifier agent which executes the spec-driven authoring workflow.
</objective>

<context>
$ARGUMENTS
</context>

<process>
Execute end-to-end via hm-specifier agent. Follow the spec authoring flow: load phase context, formalize requirements using EARS syntax, define acceptance criteria, define verification methods, scope boundaries, write SPEC.md, update state.
</process>
