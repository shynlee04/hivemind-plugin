---
namespace: hm
agent: hm-planner
subtask: true
description: Create execution plan for a roadmap phase with integrated research, pattern mapping, and verification.
argument-hint: "<phase-number> [--skip-research] [--prd <path>]"
requires: ["hm-discuss"]
validation-gates: ["spec-compliance-check"]
output-templates: ["hm-plan.md", "hm-research.md"]
coordination-model: "waiter-model"
completion-signals: ["plan-created"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Analyze codebase and phase goals, run research and pattern mapping, and author SPEC.md and PLAN.md.
</objective>

<execution_context>
@.opencode/workflows/hm-plan.md
</execution_context>

<context>
Phase ID: $ARGUMENTS
Namespace: hm
Routed Agent: hm-planner
</context>

<process>
Execute end-to-end via hm-plan workflow. Generates RESEARCH.md, PATTERNS.md, SPEC.md, and PLAN.md under the target phase folder.
</process>
