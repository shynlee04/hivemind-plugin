# OpenCode Platform Architecture — Source-Verified Research Report

**Source:** `anomalyco/opencode` (dev branch) — `packages/plugin/src/`, `packages/sdk/js/src/gen/`, `packages/opencode/src/agent/`, `packages/opencode/src/permission/`, `packages/opencode/src/plugin/`  
**Date:** 2026-05-20  
**Purpose:** Hivemind thinking-block extraction tool design — verified against actual source code

---

## 1. Messages & Sessions (`Message[]` and `Part[]` types)

All type definitions live in `packages/sdk/js/src/gen/types.gen.ts` (auto-generated from OpenAPI spec). The SDK client lives in `packages/sdk/js/src/gen/sdk.gen.ts`.

### `Message` — Union of UserMessage | AssistantMessage

```typescript
type Message = UserMessage | AssistantMessage
```

### `UserMessage`

```typescript
type UserMessage = {
  id: string
  sessionID: string
  role: "user"
  time: { created: number }
  summary?: {
    title?: string
    body?: string
    diffs: Array<FileDiff>
  }
  agent: string
  model: {
    providerID: string
    modelID: string
  }
  system?: string
  tools?: {
    [key: string]: boolean
  }
}
```

### `AssistantMessage`

```typescript
type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: {
    created: number
    completed?: number
  }
  error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError
  parentID: string
  modelID: string
  providerID: string
  mode: string
  path: {
    cwd: string
    root: string
  }
  summary?: boolean      // true = this is a compaction summary message
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number     // reasoning token count at message level
    cache: {
      read: number
      write: number
    }
  }
  finish?: string
}
```

### `Part` — Discriminated Union (12 variants)

```typescript
type Part =
  | TextPart           // type: "text"
  | {                  // type: "subtask" — inline subagent dispatch
      id: string
      sessionID: string
      messageID: string
      type: "subtask"
      prompt: string
      description: string
      agent: string
    }
  | ReasoningPart      // type: "reasoning" — thinking/reasoning blocks
  | FilePart           // type: "file" — file attachments with source info
  | ToolPart           // type: "tool" — tool calls with state machine
  | StepStartPart      // type: "step-start"
  | StepFinishPart     // type: "step-finish" — cost + tokens (reasoning breakdown)
  | SnapshotPart       // type: "snapshot"
  | PatchPart          // type: "patch" — file patches with hash + file list
  | AgentPart          // type: "agent" — agent name + optional source mapping
  | RetryPart          // type: "retry" — retry attempts with error
  | CompactionPart     // type: "compaction" — marks compaction events
```

### Session Messages API

```typescript
// GET /session/{id}/message
// Returns: 200 Array<{ info: Message; parts: Array<Part> }>
session.messages<ThrowOnError>(options: Options<SessionMessagesData, ThrowOnError>)
```

### Session Prompt API (sync — blocks until completion)

```typescript
// POST /session/{id}/message
session.prompt<ThrowOnError>(options: Options<SessionPromptData, ThrowOnError>)
// Request body:
{
  messageID?: string
  model?: { providerID: string; modelID: string }
  agent?: string
  noReply?: boolean
  system?: string
  tools?: { [key: string]: boolean }
  parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
}
```

### Session Prompt Async API (fire-and-forget)

```typescript
// POST /session/{id}/prompt_async
session.promptAsync<ThrowOnError>(options: Options<SessionPromptAsyncData, ThrowOnError>)
// Request body — same shape as prompt():
{
  messageID?: string
  model?: { providerID: string; modelID: string }
  agent?: string
  noReply?: boolean
  system?: string
  tools?: { [key: string]: boolean }
  parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
}
```

### Input Part Types

```typescript
type TextPartInput = {
  id?: string
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: { start: number; end?: number }
  metadata?: { [key: string]: unknown }
}

type FilePartInput = { /* type: "file", mime, url, etc. */ }
type AgentPartInput = { /* type: "agent", name, source */ }
type SubtaskPartInput = {
  id?: string
  type: "subtask"
  prompt: string
  description: string
  agent: string
}
```

