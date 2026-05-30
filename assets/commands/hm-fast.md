---
namespace: hm
agent: hm-executor
subtask: true
description: "Execute a trivial task inline — no subagents, no planning overhead"
argument-hint: "[task description]"
requires: ["hm-config", "hm-quick"]
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["fast-task-completed"]
tools:
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
---


<objective>
Execute a trivial task directly in the current context without spawning subagents
or generating PLAN.md files. For tasks too small to justify planning overhead:
typo fixes, config changes, small refactors, forgotten commits, simple additions.

This is NOT a replacement for /hm-quick — use /hm-quick for anything that
needs research, multi-step planning, or verification. /hm-fast is for tasks
you could describe in one sentence and execute in under 2 minutes.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-fast.md
</execution_context>

<process>
Execute end-to-end.
</process>
