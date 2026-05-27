---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Ingest external plans with conflict detection against project decisions before writing anything."
argument-hint: "--from <filepath> | --from-gsd2"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  question: true
  agent: true
---


<objective>
Import external plan files into the Hivemind planning system with conflict detection against PROJECT.md decisions.

- **--from**: Import an external plan file, detect conflicts, write as Hivemind PLAN.md, validate via hm-plan-checker.
- **--from-gsd2**: Reverse-migrate a Hivemind-2 project (`.hm/` directory) back to Hivemind v1 (`.planning/`) format. Runs `hm-tools.cjs from-gsd2`. Pass `--path <dir>` to migrate a project at a different path.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-import.md
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-ui-brand.md
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-gate-prompts.md
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-doc-conflict-engine.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
If `--from-gsd2` is in $ARGUMENTS:
Run: `node "/Users/apple/hivemind-plugin-private/.opencode/hivemind/bin/hm-tools.cjs" from-gsd2`
Pass `--path <dir>` if provided. Present the migration result to the user.
Stop here (do not run the standard import workflow).

Otherwise, execute the import workflow end-to-end.
</process>
