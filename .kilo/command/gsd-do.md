---
description: Route freeform text to the right GSD command automatically
argument-hint: "<description of what you want to do>"
tools:
  read: true
  bash: true
  question: true
---
<objective>
Analyze freeform natural language input and dispatch to the most appropriate GSD command.

Acts as a smart dispatcher — never does the work itself. Matches intent to the best GSD command using routing rules, confirms the match, then hands off.

Use when you know what you want but don't know which `/gsd-*` command to run.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.kilo/get-shit-done/workflows/do.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.kilo/get-shit-done/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the do workflow from @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.kilo/get-shit-done/workflows/do.md end-to-end.
Route user intent to the best GSD command and invoke it.
</process>
