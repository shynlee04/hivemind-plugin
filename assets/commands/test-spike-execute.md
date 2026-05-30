---
description: "Tests the programmatic execution of slash commands by an agent."
agent: build
subtask: false
---

<objective>
Verify that you can programmatically dispatch another OpenCode slash command using the `execute-slash-command` tool.
</objective>

<process>
1. Call the `execute-slash-command` tool.
2. Set the `command` argument to "test-echo".
3. Set the `arguments` argument to "HELLO FROM THE AGENT".
4. Read the output of the tool execution and report the success back to the user.
</process>

<context>
$ARGUMENTS
</context>
