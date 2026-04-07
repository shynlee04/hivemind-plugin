# OpenCode Platform Reality

## What LLMs Don't Know

OpenCode is NOT a generic AI coding assistant. It's a specific platform with specific capabilities, limitations, and configuration patterns. This document captures what's ACTUALLY true about the platform.

---

## Platform Architecture

### What OpenCode Is

- **Agent coding harness CLI** — the platform/OS for AI-assisted development
- **Plugin system** — loads plugins via `opencode.json` config
- **Skill system** — auto-discovers and loads skills from `.opencode/skills/`
- **Agent system** — loads agent definitions from `.opencode/agents/`
- **Command system** — loads slash commands from `.opencode/commands/`
- **MCP server integration** — connects to external tools via MCP protocol

### What OpenCode Is NOT

- A generic chatbot
- A project builder (that's Hiveminder's domain)
- A static file system (it's a runtime composition engine)

---

## Configuration (opencode.json)

### Structure

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [".opencode/rules/universal-rules.md"],
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "./dist/plugin.js"
  ],
  "permission": {
    "read": "allow",
    "edit": "allow",
    "bash": {
      "*": "allow",
      "git status*": "allow",
      "git log*": "allow",
      "git diff*": "allow",
      "git branch*": "allow"
    },
    "task": "allow",
    "skill": "allow",
    "glob": "allow",
    "grep": "allow",
    "lsp": "allow",
    "doom_loop": "allow"
  },
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  }
}
```

### Key Fields

| Field | Purpose | Notes |
|-------|---------|-------|
| `instructions` | Files loaded as system instructions | Paths relative to repo root |
| `plugin` | Plugins to load | Can be npm packages or local paths |
| `permission` | Tool permissions | Granular control per tool type |
| `compaction` | Context management | Auto-compaction with reserved tokens |

---

## Permission System

### Permission Levels

| Level | Meaning |
|-------|---------|
| `allow` | Always allowed, no prompt |
| `ask` | Prompt user for approval |
| `deny` | Never allowed |

### Bash Permission

Bash permissions can be granular:
```json
"bash": {
  "*": "ask",           // Default: ask for all bash
  "git status*": "allow", // Exception: allow git status
  "npm test*": "allow"    // Exception: allow npm test
}
```

### Non-Interactive Shell Safety

**Banned commands** (TTY-dependent):
- `vim`, `nano`, `less`, `more`, `man`
- `git add -p`, `git rebase -i`
- Any command requiring user input

**Required patterns:**
- Use `-y` / `--yes` / `--no-pager` flags
- Use `CI=true` environment variable
- Use non-interactive alternatives

---

## Compaction System

### How It Works

```
auto: true    → Automatically compact when context is heavy
prune: true   → Remove old messages (not just summarize)
reserved: 10000 → Keep this many tokens reserved for new messages
```

### What Gets Lost

- Old conversation messages
- Subagent outputs not exported to disk
- Intermediate findings not saved
- Task IDs not recorded

### What Survives

- Files written to disk
- Git commits
- Session state files (`.hivemind/state/`)
- Continuity store (`.hivemind/state/continuity.json`)

---

## Plugin System

### Plugin Loading

```json
"plugin": [
  "superpowers@git+https://github.com/obra/superpowers.git",
  "./dist/plugin.js"
]
```

- Plugins are loaded in order
- Each plugin can add tools, hooks, agents
- Plugin paths can be npm packages or local files

### Plugin Structure

```
plugin.ts → Composition root
├── Tools (write-side) → Actions the agent can perform
├── Hooks (read-side) → Events the agent responds to
└── Shared → Types, constants, helpers
```

---

## Skill System

### Skill Discovery

Skills are auto-discovered from:
- `.opencode/skills/*/SKILL.md`
- `.claude/skills/*/SKILL.md`
- Global skills in `~/.agents/skills/`

### Skill Loading

1. Agent sees skill `description` field (trigger phrases)
2. If user query matches trigger phrases → skill is loaded
3. Full SKILL.md content is injected into context
4. References/ and scripts/ are available but not auto-loaded

### Skill Anatomy

```
skill-name/
├── SKILL.md              # Entry point with frontmatter + procedures
├── references/           # Substantive depth files (100+ lines each)
├── scripts/              # Validation scripts (must exit non-zero on failure)
└── templates/            # Optional scaffolds
```

### Frontmatter Standard

```yaml
---
name: skill-name
description: <third-person description with trigger phrases>
metadata:
  layer: "<N>"
  role: "<routing|domain-execution|verification>"
  pattern: P<P1|P2|P3>
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

**Required:** `name`, `description`
**Banned:** `compatibility` (per agentskills.io spec)
**Note:** `allowed-tools` must be YAML list (with `-` prefixes) or omitted

---

## Agent System

### Agent Definition

```yaml
---
description: "What this agent does. Trigger phrases in quotes."
mode: <primary|subagent>
temperature: <0.0-1.0>
steps: <max steps>
instructions: [<file paths>]
permission:
  read: allow|deny
  edit: allow|deny
  bash:
    "*": ask|allow|deny
  task: allow|deny
  skill:
    "*": deny
    "skill-name": allow
---
```

### Agent Modes

| Mode | Use When | Can Use Task Tool |
|------|----------|-------------------|
| **primary** | User-facing, orchestrating | Yes |
| **subagent** | Specialist, spawned by Task tool | No |

### Specialist Subagent Types

**Never use generic agent types.** Always use project-specific specialists:

| Correct | Never Use |
|---------|-----------|
| `hivefiver-skill-author` | `general`, `Explore` |
| `hivefiver-agent-builder` | `Plan`, `Researcher` |
| `critic` | `general`, `Reviewer` |
| `researcher` | `Explore`, `Plan` |
| `builder` | `general`, `Implementer` |

---

## Command System

### Command Definition

Commands are thin shells referencing workflow files:

```yaml
---
description: "What this command does."
agent: <agent-name>
---

!bash
# Command execution logic
```

### Command Anatomy

- `description`: Clear, non-empty command description
- `agent`: Valid reference to registered agent
- `subtask`: Boolean flag for subagent dispatch behavior
- `$ARGUMENTS`: Command arguments (propositional format)
- `!bash`: Bash injection for execution

---

## What LLMs Get Wrong

| Wrong Assumption | Reality |
|-----------------|---------|
| "I can use any tool freely" | Tools require permissions in opencode.json |
| "Bash always works" | Only non-interactive bash is allowed |
| "Context is infinite" | Compaction kicks in at ~70% usage |
| "Skills are always loaded" | Skills load only on trigger phrase match |
| "Agents are independent" | Agents are part of a tiered team |
| "Commands execute directly" | Commands reference workflow files |
| "I can edit .opencode/ files" | Edit in labs. .opencode/ is symlinks. |
| "The platform is static" | Plugins add tools, hooks, agents at runtime |

---

## Runtime State Override

| Environment Variable | Purpose |
|---------------------|---------|
| `OPENCODE_HARNESS_STATE_DIR` | Override state directory path |
| `OPENCODE_HARNESS_CONTINUITY_FILE` | Override continuity file path |
| `OPENCODE_CONFIG_DIR` | Override config directory |
| `OPENCODE_CONFIG` | Override config file path |

---

## Build and Deployment

```bash
npm install                    # Install dependencies
npm run build                  # Clean + compile TypeScript to dist/
npm run typecheck              # Type-check without emitting
npm run test                   # Run all tests (vitest)
npm run test:coverage          # Coverage report
```

- Requires Node.js >= 20.0.0
- Peer dependency: `@opencode-ai/plugin` >= 1.1.0
- Prepack runs build automatically
