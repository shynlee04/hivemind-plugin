# OpenCode SDK Capability Study

**Date:** 2026-04-01
**Scope:** Plugin system, custom tools, commands, skills, rules, agents, hooks
**Source:** `.sdk-lib/opencode/` SDK documentation files

---

## Executive Summary

1. **Plugins are global interceptors** — they subscribe to events/hooks at startup and fire across all sessions. Plugins receive a `PluginInput` containing `client`, `project`, `directory`, `worktree`, `serverUrl`, and `$` (Bun shell), but **no per-request session context** beyond `sessionID` in hook inputs.

2. **Custom tools are global and static** — tools defined in `.opencode/tools/` are loaded at startup and available to all agents. There is **no per-agent, per-workflow, or per-intent tool registration**. Tools cannot chain/call other tools, cannot stream, and cannot be hot-reloaded per turn.

3. **The Hooks system is rich but write-limited** — 16 hooks exist (`event`, `config`, `tool`, `auth`, `chat.message`, `chat.params`, `chat.headers`, `permission.ask`, `command.execute.before`, `tool.execute.before`, `tool.execute.after`, `shell.env`, `experimental.chat.messages.transform`, `experimental.chat.system.transform`, `experimental.session.compacting`, `experimental.text.complete`, `tool.definition`). All hooks are async but most are **read-only or can only modify their output field** — they cannot arbitrarily mutate state.

4. **Skills are load-on-demand content** — skills are `.md` files discovered from fixed paths and loaded via the `skill` tool when the agent calls it. Skills are NOT automatically injected; the agent must invoke them explicitly.

5. **Config stacking is merge-based** — configs merge (not replace) with later sources overriding earlier. Load order: remote → global → custom env → project → `.opencode` directories. Rules and permissions are **not composable** — last matching rule wins with no clear cascade semantics.

---

## Plugin System

### Plugin Interface

**File:** `repomix-opencode.md` (line 410484)
```typescript
export type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>
```

**PluginInput (line 410469-410476):**
```typescript
export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  serverUrl: URL
  $: BunShell
}
```

**Key observation:** Plugins do NOT receive a `sessionID` at initialization time. Session context must be extracted from individual hook inputs.

### Plugin Lifecycle

**File:** `opencode-plugins.md` (lines 36-43)

Load order:
1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

Duplicate npm packages with same name+version are loaded once. Local plugin and npm plugin with similar names are both loaded separately.

### Plugin Installation Methods

**File:** `opencode-plugins.md` (lines 11-28)

1. **Local files:** Place JS/TS in `.opencode/plugins/` or `~/.config/opencode/plugins/`
2. **npm packages:** Add to `opencode.json` plugin array: `"plugin": ["package-name"]`
3. **npm auto-install:** Packages cached in `~/.cache/opencode/node_modules/`

### Plugin Dependencies

**File:** `opencode-plugins.md` (lines 48-58)

Local plugins can add `package.json` to `.opencode/` with dependencies. OpenCode runs `bun install` at startup.

```json
// .opencode/package.json
{ "dependencies": { "shescape": "^2.1.0" } }
```

### Plugin Event/Hook Catalog

**File:** `repomix-opencode.md` (lines 410622-410708)

