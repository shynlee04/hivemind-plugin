---
title: "OpenCode SDK Capabilities Investigation"
date: 2026-04-01
author: hivexplorer
scope: opencode-sdk-capabilities
git_commit: 7da1d535
sources:
  - .sdk-lib/opencode/opencode-custom-tools.md
  - .sdk-lib/opencode/opencode-plugins.md
  - .sdk-lib/opencode/opencode-sdk.md
  - .sdk-lib/opencode/opencode-agents.md
  - .sdk-lib/opencode/opencode-commands.md
  - .sdk-lib/opencode/opencode-configs.md
  - .sdk-lib/opencode/opencode-rules.md
  - .sdk-lib/opencode/opencode-skills.md
  - .sdk-lib/opencode/opencode-built-in-tools.md
  - .sdk-lib/opencode/opencode-server.md
  - src/plugin/opencode-plugin.ts
  - src/hooks/event-handler.ts
---

# OpenCode SDK Capabilities Investigation

**Date:** 2026-04-01  
**Investigator:** hivexplorer  
**Git Commit:** 7da1d535  
**Scope:** Full SDK capability audit for HiveMind architecture restructuring

---

## Executive Summary

1. **Custom tools** are defined via `tool()` helper with Zod schemas (`tool.schema`), receive runtime context (`sessionID`, `agent`, `directory`, `worktree`, `messageID`), and can be written in any language (Python, etc.) via Bun shell invocation from a TS/JS definition file. Tools can override built-ins by name collision.

2. **Plugins** are async functions receiving `{ project, client, $, directory, worktree }` that return a hooks object. They can subscribe to 25+ event types, add custom tools, inject env vars, intercept tool execution, and customize compaction. npm plugins are auto-installed via Bun; local plugins load from `.opencode/plugins/` or `~/.config/opencode/plugins/`.

3. **Stacking model** follows a clear precedence: config merge (remote → global → custom → project → `.opencode/` → inline env), tool override (custom > built-in by name), permission override (agent > global), and hook execution (all hooks run in sequence, load order: global config → project config → global plugin dir → project plugin dir).

4. **Session context** available to tools: `sessionID`, `agent`, `messageID`, `directory`, `worktree`. Subagent sessions carry `parentSessionId`/`parentSessionID`/`parent_session_id` in event properties. The SDK client provides full session CRUD, message listing, prompt injection, and child session navigation.

5. **Hook/event system** exposes 25+ event types across 12 categories (Command, File, Installation, LSP, Message, Permission, Server, Session, Todo, Shell, Tool, TUI). Plugin hooks include `event`, `tool.execute.before`, `tool.execute.after`, `shell.env`, `permission.ask`, `experimental.session.compacting`, `experimental.chat.messages.transform`, `experimental.chat.system.transform`, `experimental.text.complete`, `chat.message`, `command.execute.before`.

6. **Agent/subagent model** distinguishes `primary` (user-facing, Tab-switchable), `subagent` (invoked via `@mention` or Task tool by primary agents), and `all` modes. Subagents create child sessions with parent linkage. Permissions can restrict which subagents an agent can invoke via `permission.task` with glob patterns.

---

## 1. Custom Tools Capabilities

### Definition API

**Source:** `.sdk-lib/opencode/opencode-custom-tools.md` (lines 16-29)

