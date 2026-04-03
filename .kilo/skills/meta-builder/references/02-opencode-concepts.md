# OpenCode Concepts — Conditional Reference

**Do NOT read this file unless the user's request involves OpenCode configuration.**

Read this file only when the user mentions: agents, commands, tools, skills, permissions, custom tools, MCP servers, LSP servers, rules, or configs.

For skill creation, agent authoring, or workflow design — skip this file and route to the appropriate authoring skill.

---

## Quick Concept Index

| Concept | Read When User Says | Route To |
|---------|-------------------|----------|
| **Agents** | "create agent", "configure agent", "subagent", "agent permissions" | `opencode-platform-reference` |
| **Commands** | "custom command", "/my-command", "command template", "$ARGUMENTS" | `opencode-platform-reference` |
| **Tools** | "restrict tool", "enable tool", "disable tool", "tool permissions" | `opencode-platform-reference` |
| **Skills** | "skill permissions", "skill discovery", "skill loading" | `use-authoring-skills` |
| **Permissions** | "permission", "allow", "deny", "ask", "pattern matching" | `opencode-platform-reference` |
| **Custom Tools** | "tool()", ".opencode/tools/", "custom function", "TypeScript tool" | `opencode-tool-architect` |
| **MCP Servers** | "MCP", "Model Context Protocol", "external tool", "OAuth" | `opencode-platform-reference` |
| **LSP Servers** | "LSP", "language server", "code intelligence" | `opencode-platform-reference` |
| **Rules** | "AGENTS.md", "instructions", "custom rules", "project rules" | `opencode-platform-reference` |
| **Configs** | "opencode.json", "config", "settings", "environment variables" | `opencode-platform-reference` |

---

## Agents

**Definition:** Specialized AI assistants configured for specific tasks.

**Types:**
- **Primary agents** — main assistants (Build, Plan). Cycle with Tab key.
- **Subagents** — specialized assistants invoked by primary agents or @ mention (General, Explore).

**Configuration locations:**
- JSON: `opencode.json` → `"agent": { "name": { ... } }`
- Markdown: `.opencode/agents/<name>.md` or `~/.config/opencode/agents/<name>.md`

**Key options:** `description` (required), `mode` (primary|subagent|all), `model`, `temperature`, `steps`, `permission`, `hidden`, `color`, `top_p`.

**Permission pattern:**
```json
{
  "agent": {
    "reviewer": {
      "description": "Code review without edits",
      "mode": "subagent",
      "permission": { "edit": "deny", "bash": { "*": "ask", "git *": "allow" } }
    }
  }
}
```

---

## Commands

**Definition:** Custom commands invoked with `/command-name` in the TUI.

**Configuration locations:**
- Markdown: `.opencode/commands/<name>.md` or `~/.config/opencode/commands/<name>.md`
- JSON: `opencode.json` → `"command": { "name": { ... } }`

**Placeholders:**
- `$ARGUMENTS` — all arguments as one string
- `$1`, `$2`, `$3` — positional arguments
- `` !`command` `` — inject shell output
- `@file` — include file content

**Example:**
```markdown
---
description: Run tests with coverage
agent: build
---

Run the full test suite: !`npm test`
Focus on failing tests and suggest fixes.
```

---

## Permissions

**Definition:** Control which actions require approval, are allowed, or are blocked.

**Values:** `"allow"` (run without approval), `"ask"` (prompt), `"deny"` (block).

**Rule order:** Last matching rule wins. Put catch-all `*` first, specific rules after.

**Available keys:** `read`, `edit`, `glob`, `grep`, `list`, `bash`, `task`, `skill`, `lsp`, `question`, `webfetch`, `websearch`, `codesearch`, `external_directory`.

**Skill permissions:**
```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

---

## Custom Tools

**Definition:** User-defined functions the Agent can call alongside built-in tools.

**Location:** `.opencode/tools/<name>.ts` or `~/.config/opencode/tools/<name>.ts`

**Structure:**
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Tool description",
  args: { param: tool.schema.string().describe("Parameter description") },
  async execute(args, context) {
    return `Result: ${args.param}`
  },
})
```

**Multiple exports:** `<filename>_<exportname>` naming.

---

## MCP Servers

**Definition:** External tool integrations via Model Context Protocol.

**Types:** `local` (command-based) or `remote` (URL-based).

**Management CLI:** `opencode mcp list`, `opencode mcp auth <name>`, `opencode mcp debug <name>`.

---

## LSP Servers

**Definition:** Language Server Protocol for code intelligence.

**Built-in:** 40+ servers auto-detected by file extension.

**Operations:** goToDefinition, findReferences, hover, documentSymbol, workspaceSymbol.

---

## Rules

**Definition:** Custom instructions guiding Agent behavior.

**Locations (precedence order):**
1. Project `AGENTS.md` (walks up from CWD to git worktree)
2. Global `~/.config/opencode/AGENTS.md`
3. Claude Code compatible: `CLAUDE.md` fallback

**Custom instructions:** `instructions` array in `opencode.json` for additional files or remote URLs.

---

## Configs

**Definition:** Platform-wide settings in `opencode.json`.

**Precedence:** Remote → Global → Custom (env) → Project → `.opencode/` → Inline (env). Later overrides earlier for conflicts; non-conflicting keys merge.

**Variable substitution:** `{env:VAR_NAME}` for environment variables, `{file:path}` for file contents.

---

## Concept Interdependencies

```
Configs (opencode.json)
  ├── defines → Agents, Commands, MCP, LSP, Permissions
  ├── references → Rules (instructions), Skills (permissions)
  └── overrides → Global defaults

Agents
  ├── use → Tools, Skills, Permissions, Custom Tools
  └── configured in → Configs, Markdown files

Permissions
  ├── control → Tools, Skills, Tasks
  └── defined in → Configs, Agent markdown
```
