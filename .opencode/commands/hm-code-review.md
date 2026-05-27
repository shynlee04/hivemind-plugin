---
namespace: hm
agent: hm-code-reviewer
subtask: true
description: "Review source files for bugs, security issues, spec compliance, and code quality. Routes through hm-code-reviewer (primary) and hm-code-fixer (with --fix flag)."
argument-hint: "<phase-number> [--fix] [--plan <plan-id>]"
requires: []
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-summary.md"]
coordination-model: "waiter-model"
completion-signals: ["review-completed"]
tools:
  read: true
  write: true
  edit: true
  glob: true
  grep: true
  bash: true
  agent: true
  question: true
---

<objective>
Review source files changed during a phase for bugs, security issues, spec compliance, and code quality problems. Optionally auto-fix identified issues.
</objective>

<execution_context>
@.opencode/workflows/hm-code-review.md
</execution_context>

<context>
Phase: $ARGUMENTS
Routes through hm-code-reviewer (primary review) and hm-code-fixer (--fix flag for auto-remediation).
</context>

<process>
Execute end-to-end via hm-code-review workflow. Preserve all review gates and fix cycles.
</process>
