---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Display project statistics — phases, plans, requirements, git metrics, and timeline"
argument-hint: ""
requires: ["hm-phase", "hm-progress"]
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["stats-rendered"]
tools:
  read: true
  bash: true
---

<objective>
Display comprehensive project statistics including phase progress, plan execution metrics, requirements completion, git history stats, and project timeline.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/stats.md
</execution_context>

<process>
Execute end-to-end.
</process>
