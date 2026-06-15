---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Launch the 14-turn guided config wizard — walks through ALL fields in .hivemind/configs.json"
argument-hint: "[--scope project|user] [--dry-run] [--from-file <path>]"
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["wizard-complete"]
tools:
  read: true
  write: true
  bash: true
  question: true
---


<objective>
Launch the comprehensive 14-turn config wizard that walks through every field
in `.hivemind/configs.json` (73+ fields across 13 groups).

Each turn explains what the field does, shows example values and their effects,
states the default and why it's recommended, and lets the user skip (accept
default) or customize.

This is the full-featured alternative to the quick `/hm-config` (5-question) flow.
Use when you need to configure fields beyond the common toggles.
</objective>

<examples>

```bash
# Launch wizard for project config (default)
/hm-config-wizard

# Launch wizard for user-level config (~/.hivemind/configs.json)
/hm-config-wizard --scope user

# Dry-run mode — show what would change without writing
/hm-config-wizard --dry-run

# Import from existing config file
/hm-config-wizard --from-file path/to/configs.json
```

</examples>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-config-wizard.md
</execution_context>

<context>
Arguments: $ARGUMENTS

Parse $ARGUMENTS for flags:
- `--scope project|user`: Which config file to edit (default: project)
- `--dry-run`: Show changes without writing
- `--from-file <path>`: Import values from an existing config file

Pass all flags through to the config-wizard workflow.
</context>

<process>
1. Parse flags from $ARGUMENTS.
2. Load and execute the config-wizard workflow end-to-end (14 turns).
3. Preserve all workflow gates (validation, diff preview, confirmation).
</process>