### Other Session APIs

```typescript
session.list()              // GET /session
session.get({ path: { id } })   // GET /session/{id} — returns Session object
session.create({ body?: { parentID?: string; title?: string } })  // POST /session
session.status()            // GET /session/status — returns { [id]: SessionStatus }
session.delete({ path: { id } })  // DELETE /session/{id}
session.fork({ path: { id }, body: { messageID } })  // POST /session/{id}/fork
session.abort({ path: { id } })   // POST /session/{id}/abort
session.revert({ path: { id }, body: { messageID } }) // POST /session/{id}/revert
session.diff({ path: { id } })    // GET /session/{id}/diff
session.children({ path: { id } }) // GET /session/{id}/children
session.summarize({ path: { id } }) // POST /session/{id}/summarize
```

### Session Type

```typescript
type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: Array<FileDiff>
  }
  share?: { url: string }
  title: string
  version: string
  time: {
    created: number
    updated: number
    compacting?: number
  }
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
}
```

---

## 2. Thinking Block Representation

**There is NO `_Thinking_` part type.** Thinking/reasoning content is stored as `ReasoningPart`:

### `ReasoningPart`

```typescript
type ReasoningPart = {
  id: string
  sessionID: string
  messageID: string
  type: "reasoning"              // NOT "_Thinking_"
  text: string                   // The full reasoning/thinking content
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
    end?: number
  }
}
```

### Real-time Part Events

```typescript
type EventMessagePartUpdated = {
  type: "message.part.updated"
  properties: {
    part: Part          // Could be a ReasoningPart being streamed in
    delta?: string      // Streaming delta for progressive updates
  }
}

type EventMessagePartRemoved = {
  type: "message.part.removed"
  properties: {
    sessionID: string
    messageID: string
    partID: string
  }
}
```

### Reasoning Token Tracking

The `AssistantMessage.tokens.reasoning` field tracks the total reasoning tokens consumed:

```typescript
tokens: {
  input: number
  output: number
  reasoning: number     // ← Total reasoning tokens for this message
  cache: {
    read: number
    write: number
  }
}
```

### Implications for Thinking Block Extraction

1. **Filter by type:** Iterate `parts[]`, match `type === "reasoning"` to extract thinking blocks
2. **Streaming:** Subscribe to `message.part.updated` events and filter for `part.type === "reasoning"` with `delta` for real-time extraction
3. **Token detection:** `AssistantMessage.tokens.reasoning > 0` indicates reasoning occurred, even if parts are compacted
4. **Timing:** `ReasoningPart.time.start` and `.end` capture when thinking began and completed
5. **No summary field on ReasoningPart** — the `text` field contains the full content. Compaction may strip reasoning parts entirely (they would be lost after compaction)

---

## 3. `ToolContext` Interface

Source: `packages/plugin/src/tool.ts`

```typescript
type ToolContext = {
  /** Current session ID — use to call session.messages(), session.promptAsync(), etc. */
  sessionID: string

  /** Current message ID — use to identify the message being processed */
  messageID: string

  /** Current agent name (e.g. "build", "plan", "explore") */
  agent: string

  /** Current project directory. Prefer this over process.cwd(). */
  directory: string

  /** Project worktree root. Useful for stable relative paths. */
  worktree: string

  /** AbortSignal to detect tool call cancellation */
  abort: AbortSignal

  /** Attach metadata to the tool result */
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void

  /** Ask the user for permission */
  ask(input: AskInput): Effect.Effect<void>
}

type AskInput = {
  permission: string
  patterns: string[]
  always: string[]
  metadata: { [key: string]: any }
}

type ToolAttachment = {
  type: "file"
  mime: string
  url: string
  filename?: string
}

type ToolResult =
  | string
  | {
      title?: string
      output: string
      metadata?: { [key: string]: any }
      attachments?: ToolAttachment[]
    }
```

### Tool Definition Helper

```typescript
function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>
})
// tool.schema = z (Zod)
```

### Plugin Input Context (available in plugin init, NOT in tool.execute)