| Hook | Purpose | Input | Output |
|------|---------|-------|--------|
| `event` | Catch-all event handler | `{ event: Event }` | `Promise<void>` |
| `config` | React to config changes | `Config` | `Promise<void>` |
| `tool` | Register custom tools | `{ [key: string]: ToolDefinition }` | — |
| `auth` | Auth hook | `AuthHook` | — |
| `chat.message` | New message received | `{ sessionID, agent?, model?, messageID?, variant? }` | `{ message: UserMessage; parts: Part[] }` |
| `chat.params` | Modify LLM parameters | `{ sessionID, agent, model, provider, message }` | `{ temperature, topP, topK, options }` |
| `chat.headers` | Modify request headers | `{ sessionID, agent, model, provider, message }` | `{ headers: Record<string, string> }` |
| `permission.ask` | Intercept permission requests | `Permission` | `{ status: "ask" \| "deny" \| "allow" }` |
| `command.execute.before` | Pre-command execution | `{ command, sessionID, arguments }` | `{ parts: Part[] }` |
| `tool.execute.before` | Pre-tool execution | `{ tool, sessionID, callID }` | `{ args: any }` |
| `tool.execute.after` | Post-tool execution | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` |
| `shell.env` | Inject environment variables | `{ cwd, sessionID?, callID? }` | `{ env: Record<string, string> }` |
| `experimental.chat.messages.transform` | Transform message history | `{}` | `{ messages: { info, parts }[] }` |
| `experimental.chat.system.transform` | Transform system prompt | `{ sessionID?, model }` | `{ system: string[] }` |
| `experimental.session.compacting` | Customize compaction | `{ sessionID }` | `{ context: string[]; prompt?: string }` |
| `experimental.text.complete` | Modify text completion | `{ sessionID, messageID, partID }` | `{ text: string }` |
| `tool.definition` | Modify tool schema | `{ toolID }` | `{ description, parameters }` |

### Additional Event Types (not hooks)

**File:** `opencode-plugins.md` (lines 102-144)

These are event types for the `event` hook:
- `command.executed`
- `file.edited`
- `file.watcher.updated`
- `installation.updated`
- `lsp.client.diagnostics`
- `lsp.updated`
- `message.part.removed`
- `message.part.updated`
- `message.removed`
- `message.updated`
- `permission.asked`
- `permission.replied`
- `server.connected`
- `session.created`
- `session.compacted`
- `session.deleted`
- `session.diff`
- `session.error`
- `session.idle`
- `session.status`
- `session.updated`
- `todo.updated`
- `tui.prompt.append`
- `tui.command.execute`
- `tui.toast.show`

### Plugin Logging

**File:** `opencode-plugins.md` (lines 230-245)

```typescript
await client.app.log({
  body: { service: "my-plugin", level: "info", message: "Plugin initialized", extra: { foo: "bar" } }
})
```

Levels: `debug`, `info`, `warn`, `error`

### Plugin Tool Override

**File:** `opencode-plugins.md` (lines 226-228)

> If a plugin tool uses the same name as a built-in tool, the plugin tool takes precedence.

---

## Custom Tool System

### Tool Definition

**File:** `opencode-custom-tools.md` (lines 15-29)

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    return `Executed query: ${args.query}`
  },
})
```

### Tool Context Fields

**File:** `opencode-custom-tools.md` (lines 107-123)

```typescript
async execute(args, context) {
  const { agent, sessionID, messageID, directory, worktree } = context
  return `Agent: ${agent}, Session: ${sessionID}, ...`
}
```

**Available context fields:**
- `agent` — current agent name
- `sessionID` — session identifier
- `messageID` — current message ID
- `directory` — working directory
- `worktree` — git worktree root

### Argument Schema (Zod)

**File:** `opencode-custom-tools.md` (lines 86-105)

```typescript
args: {
  query: tool.schema.string().describe("SQL query to execute")
}
// or import Zod directly
import { z } from "zod"
args: { param: z.string().describe("...") }
```

### Multiple Tools Per File

**File:** `opencode-custom-tools.md` (lines 33-61)

Export naming: `<filename>_<exportname>`

```typescript
// math.ts creates tools: math_add and math_multiply
export const add = tool({ ... })
export const multiply = tool({ ... })
```

### Tool Name Collision

**File:** `opencode-custom-tools.md` (lines 63-79)

> If a custom tool uses the same name as a built-in tool, the custom tool takes precedence.

### Python Tool Implementation

**File:** `opencode-custom-tools.md` (lines 126-155)

Tools are defined in TS/JS but can invoke scripts in any language:

```typescript
async execute(args, context) {
  const script = path.join(context.worktree, ".opencode/tools/add.py")
  const result = await Bun.$`python3 ${script} ${args.a} ${args.b}`.text()
  return result.trim()
}
```

### Tool Return Format

**File:** `opencode-custom-tools.md` (lines 25-28)

Returns a string result. No streaming support documented.

### Tool Registration Locations

