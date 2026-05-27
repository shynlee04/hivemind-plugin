---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "codebase intelligence | map graphify docs learnings"
argument-hint: ""
requires: ["hm-map-codebase", "hm-graphify", "hm-docs-update", "hm-extract-learnings"]
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  skill: true
---


Route to the appropriate codebase-intelligence skill based on the user's intent.
`hm-scan` and `hm-intel` were folded into `hm-map-codebase` flags by #2790.

| User wants | Invoke |
|---|---|
| Map the full codebase structure | hm-map-codebase |
| Quick lightweight codebase scan | hm-map-codebase --fast |
| Query mapped intelligence files | hm-map-codebase --query |
| Generate a knowledge graph | hm-graphify |
| Update project documentation | hm-docs-update |
| Extract learnings from a completed phase | hm-extract-learnings |

Invoke the matched skill directly using the Skill tool.
