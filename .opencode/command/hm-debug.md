---
description: Systematic debugging with persistent state across sessions, hypothesis testing, and root cause analysis.
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
Investigate bugs, trace root causes, maintain hypothesis registers, and output a debug session report.
</objective>

<execution_context>
@.opencode/workflows/hm-debug.md
</execution_context>

<context>
Issue: $ARGUMENTS
Namespace: hm
Routed Agents: hm-debug-session-manager, hm-debugger
</context>

<process>
Execute end-to-end via hm-debug workflow. Creates DEBUG-SESSION.md logs.
</process>
