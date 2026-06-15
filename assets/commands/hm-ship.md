---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Create PR, run review, and prepare for merge after verification passes"
argument-hint: "[phase number or milestone, e.g., '4' or 'v1.0']"
requires: ["hm-review", "hm-verify-work"]
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  bash: true
  grep: true
  glob: true
  write: true
  question: true
---

<objective>
Bridge local completion → merged PR. After /hm-verify-work passes, ship the work: push branch, create PR with auto-generated body, optionally trigger review, and track the merge.

Closes the plan → execute → verify → ship loop.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-ship.md
</execution_context>

Execute the ship workflow from @/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-ship.md end-to-end.
