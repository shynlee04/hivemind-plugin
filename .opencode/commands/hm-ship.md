---
namespace: hm
agent: hm-shipper
subtask: true
description: "Create pull request, run code review gates, generate CHANGELOG.md, bump version, and prepare for merge. Completes the delivery pipeline for a milestone or phase. Use when implementation is complete and ready for integration."
argument-hint: "[<phase-number>] [--dry-run] [--skip-review] [--version <semver>]"
requires: ["hm-verify"]
validation-gates: ["code-review-gate", "spec-compliance-gate", "evidence-truth-gate"]
output-templates: ["CHANGELOG.md", "RELEASE.md"]
coordination-model: "waiter-model"
completion-signals: ["pr-created", "release-ready"]
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  agent: true
  todowrite: true
  question: true
---
<objective>
Create a pull request with comprehensive review, generate CHANGELOG.md, bump version according to semver, run all quality gates (code review → spec compliance → evidence truth), and prepare the release manifest.
</objective>

<execution_context>
@.opencode/workflows/hm-ship.md
</execution_context>

<context>
Phase: $ARGUMENTS
Namespace: hm
Routed Agent: hm-shipper
</context>

<process>
Execute end-to-end via hm-ship workflow. Produces PR, CHANGELOG.md, version bump commit, and RELEASE.md.
</process>
