---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Synthesize research outputs from parallel agents into a consolidated SUMMARY.md with cross-referenced findings, confidence assessments, and gap analysis. Use after parallel research dispatch to produce unified context."
argument-hint: "[<research-dir>] [--format summary|report|brief]"
requires: ["hm-research"]
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
---


<objective>
Combine outputs from parallel research agents into a single consolidated SUMMARY.md document. Cross-reference findings, assign confidence levels, identify contradictions, and produce a gap analysis with recommended next steps.
</objective>

<execution_context>
@.opencode/workflows/hm-synthesize.md
</execution_context>

<context>
Research Directory: $ARGUMENTS
Namespace: hm
</context>

<process>
Execute end-to-end via hm-synthesize workflow. Produces SUMMARY.md with cross-referenced findings.
</process>
