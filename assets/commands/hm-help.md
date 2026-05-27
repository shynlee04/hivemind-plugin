---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Display the Hivemind command registry: list all available hm-* commands grouped by category (routing, workflow, audit, research) with descriptions, target agents, and usage examples. Use when you need to discover available commands or learn what each command does."
argument-hint: "[--category routing|workflow|audit|research] [--json]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  glob: true
---

<objective>
Display a categorized registry of all hm-* commands available in the Hivemind system, showing command names, descriptions, target agents, subtask mode, usage examples, and dependency chains.
</objective>

<execution_context>
Reads from .opencode/commands/hm-*.md files; no workflow delegation.
</execution_context>

<context>
Filter: $ARGUMENTS
Namespace: hm
</context>

<process>
1. Read all hm-*.md files from .opencode/commands/
2. Extract YAML frontmatter: description, agent, subtask, requires, argument-hint
3. Group by namespace/category inferred from description
4. Render categorized table with: Command | Description | Agent | Subtask | Requires | Usage
5. If --category flag provided, filter to that category only
6. If --json flag provided, output machine-readable JSON
</process>
