---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Configure Hivemind runtime settings: view current configuration, update model profile (quality/balanced/budget/inherit), toggle feature flags (auto-loop, gate-skip, notification), or set environment context. Use when you need to change how Hivemind agents behave during execution."
argument-hint: "[view|set <key=value>|help]"
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
Manage Hivemind runtime configuration stored in .hivemind/config.json: view current settings, update profile/feature flags, or display help. Config changes persist across sessions.
</objective>

<execution_context>
Reads/writes .hivemind/config.json; validates against known schema.
</execution_context>

<context>
Action: $ARGUMENTS
Namespace: hm
Default Config: .hivemind/config.json
</context>

<process>
1. Parse $ARGUMENTS: view (default), set <key=value>, help
2. view: Read .hivemind/config.json and display formatted
3. set: Validate key against known schema (profile: quality|balanced|budget|inherit; feature.*: on|off), write change
4. help: Display available settings and valid values
</process>
