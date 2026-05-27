---
namespace: hm
agent: hm-executor
subtask: false
description: "Execute planned tasks in a phase using wave-based parallelization, atomic commits, deviation handling, and checkpoint recovery."
argument-hint: "<phase-number> [--wave N] [--gaps-only] [--tdd]"
requires: ["hm-plan"]
validation-gates: ["lifecycle-gate", "evidence-truth-gate"]
output-templates: ["hm-verification.md"]
coordination-model: "waiter-model"
completion-signals: ["execution-completed"]
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  agent: true
  todowrite: true
  question: true
---

<objective>
Execute all plans in a phase using wave-based parallel execution with atomic commits, deviation logging, and verifier integration.
</objective>

<execution_context>
@.opencode/workflows/hm-execute.md
</execution_context>

<context>
Phase: $ARGUMENTS
Namespace: hm
Routed Agent: hm-executor
</context>

<process>
Execute end-to-end via hm-execute workflow. Produces execution commits and SUMMARY.md.
</process>