```typescript
type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>  // Full SDK client
  project: Project
  directory: string
  worktree: string
  experimental_workspace: {
    register(type: string, adapter: WorkspaceAdapter): void
  }
  serverUrl: URL
  $: BunShell    // Bun shell API (undefined on non-Bun runtimes)
}

type Project = {
  id: string
  worktree: string
  vcsDir?: string
  vcs?: "git"
  time: {
    created: number
    initialized?: number
  }
}
```

> **Note:** `ToolContext` does NOT include `client`. To use the SDK from within a tool, the tool's owner plugin must capture `client` from the `PluginInput` at init time and pass it through closure. Alternatively, use `sessionID` from `ToolContext` to make REST calls.

---

## 4. TUI Append Prompt API

**Critical finding:** No `sessionID` parameter is available.

```typescript
// POST /tui/append-prompt
type TuiAppendPromptData = {
  body?: {
    text: string         // Only text — no sessionID, no target
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/append-prompt"
}
// Response: 200 boolean
```

### TUI Event (also lacks session context)

```typescript
type EventTuiPromptAppend = {
  type: "tui.prompt.append"
  properties: {
    text: string         // No sessionID, no agent info
  }
}
```

### Other TUI commands

```typescript
tui.submitPrompt()              // POST /tui/submit-prompt  — submits the prompt
tui.clearPrompt()               // POST /tui/clear-prompt   — clears the prompt
tui.openHelp()                  // POST /tui/open-help
tui.openSessions()              // POST /tui/open-sessions
tui.openThemes()                // POST /tui/open-themes
tui.openModels()                // POST /tui/open-models
tui.executeCommand({ body: { command: string } })  // POST /tui/execute-command
tui.showToast({ body: { message: string, ... } })  // POST /tui/show-toast
tui.publish({ body: { ... } })                      // POST /tui/publish
```

### Recommended approach to target a specific session

Use `session.prompt()` or `session.promptAsync()` instead of TUI append:

```typescript
// Send a message to a specific session
await client.session.prompt({
  path: { id: targetSessionID },
  body: {
    parts: [{ type: "text", text: "Your message here" }],
  },
})

// Or fire-and-forget
await client.session.promptAsync({
  path: { id: targetSessionID },
  body: {
    parts: [{ type: "text", text: "Your message here" }],
  },
  query: { directory: "/path/to/project" },
})
```

---

## 5. Agent Permission Inheritance

Source: `packages/opencode/src/agent/subagent-permissions.ts` + `packages/opencode/src/permission/index.ts`

### Permission Rule Structure

```typescript
type Rule = {
  permission: string   // e.g. "edit", "bash", "read", "todowrite", "task", "external_directory"
  pattern: string      // glob pattern, "*" for all
  action: "allow" | "deny" | "ask"
}

type Ruleset = Array<Rule>

// Permission evaluation:
type Action = "allow" | "deny" | "ask"
function evaluate(permission: string, pattern: string, ...rulesets: Ruleset[]): Rule
function merge(...rulesets: Ruleset[]): Ruleset
function fromConfig(permission: ConfigPermission.Info): Ruleset
```

### Subagent Permission Derivation

```typescript
function deriveSubagentSessionPermission(input: {
  parentSessionPermission: Permission.Ruleset
  parentAgent: Agent.Info | undefined
  subagent: Agent.Info
}): Permission.Ruleset {
  // Returns merged ruleset from:
  // 1. Parent AGENT's edit-class deny rules
  //    (e.g. Plan Mode's edit:deny — without this, subagents bypass Plan Mode)
  // 2. Parent SESSION's deny rules + external_directory rules
  // 3. Default denies for todowrite + task
  //    (unless subagent's own permission explicitly permits them)
  return [
    ...parentAgentDenies,                              // edit:deny from parent agent
    ...parentSessionPermission.filter(                 // deny + external_directory from parent session
      (rule) => rule.permission === "external_directory" || rule.action === "deny",
    ),
    ...(canTodo ? [] : [{ permission: "todowrite", pattern: "*", action: "deny" }]),
    ...(canTask ? [] : [{ permission: "task", pattern: "*", action: "deny" }]),
  ]
}
```

