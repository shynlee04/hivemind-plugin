---
namespace: hm
agent: hm-l0-orchestrator
subtask: false
description: "Update Hivemind to the latest version: check for updates, display changelog, apply update, and re-sync assets. Use when a new version of Hivemind is available or when you want to refresh the project setup."
argument-hint: "[check|apply|rollback]"
requires: []
validation-gates: ["backup-gate"]
output-templates: []
coordination-model: "direct"
completion-signals: ["update-complete"]
tools:
  read: true
  bash: true
---
<objective>
Check for Hivemind updates, display the changelog, apply the update with pre-update backup, and re-sync all assets from the updated package.
</objective>

<execution_context>
Runs npm/npx for package updates; backs up current state before applying.
</execution_context>

<context>
Action: $ARGUMENTS
Namespace: hm
Package: hivemind
</context>

<process>
1. Parse $ARGUMENTS: check (default), apply, rollback
2. check: Run npm outdated hivemind, show current vs latest version with changelog
3. apply: Backup .opencode/ and .hivemind/ state, run npm update hivemind, re-sync assets
4. rollback: Restore from pre-update backup if available
</process>
