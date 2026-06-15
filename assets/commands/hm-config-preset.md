---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "List and apply configuration presets — pre-configured settings for common workflows"
argument-hint: "[<preset-name>] [--list] [--scope project|user] [--dry-run]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["preset-applied"]
tools:
  read: true
  write: true
  bash: true
  question: true
---


<objective>
List available configuration presets and apply one to `.hivemind/configs.json`.

Presets provide pre-configured settings for common workflows:
- **default** — Balanced settings for most projects (research, plan_check, verifier enabled)
- **expert** — Maximum efficiency, minimal guardrails, full tool access
- **beginner** — Maximum guidance, step-by-step explanations, strict guardrails

Each preset is a partial config merged with schema defaults. The command shows
a preview of what will change and requires confirmation before writing.
</objective>

<examples>

```bash
# List available presets
/hm-config-preset --list

# Apply a preset by name
/hm-config-preset expert
/hm-config-preset beginner
/hm-config-preset default

# Dry-run — show what would change without writing
/hm-config-preset expert --dry-run

# Apply to user-level config
/hm-config-preset default --scope user
```

</examples>

<context>
Arguments: $ARGUMENTS

Parse $ARGUMENTS:
- If `--list` or no arguments: list all available presets with descriptions
- If a preset name is provided (default, expert, beginner): load and apply it
- `--scope project|user`: which config to update (default: project)
- `--dry-run`: show changes without writing

**List mode** (no args or `--list`):
```bash
node -e "
  const { listPresets } = require('./dist/features/bootstrap/preset-loader.js');
  const presets = listPresets();
  if (presets.length === 0) {
    console.log('No presets found in assets/templates/configs-presets/');
  } else {
    console.log('Available presets:');
    for (const p of presets) {
      console.log('  ' + p.name.padEnd(12) + ' — ' + p.description);
    }
  }
"
```

**Apply mode** (preset name provided):
1. **Pre-flight check:** verify `dist/features/bootstrap/preset-loader.js` exists.
   If absent, emit `Run 'npm run build' first` and stop.
2. Load the preset:
   ```bash
   node -e "
     const { loadPreset } = require('./dist/features/bootstrap/preset-loader.js');
     console.log(JSON.stringify(loadPreset('<name>'), null, 2));
   "
   ```
3. Show the preset values in a readable table.
4. Show diff against current `.hivemind/configs.json`.
5. Ask for confirmation: `Apply <preset-name> preset? [y/N]`
6. On confirm: merge preset with current config, validate via schema, atomic write.
7. On decline or `--dry-run`: print "no changes written" and exit 0.
8. Suggest atomic commit:
   ```
   git add .hivemind/configs.json
   git commit -m "chore(config): apply <preset-name> preset"
   ```
</context>

<process>
1. Parse arguments — determine if listing or applying.
2. If listing: run listPresets() and display.
3. If applying: load preset → show preview → confirm → validate → write → suggest commit.
4. Preserve schema validation gate before any write.
</process>
