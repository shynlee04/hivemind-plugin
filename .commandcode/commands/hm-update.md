---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Update Hivemind to latest version with changelog display"
argument-hint: "[--sync | --reapply]"
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
---


<objective>
Check for Hivemind updates, install if available, and display what changed.

Routes to the update workflow which handles:
- Version detection (local vs global installation)
- npm version checking
- Changelog fetching and display
- User confirmation with clean install warning
- Update execution and cache clearing
- Restart reminder
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-update.md
</execution_context>

<flags>
- **--sync**: Sync managed Hivemind skills across runtime roots so multi-runtime users stay aligned after an update. Runs the sync-skills workflow (--from, --to, --dry-run, --apply flags supported).
- **--reapply**: Reapply local modifications after a Hivemind update. Uses three-way comparison (pristine baseline, user-modified backup, newly installed version) to merge user customizations back. Runs the reapply-patches workflow.
- **(no flag)**: Standard update — check for new version, show changelog, install.
</flags>

<process>
Parse the first token of $ARGUMENTS:
- If it is `--sync`: strip the flag, execute the sync-skills workflow (passing remaining args for --from/--to/--dry-run/--apply).
- If it is `--reapply`: strip the flag, execute the reapply-patches workflow.
- Otherwise: execute the update workflow end-to-end.

</process>

<execution_context_extended>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-sync-skills.md
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-reapply-patches.md
</execution_context_extended>
