# OpenCode Platform Primitives Inventory

> **Agent:** hm-l2-researcher (L2 specialist, hm-* lineage)
> **Date:** 2026-05-10
> **Source:** `anomalyco/opencode` (ACTIVE — NOT `opencode-ai/opencode` which is ARCHIVED)
> **Status:** COMPLETED

---

## Table of Contents

1. [Agent System](#1-agent-system)
2. [Tool System](#2-tool-system)
3. [Permission System](#3-permission-system)
4. [Hook System (Plugin SDK)](#4-hook-system-plugin-sdk)
5. [Plugin SDK Surface](#5-plugin-sdk-surface)
6. [Skill System](#6-skill-system)
7. [Command System](#7-command-system)
8. [Config System](#8-config-system)
9. [Session / Subagent Dispatch (Task Tool)](#9-session--subagent-dispatch-task-tool)
10. [Key Integration Points for Hivemind](#10-key-integration-points-for-hivemind)
11. [Unused Primitives Available for Leverage](#11-unused-primitives-available-for-leverage)

---

## 1. Agent System

### 1.1 Agent Lifecycle

```
Config Discovery → Schema Validation → Permission Merge → Registry → Session Dispatch
       ↓                    ↓                   ↓              ↓             ↓
  .opencode/agents/    Agent.Info        fromConfig()      Agent.Service   task tool
  {agent,agents}/      Effect Schema      merge(defaults,   get()/list()   creates child
  **/*.md              decode              user, cfg)                       session
```

**Discovery sources (in merge order):**
1. Built-in native agents (hardcoded in `agent.ts`)
2. `.opencode/{agent,agents}/**/*.md` files (YAML frontmatter + markdown body)
3. `opencode.json` → `agent` field config
4. Legacy `mode` field (deprecated, promoted to `agent`)

### 1.2 Agent.Info Schema (Runtime)

**Source:** `packages/opencode/src/agent/agent.ts`

```typescript
Agent.Info = {
  name: string                           // Unique identifier (directory/filename derived)
  description?: string                   // When to use this agent
  mode: "subagent" | "primary" | "all"   // Visibility and dispatch role
  native?: boolean                       // True for built-in agents
  hidden?: boolean                       // Hide from autocomplete (subagents)
  topP?: number                          // LLM topP override
  temperature?: number                   // LLM temperature override
  color?: string                         // Hex (#FF5733) or theme color (primary/secondary/accent/success/warning/error/info)
  permission: Permission.Ruleset         // Array of {permission, pattern, action} rules
  model?: {                              // Override model for this agent
    modelID: ModelID
    providerID: ProviderID
  }
  variant?: string                       // Model variant (applies to configured model only)
  prompt?: string                        // System prompt (from markdown body)
  options: Record<string, unknown>       // Arbitrary key-value options
  steps?: number                         // Max agentic iterations before forcing text-only
}
```

### 1.3 Built-in Native Agents

| Agent | Mode | Hidden | Description | Key Permissions |
|-------|------|--------|-------------|-----------------|
| **build** | primary | no | Default agent. Executes tools based on configured permissions. | question: allow, plan_enter: allow |
| **plan** | primary | no | Plan mode. Disallows all edit tools. | edit: deny (except .opencode/plans/*.md), plan_exit: allow |
| **general** | subagent | no | General-purpose agent for researching and multi-step tasks. | todowrite: deny |
| **explore** | subagent | no | Fast agent specialized for exploring codebases. | Only: grep, glob, list, bash, webfetch, websearch, read |
| **compaction** | primary | yes | Context compaction agent. | All tools denied |
| **title** | primary | yes | Session title generator. temp=0.5 | All tools denied |
| **summary** | primary | yes | Session summary generator. | All tools denied |

### 1.4 default_agent Mechanism

**Source:** `packages/opencode/src/agent/agent.ts` — `defaultAgent()`

1. Check `config.default_agent` — if set, validate it exists, is primary, and not hidden
2. If not set, find first agent with `mode !== "subagent" && hidden !== true`
3. Falls back to `"build"` if nothing matches

### 1.5 Agent Discovery from `.opencode/agents/`

**Source:** `packages/opencode/src/config/agent.ts` — `load(dir)`

- Scans `{agent,agents}/**/*.md` in each config directory
- Parses YAML frontmatter + markdown body via `ConfigMarkdown.parse()`
- Name derived from filename (strips path segments matching `/.opencode/agent/`, `/.opencode/agents/`, `/agent/`, `/agents/`)
- Frontmatter fields merged with `prompt: markdownBody`
- Unknown frontmatter keys promoted to `options` Record

---

## 2. Tool System

### 2.1 Complete Built-in Tool Inventory

**Source:** `packages/opencode/src/tool/registry.ts`

| Tool ID | Implementation | Description | Conditional |
|---------|---------------|-------------|-------------|
| `invalid` | `InvalidTool` | Handles malformed/invalid tool calls | Always |
| `question` | `QuestionTool` | Ask user questions | Only when `OPENCODE_CLIENT` in [app, cli, desktop] or `OPENCODE_ENABLE_QUESTION_TOOL` |
| `bash` | `ShellTool` | Execute shell commands | Always |
| `read` | `ReadTool` | Read file contents | Always |
| `glob` | `GlobTool` | Find files matching pattern | Always |
| `grep` | `GrepTool` | Search patterns in files | Always |
| `edit` | `EditTool` | Edit files (search-replace) | NOT when GPT models (use patch instead) |
| `write` | `WriteTool` | Write content to files | NOT when GPT models (use patch instead) |
| `task` | `TaskTool` | Delegate to subagent sessions | Always |
| `fetch` | `WebFetchTool` | Fetch web content | Always |
| `todo` | `TodoWriteTool` | Manage todo items | Always |
| `search` | `WebSearchTool` | Web search | Only when provider is `opencode` or `OPENCODE_ENABLE_EXA` flag |
| `skill` | `SkillTool` | Load specialized skills | Always |
| `patch` | `ApplyPatchTool` | Apply patches to files | Only for GPT models (not oss, not gpt-4) |
| `lsp` | `LspTool` | LSP interactions | Only when `OPENCODE_EXPERIMENTAL_LSP_TOOL` flag |
| `plan` | `PlanExitTool` | Plan mode enter/exit | Only when `OPENCODE_EXPERIMENTAL_PLAN_MODE` AND `OPENCODE_CLIENT === "cli"` |

### 2.2 Custom Tools

**Two sources:**
1. **File-based tools:** Scanned from `{tool,tools}/*.{js,ts}` in each config directory. Filename becomes namespace, default export gets namespace name, named exports get `namespace_name`.
2. **Plugin tools:** From plugin's `Hooks.tool` object. Each entry becomes a custom tool.

**Plugin tool registration** (`fromPlugin` in registry.ts):
- Plugin defines `args` as a raw Zod shape
- Wrapped in `Schema.declare` with `ZodOverride` annotation
- Plugin tools can override built-in tools if same name

### 2.3 Tool.Def Type

**Source:** `packages/opencode/src/tool/tool.ts`

```typescript
interface Def<Parameters, Metadata> {
  id: string
  description: string
  parameters: Schema.Decoder<unknown>  // Effect Schema
  execute(args, ctx: Context): Effect.Effect<ExecuteResult<Metadata>>
  formatValidationError?(error): string
}

interface Context {
  sessionID: SessionID
  messageID: MessageID
  agent: string
  abort: AbortSignal
  callID?: string
  extra?: { [key: string]: unknown }
  messages: MessageV2.WithParts[]
  metadata(input: { title?: string; metadata?: Metadata }): Effect.Effect<void>
  ask(input: Omit<Permission.Request, "id" | "sessionID" | "tool">): Effect.Effect<void>
}

interface ExecuteResult<Metadata> {
  title: string
  metadata: Metadata
  output: string
  attachments?: Omit<MessageV2.FilePart, "id" | "sessionID" | "messageID">[]
}
```

### 2.4 Tool Permission Keys

Tool permissions are evaluated against the tool's `id`:
- `"*"` — wildcard matches all tools
- `"bash"` — shell commands
- `"read"` — file reads
- `"edit"` — covers edit, write, AND apply_patch
- `"task"` — subagent dispatch
- `"skill"` — skill loading
- `"todowrite"` — todo management
- `"external_directory"` — access to paths outside project
- `"doom_loop"` — infinite loop detection
- `"question"` — asking user questions
- `"plan_enter"` / `"plan_exit"` — plan mode transitions
- Any custom tool ID

---

## 3. Permission System

### 3.1 Permission Rule Model

**Source:** `packages/opencode/src/permission/index.ts`, `packages/opencode/src/permission/evaluate.ts`

```typescript
type Rule = {
  permission: string    // Tool name or wildcard
  pattern: string       // Glob pattern for matching
  action: "allow" | "deny" | "ask"
}

type Ruleset = Rule[]  // Ordered rules, last match wins
```

**Evaluation:** `evaluate(permission, pattern, ...rulesets)` — finds the LAST matching rule across all flattened rulesets. Default is `"ask"` if no match found.

**Wildcard matching:** Uses `Wildcard.match()` for both permission and pattern fields.

### 3.2 Permission Merge Order

For each agent, permissions merge in this order (later wins):
1. **System defaults** — `*` → allow, doom_loop → ask, external_directory `*` → ask, question → deny, etc.
2. **Agent-specific defaults** — e.g., build gets question: allow; explore gets only read/grep/glob/bash
3. **User config** — from `opencode.json` → `permission` field
4. **Per-agent config** — from `opencode.json` → `agent.<name>.permission`

### 3.3 Permission in Subagent Sessions

**Source:** `packages/opencode/src/tool/task.ts`

Child sessions inherit from parent:
- Parent's `external_directory` rules carry over
- Parent's `deny` rules carry over
- If child agent lacks `task` permission → task denied in child
- If child agent lacks `todowrite` permission → todowrite denied in child
- `experimental.primary_tools` from config → allowed in child sessions

### 3.4 Permission Config Format

```json
{
  "permission": {
    "*": "allow",              // All tools
    "bash": "ask",             // Ask before bash
    "edit": {                  // Per-pattern rules
      "*": "ask",
      "src/**": "allow"
    },
    "external_directory": {
      "*": "ask",
      "/tmp/*": "allow"
    }
  }
}
```

---

## 4. Hook System (Plugin SDK)

### 4.1 Complete Hook Inventory

**Source:** `packages/opencode/src/plugin/index.ts` (trigger map), DeepWiki

| Hook Name | Input | Output | Purpose |
|-----------|-------|--------|---------|
| `event` | `{ event: Event }` | — | Global event listener on GlobalBus |
| `config` | `Config` | — | Modify configuration |
| `tool` | — | `{ [key: string]: ToolDefinition }` | Define custom tools |
| `auth` | — | `AuthHook` | Custom auth logic |
| `provider` | — | `ProviderHook` | Provider-specific hooks |
| `chat.message` | `{ sessionID, agent?, model?, messageID?, variant? }` | `{ message, parts }` | New message received |
| `chat.params` | `{ sessionID, agent, model, provider, message }` | `{ temperature, topP, topK, maxOutputTokens, options }` | Modify LLM params before request |
| `chat.headers` | `{ sessionID, agent, model, provider, message }` | `{ headers }` | Inject HTTP headers |
| `permission.ask` | `Permission` | `{ status: "ask" \| "deny" \| "allow" }` | Custom permission handling |
| `command.execute.before` | `{ command, sessionID, arguments }` | `{ parts }` | Intercept before command runs |
| `tool.execute.before` | `{ tool, sessionID, callID }` | `{ args }` | Modify tool args or block |
| `shell.env` | `{ cwd, sessionID?, callID? }` | `{ env }` | Inject env vars |
| `tool.execute.after` | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` | Modify tool output |
| `tool.definition` | `{ toolID }` | `{ description, parameters }` | Modify tool definition |
| `experimental.chat.messages.transform` | `{}` | `{ messages }` | Transform chat messages |
| `experimental.chat.system.transform` | `{ sessionID?, model }` | `{ system }` | Transform system prompt |
| `experimental.session.compacting` | `{ sessionID }` | `{ context, prompt? }` | Customize compaction |
| `experimental.compaction.autocontinue` | `{ sessionID, agent, model, provider, message, overflow }` | `{ enabled }` | Auto-continue after compaction |

### 4.2 Hook Trigger Mechanism

```typescript
// In plugin system
yield* plugin.trigger("tool.execute.before", input, output)
```

Hooks are triggered via `plugin.trigger(hookName, input, output)`. The `output` object is mutable — hooks modify it in place.

---

## 5. Plugin SDK Surface

### 5.1 Package: `@opencode-ai/plugin`

**Source:** `packages/plugin/src/index.ts`, `packages/plugin/src/tool.ts`

```typescript
// packages/plugin/src/tool.ts
import zod from "zod"

interface ToolContext {
  sessionID: string
  messageID: string
  agent: string
  abort: AbortSignal
  callID?: string
  ask: (req) => Promise<void>
  directory: string
  worktree: string
}

interface ToolResult {
  output: string
  metadata?: Record<string, unknown>
}

interface ToolDefinition {
  description: string
  args: z.ZodRawShape
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string | ToolResult>
}

function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args, context): Promise<string | ToolResult>
}): ToolDefinition

// Also exposes tool.schema = zod instance
```

### 5.2 Plugin Entry Point

```typescript
// A plugin is a function:
export default function(input: PluginInput): Hooks

// Where Hooks is an object with any of the hook entries from section 4
```

### 5.3 Plugin Loading Order

**Source:** `packages/opencode/src/config/config.ts` — `loadInstanceState()`

1. Remote well-known configs (from auth providers)
2. Global config (`~/.config/opencode/`)
3. Custom config (OPENCODE_CONFIG flag)
4. Project config files (`opencode.json` in project root)
5. `.opencode/` directory configs
6. Environment variable config (OPENCODE_CONFIG_CONTENT)
7. Account/organization configs
8. Managed preferences (.mobileconfig / MDM)

### 5.4 Plugin Dependency Install

OpenCode auto-installs `@opencode-ai/plugin` as a dependency in each `.opencode/` directory. Plugins from npm are installed into the config directory's `node_modules`.

---

## 6. Skill System

### 6.1 Skill Discovery

**Source:** `packages/opencode/src/skill/index.ts`

Scanning order:
1. **Global external dirs** — `~/.claude/skills/**/SKILL.md` (if not disabled)
2. **Global external dirs** — `~/.agents/skills/**/SKILL.md`
3. **Project external dirs** — Walk up from `directory` to `worktree`, scanning `.claude/skills/` and `.agents/skills/`
4. **Config directories** — `.opencode/{skill,skills}/**/SKILL.md`
5. **Custom paths** — `config.skills.paths` entries
6. **Remote URLs** — `config.skills.urls` entries (pulled via `SkillDiscovery.Service`)

### 6.2 SKILL.md Format

```yaml
---
name: my-skill-name
description: Short description of what this skill does
---

# Skill Content

Full markdown content that gets injected into the conversation
when the skill tool is loaded.
```

**Required frontmatter:** `name` (string), `description` (string)
**Body:** Full markdown content injected as skill content

### 6.3 Skill.Info Schema

```typescript
Skill.Info = {
  name: string        // From frontmatter
  description: string // From frontmatter
  location: string    // Absolute file path (file:// URL in output)
  content: string     // Full markdown body
}
```

### 6.4 Skill Filtering by Agent Permission

**Source:** `packages/opencode/src/skill/index.ts` — `available(agent?)`

```typescript
// Skills are filtered: if agent.permission denies "skill" for the skill's name, it's excluded
list.filter(skill => 
  Permission.evaluate("skill", skill.name, agent.permission).action !== "deny"
)
```

### 6.5 Remote Skill Discovery

**Source:** `packages/opencode/src/skill/discovery.ts`

- Fetches `index.json` from configured URL
- `IndexSkill` objects list files (must include SKILL.md)
- Downloads all listed files to local cache
- Returns list of local directories containing pulled skills

---

## 7. Command System

### 7.1 Command.Info Schema

**Source:** `packages/opencode/src/command/index.ts`

```typescript
Command.Info = {
  name: string                       // Unique identifier
  description?: string               // Brief description
  agent?: string                     // Which agent to use
  model?: string                     // Model override
  source?: "command" | "mcp" | "skill"  // Origin
  template: string | Promise<string> // Prompt template
  subtask?: boolean                  // Force subagent invocation
  hints: string[]                    // Extracted $ARGUMENTS, $1, $2, etc.
}
```

### 7.2 Command Sources

1. **Built-in commands:** `init` (AGENTS.md setup), `review` (review changes)
2. **Config commands:** From `opencode.json` → `command` field
3. **MCP prompts:** Auto-discovered from MCP servers
4. **Skill commands:** Skills auto-register as commands (skill content = template)

### 7.3 Config Command Format

**Source:** `packages/opencode/src/config/command.ts`

```json
{
  "command": {
    "my-command": {
      "template": "Do $ARGUMENTS with the following context: $1",
      "description": "My custom command",
      "agent": "build",
      "model": "anthropic/claude-sonnet-4-20250514",
      "subtask": false
    }
  }
}
```

### 7.4 Template Variable Patterns

- `$ARGUMENTS` — Full user arguments
- `$1`, `$2`, ... — Positional arguments
- `${path}` — Project worktree path (built-in templates only)

### 7.5 Command Discovery from Files

**Source:** `packages/opencode/src/config/command.ts` — `load(dir)`

- Scans `{command,commands}/**/*.md` in config directories
- YAML frontmatter provides config fields
- Markdown body becomes the template

---

## 8. Config System

### 8.1 opencode.json Schema (Top-Level)

**Source:** `packages/opencode/src/config/config.ts`

```typescript
Config.Info = {
  $schema?: string                  // JSON schema ref
  shell?: string                    // Default shell
  logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR"
  server?: ServerConfig             // Server config for serve/web
  command?: Record<string, CommandConfig>
  skills?: { paths?: string[], urls?: string[] }
  watcher?: { ignore?: string[] }
  snapshot?: boolean                // Enable filesystem snapshots (default: true)
  plugin?: PluginSpec[]             // Plugin specifications
  share?: "manual" | "auto" | "disabled"
  autoupdate?: boolean | "notify"
  disabled_providers?: string[]
  enabled_providers?: string[]
  model?: string                    // "provider/model" format
  small_model?: string              // For title generation
  default_agent?: string            // Must be primary, non-hidden
  username?: string
  agent?: Record<string, AgentConfig>
  mode?: Record<string, AgentConfig> // @deprecated, use agent
  provider?: Record<string, ProviderConfig>
  mcp?: Record<string, MCPConfig | { enabled: boolean }>
  formatter?: FormatterConfig
  lsp?: LSPConfig
  instructions?: string[]           // Additional instruction files
  permission?: PermissionConfig
  tools?: Record<string, boolean>   // @deprecated, use permission
  enterprise?: { url?: string }
  tool_output?: { max_lines?: number, max_bytes?: number }
  compaction?: {
    auto?: boolean
    prune?: boolean
    tail_turns?: number
    preserve_recent_tokens?: number
    reserved?: number
  }
  experimental?: {
    disable_paste_summary?: boolean
    batch_tool?: boolean
    openTelemetry?: boolean
    primary_tools?: string[]        // Tools only for primary agents
    continue_loop_on_deny?: boolean
    mcp_timeout?: number
  }
}
```

### 8.2 Agent Config Schema

```typescript
AgentConfig = {
  name?: string
  model?: string                    // "provider/model"
  variant?: string                  // Model variant
  temperature?: number
  top_p?: number
  prompt?: string                   // System prompt override
  description?: string
  mode?: "subagent" | "primary" | "all"
  hidden?: boolean
  color?: string                    // Hex or theme color
  steps?: number                    // Max iterations
  disable?: boolean                 // Remove agent
  options?: Record<string, unknown>
  permission?: PermissionConfig
  tools?: Record<string, boolean>   // @deprecated
}
```

### 8.3 Config Resolution Order

1. Remote well-known configs (from auth)
2. Global config (`~/.config/opencode/opencode.jsonc|json`)
3. OPENCODE_CONFIG env override
4. Project root `opencode.json` / `opencode.jsonc`
5. `.opencode/opencode.json` / `.opencode/opencode.jsonc`
6. OPENCODE_CONFIG_CONTENT env
7. Account/org config
8. Managed preferences (macOS MDM)

**Merge strategy:** Deep merge with array concatenation for `instructions`.

---

## 9. Session / Subagent Dispatch (Task Tool)

### 9.1 Task Tool Parameters

**Source:** `packages/opencode/src/tool/task.ts`

```typescript
TaskTool.Parameters = {
  description: string       // Short (3-5 words) task description
  prompt: string            // Task for the agent
  subagent_type: string     // Agent name to dispatch
  task_id?: string          // Resume existing session
  command?: string          // Command that triggered this task
}
```

### 9.2 Subagent Session Creation

1. Resolve target agent via `Agent.get(subagent_type)`
2. Check if agent has `task` and `todowrite` permissions
3. If `task_id` provided, resume existing session
4. Otherwise, create new session with:
   - `parentID: currentSessionID`
   - Permission rules inherited from parent:
     - Parent's `external_directory` rules
     - Parent's `deny` rules
     - If child lacks `todowrite` → deny todowrite
     - If child lacks `task` → deny task
     - `experimental.primary_tools` → allowed
5. Resolve model from agent config or parent message
6. Dispatch prompt to child session

### 9.3 Model Resolution for Subagents

```typescript
const model = nextAgent.model ?? {
  modelID: parentMessage.modelID,
  providerID: parentMessage.providerID,
}
```

### 9.4 Tool Availability in Subagents

```typescript
tools: {
  ...(canTodo ? {} : { todowrite: false }),
  ...(canTask ? {} : { task: false }),
  ...Object.fromEntries(primary_tools.map(t => [t, false])),
}
```

---

## 10. Key Integration Points for Hivemind

### 10.1 Plugin Registration (Primary Integration Point)

Hivemind registers via the plugin system:
```typescript
export default function(input: PluginInput): Hooks {
  return {
    tool: { /* custom tools */ },
    "tool.execute.before": /* hooks */,
    "tool.execute.after": /* hooks */,
    "experimental.chat.system.transform": /* hooks */,
    event: /* event hooks */,
  }
}
```

### 10.2 Custom Tool Registration

```typescript
tool: {
  "delegate-task": tool({
    description: "Delegate work to specialist agent",
    args: { agent: z.string(), prompt: z.string(), title: z.string() },
    execute: async (args, ctx) => { /* ... */ }
  })
}
```

### 10.3 Hook-Based Integration Surfaces

| Hivemind Feature | OpenCode Hook | Usage |
|-----------------|---------------|-------|
| Tool registration | `tool` | Register delegate-task, delegation-status, etc. |
| Pre-tool interception | `tool.execute.before` | Guard rails before tool execution |
| Post-tool processing | `tool.execute.after` | Truncation, logging, pressure tracking |
| System prompt injection | `experimental.chat.system.transform` | Inject agent instructions, skill content |
| Event bus listening | `event` | Session lifecycle events |
| Permission override | `permission.ask` | Auto-approve/deny based on agent config |
| Shell env injection | `shell.env` | Inject OPENCODE_HARNESS_* env vars |
| LLM param modification | `chat.params` | Agent-specific temperature/topP |
| Tool definition modification | `tool.definition` | Enhance tool descriptions dynamically |

### 10.4 Permission System Alignment

Hivemind's permission model must map to OpenCode's `{permission, pattern, action}` ruleset:
- Hivemind agent configs → OpenCode `agent.<name>.permission`
- Hivemind tool restrictions → OpenCode permission deny rules
- Hivemind delegation boundaries → Task tool permission inheritance

### 10.5 Session Continuity via Task Tool

- `task_id` parameter enables session resume
- Hivemind's `delegationId` maps to OpenCode's `SessionID`
- Parent-child session hierarchy preserved
- Permission inheritance follows OpenCode's model

---

## 11. Unused Primitives Available for Leverage

### 11.1 Currently Unused by Hivemind

| Primitive | Description | Potential Use |
|-----------|-------------|---------------|
| `command.execute.before` hook | Intercept commands before execution | Route GSD commands through Hivemind |
| `chat.headers` hook | Inject custom HTTP headers | Auth headers for provider requests |
| `permission.ask` hook | Custom permission handling | Auto-approve based on agent config |
| `experimental.session.compacting` hook | Customize compaction context | Preserve delegation context during compaction |
| `experimental.compaction.autocontinue` hook | Auto-continue after compaction | Resume interrupted delegations |
| `tool.definition` hook | Modify tool definitions per request | Dynamic tool description enhancement |
| `chat.message` hook | Observe all messages | Session journal population |
| `search` tool (WebSearchTool) | Built-in web search | Remove dependency on external search |
| `lsp` tool | LSP integration | Code intelligence without external tools |
| `plan` tool | Plan mode enter/exit | Could integrate with planning phases |
| `patch` tool (ApplyPatchTool) | Apply patches | Alternative to edit for GPT models |
| `question` tool | Ask user questions | Permission prompts, clarification |
| `skills.urls` config | Remote skill discovery | Distribute Hivemind skills via URL |
| `snapshot` config | Filesystem snapshots | Undo/redo file changes |
| `formatter` config | Code formatting | Auto-format after edits |
| `disabled_providers` / `enabled_providers` | Provider filtering | Lock down to specific providers |
| `experimental.primary_tools` | Tools only for primary agents | Prevent subagents from accessing coordination tools |
| `experimental.continue_loop_on_deny` | Continue when tool denied | Resilience in autonomous loops |

### 11.2 Primitives Hivemind Should NOT Use

| Primitive | Reason |
|-----------|--------|
| `mode` config field | Deprecated, use `agent` |
| `tools` config field | Deprecated, use `permission` |
| `maxSteps` agent field | Deprecated, use `steps` |
| `autoshare` config field | Deprecated, use `share` |
| `layout` config field | Deprecated |

---

## Source Index

| Source | Type | Date |
|--------|------|------|
| `anomalyco/opencode` repo | Source code | 2026-05-10 |
| `packages/opencode/src/agent/agent.ts` | Source | 2026-05-10 |
| `packages/opencode/src/tool/registry.ts` | Source | 2026-05-10 |
| `packages/opencode/src/tool/tool.ts` | Source | 2026-05-10 |
| `packages/opencode/src/tool/task.ts` | Source | 2026-05-10 |
| `packages/opencode/src/permission/index.ts` | Source | 2026-05-10 |
| `packages/opencode/src/permission/evaluate.ts` | Source | 2026-05-10 |
| `packages/opencode/src/skill/index.ts` | Source | 2026-05-10 |
| `packages/opencode/src/command/index.ts` | Source | 2026-05-10 |
| `packages/opencode/src/config/config.ts` | Source | 2026-05-10 |
| `packages/opencode/src/config/agent.ts` | Source | 2026-05-10 |
| `packages/opencode/src/plugin/meta.ts` | Source | 2026-05-10 |
| `packages/plugin/src/tool.ts` (DeepWiki) | Documentation | 2026-05-10 |
| `packages/plugin/src/index.ts` (DeepWiki) | Documentation | 2026-05-10 |
| DeepWiki — anomalyco/opencode Plugin System | Documentation | 2026-05-10 |
| DeepWiki — anomalyco/opencode Configuration System | Documentation | 2026-05-10 |

---

## Knowledge Gaps

1. **Plugin `shell.ts` export** — Full API not confirmed from source read (only DeepWiki summary). Need to verify if `BunShell` is exported and what interface it provides.
2. **Plugin `tui.ts` export** — Not read from source. Likely TUI component registration for sidecar dashboard.
3. **Session lifecycle phases** — Exact lifecycle hooks (session created, message sent, etc.) not mapped from `session.ts` source.
4. **MCP integration surface** — MCP server registration and prompt discovery mechanism only partially documented.
5. **Tool output truncation** — `Truncate.Service` mechanics and `external_directory` tool not fully documented.
6. **Bus event catalog** — Complete list of bus events not enumerated (only permission events confirmed).

## Recommendations

1. **Validate plugin SDK** — Clone `anomalyco/opencode` and read `packages/plugin/src/` directly for exact type signatures before any implementation.
2. **Map Hivemind delegation to task tool** — The task tool's permission inheritance model is the canonical mechanism for subagent dispatch.
3. **Leverage `experimental.chat.system.transform`** — This is how Hivemind should inject agent instructions dynamically.
4. **Use `event` hook for journal** — All bus events can be captured for session journaling.
5. **Consider `skills.urls` for distribution** — Hivemind skills could be distributed via URL rather than requiring local installation.
