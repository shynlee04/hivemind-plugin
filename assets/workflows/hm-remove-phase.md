<purpose>
Remove an unstarted future phase from the project roadmap, delete its directory, renumber all subsequent phases to maintain a clean linear sequence, and commit the change. The git commit serves as the historical record of removal.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="parse_arguments">
Parse the command arguments:
- Argument is the phase number to remove (integer or decimal)
- Example: `/hm-remove-phase 17` → phase = 17
- Example: `/hm-remove-phase 16.1` → phase = 16.1

If no argument provided:

```
ERROR: Phase number required
Usage: /hm-remove-phase <phase-number>
Example: /hm-remove-phase 17
```

Exit.
</step>

<step name="init_context">
Load phase operation context:

```bash
# SDK resolution: prefer local hm-tools.cjs, fall back to global hm-sdk (#3668)
Hivemind_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/hivemind/bin/hm-tools.cjs"
if [ -f "$Hivemind_TOOLS" ]; then
  Hivemind_SDK="node $Hivemind_TOOLS"
elif command -v hm-sdk >/dev/null 2>&1; then
  Hivemind_SDK="hm-sdk"
else
  echo "ERROR: hm-sdk not found on PATH and $Hivemind_TOOLS does not exist." >&2
  echo "Run: npx hivemind-cc@latest --claude --local" >&2
  exit 1
fi
INIT=$($Hivemind_SDK query init.phase-op "${target}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract: `phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`.

Also read STATE.md and ROADMAP.md content for parsing current position.
</step>

<step name="validate_future_phase">
Verify the phase is a future phase (not started):

1. Compare target phase to current phase from STATE.md
2. Target must be > current phase number

If target <= current phase:

```
ERROR: Cannot remove Phase {target}

Only future phases can be removed:
- Current phase: {current}
- Phase {target} is current or completed

To abandon current work, use /hm-pause-work instead.
```

Exit.
</step>

<step name="confirm_removal">
Present removal summary and confirm:

```
Removing Phase {target}: {Name}

This will:
- Delete: .planning/phases/{target}-{slug}/
- Renumber all subsequent phases
- Update: ROADMAP.md, STATE.md

Proceed? (y/n)
```

Wait for confirmation.
</step>

<step name="execute_removal">
**Delegate the entire removal operation to `hm-sdk query phase.remove`:**

```bash
RESULT=$($Hivemind_SDK query phase.remove "${target}")
```

If the phase has executed plans (SUMMARY.md files), the CLI will error. Use `--force` only if the user confirms:

```bash
RESULT=$($Hivemind_SDK query phase.remove "${target}" --force)
```

The CLI handles:
- Deleting the phase directory
- Renumbering all subsequent directories (in reverse order to avoid conflicts)
- Renaming all files inside renumbered directories (PLAN.md, SUMMARY.md, etc.)
- Updating ROADMAP.md (removing section, renumbering all phase references, updating dependencies)
- Updating STATE.md (decrementing phase count)

Extract from result: `removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`.
</step>

<step name="commit">
Stage and commit the removal:

```bash
$Hivemind_SDK query commit "chore: remove phase {target} ({original-phase-name})" --files .planning/
```

The commit message preserves the historical record of what was removed.
</step>

<step name="completion">
Present completion summary:

```
Phase {target} ({original-name}) removed.

Changes:
- Deleted: .planning/phases/{target}-{slug}/
- Renumbered: {N} directories and {M} files
- Updated: ROADMAP.md, STATE.md
- Committed: chore: remove phase {target} ({original-name})

---

## What's Next

Would you like to:
- `/hm-progress` — see updated roadmap status
- Continue with current phase
- Review roadmap

---
```
</step>

</process>

<anti_patterns>

- Don't remove completed phases (have SUMMARY.md files) without --force
- Don't remove current or past phases
- Don't manually renumber — use `hm-sdk query phase.remove` which handles all renumbering
- Don't add "removed phase" notes to STATE.md — git commit is the record
- Don't modify completed phase directories
</anti_patterns>

<success_criteria>
Phase removal is complete when:

- [ ] Target phase validated as future/unstarted
- [ ] `hm-sdk query phase.remove` executed successfully
- [ ] Changes committed with descriptive message
- [ ] User informed of changes
</success_criteria>
