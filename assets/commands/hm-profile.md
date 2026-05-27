---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "View or switch the behavioral profile for Hivemind agents. Supports profiles: quality (thorough, multi-gate), balanced (default), budget (fast, minimal gates), inherit (follow parent session). Use when you need to tune agent behavior for the current task."
argument-hint: "[view|set <quality|balanced|budget|inherit>]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  write: true
  bash: true
---

<objective>
View current Hivemind agent profile or switch to a different behavioral profile, persisting the change to .hivemind/config.json for all subsequent agent dispatches.
</objective>

<execution_context>
Reads/writes .hivemind/config.json profile field.
</execution_context>

<context>
Action: $ARGUMENTS
Namespace: hm
Valid Profiles: quality, balanced, budget, inherit
</context>

<process>
1. Parse $ARGUMENTS: view (default), set <profile>, help
2. view: Read current profile from .hivemind/config.json and display with profile description
3. set: Validate profile name, write to .hivemind/config.json profile field
4. help: Display profile descriptions and recommended use cases
</process>