**File:** `opencode-custom-tools.md` (lines 9-13)

- `.opencode/tools/` (project)
- `~/.config/opencode/tools/` (global)

### Tool Limitations

1. **No tool chaining** — tools cannot call other tools directly
2. **No streaming** — return is a single string/result
3. **No per-agent registration** — tools are global
4. **No hot reload** — loaded at startup

---

## Runtime Stacking

### Config Merge Order

**File:** `opencode-configs.md` (lines 30-38)

Config sources merge (not replace). Later overrides earlier:

1. Remote config (`.well-known/opencode`) — organizational
2. Global config (`~/.config/opencode/opencode.json`) — user
3. Custom config (`OPENCODE_CONFIG` env var)
4. Project config (`opencode.json`)
5. `.opencode` directories — agents, commands, plugins, skills, tools
6. Inline config (`OPENCODE_CONFIG_CONTENT` env var) — runtime

### Custom Tool Precedence

**File:** `opencode-custom-tools.md` (lines 63-64)

> If a custom tool uses the same name as a built-in tool, the custom tool takes precedence.

### Plugin Tool Precedence

**File:** `opencode-plugins.md` (lines 226-228)

> If a plugin tool uses the same name as a built-in tool, the plugin tool takes precedence.

### Permission Evaluation

**File:** `opencode-agents.md` (lines 484-486)

> Rules are evaluated in order, and the last matching rule wins.

### Skill Loading

**File:** `opencode-skills.md` (lines 15-18)

Skills are discovered by walking up from CWD to git worktree root, loading from:
- `.opencode/skills/<name>/SKILL.md`
- `~/.config/opencode/skills/<name>/SKILL.md`
- `.claude/skills/<name>/SKILL.md` (Claude Code compatibility)
- `~/.claude/skills/<name>/SKILL.md` (Claude Code compatibility)
- `.agents/skills/<name>/SKILL.md`
- `~/.agents/skills/<name>/SKILL.md`

Skills are NOT auto-injected — agent must call `skill({ name: "..." })` tool.

### Command Execution

**File:** `opencode-commands.md` (lines 195-218)

Commands can specify an agent. If `subtask: true`, forces subagent invocation even if agent is primary.

---

## Session Model

### Session Types

**File:** `opencode-agents.md` (lines 13-27)

**Primary agents:**
- Main assistants interacted with directly
- Tool access via permissions (Build = all, Plan = restricted)
- Switch with Tab key or switch_agent keybind

**Subagents:**
- Specialized assistants invoked by primary agents
- Can be invoked via @ mention
- Two built-in: `general` (full tool access except todo) and `explore` (read-only)

**Hidden system agents:**
- `compaction` — compacts long context
- `title` — generates session titles
- `summary` — creates session summaries

### Session Navigation (Subagent Child Sessions)

**File:** `opencode-agents.md` (lines 82-89)

- `session_child_first` (`<Leader>+Down`) — enter first child from parent
- `session_child_cycle` (`Right`) — cycle next child
- `session_child_cycle_reverse` (`Left`) — cycle previous child
- `session_parent` (`Up`) — return to parent

### Session API Methods

**File:** `opencode-sdk.md` (lines 188-209)

- `session.list()` — list sessions
- `session.get({ path: { id } })` — get session
- `session.children({ path: { id } })` — list child sessions
- `session.create({ body })` — create session
- `session.delete({ path: { id } })` — delete session
- `session.update({ path, body })` — update properties
- `session.init({ path, body })` — analyze app and create AGENTS.md
- `session.abort({ path: { id } })` — abort running session
- `session.share({ path: { id } })` — share session
- `session.unshare({ path: { id } })` — unshare session
- `session.summarize({ path, body })` — summarize session
- `session.messages({ path })` — list messages
- `session.prompt({ path, body })` — send prompt (supports `noReply: true` for context injection)
- `session.command({ path, body })` — send command
- `session.shell({ path, body })` — run shell command
- `session.revert({ path, body })` — revert message
- `session.unrevert({ path })` — restore reverted

### Subagent Tool Access

**File:** `opencode-built-in-tools.md` (lines 191-193)

