---
description: "Advanced Synthesis of OpenCode Concepts - Meta-Builder's Reference"
agent: hivefiver
author: "OpenCode DeepWiki Synthesis"
date_created: "2026-02-28"
date_modified: "2026-02-28"
version: "1.0.0"
created: "2026-02-28"
updated: "2026-02-28"
references: 
  - https://deepwiki.com/search/can-you-make-advanced-synthesi_b4d7ef09-88de-4814-8789-7656e1eb73e4
  - https://github.com/anomalyco/opencode
tags: ["opencode", "advanced", "synthesis", "meta-builder", "reference", "architecture", "agent-system", "configuration"]
classification:
  domain: "opencode-meta-systems"
  category: "advanced-synthesis"
  subcategory: "architecture-reference"
  depth: "comprehensive"
  cognitive_model: "knowledge-graph"
  primary_domain: "AI Agent Architecture"
  secondary_domains: ["Configuration Management", "Permission Systems", "Plugin Architecture"]
  knowledge_depth: "advanced"
  target_audience: ["meta-builders", "system-architects", "agent-developers"]
  maintenance_status: "active"
fast_track:
  - "agent-taxonomy"
  - "permission-system"
  - "skills-architecture"
  - "plugin-hooks"
  - "context-management"
  - "tool-registry"
  - "session-lifecycle"
  - "prompt-architecture"
  - "configuration-hierarchy"
  - "delegation-patterns"
synthesis_categories:
  - "agent-taxonomy"
  - "permission-system"
  - "skills-system"
  - "plugin-architecture"
  - "context-management"
  - "session-model"
  - "tool-registry"
  - "prompt-engineering"
  - "configuration-system"
  - "command-framework"
related_docs:
  - name: "OPENCODE-DETERMINISTIC-CONTEXT-AGENT-DELEGATION.md"
    relationship: "context-delegation-patterns"
  - name: "opencode-full-sdk-mechanism.md"
    relationship: "sdk-implementation-details"
  - name: "OPENCODE-PRIMARY-COORDINATOR-AGENT.md"
    relationship: "coordination-patterns"
  - name: "OMAD-01-OPENCODE-AUTOMATION-DIRECTIVE-2026-02-17.md"
    relationship: "automation-directive"
  - name: "opencode-sdk-QA-deepwiki.md"
    relationship: "q-and-a-reference"
  - name: "CHAIN-BRIDGE-ARCHITECTURE.md"
    relationship: "bridge-architecture-patterns"
related_skills:
  - "delegation-intelligence"
  - "context-integrity"
  - "session-lifecycle"
  - "hivemind-governance"
  - "evidence-discipline"
---

<!-- TOC-SYMLINKS-START -->

---

## Table of Contents

