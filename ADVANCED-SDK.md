# OpenCode SDK, API, and Plugin Capabilities

## Architecture Overview

OpenCode exposes three layers of extensibility:
1. **The JavaScript SDK** (`@opencode-ai/sdk`) — for programmatic control of a running server
2. **The Plugin System** (`@opencode-ai/plugin`) — for hooks, custom tools, and workflow interception
3. **File-System-Based Extensions** — agents, commands, and local tool files loaded from config directories

```mermaid
graph TD
  "External Code" --> "JS SDK (@opencode-ai/sdk)"
  "External Code" --> "Plugin (@opencode-ai/plugin)"
  "JS SDK" --> "REST API (HTTP)"
  "REST API" --> "Server (Hono)"
  "Server" --> "Session Processor"
  "Session Processor" --> "Plugin.trigger()"
  "Plugin.trigger()" --> "Hooks"
  "Hooks" --> "tool.execute.before"
  "Hooks" --> "tool.execute.after"
  "Hooks" --> "chat.params"
  "Hooks" --> "experimental.chat.system.transform"
  "Hooks" --> "experimental.session.compacting"
  "File-System Extensions" --> "agents/*.md"
  "File-System Extensions" --> "tools/*.ts"
  "File-System Extensions" --> "plugins/*.ts"
  "File-System Extensions" --> "commands/*.md"
```

---

## 1. The JavaScript SDK (`@opencode-ai/sdk`)

### Server Lifecycle

The SDK can spawn and connect to a local opencode server via `createOpencodeServer()` and `createOpencodeClient()`. These are the top-level entry points.