> The todowrite tool is disabled for subagents by default.

### Per-Agent Tool Configuration

**File:** `opencode-agents.md` (lines 329-427)

Tool permissions per agent with glob patterns:
```json
{
  "agent": {
    "build": {
      "permission": {
        "bash": { "*": "ask", "git status *": "allow" }
      }
    }
  }
}
```

### Task Permissions

**File:** `opencode-agents.md` (lines 463-490)

Control which subagents can be invoked via Task tool:
```json
{
  "agent": {
    "orchestrator": {
      "permission": {
        "task": { "*": "deny", "orchestrator-*": "allow", "code-reviewer": "ask" }
      }
    }
  }
}
```

---

## Hook/Event Catalog

### Complete Hooks Definition

**Source:** `repomix-opencode.md` (lines 410622-410708)

#### `event` — Catch-All Event Handler
- Input: `{ event: Event }`
- Can listen to any event type (see Event Types above)
- Cannot abort or modify event

#### `config` — Config Change Hook
- Input: `Config`
- Reacts to config changes
- Cannot modify config

#### `tool` — Custom Tool Registration
- Input: `{ [key: string]: ToolDefinition }`
- Dynamically register tools
- Tools available globally

#### `auth` — Auth Hook
- Input: `AuthHook`
- For OAuth and API key auth flows

#### `chat.message` — Message Received
- Input: `{ sessionID, agent?, model?, messageID?, variant? }`
- Output: `{ message: UserMessage; parts: Part[] }`
- **Can modify message and parts**

#### `chat.params` — LLM Parameters
- Input: `{ sessionID, agent, model, provider, message }`
- Output: `{ temperature, topP, topK, options }`
- **Can modify all parameters**

#### `chat.headers` — Request Headers
- Input: `{ sessionID, agent, model, provider, message }`
- Output: `{ headers: Record<string, string> }`
- **Can modify headers**

#### `permission.ask` — Permission Interception
- Input: `Permission`
- Output: `{ status: "ask" | "deny" | "allow" }`
- **Can override permission decision**

#### `command.execute.before` — Pre-Command
- Input: `{ command, sessionID, arguments }`
- Output: `{ parts: Part[] }`
- **Can inject parts into prompt**

#### `tool.execute.before` — Pre-Tool
- Input: `{ tool, sessionID, callID }`
- Output: `{ args: any }`
- **Can modify tool arguments**

#### `tool.execute.after` — Post-Tool
- Input: `{ tool, sessionID, callID, args }`
- Output: `{ title, output, metadata }`
- **Can modify tool output**

#### `shell.env` — Environment Injection
- Input: `{ cwd, sessionID?, callID? }`
- Output: `{ env: Record<string, string> }`
- **Can inject env vars**

#### `experimental.chat.messages.transform` — Message History Transform
- Input: `{}`
- Output: `{ messages: { info: Message, parts: Part[] }[] }`
- **Can modify entire message history**

#### `experimental.chat.system.transform` — System Prompt Transform
- Input: `{ sessionID?, model }`
- Output: `{ system: string[] }`
- **Can modify system prompt content**

#### `experimental.session.compacting` — Compaction Customization
- Input: `{ sessionID }`
- Output: `{ context: string[]; prompt?: string }`
- **Can inject context OR replace entire prompt**

#### `experimental.text.complete` — Text Completion Modify
- Input: `{ sessionID, messageID, partID }`
- Output: `{ text: string }`
- **Can modify completed text**

#### `tool.definition` — Tool Schema Modification
- Input: `{ toolID }`
- Output: `{ description: string; parameters: any }`
- **Can modify tool description and parameters**

---

## SDK Limitations

### Cannot Do

1. **Per-agent custom tool registration** — tools are global, loaded once at startup
2. **Per-workflow tool registration** — no workflow-bound tool scoping
3. **Per-intent tool activation** — no context-dependent tool availability
4. **Tool chaining** — tools cannot call other tools
5. **Streaming tool responses** — tools return single result, no streaming
6. **Hot reload of tools/plugins** — requires restart
7. **Cross-session state sharing via hooks** — hooks are stateless interceptors
8. **Per-turn plugin re-initialization** — plugins init once at startup
9. **Abort hooks that fully stop execution** — only `permission.ask` can deny, others are notifications
10. **Dynamic permission scopes per session** — permissions are global config

