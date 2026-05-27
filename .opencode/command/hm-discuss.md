---
description: Start phase discussion to clarify intent, lock decisions, and establish boundaries before planning.
argument-hint: "<phase-number> [--assumptions] [--text]"
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
Extract user intent, locked implementation decisions, and scope boundaries for the target phase.
</objective>

<execution_context>
@.opencode/workflows/hm-discuss.md
</execution_context>

<context>
Phase: $ARGUMENTS
Namespace: hm
Routed Agent: hm-intent-loop
</context>

<process>
Execute end-to-end via hm-discuss workflow. Produces CONTEXT.md with explicit decisions and boundaries.
</process>