Tools are defined using the `tool()` helper from `@opencode-ai/plugin`:

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Tool description",
  args: {
    query: tool.schema.string().describe("Argument description"),
  },
  async execute(args, context) {
    return "result"
  },
})
```

### Argument Definition (Zod)

- `tool.schema` is a Zod re-export (line 86)
- Supports all Zod types: `.string()`, `.number()`, `.describe()`, etc.
- Can also import Zod directly: `import { z } from "zod"` and return a plain object (lines 93-105)

### Context Fields Available to Tools

**Source:** `.sdk-lib/opencode/opencode-custom-tools.md` (lines 107-123)

```typescript
const { agent, sessionID, messageID, directory, worktree } = context
```

| Field | Type | Description |
|-------|------|-------------|
| `agent` | string | Current agent name |
| `sessionID` | string | Current session identifier |
| `messageID` | string | Current message identifier |
| `directory` | string | Session working directory |
| `worktree` | string | Git worktree root path |

### Tool Registration Locations

| Location | Scope |
|----------|-------|
| `.opencode/tools/` | Project-level |
| `~/.config/opencode/tools/` | Global |
| Plugin `tool:` return object | Plugin-scoped (loaded with plugin) |

### Multiple Tools Per File

**Source:** `.sdk-lib/opencode/opencode-custom-tools.md` (lines 33-61)

Named exports create tools with `<filename>_<exportname>` naming:
```typescript
export const add = tool({...})   // → math_add
export const multiply = tool({...}) // → math_multiply
```

### Language Flexibility

**Source:** `.sdk-lib/opencode/opencode-custom-tools.md` (lines 126-157)

- Tool **definitions** must be TypeScript/JavaScript
- Tool **implementation** can be any language (Python, Ruby, etc.)
- Example uses `Bun.$` to invoke Python scripts
- The SDK does NOT natively execute Python tool definitions — only TS/JS

### Name Collision Behavior

**Source:** `.sdk-lib/opencode/opencode-custom-tools.md` (lines 63-83)

- Custom tools with the same name as built-in tools **take precedence**
- To disable without overriding: use permissions (`"bash": "deny"`)

### Per-Agent/Per-Workflow/Per-Intent Registration

**Finding:** The SDK does NOT support per-agent, per-workflow, or per-intent tool registration at the tool definition level. Tool availability is controlled via:
1. **Permissions** in `opencode.json` per-agent (lines 330-428 of agents.md)
2. **Plugin tools** are always available to all agents (unless denied by permission)
3. **Agent `tools` config** (deprecated) or `permission` config controls which tools each agent can use

---

## 2. Plugin Capabilities

### Plugin Function Signature

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 46-100)

```typescript
export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Hook implementations
  }
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | object | Current project information |
| `client` | OpencodeClient | SDK client for interacting with the AI/server |
| `$` | Bun shell | Bun's shell API for executing commands |
| `directory` | string | Current working directory |
| `worktree` | string | Git worktree path |

### Plugin Loading Locations

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 11-17)

| Location | Scope |
|----------|-------|
| `.opencode/plugins/` | Project-level |
| `~/.config/opencode/plugins/` | Global |
| npm packages via `plugin` config key | Shared/distributable |

### npm Plugin Installation

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 19-34)

```json
{
  "plugin": ["opencode-helicone-session", "opencode-wakatime", "@my-org/custom-plugin"]
}
```

- npm plugins auto-installed via Bun at startup
- Cached in `~/.cache/opencode/node_modules/`
- Both regular and scoped npm packages supported
- Local plugins can use external deps via `.opencode/package.json`

### Load Order

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 36-43)

1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

**Important:** Duplicate npm packages (same name+version) loaded once. Local plugin + npm plugin with same name are **both loaded separately**.

### Plugin Lifecycle

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 60-81)

1. **Load:** Plugin module imported from file or npm
2. **Init:** Plugin function called with context `{ project, client, $, directory, worktree }`
3. **Register:** Returned hooks object wired into OpenCode event system
4. **Execute:** Hooks fire on matching events throughout session lifetime
5. **Teardown:** No explicit teardown hook documented — plugin lives for process lifetime

### Adding Custom Tools from Plugins

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 196-228)

```typescript
export const CustomToolsPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "This is a custom tool",
        args: { foo: tool.schema.string() },
        async execute(args, context) {
          const { directory, worktree } = context
          return `Hello ${args.foo} from ${directory}`
        },
      }),
    },
  }
}
```

Plugin tools are available alongside built-in tools. Same name collision rule applies (plugin tool takes precedence).

---

## 3. Stacking Model — Priority Map

### Configuration Precedence

**Source:** `.sdk-lib/opencode/opencode-configs.md` (lines 20-39)

Config sources loaded in order (later overrides earlier for conflicting keys, non-conflicting preserved):

