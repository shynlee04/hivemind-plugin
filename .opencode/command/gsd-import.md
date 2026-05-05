---
description: Ingest external plans with conflict detection against project decisions before writing anything.
argument-hint: "--from <filepath>"
tools:
  read: true
  write: true
  edit: true
  bash: true
  glob: true
  grep: true
  question: true
  task: true
---

<objective>
Import external plan files into the GSD planning system with conflict detection against PROJECT.md decisions.

- **--from**: Import an external plan file, detect conflicts, write as GSD PLAN.md, validate via gsd-plan-checker.

Future: `--prd` mode for PRD extraction is planned for a follow-up PR.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/import.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/references/ui-brand.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/references/gate-prompts.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/references/doc-conflict-engine.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the import workflow end-to-end.
</process>
