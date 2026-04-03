# OpenCode Concepts

Overview of the 10 OpenCode meta concepts that power the harness framework. Each concept is summarized with its purpose, key configuration patterns, and how it maps to skill triggers.

---

## Concept Map

```
OpenCode Platform
├── Agents          → Specialized AI assistants (primary + subagent)
├── Commands        → Reusable prompt templates (/my-command)
├── Tools           → Built-in capabilities (read, write, bash, etc.)
├── Skills          → Reusable behavior definitions (SKILL.md)
├── Permissions     → Access control (allow, ask, deny)
├── Custom Tools    → User-defined functions (tool() helper)
├── MCP Servers     → External tool integrations (Model Context Protocol)
├── LSP Servers     → Code intelligence (Language Server Protocol)
├── Rules           → Custom instructions (AGENTS.md)
└── Configs         → Platform settings (opencode.json)
```

---

## 1. Agents

**Purpose:** Specialized AI assistants configured for specific tasks and workflows.

**Key Concepts:**
- **Primary agents** — main assistants (Build, Plan). Full or restricted tool access.
- **Subagents** — specialized assistants invoked by primary agents or @ mention (General, Explore).
- **Configuration** — JSON in `opencode.json` or markdown files in `.opencode/agents/`.
- **Options** — model, temperature, steps, prompt, tools/permissions, mode, hidden, color, top_p.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Create a code review agent" | `use-authoring-agents` (future) |
| "Configure agent permissions" | This skill → permissions concept |
| "Set up a subagent for docs" | `use-authoring-agents` (future) |

**Key Config Pattern:**
```json
{
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for quality",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "permission": { "edit": "deny", "bash": "ask" }
    }
  }
}
```

---

## 2. Commands

**Purpose:** Custom commands for repetitive tasks, invoked with `/command-name`.

**Key Concepts:**
- **Definition** — markdown files in `.opencode/commands/` or JSON in `opencode.json`.
- **Placeholders** — `$ARGUMENTS`, `$1`, `$2`, `!command` (shell output), `@file` (file reference).
- **Options** — template, description, agent, model, subtask.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Create a /test command" | `use-authoring-commands` (future) |
| "Add shell output to command" | `use-authoring-commands` (future) |
| "Override a built-in command" | This skill → commands concept |

---

## 3. Tools (Built-in)

**Purpose:** Core capabilities the Agent can use during execution.

**Available Tools:**
| Tool | Purpose | Permission Key |
|------|---------|----------------|
| `bash` | Execute shell commands | bash |
| `edit` | Modify existing files | edit |
| `write` | Create/overwrite files | edit |
| `read` | Read file contents | read |
| `grep` | Search file contents | grep |
| `glob` | Find files by pattern | glob |
| `list` | List directory contents | list |
| `lsp` | Code intelligence queries | lsp |
| `patch` | Apply patches | edit |
| `skill` | Load skill definitions | skill |
| `todowrite` | Manage task lists | todowrite |
| `webfetch` | Fetch web content | webfetch |
| `websearch` | Search the web | websearch |
| `question` | Ask user questions | question |

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Restrict tool access" | This skill → permissions concept |
| "Enable web search" | This skill → tools concept |
| "Disable a built-in tool" | This skill → permissions concept |

---

## 4. Skills

**Purpose:** Reusable behavior definitions loaded on-demand via the `skill` tool.

**Key Concepts:**
- **Location** — `.opencode/skills/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md`, or global paths.
- **Discovery** — OpenCode walks up from CWD to git worktree, loading all matching `skills/*/SKILL.md`.
- **Frontmatter** — `name` (required, max 64 chars), `description` (required, max 1024 chars).
- **Permissions** — Pattern-based: `"*": "allow"`, `"internal-*": "deny"`.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Write a new skill" | `use-authoring-skills` |
| "Configure skill permissions" | This skill → permissions concept |
| "Why isn't my skill loading?" | This skill → skills troubleshooting |

---

## 5. Permissions

**Purpose:** Control which actions require approval, are allowed, or are blocked.

**Key Concepts:**
- **Actions** — `"allow"` (run without approval), `"ask"` (prompt), `"deny"` (block).
- **Granular rules** — Object syntax with pattern matching: `"git *": "allow"`.
- **Rule order** — Last matching rule wins. Put catch-all `*` first, specific rules after.
- **Wildcards** — `*` matches zero or more characters, `?` matches exactly one.
- **External directories** — `external_directory` for paths outside working directory.
- **Agent overrides** — Per-agent permissions merge with and override global defaults.

**Available Permission Keys:**
`read`, `edit`, `glob`, `grep`, `list`, `bash`, `task`, `skill`, `lsp`, `question`, `webfetch`, `websearch`, `codesearch`, `external_directory`, `doom_loop`

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Set up permissions for my agent" | This skill → permissions concept |
| "Allow only git commands" | This skill → permissions concept |
| "Block file edits" | This skill → permissions concept |

---

## 6. Custom Tools

**Purpose:** User-defined functions the Agent can call, alongside built-in tools.

