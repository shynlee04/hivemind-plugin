---
namespace: hm
agent: hm-architect
subtask: true
description: "Design technical architecture and produce Architecture Decision Records (ARCHITECTURE.md, ADR-*.md)."
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
Design technical architecture and produce Architecture Decision Records (ARCHITECTURE.md, ADR-*.md). Produces system architecture documentation including component boundaries, data flow, dependency decisions, and surface authority maps.

Routes to hm-architect agent which executes the architecture design workflow.
</objective>

<context>
$ARGUMENTS
</context>

<process>
Execute end-to-end via hm-architect agent. Follow the architecture design flow: load context, design architecture, document decisions, write ARCHITECTURE.md, validate.
</process>
