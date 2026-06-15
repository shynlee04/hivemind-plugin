---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Configure Hivemind settings — wizard, presets, workflow toggles, advanced knobs, integrations, and model profile"
argument-hint: "[--wizard | --preset <name> | --advanced | --integrations | --profile <name>]"
requires: ["hm-code-review", "hm-review", "hm-settings"]
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  write: true
  bash: true
  question: true
---


<objective>
Configure Hivemind settings interactively with a single consolidated command.

Mode routing:
- **default** (no flag): Common-case toggles (model, research, plan_check, verifier, branching) → settings workflow
- **--wizard**: Full 14-turn guided config wizard covering ALL 73+ fields → config-wizard workflow
- **--preset &lt;name&gt;**: Apply a pre-configured preset (default, expert, beginner) → config-preset workflow
- **--advanced**: Power-user knobs (planning tuning, timeouts, branch templates, cross-AI execution) → settings-advanced workflow
- **--integrations**: Third-party API keys, code-review CLI routing, agent-skill injection → settings-integrations workflow
- **--profile &lt;name&gt;**: Switch model profile (quality|balanced|budget|inherit) → set-profile (inline)
</objective>

<routing>

| Flag | Action | Workflow |
|------|--------|----------|
| (none) | Interactive 5-question common-case config prompt | settings |
| --wizard | Full 14-turn guided wizard for ALL configs.json fields | config-wizard |
| --preset &lt;name&gt; | Apply preset (default, expert, beginner) with confirmation | config-preset |
| --advanced | Power-user knobs: planning, execution, discussion, cross-AI, git, runtime | settings-advanced |
| --integrations | API keys (Brave/Firecrawl/Exa), review CLI routing, agent skills | settings-integrations |
| --profile &lt;name&gt; | Switch model profile without interactive prompt | hm-sdk config-set-model-profile |

</routing>

<examples>

```bash
# Quick toggles (model, research, plan_check, verifier, branching)
/hm-config

# Full guided wizard — walks through ALL 73+ fields across 13 groups
/hm-config --wizard

# Apply a preset with confirmation
/hm-config --preset expert
/hm-config --preset beginner
/hm-config --preset default

# Power-user advanced knobs
/hm-config --advanced

# Third-party integrations
/hm-config --integrations

# Switch model profile
/hm-config --profile quality
```

</examples>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-settings.md
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-settings-advanced.md
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-settings-integrations.md
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-config-wizard.md
</execution_context>

<context>
Arguments: $ARGUMENTS

Parse the first token of $ARGUMENTS:
- If it is `--wizard`: strip the flag, execute config-wizard workflow (14-turn guided wizard)
- If it starts with `--preset`: extract the preset name (remainder after `--preset`), then:
  1. **Pre-flight check:** verify `dist/features/bootstrap/preset-loader.js` exists.
     If absent, emit `Run 'npm run build' first` and stop.
  2. List available presets via `node -e "const {listPresets} = require('./dist/features/bootstrap/preset-loader.js'); console.log(JSON.stringify(listPresets(), null, 2))"`.
  3. Load the named preset via `node -e "const {loadPreset} = require('./dist/features/bootstrap/preset-loader.js'); console.log(JSON.stringify(loadPreset('<name>'), null, 2))"`.
  4. Show the preset values and ask for confirmation before writing to `.hivemind/configs.json`.
  5. If no preset name provided, list available presets and prompt user to choose one.
- If it is `--advanced`: strip the flag, execute settings-advanced workflow
- If it is `--integrations`: strip the flag, execute settings-integrations workflow
- If it starts with `--profile`: extract the profile name (remainder after `--profile`), then:
  1. **Pre-flight check (#2439):** verify `hm-sdk` is on PATH via `command -v hm-sdk`.
     If absent, emit the install hint `Install Hivemind via 'npm i -g hivemind'` and stop —
     do NOT invoke `hm-sdk` directly (avoids the opaque `command not found: hm-sdk` failure).
  2. Run: `hm-sdk query config-set-model-profile <profile-name> --raw` and display the output verbatim.
- Otherwise: execute settings workflow (no argument needed)
</context>

<process>
1. Parse the leading flag (if any) from $ARGUMENTS.
2. Load and execute the appropriate workflow end-to-end, or run the inline SDK command for --profile.
3. Preserve all workflow gates from the target workflow.
</process>