```
1. Remote config (.well-known/opencode)     — organizational defaults
2. Global config (~/.config/opencode/)      — user preferences
3. Custom config (OPENCODE_CONFIG env)      — custom overrides
4. Project config (opencode.json)           — project-specific
5. .opencode/ directories                   — agents, commands, plugins, tools
6. Inline config (OPENCODE_CONFIG_CONTENT)  — runtime overrides
```

**Key insight:** "Configuration files are merged together, not replaced." Non-conflicting settings from ALL sources are preserved.

### Tool Override Priority

```
Plugin tool (by name) > Custom tool (by name) > Built-in tool
```

If a plugin defines `tool: { bash: ... }`, it replaces the built-in bash tool.

### Permission Override Priority

**Source:** `.sdk-lib/opencode/opencode-agents.md` (lines 330-428)

```
Agent-specific permission > Global permission > Default (allow)
```

Agent permissions override global permissions. Last matching rule wins for glob patterns.

### Hook Execution Order

All hooks run in sequence. Load order determines hook registration order:

```
Global config plugins → Project config plugins → Global plugin dir → Project plugin dir
```

### Rules/Instructions Precedence

**Source:** `.sdk-lib/opencode/opencode-rules.md` (lines 68-74)

```
1. Local AGENTS.md (traversing up from cwd)
2. Global ~/.config/opencode/AGENTS.md
3. Claude Code fallback ~/.claude/CLAUDE.md (unless disabled)
```

First matching file wins per category. Custom instruction files from `opencode.json` `instructions` array are **combined** with AGENTS.md.

### Skills Loading

**Source:** `.sdk-lib/opencode/opencode-skills.md` (lines 6-18)

Skills discovered from multiple locations (all searched):
- `.opencode/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md`
- `.agents/skills/<name>/SKILL.md`
- `~/.config/opencode/skills/<name>/SKILL.md`
- `~/.claude/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`

Skills loaded on-demand via `skill` tool. Permission-controlled per-agent.

---

## 4. Session Context

### Tool Context Fields

**Source:** `.sdk-lib/opencode/opencode-custom-tools.md` (lines 107-123)

| Field | Description |
|-------|-------------|
| `context.sessionID` | Unique session identifier |
| `context.agent` | Current agent name |
| `context.messageID` | Current message identifier |
| `context.directory` | Session working directory |
| `context.worktree` | Git worktree root |

### Plugin Context Fields

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 73-89)

| Field | Description |
|-------|-------------|
| `project` | Project information object |
| `client` | Full OpenCode SDK client |
| `$` | Bun shell utility |
| `directory` | Current working directory |
| `worktree` | Git worktree path |

### Subagent Session Context

**Source:** `.sdk-lib/opencode/opencode-agents.md` (lines 74-89)

- Subagents create **child sessions** linked to parent
- Event properties contain `parentSessionId`, `parentSessionID`, or `parent_session_id`
- Navigation: `session_child_first`, `session_child_cycle`, `session_parent` keybinds
- Subagents inherit model from invoking primary agent (unless explicitly overridden)

### SDK Client Session APIs

**Source:** `.sdk-lib/opencode/opencode-sdk.md` (lines 188-208)

| Method | Purpose |
|--------|---------|
| `client.session.list()` | List all sessions |
| `client.session.get({ path })` | Get session details |
| `client.session.children({ path })` | List child sessions |
| `client.session.create({ body })` | Create new session |
| `client.session.delete({ path })` | Delete session |
| `client.session.update({ path, body })` | Update session properties |
| `client.session.prompt({ path, body })` | Send prompt (with `noReply: true` for context injection) |
| `client.session.command({ path, body })` | Execute slash command |
| `client.session.messages({ path })` | List messages in session |
| `client.session.summarize({ path, body })` | Summarize session |
| `client.session.revert({ path, body })` | Revert a message |

### Context Injection Without AI Response

**Source:** `.sdk-lib/opencode/opencode-sdk.md` (lines 226-233)

```typescript
await client.session.prompt({
  path: { id: session.id },
  body: {
    noReply: true,
    parts: [{ type: "text", text: "Context injection" }],
  },
})
```

This is critical for plugins that need to inject context without triggering LLM responses.

---

## 5. Hook/Event System — Complete Inventory

