# OpenCode Command Documentation — Fetched Summary

**Generated:** 2026-05-10  
**Source:** https://opencode.ai/docs/commands/ (fetched live)  
**Cross-references:** https://opencode.ai/docs/agents/, https://opencode.ai/docs/plugins/, https://opencode.ai/docs/skills/

---

## Docs Page: Commands

**URL:** https://opencode.ai/docs/commands/  
**Date Fetched:** 2026-05-10  
**Format:** Markdown, live from opencode.ai

### Summary of Content

The official OpenCode command documentation covers:

#### Where Commands Live
- **Project commands:** `.opencode/commands/` directory in the project root
- **Global commands:** `~/.config/opencode/commands/` for user-wide commands
- Commands are files with `.md` extension containing YAML frontmatter

#### Configuration Methods

**Method 1: opencode.json (JSON)**
```json
{
  "command": {
    "mycommand": {
      "template": "Do the thing with $ARGUMENTS",
      "description": "Brief description",
      "agent": "general",
      "model": "claude-sonnet-4-20250514",
      "subtask": true
    }
  }
}
```

**Method 2: Markdown Files (YAML frontmatter)**
```yaml
---
description: Brief description
agent: my-agent
model: claude-sonnet-4-20250514
subtask: true
---
Do the thing with $ARGUMENTS and check @file.js
```

#### Supported Config Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `template` | ✅ (for JSON config) | string | The prompt content. What the agent sees. |
| `description` | ❌ | string | Brief description shown in TUI. |
| `agent` | ❌ | string | Which agent executes the command. If subagent, triggers subagent invocation. |
| `model` | ❌ | string | Override the default model for this command. |
| `subtask` | ❌ | boolean | Forces subagent invocation to isolate context. |

#### Argument Handling
- **`$ARGUMENTS`** — Captures all user-provided arguments as a single string
- **`$1`, `$2`, `$3`** — Positional arguments for individual arg access

#### Shell Output Injection
- `` `!command` `` — Executes the command in bash and injects stdout into the prompt
- Example: `` The git status is `!git status` ``

#### File References
- `@path/to/file.ts` — Includes the full content of the referenced file in the prompt
- Can reference multiple files

#### Built-in Commands
- `/init` — Initialize a new OpenCode project
- `/undo` — Undo the last action
- `/redo` — Redo the last undone action
- `/share` — Share the current session
- `/help` — Display help information

#### Custom Override of Built-ins
- Custom commands can override built-in command names
- If a custom command matches a built-in name, the custom version takes precedence

---

## Docs Page: Agents

**URL:** https://opencode.ai/docs/agents/  
**Date Fetched:** 2026-05-10

### Command-Relevant Sections

#### Subagents
- Subagents are isolated agent instances with their own context window
- Created by setting `subtask: true` on a command or agent configuration
- Subagents have their own tool permissions and model settings
- Linked from the commands page: when `agent` field specifies a subagent AND `subtask: true`, the command triggers subagent invocation

#### Agent Config Fields Relevant to Commands
| Field | Description | Command Interaction |
|-------|-------------|---------------------|
| `mode` | `primary` or `subagent` | If agent mode is `subagent`, command with that agent uses subagent isolation |
| `permission` | Tool permission rules (glob patterns) | Controls what tools are available during command execution |
| `steps` | Array of steps (prompts) the agent executes | Can be triggered from commands |
| `hidden` | Boolean — hide from TUI | Affects command agent discovery |
| `color` | Hex color for TUI | Affects command agent display |
| `task` | Task-specific configuration | Sub-agents only |

---

## Docs Page: Plugins

**URL:** https://opencode.ai/docs/plugins/  
**Date Fetched:** 2026-05-10

### Command-Relevant Sections

#### Plugin Events Related to Commands
- `command.executed` — Fired when a command finishes execution
- `tui.command.execute` — Fired when a command is about to execute in the TUI

#### Custom Tools
- Created via the `tool()` helper from `@opencode-ai/plugin` SDK
- Custom tools are available to agents and commands
- Tools use Zod schemas for parameter validation

#### Plugin Structure
```typescript
import { tool, hook } from "@opencode-ai/plugin"

export default {
  tools: [
    tool({
      name: "my-tool",
      description: "Does something",
      parameters: { /* Zod schema */ },
      async execute(params) { /* implementation */ }
    })
  ],
  hooks: [
    hook("command.executed", async (event) => { /* handler */ })
  ]
}
```

---

## Docs Page: Skills

**URL:** https://opencode.ai/docs/skills/  
**Date Fetched:** 2026-05-10

### Command-Relevant Sections

- Skills are loaded via the `skill` tool
- Commands can trigger skill loading when skill names appear in the command template
- Skills provide specialized workflows that agents follow
- Skills are `.md` files with YAML frontmatter in `.opencode/skills/` or configured in `opencode.json`

---

## Additional Findings from Web Search

### Search Query Results
- `"opencode.ai slash commands documentation"` → Returned the main commands page
- `"opencode command arguments syntax"` → Confirmed $ARGUMENTS and positional args
- `"opencode command YAML frontmatter"` → Confirmed Markdown config method
- `"opencode command stacking chaining"` → No results found — **not documented**

### Key Observations
1. **OpenCode's command system is simpler than Claude Code's.** OpenCode has 5 config fields (template, description, agent, model, subtask). Claude Code has 7+ (adds allowed-tools, argument-hint, disable-model-invocation).
2. **Command chaining/stacking does not exist in official docs** — no mention of running commands in sequence or pipeline.
3. **No command composition patterns** — cannot build commands from sub-commands.
4. **Plugin hooks for commands exist** but are only briefly mentioned without deep workflow examples.
5. **No command testing framework** or validation methodology documented.
6. **No conditional logic** built into the command system — `$IF()` exists only in Claude Code plugins.

---

**Evidence:** All content based on live fetches from opencode.ai on 2026-05-10 using web-search-prime_web_search_prime and webfetch tools.