### Default Agent Permission Layers

```typescript
// Each agent's final permission is:
// Permission.merge(defaults, agentSpecific, userOverrides)

// Base defaults:
const defaults = Permission.fromConfig({
  "*": "allow",
  doom_loop: "ask",
  external_directory: { "*": "ask", Truncate: "allow" },
  question: "deny",
  plan_enter: "deny",
  plan_exit: "deny",
  repo_clone: "deny",
  repo_overview: "deny",
  read: { "*": "allow", "*.env": "ask", "*.env.*": "ask", "*.env.example": "allow" },
})

// Build agent adds:
Permission.fromConfig({ question: "allow", plan_enter: "allow" })

// Plan agent adds:
Permission.fromConfig({
  question: "allow",
  plan_exit: "allow",
  edit: { "*": "deny", ".opencode/plans/*.md": "allow" },
})

// General subagent adds:
Permission.fromConfig({ todowrite: "deny" })
```

### Agent `mode` Field

```typescript
type AgentConfig = {
  mode?: "subagent" | "primary" | "all"
  permission?: {
    edit?: "ask" | "allow" | "deny"
    bash?: "ask" | "allow" | "deny" | { [key: string]: "ask" | "allow" | "deny" }
    webfetch?: "ask" | "allow" | "deny"
    doom_loop?: "ask" | "allow" | "deny"
    external_directory?: "ask" | "allow" | "deny"
  }
  // ... other fields
}
```

- `"primary"` — Main chat agent (appears in default list)
- `"subagent"` — Only dispatchable via task tool or @agent
- `"all"` — Available for both primary and subagent use

### Built-in Agents

| Name | Mode | Native | Notes |
|------|------|--------|-------|
| build | primary | ✓ | Default agent, full tool access |
| plan | primary | ✓ | Plan mode, edit denied |
| general | subagent | ✓ | Generic subagent, todowrite denied |
| explore | subagent | ✓ | Read-only explorer |
| scout | subagent | ✓ | Experimental, repo-clone capable |
| compaction | primary | ✓ | Hidden, compaction prompts |
| title | primary | ✓ | Hidden, title generation |
| summary | primary | ✓ | Hidden, session summarization |

---

## 6. Hooks System

Source: `packages/plugin/src/index.ts` (the `Hooks` interface) + `packages/opencode/src/plugin/index.ts` (the trigger implementation)

### Complete Hook Signature Reference

```typescript
interface Hooks {
  /** Generic event listener — receives ALL bus events */
  event?: (input: { event: Event }) => Promise<void>

  /** Called when config is available */
  config?: (input: Config) => Promise<void>

  /** Register custom tools */
  tool?: {
    [key: string]: ToolDefinition
  }

  /** OAuth/API key authentication hooks */
  auth?: AuthHook

  /** Custom provider with model listing */
  provider?: ProviderHook

  /** Called when a new chat message is received */
  "chat.message"?: (
    input: {
      sessionID: string
      agent?: string
      model?: { providerID: string; modelID: string }
      messageID?: string
      variant?: string
    },
    output: { message: UserMessage; parts: Part[] },
  ) => Promise<void>

  /** Modify LLM parameters (temperature, topP, etc.) */
  "chat.params"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { temperature: number; topP: number; topK: number; maxOutputTokens: number | undefined; options: Record<string, any> },
  ) => Promise<void>

  /** Modify LLM request headers */
  "chat.headers"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { headers: Record<string, string> },
  ) => Promise<void>

  /** Intercept permission prompts before user is asked */
  "permission.ask"?: (
    input: Permission,
    output: { status: "ask" | "deny" | "allow" },
  ) => Promise<void>

  /** Before a slash command executes */
  "command.execute.before"?: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Part[] },
  ) => Promise<void>

  /** === PreToolUse equivalent === */
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>

  /** === PostToolUse equivalent === */
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string; args: any },
    output: { title: string; output: string; metadata: any },
  ) => Promise<void>

  /** Inject environment variables into shell execution */
  "shell.env"?: (
    input: { cwd: string; sessionID?: string; callID?: string },
    output: { env: Record<string, string> },
  ) => Promise<void>

  /** Transform the messages array before sending to LLM */
  "experimental.chat.messages.transform"?: (
    input: {},
    output: { messages: Array<{ info: Message; parts: Part[] }> },
  ) => Promise<void>

  /** Transform system prompts before sending to LLM */
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: { system: string[] },
  ) => Promise<void>

  /** Called before session compaction — customize context or replace prompt entirely */
  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>

  /** Called after compaction — skip the synthetic continue turn */
  "experimental.compaction.autocontinue"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage; overflow: boolean },
    output: { enabled: boolean },
  ) => Promise<void>

  /** Complete a partial text generation */
  "experimental.text.complete"?: (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ) => Promise<void>

  /** Modify tool definitions before sending to LLM */
  "tool.definition"?: (
    input: { toolID: string },
    output: { description: string; parameters: any },
  ) => Promise<void>
}
```