### Plugin Hooks (Return Object Keys)

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 102-144) + `.sdk-lib/opencode/opencode-plugins.md` (lines 247-293)

| Hook Key | Category | Purpose |
|----------|----------|---------|
| `event` | General | All OpenCode lifecycle events |
| `tool` | Tool registration | Add custom tools from plugin |
| `tool.execute.before` | Tool interception | Pre-validate/modify tool args |
| `tool.execute.after` | Tool observation | Post-tool result observation |
| `shell.env` | Environment | Inject env vars into all shell execution |
| `permission.ask` | Permission gate | Intercept permission requests |
| `chat.message` | Chat | Track messages per-session |
| `chat.params` | Chat | Control temperature/topP per-agent |
| `chat.headers` | Chat | Custom auth headers per request |
| `command.execute.before` | Command | Pre-command context injection |
| `experimental.session.compacting` | Compaction | Customize compaction prompt/context |
| `experimental.chat.messages.transform` | Messages | Transform message history |
| `experimental.chat.system.transform` | System | Modify system prompt per-session |
| `experimental.text.complete` | Text | Streaming text injection |
| `session.compacting` | Compaction | (alias for experimental) |

### Event Types (SSE Stream)

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 102-144)

| Event Type | Category |
|------------|----------|
| `command.executed` | Command |
| `file.edited` | File |
| `file.watcher.updated` | File |
| `installation.updated` | Installation |
| `lsp.client.diagnostics` | LSP |
| `lsp.updated` | LSP |
| `message.part.removed` | Message |
| `message.part.updated` | Message |
| `message.removed` | Message |
| `message.updated` | Message |
| `permission.asked` | Permission |
| `permission.replied` | Permission |
| `server.connected` | Server |
| `session.created` | Session |
| `session.compacted` | Session |
| `session.deleted` | Session |
| `session.diff` | Session |
| `session.error` | Session |
| `session.idle` | Session |
| `session.status` | Session |
| `session.updated` | Session |
| `todo.updated` | Todo |
| `shell.env` | Shell |
| `tool.execute.after` | Tool |
| `tool.execute.before` | Tool |
| `tui.prompt.append` | TUI |
| `tui.command.execute` | TUI |
| `tui.toast.show` | TUI |

### Hook Data Flow

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 171-194)

Hooks receive `(input, output)` pairs:

- **`tool.execute.before`:** `(input: { tool, args, sessionID }, output: { args })` — can modify `output.args`
- **`tool.execute.after`:** `(input: { tool, args, sessionID }, output: { result })` — can observe/modify result
- **`shell.env`:** `(input: { cwd }, output: { env })` — can add to `output.env`
- **`permission.ask`:** `(input: { type, ... }, output: { status })` — can set `output.status` to `allow`/`deny`/`ask`
- **`experimental.session.compacting`:** `(input: { sessionID }, output: { context: string[], prompt?: string })` — can push to `output.context` or replace `output.prompt`
- **`command.execute.before`:** `(input: { command, sessionID, ... }, output: { parts })` — can prepend to `output.parts`

### Compaction Hook Details

**Source:** `.sdk-lib/opencode/opencode-plugins.md` (lines 247-293)

Two modes:
1. **Context injection:** `output.context.push("...")` — adds to default compaction prompt
2. **Full replacement:** `output.prompt = "..."` — completely replaces default prompt (context array ignored)

---

## 6. Agent/Subagent Model

### Agent Types

**Source:** `.sdk-lib/opencode/opencode-agents.md` (lines 12-69)

| Type | Mode | Description |
|------|------|-------------|
| Primary | `primary` | Main assistants, Tab-switchable, user-facing |
| Subagent | `subagent` | Specialized assistants, invoked via `@mention` or Task tool |
| All | `all` | Works as both (default if mode unspecified) |

### Built-in Agents

| Agent | Mode | Tool Access |
|-------|------|-------------|
| `build` | primary | All tools enabled |
| `plan` | primary | Restricted (all tools set to `ask`) |
| `general` | subagent | Full tools (except todo) |
| `explore` | subagent | Read-only, cannot modify files |
| `compaction` | primary | Hidden system agent |
| `title` | primary | Hidden system agent |
| `summary` | primary | Hidden system agent |

