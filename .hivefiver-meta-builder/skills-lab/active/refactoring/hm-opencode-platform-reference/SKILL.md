---
name: hm-opencode-platform-reference
description: Complete OpenCode platform documentation covering agents, plugins, custom tools, SDK, permissions, skills, commands, configs, MCP servers, and models. Use when needing OpenCode-specific agents, SDK, plugin hooks, tool definitions, permission model, MCP server config, or platform architecture. NOT for general coding tasks or non-OpenCode framework lookup.
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

## Overview

Complete OpenCode platform documentation covering agents, plugins, custom tools, SDK, permissions, skills, commands, configs, MCP servers, and models. Use when building plugin integrations, configuring agents, defining tools, or understanding platform architecture. Contains reference files for all platform capabilities.

## Source Freshness Gate

OpenCode platform behavior is version-sensitive. Before making a platform claim, prefer the current official docs or the bundled reference file if it has been refreshed within the project's freshness window. For this Phase 29 pass, official docs for agents, commands, config, and rules were fetched on 2026-04-25 and used to update the scope matrix below.

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

## Official Scope Matrix

| Surface | Official project location | Overrides / global locations | Key notes |
|---------|---------------------------|------------------------------|-----------|
| Agents | `.opencode/agents/*.md`, `opencode.json.agent` | `~/.config/opencode/agents/`, `OPENCODE_CONFIG_DIR` | Primary agents handle main sessions; subagents are invoked by primary agents or `@mention`; markdown filename becomes agent name. |
| Commands | `.opencode/commands/*.md`, `opencode.json.command` | `~/.config/opencode/commands/`, `OPENCODE_CONFIG_DIR` | Supports `$ARGUMENTS`, positional args, shell output injection, file references, `agent`, `subtask`, and `model`. |
| Config | `opencode.json` in project / nearest git root | remote config, global config, `OPENCODE_CONFIG`, `.opencode`, `OPENCODE_CONFIG_CONTENT`, managed config | Configs merge; later precedence overrides conflicting keys. |
| Rules | project `AGENTS.md`, fallback `CLAUDE.md`, `opencode.json.instructions` | global `AGENTS.md`, fallback `~/.claude/CLAUDE.md` unless disabled | First local/global file match wins; configured instructions are combined. |

## RICH Gate Source Decisions

| Source | Decision | Local adaptation |
|--------|----------|------------------|
| OpenCode official docs | ADOPT | Scope matrix and freshness gate align reference claims with current platform docs. |
| GitHub agent skill resource model | ADAPT | This is intentionally reference-heavy; resource value is the indexed reference corpus, not extra scripts. |
| Local repomix OpenCode pack | ADAPT | Use for source-code confirmation when official docs are insufficient. |

## Independence Notes

This reference skill must work outside this repository. Avoid local project paths in guidance except examples marked as examples. Verify actual project state through official OpenCode discovery locations before reporting configuration truth.

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

## Self-Correction

### When the Task Keeps Failing

[Detection] If platform claims in code are not matching actual behavior, the reference files may be outdated — check the Source Freshness Gate date and re-verify against live OpenCode behavior using `context7` or official docs. If a specific reference file doesn't contain the needed information, try the repomix OpenCode source pack (`references/repomix-opencode.xml`) for deeper implementation details. If neither official docs nor the repomix pack answer the question, flag it as a documentation gap and suggest a platform inquiry.

[Recovery] Re-run freshness verification by checking official OpenCode docs for updates. Use `context7` or `deepwiki` tools to query the latest platform behavior. Mark any claim that cannot be verified as "unverified" with date.

### When Unsure About the Next Step

[Detection] If you cannot find the right reference file for a platform question, start with the reference file table in SKILL.md — each file's description maps to a platform surface. If the question spans multiple surfaces (e.g., "how do permissions interact with custom tools?"), read the two most relevant files first (permissions.md + custom-tools.md) before expanding. If the question is about runtime behavior, prefer the official scope matrix and composition patterns over static reference content.

[Recovery] Use the reference file table as a lookup index. Load only the specific file needed. For cross-surface questions, load up to 2 reference files at a time.

### When the User Contradicts Skill Guidance

[Detection] If the user makes platform claims that contradict the reference files, present the reference file's content as evidence but acknowledge that the user may have more recent or environment-specific knowledge. If the user wants to configure something in a way the reference files don't document, note the gap and proceed with the user's approach — reference skills report facts, they don't block decisions. If the user's platform version differs from what the reference covers (e.g., a newer OpenCode version), mark all claims as version-dependent.

[Recovery] Cite the specific reference file and section. If the user's claim contradicts, note the discrepancy. If the user's platform version differs, mark version dependency.

### When an Edge Case Is Encountered

[Detection] If the project uses a non-standard OpenCode configuration (e.g., custom `OPENCODE_CONFIG_DIR`, non-standard file locations), the reference files may not accurately describe the project's actual configuration. Inspect the project's actual `opencode.json` and file structure before making claims. If the project has no `.opencode/` directory, check global and config override locations. If a reference file is missing or corrupted, fall back to the repomix XML pack or live platform inspection.

[Recovery] Verify actual project state through OpenCode discovery locations before reporting configuration truth. For missing references, use repomix source pack as fallback. For version mismatches, flag all claims as version-dependent.

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `command-dev` | command-dev = how to write OpenCode commands. This skill = what commands/platform features exist. |
| `opencode-non-interactive-shell` | non-interactive-shell = shell safety rules. This skill = platform capability reference. |
| `meta-builder` | meta-builder routes to this skill for platform lookups. This skill provides the actual reference content. |