### Hook Trigger Mechanism (internal)

```typescript
// Plugin.Service.trigger() iterates all registered hooks in order:
for (const hook of state.hooks) {
  const fn = hook[name]
  if (!fn) continue
  yield* Effect.promise(async () => fn(input, output))
}
return output
```

### Key Gaps vs Expected Convention

| Expected | Actual | Notes |
|----------|--------|-------|
| `PreToolUse` | `"tool.execute.before"` | Arguments: `input: { tool, sessionID, callID }`, `output: { args }` |
| `PostToolUse` | `"tool.execute.after"` | Arguments: `input: { tool, sessionID, callID, args }`, `output: { title, output, metadata }` |
| `PreResponse` | ❌ Does not exist | Use `"experimental.chat.messages.transform"` or `"chat.message"` instead |
| `PostResponse` | ❌ Does not exist | No hook for after LLM responds; use `"message.part.updated"` events |
| File events | `"file.edited"` | Event-only via `event` hook |
| Message update | `"message.part.updated"` | Event-only via `event` hook |

---

## 7. Model Configuration

### Model/Provider ID Format

```typescript
// In opencode.json config:
// "model": "anthropic/claude-sonnet-4-20250514"
// Format: {providerID}/{modelID}

// Parsing:
Provider.parseModel("anthropic/claude-sonnet-4-20250514")
// Returns: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" }
```

### Model Type

```typescript
type Model = {
  id: string
  providerID: string
  api: {
    id: string
    url: string
    npm: string
  }
  name: string
  capabilities: {
    temperature: boolean
    reasoning: boolean         // Flags whether model supports reasoning/thinking
    attachment: boolean
    toolcall: boolean
    input: {
      text: boolean
      audio: boolean
      image: boolean
      video: boolean
      pdf: boolean
    }
  }
  // ... additional fields
}
```

### Provider Configuration (in opencode.json)

```typescript
type ProviderConfig = {
  api?: string
  name?: string
  env?: Array<string>           // Environment variable names for auth
  id?: string
  npm?: string                  // NPM package for custom provider
  models?: {
    [key: string]: {
      id?: string
      name?: string
      release_date?: string
      attachment?: boolean
      reasoning?: boolean       // Per-model reasoning toggle
      temperature?: boolean
      tool_call?: boolean
      cost?: {
        input: number
        output: number
        cache_read?: number
        cache_write?: number
      }
      limit?: {
        context: number
        output: number
      }
      modalities?: {
        input: Array<"text" | "audio" | "image" | "video" | "pdf">
        output: Array<"text" | "audio" | "image" | "video" | "pdf">
      }
      options?: { [key: string]: unknown }
      headers?: { [key: string]: string }
    }
  }
  options?: { [key: string]: unknown }
  // whitelist/blacklist for model filtering
}
```

### Per-Message Model Override

Both `session.prompt()` and `session.promptAsync()` accept a model override:

