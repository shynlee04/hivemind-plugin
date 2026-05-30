---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Session management: list active sessions, resume an interrupted session, stack new work onto an existing session, check session status, or view session hierarchy. Use when you need to manage multi-session workflows or recover from disconnection."
argument-hint: "[list|status <session-id>|resume <session-id>|stack <session-id> <task>|hierarchy <session-id>]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
  session-tracker: true
  session-hierarchy: true
  hivemind-session-view: true
---


<objective>
Manage Hivemind sessions: list active sessions via session-tracker, inspect delegation hierarchy, check status, resume interrupted sessions, or stack new work onto existing sessions.
</objective>

<execution_context>
@.opencode/workflows/hm-session.md
</execution_context>

<context>
Action: $ARGUMENTS
Namespace: hm
Routed Agent: hm-orchestrator
</context>

<process>
1. Parse $ARGUMENTS: list, status <id>, resume <id>, stack <id> <task>, hierarchy <id>
2. list: Query session-tracker for all sessions, filter active/resumable
3. status: Use hivemind-session-view for unified session state
4. resume: Use task tool with task_id to resume interrupted session
5. stack: Use delegate-task with parentSessionId context to attach work
6. hierarchy: Use session-hierarchy get-manifest for full delegation tree
</process>
