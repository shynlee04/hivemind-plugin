---
namespace: hm
agent: hm-executor
subtask: false
description: "Execute a created phase plan using TDD, atomic commits, and regression checks."
argument-hint: "<phase-number> [--only-wave <wave>] [--dry-run]"
requires: ["hm-plan"]
validation-gates: ["lifecycle-gate", "evidence-truth-gate"]
output-templates: ["hm-verification.md"]
coordination-model: "waiter-model"
completion-signals: ["execution-completed"]
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
