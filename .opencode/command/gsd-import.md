---
description: Ingest external plans with conflict detection against project decisions before writing anything.
argument-hint: "--from <filepath> | --from-gsd2"
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
Import external plan files into the GSD planning system with conflict detection against PROJECT.md decisions.

- **--from**: Import an external plan file, detect conflicts, write as GSD PLAN.md, validate via gsd-plan-checker.
- **--from-gsd2**: Reverse-migrate a GSD-2 project (`.gsd/` directory) back to GSD v1 (`.planning/`) format. Runs `gsd-tools.cjs from-gsd2`. Pass `--path <dir>` to migrate a project at a different path.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/import.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ui-brand.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gate-prompts.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/doc-conflict-engine.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
If `--from-gsd2` is in $ARGUMENTS:
Run: `node "/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/bin/gsd-tools.cjs" from-gsd2`
Pass `--path <dir>` if provided. Present the migration result to the user.
Stop here (do not run the standard import workflow).

Otherwise, execute the import workflow end-to-end.
</process>
