---
description: "Create a new skill, agent, command, or tool. Routes to the right specialist. Triggers: 'create a skill', 'add an agent', 'build a command', 'make a tool'."
agent: hivefiver-orchestrator
subtask: true
---

<objective>
Create a new OpenCode meta-concept (skill, agent, command, or tool) by routing to the appropriate Hivefiver specialist agent.

Acts as the entry point for all meta-concept creation. Never does the work itself. Classifies intent, routes to specialist, verifies output.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/workflows-lab/active/refactoring/create.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the create workflow from @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/workflows-lab/active/refactoring/create.md end-to-end.
Preserve all workflow gates (intent classification, routing, verification).
</process>
