---
description: Execute planned tasks in a phase using wave-based parallelization, atomic commits, deviation handling, and checkpoint recovery.
argument-hint: "<phase-number> [--wave N] [--gaps-only] [--tdd]"
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
Routed Agents: hm-executor, hm-verifier
</context>

<process>
Execute end-to-end via hm-execute workflow. Produces execution commits and SUMMARY.md.
</process>