### Workarounds Required

1. **Per-agent tools** — Create separate plugin packages, load globally, use `chat.message` or `permission.ask` to filter
2. **Tool chaining** — Implement in the tool itself (call SDK client internally)
3. **Streaming** — Use shell commands with output streaming, not native tool streaming
4. **Hot reload** — Watch files and call API to refresh (if available)

---

## Implications for HiveMind Architecture

### 1. Plugin System Gap

HiveMind cannot use OpenCode plugins for **runtime task orchestration** because:
- Plugins initialize once at startup, not per-session or per-task
- No `sessionID` in plugin init context — must extract from hook inputs
- No way to pass HiveMind workflow/task state to plugins at init time

**Recommendation:** Plugins should only be used for cross-cutting concerns (logging, auth, env injection). Task orchestration must live in a layer ABOVE OpenCode.

### 2. Custom Tool Static Nature

Tools are loaded once at startup from fixed directories. There is:
- No API to dynamically register tools after startup
- No per-session tool filtering
- No way to activate/deactivate tools based on workflow state

**Recommendation:** If HiveMind needs per-task tool filtering, implement it in a wrapper that calls OpenCode's API, not in OpenCode itself.

### 3. Session Hierarchy is Flat for Tools

Subagent sessions exist but share the same tool registry. The only differentiation is:
- `permission` settings per agent
- `task` permission to control which subagents can be invoked

**Recommendation:** If HiveMind needs strong session isolation with different tool sets, it would need to run separate OpenCode instances or implement a proxy layer.

### 4. Context Injection via Hooks

The `experimental.chat.messages.transform` and `experimental.chat.system.transform` hooks provide write access to message history and system prompt. This is powerful for:
- Injecting task context before LLM call
- Modifying conversation flow based on state

**Recommendation:** These hooks could be used for HiveMind's context stacking if HiveMind registers as an OpenCode plugin.

### 5. Skills Are Agent-Initiated

Skills are loaded ON-DEMAND when the agent calls `skill({ name: "..." })`. Skills are NOT auto-injected based on project or workflow context.

**Recommendation:** If HiveMind wants skill auto-injection, it would need to either:
- Pre-inject skill content via `experimental.chat.messages.transform`
- Have the agent call skills proactively based on task type

### 6. Compaction Hook is One-Way

`experimental.session.compacting` can inject context or replace the entire prompt, but there's no hook to observe what the compaction agent produced.

**Recommendation:** Use compaction hook to push HiveMind state, but do not rely on reading back the result.

### 7. Permission System is Coarse

Permission rules are global config with glob pattern matching. There is:
- No per-session permission override
- No runtime permission negotiation
- Last-matching-rule wins with no clear priority

**Recommendation:** For fine-grained permission control, implement in a layer above OpenCode that makes OpenCode API calls rather than relying on OpenCode's permission system.

---

## File Evidence Index

| File | Key Evidence |
|------|-------------|
| `opencode-plugins.md` | Plugin lifecycle, events, custom tool registration, compaction hooks |
| `opencode-custom-tools.md` | Tool context, args schema, Python tools, multiple tools per file |
| `opencode-sdk.md` | Client APIs, session methods, structured output |
| `opencode-agents.md` | Primary vs subagent, permissions, task permissions |
| `opencode-configs.md` | Config merge order, plugin/tool loading paths |
| `opencode-skills.md` | Skill discovery, permissions, on-demand loading |
| `opencode-commands.md` | Command structure, agent selection, subtask mode |
| `opencode-rules.md` | AGENTS.md locations, precedence, instruction files |
| `opencode-built-in-tools.md` | Built-in tools list, todowrite subagent restriction |
| `opencode-server.md` | HTTP API endpoints |
| `repomix-opencode.md` | Complete Hooks interface (line 410622), PluginInput type (line 410469), Plugin type (line 410484) | |
