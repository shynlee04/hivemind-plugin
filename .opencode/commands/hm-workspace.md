---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Manage Hivemind workspaces — create, list, or remove isolated workspace environments"
argument-hint: "[--new | --list | --remove] [name]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["workspace-managed"]
tools:
  read: true
  write: true
  bash: true
  question: true
---


<objective>
Manage Hivemind workspaces with a single consolidated command.

Mode routing:
- **--new**: Create an isolated workspace with repo copies and independent .planning/ → new-workspace workflow
- **--list**: List active Hivemind workspaces and their status → list-workspaces workflow
- **--remove**: Remove a Hivemind workspace and clean up worktrees → remove-workspace workflow
</objective>

<routing>

| Flag | Action | Workflow |
|------|--------|----------|
| --new | Create workspace with worktree/clone strategy | new-workspace |
| --list | Scan ~/hm-workspaces/, show summary table | list-workspaces |
| --remove | Confirm and remove workspace directory | remove-workspace |

</routing>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/new-workspace.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/list-workspaces.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/remove-workspace.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/references/ui-brand.md
</execution_context>

<context>
Arguments: $ARGUMENTS

Parse the first token of $ARGUMENTS:
- If it is `--new`: strip the flag, pass remainder (--name, --repos, --path, --strategy, --branch, --auto flags) to new-workspace workflow
- If it is `--list`: execute list-workspaces workflow (no argument needed)
- If it is `--remove`: strip the flag, pass remainder (workspace-name) to remove-workspace workflow
- Otherwise (no flag): show usage — one of --new, --list, or --remove is required
</context>

<process>
1. Parse the leading flag from $ARGUMENTS.
2. Load and execute the appropriate workflow end-to-end based on the routing table above.
3. Preserve all workflow gates from the target workflow (validation, approvals, commits, routing).
</process>
