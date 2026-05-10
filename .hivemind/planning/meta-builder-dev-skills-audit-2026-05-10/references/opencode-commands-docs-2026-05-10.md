# OpenCode Command Documentation — Fetched Summary

**Generated:** 2026-05-10
**Source:** https://opencode.ai/docs/commands/ (live fetch)
**Cross-refs:** /docs/agents/, /docs/plugins/, /docs/skills/

---

## Commands Page (opencode.ai/docs/commands/)

### Where Commands Live
- `.opencode/commands/` (project) or `~/.config/opencode/commands/` (global)
- Files are `.md` with YAML frontmatter

### Config Methods

**JSON (opencode.json):**
```json
{ "command": { "mycommand": { "template": "...", "description": "...", "agent": "general", "model": "...", "subtask": true } } }
```

**Markdown (YAML frontmatter):**
```yaml
---
description: Brief description
agent: my-agent
model: claude-sonnet-4-20250514
subtask: true
---
Do the thing with $ARGUMENTS and check @file.js
```

### Config Fields

| Field | Required | Description |
|-------|----------|-------------|
| template | ✅ (JSON) | Prompt content |
| description | ❌ | TUI display |
| agent | ❌ | Executing agent |
| model | ❌ | Model override |
| subtask | ❌ | Subagent isolation |

### Argument Handling
- `$ARGUMENTS` — all args as string
- `$1, $2, $3` — positional
- `` `!command` `` — shell injection
- `@path/file.ts` — file reference

### Built-in Commands
`/init`, `/undo`, `/redo`, `/share`, `/help` — can be overridden by custom commands.

---

## Agents Page (opencode.ai/docs/agents/)

### Agent Config for Commands

| Field | Description | Command Interaction |
|-------|-------------|---------------------|
| mode | primary or subagent | subagent mode + subtask:true = isolation |
| permission | Tool permission glob patterns | Controls tools available during command |
| steps | Prompt sequence | Triggerable from commands |
| hidden | Boolean | Affects TUI discovery |
| color | Hex | Affects TUI display |
| task | Task-specific config | Sub-agents only |

---

## Plugins Page (opencode.ai/docs/plugins/)

### Command-Related Plugin Events
- `command.executed` — after command finishes
- `tui.command.execute` — before TUI command execution

### Custom Tools
```typescript
import { tool, hook } from "@opencode-ai/plugin"
export default {
  tools: [tool({ name: "my-tool", parameters: { /* Zod */ }, async execute(params) {} })],
  hooks: [hook("command.executed", async (event) => {})]
}
```

---

## Skills Page (opencode.ai/docs/skills/)

- Skills loaded via `skill` tool
- Commands can reference skill names to trigger loading
- Skills are `.md` files in `.opencode/skills/` or configured in `opencode.json`

---

## Web Search Findings

| Query | Result |
|-------|--------|
| "opencode slash commands docs" | → Commands main page |
| "opencode command arguments syntax" | → $ARGUMENTS + positional |
| "opencode command yaml frontmatter" | → Markdown config |
| "opencode command stacking chaining" | → **No results** — not documented |

### Key Gaps in Official Docs
1. No command chaining/stacking/pipelining
2. No command composition (sub-commands)
3. No conditional logic ($IF)
4. No command testing framework
5. No command validation methodology
6. Plugin hooks mentioned but not deeply documented
7. No command↔MCP integration documented

**Evidence:** All content from live fetches on 2026-05-10 via web-search-prime_web_search_prime and webfetch.
