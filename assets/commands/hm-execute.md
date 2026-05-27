---
namespace: hm
agent: hm-executor
subtask: true
description: Execute a created phase plan using TDD, atomic commits, and regression checks.
argument-hint: "<phase-number> [--only-wave <wave>] [--dry-run]"
requires: ["hm-plan"]
validation-gates: ["pre-execution-gate"]
output-templates: ["hm-summary.md"]
coordination-model: "waiter-model"
completion-signals: ["plan-executed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Execute implementation waves defined in PLAN.md sequentially, running automated tests and committing atomicity.
</objective>

<execution_context>
@.opencode/workflows/hm-execute.md
</execution_context>

<context>
Phase ID: $ARGUMENTS
Namespace: hm
Routed Agent: hm-executor
</context>

<process>
Execute end-to-end via hm-execute workflow. Resolves tasks, runs TDD assertions, and updates SUMMARY.md.
</process>