```typescript
// Usage:
await client.session.promptAsync({
  path: { id: sessionID },
  body: {
    model: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
    agent: "build",
    tools: { edit: true, read: true },
    parts: [{ type: "text", text: "Your prompt" }],
  },
})
```

### Built-in Agent Model Fields

```typescript
// Agent.Info includes:
type AgentInfo = {
  model?: {
    providerID: string
    modelID: string
  }
  temperature?: number
  topP?: number
  // ...
}
```

### Config-Level Model Settings

```typescript
type Config = {
  model?: string        // Default model: "anthropic/claude-sonnet-4-20250514"
  small_model?: string  // Small model for title generation etc.
  agent?: {
    [key: string]: AgentConfig  // Per-agent model overrides
  }
  provider?: {
    [key: string]: ProviderConfig  // Custom provider/model definitions
  }
  // ...
}
```

---

## 8. Subagent Dispatch Mode

### Mode Definitions

```typescript
// From AgentConfig (opencode.json):
mode?: "subagent" | "primary" | "all"

// From Agent.Info (runtime):
mode: "subagent" | "primary" | "all"
```

### Dispatch Semantics

| Mode | Primary Chat | Subagent Dispatch | Notes |
|------|:---:|:---:|-------|
| `"primary"` | ✓ | ✗ | Visible in agent list, used for main conversation |
| `"subagent"` | ✗ | ✓ | Hidden from default list, only via `task` or `@agent` |
| `"all"` | ✓ | ✓ | Available for both use cases |

### How Subagents Get Dispatched

1. **Via `task` tool** — AI calls `task()` with `subagent` name
2. **Via `@agent` mentions** — user types `@agent-name` in prompt
3. **Via command frontmatter** — commands can set `agent: "agent-name"`

### Tool/Permission Inheritance Chain

```
Parent Session
  └── parent session permissions (all rules)
  └── parent agent permissions (edit:deny rules only)
       │
       ▼
deriveSubagentSessionPermission()
  └── 1. parent agent edit:deny rules (fixes Plan Mode bypass #26514)
  └── 2. parent session deny + external_directory rules
  └── 3. default todowrite:deny + task:deny (unless subagent permits)
       │
       ▼
Subagent Session
  └── derived permission ruleset
  └── + subagent's own agent-level permissions (from opencode.json)
```

### Subagent Permission Limitations

- Subagents get `todowrite: "deny"` by default
- Subagents get `task: "deny"` by default (prevents nested task loops)
- Subagents inherit Plan Mode's `edit:deny` restrictions
- Subagents inherit deny rules from parent session
- Subagents do NOT inherit parent session's `allow` rules (only `deny` and `external_directory`)

### Agent `subtask` Part Type

Subagent dispatch creates a `SubtaskPart` in the parent message:

```typescript
// SubtaskPart is an inline (anonymous) variant of Part:
{ type: "subtask", prompt: string, description: string, agent: string }

// Plus a SubtaskPartInput for sending:
type SubtaskPartInput = {
  id?: string
  type: "subtask"
  prompt: string
  description: string
  agent: string
}
```

### Supporting Types

```typescript
type Command = {
  name: string
  description?: string
  agent?: string           // Agent to dispatch for this command
  model?: string           // Model override for this command
  template: string         // Command template
  subtask?: boolean        // Whether command creates a subagent session
}
```

### Session Hierarchy

```typescript
// Sessions form a parent-child tree via parentID:
type Session = {
  id: string
  parentID?: string        // Parent session ID (null for root sessions)
  // ...
}

// Query children:
client.session.children({ path: { id: sessionID } })
// Returns child sessions for the given parent
```

---

## Appendix: Key Events for Real-Time Monitoring

