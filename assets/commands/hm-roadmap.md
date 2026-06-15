---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Roadmap management: view current roadmap, analyze phase dependencies, add/remove phases, check for gaps, or export roadmap report. Use when you need to plan, inspect, or update the project delivery timeline."
argument-hint: "[view|analyze|add <phase>|remove <phase>|gaps|export]"
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
---


<objective>
Manage the project roadmap: display current roadmap with phase status, analyze dependency chains for circular or missing dependencies, add or remove phases with renumbering, detect phase gaps, and export roadmap reports.
</objective>

<execution_context>
@.opencode/workflows/hm-roadmap.md
</execution_context>

<context>
Action: $ARGUMENTS
Namespace: hm
Routed Agent: hm-roadmapper
</context>

<process>
Execute end-to-end via hm-roadmap workflow. Produces roadmap analysis or modifications.
</process>
