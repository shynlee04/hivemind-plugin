---
namespace: hm
agent: hm-phase-researcher
subtask: false
description: "Conduct dense stack research and codebase investigation for a roadmap phase."
argument-hint: "<phase-number> [--deep]"
requires: []
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-research.md"]
coordination-model: "waiter-model"
completion-signals: ["research-completed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---

<objective>
Investigate target technology stack, package.json versions, codebase reuse patterns, and threat vectors for the roadmap phase.
</objective>

<execution_context>
@.opencode/workflows/hm-research.md
</execution_context>

<context>
Phase ID: $ARGUMENTS
Namespace: hm
Routed Agent: hm-phase-researcher
</context>

<process>
Execute end-to-end via hm-research workflow. Generates RESEARCH.md containing stack validations, codebase maps, and threat scenarios.
</process>