### Agent Configuration Options

**Source:** `.sdk-lib/opencode/opencode-agents.md` (lines 91-540)

| Option | Type | Purpose |
|--------|------|---------|
| `description` | string | What the agent does (required) |
| `mode` | `primary`/`subagent`/`all` | How agent can be used |
| `model` | string | Override model (provider/model-id) |
| `prompt` | string | Custom system prompt or `{file:...}` reference |
| `temperature` | number | 0.0-1.0 randomness control |
| `top_p` | number | Alternative to temperature |
| `steps` | number | Max agentic iterations before forced text-only |
| `hidden` | boolean | Hide from @ autocomplete (subagent only) |
| `color` | string | UI appearance (hex or theme color) |
| `disable` | boolean | Disable the agent |
| `permission` | object | Tool/skill/task permissions |
| `permission.task` | object | Which subagents can be invoked (glob patterns) |
| `permission.skill` | object | Which skills can be loaded (glob patterns) |

### Subagent Invocation

**Source:** `.sdk-lib/opencode/opencode-agents.md` (lines 74-89)

1. **Automatic:** Primary agents invoke subagents based on descriptions via Task tool
2. **Manual:** User @-mentions subagent in message
3. **Programmatic:** Via `client.session.command()` or `client.session.prompt()` with agent parameter

### Task Permissions (Subagent Control)

**Source:** `.sdk-lib/opencode/opencode-agents.md` (lines 463-491)

```json
{
  "agent": {
    "orchestrator": {
      "permission": {
        "task": {
          "*": "deny",
          "orchestrator-*": "allow",
          "code-reviewer": "ask"
        }
      }
    }
  }
}
```

- Rules evaluated in order, **last matching rule wins**
- `deny` removes subagent from Task tool description entirely
- Users can always directly invoke via @ autocomplete regardless of task permissions

### Model Inheritance

**Source:** `.sdk-lib/opencode/opencode-agents.md` (line 272)

- Primary agents: use globally configured model if not specified
- Subagents: use the model of the **invoking primary agent** if not specified

---

## 7. Constraints and Limits

### What the SDK Does NOT Allow

1. **No Python tool definitions** — Tool definition files must be TS/JS. Implementation can call Python via shell, but the definition/export mechanism is JS-only. (Source: `opencode-custom-tools.md` line 7)

2. **No per-agent tool registration at definition time** — Tools are registered globally (via plugin or `.opencode/tools/`). Per-agent availability is controlled only via permissions, not registration. (Source: `opencode-agents.md` lines 285-327)

3. **No explicit plugin teardown** — No documented teardown/unload hook. Plugins live for the process lifetime. (Source: `opencode-plugins.md` — no teardown section)

4. **No dynamic tool registration during session** — Tools are loaded at startup. No API to register/unregister tools mid-session. (Source: `opencode-custom-tools.md`, `opencode-plugins.md`)

5. **No tool versioning** — No mechanism for tool versioning or migration. Name collision means complete replacement. (Source: `opencode-custom-tools.md` lines 63-83)

6. **No tool result streaming** — Tool `execute` returns a string. No streaming/chunked response mechanism documented. (Source: `opencode-custom-tools.md` line 27)

7. **No tool dependency declaration** — Tools cannot declare dependencies on other tools. (Source: `opencode-custom-tools.md`)

8. **No subagent-to-subagent invocation control** — Task permissions control which subagents an agent can invoke, but there's no mechanism for a subagent to invoke another subagent with different permissions than its parent. (Source: `opencode-agents.md` lines 463-491)

9. **No event filtering on subscription** — The `event` hook receives ALL events. No mechanism to subscribe to specific event types only. (Source: `opencode-plugins.md` lines 151-161)

10. **No hook priority control** — All hooks run in sequence based on load order. No explicit priority mechanism. (Source: `opencode-plugins.md` lines 36-43)

11. **`tools` config is deprecated** — The `tools` field in agent config is deprecated in favor of `permission`. (Source: `opencode-agents.md` line 286)

12. **`experimental.session.compacting` is experimental** — The compaction hook is marked experimental and may change. (Source: `opencode-plugins.md` line 269)

