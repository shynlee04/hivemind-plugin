---
namespace: hm
agent: hm-debugger
subtask: true
description: "Systematic debugging with persistent state to diagnose and fix failing tests, crashes, or unintended behaviors."
argument-hint: "<error-context-or-test-file> [--interactive] [--max-iterations N]"
requires: []
validation-gates: ["debug-verification-gate"]
output-templates: ["hm-debug-reproduction.md"]
coordination-model: "waiter-model"
completion-signals: ["bug-resolved"]
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
Execute systematic debugging loops with persistent state to identify root cause and apply/verify code corrections.
</objective>

<execution_context>
@.opencode/workflows/hm-debug.md
</execution_context>

<context>
Target: $ARGUMENTS
Namespace: hm
Routed Agent: hm-debugger
</context>

<process>
Execute end-to-end via hm-debug workflow. Tracks diagnostic steps and outputs debug summaries.
</process>
