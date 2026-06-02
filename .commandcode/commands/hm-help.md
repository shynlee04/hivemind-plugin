---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Show available Hivemind commands and usage guide"
argument-hint: "[--brief | --full | <topic> | --brief <topic>]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
---

<objective>
Display Hivemind help at the tier the user asked for: brief (one-line refresher), default (one-page tour), full (complete reference), a single topic section, or a compact scoped lookup of one topic (`--brief <topic>`: signature + one-line summary).

Output ONLY the reference content of the chosen tier. Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-help.md
</execution_context>

<context>
Arguments: $ARGUMENTS
</context>

<process>
Follow /Users/apple/hivemind-plugin-private/.opencode/workflows/hm-help.md with $ARGUMENTS.
</process>
