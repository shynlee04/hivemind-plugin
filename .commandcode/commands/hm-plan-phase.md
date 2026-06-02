---
namespace: hm
agent: hm-planner
subtask: true
description: "Create detailed phase plan (PLAN.md) with research, task breakdown, dependency analysis, and goal-backward validation. Routes through hm-phase-researcher, hm-planner, hm-pattern-mapper, hm-plan-checker, hm-intent-loop, and hm-specifier agents."
argument-hint: "<phase-number> [--research] [--skip-research] [--gaps] [--skip-verify] [--mvp]"
requires: []
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-plan.md"]
coordination-model: "waiter-model"
completion-signals: ["plan-generated"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
  question: true
---

<objective>
Create executable phase plans (PLAN.md files) for a roadmap phase with integrated research, pattern mapping, spec authoring, and verification.

**Default flow:** Research → Pattern Map → Spec Authoring → Plan → Verify → Done
</objective>

<execution_context>
@.opencode/workflows/hm-plan-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS
Executed by hm-plan-phase workflow.
All agent dispatch, gate handling, and iteration logic lives in the workflow file.
</context>

<process>
Execute end-to-end via hm-plan-phase workflow. Preserve all workflow gates (research, planning, verification loop).
</process>