13. **No structured tool return types** — Tool execute returns a string. No JSON schema for tool responses. (Source: `opencode-custom-tools.md`)

14. **No tool timeout control** — No documented timeout mechanism for tool execution. (Source: `opencode-custom-tools.md`)

---

## 8. Opportunities for HiveMind

### SDK Capabilities We're Not Fully Leveraging

1. **`noReply: true` context injection** — The SDK supports injecting context into sessions without triggering AI responses (`client.session.prompt` with `noReply: true`). This could replace some of our synthetic part injection patterns for cleaner context delivery. (Source: `opencode-sdk.md` lines 226-233)

2. **Structured output from models** — The SDK supports `format: { type: "json_schema", schema: {...} }` for getting validated JSON from LLM responses. This could be used for structured contract generation, task parsing, and evidence extraction. (Source: `opencode-sdk.md` lines 80-127)

3. **`hidden: true` subagents** — We could create internal HiveMind subagents that are only invoked programmatically by other agents, not visible in the @ autocomplete. Useful for internal orchestration agents. (Source: `opencode-agents.md` lines 444-461)

4. **`permission.task` glob patterns** — Fine-grained control over which subagents can invoke which other subagents. Could enforce HiveMind's delegation hierarchy through permission patterns. (Source: `opencode-agents.md` lines 463-491)

5. **`steps` limit for cost control** — The `steps` config limits agentic iterations. Could be used to prevent runaway subagent loops in HiveMind workflows. (Source: `opencode-agents.md` lines 219-236)

6. **`shell.env` hook for runtime state** — We already use this, but could inject more runtime state (trajectory ID, workflow ID, task IDs) as env vars for all shell commands and tools to access. (Source: `opencode-plugins.md` lines 183-194, currently used in `opencode-plugin.ts` lines 178-184)

7. **`experimental.chat.system.transform` hook** — We use this but could leverage it more for dynamic system prompt modification based on workflow state, rather than just injecting static context. (Source: `opencode-plugins.md` — used in `opencode-plugin.ts` line 119)

8. **`command.execute.before` with `output.parts`** — We already use this for command context injection. Could extend to inject tool precedence chains, governance rules, and workflow state more comprehensively. (Source: `opencode-plugins.md`, used in `opencode-plugin.ts` lines 185-225)

9. **Plugin tools via `tool:` return** — Currently we define tools in `src/tools/` and register them in the plugin's `tool:` object. This is correct. But we could also dynamically add tools based on workflow state if needed (though tools are loaded at startup, not mid-session). (Source: `opencode-plugins.md` lines 196-228)

10. **`client.session.children()` API** — Could be used to track and navigate subagent session hierarchies more explicitly for HiveMind's delegation model. (Source: `opencode-sdk.md` line 192)

11. **`client.session.diff()` API** — Could track file changes per session for HiveMind's evidence tracking. (Source: `opencode-server.md` line 95)

12. **`client.session.fork()` API** — Could enable branching workflows where HiveMind forks a session at a decision point. (Source: `opencode-server.md` line 91)

13. **`experimental.text.complete` hook** — We use this for session journaling. Could extend for real-time governance validation as text streams. (Source: `opencode-plugin.ts` lines 232-244)

14. **Skill permissions per-agent** — Could use `permission.skill` to control which HiveMind skills are available to which agents, enforcing the governance model at the SDK level. (Source: `opencode-skills.md` lines 83-101)

15. **`client.find.symbols()` API** — Could enhance HiveMind's codebase investigation capabilities beyond text/glob search. (Source: `opencode-sdk.md` line 239)

---

## 9. Current HiveMind Plugin Hook Usage

**Source:** `src/plugin/opencode-plugin.ts` (lines 115-250)