| Section | Anchor | Classification |
|---------|--------|----------------|
| Intro | [#open-code-advanced-synthesis](#open-code-advanced-synthesis) | `overview, meta-system, reference` |
| 1. Agent Taxonomy | [#1-the-agent-taxonomy](#1-the-agent-taxonomy) | `architecture, core-concept, agent-system` |
| 2. Agent Profile Schema | [#2-the-agent-body](#2-the-agent-body) | `architecture, agent-configuration, schema-reference` |
| 3. Config Hierarchy | [#3-the-yamljson-configuration-hierarchy](#3-the-yamljson-configuration-hierarchy) | `config, setup, configuration-management` |
| 4. Permission System | [#4-the-permission-system](#4-the-permission-system) | `security, permissions, access-control` |
| 5. Commands | [#5-commands](#5-commands) | `config, commands, automation` |
| 6. Skills System | [#6-the-skills-system](#6-the-skills-system) | `config, extensibility, domain-knowledge` |
| 7. Tools & Tooling | [#7-tools--tooling](#7-tools--tooling) | `execution, tools, core-api` |
| 8. Prompt Architecture | [#8-the-prompt-architecture](#8-the-prompt-architecture) | `llm-integration, prompts, system-architecture` |
| 9. Sessions | [#9-sessions](#9-sessions) | `session-management, state, lifecycle` |
| 10. Context Management | [#10-context-management](#10-context-management) | `context-management, optimization, memory` |
| 11. Plugin System | [#11-the-plugin-system](#11-the-plugin-system) | `extensibility, plugins, architecture` |

## Detailed TOC

### [1. The Agent Taxonomy: Primary, Subagent, and "All"](#1-the-agent-taxonomy)
- [Mode Differentiation](#mode-differentiation)
- [Native Agents (Built-in)](#native-agents-built-in)
- [Custom Agents: Markdown Agent File Format](#custom-agents-the-markdown-agent-file-format)
- [Default Agent Resolution](#default-agent-resolution)

### [2. The Agent "Body" — Profile Schema & Steering Fields](#2-the-agent-body)
- [Info Object Schema](#info-object-schema)
- [The `description` Field is Critical for Delegation](#the-description-field-is-critical-for-delegation)

### [3. The YAML/JSON Configuration Hierarchy](#3-the-yamljson-configuration-hierarchy)
- [Precedence Stack (Low → High)](#precedence-stack-low--high)
- [String Interpolation Inside Config](#string-interpolation-inside-config)
- [Directory Auto-Discovery: The Glob Patterns](#directory-auto-discovery-the-glob-patterns)
- [The `Config.Info` Schema — Top-Level Keys](#the-configinfo-schema--top-level-keys)

### [4. The Permission System: Delegation, Rules, and Trust](#4-the-permission-system)
- [The PermissionNext Ruleset](#the-permissionnext-ruleset)
- [Permission Actions](#permission-actions)
- [Rule Evaluation: Last-Match-Wins](#rule-evaluation-last-match-wins)
- [Permission Categories](#permission-categories)
- [Session-Level Permission Overrides](#session-level-permission-overrides)
- [The Doom Loop Guard](#the-doom-loop-guard)
- [The `experimental.primary_tools` Guard](#the-experimentalprimary_tools-guard)

### [5. Commands: Deterministic Scripts and Chaining](#5-commands)
- [Command Definition Schema](#command-definition-schema)
- [Template Interpolation Tokens](#template-interpolation-tokens)
- [The `subtask: true` Flag](#the-subtask-true-flag--command-as-delegated-chain)
- [MCP Prompts as Commands](#mcp-prompts-as-commands)
- [Skills as Commands](#skills-as-commands)
- [Built-in Commands: `init` and `review`](#built-in-commands-init-and-review)

### [6. The Skills System: Domain-Specific Instruction Packs](#6-the-skills-system)
- [SKILL.md Structure](#skillmd-structure)
- [Skill Discovery Priority Stack](#skill-discovery-priority-stack)
- [Remote Skill Discovery Protocol](#remote-skill-discovery-protocol)
- [How the Skill Tool Works](#how-the-skill-tool-works-context-injection)
- [Skill as Tool vs Skill as Command](#skill-as-tool-vs-skill-as-command)
- [Skill Permission Filtering](#skill-permission-filtering)

### [7. Tools & Tooling: Registry, Stacking, Chaining](#7-tools--tooling)
- [The Complete Native Tool Stack](#the-complete-native-tool-stack)
- [Custom Tools: The Plugin File Pattern](#custom-tools-the-plugin-file-pattern)
- [Tool Output Truncation: The Overflow Contract](#tool-output-truncation-the-overflow-contract)
- [The Batch Tool: Parallel Stacking](#the-batch-tool-parallel-stacking-experimental)
- [Tool Call Lifecycle Hooks](#tool-call-lifecycle-hooks-plugin-system)

### [8. The Prompt Architecture: LLM Priority & Consumption Order](#8-the-prompt-architecture)
- [How the System Prompt is Assembled](#how-the-system-prompt-is-assembled-priority-stack)
- [Provider-Specific System Prompts](#provider-specific-system-prompts)
- [The Anthropic System Prompt Philosophy](#the-anthropic-system-prompt-philosophy)
- [The `InstructionPrompt` System](#the-instructionprompt-system-persistent-context-files)
- [Nested AGENTS.md: Directory-Level Instructions](#nested-agentsmd-directory-level-instructions)
- [System-Reminder Injection: Ephemeral Steering](#system-reminder-injection-ephemeral-steering)
- [Options Merging for Model Steering](#options-merging-for-model-steering)

### [9. Sessions: Main vs. Delegated (Child) Sessions](#9-sessions)
- [Session Identity](#session-identity)
- [The Main Session Loop](#the-main-session-loop-sessionpromptloop)
- [How Child Sessions Are Created](#how-child-sessions-are-created-the-delegation-chain)
- [Resuming Subagent Sessions](#resuming-subagent-sessions)
- [Permission Merging Across Session Hierarchy](#permission-merging-across-session-hierarchy)

### [10. Context Management: Compaction and Pruning](#10-context-management)
- [Auto-Compaction Trigger](#auto-compaction-trigger)
- [The Compaction Agent Prompt Template](#the-compaction-agent-prompt-template)
- [Tool Output Pruning](#tool-output-pruning)

### [11. The Plugin System: Deep Extension Points](#11-the-plugin-system)
- [Plugin Hooks](#plugin-hooks)

### [Code Citations & References](#citations)
<!-- TOC-SYMLINKS-END -->

---

<!-- CLASSIFICATION: opencode-meta-systems, advanced-synthesis, meta-reference -->
<!-- SYNTHESIS-TAGS: overview, meta-system, architecture-map, knowledge-synthesis -->
<!-- FAST-TRACK: opencode-overview, meta-builder-reference, advanced-concepts -->

# DeepWiki Q&A with Code Context for Repository: anomalyco/opencode
## Q1

### Answer
# OpenCode Advanced Synthesis: A Meta-Builder's Reference

This document is a deep synthesis of OpenCode's architecture, designed as a conceptual map and skill-pack reference for building meta-systems on top of the OpenCode ecosystem.

---

<!-- CLASSIFICATION: architecture, core-concept, agent-system -->
<!-- SYNTHESIS-TAGS: agent-modes, delegation, primary-vs-subagent, mode-taxonomy -->
<!-- FAST-TRACK: agent-configuration, delegation-patterns, TUI-selection -->
## 1. The Agent Taxonomy: Primary, Subagent, and "All"

### Mode Differentiation

Every agent in OpenCode is classified by a `mode` field with three possible values: `"primary"`, `"subagent"`, or `"all"`.

- **Primary agents** are user-facing entry points. They are selectable in the TUI, appear in the default agent list, and can own `todo` management and `plan` cycles.
- **Subagents** are delegated workers. They are invoked exclusively via the `task` tool and run inside child sessions.
- **`"all"` mode** means the agent is available as both — exposed to the user AND callable as a subagent. opencode:24-49 

### Native Agents (Built-in)

The system ships with these native agents, hardcoded in the state factory:

| Agent | Mode | Purpose |
|---|---|---|
| `build` | primary | Default execution agent, full tool access |
| `plan` | primary | Read-only planning, no edits (except plan file) |
| `general` | subagent | Multi-step parallel research & execution |
| `explore` | subagent | Fast codebase search specialist |
| `compaction` | primary (hidden) | Context compaction summarizer |
| `title` | primary (hidden) | Session title generator |
| `summary` | primary (hidden) | Commit-message-style summarizer | opencode:76-202 

### Custom Agents: The Markdown Agent File Format

You define custom agents by placing `.md` files in `{.opencode,~/.config/opencode}/agents/` or `agents/` directories. The file uses YAML frontmatter + markdown body:

```
---
description: "When to use this agent..."
mode: subagent
model: anthropic/claude-opus-4-5
temperature: 0.3
permission:
  edit: deny
  bash: allow
---
You are a specialist in...
```

The markdown body becomes the agent's `prompt` field. The frontmatter maps 1:1 to the `Agent` config schema. opencode:381-419 

### Default Agent Resolution

OpenCode selects the "default" agent via `Agent.defaultAgent()`. It first checks `cfg.default_agent`, validates it is a `primary` mode non-hidden agent, then falls back to the first visible primary agent found. opencode:265-280 

---

<!-- CLASSIFICATION: architecture, agent-configuration, schema-reference -->
<!-- SYNTHESIS-TAGS: agent-profile, steering-fields, Info-schema, agent-body -->
<!-- FAST-TRACK: agent-customization, model-override, permission-configuration -->
## 2. The Agent "Body" — Profile Schema & Steering Fields

Every agent is governed by an `Info` object. Understanding each field is critical for steering agent behavior:

| Field | Type | Effect |
|---|---|---|
| `prompt` | `string` | The agent's system prompt. **Overrides** the provider-default system prompt entirely |
| `mode` | enum | Placement in primary/subagent/all taxonomy |
| `model` | `{ providerID, modelID }` | Agent-specific model override |
| `variant` | `string` | Model variant (e.g., thinking, extended context) |
| `temperature` | `number` | LLM sampling temperature |
| `topP` | `number` | Nucleus sampling |
| `permission` | `Ruleset` | Per-tool access control rules |
| `steps` | `number` | Max agentic loop iterations before forced text-only |
| `options` | `Record<string,any>` | Passed as provider options to the LLM call |
| `hidden` | `boolean` | Hide from `@` autocomplete menu |
| `color` | `string` | UI color (hex or theme token) |
| `description` | `string` | What the `task` tool sees when deciding to use this agent | opencode:24-49 

### The `description` Field is Critical for Delegation

The `description` field of a subagent is **directly injected into the `task` tool's system prompt**. This is the text the LLM reads when deciding which subagent to dispatch. It is your primary steering mechanism for intelligent delegation. opencode:36-42 

---

<!-- CLASSIFICATION: config, setup, configuration-management -->
<!-- SYNTHESIS-TAGS: config-hierarchy, precedence, yaml-json, opencode-config -->
<!-- FAST-TRACK: config-loading, precedence-stack, auto-discovery, env-interpolation -->
## 3. The YAML/JSON Configuration Hierarchy

### Precedence Stack (Low → High)

OpenCode merges configs from multiple sources in a well-defined order:

1. Remote `.well-known/opencode` (org-level defaults)
2. Global config `~/.config/opencode/opencode.{json,jsonc}`
3. Custom config (`OPENCODE_CONFIG` env var)
4. Project config `opencode.{json,jsonc}` (walks up to worktree)
5. `.opencode/` directories (project + home)
6. `OPENCODE_CONFIG_CONTENT` (inline, highest user-land priority)
7. **Managed config** `/etc/opencode/` (enterprise override, absolute top) opencode:68-247 

### String Interpolation Inside Config

The config loader supports two special syntaxes:
- `{env:VAR_NAME}` — injects environment variable value
- `{file:./path/to/file}` — injects the content of a file (useful for secrets) opencode:1244-1285 

### Directory Auto-Discovery: The Glob Patterns

When scanning `.opencode/` directories, the loader auto-discovers:

| Glob | What it loads |
|---|---|
| `{command,commands}/**/*.md` | Custom commands |
| `{agent,agents}/**/*.md` | Custom agents |
| `{mode,modes}/*.md` | (deprecated) → promoted to `mode: primary` agents |
| `{plugin,plugins}/*.{ts,js}` | Custom plugins |
| `{tool,tools}/*.{ts,js}` | Custom tools | opencode:342-471 

### The `Config.Info` Schema — Top-Level Keys

Key top-level configuration fields (from the Zod schema):

```jsonc
{
  "model": "anthropic/claude-opus-4-5",      // global default model
  "small_model": "anthropic/claude-haiku-4", // for title/summary tasks
  "default_agent": "build",                   // which primary agent starts
  "instructions": ["./AGENTS.md", "https://..."], // system prompt injections
  "permission": { "bash": "ask", "edit": "allow" }, // global permission defaults
  "agent": { ... },                            // per-agent overrides
  "mcp": { ... },                              // MCP server configs
  "skills": { "paths": [], "urls": [] },      // skill pack sources
  "compaction": { "auto": true, "prune": true }, // context management
  "experimental": { "batch_tool": true, ... }  // experimental features
}
``` opencode:1006-1199 

---

<!-- CLASSIFICATION: security, permissions, access-control -->
<!-- SYNTHESIS-TAGS: PermissionNext, ruleset, delegation-security, trust-boundaries -->
<!-- FAST-TRACK: permission-rules, access-control, doom-loop, security-guards -->
## 4. The Permission System: Delegation, Rules, and Trust

### The PermissionNext Ruleset

Permissions are represented as an ordered **ruleset** — an array of `Rule` objects, each with `{ permission, pattern, action }`. Rules are evaluated **last-match-wins** using glob wildcards. opencode:30-62 

### Permission Actions

- **`allow`** — proceed without asking the user
- **`deny`** — hard-block, throws `DeniedError` immediately
- **`ask`** — pause and prompt the user (interactive only); user can reply `once`, `always`, or `reject` opencode:25-28 

### Rule Evaluation: Last-Match-Wins

`evaluate()` calls `findLast()` on the merged ruleset. This means **more specific rules appended later override earlier broad rules**. Merging multiple rulesets by `flat()` means the priority order is: defaults → user config → agent config → session overrides. opencode:236-257 

### Permission Categories (Tool → Permission Name Mapping)

| Tool(s) | Permission key | Notes |
|---|---|---|
| `read` | `read` | Supports file glob patterns |
| `edit`, `write`, `patch`, `multiedit` | `edit` | All write tools map to `edit` |
| `bash` | `bash` | Pattern = the full command string |
| `glob`, `grep`, `list` | direct name | Read-only navigation |
| `task` | `task` | Pattern = agent name being delegated to |
| `skill` | `skill` | Pattern = skill name |
| `webfetch`, `websearch` | direct name | |
| MCP tools | tool name | Every MCP tool goes through `ctx.ask()` |
| `external_directory` | `external_directory` | Filesystem access outside worktree |
| `doom_loop` | `doom_loop` | Repeated identical tool calls (default: `ask`) |
| `question` | `question` | Agent asking user questions |
| `plan_enter`, `plan_exit` | direct name | Plan mode transitions | opencode:623-654 

### Session-Level Permission Overrides

A session itself can carry a `permission` ruleset (stored in the DB). This is the mechanism by which `TaskTool` restricts subagent sessions — it creates a child session with `todowrite: deny`, `todoread: deny`, and `task: deny` (preventing recursive task spawning unless the agent has explicit task permission). opencode:66-102 

### The Doom Loop Guard

When the same tool is called with the same inputs 3 times consecutively, the system triggers a `doom_loop` permission check. By default this is `ask`, allowing the user to intervene. You can set `doom_loop: deny` to hard-stop infinite loops. opencode:152-177 

### The `experimental.primary_tools` Guard

Tools listed in `experimental.primary_tools` are **blocked from subagent sessions** by default. This prevents delegated agents from using privileged tools unless explicitly granted. opencode:95-102 

---

<!-- CLASSIFICATION: config, commands, automation -->
<!-- SYNTHESIS-TAGS: custom-commands, command-chaining, subtask, template-interpolation -->
<!-- FAST-TRACK: command-definition, agent-chaining, scripting, MCP-prompts -->
## 5. Commands: Deterministic Scripts and Chaining

### Command Definition Schema

Commands are Markdown files with YAML frontmatter:

```markdown
---
description: "Review the git diff for $ARGUMENTS"
agent: explore          # which agent runs this command
model: anthropic/claude-haiku-4
subtask: true           # run as a child session via TaskTool
---
Please review the following: $ARGUMENTS

@src/               ← file/dir reference injection
!`git diff HEAD`    ← shell command output injection
``` opencode:656-663 

### Template Interpolation Tokens

| Token | Meaning |
|---|---|
| `$ARGUMENTS` | The full text the user typed after the command name |
| `$1`, `$2`, ... | Positional arguments |
| `@path/to/file` | Injects the file/dir as a context part |
| `!`backtick cmd`backtick` | Executes shell command and injects stdout | opencode:6-11 

### The `subtask: true` Flag — Command as Delegated Chain

When `subtask: true`, the command is executed as a `TaskTool` call inside a child session with the specified `agent`. This is the key **chaining primitive**: commands → agent delegation → subagent sessions. opencode:656-663 

### MCP Prompts as Commands

MCP server prompts are automatically surfaced as commands in the command palette, with their arguments mapped to `$1`, `$2`, etc. opencode:98-123 

### Skills as Commands

Every loaded skill is also automatically registered as an invokable command. When invoked as a command, the skill content becomes the prompt template directly. opencode:126-138 

### Built-in Commands: `init` and `review`

- `init` → generates/updates `AGENTS.md` for the project
- `review` → reviews git changes (`subtask: true` by default) opencode:59-97 

---

<!-- CLASSIFICATION: config, extensibility, domain-knowledge -->
<!-- SYNTHESIS-TAGS: skills, domain-instructions, SKILL.md, skill-discovery -->
<!-- FAST-TRACK: skill-development, context-injection, skill-loading -->
## 6. The Skills System: Domain-Specific Instruction Packs

### SKILL.md Structure

A skill is a directory containing a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: my-skill
description: "Handles X workflow. Use when user asks about X."
---
# Skill content goes here
This text becomes the skill's injected instructions...
```

The `name` and `description` are required. The markdown body is the instructions injected into context when the skill is loaded. opencode:16-24 

### Skill Discovery Priority Stack

Skills are loaded in this order (later overwrites earlier on name collision):

1. `~/.claude/skills/`, `~/.agents/skills/` (global external — Claude Code compat)
2. Project-level `.claude/skills/`, `.agents/skills/` (walked up to worktree)
3. `.opencode/skill/` or `.opencode/skills/` directories
4. Additional paths from `config.skills.paths`
5. Remote URLs via `config.skills.urls` (downloads to local cache) opencode:52-175 

### Remote Skill Discovery Protocol

The `skills.urls` config accepts URLs to a `.well-known/skills/` endpoint. The server must serve an `index.json` with a list of `{ name, description, files[] }` entries. Files are downloaded to `~/.cache/opencode/skills/`. opencode:38-96 

### How the Skill Tool Works (Context Injection)

When the LLM calls the `skill` tool with a skill name, it:
1. Validates permission (`skill/<name>`)
2. Reads the `SKILL.md` content
3. Lists up to 10 bundled files in the skill directory
4. Returns a `<skill_content name="...">` block with instructions + file list

The bundled files (scripts, templates, reference docs) are made visible to the agent as a map of relative paths → absolute paths, enabling the agent to read and execute them. opencode:76-122 

### Skill as Tool vs Skill as Command

| Invocation | Mechanism | When used |
|---|---|---|
| LLM calls `skill` tool | Agent recognizes task matches skill description, loads instructions | Mid-conversation, agent-driven |
| User types `/skill-name` | Command palette → skill content as prompt template | User-driven, upfront | opencode:22-46 

### Skill Permission Filtering

Agents with `skill: { "my-skill": "deny" }` in their permissions will not see that skill in the `skill` tool's available list. This enables scoped skill exposure per-agent. opencode:10-20 

---

<!-- CLASSIFICATION: execution, tools, core-api -->
<!-- SYNTHESIS-TAGS: native-tools, tool-registry, batch-tool, custom-tools -->
<!-- FAST-TRACK: tool-execution, tool-chaining, output-truncation, batch-operations -->
## 7. Tools & Tooling: Registry, Stacking, Chaining

### The Complete Native Tool Stack opencode:99-121 

| Tool | ID | Permission | Notes |
|---|---|---|---|
| `read` | `read` | `read` | File/dir read with offset/limit |
| `edit` | `edit` | `edit` | String replacement with LSP diagnostics |
| `write` | `write` | `edit` | Create/overwrite file |
| `apply_patch` | `apply_patch` | `edit` | Used for GPT-family models |
| `bash` | `bash` | `bash` | Shell execution with AST parsing |
| `glob` | `glob` | `glob` | File pattern matching |
| `grep` | `grep` | `grep` | Regex content search |
| `task` | `task` | `task` | **THE delegation primitive** |
| `skill` | `skill` | `skill` | Domain instruction loader |
| `todowrite` | `todowrite` | `todowrite` | Task list management |
| `webfetch` | `webfetch` | `webfetch` | HTTP fetch |
| `websearch` | `websearch` | `websearch` | Web search (Exa, requires zen/flag) |
| `codesearch` | `codesearch` | `codesearch` | Code semantic search |
| `question` | `question` | `question` | Ask user (interactive clients only) |
| `batch` | `batch` | — | Parallel multi-tool execution (experimental) |
| `plan_enter`/`plan_exit` | — | `plan_enter`/`plan_exit` | Plan mode transitions (experimental) |
| `lsp` | `lsp` | `lsp` | LSP integration (experimental) |

### Custom Tools: The Plugin File Pattern

Place a `.ts` or `.js` file in `{.opencode,~/.config/opencode}/tools/`. The file must export named exports (or a `default` export) matching the `ToolDefinition` interface from `@opencode-ai/plugin`:

```ts
export default {
  description: "...",
  args: { myArg: z.string() },
  async execute(args, ctx) { ... }
}
```

The tool ID is derived from the filename (and export name if not `default`). opencode:34-58 

### Tool Output Truncation: The Overflow Contract

All tool outputs pass through `Truncate.output()`. If output exceeds **2000 lines** or **50KB**, it is written to a temp file and a hint is returned to the LLM. The hint adapts based on whether the agent has `task` permission — if yes, it instructs the LLM to delegate to the `explore` agent; if not, it suggests using `grep`/`read` with offset. opencode:50-105 

### The Batch Tool: Parallel Stacking (Experimental)

Enable with `experimental.batch_tool: true`. Allows the LLM to execute up to 25 tools in parallel in a single call. MCP tools cannot be batched (they must be called directly). This is the mechanism for maximizing throughput in parallel exploration tasks. opencode:1-60 

### Tool Call Lifecycle Hooks (Plugin System)

Every tool execution can be intercepted via plugins:
- `tool.execute.before` — modify args before execution
- `tool.execute.after` — modify output after execution
- `tool.definition` — modify tool description/parameters at registration time opencode:783-830 

---

<!-- CLASSIFICATION: llm-integration, prompts, system-architecture -->
<!-- SYNTHESIS-TAGS: system-prompt, prompt-assembly, provider-specific, instruction-injection -->
<!-- FAST-TRACK: prompt-engineering, model-steering, prompt-templating, anthropic-prompt -->
## 8. The Prompt Architecture: LLM Priority & Consumption Order

### How the System Prompt is Assembled (Priority Stack)

When the LLM is called via `LLM.stream()`, the system prompt is constructed in this exact priority order:

**Layer 1 — Agent Prompt (highest specificity):**
- If the agent has a `prompt` field → use that exclusively, **replacing** the provider-default system prompt
- If no agent prompt → use `SystemPrompt.provider(model)` based on model family

**Layer 2 — Additional System:**
- Appended: `SystemPrompt.environment(model)` (working directory, platform, date, model ID)
- Appended: `InstructionPrompt.system()` (AGENTS.md, CLAUDE.md, `instructions` config)

**Layer 3 — User Message System:**
- If the user message has a `system` field → appended to the prompt array

**Layer 4 — Plugin Transform:**
- `Plugin.trigger("experimental.chat.system.transform", ...)` can modify the entire system array opencode:67-97 

### Provider-Specific System Prompts

`SystemPrompt.provider()` dispatches different prompt bodies by model family:

| Model Pattern | Prompt Used |
|---|---|
| `gpt-5*` | `codex_header.txt` (concise, structured, file-references) |
| `gpt-*`, `o1*`, `o3*` | `beast.txt` (autonomous, iterative, research-heavy) |
| `gemini-*` | `gemini.txt` (conventions-first, verify workflow) |
| `claude*` | `anthropic.txt` (TodoWrite-heavy, task delegation, plan mode) |
| `*trinity*` | `trinity.txt` |
| anything else | `qwen.txt` (anthropic without todo) | opencode:19-27 

### The Anthropic System Prompt Philosophy

The Anthropic prompt (`anthropic.txt`) is the richest, encoding:
- Mandatory `TodoWrite` usage for task tracking
- Proactive `task` tool delegation patterns
- Tool usage hierarchy (specialized > bash > text)
- Code reference formatting (`file_path:line_number`)
- Plan mode awareness opencode:1-105 

### The `InstructionPrompt` System: Persistent Context Files

The `InstructionPrompt` module discovers and injects instruction files as system prompt additions. It looks for (in priority order):

1. `AGENTS.md` (preferred)
2. `CLAUDE.md` (for Claude Code compatibility)
3. `CONTEXT.md` (deprecated)

Search locations:
- Project directory (walks up to worktree)
- `~/.config/opencode/AGENTS.md` (global)
- `~/.claude/CLAUDE.md` (global, unless disabled)
- URLs listed in `config.instructions` opencode:13-29 

### Nested AGENTS.md: Directory-Level Instructions

When the `read` tool reads a file, `InstructionPrompt.resolve()` walks up the directory tree looking for `AGENTS.md` files in subdirectories that haven't been loaded yet. These are injected as additional system content for that specific read — enabling **directory-scoped instructions** that apply only when working in that subtree. opencode:171-196 

### System-Reminder Injection: Ephemeral Steering

During the agentic loop, OpenCode injects `<system-reminder>` blocks into user messages as synthetic parts. These are used for:
- Plan mode reminders (read-only constraint)
- Build mode transition (`build-switch.txt`)
- Max-steps enforcement

These are **not** sent to the LLM as system messages but as `synthetic: true` text parts in the user message, ensuring they appear mid-conversation without polluting the canonical system prompt. opencode:1321-1350 

### Options Merging for Model Steering

LLM call options are merged in this priority order (later wins):
1. Provider base options (`ProviderTransform.options`)
2. Model-level `options` (from model definition)
3. Agent-level `options` (from agent config)
4. Model variant options opencode:99-113 

---

<!-- CLASSIFICATION: session-management, state, lifecycle -->
<!-- SYNTHESIS-TAGS: main-session, child-session, delegation-chain, session-resumption -->
<!-- FAST-TRACK: session-lifecycle, task-delegation, session-hierarchy, permission-merging -->
## 9. Sessions: Main vs. Delegated (Child) Sessions

### Session Identity

Every session has:
- `id` — unique descending-sort ID
- `parentID` — if set, this is a child/delegated session
- `permission` — session-level permission ruleset (appended to agent ruleset)
- `directory` — the working directory opencode:114-155 

### The Main Session Loop (`SessionPrompt.loop`)

The main loop (`loop()`) is an infinite `while(true)` that:
1. Reads all non-compacted messages
2. Detects the last user message, last assistant message
3. Checks for pending subtask/compaction parts
4. Handles context overflow → triggers compaction
5. Runs `processor.process()` → LLM call
6. Loops until `finish` is not `"tool-calls"` / `"unknown"` opencode:274-726 

### How Child Sessions Are Created (The Delegation Chain)

When the `task` tool executes:
1. Creates a new session with `parentID = ctx.sessionID`
2. Inherits model from the current assistant message
3. Applies restrictive permission overrides (no todo, no nested task by default)
4. Calls `SessionPrompt.prompt()` on the child session
5. Returns `task_id` in output — the child session ID can be **reused** to continue the same subagent session opencode:66-163 

### Resuming Subagent Sessions

The `task_id` returned by a task execution can be passed back in subsequent calls to resume the **same child session** with its full message history. This enables stateful multi-turn subagent interactions. opencode:19-25 

### Permission Merging Across Session Hierarchy

At permission evaluation time, the effective ruleset is:
```
agent.permission + session.permission
```
The session permission is appended (higher priority) to the agent's permission. This is how `TaskTool` can lock down capabilities in child sessions beyond what the agent config allows. opencode:773-780 

---

<!-- CLASSIFICATION: context-management, optimization, memory -->
<!-- SYNTHESIS-TAGS: auto-compaction, compaction-agent, tool-output-pruning, context-pruning -->
<!-- FAST-TRACK: compaction, context-optimization, token-management, session-maintenance -->
## 10. Context Management: Compaction and Pruning

### Auto-Compaction Trigger

When token count approaches the model's context limit (minus a `reserved` buffer, default min of 20,000 tokens), the system inserts a compaction task into the message queue. The `compaction` agent then summarizes the full conversation into a structured handoff prompt. opencode:32-48 

### The Compaction Agent Prompt Template

The compaction summary follows a structured template: **Goal → Instructions → Discoveries → Accomplished → Relevant files/dirs**. This provides a clean state handoff for the continuing agent. opencode:151-200 

### Tool Output Pruning

Separately from compaction, the system runs `prune()` which erases the `output` field of old tool calls that:
- Are beyond the last 40,000 tokens of tool outputs (the "protect" zone)
- Are not in the protected tool list (`skill` tool outputs are never pruned)
- Have accumulated > 20,000 tokens of prunable content opencode:53-99 

---

<!-- CLASSIFICATION: extensibility, plugins, architecture -->
<!-- SYNTHESIS-TAGS: plugin-hooks, extension-points, plugin-system, lifecycle-hooks -->
<!-- FAST-TRACK: plugin-development, custom-extensions, hook-system, sdk-integration -->
## 11. The Plugin System: Deep Extension Points

### Plugin Hooks

A plugin is a function that receives the OpenCode SDK client and returns a hooks object. Available hooks:

| Hook | Trigger |
|---|---|
| `chat.params` | Before LLM call — modify temperature, topP, options |
| `chat.headers` | Before LLM call — inject HTTP headers |
| `chat.message` | After user message creation — modify message/parts |
| `tool.definition` | At tool registration — modify description/parameters |
### Citations
**File:** packages/opencode/src/agent/agent.ts (L24-49)
```typescript
  export const Info = z
    .object({
      name: z.string(),
      description: z.string().optional(),
      mode: z.enum(["subagent", "primary", "all"]),
      native: z.boolean().optional(),
      hidden: z.boolean().optional(),
      topP: z.number().optional(),
      temperature: z.number().optional(),
      color: z.string().optional(),
      permission: PermissionNext.Ruleset,
      model: z
        .object({
          modelID: z.string(),
          providerID: z.string(),
        })
        .optional(),
      variant: z.string().optional(),
      prompt: z.string().optional(),
      options: z.record(z.string(), z.any()),
      steps: z.number().int().positive().optional(),
    })
    .meta({
      ref: "Agent",
    })
  export type Info = z.infer<typeof Info>
```
**File:** packages/opencode/src/agent/agent.ts (L76-202)
```typescript
    const result: Record<string, Info> = {
      build: {
        name: "build",
        description: "The default agent. Executes tools based on configured permissions.",
        options: {},
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            question: "allow",
            plan_enter: "allow",
          }),
          user,
        ),
        mode: "primary",
        native: true,
      },
      plan: {
        name: "plan",
        description: "Plan mode. Disallows all edit tools.",
        options: {},
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            question: "allow",
            plan_exit: "allow",
            external_directory: {
              [path.join(Global.Path.data, "plans", "*")]: "allow",
            },
            edit: {
              "*": "deny",
              [path.join(".opencode", "plans", "*.md")]: "allow",
              [path.relative(Instance, path.join(Global.Path.data, path.join("plans", "*.md")))]: "allow",
            },
          }),
          user,
        ),
        mode: "primary",
        native: true,
      },
      general: {
        name: "general",
        description: `General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.`,
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            todoread: "deny",
            todowrite: "deny",
          }),
          user,
        ),
        options: {},
        mode: "subagent",
        native: true,
      },
      explore: {
        name: "explore",
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            "*": "deny",
            grep: "allow",
            glob: "allow",
            list: "allow",
            bash: "allow",
            webfetch: "allow",
            websearch: "allow",
            codesearch: "allow",
            read: "allow",
            external_directory: {
              [Truncate.GLOB]: "allow",
            },
          }),
          user,
        ),
        description: `Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase (eg. "how do API endpoints work?"). When calling this agent, specify the desired thoroughness level: "quick" for basic searches, "medium" for moderate exploration, or "very thorough" for comprehensive analysis across multiple locations and naming conventions.`,
        prompt: PROMPT_EXPLORE,
        options: {},
        mode: "subagent",
        native: true,
      },
      compaction: {
        name: "compaction",
        mode: "primary",
        native: true,
        hidden: true,
        prompt: PROMPT_COMPACTION,
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            "*": "deny",
          }),
          user,
        ),
        options: {},
      },
      title: {
        name: "title",
        mode: "primary",
        options: {},
        native: true,
        hidden: true,
        temperature: 0.5,
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            "*": "deny",
          }),
          user,
        ),
        prompt: PROMPT_TITLE,
      },
      summary: {
        name: "summary",
        mode: "primary",
        options: {},
        native: true,
        hidden: true,
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            "*": "deny",
          }),
          user,
        ),
        prompt: PROMPT_SUMMARY,
      },
    }
```
**File:** packages/opencode/src/agent/agent.ts (L265-280)
```typescript
  export async function defaultAgent() {
    const cfg = await Config.get()
    const agents = await state()

    if (cfg.default_agent) {
      const agent = agents[cfg.default_agent]
      if (!agent) throw new Error(`default agent "${cfg.default_agent}" not found`)
      if (agent.mode === "subagent") throw new Error(`default agent "${cfg.default_agent}" is a subagent`)
      if (agent.hidden === true) throw new Error(`default agent "${cfg.default_agent}" is hidden`)
      return agent.name
    }

    const primaryVisible = Object.values(agents).find((a) => a.mode !== "subagent" && a.hidden !== true)
    if (!primaryVisible) throw new Error("no primary visible agent found")
    return primaryVisible.name
  }
```
**File:** packages/opencode/src/config/config.ts (L68-247)
```typescript
  export const state = Instance.state(async () => {
    const auth = await Auth.all()

    // Config loading order (low -> high precedence): https://opencode.ai/docs/config#precedence-order
    // 1) Remote .well-known/opencode (org defaults)
    // 2) Global config (~/.config/opencode/opencode.json{,c})
    // 3) Custom config (OPENCODE_CONFIG)
    // 4) Project config (opencode.json{,c})
    // 5) .opencode directories (.opencode/agents/, .opencode/commands/, .opencode/plugins/, .opencode/opencode.json{,c})
    // 6) Inline config (OPENCODE_CONFIG_CONTENT)
    // Managed config directory is enterprise-only and always overrides everything above.
    let result: Info = {}
    for (const [key, value] of Object.entries(auth)) {
      if (value.type === "wellknown") {
        process.env[value.key] = value.token
        log.debug("fetching remote config", { url: `${key}/.well-known/opencode` })
        const response = await fetch(`${key}/.well-known/opencode`)
        if (!response.ok) {
          throw new Error(`failed to fetch remote config from ${key}: ${response.status}`)
        }
        const wellknown = (await response.json()) as any
        const remoteConfig = wellknown.config ?? {}
        // Add $schema to prevent load() from trying to write back to a non-existent file
        if (!remoteConfig.$schema) remoteConfig.$schema = "https://opencode.ai/config.json"
        result = merge(result, await load(JSON.stringify(remoteConfig), `${key}/.well-known/opencode`))
        log.debug("loaded remote config from well-known", { url: key })
      }
    }

    const token = await Control.token()
    if (token) {
    }

    // Global user config overrides remote config.
    result = merge(result, await global())

    // Custom config path overrides global config.
    if (Flag.OPENCODE_CONFIG) {
      result = merge(result, await loadFile(Flag.OPENCODE_CONFIG))
      log.debug("loaded custom config", { path: Flag.OPENCODE_CONFIG })
    }

    // Project config overrides global and remote config.
    if (!Flag.OPENCODE_DISABLE_PROJECT_CONFIG) {
      for (const file of ["opencode.jsonc", "opencode.json"]) {
        const found = await Filesystem.findUp(file, Instance.directory, Instance)
        for (const resolved of found.toReversed()) {
          result = merge(result, await loadFile(resolved))
        }
      }
    }

    result.agent = result.agent || {}
    result.mode = result.mode || {}
    result.plugin = result.plugin || []

    const directories = [
      Global.Path.config,
      // Only scan project .opencode/ directories when project discovery is enabled
      ...(!Flag.OPENCODE_DISABLE_PROJECT_CONFIG
        ? await Array.fromAsync(
            Filesystem.up({
              targets: [".opencode"],
              start: Instance.directory,
              stop: Instance,
            }),
          )
        : []),
      // Always scan ~/.opencode/ (user home directory)
      ...(await Array.fromAsync(
        Filesystem.up({
          targets: [".opencode"],
          start: Global.Path.home,
          stop: Global.Path.home,
        }),
      )),
    ]

    // .opencode directory config overrides (project and global) config sources.
    if (Flag.OPENCODE_CONFIG_DIR) {
      directories.push(Flag.OPENCODE_CONFIG_DIR)
      log.debug("loading config from OPENCODE_CONFIG_DIR", { path: Flag.OPENCODE_CONFIG_DIR })
    }

    const deps = []

    for (const dir of unique(directories)) {
      if (dir.endsWith(".opencode") || dir === Flag.OPENCODE_CONFIG_DIR) {
        for (const file of ["opencode.jsonc", "opencode.json"]) {
          log.debug(`loading config from ${path.join(dir, file)}`)
          result = merge(result, await loadFile(path.join(dir, file)))
          // to satisfy the type checker
          result.agent ??= {}
          result.mode ??= {}
          result.plugin ??= []
        }
      }

      deps.push(
        iife(async () => {
          const shouldInstall = await needsInstall(dir)
          if (shouldInstall) await installDependencies(dir)
        }),
      )

      result.command = mergeDeep(result.command ?? {}, await loadCommand(dir))
      result.agent = mergeDeep(result.agent, await loadAgent(dir))
      result.agent = mergeDeep(result.agent, await loadMode(dir))
      result.plugin.push(...(await loadPlugin(dir)))
    }

    // Inline config content overrides all non-managed config sources.
    if (Flag.OPENCODE_CONFIG_CONTENT) {
      result = merge(result, JSON.parse(Flag.OPENCODE_CONFIG_CONTENT))
      log.debug("loaded custom config from OPENCODE_CONFIG_CONTENT")
    }

    // Load managed config files last (highest priority) - enterprise admin-controlled
    // Kept separate from directories array to avoid write operations when installing plugins
    // which would fail on system directories requiring elevated permissions
    // This way it only loads config file and not skills/plugins/commands
    if (existsSync(managedConfigDir)) {
      for (const file of ["opencode.jsonc", "opencode.json"]) {
        result = merge(result, await loadFile(path.join(managedConfigDir, file)))
      }
    }

    // Migrate deprecated mode field to agent field
    for (const [name, mode] of Object.entries(result.mode ?? {})) {
      result.agent = mergeDeep(result.agent ?? {}, {
        [name]: {
          ...mode,
          mode: "primary" as const,
        },
      })
    }

    if (Flag.OPENCODE_PERMISSION) {
      result.permission = mergeDeep(result.permission ?? {}, JSON.parse(Flag.OPENCODE_PERMISSION))
    }

    // Backwards compatibility: legacy top-level `tools` config
    if (result.tools) {
      const perms: Record<string, Config.PermissionAction> = {}
      for (const [tool, enabled] of Object.entries(result.tools)) {
        const action: Config.PermissionAction = enabled ? "allow" : "deny"
        if (tool === "write" || tool === "edit" || tool === "patch" || tool === "multiedit") {
          perms.edit = action
          continue
        }
        perms[tool] = action
      }
      result.permission = mergeDeep(perms, result.permission ?? {})
    }

    if (!result.username) result.username = os.userInfo().username

    // Handle migration from autoshare to share field
    if (result.autoshare === true && !result.share) {
      result.share = "auto"
    }

    if (!result.keybinds) result.keybinds = Info.shape.keybinds.parse({})

    // Apply flag overrides for compaction settings
    if (Flag.OPENCODE_DISABLE_AUTOCOMPACT) {
      result.compaction = { ...result.compaction, auto: false }
    }
    if (Flag.OPENCODE_DISABLE_PRUNE) {
      result.compaction = { ...result.compaction, prune: false }
    }

    result.plugin = deduplicatePlugins(result.plugin ?? [])

    return {
      config: result,
      directories,
      deps,
    }
  })
```
**File:** packages/opencode/src/config/config.ts (L342-471)
```typescript
  const COMMAND_GLOB = new Bun.Glob("{command,commands}/**/*.md")
  async function loadCommand(dir: string) {
    const result: Record<string, Command> = {}
    for await (const item of COMMAND_GLOB.scan({
      absolute: true,
      followSymlinks: true,
      dot: true,
      cwd: dir,
    })) {
      const md = await ConfigMarkdown.parse(item).catch(async (err) => {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse command ${item}`
        const { Session } = await import("@/session")
        Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load command", { command: item, err })
        return undefined
      })
      if (!md) continue

      const patterns = ["/.opencode/command/", "/.opencode/commands/", "/command/", "/commands/"]
      const file = rel(item, patterns) ?? path.basename(item)
      const name = trim(file)

      const config = {
        name,
        ...md.data,
        template: md.content.trim(),
      }
      const parsed = Command.safeParse(config)
      if (parsed.success) {
        result[config.name] = parsed.data
        continue
      }
      throw new InvalidError({ path: item, issues: parsed.error.issues }, { cause: parsed.error })
    }
    return result
  }

  const AGENT_GLOB = new Bun.Glob("{agent,agents}/**/*.md")
  async function loadAgent(dir: string) {
    const result: Record<string, Agent> = {}

    for await (const item of AGENT_GLOB.scan({
      absolute: true,
      followSymlinks: true,
      dot: true,
      cwd: dir,
    })) {
      const md = await ConfigMarkdown.parse(item).catch(async (err) => {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse agent ${item}`
        const { Session } = await import("@/session")
        Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load agent", { agent: item, err })
        return undefined
      })
      if (!md) continue

      const patterns = ["/.opencode/agent/", "/.opencode/agents/", "/agent/", "/agents/"]
      const file = rel(item, patterns) ?? path.basename(item)
      const agentName = trim(file)

      const config = {
        name: agentName,
        ...md.data,
        prompt: md.content.trim(),
      }
      const parsed = Agent.safeParse(config)
      if (parsed.success) {
        result[config.name] = parsed.data
        continue
      }
      throw new InvalidError({ path: item, issues: parsed.error.issues }, { cause: parsed.error })
    }
    return result
  }

  const MODE_GLOB = new Bun.Glob("{mode,modes}/*.md")
  async function loadMode(dir: string) {
    const result: Record<string, Agent> = {}
    for await (const item of MODE_GLOB.scan({
      absolute: true,
      followSymlinks: true,
      dot: true,
      cwd: dir,
    })) {
      const md = await ConfigMarkdown.parse(item).catch(async (err) => {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse mode ${item}`
        const { Session } = await import("@/session")
        Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load mode", { mode: item, err })
        return undefined
      })
      if (!md) continue

      const config = {
        name: path.basename(item, ".md"),
        ...md.data,
        prompt: md.content.trim(),
      }
      const parsed = Agent.safeParse(config)
      if (parsed.success) {
        result[config.name] = {
          ...parsed.data,
          mode: "primary" as const,
        }
        continue
      }
    }
    return result
  }

  const PLUGIN_GLOB = new Bun.Glob("{plugin,plugins}/*.{ts,js}")
  async function loadPlugin(dir: string) {
    const plugins: string[] = []

    for await (const item of PLUGIN_GLOB.scan({
      absolute: true,
      followSymlinks: true,
      dot: true,
      cwd: dir,
    })) {
      plugins.push(pathToFileURL(item).href)
    }
    return plugins
  }
```
**File:** packages/opencode/src/config/config.ts (L623-654)
```typescript
  export const Permission = z
    .preprocess(
      permissionPreprocess,
      z
        .object({
          __originalKeys: z.string().array().optional(),
          read: PermissionRule.optional(),
          edit: PermissionRule.optional(),
          glob: PermissionRule.optional(),
          grep: PermissionRule.optional(),
          list: PermissionRule.optional(),
          bash: PermissionRule.optional(),
          task: PermissionRule.optional(),
          external_directory: PermissionRule.optional(),
          todowrite: PermissionAction.optional(),
          todoread: PermissionAction.optional(),
          question: PermissionAction.optional(),
          webfetch: PermissionAction.optional(),
          websearch: PermissionAction.optional(),
          codesearch: PermissionAction.optional(),
          lsp: PermissionRule.optional(),
          doom_loop: PermissionAction.optional(),
          skill: PermissionRule.optional(),
        })
        .catchall(PermissionRule)
        .or(PermissionAction),
    )
    .transform(permissionTransform)
    .meta({
      ref: "PermissionConfig",
    })
  export type Permission = z.infer<typeof Permission>
```
**File:** packages/opencode/src/config/config.ts (L656-663)
```typescript
  export const Command = z.object({
    template: z.string(),
    description: z.string().optional(),
    agent: z.string().optional(),
    model: ModelId.optional(),
    subtask: z.boolean().optional(),
  })
  export type Command = z.infer<typeof Command>
```
**File:** packages/opencode/src/config/config.ts (L1006-1199)
```typescript
  export const Info = z
    .object({
      $schema: z.string().optional().describe("JSON schema reference for configuration validation"),
      theme: z.string().optional().describe("Theme name to use for the interface"),
      keybinds: Keybinds.optional().describe("Custom keybind configurations"),
      logLevel: Log.Level.optional().describe("Log level"),
      tui: TUI.optional().describe("TUI specific settings"),
      server: Server.optional().describe("Server configuration for opencode serve and web commands"),
      command: z
        .record(z.string(), Command)
        .optional()
        .describe("Command configuration, see https://opencode.ai/docs/commands"),
      skills: Skills.optional().describe("Additional skill folder paths"),
      watcher: z
        .object({
          ignore: z.array(z.string()).optional(),
        })
        .optional(),
      plugin: z.string().array().optional(),
      snapshot: z.boolean().optional(),
      share: z
        .enum(["manual", "auto", "disabled"])
        .optional()
        .describe(
          "Control sharing behavior:'manual' allows manual sharing via commands, 'auto' enables automatic sharing, 'disabled' disables all sharing",
        ),
      autoshare: z
        .boolean()
        .optional()
        .describe("@deprecated Use 'share' field instead. Share newly created sessions automatically"),
      autoupdate: z
        .union([z.boolean(), z.literal("notify")])
        .optional()
        .describe(
          "Automatically update to the latest version. Set to true to auto-update, false to disable, or 'notify' to show update notifications",
        ),
      disabled_providers: z.array(z.string()).optional().describe("Disable providers that are loaded automatically"),
      enabled_providers: z
        .array(z.string())
        .optional()
        .describe("When set, ONLY these providers will be enabled. All other providers will be ignored"),
      model: ModelId.describe("Model to use in the format of provider/model, eg anthropic/claude-2").optional(),
      small_model: ModelId.describe(
        "Small model to use for tasks like title generation in the format of provider/model",
      ).optional(),
      default_agent: z
        .string()
        .optional()
        .describe(
          "Default agent to use when none is specified. Must be a primary agent. Falls back to 'build' if not set or if the specified agent is invalid.",
        ),
      username: z
        .string()
        .optional()
        .describe("Custom username to display in conversations instead of system username"),
      mode: z
        .object({
          build: Agent.optional(),
          plan: Agent.optional(),
        })
        .catchall(Agent)
        .optional()
        .describe("@deprecated Use `agent` field instead."),
      agent: z
        .object({
          // primary
          plan: Agent.optional(),
          build: Agent.optional(),
          // subagent
          general: Agent.optional(),
          explore: Agent.optional(),
          // specialized
          title: Agent.optional(),
          summary: Agent.optional(),
          compaction: Agent.optional(),
        })
        .catchall(Agent)
        .optional()
        .describe("Agent configuration, see https://opencode.ai/docs/agents"),
      provider: z
        .record(z.string(), Provider)
        .optional()
        .describe("Custom provider configurations and model overrides"),
      mcp: z
        .record(
          z.string(),
          z.union([
            Mcp,
            z
              .object({
                enabled: z.boolean(),
              })
              .strict(),
          ]),
        )
        .optional()
        .describe("MCP (Model Context Protocol) server configurations"),
      formatter: z
        .union([
          z.literal(false),
          z.record(
            z.string(),
            z.object({
              disabled: z.boolean().optional(),
              command: z.array(z.string()).optional(),
              environment: z.record(z.string(), z.string()).optional(),
              extensions: z.array(z.string()).optional(),
            }),
          ),
        ])
        .optional(),
      lsp: z
        .union([
          z.literal(false),
          z.record(
            z.string(),
            z.union([
              z.object({
                disabled: z.literal(true),
              }),
              z.object({
                command: z.array(z.string()),
                extensions: z.array(z.string()).optional(),
                disabled: z.boolean().optional(),
                env: z.record(z.string(), z.string()).optional(),
                initialization: z.record(z.string(), z.any()).optional(),
              }),
            ]),
          ),
        ])
        .optional()
        .refine(
          (data) => {
            if (!data) return true
            if (typeof data === "boolean") return true
            const serverIds = new Set(Object.values(LSPServer).map((s) => s.id))

            return Object.entries(data).every(([id, config]) => {
              if (config.disabled) return true
              if (serverIds.has(id)) return true
              return Boolean(config.extensions)
            })
          },
          {
            error: "For custom LSP servers, 'extensions' array is required.",
          },
        ),
      instructions: z.array(z.string()).optional().describe("Additional instruction files or patterns to include"),
      layout: Layout.optional().describe("@deprecated Always uses stretch layout."),
      permission: Permission.optional(),
      tools: z.record(z.string(), z.boolean()).optional(),
      enterprise: z
        .object({
          url: z.string().optional().describe("Enterprise URL"),
        })
        .optional(),
      compaction: z
        .object({
          auto: z.boolean().optional().describe("Enable automatic compaction when context is full (default: true)"),
          prune: z.boolean().optional().describe("Enable pruning of old tool outputs (default: true)"),
          reserved: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Token buffer for compaction. Leaves enough window to avoid overflow during compaction."),
        })
        .optional(),
      experimental: z
        .object({
          disable_paste_summary: z.boolean().optional(),
          batch_tool: z.boolean().optional().describe("Enable the batch tool"),
          openTelemetry: z
            .boolean()
            .optional()
            .describe("Enable OpenTelemetry spans for AI SDK calls (using the 'experimental_telemetry' flag)"),
          primary_tools: z
            .array(z.string())
            .optional()
            .describe("Tools that should only be available to primary agents."),
          continue_loop_on_deny: z.boolean().optional().describe("Continue the agent loop when a tool call is denied"),
          mcp_timeout: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("Timeout in milliseconds for model context protocol (MCP) requests"),
        })
        .optional(),
    })
    .strict()
    .meta({
      ref: "Config",
    })
```
**File:** packages/opencode/src/config/config.ts (L1244-1285)
```typescript
  async function load(text: string, configFilepath: string) {
    const original = text
    text = text.replace(/\{env:([^}]+)\}/g, (_, varName) => {
      return process.env[varName] || ""
    })

    const fileMatches = text.match(/\{file:[^}]+\}/g)
    if (fileMatches) {
      const configDir = path.dirname(configFilepath)
      const lines = text.split("\n")

      for (const match of fileMatches) {
        const lineIndex = lines.findIndex((line) => line.includes(match))
        if (lineIndex !== -1 && lines[lineIndex].trim().startsWith("//")) {
          continue // Skip if line is commented
        }
        let filePath = match.replace(/^\{file:/, "").replace(/\}$/, "")
        if (filePath.startsWith("~/")) {
          filePath = path.join(os.homedir(), filePath.slice(2))
        }
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(configDir, filePath)
        const fileContent = (
          await Bun.file(resolvedPath)
            .text()
            .catch((error) => {
              const errMsg = `bad file reference: "${match}"`
              if (error.code === "ENOENT") {
                throw new InvalidError(
                  {
                    path: configFilepath,
                    message: errMsg + ` ${resolvedPath} does not exist`,
                  },
                  { cause: error },
                )
              }
              throw new InvalidError({ path: configFilepath, message: errMsg }, { cause: error })
            })
        ).trim()
        // escape newlines/quotes, strip outer quotes
        text = text.replace(match, () => JSON.stringify(fileContent).slice(1, -1))
      }
    }
```
**File:** packages/opencode/src/tool/task.ts (L19-25)
```typescript
    .string()
    .describe(
      "This should only be set if you mean to resume a previous task (you can pass a prior task_id and the task will continue the same subagent session as before instead of creating a fresh one)",
    )
    .optional(),
  command: z.string().describe("The command that triggered this task").optional(),
})
```
**File:** packages/opencode/src/tool/task.ts (L36-42)
```typescript
  const description = DESCRIPTION.replace(
    "{agents}",
    accessibleAgents
      .map((a) => `- ${a.name}: ${a.description ?? "This subagent should only be called manually by the user."}`)
      .join("\n"),
  )
  return {
```
**File:** packages/opencode/src/tool/task.ts (L66-163)
```typescript
      const session = await iife(async () => {
        if (params.task_id) {
          const found = await Session.get(params.task_id).catch(() => {})
          if (found) return found
        }

        return await Session.create({
          parentID: ctx.sessionID,
          title: params.description + ` (@${agent.name} subagent)`,
          permission: [
            {
              permission: "todowrite",
              pattern: "*",
              action: "deny",
            },
            {
              permission: "todoread",
              pattern: "*",
              action: "deny",
            },
            ...(hasTaskPermission
              ? []
              : [
                  {
                    permission: "task" as const,
                    pattern: "*" as const,
                    action: "deny" as const,
                  },
                ]),
            ...(config.experimental?.primary_tools?.map((t) => ({
              pattern: "*",
              action: "allow" as const,
              permission: t,
            })) ?? []),
          ],
        })
      })
      const msg = await MessageV2.get({ sessionID: ctx.sessionID, messageID: ctx.messageID })
      if (msg.info.role !== "assistant") throw new Error("Not an assistant message")

      const model = agent.model ?? {
        modelID: msg.info.modelID,
        providerID: msg.info.providerID,
      }

      ctx.metadata({
        title: params.description,
        metadata: {
          sessionId: session.id,
          model,
        },
      })

      const messageID = Identifier.ascending("message")

      function cancel() {
        SessionPrompt.cancel(session.id)
      }
      ctx.abort.addEventListener("abort", cancel)
      using _ = defer(() => ctx.abort.removeEventListener("abort", cancel))
      const promptParts = await SessionPrompt.resolvePromptParts(params.prompt)

      const result = await SessionPrompt.prompt({
        messageID,
        sessionID: session.id,
        model: {
          modelID: model.modelID,
          providerID: model.providerID,
        },
        agent: agent.name,
        tools: {
          todowrite: false,
          todoread: false,
          ...(hasTaskPermission ? {} : { task: false }),
          ...Object.fromEntries((config.experimental?.primary_tools ?? []).map((t) => [t, false])),
        },
        parts: promptParts,
      })

      const text = result.parts.findLast((x) => x.type === "text")?.text ?? ""

      const output = [
        `task_id: ${session.id} (for resuming to continue this task if needed)`,
        "",
        "<task_result>",
        text,
        "</task_result>",
      ].join("\n")

      return {
        title: params.description,
        metadata: {
          sessionId: session.id,
          model,
        },
        output,
      }
    },
```
**File:** packages/opencode/src/permission/next.ts (L25-28)
```typescript
  export const Action = z.enum(["allow", "deny", "ask"]).meta({
    ref: "PermissionAction",
  })
  export type Action = z.infer<typeof Action>
```
**File:** packages/opencode/src/permission/next.ts (L30-62)
```typescript
  export const Rule = z
    .object({
      permission: z.string(),
      pattern: z.string(),
      action: Action,
    })
    .meta({
      ref: "PermissionRule",
    })
  export type Rule = z.infer<typeof Rule>

  export const Ruleset = Rule.array().meta({
    ref: "PermissionRuleset",
  })
  export type Ruleset = z.infer<typeof Ruleset>

  export function fromConfig(permission: Config.Permission) {
    const ruleset: Ruleset = []
    for (const [key, value] of Object.entries(permission)) {
      if (typeof value === "string") {
        ruleset.push({
          permission: key,
          action: value,
          pattern: "*",
        })
        continue
      }
      ruleset.push(
        ...Object.entries(value).map(([pattern, action]) => ({ permission: key, pattern: expand(pattern), action })),
      )
    }
    return ruleset
  }
```
**File:** packages/opencode/src/permission/next.ts (L236-257)
```typescript
  export function evaluate(permission: string, pattern: string, ...rulesets: Ruleset[]): Rule {
    const merged = merge(...rulesets)
    log.info("evaluate", { permission, pattern, ruleset: merged })
    const match = merged.findLast(
      (rule) => Wildcard.match(permission, rule.permission) && Wildcard.match(pattern, rule.pattern),
    )
    return match ?? { action: "ask", permission, pattern: "*" }
  }

  const EDIT_TOOLS = ["edit", "write", "patch", "multiedit"]

  export function disabled(tools: string[], ruleset: Ruleset): Set<string> {
    const result = new Set<string>()
    for (const tool of tools) {
      const permission = EDIT_TOOLS.includes(tool) ? "edit" : tool

      const rule = ruleset.findLast((r) => Wildcard.match(permission, r.permission))
      if (!rule) continue
      if (rule.pattern === "*" && rule.action === "deny") result.add(tool)
    }
    return result
  }
```
**File:** packages/opencode/src/session/processor.ts (L152-177)
```typescript
                    const lastThree = parts.slice(-DOOM_LOOP_THRESHOLD)

                    if (
                      lastThree.length === DOOM_LOOP_THRESHOLD &&
                      lastThree.every(
                        (p) =>
                          p.type === "tool" &&
                          p.tool === value.toolName &&
                          p.state.status !== "pending" &&
                          JSON.stringify(p.state.input) === JSON.stringify(value.input),
                      )
                    ) {
                      const agent = await Agent.get(input.assistantMessage.agent)
                      await PermissionNext.ask({
                        permission: "doom_loop",
                        patterns: [value.toolName],
                        sessionID: input.assistantMessage.sessionID,
                        metadata: {
                          tool: value.toolName,
                          input: value.input,
                        },
                        always: [value.toolName],
                        ruleset: agent.permission,
                      })
                    }
                  }
```
**File:** packages/opencode/src/config/markdown.ts (L6-11)
```typescript
  export const FILE_REGEX = /(?<![\w`])@(\.?[^\s`,.]*(?:\.[^\s`,.]+)*)/g
  export const SHELL_REGEX = /!`([^`]+)`/g

  export function files(template: string) {
    return Array.from(template.matchAll(FILE_REGEX))
  }
```
**File:** packages/opencode/src/command/index.ts (L59-97)
```typescript
  const state = Instance.state(async () => {
    const cfg = await Config.get()

    const result: Record<string, Info> = {
      [Default.INIT]: {
        name: Default.INIT,
        description: "create/update AGENTS.md",
        source: "command",
        get template() {
          return PROMPT_INITIALIZE.replace("${path}", Instance)
        },
        hints: hints(PROMPT_INITIALIZE),
      },
      [Default.REVIEW]: {
        name: Default.REVIEW,
        description: "review changes [commit|branch|pr], defaults to uncommitted",
        source: "command",
        get template() {
          return PROMPT_REVIEW.replace("${path}", Instance)
        },
        subtask: true,
        hints: hints(PROMPT_REVIEW),
      },
    }

    for (const [name, command] of Object.entries(cfg.command ?? {})) {
      result[name] = {
        name,
        agent: command.agent,
        model: command.model,
        description: command.description,
        source: "command",
        get template() {
          return command.template
        },
        subtask: command.subtask,
        hints: hints(command.template),
      }
    }
```
**File:** packages/opencode/src/command/index.ts (L98-123)
```typescript
    for (const [name, prompt] of Object.entries(await MCP.prompts())) {
      result[name] = {
        name,
        source: "mcp",
        description: prompt.description,
        get template() {
          // since a getter can't be async we need to manually return a promise here
          return new Promise<string>(async (resolve, reject) => {
            const template = await MCP.getPrompt(
              prompt.client,
              prompt.name,
              prompt.arguments
                ? // substitute each argument with $1, $2, etc.
                  Object.fromEntries(prompt.arguments?.map((argument, i) => [argument.name, `$${i + 1}`]))
                : {},
            ).catch(reject)
            resolve(
              template?.messages
                .map((message) => (message.content.type === "text" ? message.content.text : ""))
                .join("\n") || "",
            )
          })
        },
        hints: prompt.arguments?.map((_, i) => `$${i + 1}`) ?? [],
      }
    }
```
**File:** packages/opencode/src/command/index.ts (L126-138)
```typescript
    for (const skill of await Skill.all()) {
      // Skip if a command with this name already exists
      if (result[skill.name]) continue
      result[skill.name] = {
        name: skill.name,
        description: skill.description,
        source: "skill",
        get template() {
          return skill.content
        },
        hints: [],
      }
    }
```
**File:** packages/opencode/src/skill/skill.ts (L16-24)
```typescript
export namespace Skill {
  const log = Log.create({ service: "skill" })
  export const Info = z.object({
    name: z.string(),
    description: z.string(),
    location: z.string(),
    content: z.string(),
  })
  export type Info = z.infer<typeof Info>
```
**File:** packages/opencode/src/skill/skill.ts (L52-175)
```typescript
  export const state = Instance.state(async () => {
    const skills: Record<string, Info> = {}
    const dirs = new Set<string>()

    const addSkill = async (match: string) => {
      const md = await ConfigMarkdown.parse(match).catch((err) => {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse skill ${match}`
        Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load skill", { skill: match, err })
        return undefined
      })

      if (!md) return

      const parsed = Info.pick({ name: true, description: true }).safeParse(md.data)
      if (!parsed.success) return

      // Warn on duplicate skill names
      if (skills[parsed.data.name]) {
        log.warn("duplicate skill name", {
          name: parsed.data.name,
          existing: skills[parsed.data.name].location,
          duplicate: match,
        })
      }

      dirs.add(path.dirname(match))

      skills[parsed.data.name] = {
        name: parsed.data.name,
        description: parsed.data.description,
        location: match,
        content: md.content,
      }
    }

    const scanExternal = async (root: string, scope: "global" | "project") => {
      return Array.fromAsync(
        EXTERNAL_SKILL_GLOB.scan({
          cwd: root,
          absolute: true,
          onlyFiles: true,
          followSymlinks: true,
          dot: true,
        }),
      )
        .then((matches) => Promise.all(matches.map(addSkill)))
        .catch((error) => {
          log.error(`failed to scan ${scope} skills`, { dir: root, error })
        })
    }

    // Scan external skill directories (.claude/skills/, .agents/skills/, etc.)
    // Load global (home) first, then project-level (so project-level overwrites)
    if (!Flag.OPENCODE_DISABLE_EXTERNAL_SKILLS) {
      for (const dir of EXTERNAL_DIRS) {
        const root = path.join(Global.Path.home, dir)
        if (!(await Filesystem.isDir(root))) continue
        await scanExternal(root, "global")
      }

      for await (const root of Filesystem.up({
        targets: EXTERNAL_DIRS,
        start: Instance.directory,
        stop: Instance,
      })) {
        await scanExternal(root, "project")
      }
    }

    // Scan .opencode/skill/ directories
    for (const dir of await Config.directories()) {
      for await (const match of OPENCODE_SKILL_GLOB.scan({
        cwd: dir,
        absolute: true,
        onlyFiles: true,
        followSymlinks: true,
      })) {
        await addSkill(match)
      }
    }

    // Scan additional skill paths from config
    const config = await Config.get()
    for (const skillPath of config.skills?.paths ?? []) {
      const expanded = skillPath.startsWith("~/") ? path.join(os.homedir(), skillPath.slice(2)) : skillPath
      const resolved = path.isAbsolute(expanded) ? expanded : path.join(Instance.directory, expanded)
      if (!(await Filesystem.isDir(resolved))) {
        log.warn("skill path not found", { path: resolved })
        continue
      }
      for await (const match of SKILL_GLOB.scan({
        cwd: resolved,
        absolute: true,
        onlyFiles: true,
        followSymlinks: true,
      })) {
        await addSkill(match)
      }
    }

    // Download and load skills from URLs
    for (const url of config.skills?.urls ?? []) {
      const list = await Discovery.pull(url)
      for (const dir of list) {
        dirs.add(dir)
        for await (const match of SKILL_GLOB.scan({
          cwd: dir,
          absolute: true,
          onlyFiles: true,
          followSymlinks: true,
        })) {
          await addSkill(match)
        }
      }
    }

    return {
      skills,
      dirs: Array.from(dirs),
    }
  })
```
**File:** packages/opencode/src/skill/discovery.ts (L38-96)
```typescript
  export async function pull(url: string): Promise<string[]> {
    const result: string[] = []
    const base = url.endsWith("/") ? url : `${url}/`
    const index = new URL("index.json", base).href
    const cache = dir()
    const host = base.slice(0, -1)

    log.info("fetching index", { url: index })
    const data = await fetch(index)
      .then(async (response) => {
        if (!response.ok) {
          log.error("failed to fetch index", { url: index, status: response.status })
          return undefined
        }
        return response
          .json()
          .then((json) => json as Index)
          .catch((err) => {
            log.error("failed to parse index", { url: index, err })
            return undefined
          })
      })
      .catch((err) => {
        log.error("failed to fetch index", { url: index, err })
        return undefined
      })

    if (!data?.skills || !Array.isArray(data.skills)) {
      log.warn("invalid index format", { url: index })
      return result
    }

    const list = data.skills.filter((skill) => {
      if (!skill?.name || !Array.isArray(skill.files)) {
        log.warn("invalid skill entry", { url: index, skill })
        return false
      }
      return true
    })

    await Promise.all(
      list.map(async (skill) => {
        const root = path.join(cache, skill.name)
        await Promise.all(
          skill.files.map(async (file) => {
            const link = new URL(file, `${host}/${skill.name}/`).href
            const dest = path.join(root, file)
            await mkdir(path.dirname(dest), { recursive: true })
            await get(link, dest)
          }),
        )

        const md = path.join(root, "SKILL.md")
        if (await Bun.file(md).exists()) result.push(root)
      }),
    )

    return result
  }
```
**File:** packages/opencode/src/tool/skill.ts (L10-20)
```typescript
export const SkillTool = Tool.define("skill", async (ctx) => {
  const skills = await Skill.all()

  // Filter skills by agent permissions if agent provided
  const agent = ctx?.agent
  const accessibleSkills = agent
    ? skills.filter((skill) => {
        const rule = PermissionNext.evaluate("skill", skill.name, agent.permission)
        return rule.action !== "deny"
      })
    : skills
```
**File:** packages/opencode/src/tool/skill.ts (L22-46)
```typescript
  const description =
    accessibleSkills.length === 0
      ? "Load a specialized skill that provides domain-specific instructions and workflows. No skills are currently available."
      : [
          "Load a specialized skill that provides domain-specific instructions and workflows.",
          "",
          "When you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.",
          "",
          "The skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.",
          "",
          'Tool output includes a `<skill_content name="...">` block with the loaded content.',
          "",
          "The following skills provide specialized sets of instructions for particular tasks",
          "Invoke this tool to load a skill when a task matches one of the available skills listed below:",
          "",
          "<available_skills>",
          ...accessibleSkills.flatMap((skill) => [
            `  <skill>`,
            `    <name>${skill.name}</name>`,
            `    <description>${skill.description}</description>`,
            `    <location>${pathToFileURL(skill.location).href}</location>`,
            `  </skill>`,
          ]),
          "</available_skills>",
        ].join("\n")
```
**File:** packages/opencode/src/tool/skill.ts (L76-122)
```typescript
      const dir = path.dirname(skill.location)
      const base = pathToFileURL(dir).href

      const limit = 10
      const files = await iife(async () => {
        const arr = []
        for await (const file of Ripgrep.files({
          cwd: dir,
          follow: false,
          hidden: true,
          signal: ctx.abort,
        })) {
          if (file.includes("SKILL.md")) {
            continue
          }
          arr.push(path.resolve(dir, file))
          if (arr.length >= limit) {
            break
          }
        }
        return arr
      }).then((f) => f.map((file) => `<file>${file}</file>`).join("\n"))

      return {
        title: `Loaded skill: ${skill.name}`,
        output: [
          `<skill_content name="${skill.name}">`,
          `# Skill: ${skill.name}`,
          "",
          skill.content.trim(),
          "",
          `Base directory for this skill: ${base}`,
          "Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.",
          "Note: file list is sampled.",
          "",
          "<skill_files>",
          files,
          "</skill_files>",
          "</skill_content>",
        ].join("\n"),
        metadata: {
          name: skill.name,
          dir,
        },
      }
    },
  }
```
**File:** packages/opencode/src/tool/registry.ts (L34-58)
```typescript
  export const state = Instance.state(async () => {
    const custom = [] as Tool.Info[]
    const glob = new Bun.Glob("{tool,tools}/*.{js,ts}")

    const matches = await Config.directories().then((dirs) =>
      dirs.flatMap((dir) => [...glob.scanSync({ cwd: dir, absolute: true, followSymlinks: true, dot: true })]),
    )
    if (matches.length) await Config.waitForDependencies()
    for (const match of matches) {
      const namespace = path.basename(match, path.extname(match))
      const mod = await import(match)
      for (const [id, def] of Object.entries<ToolDefinition>(mod)) {
        custom.push(fromPlugin(id === "default" ? namespace : `${namespace}_${id}`, def))
      }
    }

    const plugins = await Plugin.list()
    for (const plugin of plugins) {
      for (const [id, def] of Object.entries(plugin.tool ?? {})) {
        custom.push(fromPlugin(id, def))
      }
    }

    return { custom }
  })
```
**File:** packages/opencode/src/tool/registry.ts (L99-121)
```typescript
    return [
      InvalidTool,
      ...(question ? [QuestionTool] : []),
      BashTool,
      ReadTool,
      GlobTool,
      GrepTool,
      EditTool,
      WriteTool,
      TaskTool,
      WebFetchTool,
      TodoWriteTool,
      // TodoReadTool,
      WebSearchTool,
      CodeSearchTool,
      SkillTool,
      ApplyPatchTool,
      ...(Flag.OPENCODE_EXPERIMENTAL_LSP_TOOL ? [LspTool] : []),
      ...(config.experimental?.batch_tool === true ? [BatchTool] : []),
      ...(Flag.OPENCODE_EXPERIMENTAL_PLAN_MODE && Flag.OPENCODE_CLIENT === "cli" ? [PlanExitTool, PlanEnterTool] : []),
      ...custom,
    ]
  }
```
**File:** packages/opencode/src/tool/truncation.ts (L50-105)
```typescript
  export async function output(text: string, options: Options = {}, agent?: Agent.Info): Promise<Result> {
    const maxLines = options.maxLines ?? MAX_LINES
    const maxBytes = options.maxBytes ?? MAX_BYTES
    const direction = options.direction ?? "head"
    const lines = text.split("\n")
    const totalBytes = Buffer.byteLength(text, "utf-8")

    if (lines.length <= maxLines && totalBytes <= maxBytes) {
      return { content: text, truncated: false }
    }

    const out: string[] = []
    let i = 0
    let bytes = 0
    let hitBytes = false

    if (direction === "head") {
      for (i = 0; i < lines.length && i < maxLines; i++) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (i > 0 ? 1 : 0)
        if (bytes + size > maxBytes) {
          hitBytes = true
          break
        }
        out.push(lines[i])
        bytes += size
      }
    } else {
      for (i = lines.length - 1; i >= 0 && out.length < maxLines; i--) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (out.length > 0 ? 1 : 0)
        if (bytes + size > maxBytes) {
          hitBytes = true
          break
        }
        out.unshift(lines[i])
        bytes += size
      }
    }

    const removed = hitBytes ? totalBytes - bytes : lines.length - out.length
    const unit = hitBytes ? "bytes" : "lines"
    const preview = out.join("\n")

    const id = Identifier.ascending("tool")
    const filepath = path.join(DIR, id)
    await Bun.write(Bun.file(filepath), text)

    const hint = hasTaskTool(agent)
      ? `The tool call succeeded but the output was truncated. Full output saved to: ${filepath}\nUse the Task tool to have explore agent process this file with Grep and Read (with offset/limit). Do NOT read the full file yourself - delegate to save context.`
      : `The tool call succeeded but the output was truncated. Full output saved to: ${filepath}\nUse Grep to search the full content or Read with offset/limit to view specific sections.`
    const message =
      direction === "head"
        ? `${preview}\n\n...${removed} ${unit} truncated...\n\n${hint}`
        : `...${removed} ${unit} truncated...\n\n${hint}\n\n${preview}`

    return { content: message, truncated: true, outputPath: filepath }
  }
```
**File:** packages/opencode/src/tool/batch.ts (L1-60)
```typescript
import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION from "./batch.txt"

const DISALLOWED = new Set(["batch"])
const FILTERED_FROM_SUGGESTIONS = new Set(["invalid", "patch", ...DISALLOWED])

export const BatchTool = Tool.define("batch", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      tool_calls: z
        .array(
          z.object({
            tool: z.string().describe("The name of the tool to execute"),
            parameters: z.object({}).loose().describe("Parameters for the tool"),
          }),
        )
        .min(1, "Provide at least one tool call")
        .describe("Array of tool calls to execute in parallel"),
    }),
    formatValidationError(error) {
      const formattedErrors = error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join(".") : "root"
          return `  - ${path}: ${issue.message}`
        })
        .join("\n")

      return `Invalid parameters for tool 'batch':\n${formattedErrors}\n\nExpected payload format:\n  [{"tool": "tool_name", "parameters": {...}}, {...}]`
    },
    async execute(params, ctx) {
      const { Session } = await import("../session")
      const { Identifier } = await import("../id/id")

      const toolCalls = params.tool_calls.slice(0, 25)
      const discardedCalls = params.tool_calls.slice(25)

      const { ToolRegistry } = await import("./registry")
      const availableTools = await ToolRegistry.tools({ modelID: "", providerID: "" })
      const toolMap = new Map(availableTools.map((t) => [t.id, t]))

      const executeCall = async (call: (typeof toolCalls)[0]) => {
        const callStartTime = Date.now()
        const partID = Identifier.ascending("part")

        try {
          if (DISALLOWED.has(call.tool)) {
            throw new Error(
              `Tool '${call.tool}' is not allowed in batch. Disallowed tools: ${Array.from(DISALLOWED).join(", ")}`,
            )
          }

          const tool = toolMap.get(call.tool)
          if (!tool) {
            const availableToolsList = Array.from(toolMap.keys()).filter((name) => !FILTERED_FROM_SUGGESTIONS.has(name))
            throw new Error(
              `Tool '${call.tool}' not in registry. External tools (MCP, environment) cannot be batched - call them directly. Available tools: ${availableToolsList.join(", ")}`,
            )
          }
```
**File:** packages/opencode/src/session/prompt.ts (L274-726)
```typescript
  export const loop = fn(LoopInput, async (input) => {
    const { sessionID, resume_existing } = input

    const abort = resume_existing ? resume(sessionID) : start(sessionID)
    if (!abort) {
      return new Promise<MessageV2.WithParts>((resolve, reject) => {
        const callbacks = state()[sessionID].callbacks
        callbacks.push({ resolve, reject })
      })
    }

    using _ = defer(() => cancel(sessionID))

    // Structured output state
    // Note: On session resumption, state is reset but outputFormat is preserved
    // on the user message and will be retrieved from lastUser below
    let structuredOutput: unknown | undefined

    let step = 0
    const session = await Session.get(sessionID)
    while (true) {
      SessionStatus.set(sessionID, { type: "busy" })
      log.info("loop", { step, sessionID })
      if (abort.aborted) break
      let msgs = await MessageV2.filterCompacted(MessageV2.stream(sessionID))

      let lastUser: MessageV2.User | undefined
      let lastAssistant: MessageV2.Assistant | undefined
      let lastFinished: MessageV2.Assistant | undefined
      let tasks: (MessageV2.CompactionPart | MessageV2.SubtaskPart)[] = []
      for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        if (!lastUser && msg.info.role === "user") lastUser = msg.info as MessageV2.User
        if (!lastAssistant && msg.info.role === "assistant") lastAssistant = msg.info as MessageV2.Assistant
        if (!lastFinished && msg.info.role === "assistant" && msg.info.finish)
          lastFinished = msg.info as MessageV2.Assistant
        if (lastUser && lastFinished) break
        const task = msg.parts.filter((part) => part.type === "compaction" || part.type === "subtask")
        if (task && !lastFinished) {
          tasks.push(...task)
        }
      }

      if (!lastUser) throw new Error("No user message found in stream. This should never happen.")
      if (
        lastAssistant?.finish &&
        !["tool-calls", "unknown"].includes(lastAssistant.finish) &&
        lastUser.id < lastAssistant.id
      ) {
        log.info("exiting loop", { sessionID })
        break
      }

      step++
      if (step === 1)
        ensureTitle({
          session,
          modelID: lastUser.model.modelID,
          providerID: lastUser.model.providerID,
          history: msgs,
        })

      const model = await Provider.getModel(lastUser.model.providerID, lastUser.model.modelID).catch((e) => {
        if (Provider.ModelNotFoundError.isInstance(e)) {
          const hint = e.data.suggestions?.length ? ` Did you mean: ${e.data.suggestions.join(", ")}?` : ""
          Bus.publish(Session.Event.Error, {
            sessionID,
            error: new NamedError.Unknown({
              message: `Model not found: ${e.data.providerID}/${e.data.modelID}.${hint}`,
            }).toObject(),
          })
        }
        throw e
      })
      const task = tasks.pop()

      // pending subtask
      // TODO: centralize "invoke tool" logic
      if (task?.type === "subtask") {
        const taskTool = await TaskTool.init()
        const taskModel = task.model ? await Provider.getModel(task.model.providerID, task.model.modelID) : model
        const assistantMessage = (await Session.updateMessage({
          id: Identifier.ascending("message"),
          role: "assistant",
          parentID: lastUser.id,
          sessionID,
          mode: task.agent,
          agent: task.agent,
          variant: lastUser.variant,
          path: {
            cwd: Instance.directory,
            root: Instance,
          },
          cost: 0,
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
          modelID: taskModel.id,
          providerID: taskModel.providerID,
          time: {
            created: Date.now(),
          },
        })) as MessageV2.Assistant
        let part = (await Session.updatePart({
          id: Identifier.ascending("part"),
          messageID: assistantMessage.id,
          sessionID: assistantMessage.sessionID,
          type: "tool",
          callID: ulid(),
          tool: TaskTool.id,
          state: {
            status: "running",
            input: {
              prompt: task.prompt,
              description: task.description,
              subagent_type: task.agent,
              command: task.command,
            },
            time: {
              start: Date.now(),
            },
          },
        })) as MessageV2.ToolPart
        const taskArgs = {
          prompt: task.prompt,
          description: task.description,
          subagent_type: task.agent,
          command: task.command,
        }
        await Plugin.trigger(
          "tool.execute.before",
          {
            tool: "task",
            sessionID,
            callID: part.id,
          },
          { args: taskArgs },
        )
        let executionError: Error | undefined
        const taskAgent = await Agent.get(task.agent)
        const taskCtx: Tool.Context = {
          agent: task.agent,
          messageID: assistantMessage.id,
          sessionID: sessionID,
          abort,
          callID: part.callID,
          extra: { bypassAgentCheck: true },
          messages: msgs,
          async metadata(input) {
            await Session.updatePart({
              ...part,
              type: "tool",
              state: {
                ...part.state,
                ...input,
              },
            } satisfies MessageV2.ToolPart)
          },
          async ask(req) {
            await PermissionNext.ask({
              ...req,
              sessionID: sessionID,
              ruleset: PermissionNext.merge(taskAgent.permission, session.permission ?? []),
            })
          },
        }
        const result = await taskTool.execute(taskArgs, taskCtx).catch((error) => {
          executionError = error
          log.error("subtask execution failed", { error, agent: task.agent, description: task.description })
          return undefined
        })
        const attachments = result?.attachments?.map((attachment) => ({
          ...attachment,
          id: Identifier.ascending("part"),
          sessionID,
          messageID: assistantMessage.id,
        }))
        await Plugin.trigger(
          "tool.execute.after",
          {
            tool: "task",
            sessionID,
            callID: part.id,
            args: taskArgs,
          },
          result,
        )
        assistantMessage.finish = "tool-calls"
        assistantMessage.time.completed = Date.now()
        await Session.updateMessage(assistantMessage)
        if (result && part.state.status === "running") {
          await Session.updatePart({
            ...part,
            state: {
              status: "completed",
              input: part.state.input,
              title: result.title,
              metadata: result.metadata,
              output: result.output,
              attachments,
              time: {
                ...part.state.time,
                end: Date.now(),
              },
            },
          } satisfies MessageV2.ToolPart)
        }
        if (!result) {
          await Session.updatePart({
            ...part,
            state: {
              status: "error",
              error: executionError ? `Tool execution failed: ${executionError.message}` : "Tool execution failed",
              time: {
                start: part.state.status === "running" ? part.state.time.start : Date.now(),
                end: Date.now(),
              },
              metadata: part.metadata,
              input: part.state.input,
            },
          } satisfies MessageV2.ToolPart)
        }

        if (task.command) {
          // Add synthetic user message to prevent certain reasoning models from erroring
          // If we create assistant messages w/ out user ones following mid loop thinking signatures
          // will be missing and it can cause errors for models like gemini for example
          const summaryUserMsg: MessageV2.User = {
            id: Identifier.ascending("message"),
            sessionID,
            role: "user",
            time: {
              created: Date.now(),
            },
            agent: lastUser.agent,
            model: lastUser.model,
          }
          await Session.updateMessage(summaryUserMsg)
          await Session.updatePart({
            id: Identifier.ascending("part"),
            messageID: summaryUserMsg.id,
            sessionID,
            type: "text",
            text: "Summarize the task tool output above and continue with your task.",
            synthetic: true,
          } satisfies MessageV2.TextPart)
        }

        continue
      }

      // pending compaction
      if (task?.type === "compaction") {
        const result = await SessionCompaction.process({
          messages: msgs,
          parentID: lastUser.id,
          abort,
          sessionID,
          auto: task.auto,
        })
        if (result === "stop") break
        continue
      }

      // context overflow, needs compaction
      if (
        lastFinished &&
        lastFinished.summary !== true &&
        (await SessionCompaction.isOverflow({ tokens: lastFinished.tokens, model }))
      ) {
        await SessionCompaction.create({
          sessionID,
          agent: lastUser.agent,
          model: lastUser.model,
          auto: true,
        })
        continue
      }

      // normal processing
      const agent = await Agent.get(lastUser.agent)
      const maxSteps = agent.steps ?? Infinity
      const isLastStep = step >= maxSteps
      msgs = await insertReminders({
        messages: msgs,
        agent,
        session,
      })

      const processor = SessionProcessor.create({
        assistantMessage: (await Session.updateMessage({
          id: Identifier.ascending("message"),
          parentID: lastUser.id,
          role: "assistant",
          mode: agent.name,
          agent: agent.name,
          variant: lastUser.variant,
          path: {
            cwd: Instance.directory,
            root: Instance,
          },
          cost: 0,
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
          modelID: model.id,
          providerID: model.providerID,
          time: {
            created: Date.now(),
          },
          sessionID,
        })) as MessageV2.Assistant,
        sessionID: sessionID,
        model,
        abort,
      })
      using _ = defer(() => InstructionPrompt.clear(processor.message.id))

      // Check if user explicitly invoked an agent via @ in this turn
      const lastUserMsg = msgs.findLast((m) => m.info.role === "user")
      const bypassAgentCheck = lastUserMsg?.parts.some((p) => p.type === "agent") ?? false

      const tools = await resolveTools({
        agent,
        session,
        model,
        tools: lastUser.tools,
        processor,
        bypassAgentCheck,
        messages: msgs,
      })

      // Inject StructuredOutput tool if JSON schema mode enabled
      if (lastUser.format?.type === "json_schema") {
        tools["StructuredOutput"] = createStructuredOutputTool({
          schema: lastUser.format.schema,
          onSuccess(output) {
            structuredOutput = output
          },
        })
      }

      if (step === 1) {
        SessionSummary.summarize({
          sessionID: sessionID,
          messageID: lastUser.id,
        })
      }

      const sessionMessages = clone(msgs)

      // Ephemerally wrap queued user messages with a reminder to stay on track
      if (step > 1 && lastFinished) {
        for (const msg of sessionMessages) {
          if (msg.info.role !== "user" || msg.info.id <= lastFinished.id) continue
          for (const part of msg.parts) {
            if (part.type !== "text" || part.ignored || part.synthetic) continue
            if (!part.text.trim()) continue
            part.text = [
              "<system-reminder>",
              "The user sent the following message:",
              part.text,
              "",
              "Please address this message and continue with your tasks.",
              "</system-reminder>",
            ].join("\n")
          }
        }
      }

      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })

      // Build system prompt, adding structured output instruction if needed
      const system = [...(await SystemPrompt.environment(model)), ...(await InstructionPrompt.system())]
      const format = lastUser.format ?? { type: "text" }
      if (format.type === "json_schema") {
        system.push(STRUCTURED_OUTPUT_SYSTEM_PROMPT)
      }

      const result = await processor.process({
        user: lastUser,
        agent,
        abort,
        sessionID,
        system,
        messages: [
          ...MessageV2.toModelMessages(sessionMessages, model),
          ...(isLastStep
            ? [
                {
                  role: "assistant" as const,
                  content: MAX_STEPS,
                },
              ]
            : []),
        ],
        tools,
        model,
        toolChoice: format.type === "json_schema" ? "required" : undefined,
      })

      // If structured output was captured, save it and exit immediately
      // This takes priority because the StructuredOutput tool was called successfully
      if (structuredOutput !== undefined) {
        processor.message.structured = structuredOutput
        processor.message.finish = processor.message.finish ?? "stop"
        await Session.updateMessage(processor.message)
        break
      }

      // Check if model finished (finish reason is not "tool-calls" or "unknown")
      const modelFinished = processor.message.finish && !["tool-calls", "unknown"].includes(processor.message.finish)

      if (modelFinished && !processor.message.error) {
        if (format.type === "json_schema") {
          // Model stopped without calling StructuredOutput tool
          processor.message.error = new MessageV2.StructuredOutputError({
            message: "Model did not produce structured output",
            retries: 0,
          }).toObject()
          await Session.updateMessage(processor.message)
          break
        }
      }

      if (result === "stop") break
      if (result === "compact") {
        await SessionCompaction.create({
          sessionID,
          agent: lastUser.agent,
          model: lastUser.model,
          auto: true,
        })
      }
      continue
    }
    SessionCompaction.prune({ sessionID })
    for await (const item of MessageV2.stream(sessionID)) {
      if (item.info.role === "user") continue
      const queued = state()[sessionID]?.callbacks ?? []
      for (const q of queued) {
        q.resolve(item)
      }
      return item
    }
    throw new Error("Impossible")
  })
```
**File:** packages/opencode/src/session/prompt.ts (L773-780)
```typescript
      async ask(req) {
        await PermissionNext.ask({
          ...req,
          sessionID: input.session.id,
          tool: { messageID: input.processor.message.id, callID: options.toolCallId },
          ruleset: PermissionNext.merge(input.agent.permission, input.session.permission ?? []),
        })
      },
```
**File:** packages/opencode/src/session/prompt.ts (L783-830)
```typescript
    for (const item of await ToolRegistry.tools(
      { modelID: input.model.api.id, providerID: input.model.providerID },
      input.agent,
    )) {
      const schema = ProviderTransform.schema(input.model, z.toJSONSchema(item.parameters))
      tools[item.id] = tool({
        id: item.id as any,
        description: item.description,
        inputSchema: jsonSchema(schema as any),
        async execute(args, options) {
          const ctx = context(args, options)
          await Plugin.trigger(
            "tool.execute.before",
            {
              tool: item.id,
              sessionID: ctx.sessionID,
              callID: ctx.callID,
            },
            {
              args,
            },
          )
          const result = await item.execute(args, ctx)
          const output = {
            ...result,
            attachments: result.attachments?.map((attachment) => ({
              ...attachment,
              id: Identifier.ascending("part"),
              sessionID: ctx.sessionID,
              messageID: input.processor.message.id,
            })),
          }
          await Plugin.trigger(
            "tool.execute.after",
            {
              tool: item.id,
              sessionID: ctx.sessionID,
              callID: ctx.callID,
              args,
            },
            output,
          )
          return output
        },
      })
    }

    for (const [key, item] of Object.entries(await MCP.tools())) {
```
**File:** packages/opencode/src/session/prompt.ts (L1321-1350)
```typescript
  async function insertReminders(input: { messages: MessageV2.WithParts[]; agent: Agent.Info; session: Session.Info }) {
    const userMessage = input.messages.findLast((msg) => msg.info.role === "user")
    if (!userMessage) return input.messages

    // Original logic when experimental plan mode is disabled
    if (!Flag.OPENCODE_EXPERIMENTAL_PLAN_MODE) {
      if (input.agent.name === "plan") {
        userMessage.parts.push({
          id: Identifier.ascending("part"),
          messageID: userMessage.info.id,
          sessionID: userMessage.info.sessionID,
          type: "text",
          text: PROMPT_PLAN,
          synthetic: true,
        })
      }
      const wasPlan = input.messages.some((msg) => msg.info.role === "assistant" && msg.info.agent === "plan")
      if (wasPlan && input.agent.name === "build") {
        userMessage.parts.push({
          id: Identifier.ascending("part"),
          messageID: userMessage.info.id,
          sessionID: userMessage.info.sessionID,
          type: "text",
          text: BUILD_SWITCH,
          synthetic: true,
        })
      }
      return input.messages
    }

```
**File:** packages/opencode/src/session/llm.ts (L67-97)
```typescript
    const system = []
    system.push(
      [
        // use agent prompt otherwise provider prompt
        // For Codex sessions, skip SystemPrompt.provider() since it's sent via options.instructions
        ...(input.agent.prompt ? [input.agent.prompt] : isCodex ? [] : SystemPrompt.provider(input.model)),
        // any custom prompt passed into this call
        ...input.system,
        // any custom prompt from last user message
        ...(input.user.system ? [input.user.system] : []),
      ]
        .filter((x) => x)
        .join("\n"),
    )

    const header = system[0]
    const original = clone(system)
    await Plugin.trigger(
      "experimental.chat.system.transform",
      { sessionID: input.sessionID, model: input.model },
      { system },
    )
    if (system.length === 0) {
      system.push(...original)
    }
    // rejoin to maintain 2-part structure for caching if header unchanged
    if (system.length > 2 && system[0] === header) {
      const rest = system.slice(1)
      system.length = 0
      system.push(header, rest.join("\n"))
    }
```
**File:** packages/opencode/src/session/llm.ts (L99-113)
```typescript
    const variant =
      !input.small && input.model.variants && input.user.variant ? input.model.variants[input.user.variant] : {}
    const base = input.small
      ? ProviderTransform.smallOptions(input.model)
      : ProviderTransform.options({
          model: input.model,
          sessionID: input.sessionID,
          providerOptions: provider.options,
        })
    const options: Record<string, any> = pipe(
      base,
      mergeDeep(input.model.options),
      mergeDeep(input.agent.options),
      mergeDeep(variant),
    )
```
**File:** packages/opencode/src/session/system.ts (L19-27)
```typescript
  export function provider(model: Provider.Model) {
    if (model.api.id.includes("gpt-5")) return [PROMPT_CODEX]
    if (model.api.id.includes("gpt-") || model.api.id.includes("o1") || model.api.id.includes("o3"))
      return [PROMPT_BEAST]
    if (model.api.id.includes("gemini-")) return [PROMPT_GEMINI]
    if (model.api.id.includes("claude")) return [PROMPT_ANTHROPIC]
    if (model.api.id.toLowerCase().includes("trinity")) return [PROMPT_TRINITY]
    return [PROMPT_ANTHROPIC_WITHOUT_TODO]
  }
```
**File:** packages/opencode/src/session/prompt/anthropic.txt (L1-105)
```text
You are OpenCode, the best coding agent on the planet.

You are an interactive CLI tool that helps users with software engineering tasks. Use the instructions below and the tools available to you to assist the user.

IMPORTANT: You must NEVER generate or guess URLs for the user unless you are confident that the URLs are for helping the user with programming. You may use URLs provided by the user in their messages or local files.

If the user asks for help or wants to give feedback inform them of the following:
- ctrl+p to list available actions
- To give feedback, users should report the issue at
  https://github.com/anomalyco/opencode

When the user directly asks about OpenCode (eg. "can OpenCode do...", "does OpenCode have..."), or asks in second person (eg. "are you able...", "can you do..."), or asks how to use a specific OpenCode feature (eg. implement a hook, write a slash command, or install an MCP server), use the WebFetch tool to gather information to answer the question from OpenCode docs. The list of available docs is available at https://opencode.ai/docs

# Tone and style
- Only use emojis if the user explicitly requests it. Avoid using emojis in all communication unless asked.
- Your output will be displayed on a command line interface. Your responses should be short and concise. You can use GitHub-flavored markdown for formatting, and will be rendered in a monospace font using the CommonMark specification.
- Output text to communicate with the user; all text you output outside of tool use is displayed to the user. Only use tools to complete tasks. Never use tools like Bash or code comments as means to communicate with the user during the session.
- NEVER create files unless they're absolutely necessary for achieving your goal. ALWAYS prefer editing an existing file to creating a new one. This includes markdown files.

# Professional objectivity
Prioritize technical accuracy and truthfulness over validating the user's beliefs. Focus on facts and problem-solving, providing direct, objective technical info without any unnecessary superlatives, praise, or emotional validation. It is best for the user if OpenCode honestly applies the same rigorous standards to all ideas and disagrees when necessary, even if it may not be what the user wants to hear. Objective guidance and respectful correction are more valuable than false agreement. Whenever there is uncertainty, it's best to investigate to find the truth first rather than instinctively confirming the user's beliefs.

# Task Management
You have access to the TodoWrite tools to help you manage and plan tasks. Use these tools VERY frequently to ensure that you are tracking your tasks and giving the user visibility into your progress.
These tools are also EXTREMELY helpful for planning tasks, and for breaking down larger complex tasks into smaller steps. If you do not use this tool when planning, you may forget to do important tasks - and that is unacceptable.

It is critical that you mark todos as completed as soon as you are done with a task. Do not batch up multiple tasks before marking them as completed.

Examples:

<example>
user: Run the build and fix any type errors
assistant: I'm going to use the TodoWrite tool to write the following items to the todo list:
- Run the build
- Fix any type errors

I'm now going to run the build using Bash.

Looks like I found 10 type errors. I'm going to use the TodoWrite tool to write 10 items to the todo list.

marking the first todo as in_progress

Let me start working on the first item...

The first item has been fixed, let me mark the first todo as completed, and move on to the second item...
..
..
</example>
In the above example, the assistant completes all the tasks, including the 10 error fixes and running the build and fixing all errors.

<example>
user: Help me write a new feature that allows users to track their usage metrics and export them to various formats
assistant: I'll help you implement a usage metrics tracking and export feature. Let me first use the TodoWrite tool to plan this task.
Adding the following todos to the todo list:
1. Research existing metrics tracking in the codebase
2. Design the metrics collection system
3. Implement core metrics tracking functionality
4. Create export functionality for different formats

Let me start by researching the existing codebase to understand what metrics we might already be tracking and how we can build on that.

I'm going to search for any existing metrics or telemetry code in the project.

I've found some existing telemetry code. Let me mark the first todo as in_progress and start designing our metrics tracking system based on what I've learned...

[Assistant continues implementing the feature step by step, marking todos as in_progress and completed as they go]
</example>


# Doing tasks
The user will primarily request you perform software engineering tasks. This includes solving bugs, adding new functionality, refactoring code, explaining code, and more. For these tasks the following steps are recommended:
- 
- Use the TodoWrite tool to plan the task if required

- Tool results and user messages may include <system-reminder> tags. <system-reminder> tags contain useful information and reminders. They are automatically added by the system, and bear no direct relation to the specific tool results or user messages in which they appear.


# Tool usage policy
- When doing file search, prefer to use the Task tool in order to reduce context usage.
- You should proactively use the Task tool with specialized agents when the task at hand matches the agent's description.

- When WebFetch returns a message about a redirect to a different host, you should immediately make a new WebFetch request with the redirect URL provided in the response.
- You can call multiple tools in a single response. If you intend to call multiple tools and there are no dependencies between them, make all independent tool calls in parallel. Maximize use of parallel tool calls where possible to increase efficiency. However, if some tool calls depend on previous calls to inform dependent values, do NOT call these tools in parallel and instead call them sequentially. For instance, if one operation must complete before another starts, run these operations sequentially instead. Never use placeholders or guess missing parameters in tool calls.
- If the user specifies that they want you to run tools "in parallel", you MUST send a single message with multiple tool use content blocks. For example, if you need to launch multiple agents in parallel, send a single message with multiple Task tool calls.
- Use specialized tools instead of bash commands when possible, as this provides a better user experience. For file operations, use dedicated tools: Read for reading files instead of cat/head/tail, Edit for editing instead of sed/awk, and Write for creating files instead of cat with heredoc or echo redirection. Reserve bash tools exclusively for actual system commands and terminal operations that require shell execution. NEVER use bash echo or other command-line tools to communicate thoughts, explanations, or instructions to the user. Output all communication directly in your response text instead.
- VERY IMPORTANT: When exploring the codebase to gather context or to answer a question that is not a needle query for a specific file/class/function, it is CRITICAL that you use the Task tool instead of running search commands directly.
<example>
user: Where are errors from the client handled?
assistant: [Uses the Task tool to find the files that handle client errors instead of using Glob or Grep directly]
</example>
<example>
user: What is the codebase structure?
assistant: [Uses the Task tool]
</example>

IMPORTANT: Always use the TodoWrite tool to plan and track tasks throughout the conversation.

# Code References

When referencing specific functions or pieces of code include the pattern `file_path:line_number` to allow the user to easily navigate to the source code location.

<example>
user: Where are errors from the client handled?
assistant: Clients are marked as failed in the `connectToServer` function in src/services/process.ts:712.
</example>
```
**File:** packages/opencode/src/session/instruction.ts (L13-29)
```typescript
const FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  "CONTEXT.md", // deprecated
]

function globalFiles() {
  const files = []
  if (Flag.OPENCODE_CONFIG_DIR) {
    files.push(path.join(Flag.OPENCODE_CONFIG_DIR, "AGENTS.md"))
  }
  files.push(path.join(Global.Path.config, "AGENTS.md"))
  if (!Flag.OPENCODE_DISABLE_CLAUDE_CODE_PROMPT) {
    files.push(path.join(os.homedir(), ".claude", "CLAUDE.md"))
  }
  return files
}
```
**File:** packages/opencode/src/session/instruction.ts (L171-196)
```typescript
  export async function resolve(messages: MessageV2.WithParts[], filepath: string, messageID: string) {
    const system = await systemPaths()
    const already = loaded(messages)
    const results: { filepath: string; content: string }[] = []

    const target = path.resolve(filepath)
    let current = path.dirname(target)
    const root = path.resolve(Instance.directory)

    while (current.startsWith(root) && current !== root) {
      const found = await find(current)

      if (found && found !== target && !system.has(found) && !already.has(found) && !isClaimed(messageID, found)) {
        claim(messageID, found)
        const content = await Bun.file(found)
          .text()
          .catch(() => undefined)
        if (content) {
          results.push({ filepath: found, content: "Instructions from: " + found + "\n" + content })
        }
      }
      current = path.dirname(current)
    }

    return results
  }
```
**File:** packages/opencode/src/session/index.ts (L114-155)
```typescript
  export const Info = z
    .object({
      id: Identifier.schema("session"),
      slug: z.string(),
      projectID: z.string(),
      directory: z.string(),
      parentID: Identifier.schema("session").optional(),
      summary: z
        .object({
          additions: z.number(),
          deletions: z.number(),
          files: z.number(),
          diffs: Snapshot.FileDiff.array().optional(),
        })
        .optional(),
      share: z
        .object({
          url: z.string(),
        })
        .optional(),
      title: z.string(),
      version: z.string(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
        compacting: z.number().optional(),
        archived: z.number().optional(),
      }),
      permission: PermissionNext.Ruleset.optional(),
      revert: z
        .object({
          messageID: z.string(),
          partID: z.string().optional(),
          snapshot: z.string().optional(),
          diff: z.string().optional(),
        })
        .optional(),
    })
    .meta({
      ref: "Session",
    })
  export type Info = z.output<typeof Info>
```
**File:** packages/opencode/src/session/compaction.ts (L32-48)
```typescript
  export async function isOverflow(input: { tokens: MessageV2.Assistant["tokens"]; model: Provider.Model }) {
    const config = await Config.get()
    if (config.compaction?.auto === false) return false
    const context = input.model.limit.context
    if (context === 0) return false

    const count =
      input.tokens.total ||
      input.tokens.input + input.tokens.output + input.tokens.cache.read + input.tokens.cache.write

    const reserved =
      config.compaction?.reserved ?? Math.min(COMPACTION_BUFFER, ProviderTransform.maxOutputTokens(input.model))
    const usable = input.model.limit.input
      ? input.model.limit.input - reserved
      : context - ProviderTransform.maxOutputTokens(input.model)
    return count >= usable
  }
```
**File:** packages/opencode/src/session/compaction.ts (L53-99)
```typescript
  const PRUNE_PROTECTED_TOOLS = ["skill"]

  // goes backwards through parts until there are 40_000 tokens worth of tool
  // calls. then erases output of previous tool calls. idea is to throw away old
  // tool calls that are no longer relevant.
  export async function prune(input: { sessionID: string }) {
    const config = await Config.get()
    if (config.compaction?.prune === false) return
    log.info("pruning")
    const msgs = await Session.messages({ sessionID: input.sessionID })
    let total = 0
    let pruned = 0
    const toPrune = []
    let turns = 0

    loop: for (let msgIndex = msgs.length - 1; msgIndex >= 0; msgIndex--) {
      const msg = msgs[msgIndex]
      if (msg.info.role === "user") turns++
      if (turns < 2) continue
      if (msg.info.role === "assistant" && msg.info.summary) break loop
      for (let partIndex = msg.parts.length - 1; partIndex >= 0; partIndex--) {
        const part = msg.parts[partIndex]
        if (part.type === "tool")
          if (part.state.status === "completed") {
            if (PRUNE_PROTECTED_TOOLS.includes(part.tool)) continue

            if (part.state.time.compacted) break loop
            const estimate = Token.estimate(part.state.output)
            total += estimate
            if (total > PRUNE_PROTECT) {
              pruned += estimate
              toPrune.push(part)
            }
          }
      }
    }
    log.info("found", { pruned, total })
    if (pruned > PRUNE_MINIMUM) {
      for (const part of toPrune) {
        if (part.state.status === "completed") {
          part.state.time.compacted = Date.now()
          await Session.updatePart(part)
        }
      }
      log.info("pruned", { count: toPrune.length })
    }
  }
```
**File:** packages/opencode/src/session/compaction.ts (L151-200)
```typescript
    const defaultPrompt = `Provide a detailed prompt for continuing our conversation above.
Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next.
The summary that you construct will be used so that another agent can read it and continue the work.

When constructing the summary, try to stick to this template:
---
## Goal

[What goal(s) is the user trying to accomplish?]

## Instructions

- [What important instructions did the user give you that are relevant]
- [If there is a plan or spec, include information about it so next agent can continue using it]

## Discoveries

[What notable things were learned during this conversation that would be useful for the next agent to know when continuing the work]

## Accomplished

[What work has been completed, what work is still in progress, and what work is left?]

## Relevant files / directories

[Construct a structured list of relevant files that have been read, edited, or created that pertain to the task at hand. If all the files in a directory are relevant, include the path to the directory.]
---`

    const promptText = compacting.prompt ?? [defaultPrompt, ...compacting.context].join("\n\n")
    const result = await processor.process({
      user: userMessage,
      agent,
      abort: input.abort,
      sessionID: input.sessionID,
      tools: {},
      system: [],
      messages: [
        ...MessageV2.toModelMessages(input.messages, model),
        {
          role: "user",
          content: [
            {
              type: "text",
              text: promptText,
            },
          ],
        },
      ],
      model,
    })
```