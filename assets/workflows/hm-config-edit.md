---
description: "7-turn TUI workflow for editing `.hivemind/configs.json` governance rules. Read → pick action → prompt → validate → diff → write+reset → suggest commit. Routed from `assets/commands/hm-config-govern.md`."
---

# hm-config-edit — Interactive Config Rule Editor

Step-by-step workflow for editing `.hivemind/configs.json` `governance.rules[]`
in an interactive TUI loop. Entry point: `assets/commands/hm-config-govern.md`
(the user-facing command). All 7 turns are mandatory; the workflow is
idempotent and supports `--dry-run`.

The companion `hm-config-govern` command (frontmatter `agent: hm-platform-references`)
parses `$ARGUMENTS` for flags (`--list`, `--add`, `--remove`, `--set-action`,
`--validate`, `--dry-run`, `--scope <user|project>`) and falls through to this
workflow when no flag is given. Each turn below is invoked as a numbered section
with the action and tool calls in fenced code blocks.

## Turn T1 — Read current config + print rules table

Read the in-scope config (project or user root) and print every existing rule
as a tabular preview so the user sees the current state before any edit.

```bash
# Resolve project vs user scope
case "$SCOPE" in
  user)   CFG="$HOME/.hivemind/configs.json" ;;
  project|*) CFG="$PWD/.hivemind/configs.json" ;;
esac

# Read & validate before any edit
node -e "const r=require('./dist/schema-kernel/hivemind-configs.schema.js').readConfigs(process.cwd()); console.log(JSON.stringify(r.governance.rules, null, 2))"
```

**Output:** an id / enabled / toolNames / action.type table. If the file is
missing, print "no rules configured" and continue to T2 (the user may be adding
the first rule).

## Turn T2 — Pick an action

Prompt the user to choose one of the 5 sub-actions. Each maps to a distinct
prompt strategy in T3.

```
? What would you like to do?
  1) list        — print the rules table and exit
  2) add         — append a new rule
  3) remove      — delete a rule by id
  4) set-action  — change a rule's action.type in-place
  5) validate    — only run schema validation; no edits
> _
```

On `list` or `validate` the workflow exits after T1 / T4 respectively.

## Turn T3 — Prompt for fields (per-action)

For `add` / `set-action` collect the rule fields. For `remove` only the id is
required. The prompts differ per action.

### T3a — `add` flow

```text
Rule id (e.g. R5-block-bash):               _
Tool names (comma-separated, e.g. bash,write): _
Action type [allow|warn|block|escalate|needs_jit_grant]: _
Optional depth (min,max — blank for none):   _
Enabled? [Y/n]:                              _
```

### T3b — `set-action` flow

```text
Rule id to update:                    _
New action.type [allow|warn|block|escalate|needs_jit_grant]: _
```

### T3c — `remove` flow

```text
Rule id to remove:                    _
? Confirm delete? [y/N]:              _
```

For each flow, build a candidate rule object in memory — do NOT mutate the file
yet. Use the shape from `assets/templates/config-rules.template.json` so the
new rule matches the existing schema.

## Turn T4 — Validate

Run the schema validator against the candidate config. If it fails, print the
issue path (e.g. `governance.rules[3].action.type`) and the human message from
the Zod error, then **exit non-zero** without writing.

```ts
import { validateConfigsFile } from "hivemind/schema-kernel/hivemind-configs.schema"

const result = validateConfigsFile(projectRoot)
if (!result.success) {
  console.error(`[Harness] Config validation failed: ${result.error}`)
  process.exit(2)
}
```

The `validateConfigsFile` function is the canonical Zod-driven check (entry
point at `src/schema-kernel/hivemind-configs.schema.ts`). The `--validate` flag
calls only this turn and exits 0 on success, 2 on failure.

## Turn T5 — Show before/after diff + confirm

Construct the candidate JSON, diff it against the current file, and require
explicit user confirmation. The diff is a side-by-side JSON comparison — never
mutate the file before the user approves.

```bash
# Build candidate in memory, then show diff
diff -u "$CFG" <(echo "$CANDIDATE_JSON") | less -R

# Confirmation gate
? Apply this change to $CFG? [y/N]: _
```

If the user declines or `--dry-run` is set, print "no changes written" and exit 0.
If the user approves, proceed to T6.

## Turn T6 — Atomic write + reset engine

Write the new config atomically (write to temp file, fsync, rename) and
invalidate the singleton so the next tool event evaluates against the new
rules. Both steps are mandatory — leaving the singleton stale would cause
the engine to keep using the old rules.

```ts
import { writeFileSync, renameSync } from "node:fs"
import { resetToolIntelligenceEngine } from "hivemind/features/tool-intelligence"

// Atomic write: temp + rename
const tmp = `${cfgPath}.${process.pid}.tmp`
writeFileSync(tmp, candidateJson, { encoding: "utf-8" })
renameSync(tmp, cfgPath)

// Invalidate singleton so the next event picks up the new rules
resetToolIntelligenceEngine()
```

If `resetToolIntelligenceEngine` is unavailable in the runtime path (e.g. the
config is for a tool that does not consume the engine), skip the reset
silently. The reset is idempotent.

## Turn T7 — Suggest atomic commit

Suggest a one-line atomic commit message per rule change. The user reviews
and runs `git add` + `git commit` themselves; the workflow does not auto-commit.

```text
Suggested commit:
  feat(config): add rule R5-block-bash (action.type=block)

  - rule id: R5-block-bash
  - toolNames: [bash, write]
  - action: block
  - files: .hivemind/configs.json

Run:
  git add .hivemind/configs.json
  git commit -m "feat(config): add rule R5-block-bash (action.type=block)"
```

If the user is not in a git repo (or the config is in user scope `~/.hivemind/`),
skip the suggestion.

## Exit Criteria

- File written only after validation passes and the user confirms the diff.
- `validateConfigsFile` returns `success: true` after every change.
- The ToolIntelligenceEngine singleton is reset on every write.
- Every change is suggested as a single atomic commit.
- `--dry-run` exits 0 without writing.
- `--validate` exits 0 (valid) or 2 (invalid) without writing.

## Failure Modes

- **Unknown rule id** (T3b / T3c) — print the available ids and exit non-zero.
- **Invalid action.type** (T3a / T3b) — print the valid set
  (`allow | warn | block | escalate | needs_jit_grant`) and exit non-zero.
- **JSON parse error** in the existing file — quarantine via
  `.hivemind/quarantine/<ts>-configs.json` and offer rollback.
- **Schema validation fails** (T4) — print the Zod issue path, do not write.
- **Write fails** (T6) — leave the original file untouched, exit non-zero.
- **Singleton reset unavailable** (T6) — log a warning, do not fail.

## GSD Compatibility

`gsd-*` workflows (`gsd-prompt-guard`, `gsd-state`, `gsd-tools`) are
**deprecated** for runtime config governance. Use the `hm-config-govern`
command + this workflow + the `hm-config-governance` skill + the
`hm-platform-references` agent instead. The `gsd-*` primitives are dev
tooling only and are NOT part of the config-governance surface. New
config-governance work MUST go through the `hm-*` surface.