| Hook | Used? | Purpose |
|------|-------|---------|
| `event` | ✅ | Lifecycle event bridging to trajectory ledger |
| `tool` | ✅ | 13 HiveMind tools registered |
| `chat.message` | ✅ | Message tracking, turn snapshot reset |
| `permission.ask` | ✅ | Auto-allow HiveMind managed tools |
| `tool.execute.before` | ✅ | Pre-execution recording |
| `tool.execute.after` | ✅ | Post-execution recording |
| `shell.env` | ✅ | Inject HIVEMIND_* env vars |
| `command.execute.before` | ✅ | Inject command context parts |
| `experimental.text.complete` | ✅ | Session journaling |
| `experimental.chat.messages.transform` | ✅ | Message history transformation |
| `experimental.session.compacting` | ✅ | Compaction context preservation |
| `experimental.chat.system.transform` | ✅ | System prompt transformation |
| `chat.params` | ❌ | Not used |
| `chat.headers` | ❌ | Not used |
| `tool.definition` | ❌ | Not used |
| `config` | ❌ | Not used |
| `auth` | ❌ | Not used |
| `messages.transform` | ❌ | Not used (using experimental variant) |
| `session.compacting` | ❌ | Using experimental variant |

### Events Subscribed (via `event` hook)

**Source:** `src/hooks/event-handler.ts` (lines 104-121)

| Event | Handled? |
|-------|----------|
| `session.created` | ✅ |
| `session.updated` | ✅ |
| `session.error` | ✅ |
| `session.deleted` | ✅ |
| `session.diff` | ✅ |
| `session.idle` | ✅ |
| `session.compacted` | ✅ |
| `agent.created` | ✅ |
| `message.added` | ❌ (listed in KNOWN but no handler) |
| `message.updated` | ❌ (listed in KNOWN but no handler) |
| `tool.executed` | ❌ (listed in KNOWN but no handler) |
| `command.executed` | ❌ (listed in KNOWN but no handler) |
| `trajectory.started` | ❌ (listed in KNOWN but no handler) |
| `trajectory.ended` | ❌ (listed in KNOWN but no handler) |

---

## 10. Server API Surface (Relevant to HiveMind)

**Source:** `.sdk-lib/opencode/opencode-server.md` (lines 51-160)

Key APIs HiveMind could leverage:

| API | Method | Relevance |
|-----|--------|-----------|
| `/session/:id/children` | GET | Track subagent session hierarchies |
| `/session/:id/diff` | GET | Track file changes per session |
| `/session/:id/fork` | POST | Branch workflows |
| `/session/:id/todo` | GET | Access todo lists |
| `/session/:id/permissions/:permissionID` | POST | Respond to permission requests |
| `/experimental/tool?provider=&model=` | GET | List tools with JSON schemas |
| `/event` | GET (SSE) | Real-time event stream |
| `/log` | POST | Structured logging |
| `/agent` | GET | List all available agents |
| `/command` | GET | List all commands |

---

## Appendix: File Evidence Index

| Finding | Source File | Lines |
|---------|-------------|-------|
| Tool definition API | `opencode-custom-tools.md` | 16-29 |
| Tool context fields | `opencode-custom-tools.md` | 107-123 |
| Python tool example | `opencode-custom-tools.md` | 126-157 |
| Plugin function signature | `opencode-plugins.md` | 46-100 |
| Plugin load order | `opencode-plugins.md` | 36-43 |
| Plugin tool registration | `opencode-plugins.md` | 196-228 |
| Event types list | `opencode-plugins.md` | 102-144 |
| Compaction hooks | `opencode-plugins.md` | 247-293 |
| Agent types | `opencode-agents.md` | 12-69 |
| Agent config options | `opencode-agents.md` | 91-540 |
| Permission system | `opencode-agents.md` | 330-428 |
| Task permissions | `opencode-agents.md` | 463-491 |
| Config precedence | `opencode-configs.md` | 20-39 |
| SDK client APIs | `opencode-sdk.md` | 134-303 |
| Structured output | `opencode-sdk.md` | 80-127 |
| Server API surface | `opencode-server.md` | 51-160 |
| Skills system | `opencode-skills.md` | 1-158 |
| Built-in tools | `opencode-built-in-tools.md` | 1-276 |
| Rules precedence | `opencode-rules.md` | 68-98 |
| Current plugin hooks | `src/plugin/opencode-plugin.ts` | 115-250 |
| Event handler events | `src/hooks/event-handler.ts` | 104-121 |
