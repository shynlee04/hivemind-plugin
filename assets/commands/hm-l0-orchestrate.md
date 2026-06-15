---
namespace: hm
agent: hm-l0-orchestrator
subtask: true
description: "Front-facing L0 strategist for hm-* lineage — coordinate high-level phase routing and intent classification."
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
Front-facing L0 strategist for hm-* lineage — coordinate high-level phase routing and intent classification. Classifies user intent, forms landscapes, maps paths, and delegates to coordinators or L2/L3 specialists.

Routes to hm-l0-orchestrator agent which executes the orchestration workflow.
</objective>

<context>
$ARGUMENTS
</context>

<process>
Execute end-to-end via hm-l0-orchestrator agent. Follow the orchestration flow: intent classification, landscape formation, path mapping, specialist delegation, and completion verification.
</process>
