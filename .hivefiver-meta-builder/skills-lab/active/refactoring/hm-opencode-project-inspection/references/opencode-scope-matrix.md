# OpenCode Scope Matrix

Source freshness: official OpenCode docs fetched 2026-04-25 (`/docs/agents/`, `/docs/commands/`, `/docs/config/`, `/docs/rules/`). Refresh if this file is older than the project's freshness policy.

## Discovery Surfaces

| Surface | Project source | Global/source override | Notes |
|---------|----------------|------------------------|-------|
| Agents | `.opencode/agents/*.md`; `opencode.json.agent` | `~/.config/opencode/agents/`; `OPENCODE_CONFIG_DIR` agents | Markdown file name becomes agent name; JSON can define mode/model/tools/prompt. |
| Commands | `.opencode/commands/*.md`; `opencode.json.command` | `~/.config/opencode/commands/`; `OPENCODE_CONFIG_DIR` commands | Supports `$ARGUMENTS`, `$1`, shell output with `!\`command\``, and `@file` references. |
| Config | `opencode.json` in project or nearest git root | Remote config, global config, `OPENCODE_CONFIG`, `OPENCODE_CONFIG_CONTENT`, managed config | Later precedence overrides earlier conflicting keys; non-conflicting settings merge. |
| Rules | `AGENTS.md`; fallback `CLAUDE.md`; `opencode.json.instructions` | `~/.config/opencode/AGENTS.md`; fallback `~/.claude/CLAUDE.md` | First local match wins; custom instructions are combined. |

## Inspection Rule

Report effective scope and precedence. Do not claim a project is missing a concept until every official location and configured override path has been checked or explicitly marked unavailable.
