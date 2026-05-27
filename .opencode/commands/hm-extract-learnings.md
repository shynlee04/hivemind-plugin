---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Extract decisions, lessons, patterns, and surprises from completed phase artifacts"
argument-hint: "<phase-number>"
requires: ["hm-phase"]
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  write: true
  bash: true
  grep: true
  glob: true
  agent: true
---

<objective>
Extract structured learnings from completed phase artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md, UAT.md, STATE.md) into a LEARNINGS.md file that captures decisions, lessons learned, patterns discovered, and surprises encountered.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/extract-learnings.md
</execution_context>

Execute the extract-learnings workflow from @/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/extract-learnings.md end-to-end.
