---
namespace: hm
agent: hm-debugger
subtask: true
description: Start systematic debugging session to diagnose and repair connection, compilation, or logic errors.
argument-hint: "[error-description] [--file <path>] [--test]"
requires: []
validation-gates: []
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["debug-resolved"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Diagnose test failures, connection drops, or runtime exceptions systematically, establishing reproducer scripts and fixing the root cause.
</objective>

<execution_context>
@.opencode/workflows/hm-debug.md
</execution_context>

<context>
Error Context: $ARGUMENTS
Namespace: hm
Routed Agent: hm-debugger
</context>

<process>
Execute end-to-end via hm-debug workflow. Creates reproduce script, resolves issue, verifies with tests, and commits.
</process>