`createOpencodeServer()` spawns an `opencode serve` process and returns a URL once ready. The server URL is parsed from stdout. You can also pass a `config` object (as `OPENCODE_CONFIG_CONTENT`) and an `AbortSignal` for lifecycle control. [1](#1-0) 

The convenience wrapper `createOpencode()` wraps both in one call: [2](#1-1) 

`createOpencodeClient()` builds a typed HTTP client. An `x-opencode-directory` header is injected when a `directory` is passed, which scopes the client to a specific project: [3](#1-2) 

### TUI Integration

`createOpencodeTui()` spawns an interactive TUI process with options to target a specific session, model, agent, or project: [4](#1-3) 

### OpencodeClient — Full API Surface

The `OpencodeClient` class (auto-generated from OpenAPI) exposes namespaced sub-clients: [5](#1-4) 

#### Session Management
All session lifecycle operations are available:

| Method | Description |
|---|---|
| `session.create()` | Create a new session |
| `session.list()` | List all sessions |
| `session.get()` | Get a session by ID |
| `session.update()` | Update session properties |
| `session.delete()` | Delete session and all data |
| `session.prompt()` | Send a synchronous prompt |
| `session.promptAsync()` | Send async prompt (returns immediately) |
| `session.fork()` | Fork a session at a message |
| `session.abort()` | Abort a running session |
| `session.messages()` | List all messages |
| `session.message()` | Get a specific message |
| `session.children()` | Get child sessions |
| `session.summarize()` | Trigger summarization |
| `session.share()` / `session.unshare()` | Sharing control |
| `session.diff()` | Get file diff for the session |
| `session.revert()` / `session.unrevert()` | Undo/redo changes |
| `session.todo()` | Get session todo list |
| `session.init()` | Analyze app and create AGENTS.md |
| `session.command()` | Send a slash command |
| `session.shell()` | Run a shell command |
| `postSessionIdPermissionsPermissionId()` | Respond to a permission request | [6](#1-5) 

#### Event Streaming (SSE)
Subscribe to a real-time Server-Sent Events stream: [7](#1-6) 

#### Tool Introspection [8](#1-7) 

#### MCP Server Management [9](#1-8) 

#### TUI Control
The TUI can be driven programmatically (e.g. for test automation): `tui.appendPrompt`, `tui.submitPrompt`, `tui.executeCommand`, `tui.showToast`, `tui.publish`, and the control queue (`tui.control.next` / `tui.control.response`): [10](#1-9) 

#### Other Namespaces
- `config.get()` / `config.update()` / `config.providers()` — runtime config
- `provider.list()`, `provider.auth()`, `provider.oauth.authorize()` — provider management
- `find.text()`, `find.files()`, `find.symbols()` — workspace search
- `file.list()`, `file.read()`, `file.status()` — file access
- `app.log()`, `app.agents()` — logging and agent listing
- `lsp.status()`, `formatter.status()` — language server status

### SDK Usage Example [11](#1-10) 

---

## 2. The Plugin System (`@opencode-ai/plugin`)

Plugins are the primary way to intercept and extend the workflow at runtime.

### Plugin Type

A plugin is an async function that receives a `PluginInput` and returns a `Hooks` object: [12](#1-11) 

The `PluginInput` context provides the typed SDK client, project info, directory, worktree root, the server URL, and a Bun shell instance (`$`): [13](#1-12) 

### Available Hooks

The `Hooks` interface is the full menu of interception points: [14](#1-13) 

#### Hook Summary

| Hook | When it fires | What you can modify |
|---|---|---|
| `event` | Every bus event | Observe only |
| `config` | Config is loaded | Observe config |
| `tool` | Registration | Register custom tools |
| `auth` | Auth setup | Provide custom auth methods |
| `chat.message` | New message received | Observe message |
| `chat.params` | Before LLM call | `temperature`, `topP`, `topK`, `options` |
| `chat.headers` | Before LLM call | HTTP `headers` sent to provider |
| `permission.ask` | Permission requested | Override `status` (ask/deny/allow) |
| `command.execute.before` | Before slash command | Inject `parts` |
| `tool.execute.before` | Before any tool runs | Modify `args` |
| `tool.execute.after` | After any tool runs | Modify `title`, `output`, `metadata` |
| `shell.env` | Before shell execution | Inject environment variables |
| `tool.definition` | Tool definitions sent to LLM | Modify `description`, `parameters` |
| `experimental.chat.messages.transform` | Before messages sent to LLM | Replace/reorder `messages` |
| `experimental.chat.system.transform` | Before system prompt sent | Add or replace `system` prompt |
| `experimental.session.compacting` | Before compaction | Add `context` or replace `prompt` |
| `experimental.text.complete` | After text part finishes | Replace `text` content |

### Plugin Loading

Plugins are installed from npm (with auto-install via Bun) or loaded from local `file://` URLs. They are deduplicated by package name: [15](#1-14) 

Plugins can also be loaded from `.opencode/plugins/*.ts` (or `.js`) directories automatically: [16](#1-15) 

### Auth Hooks

The `AuthHook` interface allows plugins to register custom OAuth or API key authentication flows, including interactive prompts: [17](#1-16) 

---

## 3. Defining Custom Tools

### Via the Plugin `tool` Helper

The `tool()` helper from `@opencode-ai/plugin` is the recommended way to define a custom tool. It uses Zod for argument schema definition: [18](#1-17) 

The `ToolContext` gives each tool execution access to session/message IDs, directory info, an `AbortSignal`, and two key callbacks: `metadata()` (to update the UI title/metadata mid-run) and `ask()` (to request user permission): [19](#1-18) 

A minimal example registering a custom tool via a plugin: [20](#1-19) 

### Via the File System (No Plugin Required)

Custom tools can also be placed in `{tool,tools}/*.{js,ts}` inside any config directory (e.g., `.opencode/tools/mytool.ts`). They are auto-discovered and loaded. The default export (or each named export) becomes a tool: [21](#1-20) 

### Internal `Tool.define()` API

For building native/internal tools, `Tool.define()` provides a lower-level API with full access to message history, attachments, and validation error formatting: [22](#1-21) 

### Tool Registry

All tools (built-in + custom) are merged in `ToolRegistry.all()`. Custom tools from plugins and the file system are appended last. The registry also supports runtime `register()` for dynamic tool injection: [23](#1-22) 

---

## 4. Hooking into the Session/Workflow System

### The Session Processing Loop

The main agentic loop lives in `SessionPrompt.loop()`. It iterates over messages, dispatches to `SessionProcessor`, and handles compaction, subtasks, and structured output: [24](#1-23) 

At each step, before tools are resolved and before the LLM is called, `Plugin.trigger()` is invoked at multiple points: [25](#1-24) [26](#1-25) 

### Tool Execution Hooks in the Loop

Both before and after every tool call (built-in and MCP), `Plugin.trigger("tool.execute.before")` and `Plugin.trigger("tool.execute.after")` are called: [27](#1-26) 

### The Plugin.trigger() Mechanism

`Plugin.trigger()` runs all registered hooks sequentially, passing a mutable `output` object that each hook may modify: [28](#1-27) 

---

## 5. Agent State & Routing

### Agent Configuration

Agents are the routing primitive in OpenCode. Each agent has a `mode` (`primary`, `subagent`, `all`), a permission ruleset, an optional system `prompt`, optional `model` override, and a `description` used by the LLM to decide when to invoke it: [29](#1-28) 

Built-in agents include `build` (default), `plan` (read-only), `general` (parallel subtasks), `explore` (fast codebase search), `compaction`, `title`, and `summary`.

### Defining Custom Agents

Custom agents are defined in config as `agent.my_agent` entries in `opencode.json` or as Markdown files in `{agent,agents}/**/*.md` inside any config directory. The markdown frontmatter sets metadata, and the body sets the system prompt: [30](#1-29) 

The full agent config schema: [31](#1-30) 

### Agent System Prompt via Plugin

The `experimental.chat.system.transform` hook allows a plugin to inject additional strings into (or completely replace) the system prompt for any agent at call time: [32](#1-31) 

This is also called when generating new agent configurations: [33](#1-32) 

### Intelligent Routing — The Task/Subagent System

The `task` tool (`TaskTool`) is used by the primary agent to delegate to subagents. Subagents are invoked with a prompt, description, and `subagent_type` (the agent name). The loop detects pending `subtask` parts and dispatches them: [34](#1-33) 

### Permission-Based Tool Routing

Tool availability per agent is controlled by `PermissionNext.Ruleset`. The `permission` field on each agent specifies which tools are `allow`, `deny`, or `ask`. This is merged from defaults, agent config, session config, and user config: [35](#1-34) 

The `permission.ask` plugin hook allows a plugin to intercept any permission check and override the result: [36](#1-35) 

### Session Bus Events

All session lifecycle changes emit typed events on the internal `Bus`, which plugins can observe via the `event` hook. Key events include `session.created`, `session.updated`, `session.deleted`, `session.error`, `message.updated`, `message.removed`, `part.updated`, `part.delta`, and `session.compacted`: [37](#1-36) [38](#1-37) 

The `Bus.subscribeAll` is used internally to fan out all events to plugin `event` hooks: [39](#1-38) 

### Compaction Hook (Context Window Management)

The `experimental.session.compacting` hook fires before context window compaction, letting a plugin inject additional context or replace the entire summarization prompt: [40](#1-39) 

---

## 6. MCP Server Integration

MCP (Model Context Protocol) servers are another extensibility layer — tools from connected MCP servers are automatically merged into the tool set for every session. They are configured via the `mcp` key in `opencode.json`, supporting both `local` (stdio) and `remote` (HTTP/SSE/OAuth) transports: [41](#1-40) 

MCP tools receive the same `tool.execute.before` / `tool.execute.after` plugin hooks as built-in tools: [42](#1-41) 

---

## Notes

- **`@opencode-ai/plugin`** is the package to depend on when building a plugin or custom tool. The `tool()` helper and `BunShell` types are exported from it. The plugin function signature `(input: PluginInput) => Promise<Hooks>` is the contract.
- **Hooks marked `experimental.*`** are subject to change between versions. The stable hooks are `tool`, `auth`, `event`, `config`, `chat.params`, `chat.headers`, `permission.ask`, `tool.execute.before`, `tool.execute.after`, `shell.env`, and `tool.definition`.
- **Routing intelligence** is achieved by combining: (a) agent `description` fields (used by the LLM to pick subagents via the `task` tool), (b) agent `permission` rulesets (which control what tools each agent can use), and (c) the `experimental.chat.system.transform` hook (which can inject routing instructions into the system prompt dynamically).
- **Local file-system plugins** in `.opencode/plugins/*.ts` are auto-loaded without needing to be added to the `plugin` array in config, making them suitable for per-project extensions.
- The SDK's `event.subscribe()` SSE endpoint exposes all the same bus events externally over HTTP, making it possible to build external dashboards or automation systems that react to real-time session activity.

### Citations

**File:** packages/sdk/js/src/server.ts (L21-91)
```typescript
export async function createOpencodeServer(options?: ServerOptions) {
  options = Object.assign(
    {
      hostname: "127.0.0.1",
      port: 4096,
      timeout: 5000,
    },
    options ?? {},
  )

  const args = [`serve`, `--hostname=${options.hostname}`, `--port=${options.port}`]
  if (options.config?.logLevel) args.push(`--log-level=${options.config.logLevel}`)

  const proc = spawn(`opencode`, args, {
    signal: options.signal,
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(options.config ?? {}),
    },
  })

  const url = await new Promise<string>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`Timeout waiting for server to start after ${options.timeout}ms`))
    }, options.timeout)
    let output = ""
    proc.stdout?.on("data", (chunk) => {
      output += chunk.toString()
      const lines = output.split("\n")
      for (const line of lines) {
        if (line.startsWith("opencode server listening")) {
          const match = line.match(/on\s+(https?:\/\/[^\s]+)/)
          if (!match) {
            throw new Error(`Failed to parse server url from output: ${line}`)
          }
          clearTimeout(id)
          resolve(match[1]!)
          return
        }
      }
    })
    proc.stderr?.on("data", (chunk) => {
      output += chunk.toString()
    })
    proc.on("exit", (code) => {
      clearTimeout(id)
      let msg = `Server exited with code ${code}`
      if (output.trim()) {
        msg += `\nServer output: ${output}`
      }
      reject(new Error(msg))
    })
    proc.on("error", (error) => {
      clearTimeout(id)
      reject(error)
    })
    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        clearTimeout(id)
        reject(new Error("Aborted"))
      })
    }
  })

  return {
    url,
    close() {
      proc.kill()
    },
  }
}
```

**File:** packages/sdk/js/src/server.ts (L93-123)
```typescript
export function createOpencodeTui(options?: TuiOptions) {
  const args = []

  if (options?.project) {
    args.push(`--project=${options.project}`)
  }
  if (options?.model) {
    args.push(`--model=${options.model}`)
  }
  if (options?.session) {
    args.push(`--session=${options.session}`)
  }
  if (options?.agent) {
    args.push(`--agent=${options.agent}`)
  }

  const proc = spawn(`opencode`, args, {
    signal: options?.signal,
    stdio: "inherit",
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(options?.config ?? {}),
    },
  })

  return {
    close() {
      proc.kill()
    },
  }
}
```

**File:** packages/sdk/js/src/index.ts (L8-21)
```typescript
export async function createOpencode(options?: ServerOptions) {
  const server = await createOpencodeServer({
    ...options,
  })

  const client = createOpencodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
```

**File:** packages/sdk/js/src/client.ts (L8-30)
```typescript
export function createOpencodeClient(config?: Config & { directory?: string }) {
  if (!config?.fetch) {
    const customFetch: any = (req: any) => {
      // @ts-ignore
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      fetch: customFetch,
    }
  }

  if (config?.directory) {
    config.headers = {
      ...config.headers,
      "x-opencode-directory": encodeURIComponent(config.directory),
    }
  }

  const client = createClient(config)
  return new OpencodeClient({ client })
}
```

**File:** packages/sdk/js/src/gen/sdk.gen.ts (L373-393)
```typescript
class Tool extends _HeyApiClient {
  /**
   * List all tool IDs (including built-in and dynamically registered)
   */
  public ids<ThrowOnError extends boolean = false>(options?: Options<ToolIdsData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ToolIdsResponses, ToolIdsErrors, ThrowOnError>({
      url: "/experimental/tool/ids",
      ...options,
    })
  }

  /**
   * List tools with JSON schema parameters for a provider/model
   */
  public list<ThrowOnError extends boolean = false>(options: Options<ToolListData, ThrowOnError>) {
    return (options.client ?? this._client).get<ToolListResponses, ToolListErrors, ThrowOnError>({
      url: "/experimental/tool",
      ...options,
    })
  }
}
```

**File:** packages/sdk/js/src/gen/sdk.gen.ts (L431-701)
```typescript
class Session extends _HeyApiClient {
  /**
   * List all sessions
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<SessionListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<SessionListResponses, unknown, ThrowOnError>({
      url: "/session",
      ...options,
    })
  }

  /**
   * Create a new session
   */
  public create<ThrowOnError extends boolean = false>(options?: Options<SessionCreateData, ThrowOnError>) {
    return (options?.client ?? this._client).post<SessionCreateResponses, SessionCreateErrors, ThrowOnError>({
      url: "/session",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Get session status
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<SessionStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<SessionStatusResponses, SessionStatusErrors, ThrowOnError>({
      url: "/session/status",
      ...options,
    })
  }

  /**
   * Delete a session and all its data
   */
  public delete<ThrowOnError extends boolean = false>(options: Options<SessionDeleteData, ThrowOnError>) {
    return (options.client ?? this._client).delete<SessionDeleteResponses, SessionDeleteErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
    })
  }

  /**
   * Get session
   */
  public get<ThrowOnError extends boolean = false>(options: Options<SessionGetData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionGetResponses, SessionGetErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
    })
  }

  /**
   * Update session properties
   */
  public update<ThrowOnError extends boolean = false>(options: Options<SessionUpdateData, ThrowOnError>) {
    return (options.client ?? this._client).patch<SessionUpdateResponses, SessionUpdateErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Get a session's children
   */
  public children<ThrowOnError extends boolean = false>(options: Options<SessionChildrenData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionChildrenResponses, SessionChildrenErrors, ThrowOnError>({
      url: "/session/{id}/children",
      ...options,
    })
  }

  /**
   * Get the todo list for a session
   */
  public todo<ThrowOnError extends boolean = false>(options: Options<SessionTodoData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionTodoResponses, SessionTodoErrors, ThrowOnError>({
      url: "/session/{id}/todo",
      ...options,
    })
  }

  /**
   * Analyze the app and create an AGENTS.md file
   */
  public init<ThrowOnError extends boolean = false>(options: Options<SessionInitData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionInitResponses, SessionInitErrors, ThrowOnError>({
      url: "/session/{id}/init",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Fork an existing session at a specific message
   */
  public fork<ThrowOnError extends boolean = false>(options: Options<SessionForkData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionForkResponses, unknown, ThrowOnError>({
      url: "/session/{id}/fork",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Abort a session
   */
  public abort<ThrowOnError extends boolean = false>(options: Options<SessionAbortData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionAbortResponses, SessionAbortErrors, ThrowOnError>({
      url: "/session/{id}/abort",
      ...options,
    })
  }

  /**
   * Unshare the session
   */
  public unshare<ThrowOnError extends boolean = false>(options: Options<SessionUnshareData, ThrowOnError>) {
    return (options.client ?? this._client).delete<SessionUnshareResponses, SessionUnshareErrors, ThrowOnError>({
      url: "/session/{id}/share",
      ...options,
    })
  }

  /**
   * Share a session
   */
  public share<ThrowOnError extends boolean = false>(options: Options<SessionShareData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionShareResponses, SessionShareErrors, ThrowOnError>({
      url: "/session/{id}/share",
      ...options,
    })
  }

  /**
   * Get the diff for this session
   */
  public diff<ThrowOnError extends boolean = false>(options: Options<SessionDiffData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionDiffResponses, SessionDiffErrors, ThrowOnError>({
      url: "/session/{id}/diff",
      ...options,
    })
  }

  /**
   * Summarize the session
   */
  public summarize<ThrowOnError extends boolean = false>(options: Options<SessionSummarizeData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionSummarizeResponses, SessionSummarizeErrors, ThrowOnError>({
      url: "/session/{id}/summarize",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * List messages for a session
   */
  public messages<ThrowOnError extends boolean = false>(options: Options<SessionMessagesData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionMessagesResponses, SessionMessagesErrors, ThrowOnError>({
      url: "/session/{id}/message",
      ...options,
    })
  }

  /**
   * Create and send a new message to a session
   */
  public prompt<ThrowOnError extends boolean = false>(options: Options<SessionPromptData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionPromptResponses, SessionPromptErrors, ThrowOnError>({
      url: "/session/{id}/message",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Get a message from a session
   */
  public message<ThrowOnError extends boolean = false>(options: Options<SessionMessageData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionMessageResponses, SessionMessageErrors, ThrowOnError>({
      url: "/session/{id}/message/{messageID}",
      ...options,
    })
  }

  /**
   * Create and send a new message to a session, start if needed and return immediately
   */
  public promptAsync<ThrowOnError extends boolean = false>(options: Options<SessionPromptAsyncData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionPromptAsyncResponses, SessionPromptAsyncErrors, ThrowOnError>({
      url: "/session/{id}/prompt_async",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Send a new command to a session
   */
  public command<ThrowOnError extends boolean = false>(options: Options<SessionCommandData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionCommandResponses, SessionCommandErrors, ThrowOnError>({
      url: "/session/{id}/command",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Run a shell command
   */
  public shell<ThrowOnError extends boolean = false>(options: Options<SessionShellData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionShellResponses, SessionShellErrors, ThrowOnError>({
      url: "/session/{id}/shell",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Revert a message
   */
  public revert<ThrowOnError extends boolean = false>(options: Options<SessionRevertData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionRevertResponses, SessionRevertErrors, ThrowOnError>({
      url: "/session/{id}/revert",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Restore all reverted messages
   */
  public unrevert<ThrowOnError extends boolean = false>(options: Options<SessionUnrevertData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionUnrevertResponses, SessionUnrevertErrors, ThrowOnError>({
      url: "/session/{id}/unrevert",
      ...options,
    })
  }
}
```

**File:** packages/sdk/js/src/gen/sdk.gen.ts (L928-974)
```typescript
class Mcp extends _HeyApiClient {
  /**
   * Get MCP server status
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<McpStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<McpStatusResponses, unknown, ThrowOnError>({
      url: "/mcp",
      ...options,
    })
  }

  /**
   * Add MCP server dynamically
   */
  public add<ThrowOnError extends boolean = false>(options?: Options<McpAddData, ThrowOnError>) {
    return (options?.client ?? this._client).post<McpAddResponses, McpAddErrors, ThrowOnError>({
      url: "/mcp",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Connect an MCP server
   */
  public connect<ThrowOnError extends boolean = false>(options: Options<McpConnectData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpConnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/connect",
      ...options,
    })
  }

  /**
   * Disconnect an MCP server
   */
  public disconnect<ThrowOnError extends boolean = false>(options: Options<McpDisconnectData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpDisconnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/disconnect",
      ...options,
    })
  }

  auth = new Auth({ client: this._client })
}
```

**File:** packages/sdk/js/src/gen/sdk.gen.ts (L1026-1143)
```typescript
class Tui extends _HeyApiClient {
  /**
   * Append prompt to the TUI
   */
  public appendPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiAppendPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiAppendPromptResponses, TuiAppendPromptErrors, ThrowOnError>({
      url: "/tui/append-prompt",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Open the help dialog
   */
  public openHelp<ThrowOnError extends boolean = false>(options?: Options<TuiOpenHelpData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenHelpResponses, unknown, ThrowOnError>({
      url: "/tui/open-help",
      ...options,
    })
  }

  /**
   * Open the session dialog
   */
  public openSessions<ThrowOnError extends boolean = false>(options?: Options<TuiOpenSessionsData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenSessionsResponses, unknown, ThrowOnError>({
      url: "/tui/open-sessions",
      ...options,
    })
  }

  /**
   * Open the theme dialog
   */
  public openThemes<ThrowOnError extends boolean = false>(options?: Options<TuiOpenThemesData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenThemesResponses, unknown, ThrowOnError>({
      url: "/tui/open-themes",
      ...options,
    })
  }

  /**
   * Open the model dialog
   */
  public openModels<ThrowOnError extends boolean = false>(options?: Options<TuiOpenModelsData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenModelsResponses, unknown, ThrowOnError>({
      url: "/tui/open-models",
      ...options,
    })
  }

  /**
   * Submit the prompt
   */
  public submitPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiSubmitPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiSubmitPromptResponses, unknown, ThrowOnError>({
      url: "/tui/submit-prompt",
      ...options,
    })
  }

  /**
   * Clear the prompt
   */
  public clearPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiClearPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiClearPromptResponses, unknown, ThrowOnError>({
      url: "/tui/clear-prompt",
      ...options,
    })
  }

  /**
   * Execute a TUI command (e.g. agent_cycle)
   */
  public executeCommand<ThrowOnError extends boolean = false>(options?: Options<TuiExecuteCommandData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiExecuteCommandResponses, TuiExecuteCommandErrors, ThrowOnError>({
      url: "/tui/execute-command",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Show a toast notification in the TUI
   */
  public showToast<ThrowOnError extends boolean = false>(options?: Options<TuiShowToastData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiShowToastResponses, unknown, ThrowOnError>({
      url: "/tui/show-toast",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Publish a TUI event
   */
  public publish<ThrowOnError extends boolean = false>(options?: Options<TuiPublishData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiPublishResponses, TuiPublishErrors, ThrowOnError>({
      url: "/tui/publish",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }
  control = new Control({ client: this._client })
}
```

**File:** packages/sdk/js/src/gen/sdk.gen.ts (L1145-1155)
```typescript
class Event extends _HeyApiClient {
  /**
   * Get events
   */
  public subscribe<ThrowOnError extends boolean = false>(options?: Options<EventSubscribeData, ThrowOnError>) {
    return (options?.client ?? this._client).get.sse<EventSubscribeResponses, unknown, ThrowOnError>({
      url: "/event",
      ...options,
    })
  }
}
```

**File:** packages/sdk/js/src/gen/sdk.gen.ts (L1157-1197)
```typescript
export class OpencodeClient extends _HeyApiClient {
  /**
   * Respond to a permission request
   */
  public postSessionIdPermissionsPermissionId<ThrowOnError extends boolean = false>(
    options: Options<PostSessionIdPermissionsPermissionIdData, ThrowOnError>,
  ) {
    return (options.client ?? this._client).post<
      PostSessionIdPermissionsPermissionIdResponses,
      PostSessionIdPermissionsPermissionIdErrors,
      ThrowOnError
    >({
      url: "/session/{id}/permissions/{permissionID}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }
  global = new Global({ client: this._client })
  project = new Project({ client: this._client })
  pty = new Pty({ client: this._client })
  config = new Config({ client: this._client })
  tool = new Tool({ client: this._client })
  instance = new Instance({ client: this._client })
  path = new Path({ client: this._client })
  vcs = new Vcs({ client: this._client })
  session = new Session({ client: this._client })
  command = new Command({ client: this._client })
  provider = new Provider({ client: this._client })
  find = new Find({ client: this._client })
  file = new File({ client: this._client })
  app = new App({ client: this._client })
  mcp = new Mcp({ client: this._client })
  lsp = new Lsp({ client: this._client })
  formatter = new Formatter({ client: this._client })
  tui = new Tui({ client: this._client })
  auth = new Auth({ client: this._client })
  event = new Event({ client: this._client })
}
```

**File:** packages/sdk/js/example/example.ts (L1-56)
```typescript
import { createOpencodeClient, createOpencodeServer } from "@opencode-ai/sdk"
import { pathToFileURL } from "bun"

const server = await createOpencodeServer()
const client = createOpencodeClient({ baseUrl: server.url })

const input = await Array.fromAsync(new Bun.Glob("packages/core/*.ts").scan())

const tasks: Promise<void>[] = []
for await (const file of input) {
  console.log("processing", file)
  const session = await client.session.create()
  tasks.push(
    client.session.prompt({
      path: { id: session.data.id },
      body: {
        parts: [
          {
            type: "file",
            mime: "text/plain",
            url: pathToFileURL(file).href,
          },
          {
            type: "text",
            text: `Write tests for every public function in this file.`,
          },
        ],
      },
    }),
  )
  console.log("done", file)
}

await Promise.all(
  input.map(async (file) => {
    const session = await client.session.create()
    console.log("processing", file)
    await client.session.prompt({
      path: { id: session.data.id },
      body: {
        parts: [
          {
            type: "file",
            mime: "text/plain",
            url: pathToFileURL(file).href,
          },
          {
            type: "text",
            text: `Write tests for every public function in this file.`,
          },
        ],
      },
    })
    console.log("done", file)
  }),
)
```

**File:** packages/plugin/src/index.ts (L26-35)
```typescript
export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  serverUrl: URL
  $: BunShell
}

export type Plugin = (input: PluginInput) => Promise<Hooks>
```

**File:** packages/plugin/src/index.ts (L37-103)
```typescript
export type AuthHook = {
  provider: string
  loader?: (auth: () => Promise<Auth>, provider: Provider) => Promise<Record<string, any>>
  methods: (
    | {
        type: "oauth"
        label: string
        prompts?: Array<
          | {
              type: "text"
              key: string
              message: string
              placeholder?: string
              validate?: (value: string) => string | undefined
              condition?: (inputs: Record<string, string>) => boolean
            }
          | {
              type: "select"
              key: string
              message: string
              options: Array<{
                label: string
                value: string
                hint?: string
              }>
              condition?: (inputs: Record<string, string>) => boolean
            }
        >
        authorize(inputs?: Record<string, string>): Promise<AuthOuathResult>
      }
    | {
        type: "api"
        label: string
        prompts?: Array<
          | {
              type: "text"
              key: string
              message: string
              placeholder?: string
              validate?: (value: string) => string | undefined
              condition?: (inputs: Record<string, string>) => boolean
            }
          | {
              type: "select"
              key: string
              message: string
              options: Array<{
                label: string
                value: string
                hint?: string
              }>
              condition?: (inputs: Record<string, string>) => boolean
            }
        >
        authorize?(inputs?: Record<string, string>): Promise<
          | {
              type: "success"
              key: string
              provider?: string
            }
          | {
              type: "failed"
            }
        >
      }
  )[]
}
```

**File:** packages/plugin/src/index.ts (L148-234)
```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: {
    [key: string]: ToolDefinition
  }
  auth?: AuthHook
  /**
   * Called when a new message is received
   */
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
  /**
   * Modify parameters sent to LLM
   */
  "chat.params"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { temperature: number; topP: number; topK: number; options: Record<string, any> },
  ) => Promise<void>
  "chat.headers"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { headers: Record<string, string> },
  ) => Promise<void>
  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
  "command.execute.before"?: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Part[] },
  ) => Promise<void>
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  "shell.env"?: (
    input: { cwd: string; sessionID?: string; callID?: string },
    output: { env: Record<string, string> },
  ) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string; args: any },
    output: {
      title: string
      output: string
      metadata: any
    },
  ) => Promise<void>
  "experimental.chat.messages.transform"?: (
    input: {},
    output: {
      messages: {
        info: Message
        parts: Part[]
      }[]
    },
  ) => Promise<void>
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: {
      system: string[]
    },
  ) => Promise<void>
  /**
   * Called before session compaction starts. Allows plugins to customize
   * the compaction prompt.
   *
   * - `context`: Additional context strings appended to the default prompt
   * - `prompt`: If set, replaces the default compaction prompt entirely
   */
  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>
  "experimental.text.complete"?: (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ) => Promise<void>
  /**
   * Modify tool definitions (description and parameters) sent to LLM
   */
  "tool.definition"?: (input: { toolID: string }, output: { description: string; parameters: any }) => Promise<void>
}
```

**File:** packages/opencode/src/plugin/index.ts (L49-103)
```typescript

    let plugins = config.plugin ?? []
    if (plugins.length) await Config.waitForDependencies()
    if (!Flag.OPENCODE_DISABLE_DEFAULT_PLUGINS) {
      plugins = [...BUILTIN, ...plugins]
    }

    for (let plugin of plugins) {
      // ignore old codex plugin since it is supported first party now
      if (plugin.includes("opencode-openai-codex-auth") || plugin.includes("opencode-copilot-auth")) continue
      log.info("loading plugin", { path: plugin })
      if (!plugin.startsWith("file://")) {
        const lastAtIndex = plugin.lastIndexOf("@")
        const pkg = lastAtIndex > 0 ? plugin.substring(0, lastAtIndex) : plugin
        const version = lastAtIndex > 0 ? plugin.substring(lastAtIndex + 1) : "latest"
        plugin = await BunProc.install(pkg, version).catch((err) => {
          const cause = err instanceof Error ? err.cause : err
          const detail = cause instanceof Error ? cause.message : String(cause ?? err)
          log.error("failed to install plugin", { pkg, version, error: detail })
          Bus.publish(Session.Event.Error, {
            error: new NamedError.Unknown({
              message: `Failed to install plugin ${pkg}@${version}: ${detail}`,
            }).toObject(),
          })
          return ""
        })
        if (!plugin) continue
      }
      // Prevent duplicate initialization when plugins export the same function
      // as both a named export and default export (e.g., `export const X` and `export default X`).
      // Object.entries(mod) would return both entries pointing to the same function reference.
      await import(plugin)
        .then(async (mod) => {
          const seen = new Set<PluginInstance>()
          for (const [_name, fn] of Object.entries<PluginInstance>(mod)) {
            if (seen.has(fn)) continue
            seen.add(fn)
            hooks.push(await fn(input))
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err)
          log.error("failed to load plugin", { path: plugin, error: message })
          Bus.publish(Session.Event.Error, {
            error: new NamedError.Unknown({
              message: `Failed to load plugin ${plugin}: ${message}`,
            }).toObject(),
          })
        })
    }

    return {
      hooks,
      input,
    }
```

**File:** packages/opencode/src/plugin/index.ts (L106-121)
```typescript
  export async function trigger<
    Name extends Exclude<keyof Required<Hooks>, "auth" | "event" | "tool">,
    Input = Parameters<Required<Hooks>[Name]>[0],
    Output = Parameters<Required<Hooks>[Name]>[1],
  >(name: Name, input: Input, output: Output): Promise<Output> {
    if (!name) return output
    for (const hook of await state().then((x) => x.hooks)) {
      const fn = hook[name]
      if (!fn) continue
      // @ts-expect-error if you feel adventurous, please fix the typing, make sure to bump the try-counter if you
      // give up.
      // try-counter: 2
      await fn(input, output)
    }
    return output
  }
```

**File:** packages/opencode/src/plugin/index.ts (L134-142)
```typescript
    Bus.subscribeAll(async (input) => {
      const hooks = await state().then((x) => x.hooks)
      for (const hook of hooks) {
        hook["event"]?.({
          event: input,
        })
      }
    })
  }
```

**File:** packages/opencode/src/config/config.ts (L376-413)
```typescript
  async function loadAgent(dir: string) {
    const result: Record<string, Agent> = {}

    for (const item of await Glob.scan("{agent,agents}/**/*.md", {
      cwd: dir,
      absolute: true,
      dot: true,
      symlink: true,
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
```

**File:** packages/opencode/src/config/config.ts (L451-463)
```typescript
  async function loadPlugin(dir: string) {
    const plugins: string[] = []

    for (const item of await Glob.scan("{plugin,plugins}/*.{ts,js}", {
      cwd: dir,
      absolute: true,
      dot: true,
      symlink: true,
    })) {
      plugins.push(pathToFileURL(item).href)
    }
    return plugins
  }
```

**File:** packages/opencode/src/config/config.ts (L517-577)
```typescript
  export const McpLocal = z
    .object({
      type: z.literal("local").describe("Type of MCP server connection"),
      command: z.string().array().describe("Command and arguments to run the MCP server"),
      environment: z
        .record(z.string(), z.string())
        .optional()
        .describe("Environment variables to set when running the MCP server"),
      enabled: z.boolean().optional().describe("Enable or disable the MCP server on startup"),
      timeout: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Timeout in ms for MCP server requests. Defaults to 5000 (5 seconds) if not specified."),
    })
    .strict()
    .meta({
      ref: "McpLocalConfig",
    })

  export const McpOAuth = z
    .object({
      clientId: z
        .string()
        .optional()
        .describe("OAuth client ID. If not provided, dynamic client registration (RFC 7591) will be attempted."),
      clientSecret: z.string().optional().describe("OAuth client secret (if required by the authorization server)"),
      scope: z.string().optional().describe("OAuth scopes to request during authorization"),
    })
    .strict()
    .meta({
      ref: "McpOAuthConfig",
    })
  export type McpOAuth = z.infer<typeof McpOAuth>

  export const McpRemote = z
    .object({
      type: z.literal("remote").describe("Type of MCP server connection"),
      url: z.string().describe("URL of the remote MCP server"),
      enabled: z.boolean().optional().describe("Enable or disable the MCP server on startup"),
      headers: z.record(z.string(), z.string()).optional().describe("Headers to send with the request"),
      oauth: z
        .union([McpOAuth, z.literal(false)])
        .optional()
        .describe(
          "OAuth authentication configuration for the MCP server. Set to false to disable OAuth auto-detection.",
        ),
      timeout: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Timeout in ms for MCP server requests. Defaults to 5000 (5 seconds) if not specified."),
    })
    .strict()
    .meta({
      ref: "McpRemoteConfig",
    })

  export const Mcp = z.discriminatedUnion("type", [McpLocal, McpRemote])
```

**File:** packages/opencode/src/config/config.ts (L666-753)
```typescript
  export const Agent = z
    .object({
      model: ModelId.optional(),
      variant: z
        .string()
        .optional()
        .describe("Default model variant for this agent (applies only when using the agent's configured model)."),
      temperature: z.number().optional(),
      top_p: z.number().optional(),
      prompt: z.string().optional(),
      tools: z.record(z.string(), z.boolean()).optional().describe("@deprecated Use 'permission' field instead"),
      disable: z.boolean().optional(),
      description: z.string().optional().describe("Description of when to use the agent"),
      mode: z.enum(["subagent", "primary", "all"]).optional(),
      hidden: z
        .boolean()
        .optional()
        .describe("Hide this subagent from the @ autocomplete menu (default: false, only applies to mode: subagent)"),
      options: z.record(z.string(), z.any()).optional(),
      color: z
        .union([
          z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color format"),
          z.enum(["primary", "secondary", "accent", "success", "warning", "error", "info"]),
        ])
        .optional()
        .describe("Hex color code (e.g., #FF5733) or theme color (e.g., primary)"),
      steps: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Maximum number of agentic iterations before forcing text-only response"),
      maxSteps: z.number().int().positive().optional().describe("@deprecated Use 'steps' field instead."),
      permission: Permission.optional(),
    })
    .catchall(z.any())
    .transform((agent, ctx) => {
      const knownKeys = new Set([
        "name",
        "model",
        "variant",
        "prompt",
        "description",
        "temperature",
        "top_p",
        "mode",
        "hidden",
        "color",
        "steps",
        "maxSteps",
        "options",
        "permission",
        "disable",
        "tools",
      ])

      // Extract unknown properties into options
      const options: Record<string, unknown> = { ...agent.options }
      for (const [key, value] of Object.entries(agent)) {
        if (!knownKeys.has(key)) options[key] = value
      }

      // Convert legacy tools config to permissions
      const permission: Permission = {}
      for (const [tool, enabled] of Object.entries(agent.tools ?? {})) {
        const action = enabled ? "allow" : "deny"
        // write, edit, patch, multiedit all map to edit permission
        if (tool === "write" || tool === "edit" || tool === "patch" || tool === "multiedit") {
          permission.edit = action
        } else {
          permission[tool] = action
        }
      }
      Object.assign(permission, agent.permission)

      // Convert legacy maxSteps to steps
      const steps = agent.steps ?? agent.maxSteps

      return { ...agent, options, permission, steps } as typeof agent & {
        options?: Record<string, unknown>
        permission?: Permission
        steps?: number
      }
    })
    .meta({
      ref: "AgentConfig",
    })
  export type Agent = z.infer<typeof Agent>
```

**File:** packages/plugin/src/tool.ts (L1-38)
```typescript
import { z } from "zod"

export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  /**
   * Current project directory for this session.
   * Prefer this over process.cwd() when resolving relative paths.
   */
  directory: string
  /**
   * Project worktree root for this session.
   * Useful for generating stable relative paths (e.g. path.relative(worktree, absPath)).
   */
  worktree: string
  abort: AbortSignal
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void
  ask(input: AskInput): Promise<void>
}

type AskInput = {
  permission: string
  patterns: string[]
  always: string[]
  metadata: { [key: string]: any }
}

export function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>
}) {
  return input
}
tool.schema = z

export type ToolDefinition = ReturnType<typeof tool>
```

**File:** packages/plugin/src/example.ts (L1-18)
```typescript
import { Plugin } from "./index"
import { tool } from "./tool"

export const ExamplePlugin: Plugin = async (ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "This is a custom tool",
        args: {
          foo: tool.schema.string().describe("foo"),
        },
        async execute(args) {
          return `Hello ${args.foo}!`
        },
      }),
    },
  }
}
```

**File:** packages/opencode/src/tool/registry.ts (L37-62)
```typescript
  export const state = Instance.state(async () => {
    const custom = [] as Tool.Info[]

    const matches = await Config.directories().then((dirs) =>
      dirs.flatMap((dir) =>
        Glob.scanSync("{tool,tools}/*.{js,ts}", { cwd: dir, absolute: true, dot: true, symlink: true }),
      ),
    )
    if (matches.length) await Config.waitForDependencies()
    for (const match of matches) {
      const namespace = path.basename(match, path.extname(match))
      const mod = await import(pathToFileURL(match).href)
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

**File:** packages/opencode/src/tool/registry.ts (L88-125)
```typescript
  export async function register(tool: Tool.Info) {
    const { custom } = await state()
    const idx = custom.findIndex((t) => t.id === tool.id)
    if (idx >= 0) {
      custom.splice(idx, 1, tool)
      return
    }
    custom.push(tool)
  }

  async function all(): Promise<Tool.Info[]> {
    const custom = await state().then((x) => x.custom)
    const config = await Config.get()
    const question = ["app", "cli", "desktop"].includes(Flag.OPENCODE_CLIENT) || Flag.OPENCODE_ENABLE_QUESTION_TOOL

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
      ...(Flag.OPENCODE_EXPERIMENTAL_PLAN_MODE && Flag.OPENCODE_CLIENT === "cli" ? [PlanExitTool] : []),
      ...custom,
    ]
  }
```

**File:** packages/opencode/src/tool/tool.ts (L27-88)
```typescript
  export interface Info<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
    id: string
    init: (ctx?: InitContext) => Promise<{
      description: string
      parameters: Parameters
      execute(
        args: z.infer<Parameters>,
        ctx: Context,
      ): Promise<{
        title: string
        metadata: M
        output: string
        attachments?: Omit<MessageV2.FilePart, "id" | "sessionID" | "messageID">[]
      }>
      formatValidationError?(error: z.ZodError): string
    }>
  }

  export type InferParameters<T extends Info> = T extends Info<infer P> ? z.infer<P> : never
  export type InferMetadata<T extends Info> = T extends Info<any, infer M> ? M : never

  export function define<Parameters extends z.ZodType, Result extends Metadata>(
    id: string,
    init: Info<Parameters, Result>["init"] | Awaited<ReturnType<Info<Parameters, Result>["init"]>>,
  ): Info<Parameters, Result> {
    return {
      id,
      init: async (initCtx) => {
        const toolInfo = init instanceof Function ? await init(initCtx) : init
        const execute = toolInfo.execute
        toolInfo.execute = async (args, ctx) => {
          try {
            toolInfo.parameters.parse(args)
          } catch (error) {
            if (error instanceof z.ZodError && toolInfo.formatValidationError) {
              throw new Error(toolInfo.formatValidationError(error), { cause: error })
            }
            throw new Error(
              `The ${id} tool was called with invalid arguments: ${error}.\nPlease rewrite the input so it satisfies the expected schema.`,
              { cause: error },
            )
          }
          const result = await execute(args, ctx)
          // skip truncation for tools that handle it themselves
          if (result.metadata.truncated !== undefined) {
            return result
          }
          const truncated = await Truncate.output(result.output, {}, initCtx?.agent)
          return {
            ...result,
            output: truncated.content,
            metadata: {
              ...result.metadata,
              truncated: truncated.truncated,
              ...(truncated.truncated && { outputPath: truncated.outputPath }),
            },
          }
        }
        return toolInfo
      },
    }
  }
```

**File:** packages/opencode/src/session/prompt.ts (L274-326)
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

```

**File:** packages/opencode/src/session/prompt.ts (L352-526)
```typescript
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
            root: Instance.worktree,
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
```

**File:** packages/opencode/src/session/prompt.ts (L649-649)
```typescript
      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: msgs })
```

**File:** packages/opencode/src/session/prompt.ts (L793-826)
```typescript
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
```

**File:** packages/opencode/src/session/prompt.ts (L836-860)
```typescript
      // Wrap execute to add plugin hooks and format output
      item.execute = async (args, opts) => {
        const ctx = context(args, opts)

        await Plugin.trigger(
          "tool.execute.before",
          {
            tool: key,
            sessionID: ctx.sessionID,
            callID: opts.toolCallId,
          },
          {
            args,
          },
        )

        await ctx.ask({
          permission: key,
          metadata: {},
          patterns: ["*"],
          always: ["*"],
        })

        const result = await execute(args, opts)

```

**File:** packages/opencode/src/session/llm.ts (L83-145)
```typescript
    await Plugin.trigger(
      "experimental.chat.system.transform",
      { sessionID: input.sessionID, model: input.model },
      { system },
    )
    // rejoin to maintain 2-part structure for caching if header unchanged
    if (system.length > 2 && system[0] === header) {
      const rest = system.slice(1)
      system.length = 0
      system.push(header, rest.join("\n"))
    }

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
    if (isCodex) {
      options.instructions = SystemPrompt.instructions()
    }

    const params = await Plugin.trigger(
      "chat.params",
      {
        sessionID: input.sessionID,
        agent: input.agent,
        model: input.model,
        provider,
        message: input.user,
      },
      {
        temperature: input.model.capabilities.temperature
          ? (input.agent.temperature ?? ProviderTransform.temperature(input.model))
          : undefined,
        topP: input.agent.topP ?? ProviderTransform.topP(input.model),
        topK: ProviderTransform.topK(input.model),
        options,
      },
    )

    const { headers } = await Plugin.trigger(
      "chat.headers",
      {
        sessionID: input.sessionID,
        agent: input.agent,
        model: input.model,
        provider,
        message: input.user,
      },
      {
        headers: {},
      },
    )
```

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

**File:** packages/opencode/src/agent/agent.ts (L56-75)
```typescript
    const defaults = PermissionNext.fromConfig({
      "*": "allow",
      doom_loop: "ask",
      external_directory: {
        "*": "ask",
        ...Object.fromEntries(whitelistedDirs.map((dir) => [dir, "allow"])),
      },
      question: "deny",
      plan_enter: "deny",
      plan_exit: "deny",
      // mirrors github.com/github/gitignore Node.gitignore pattern for .env files
      read: {
        "*": "allow",
        "*.env": "ask",
        "*.env.*": "ask",
        "*.env.example": "allow",
      },
    })
    const user = PermissionNext.fromConfig(cfg.permission ?? {})

```

**File:** packages/opencode/src/agent/agent.ts (L289-291)
```typescript
    const system = [PROMPT_GENERATE]
    await Plugin.trigger("experimental.chat.system.transform", { model }, { system })
    const existing = await list()
```

**File:** packages/opencode/src/session/index.ts (L181-214)
```typescript
  export const Event = {
    Created: BusEvent.define(
      "session.created",
      z.object({
        info: Info,
      }),
    ),
    Updated: BusEvent.define(
      "session.updated",
      z.object({
        info: Info,
      }),
    ),
    Deleted: BusEvent.define(
      "session.deleted",
      z.object({
        info: Info,
      }),
    ),
    Diff: BusEvent.define(
      "session.diff",
      z.object({
        sessionID: z.string(),
        diff: Snapshot.FileDiff.array(),
      }),
    ),
    Error: BusEvent.define(
      "session.error",
      z.object({
        sessionID: z.string().optional(),
        error: MessageV2.Assistant.shape.error,
      }),
    ),
  }
```

**File:** packages/opencode/src/session/compaction.ts (L21-28)
```typescript
  export const Event = {
    Compacted: BusEvent.define(
      "session.compacted",
      z.object({
        sessionID: z.string(),
      }),
    ),
  }
```

**File:** packages/opencode/src/session/compaction.ts (L167-201)
```typescript
    // Allow plugins to inject context or replace compaction prompt
    const compacting = await Plugin.trigger(
      "experimental.session.compacting",
      { sessionID: input.sessionID },
      { context: [], prompt: undefined },
    )
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
```
For maximum control when building a custom TUI with server and client on different localhost ports, you should run your TUI as a **client** connecting to an OpenCode server.

## Recommended Architecture

```mermaid
graph LR
    "OpenCode Server<br>(port 4096)" --> "HTTP API"
    "Your Custom TUI<br>(client)" --> "HTTP API"
    "Your Custom TUI" --> "SDK Client"
```

## Implementation Approach

**1. Start the OpenCode server** (either via SDK or standalone):

```javascript
import { createOpencodeServer } from "@opencode-ai/sdk"

// Option A: Spawn server via SDK
const server = await createOpencodeServer({
  hostname: "127.0.0.1",
  port: 4096
})
```

**2. Build your TUI as a client**:

```javascript
import { createOpencodeClient } from "@opencode-ai/sdk"

// Connect your TUI to the server
const client = createOpencodeClient({
  baseUrl: "http://localhost:4096"
})
```

**3. Use the SDK for full control**:
- Create/manage sessions with `client.session.create()`
- Send prompts with `client.session.prompt()`
- Stream events with `client.event.subscribe()`
- Control tools, agents, and permissions

## Why Client Architecture?

- **Server handles complexity**: Session management, agent loops, plugin system, and tool execution remain on the server [1](#2-0) 
- **Your TUI stays lightweight**: Only needs to handle UI and API calls
- **Full API access**: The `OpencodeClient` exposes all server capabilities [2](#2-1) 
- **Real-time updates**: Subscribe to SSE events for live session updates [3](#2-2) 

## Alternative: Server-Integrated TUI

If you need deeper integration, you could build your TUI as a plugin that runs on the server, using the plugin hooks system [4](#2-3) . However, this is more complex and the client approach gives you the same control with simpler architecture.

## Notes

- The built-in TUI uses this client-server architecture [5](#2-4) 
- You can run multiple TUI clients connecting to the same server
- Consider using `createOpencode()` for convenience if you want to spawn both server and client together [6](#2-5) 

Wiki pages you might want to explore:
- [Core Application (anomalyco/opencode)](/wiki/anomalyco/opencode#2)

### Citations
## OpenCode: Agent Swarms, Workflow Chaining, Prompt Transformation, State Control, and LSP Integration

Here is a detailed breakdown of each capability area in the OpenCode codebase.

---

## 1. Programmatically Controlling Agent Swarms

### Agent Taxonomy: `mode` Field
Agents are defined with a `mode` property that classifies them as `"primary"`, `"subagent"`, or `"all"`. The built-in `general` and `explore` agents are declared as `"subagent"` mode, meaning they can only be used as sub-workers, not as top-level agents. [1](#3-0) 

### The `TaskTool` – The Swarm Orchestration Primitive
The core mechanism for spawning agent swarms is the `TaskTool` (`packages/opencode/src/tool/task.ts`). It creates a **child session** with `Session.create({ parentID: ctx.sessionID, ... })`, launches a specialized sub-agent into it via `SessionPrompt.prompt(...)`, and returns a `task_id` that can be used to **resume the same subagent session** later. The tool description explicitly instructs the LLM to "Launch multiple agents concurrently whenever possible." [2](#3-1) 

### Agent Access Control for Swarms
Before a subagent is spawned, the `TaskTool` performs a permission check via `ctx.ask(...)` (unless the user explicitly invoked the agent via `@`). It also filters the available agent list based on the caller agent's own permission ruleset — an agent can only spawn subagents it has been granted access to: [3](#3-2) 

### Concurrent Execution via `SubtaskPart`
The main session loop in `SessionPrompt.loop()` handles pending `subtask` parts by directly invoking `TaskTool.init()` and running the subtask inline, allowing the loop to continue dispatching parallel work items: [4](#3-3) 

### Permission Isolation for Subagents
Child sessions created by the `TaskTool` automatically have `todowrite`, `todoread`, and `task` (recursive spawning) permissions **denied** by default, creating a contained execution sandbox: [5](#3-4) 

---

## 2. Chaining Multiple Agent Workflows Together

### Session Parent-Child Relationships
`Session.create()` accepts an optional `parentID`, creating a tree of sessions that model chained workflows. `Session.children()` retrieves all child sessions for a given parent: [6](#3-5) [7](#3-6) 

### Session Forking for Workflow Branching
`Session.fork()` clones all messages up to a given `messageID` into a new session with a forked title (`"fork #1"`), enabling branching workflow chains from any prior state: [8](#3-7) 

### `task_id` Resumption
The `TaskTool` parameters include `task_id` — passing a prior session ID causes the tool to **resume** the existing child session instead of creating a fresh one, enabling multi-step chained workflows where work continues in the same context: [9](#3-8) [10](#3-9) 

### Configurable Agent Models Per Step
Each agent in a chain can use a **different model** — both at the agent-config level (`agent.model`) and at the per-invocation level when calling the `TaskTool`: [11](#3-10) [12](#3-11) 

### Configurable Max Steps Per Agent
Each agent definition can set a `steps` field (a positive integer) that caps the number of LLM turns allowed. The main loop enforces this: [13](#3-12) [14](#3-13) 

---

## 3. Dynamically Transforming Prompts at Runtime

OpenCode uses a **plugin hook system** where each hook receives an immutable `input` context and a mutable `output` object that plugins modify in-place. All hooks are defined in `packages/plugin/src/index.ts`: [15](#3-14) 

The `Plugin.trigger()` function iterates all registered plugins and sequentially calls the matching hook, accumulating changes to the `output` object: [16](#3-15) 

### Hook: `experimental.chat.system.transform` — Mutate the System Prompt Array
Called immediately after the system prompt array is assembled in `LLM.stream()`, before the call to `streamText()`. Plugins can **append or rewrite** any element of the `system: string[]` array. It is also triggered during AI agent generation in `Agent.generate()`: [17](#3-16) [18](#3-17) 

### Hook: `experimental.chat.messages.transform` — Mutate the Full Message History
Called just before messages are passed to the model, allowing wholesale modification of the entire conversation history (messages + parts): [19](#3-18) 

### Hook: `chat.params` — Mutate LLM Inference Parameters
Allows plugins to override `temperature`, `topP`, `topK`, and the provider `options` object on a per-call basis: [20](#3-19) 

### Hook: `chat.headers` — Inject Custom HTTP Headers
Mutates the HTTP headers sent with each LLM API call: [21](#3-20) 

### Hook: `tool.definition` — Modify Tool Descriptions/Schemas Sent to the LLM
Called during tool resolution in `ToolRegistry.tools()`, allowing plugins to rewrite a tool's description and parameter schema before they are sent to the LLM: [22](#3-21) 

### Hook: `tool.execute.before` / `tool.execute.after` — Intercept Tool Calls
`tool.execute.before` fires before every tool call (for built-in tools, MCP tools, and the `TaskTool`), and allows mutation of the tool `args`. `tool.execute.after` fires after, allowing mutation of the output: [23](#3-22) [24](#3-23) 

### Hook: `experimental.text.complete` — Transform Completed Text Chunks
Called when the LLM finishes a `text-end` event, allowing plugins to rewrite the final text of each assistant text part: [25](#3-24) 

### Hook: `experimental.session.compacting` — Customize Compaction Prompts
Lets plugins inject additional context or entirely replace the compaction prompt used when the context window overflows: [26](#3-25) 

### AI SDK-level Message Transform Middleware
There is also a low-level `wrapLanguageModel` middleware in `LLM.stream()` that runs `ProviderTransform.message()` on the raw prompt before it is sent — this normalizes messages per provider (e.g., Anthropic requires non-empty content arrays): [27](#3-26) 

### System Prompts: Per-Model and Per-Agent
`SystemPrompt.provider()` returns different base system prompts based on the model API ID (Claude, GPT, Gemini, etc.). Each `Agent.Info` has its own optional `prompt` field that overrides the provider-level prompt: [28](#3-27) [29](#3-28) 

---

## 4. Granular State Control Over Agent Execution

### The `PermissionNext` Ruleset — Fine-Grained Tool Gating
Every agent carries a `permission: PermissionNext.Ruleset` — an ordered array of `{ permission, pattern, action }` rules. Rules are evaluated last-wins with glob matching on both the permission name and the path/pattern. Actions are `"allow"`, `"deny"`, or `"ask"` (requires human approval): [30](#3-29) [31](#3-30) 

### Permission Layering: Defaults → Agent → Session → User Config
Permissions are composed using `PermissionNext.merge()` (simple array concatenation, last-wins) across four layers: system defaults, agent config, per-session overrides, and user config: [32](#3-31) [33](#3-32) 

### Session-Level Permission Override at Runtime
`Session.setPermission()` can update the active permission ruleset of a running session at any time, immediately affecting all subsequent tool calls: [34](#3-33) 

### `SessionStatus` — Observable Execution State
`SessionStatus.set()` broadcasts `"idle"`, `"busy"`, and `"retry"` state transitions via the event bus. External consumers can subscribe to `SessionStatus.Event.Status` to observe the execution state of any session: [35](#3-34) [36](#3-35) 

### Abort / Cancel
`SessionPrompt.cancel(sessionID)` aborts the active `AbortController` for a session, immediately terminating the in-flight stream. The abort signal is threaded through to every tool call context (`ctx.abort`): [37](#3-36) 

### Doom-Loop Detection
The processor watches the last 3 tool calls; if the same tool is invoked 3 times in a row with identical input, it triggers a `doom_loop` permission ask (default: `"ask"` mode), blocking execution until the user intervenes: [38](#3-37) 

### Session Revert — Time-Travel State Control
`SessionRevert.revert()` can roll back all file changes (via `Snapshot.revert()`) and remove message history past any specified `messageID` or `partID`. `SessionRevert.unrevert()` restores the pre-revert state: [39](#3-38) 

### LLM Loop Exit Signals
`SessionProcessor.process()` returns one of `"continue"`, `"stop"`, or `"compact"`. `"stop"` exits the loop (triggered on permission rejection, tool error, or model finish). `"compact"` triggers automatic context compaction before the next iteration: [40](#3-39) 

### Structured Output Forcing
A `StructuredOutput` tool can be injected into a session to force the model to produce a JSON-schema-validated response with `toolChoice: "required"`, aborting the loop immediately on a valid response: [41](#3-40) [42](#3-41) 

---

## 5. LSP Integration Agents Can Leverage Before Code Execution

### The `lsp` Tool — Direct Agent Access to LSP Operations
The `LspTool` (behind the `OPENCODE_EXPERIMENTAL_LSP_TOOL` flag) exposes 9 LSP operations directly to agents as a first-class tool: [43](#3-42) [44](#3-43) 

The supported operations are: `goToDefinition`, `findReferences`, `hover`, `documentSymbol`, `workspaceSymbol`, `goToImplementation`, `prepareCallHierarchy`, `incomingCalls`, and `outgoingCalls`: [45](#3-44) 

### Automatic Post-Edit Diagnostic Injection
Every time the `EditTool` or `WriteTool` is used, `LSP.touchFile(filePath, true)` is called immediately after the write, which waits for LSP diagnostics, then injects any `severity=1` (ERROR) diagnostics directly into the tool output returned to the agent. The agent sees the errors in the same turn as the edit: [46](#3-45) 

### The `LSP` Namespace — Rich Code Intelligence API
The `LSP` namespace (`packages/opencode/src/lsp/index.ts`) exposes the full API: `diagnostics()`, `hover()`, `workspaceSymbol()`, `documentSymbol()`, `definition()`, `references()`, `implementation()`, `prepareCallHierarchy()`, `incomingCalls()`, `outgoingCalls()`, and `touchFile()` (which notifies LSP servers of file changes and waits for fresh diagnostics): [47](#3-46) 

### Built-in Language Server Support (Auto-Installed)
The `LSPServer` namespace provides auto-spawn logic for the following servers, many of which **auto-download and install** the language server if not found on `PATH`:

| Language | Server |
|---|---|
| TypeScript/JS | `typescript-language-server` |
| Python | `pyright` (or experimental `ty`) |
| Go | `gopls` |
| Rust | `rust-analyzer` |
| C/C++ | `clangd` |
| Ruby | `rubocop` |
| C#/F# | `csharp-ls` / `fsautocomplete` |
| Swift/ObjC | `sourcekit-lsp` |
| Elixir | `elixir-ls` |
| Zig | `zls` |
| Vue | `@vue/language-server` |
| ESLint | `vscode-eslint` (downloaded from GitHub) |
| Oxlint | `oxc_language_server` |
| Biome | `biome lsp-proxy` |
| Deno | `deno lsp` | [48](#3-47) [49](#3-48) [50](#3-49) 

### LSP Client Protocol
The `LSPClient` uses `vscode-jsonrpc` to implement the JSON-RPC message protocol. It handles `textDocument/publishDiagnostics` notifications, debounces them (150ms), and exposes `waitForDiagnostics()` — a Promise that resolves only when a diagnostic event arrives for a specific file within 3 seconds: [51](#3-50) [52](#3-51) 

### LSP Root Detection
Each language server uses a `NearestRoot` function to walk up the directory tree from the edited file looking for language-specific lock files / project files (e.g., `go.mod`, `Cargo.toml`, `package.json`) to determine the correct server root: [53](#3-52) 

---

## Architecture Overview

```mermaid
graph TD
  "Primary Agent (build/plan)" --> "SessionPrompt.loop()"
  "SessionPrompt.loop()" --> "TaskTool"
  "TaskTool" --> "Child Session (subagent)"
  "Child Session (subagent)" --> "SessionPrompt.loop()"
  "SessionPrompt.loop()" --> "LLM.stream()"
  "LLM.stream()" --> "Plugin: experimental.chat.system.transform"
  "LLM.stream()" --> "Plugin: chat.params"
  "LLM.stream()" --> "Plugin: chat.headers"
  "LLM.stream()" --> "streamText() + wrapLanguageModel middleware"
  "streamText() + wrapLanguageModel middleware" --> "SessionProcessor.process()"
  "SessionProcessor.process()" --> "tool.execute.before hook"
  "SessionProcessor.process()" --> "Tool Execution (edit/bash/lsp/...)"
  "Tool Execution (edit/bash/lsp/...)" --> "LSP.touchFile() -> Diagnostics"
  "SessionProcessor.process()" --> "tool.execute.after hook"
  "SessionProcessor.process()" --> "return: continue / stop / compact"
  "PermissionNext.Ruleset" --> "SessionProcessor.process()"
  "SessionStatus (idle/busy/retry)" --> "Event Bus"
```

---

## Notes

1. **The `lsp` tool is experimental**: It requires the environment variable `OPENCODE_EXPERIMENTAL_LSP_TOOL` to be set. Without it, agents cannot call LSP operations directly as a tool, but they still receive LSP diagnostics automatically injected into edit outputs. [44](#3-43) 

2. **Swarm depth control**: By default, subagents have the `task` permission set to `"deny"`, preventing multi-level recursive spawning unless the agent's permission config explicitly includes `task` permissions. This is the primary guard against unbounded swarm depth. [54](#3-53) 

3. **Plugin hooks vs. config**: The `experimental.chat.system.transform` and related hooks are available to **any installed plugin** — they are not limited to the configuration file. Custom plugins can be loaded from npm packages or local `file://` paths. [55](#3-54) 

4. **LSP clients are lazily spawned per file type and per project root** — they are not started until an agent actually touches a file of the corresponding extension, and they are reused across subsequent calls in the same session. [56](#3-55)

### Citations

**File:** packages/opencode/src/agent/agent.ts (L24-48)
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
```

**File:** packages/opencode/src/agent/agent.ts (L56-74)
```typescript
    const defaults = PermissionNext.fromConfig({
      "*": "allow",
      doom_loop: "ask",
      external_directory: {
        "*": "ask",
        ...Object.fromEntries(whitelistedDirs.map((dir) => [dir, "allow"])),
      },
      question: "deny",
      plan_enter: "deny",
      plan_exit: "deny",
      // mirrors github.com/github/gitignore Node.gitignore pattern for .env files
      read: {
        "*": "allow",
        "*.env": "ask",
        "*.env.*": "ask",
        "*.env.example": "allow",
      },
    })
    const user = PermissionNext.fromConfig(cfg.permission ?? {})
```

**File:** packages/opencode/src/agent/agent.ts (L219-219)
```typescript
      if (value.model) item.model = Provider.parseModel(value.model)
```

**File:** packages/opencode/src/agent/agent.ts (L290-291)
```typescript
    await Plugin.trigger("experimental.chat.system.transform", { model }, { system })
    const existing = await list()
```

**File:** packages/opencode/src/tool/task.ts (L14-25)
```typescript
const parameters = z.object({
  description: z.string().describe("A short (3-5 words) description of the task"),
  prompt: z.string().describe("The task for the agent to perform"),
  subagent_type: z.string().describe("The type of specialized agent to use for this task"),
  task_id: z
    .string()
    .describe(
      "This should only be set if you mean to resume a previous task (you can pass a prior task_id and the task will continue the same subagent session as before instead of creating a fresh one)",
    )
    .optional(),
  command: z.string().describe("The command that triggered this task").optional(),
})
```

**File:** packages/opencode/src/tool/task.ts (L27-165)
```typescript
export const TaskTool = Tool.define("task", async (ctx) => {
  const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))

  // Filter agents by permissions if agent provided
  const caller = ctx?.agent
  const accessibleAgents = caller
    ? agents.filter((a) => PermissionNext.evaluate("task", a.name, caller.permission).action !== "deny")
    : agents

  const description = DESCRIPTION.replace(
    "{agents}",
    accessibleAgents
      .map((a) => `- ${a.name}: ${a.description ?? "This subagent should only be called manually by the user."}`)
      .join("\n"),
  )
  return {
    description,
    parameters,
    async execute(params: z.infer<typeof parameters>, ctx) {
      const config = await Config.get()

      // Skip permission check when user explicitly invoked via @ or command subtask
      if (!ctx.extra?.bypassAgentCheck) {
        await ctx.ask({
          permission: "task",
          patterns: [params.subagent_type],
          always: ["*"],
          metadata: {
            description: params.description,
            subagent_type: params.subagent_type,
          },
        })
      }

      const agent = await Agent.get(params.subagent_type)
      if (!agent) throw new Error(`Unknown agent type: ${params.subagent_type} is not a valid agent type`)

      const hasTaskPermission = agent.permission.some((rule) => rule.permission === "task")

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
  }
})
```

**File:** packages/opencode/src/session/prompt.ts (L256-268)
```typescript
  export function cancel(sessionID: string) {
    log.info("cancel", { sessionID })
    const s = state()
    const match = s[sessionID]
    if (!match) {
      SessionStatus.set(sessionID, { type: "idle" })
      return
    }
    match.abort.abort()
    delete s[sessionID]
    SessionStatus.set(sessionID, { type: "idle" })
    return
  }
```

**File:** packages/opencode/src/session/prompt.ts (L350-526)
```typescript
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
            root: Instance.worktree,
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
```

**File:** packages/opencode/src/session/prompt.ts (L558-560)
```typescript
      const agent = await Agent.get(lastUser.agent)
      const maxSteps = agent.steps ?? Infinity
      const isLastStep = step >= maxSteps
```

**File:** packages/opencode/src/session/prompt.ts (L613-622)
```typescript
      // Inject StructuredOutput tool if JSON schema mode enabled
      if (lastUser.format?.type === "json_schema") {
        tools["StructuredOutput"] = createStructuredOutputTool({
          schema: lastUser.format.schema,
          onSuccess(output) {
            structuredOutput = output
          },
        })
      }

```

**File:** packages/opencode/src/session/prompt.ts (L649-649)
```typescript
      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: msgs })
```

**File:** packages/opencode/src/session/prompt.ts (L793-804)
```typescript
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
```

**File:** packages/opencode/src/session/prompt.ts (L815-824)
```typescript
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
```

**File:** packages/opencode/src/session/prompt.ts (L927-954)
```typescript
  export function createStructuredOutputTool(input: {
    schema: Record<string, any>
    onSuccess: (output: unknown) => void
  }): AITool {
    // Remove $schema property if present (not needed for tool input)
    const { $schema, ...toolSchema } = input.schema

    return tool({
      id: "StructuredOutput" as any,
      description: STRUCTURED_OUTPUT_DESCRIPTION,
      inputSchema: jsonSchema(toolSchema as any),
      async execute(args) {
        // AI SDK validates args against inputSchema before calling execute()
        input.onSuccess(args)
        return {
          output: "Structured output captured successfully.",
          title: "Structured Output",
          metadata: { valid: true },
        }
      },
      toModelOutput(result) {
        return {
          type: "text",
          value: result.output,
        }
      },
    })
  }
```

**File:** packages/opencode/src/session/index.ts (L216-232)
```typescript
  export const create = fn(
    z
      .object({
        parentID: Identifier.schema("session").optional(),
        title: z.string().optional(),
        permission: Info.shape.permission,
      })
      .optional(),
    async (input) => {
      return createNext({
        parentID: input?.parentID,
        directory: Instance.directory,
        title: input?.title,
        permission: input?.permission,
      })
    },
  )
```

**File:** packages/opencode/src/session/index.ts (L234-274)
```typescript
  export const fork = fn(
    z.object({
      sessionID: Identifier.schema("session"),
      messageID: Identifier.schema("message").optional(),
    }),
    async (input) => {
      const original = await get(input.sessionID)
      if (!original) throw new Error("session not found")
      const title = getForkedTitle(original.title)
      const session = await createNext({
        directory: Instance.directory,
        title,
      })
      const msgs = await messages({ sessionID: input.sessionID })
      const idMap = new Map<string, string>()

      for (const msg of msgs) {
        if (input.messageID && msg.info.id >= input.messageID) break
        const newID = Identifier.ascending("message")
        idMap.set(msg.info.id, newID)

        const parentID = msg.info.role === "assistant" && msg.info.parentID ? idMap.get(msg.info.parentID) : undefined
        const cloned = await updateMessage({
          ...msg.info,
          sessionID: session.id,
          id: newID,
          ...(parentID && { parentID }),
        })

        for (const part of msg.parts) {
          await updatePart({
            ...part,
            id: Identifier.ascending("part"),
            messageID: cloned.id,
            sessionID: session.id,
          })
        }
      }
      return session
    },
  )
```

**File:** packages/opencode/src/session/index.ts (L416-435)
```typescript
  export const setPermission = fn(
    z.object({
      sessionID: Identifier.schema("session"),
      permission: PermissionNext.Ruleset,
    }),
    async (input) => {
      return Database.use((db) => {
        const row = db
          .update(SessionTable)
          .set({ permission: input.permission, time_updated: Date.now() })
          .where(eq(SessionTable.id, input.sessionID))
          .returning()
          .get()
        if (!row) throw new NotFoundError({ message: `Session not found: ${input.sessionID}` })
        const info = fromRow(row)
        Database.effect(() => Bus.publish(Event.Updated, { info }))
        return info
      })
    },
  )
```

**File:** packages/opencode/src/session/index.ts (L645-655)
```typescript
  export const children = fn(Identifier.schema("session"), async (parentID) => {
    const project = Instance.project
    const rows = Database.use((db) =>
      db
        .select()
        .from(SessionTable)
        .where(and(eq(SessionTable.project_id, project.id), eq(SessionTable.parent_id, parentID)))
        .all(),
    )
    return rows.map(fromRow)
  })
```

**File:** packages/plugin/src/index.ts (L148-234)
```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: {
    [key: string]: ToolDefinition
  }
  auth?: AuthHook
  /**
   * Called when a new message is received
   */
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
  /**
   * Modify parameters sent to LLM
   */
  "chat.params"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { temperature: number; topP: number; topK: number; options: Record<string, any> },
  ) => Promise<void>
  "chat.headers"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { headers: Record<string, string> },
  ) => Promise<void>
  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
  "command.execute.before"?: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Part[] },
  ) => Promise<void>
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  "shell.env"?: (
    input: { cwd: string; sessionID?: string; callID?: string },
    output: { env: Record<string, string> },
  ) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string; args: any },
    output: {
      title: string
      output: string
      metadata: any
    },
  ) => Promise<void>
  "experimental.chat.messages.transform"?: (
    input: {},
    output: {
      messages: {
        info: Message
        parts: Part[]
      }[]
    },
  ) => Promise<void>
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: {
      system: string[]
    },
  ) => Promise<void>
  /**
   * Called before session compaction starts. Allows plugins to customize
   * the compaction prompt.
   *
   * - `context`: Additional context strings appended to the default prompt
   * - `prompt`: If set, replaces the default compaction prompt entirely
   */
  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>
  "experimental.text.complete"?: (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ) => Promise<void>
  /**
   * Modify tool definitions (description and parameters) sent to LLM
   */
  "tool.definition"?: (input: { toolID: string }, output: { description: string; parameters: any }) => Promise<void>
}
```

**File:** packages/opencode/src/plugin/index.ts (L50-98)
```typescript
    let plugins = config.plugin ?? []
    if (plugins.length) await Config.waitForDependencies()
    if (!Flag.OPENCODE_DISABLE_DEFAULT_PLUGINS) {
      plugins = [...BUILTIN, ...plugins]
    }

    for (let plugin of plugins) {
      // ignore old codex plugin since it is supported first party now
      if (plugin.includes("opencode-openai-codex-auth") || plugin.includes("opencode-copilot-auth")) continue
      log.info("loading plugin", { path: plugin })
      if (!plugin.startsWith("file://")) {
        const lastAtIndex = plugin.lastIndexOf("@")
        const pkg = lastAtIndex > 0 ? plugin.substring(0, lastAtIndex) : plugin
        const version = lastAtIndex > 0 ? plugin.substring(lastAtIndex + 1) : "latest"
        plugin = await BunProc.install(pkg, version).catch((err) => {
          const cause = err instanceof Error ? err.cause : err
          const detail = cause instanceof Error ? cause.message : String(cause ?? err)
          log.error("failed to install plugin", { pkg, version, error: detail })
          Bus.publish(Session.Event.Error, {
            error: new NamedError.Unknown({
              message: `Failed to install plugin ${pkg}@${version}: ${detail}`,
            }).toObject(),
          })
          return ""
        })
        if (!plugin) continue
      }
      // Prevent duplicate initialization when plugins export the same function
      // as both a named export and default export (e.g., `export const X` and `export default X`).
      // Object.entries(mod) would return both entries pointing to the same function reference.
      await import(plugin)
        .then(async (mod) => {
          const seen = new Set<PluginInstance>()
          for (const [_name, fn] of Object.entries<PluginInstance>(mod)) {
            if (seen.has(fn)) continue
            seen.add(fn)
            hooks.push(await fn(input))
          }
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err)
          log.error("failed to load plugin", { path: plugin, error: message })
          Bus.publish(Session.Event.Error, {
            error: new NamedError.Unknown({
              message: `Failed to load plugin ${plugin}: ${message}`,
            }).toObject(),
          })
        })
    }
```

**File:** packages/opencode/src/plugin/index.ts (L106-121)
```typescript
  export async function trigger<
    Name extends Exclude<keyof Required<Hooks>, "auth" | "event" | "tool">,
    Input = Parameters<Required<Hooks>[Name]>[0],
    Output = Parameters<Required<Hooks>[Name]>[1],
  >(name: Name, input: Input, output: Output): Promise<Output> {
    if (!name) return output
    for (const hook of await state().then((x) => x.hooks)) {
      const fn = hook[name]
      if (!fn) continue
      // @ts-expect-error if you feel adventurous, please fix the typing, make sure to bump the try-counter if you
      // give up.
      // try-counter: 2
      await fn(input, output)
    }
    return output
  }
```

**File:** packages/opencode/src/session/llm.ts (L68-79)
```typescript
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
```

**File:** packages/opencode/src/session/llm.ts (L83-93)
```typescript
    await Plugin.trigger(
      "experimental.chat.system.transform",
      { sessionID: input.sessionID, model: input.model },
      { system },
    )
    // rejoin to maintain 2-part structure for caching if header unchanged
    if (system.length > 2 && system[0] === header) {
      const rest = system.slice(1)
      system.length = 0
      system.push(header, rest.join("\n"))
    }
```

**File:** packages/opencode/src/session/llm.ts (L114-131)
```typescript
    const params = await Plugin.trigger(
      "chat.params",
      {
        sessionID: input.sessionID,
        agent: input.agent,
        model: input.model,
        provider,
        message: input.user,
      },
      {
        temperature: input.model.capabilities.temperature
          ? (input.agent.temperature ?? ProviderTransform.temperature(input.model))
          : undefined,
        topP: input.agent.topP ?? ProviderTransform.topP(input.model),
        topK: ProviderTransform.topK(input.model),
        options,
      },
    )
```

**File:** packages/opencode/src/session/llm.ts (L133-145)
```typescript
    const { headers } = await Plugin.trigger(
      "chat.headers",
      {
        sessionID: input.sessionID,
        agent: input.agent,
        model: input.model,
        provider,
        message: input.user,
      },
      {
        headers: {},
      },
    )
```

**File:** packages/opencode/src/session/llm.ts (L234-248)
```typescript
      model: wrapLanguageModel({
        model: language,
        middleware: [
          {
            async transformParams(args) {
              if (args.type === "stream") {
                // @ts-expect-error
                args.params.prompt = ProviderTransform.message(args.params.prompt, input.model, options)
              }
              return args.params
            },
          },
        ],
      }),
      experimental_telemetry: {
```

**File:** packages/opencode/src/tool/registry.ts (L120-120)
```typescript
      ...(Flag.OPENCODE_EXPERIMENTAL_LSP_TOOL ? [LspTool] : []),
```

**File:** packages/opencode/src/tool/registry.ts (L162-163)
```typescript
          await Plugin.trigger("tool.definition", { toolID: t.id }, output)
          return {
```

**File:** packages/opencode/src/session/processor.ts (L58-60)
```typescript
                case "start":
                  SessionStatus.set(input.sessionID, { type: "busy" })
                  break
```

**File:** packages/opencode/src/session/processor.ts (L151-176)
```typescript
                    const parts = await MessageV2.parts(input.assistantMessage.id)
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
```

**File:** packages/opencode/src/session/processor.ts (L322-331)
```typescript
                    const textOutput = await Plugin.trigger(
                      "experimental.text.complete",
                      {
                        sessionID: input.sessionID,
                        messageID: input.assistantMessage.id,
                        partID: currentText.id,
                      },
                      { text: currentText.text },
                    )
                    currentText.text = textOutput.text
```

**File:** packages/opencode/src/session/processor.ts (L419-424)
```typescript
          await Session.updateMessage(input.assistantMessage)
          if (needsCompaction) return "compact"
          if (blocked) return "stop"
          if (input.assistantMessage.error) return "stop"
          return "continue"
        }
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

**File:** packages/opencode/src/permission/next.ts (L25-62)
```typescript
  export const Action = z.enum(["allow", "deny", "ask"]).meta({
    ref: "PermissionAction",
  })
  export type Action = z.infer<typeof Action>

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

**File:** packages/opencode/src/permission/next.ts (L64-66)
```typescript
  export function merge(...rulesets: Ruleset[]): Ruleset {
    return rulesets.flat()
  }
```

**File:** packages/opencode/src/permission/next.ts (L236-243)
```typescript
  export function evaluate(permission: string, pattern: string, ...rulesets: Ruleset[]): Rule {
    const merged = merge(...rulesets)
    log.info("evaluate", { permission, pattern, ruleset: merged })
    const match = merged.findLast(
      (rule) => Wildcard.match(permission, rule.permission) && Wildcard.match(pattern, rule.pattern),
    )
    return match ?? { action: "ask", permission, pattern: "*" }
  }
```

**File:** packages/opencode/src/session/status.ts (L6-75)
```typescript
export namespace SessionStatus {
  export const Info = z
    .union([
      z.object({
        type: z.literal("idle"),
      }),
      z.object({
        type: z.literal("retry"),
        attempt: z.number(),
        message: z.string(),
        next: z.number(),
      }),
      z.object({
        type: z.literal("busy"),
      }),
    ])
    .meta({
      ref: "SessionStatus",
    })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Status: BusEvent.define(
      "session.status",
      z.object({
        sessionID: z.string(),
        status: Info,
      }),
    ),
    // deprecated
    Idle: BusEvent.define(
      "session.idle",
      z.object({
        sessionID: z.string(),
      }),
    ),
  }

  const state = Instance.state(() => {
    const data: Record<string, Info> = {}
    return data
  })

  export function get(sessionID: string) {
    return (
      state()[sessionID] ?? {
        type: "idle",
      }
    )
  }

  export function list() {
    return state()
  }

  export function set(sessionID: string, status: Info) {
    Bus.publish(Event.Status, {
      sessionID,
      status,
    })
    if (status.type === "idle") {
      // deprecated
      Bus.publish(Event.Idle, {
        sessionID,
      })
      delete state()[sessionID]
      return
    }
    state()[sessionID] = status
  }
```

**File:** packages/opencode/src/session/revert.ts (L24-89)
```typescript
  export async function revert(input: RevertInput) {
    SessionPrompt.assertNotBusy(input.sessionID)
    const all = await Session.messages({ sessionID: input.sessionID })
    let lastUser: MessageV2.User | undefined
    const session = await Session.get(input.sessionID)

    let revert: Session.Info["revert"]
    const patches: Snapshot.Patch[] = []
    for (const msg of all) {
      if (msg.info.role === "user") lastUser = msg.info
      const remaining = []
      for (const part of msg.parts) {
        if (revert) {
          if (part.type === "patch") {
            patches.push(part)
          }
          continue
        }

        if (!revert) {
          if ((msg.info.id === input.messageID && !input.partID) || part.id === input.partID) {
            // if no useful parts left in message, same as reverting whole message
            const partID = remaining.some((item) => ["text", "tool"].includes(item.type)) ? input.partID : undefined
            revert = {
              messageID: !partID && lastUser ? lastUser.id : msg.info.id,
              partID,
            }
          }
          remaining.push(part)
        }
      }
    }

    if (revert) {
      const session = await Session.get(input.sessionID)
      revert.snapshot = session.revert?.snapshot ?? (await Snapshot.track())
      await Snapshot.revert(patches)
      if (revert.snapshot) revert.diff = await Snapshot.diff(revert.snapshot)
      const rangeMessages = all.filter((msg) => msg.info.id >= revert!.messageID)
      const diffs = await SessionSummary.computeDiff({ messages: rangeMessages })
      await Storage.write(["session_diff", input.sessionID], diffs)
      Bus.publish(Session.Event.Diff, {
        sessionID: input.sessionID,
        diff: diffs,
      })
      return Session.setRevert({
        sessionID: input.sessionID,
        revert,
        summary: {
          additions: diffs.reduce((sum, x) => sum + x.additions, 0),
          deletions: diffs.reduce((sum, x) => sum + x.deletions, 0),
          files: diffs.length,
        },
      })
    }
    return session
  }

  export async function unrevert(input: { sessionID: string }) {
    log.info("unreverting", input)
    SessionPrompt.assertNotBusy(input.sessionID)
    const session = await Session.get(input.sessionID)
    if (!session.revert) return session
    if (session.revert.snapshot) await Snapshot.restore(session.revert.snapshot)
    return Session.clearRevert(input.sessionID)
  }
```

**File:** packages/opencode/src/tool/lsp.ts (L1-97)
```typescript
import z from "zod"
import { Tool } from "./tool"
import path from "path"
import { LSP } from "../lsp"
import DESCRIPTION from "./lsp.txt"
import { Instance } from "../project/instance"
import { pathToFileURL } from "url"
import { assertExternalDirectory } from "./external-directory"
import { Filesystem } from "../util/filesystem"

const operations = [
  "goToDefinition",
  "findReferences",
  "hover",
  "documentSymbol",
  "workspaceSymbol",
  "goToImplementation",
  "prepareCallHierarchy",
  "incomingCalls",
  "outgoingCalls",
] as const

export const LspTool = Tool.define("lsp", {
  description: DESCRIPTION,
  parameters: z.object({
    operation: z.enum(operations).describe("The LSP operation to perform"),
    filePath: z.string().describe("The absolute or relative path to the file"),
    line: z.number().int().min(1).describe("The line number (1-based, as shown in editors)"),
    character: z.number().int().min(1).describe("The character offset (1-based, as shown in editors)"),
  }),
  execute: async (args, ctx) => {
    const file = path.isAbsolute(args.filePath) ? args.filePath : path.join(Instance.directory, args.filePath)
    await assertExternalDirectory(ctx, file)

    await ctx.ask({
      permission: "lsp",
      patterns: ["*"],
      always: ["*"],
      metadata: {},
    })
    const uri = pathToFileURL(file).href
    const position = {
      file,
      line: args.line - 1,
      character: args.character - 1,
    }

    const relPath = path.relative(Instance.worktree, file)
    const title = `${args.operation} ${relPath}:${args.line}:${args.character}`

    const exists = await Filesystem.exists(file)
    if (!exists) {
      throw new Error(`File not found: ${file}`)
    }

    const available = await LSP.hasClients(file)
    if (!available) {
      throw new Error("No LSP server available for this file type.")
    }

    await LSP.touchFile(file, true)

    const result: unknown[] = await (async () => {
      switch (args.operation) {
        case "goToDefinition":
          return LSP.definition(position)
        case "findReferences":
          return LSP.references(position)
        case "hover":
          return LSP.hover(position)
        case "documentSymbol":
          return LSP.documentSymbol(uri)
        case "workspaceSymbol":
          return LSP.workspaceSymbol("")
        case "goToImplementation":
          return LSP.implementation(position)
        case "prepareCallHierarchy":
          return LSP.prepareCallHierarchy(position)
        case "incomingCalls":
          return LSP.incomingCalls(position)
        case "outgoingCalls":
          return LSP.outgoingCalls(position)
      }
    })()

    const output = (() => {
      if (result.length === 0) return `No results found for ${args.operation}`
      return JSON.stringify(result, null, 2)
    })()

    return {
      title,
      metadata: { result },
      output,
    }
  },
})
```

**File:** packages/opencode/src/tool/edit.ts (L146-156)
```typescript
    await LSP.touchFile(filePath, true)
    const diagnostics = await LSP.diagnostics()
    const normalizedFilePath = Filesystem.normalizePath(filePath)
    const issues = diagnostics[normalizedFilePath] ?? []
    const errors = issues.filter((item) => item.severity === 1)
    if (errors.length > 0) {
      const limited = errors.slice(0, MAX_DIAGNOSTICS_PER_FILE)
      const suffix =
        errors.length > MAX_DIAGNOSTICS_PER_FILE ? `\n... and ${errors.length - MAX_DIAGNOSTICS_PER_FILE} more` : ""
      output += `\n\nLSP errors detected in this file, please fix:\n<diagnostics file="${filePath}">\n${limited.map(LSP.Diagnostic.pretty).join("\n")}${suffix}\n</diagnostics>`
    }
```

**File:** packages/opencode/src/lsp/index.ts (L177-262)
```typescript
  async function getClients(file: string) {
    const s = await state()
    const extension = path.parse(file).ext || file
    const result: LSPClient.Info[] = []

    async function schedule(server: LSPServer.Info, root: string, key: string) {
      const handle = await server
        .spawn(root)
        .then((value) => {
          if (!value) s.broken.add(key)
          return value
        })
        .catch((err) => {
          s.broken.add(key)
          log.error(`Failed to spawn LSP server ${server.id}`, { error: err })
          return undefined
        })

      if (!handle) return undefined
      log.info("spawned lsp server", { serverID: server.id })

      const client = await LSPClient.create({
        serverID: server.id,
        server: handle,
        root,
      }).catch((err) => {
        s.broken.add(key)
        handle.process.kill()
        log.error(`Failed to initialize LSP client ${server.id}`, { error: err })
        return undefined
      })

      if (!client) {
        handle.process.kill()
        return undefined
      }

      const existing = s.clients.find((x) => x.root === root && x.serverID === server.id)
      if (existing) {
        handle.process.kill()
        return existing
      }

      s.clients.push(client)
      return client
    }

    for (const server of Object.values(s.servers)) {
      if (server.extensions.length && !server.extensions.includes(extension)) continue

      const root = await server.root(file)
      if (!root) continue
      if (s.broken.has(root + server.id)) continue

      const match = s.clients.find((x) => x.root === root && x.serverID === server.id)
      if (match) {
        result.push(match)
        continue
      }

      const inflight = s.spawning.get(root + server.id)
      if (inflight) {
        const client = await inflight
        if (!client) continue
        result.push(client)
        continue
      }

      const task = schedule(server, root, root + server.id)
      s.spawning.set(root + server.id, task)

      task.finally(() => {
        if (s.spawning.get(root + server.id) === task) {
          s.spawning.delete(root + server.id)
        }
      })

      const client = await task
      if (!client) continue

      result.push(client)
      Bus.publish(Event.Updated, {})
    }

    return result
  }
```

**File:** packages/opencode/src/lsp/index.ts (L277-467)
```typescript
  export async function touchFile(input: string, waitForDiagnostics?: boolean) {
    log.info("touching file", { file: input })
    const clients = await getClients(input)
    await Promise.all(
      clients.map(async (client) => {
        const wait = waitForDiagnostics ? client.waitForDiagnostics({ path: input }) : Promise.resolve()
        await client.notify.open({ path: input })
        return wait
      }),
    ).catch((err) => {
      log.error("failed to touch file", { err, file: input })
    })
  }

  export async function diagnostics() {
    const results: Record<string, LSPClient.Diagnostic[]> = {}
    for (const result of await runAll(async (client) => client.diagnostics)) {
      for (const [path, diagnostics] of result.entries()) {
        const arr = results[path] || []
        arr.push(...diagnostics)
        results[path] = arr
      }
    }
    return results
  }

  export async function hover(input: { file: string; line: number; character: number }) {
    return run(input.file, (client) => {
      return client.connection
        .sendRequest("textDocument/hover", {
          textDocument: {
            uri: pathToFileURL(input.file).href,
          },
          position: {
            line: input.line,
            character: input.character,
          },
        })
        .catch(() => null)
    })
  }

  enum SymbolKind {
    File = 1,
    Module = 2,
    Namespace = 3,
    Package = 4,
    Class = 5,
    Method = 6,
    Property = 7,
    Field = 8,
    Constructor = 9,
    Enum = 10,
    Interface = 11,
    Function = 12,
    Variable = 13,
    Constant = 14,
    String = 15,
    Number = 16,
    Boolean = 17,
    Array = 18,
    Object = 19,
    Key = 20,
    Null = 21,
    EnumMember = 22,
    Struct = 23,
    Event = 24,
    Operator = 25,
    TypeParameter = 26,
  }

  const kinds = [
    SymbolKind.Class,
    SymbolKind.Function,
    SymbolKind.Method,
    SymbolKind.Interface,
    SymbolKind.Variable,
    SymbolKind.Constant,
    SymbolKind.Struct,
    SymbolKind.Enum,
  ]

  export async function workspaceSymbol(query: string) {
    return runAll((client) =>
      client.connection
        .sendRequest("workspace/symbol", {
          query,
        })
        .then((result: any) => result.filter((x: LSP.Symbol) => kinds.includes(x.kind)))
        .then((result: any) => result.slice(0, 10))
        .catch(() => []),
    ).then((result) => result.flat() as LSP.Symbol[])
  }

  export async function documentSymbol(uri: string) {
    const file = fileURLToPath(uri)
    return run(file, (client) =>
      client.connection
        .sendRequest("textDocument/documentSymbol", {
          textDocument: {
            uri,
          },
        })
        .catch(() => []),
    )
      .then((result) => result.flat() as (LSP.DocumentSymbol | LSP.Symbol)[])
      .then((result) => result.filter(Boolean))
  }

  export async function definition(input: { file: string; line: number; character: number }) {
    return run(input.file, (client) =>
      client.connection
        .sendRequest("textDocument/definition", {
          textDocument: { uri: pathToFileURL(input.file).href },
          position: { line: input.line, character: input.character },
        })
        .catch(() => null),
    ).then((result) => result.flat().filter(Boolean))
  }

  export async function references(input: { file: string; line: number; character: number }) {
    return run(input.file, (client) =>
      client.connection
        .sendRequest("textDocument/references", {
          textDocument: { uri: pathToFileURL(input.file).href },
          position: { line: input.line, character: input.character },
          context: { includeDeclaration: true },
        })
        .catch(() => []),
    ).then((result) => result.flat().filter(Boolean))
  }

  export async function implementation(input: { file: string; line: number; character: number }) {
    return run(input.file, (client) =>
      client.connection
        .sendRequest("textDocument/implementation", {
          textDocument: { uri: pathToFileURL(input.file).href },
          position: { line: input.line, character: input.character },
        })
        .catch(() => null),
    ).then((result) => result.flat().filter(Boolean))
  }

  export async function prepareCallHierarchy(input: { file: string; line: number; character: number }) {
    return run(input.file, (client) =>
      client.connection
        .sendRequest("textDocument/prepareCallHierarchy", {
          textDocument: { uri: pathToFileURL(input.file).href },
          position: { line: input.line, character: input.character },
        })
        .catch(() => []),
    ).then((result) => result.flat().filter(Boolean))
  }

  export async function incomingCalls(input: { file: string; line: number; character: number }) {
    return run(input.file, async (client) => {
      const items = (await client.connection
        .sendRequest("textDocument/prepareCallHierarchy", {
          textDocument: { uri: pathToFileURL(input.file).href },
          position: { line: input.line, character: input.character },
        })
        .catch(() => [])) as any[]
      if (!items?.length) return []
      return client.connection.sendRequest("callHierarchy/incomingCalls", { item: items[0] }).catch(() => [])
    }).then((result) => result.flat().filter(Boolean))
  }

  export async function outgoingCalls(input: { file: string; line: number; character: number }) {
    return run(input.file, async (client) => {
      const items = (await client.connection
        .sendRequest("textDocument/prepareCallHierarchy", {
          textDocument: { uri: pathToFileURL(input.file).href },
          position: { line: input.line, character: input.character },
        })
        .catch(() => [])) as any[]
      if (!items?.length) return []
      return client.connection.sendRequest("callHierarchy/outgoingCalls", { item: items[0] }).catch(() => [])
    }).then((result) => result.flat().filter(Boolean))
  }

  async function runAll<T>(input: (client: LSPClient.Info) => Promise<T>): Promise<T[]> {
    const clients = await state().then((x) => x.clients)
    const tasks = clients.map((x) => input(x))
    return Promise.all(tasks)
  }

  async function run<T>(file: string, input: (client: LSPClient.Info) => Promise<T>): Promise<T[]> {
    const clients = await getClients(file)
    const tasks = clients.map((x) => input(x))
    return Promise.all(tasks)
  }
```

**File:** packages/opencode/src/lsp/server.ts (L32-54)
```typescript
  const NearestRoot = (includePatterns: string[], excludePatterns?: string[]): RootFunction => {
    return async (file) => {
      if (excludePatterns) {
        const excludedFiles = Filesystem.up({
          targets: excludePatterns,
          start: path.dirname(file),
          stop: Instance.directory,
        })
        const excluded = await excludedFiles.next()
        await excludedFiles.return()
        if (excluded.value) return undefined
      }
      const files = Filesystem.up({
        targets: includePatterns,
        start: path.dirname(file),
        stop: Instance.directory,
      })
      const first = await files.next()
      await files.return()
      if (!first.value) return Instance.directory
      return path.dirname(first.value)
    }
  }
```

**File:** packages/opencode/src/lsp/server.ts (L64-120)
```typescript
  export const Deno: Info = {
    id: "deno",
    root: async (file) => {
      const files = Filesystem.up({
        targets: ["deno.json", "deno.jsonc"],
        start: path.dirname(file),
        stop: Instance.directory,
      })
      const first = await files.next()
      await files.return()
      if (!first.value) return undefined
      return path.dirname(first.value)
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs"],
    async spawn(root) {
      const deno = which("deno")
      if (!deno) {
        log.info("deno not found, please install deno first")
        return
      }
      return {
        process: spawn(deno, ["lsp"], {
          cwd: root,
        }),
      }
    },
  }

  export const Typescript: Info = {
    id: "typescript",
    root: NearestRoot(
      ["package-lock.json", "bun.lockb", "bun.lock", "pnpm-lock.yaml", "yarn.lock"],
      ["deno.json", "deno.jsonc"],
    ),
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"],
    async spawn(root) {
      const tsserver = await Bun.resolve("typescript/lib/tsserver.js", Instance.directory).catch(() => {})
      log.info("typescript server", { tsserver })
      if (!tsserver) return
      const proc = spawn(BunProc.which(), ["x", "typescript-language-server", "--stdio"], {
        cwd: root,
        env: {
          ...process.env,
          BUN_BE_BUN: "1",
        },
      })
      return {
        process: proc,
        initialization: {
          tsserver: {
            path: tsserver,
          },
        },
      }
    },
  }

```

**File:** packages/opencode/src/lsp/server.ts (L363-402)
```typescript
  export const Gopls: Info = {
    id: "gopls",
    root: async (file) => {
      const work = await NearestRoot(["go.work"])(file)
      if (work) return work
      return NearestRoot(["go.mod", "go.sum"])(file)
    },
    extensions: [".go"],
    async spawn(root) {
      let bin = which("gopls", {
        PATH: process.env["PATH"] + path.delimiter + Global.Path.bin,
      })
      if (!bin) {
        if (!which("go")) return
        if (Flag.OPENCODE_DISABLE_LSP_DOWNLOAD) return

        log.info("installing gopls")
        const proc = Process.spawn(["go", "install", "golang.org/x/tools/gopls@latest"], {
          env: { ...process.env, GOBIN: Global.Path.bin },
          stdout: "pipe",
          stderr: "pipe",
          stdin: "pipe",
        })
        const exit = await proc.exited
        if (exit !== 0) {
          log.error("Failed to install gopls")
          return
        }
        bin = path.join(Global.Path.bin, "gopls" + (process.platform === "win32" ? ".exe" : ""))
        log.info(`installed gopls`, {
          bin,
        })
      }
      return {
        process: spawn(bin!, {
          cwd: root,
        }),
      }
    },
  }
```

**File:** packages/opencode/src/lsp/server.ts (L508-560)
```typescript
  export const Pyright: Info = {
    id: "pyright",
    extensions: [".py", ".pyi"],
    root: NearestRoot(["pyproject.toml", "setup.py", "setup.cfg", "requirements.txt", "Pipfile", "pyrightconfig.json"]),
    async spawn(root) {
      let binary = which("pyright-langserver")
      const args = []
      if (!binary) {
        const js = path.join(Global.Path.bin, "node_modules", "pyright", "dist", "pyright-langserver.js")
        if (!(await Filesystem.exists(js))) {
          if (Flag.OPENCODE_DISABLE_LSP_DOWNLOAD) return
          await Process.spawn([BunProc.which(), "install", "pyright"], {
            cwd: Global.Path.bin,
            env: {
              ...process.env,
              BUN_BE_BUN: "1",
            },
          }).exited
        }
        binary = BunProc.which()
        args.push(...["run", js])
      }
      args.push("--stdio")

      const initialization: Record<string, string> = {}

      const potentialVenvPaths = [process.env["VIRTUAL_ENV"], path.join(root, ".venv"), path.join(root, "venv")].filter(
        (p): p is string => p !== undefined,
      )
      for (const venvPath of potentialVenvPaths) {
        const isWindows = process.platform === "win32"
        const potentialPythonPath = isWindows
          ? path.join(venvPath, "Scripts", "python.exe")
          : path.join(venvPath, "bin", "python")
        if (await Filesystem.exists(potentialPythonPath)) {
          initialization["pythonPath"] = potentialPythonPath
          break
        }
      }

      const proc = spawn(binary, args, {
        cwd: root,
        env: {
          ...process.env,
          BUN_BE_BUN: "1",
        },
      })
      return {
        process: proc,
        initialization,
      }
    },
  }
```

**File:** packages/opencode/src/lsp/client.ts (L42-135)
```typescript
  export async function create(input: { serverID: string; server: LSPServer.Handle; root: string }) {
    const l = log.clone().tag("serverID", input.serverID)
    l.info("starting client")

    const connection = createMessageConnection(
      new StreamMessageReader(input.server.process.stdout as any),
      new StreamMessageWriter(input.server.process.stdin as any),
    )

    const diagnostics = new Map<string, Diagnostic[]>()
    connection.onNotification("textDocument/publishDiagnostics", (params) => {
      const filePath = Filesystem.normalizePath(fileURLToPath(params.uri))
      l.info("textDocument/publishDiagnostics", {
        path: filePath,
        count: params.diagnostics.length,
      })
      const exists = diagnostics.has(filePath)
      diagnostics.set(filePath, params.diagnostics)
      if (!exists && input.serverID === "typescript") return
      Bus.publish(Event.Diagnostics, { path: filePath, serverID: input.serverID })
    })
    connection.onRequest("window/workDoneProgress/create", (params) => {
      l.info("window/workDoneProgress/create", params)
      return null
    })
    connection.onRequest("workspace/configuration", async () => {
      // Return server initialization options
      return [input.server.initialization ?? {}]
    })
    connection.onRequest("client/registerCapability", async () => {})
    connection.onRequest("client/unregisterCapability", async () => {})
    connection.onRequest("workspace/workspaceFolders", async () => [
      {
        name: "workspace",
        uri: pathToFileURL(input.root).href,
      },
    ])
    connection.listen()

    l.info("sending initialize")
    await withTimeout(
      connection.sendRequest("initialize", {
        rootUri: pathToFileURL(input.root).href,
        processId: input.server.process.pid,
        workspaceFolders: [
          {
            name: "workspace",
            uri: pathToFileURL(input.root).href,
          },
        ],
        initializationOptions: {
          ...input.server.initialization,
        },
        capabilities: {
          window: {
            workDoneProgress: true,
          },
          workspace: {
            configuration: true,
            didChangeWatchedFiles: {
              dynamicRegistration: true,
            },
          },
          textDocument: {
            synchronization: {
              didOpen: true,
              didChange: true,
            },
            publishDiagnostics: {
              versionSupport: true,
            },
          },
        },
      }),
      45_000,
    ).catch((err) => {
      l.error("initialize error", { error: err })
      throw new InitializeError(
        { serverID: input.serverID },
        {
          cause: err,
        },
      )
    })

    await connection.sendNotification("initialized", {})

    if (input.server.initialization) {
      await connection.sendNotification("workspace/didChangeConfiguration", {
        settings: input.server.initialization,
      })
    }

    const files: {
```

**File:** packages/opencode/src/lsp/client.ts (L209-237)
```typescript
      async waitForDiagnostics(input: { path: string }) {
        const normalizedPath = Filesystem.normalizePath(
          path.isAbsolute(input.path) ? input.path : path.resolve(Instance.directory, input.path),
        )
        log.info("waiting for diagnostics", { path: normalizedPath })
        let unsub: () => void
        let debounceTimer: ReturnType<typeof setTimeout> | undefined
        return await withTimeout(
          new Promise<void>((resolve) => {
            unsub = Bus.subscribe(Event.Diagnostics, (event) => {
              if (event.properties.path === normalizedPath && event.properties.serverID === result.serverID) {
                // Debounce to allow LSP to send follow-up diagnostics (e.g., semantic after syntax)
                if (debounceTimer) clearTimeout(debounceTimer)
                debounceTimer = setTimeout(() => {
                  log.info("got diagnostics", { path: normalizedPath })
                  unsub?.()
                  resolve()
                }, DIAGNOSTICS_DEBOUNCE_MS)
              }
            })
          }),
          3000,
        )
          .catch(() => {})
          .finally(() => {
            if (debounceTimer) clearTimeout(debounceTimer)
            unsub?.()
          })
      },
```
