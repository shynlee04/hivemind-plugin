---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Create a new skill, agent, command, or tool. Routes to the right specialist. Triggers: 'create a skill', 'add an agent', 'build a command', 'make a tool'."
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  bash: true
---


<objective>
Create a new OpenCode meta-concept (skill, agent, command, or tool) by routing to the appropriate Hivefiver specialist agent.

Acts as the entry point for all meta-concept creation. Never does the work itself. Classifies intent, routes to specialist, verifies output.
</objective>

<execution_context>
@.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/create.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the create workflow from @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/create.md end-to-end.
Preserve all workflow gates (intent classification, routing, verification).
</process>
