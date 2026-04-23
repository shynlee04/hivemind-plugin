---
name: hm-opencode-platform-reference
description: This skill should be used when needing OpenCode platform capabilities — agents, plugins, tools, SDK, permissions, skills, commands, configs, MCP servers, rules, or models. Triggers on: "OpenCode agents", "OpenCode SDK", "plugin hooks", "tool definitions", "permission model", "MCP server config", "OpenCode architecture". Essential reference for building harness systems.
metadata:
  layer: "3"
  role: "reference"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Grep
  - Glob
---

## 6-NON Defence Table

| NON | Defence |
|-----|---------|
| NON-1 | 20 reference files mapped from actual OpenCode platform documentation and source code; Key Composition Patterns section synthesizes 3 canonical patterns (Permission Cascading, Tool Hook Pipeline, Agent-Skill Two-Phase Loading) from live platform behavior |
| NON-2 | Cross-References table maps boundaries to command-dev (writes vs. lists), non-interactive-shell (execution safety vs. capability reference), meta-builder (routes vs. provides content) |
| NON-3 | Reference Files table defines entry conditions for each of 20 files; Anti-Patterns define 4 misuse exits (Memorizer, Outdated Citer, Over-Loader, Assumer) |
| NON-4 | metadata.layer="3", role="reference", pattern="P2", version="1.0.0" declared; description has trigger exclusions |
| NON-5 | Anti-Patterns table provides 4 eval scenarios (Memorizer, Outdated Citer, Over-Loader, Assumer) with Detection/Correction columns; 20 reference files provide depth coverage for spot-checking |
| NON-6 | No scripts; version="1.0.0" tracks freshness; repomix-opencode.md and repomix-opencode.xml provide source-level verification against platform drift |

# OpenCode Platform Reference

Complete OpenCode documentation and source code for building harness systems.

## Reference Files

All files in `references/` directory:

| File | Content |
|------|---------|
| opencode-agents.md | Agent definition, modes, configuration, permissions |
| opencode-built-in-tools.md | All built-in tools (read, write, edit, bash, glob, grep, task, skill, etc.) |
| opencode-commands.md | Slash commands, frontmatter, template placeholders |
| opencode-configs.md | Full opencode.json schema, config precedence, variable substitution |
| opencode-custom-tools.md | Custom tool creation, tool.schema (Zod), multiple tools per file, Python tools |
| opencode-formatter.md | Code formatter configuration |
| opencode-github.md | GitHub integration |
| opencode-lsp-servers.md | LSP server configuration |
| opencode-mcp-servers.md | MCP server setup (local and remote) |
| opencode-models.md | Model providers, model selection |
| opencode-permissions.md | Permission system, cascading, glob patterns, per-agent overrides |
| opencode-plugins.md | Plugin system, hooks (tool.execute.before/after, event, shell.env, compacting), tool registration, dependencies |
| opencode-rules.md | Rules system |
| opencode-sdk.md | Full SDK API (session CRUD, prompt, abort, events, TUI control, structured output) |
| opencode-server.md | Server configuration |
| opencode-share-usage.md | Session sharing |
| opencode-skills.md | Skill discovery, SKILL.md format, permissions, loading mechanism |
| opencode-troubleShooting.md | Troubleshooting guide |
| repomix-opencode.md | Full OpenCode source code packed by repomix (markdown format) |
| repomix-opencode.xml | Full OpenCode source code packed by repomix (XML format, use with attach_packed_output) |

## Key Composition Patterns

### Permission Cascading
Global config → Agent config → Session overrides → Runtime approvals. Last matching rule wins via `findLast()`.

### Tool Hook Pipeline
1. Plugin `tool.execute.before` → mutates args
2. Agent permission check (ctx.ask()) → can block
3. Tool execute → actual logic
4. Plugin `tool.execute.after` → mutates output

### Agent-Skill Two-Phase Loading
Phase 1: Skill names+descriptions in system prompt (auto)
Phase 2: Full SKILL.md content loaded on-demand via skill tool

### Subtask Spawning
Commands with subtask:true create SubtaskPart → child session → inherits target agent config + restricted tools (no task, no todowrite by default)

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Memorizer** | Tries to memorize all 20 reference files | Use progressive disclosure. Read only the reference needed for the current task. |
| **The Outdated Citer** | Cites reference content as current runtime truth | References describe platform capabilities, not current project state. Verify against actual config. |
| **The Over-Loader** | Loads all 20 references at once | Load only the specific reference file needed. SKILL.md is the index, not the content. |
| **The Assumer** | Assumes platform behavior from training knowledge | Always verify via `context7` or live platform inspection before claiming platform behavior. |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `command-dev` | command-dev = how to write OpenCode commands. This skill = what commands/platform features exist. |
| `opencode-non-interactive-shell` | non-interactive-shell = shell safety rules. This skill = platform capability reference. |
| `meta-builder` | meta-builder routes to this skill for platform lookups. This skill provides the actual reference content. |
