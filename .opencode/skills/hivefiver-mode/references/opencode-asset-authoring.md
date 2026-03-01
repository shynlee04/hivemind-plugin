# OpenCode Asset Authoring Reference

> Condensed from OPENCODE-CONCEPTS-ADVANCED.md — hivefiver-specific extract.
> Last synced: 2026-03-01

---

## Agent Profile Schema

Every agent `.md` file uses YAML frontmatter mapped to an `Info` object:

| Field | Type | Effect |
|---|---|---|
| `prompt` | `string` | System prompt — **overrides** provider default entirely |
| `mode` | `primary` / `subagent` / `all` | Placement in agent taxonomy |
| `model` | `{ providerID, modelID }` | Agent-specific model override |
| `variant` | `string` | Model variant (thinking, extended) |
| `temperature` | `number` | LLM sampling temperature |
| `permission` | `Ruleset` | Per-tool access control rules |
| `steps` | `number` | Max agentic loop iterations before forced text-only |
| `hidden` | `boolean` | Hide from `@` autocomplete menu |
| `description` | `string` | **Critical** — injected into `task` tool prompt for delegation routing |

### Description Field = Delegation Steering

The `description` is **directly injected into the task tool's system prompt**. The LLM reads it when deciding which subagent to dispatch. This is your primary steering mechanism for intelligent delegation.

---

## Command Definition Schema

Commands are Markdown files with YAML frontmatter in `.opencode/commands/`:

```markdown
---
description: "Review the git diff for $ARGUMENTS"
agent: explore          # which agent runs this command
model: anthropic/claude-haiku-4
subtask: true           # run as child session via TaskTool
---
Please review the following: $ARGUMENTS

@src/               ← file/dir reference injection
!`git diff HEAD`    ← shell command output injection
```

### Template Interpolation Tokens

| Token | Meaning |
|---|---|
| `$ARGUMENTS` | Full text user typed after command name |
| `$1`, `$2` | Positional arguments |
| `@path/to/file` | Injects file/dir as context part |
| `` !`cmd` `` | Executes shell command, injects stdout |

### `subtask: true` — Command as Delegated Chain

When set, the command runs as a `TaskTool` call inside a child session. This is the key **chaining primitive**: commands → agent delegation → subagent sessions.

### Skills as Commands

Every loaded skill is automatically registered as an invokable command. When invoked as a command, the skill content becomes the prompt template.

---

## Skill Structure

A skill is a directory containing `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: "Use when user asks about X."
---
# Skill content
Instructions injected into context when loaded.
```

### Discovery Priority (later overwrites earlier on name collision)

1. `~/.claude/skills/`, `~/.agents/skills/` (global)
2. Project `.claude/skills/`, `.agents/skills/`
3. `.opencode/skill/` or `.opencode/skills/`
4. `config.skills.paths`
5. `config.skills.urls` (remote, cached locally)

### Context Injection Mechanics

When the LLM calls the `skill` tool:
1. Validates permission (`skill/<name>`)
2. Reads SKILL.md content
3. Lists up to 10 bundled files in skill directory
4. Returns `<skill_content name="...">` block with instructions + file list

**Key facts:**
- Skill outputs are **never pruned** — persists entire session
- Skills don't inherit across child sessions (each loads fresh)
- Agent body loads ONCE at session init, NOT per-turn

### Skill Permission Filtering

Agents with `skill: { "my-skill": "deny" }` won't see that skill in the available list.

---

## Permission System

### Ruleset: Ordered Array of Rules

Each rule: `{ permission, pattern, action }`. Evaluated **last-match-wins** with glob wildcards.

### Actions

| Action | Behavior |
|---|---|
| `allow` | Proceed without asking |
| `deny` | Hard-block, throws DeniedError |
| `ask` | Pause for human response |

### Permission Categories

| Tool(s) | Permission key | Pattern matches |
|---|---|---|
| `read` | `read` | File glob patterns |
| `edit`, `write`, `patch` | `edit` | File glob patterns |
| `bash` | `bash` | Full command string |
| `task` | `task` | **Agent name** being delegated to |
| `skill` | `skill` | Skill name |
| `doom_loop` | `doom_loop` | (auto-detected, default: ask) |

### Merge Order (low → high priority)

defaults → user config → agent config → session overrides

### Session-Level Permission Overrides

Child sessions carry own `permission` ruleset stored in DB. TaskTool creates child sessions with `todowrite: deny`, `todoread: deny`, `task: deny` by default.

---

## Config Hierarchy (Low → High)

1. Remote `.well-known/opencode`
2. Global `~/.config/opencode/opencode.json`
3. `OPENCODE_CONFIG` env var
4. Project `opencode.json` (walks up to worktree)
5. `.opencode/` directories
6. `OPENCODE_CONFIG_CONTENT` (inline)
7. Managed `/etc/opencode/` (enterprise, top)

### Auto-Discovery Globs

| Glob | Loads |
|---|---|
| `{command,commands}/**/*.md` | Custom commands |
| `{agent,agents}/**/*.md` | Custom agents |
| `{plugin,plugins}/*.{ts,js}` | Custom plugins |
| `{tool,tools}/*.{ts,js}` | Custom tools |