**Key Concepts:**
- **Definition** — TypeScript/JavaScript files in `.opencode/tools/` or `~/.config/opencode/tools/`.
- **Helper** — `tool()` from `@opencode-ai/plugin` provides type-safety and validation.
- **Schema** — `tool.schema` (Zod) for argument types.
- **Context** — Receives `agent`, `sessionID`, `messageID`, `directory`, `worktree`.
- **Naming** — Filename becomes tool name. Multiple exports: `<filename>_<exportname>`.
- **Override** — Custom tools with same name as built-in tools take precedence.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Create a custom tool" | `use-authoring-tools` (future) |
| "Write a tool in Python" | `use-authoring-tools` (future) |
| "Override the bash tool" | This skill → custom tools concept |

---

## 7. MCP Servers

**Purpose:** External tool integrations via Model Context Protocol.

**Key Concepts:**
- **Types** — `local` (command-based) or `remote` (URL-based).
- **Local config** — `command` array, `environment` variables, `timeout`.
- **Remote config** — `url`, `headers`, `oauth` (automatic or pre-registered).
- **Management** — `opencode mcp list`, `opencode mcp auth <name>`, `opencode mcp debug <name>`.
- **Glob patterns** — `"my-mcp*": false` to disable all matching MCPs.
- **Per-agent** — Disable globally, enable per-agent for selective access.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Add a GitHub MCP server" | This skill → MCP concept |
| "Configure OAuth for MCP" | This skill → MCP concept |
| "Disable MCP for specific agent" | This skill → MCP concept |

---

## 8. LSP Servers

**Purpose:** Language Server Protocol integration for code intelligence.

**Key Concepts:**
- **Built-in** — 40+ servers for TypeScript, Python, Rust, Go, etc.
- **Auto-detection** — Enabled when file extensions match and requirements are met.
- **Operations** — goToDefinition, findReferences, hover, documentSymbol, workspaceSymbol, etc.
- **Custom** — Add custom LSP servers with `command` and `extensions`.
- **Disable** — `lsp: false` globally, or `disabled: true` per server.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Enable LSP for my language" | This skill → LSP concept |
| "Configure TypeScript LSP" | This skill → LSP concept |
| "Disable all LSP servers" | This skill → LSP concept |

---

## 9. Rules

**Purpose:** Custom instructions that guide Agent behavior.

**Key Concepts:**
- **Primary file** — `AGENTS.md` in project root.
- **Locations** — Project (`AGENTS.md`), global (`~/.config/opencode/AGENTS.md`), Claude Code compatible (`CLAUDE.md` fallback).
- **Precedence** — Local files by traversing up → global → Claude Code fallback. First matching file wins per category.
- **Custom instructions** — `instructions` array in `opencode.json` for additional files or remote URLs.
- **External file references** — Use `@file` pattern in AGENTS.md to teach Agent to load files on demand.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Write AGENTS.md for my project" | This skill → rules concept |
| "Add custom instructions" | This skill → rules concept |
| "Set up project rules" | This skill → rules concept |

---

## 10. Configs

**Purpose:** Platform-wide settings in `opencode.json`.

**Key Concepts:**
- **Precedence** — Remote → Global → Custom (env) → Project → `.opencode/` → Inline (env). Later overrides earlier for conflicts; non-conflicting keys merge.
- **Format** — JSON or JSONC (with comments).
- **Variable substitution** — `{env:VAR_NAME}` for environment variables, `{file:path}` for file contents.
- **TUI config** — Separate `tui.json` for UI settings (theme, keybinds, scroll speed).
- **Key sections** — model, provider, agent, command, mcp, lsp, permission, plugin, instructions, formatter, watcher, compaction, snapshot, autoupdate, share, server.

**Trigger Mapping:**
| User Says | Route To |
|-----------|----------|
| "Configure my OpenCode setup" | This skill → configs concept |
| "Set up environment variables" | This skill → configs concept |
| "Change the default model" | This skill → configs concept |

---

## Concept Interdependencies

Concepts do not exist in isolation. They reference and depend on each other:

```
Configs (opencode.json)
  ├── defines → Agents, Commands, MCP, LSP, Permissions, Plugins
  ├── references → Rules (instructions), Skills (permissions)
  └── overrides → Global defaults, remote configs

Agents
  ├── use → Tools, Skills, Permissions, Custom Tools
  ├── invoke → Subagents, Commands
  └── configured in → Configs, Markdown files

Permissions
  ├── control → Tools, Skills, Tasks, External Directories
  ├── override → Per-agent, per-command
  └── defined in → Configs, Agent markdown

Skills
  ├── loaded by → skill tool (controlled by permissions)
  ├── discovered in → .opencode/skills/, .agents/skills/
  └── reference → All other concepts (as knowledge)
```

---

## Cross-References

| Reference | Relationship |
|-----------|-------------|
| `references/01-routing-logic.md` | How these concepts map to routing decisions |
| `references/03-stacking-rules.md` | How to combine concepts in advanced stacks |
| `SKILL.md` (parent) | The concept integration table |
| OpenCode docs | Source material: `.skills-lab/refactoring-skills/users-prompting-workspace-resources/opencode/` |
