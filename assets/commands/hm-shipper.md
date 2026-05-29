---
namespace: hm
agent: hm-shipper
subtask: true
description: "Coordinate release preparation including CHANGELOG.md generation, version bumping, and release manifest creation."
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
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
Coordinate release preparation including CHANGELOG.md generation, version bumping, and release manifest creation. Manages the release lifecycle: gathers commit logs, generates categorized changelogs, coordinates version bumping, verifies build integrity, and produces release manifests.

Routes to hm-shipper agent which executes the release coordination workflow.
</objective>

<context>
$ARGUMENTS
</context>

<process>
Execute end-to-end via hm-shipper agent. Follow the release flow: load phase summaries, compile changelog, run pre-release checks, verify production readiness, write release artifacts, notify orchestrator.
</process>