```typescript
// Full Event union:
type Event =
  | EventServerInstanceDisposed
  | EventInstallationUpdated
  | EventInstallationUpdateAvailable
  | EventLspClientDiagnostics
  | EventLspUpdated
  | EventMessageUpdated           // { type: "message.updated", properties: { info: Message } }
  | EventMessageRemoved           // { type: "message.removed", properties: { sessionID, messageID } }
  | EventMessagePartUpdated       // { type: "message.part.updated", properties: { part: Part, delta?: string } }
  | EventMessagePartRemoved       // { type: "message.part.removed", properties: { sessionID, messageID, partID } }
  | EventPermissionUpdated
  | EventPermissionReplied
  | EventSessionStatus            // { type: "session.status", properties: { sessionID, status: SessionStatus } }
  | EventSessionIdle
  | EventSessionCompacted
  | EventFileEdited
  | EventTodoUpdated
  | EventCommandExecuted
  | EventSessionCreated
  | EventSessionUpdated
  | EventSessionDeleted
  | EventSessionDiff
  | EventSessionError
  | EventFileWatcherUpdated
  | EventTuiPromptAppend            // { type: "tui.prompt.append", properties: { text } } — NO sessionID!
  | EventTuiCommandExecute
  | EventTuiToastShow
  | EventPtyCreated
  | EventPtyUpdated
  | EventPtyExited
  | EventPtyDeleted
  | EventServerConnected

// SessionStatus:
type SessionStatus =
  | { type: "idle" }
  | { type: "retry"; attempt: number; message: string; next: number }
  | { type: "busy" }
```

## Appendix: Plugin Structure Template

```typescript
import { type Plugin, tool } from "@opencode-ai/plugin"

// Plugin init — captures client for later use in tools
export const MyPlugin: Plugin = async ({ client, project, directory, worktree, $ }) => {
  // Capture client for tool closures
  const capturedClient = client

  return {
    // Register custom tools
    tool: {
      extractThinking: tool({
        description: "Extract thinking/reasoning blocks from a session's messages",
        args: {
          sessionID: tool.schema.string().describe("Session ID to analyze"),
          messageID: tool.schema.string().optional().describe("Optional: specific message to check"),
        },
        async execute(args, context) {
          // context has: sessionID, messageID, agent, directory, worktree, abort, metadata, ask
          // Use capturedClient for full SDK access:
          const response = await capturedClient.session.messages({
            path: { id: args.sessionID },
          })
          const messages = response.data
          // Filter reasoning parts:
          const reasoningParts = messages.flatMap(msg =>
            msg.parts.filter(p => p.type === "reasoning")
          )
          return {
            title: "Thinking Blocks Extracted",
            output: JSON.stringify(reasoningParts, null, 2),
            metadata: { count: reasoningParts.length },
          }
        },
      }),
    },

    // Hook into tool execution
    "tool.execute.before": async (input, output) => {
      // input: { tool: string, sessionID: string, callID: string }
      // output: { args: any }
    },

    // Hook into messages
    "chat.message": async (input, output) => {
      // input: { sessionID, agent, model, messageID }
      // output: { message: UserMessage, parts: Part[] }
    },
  }
}
```

## Appendix: Source Files Reference

| File | Purpose |
|------|---------|
| `packages/plugin/src/index.ts` | Plugin SDK — Hooks interface, PluginInput, ProviderContext, types |
| `packages/plugin/src/tool.ts` | ToolContext, tool() helper, ToolDefinition |
| `packages/plugin/src/tui.ts` | TUI plugin hooks |
| `packages/plugin/src/shell.ts` | BunShell type definitions |
| `packages/sdk/js/src/gen/types.gen.ts` | Auto-generated types: Message, Part, Session, Config, Agent, Model, etc. |
| `packages/sdk/js/src/gen/sdk.gen.ts` | Auto-generated SDK client — all REST endpoints |
| `packages/sdk/js/src/client.ts` | createOpencodeClient factory |
| `packages/sdk/js/src/server.ts` | createOpencodeServer, createOpencodeTui |
| `packages/opencode/src/agent/agent.ts` | Agent definitions, permission merging, mode dispatch |
| `packages/opencode/src/agent/subagent-permissions.ts` | deriveSubagentSessionPermission logic |
| `packages/opencode/src/permission/index.ts` | Permission evaluation, fromConfig, merge |
| `packages/opencode/src/plugin/index.ts` | Plugin loader, hook trigger, internal plugin registration |
