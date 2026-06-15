---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Resume work from previous session with full context restoration"
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["work-resumed"]
tools:
  read: true
  bash: true
  write: true
  question: true
  skill: true
---


<objective>
Restore complete project context and resume work seamlessly from previous session.

Routes to the resume-project workflow which handles:

- STATE.md loading (or reconstruction if missing)
- Checkpoint detection (.continue-here files)
- Incomplete work detection (PLAN without SUMMARY)
- Status presentation
- Context-aware next action routing
  </objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-resume-project.md
</execution_context>

<process>
Execute end-to-end.
</process>
