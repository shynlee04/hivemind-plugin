---
namespace: hm
agent: hm-planner
subtask: false
description: "Create detailed phase plan (PLAN.md) with integrated research, pattern mapping, spec compliance, and goal-backward verification."
argument-hint: "<phase-number> [--research] [--skip-research] [--gaps] [--skip-verify]"
requires: ["hm-discuss"]
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-plan.md"]
coordination-model: "waiter-model"
completion-signals: ["plan-generated"]
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
Create executable phase plans (PLAN.md files) for a roadmap phase with integrated research, pattern mapping, spec compliance, and verification.
</objective>

<execution_context>
@.opencode/workflows/hm-plan.md
</execution_context>

<context>
Phase: $ARGUMENTS
Namespace: hm
Routed Agent: hm-planner
</context>

<process>
Execute end-to-end via hm-plan workflow. Generates PLAN.md, RESEARCH.md, PATTERNS.md, and SPEC.md.
</process>
