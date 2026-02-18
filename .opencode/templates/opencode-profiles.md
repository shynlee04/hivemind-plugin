# OpenCode Profile Configuration Guide

## Quick Start

When you run `npx hivemind init`, you'll be asked to select a profile. This sets up your OpenCode configuration automatically.

## Profiles

| Profile | Governance | Automation | Permissions | Best For |
|---------|------------|------------|-------------|----------|
| **Beginner** | assisted | assisted | edit: ask, write: ask, bash: ask | Learning to code with AI |
| **Intermediate** | assisted | assisted | edit: allow, write: allow, bash: ask | Comfortable with AI tools |
| **Advanced** | permissive | guided | all: allow | Experienced developers |
| **Expert** | permissive | manual | all: allow | Senior developers |
| **Coach** | strict | coach | all: ask | Maximum hand-holding |

## Customizing After Init

Edit your `opencode.json` to override any settings:

```json
{
  "permission": {
    "edit": "allow",
    "bash": {
      "git push": "ask",
      "*": "allow"
    }
  }
}
```

## Agent-Specific Configuration

Each agent can have custom settings:

```json
{
  "agent": {
    "build": {
      "model": "anthropic/claude-sonnet-4-20250514",
      "tools": { "write": true, "edit": true }
    },
    "plan": {
      "tools": { "write": false, "edit": false }
    }
  }
}
```

## HiveMind Custom Tools

These tools are available after installing the plugin:

- `declare_intent` - Start a focused work session
- `map_context` - Update current focus
- `compact_session` - Archive and summarize session
- `scan_hierarchy` - Check session state
- `think_back` - Deep context recovery
- `save_anchor` - Store immutable facts
- `save_mem` / `recall_mems` - Persistent memory
- `hierarchy_manage` - Manage decision tree
- `export_cycle` - Capture subagent results

## Permission Values

| Value | Behavior |
|-------|----------|
| `allow` | Always permitted without asking |
| `ask` | Asks for confirmation before each action |
| `deny` | Blocks the action entirely |

## Bash Command Patterns

You can configure bash permissions by command pattern:

```json
{
  "bash": {
    "git push": "ask",
    "git push --force": "deny",
    "rm -rf *": "ask",
    "npm publish": "ask",
    "*": "allow"
  }
}
```

The `*` wildcard matches any command not explicitly listed.