---
description: Systematic debugging with persistent state across sessions, hypothesis testing, and root cause analysis. Routes through hm-debug-session-manager (primary) and hm-debugger (secondary).
argument-hint: "<description-of-issue> [--phase <phase-number>]"
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
Systematic debugging with persistent state across context resets. Investigates bugs, traces root causes, and produces structured debug session artifacts.
</objective>

<execution_context>
@.opencode/workflows/hm-debug.md
</execution_context>

<context>
Issue: $ARGUMENTS
Routes through hm-debug-session-manager (session orchestration) and hm-debugger (root cause investigation).
</context>

<process>
Execute end-to-end via hm-debug workflow. Preserve all debug session gates and investigation cycles.
</process>
