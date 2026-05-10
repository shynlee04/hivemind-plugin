# API: Type System Deep Reference

> Version 1.14.44 | Sources: `packages/plugin/src/index.ts`, `packages/sdk/js/src/gen/types.gen.ts`, `packages/plugin/src/tui.ts`

## Part Types (Message Parts)

```typescript
type Part =
  | TextPart
  | ToolPart
  | SnapshotPart
  | PatchPart
  | AgentPart
  | RetryPart
  | CompactionPart
```

### TextPart

```typescript
type TextPart = { type: "text"; text: string }
```

### ToolPart

```typescript
type ToolPart = {
  type: "tool"
  id: string
  name: string
  state: "pending" | "running" | "completed" | "error"
  input: Record<string, any>
  output?: string
  error?: string
}
```

### AgentPart

```typescript
type AgentPart = {
  type: "agent"
  id: string
  name: string
  sessionID: string
  state: "pending" | "running" | "completed" | "error"
}
```

Agent delegation creates a child session. `sessionID` references the child.

### RetryPart

```typescript
type RetryPart = {
  type: "retry"
  attempt: number
  error: ApiError
}
```

- `attempt` is 1-indexed (first retry = 1)
- `error` contains the API error from the failed attempt
- Only present when LLM API call fails and retry is attempted

### CompactionPart

```typescript
type CompactionPart = {
  type: "compaction"
  auto: boolean
}
```

- `auto: true` → automatic compaction triggered by context window overflow
- `auto: false` → manual compaction via `session.summarize()`

### SnapshotPart / PatchPart

```typescript
type SnapshotPart = { type: "snapshot"; path: string; content: string }
type PatchPart = { type: "patch"; path: string; diff: string }
```

File state tracking: snapshot = full content, patch = unified diff.

## Event Types (SSE from GET /event)

```typescript
type Event =
  | { type: "session.created"; data: Session }
  | { type: "session.updated"; data: Session }
  | { type: "session.deleted"; data: Session }
  | { type: "message.created"; data: { info: Message; parts: Part[] } }
  | { type: "message.updated"; data: { info: Message; parts: Part[] } }
  | { type: "part.created"; data: { part: Part; messageID: string } }
  | { type: "part.updated"; data: { part: Part; messageID: string } }
  | { type: "session.shared"; data: Session }
  | { type: "session.unshared"; data: Session }
  | { type: "permission.request"; data: Permission }
  | { type: "question.request"; data: Question }
  | { type: "session.abort"; data: { sessionID: string } }
  | EventCommandExecuted     // NEW in v1.14.44
```

### EventCommandExecuted (NEW in v1.14.44)

```typescript
type EventCommandExecuted = {
  type: "command.executed"
  properties: {
    command: string
    sessionID: string
    arguments: string
  }
}
```

Emitted when a slash command is executed. Available via the `event` hook and SSE event stream.

### Gotcha: Event subscription is via `Hooks.event`

```typescript
event: async ({ event }) => {
  if (event.type === "message.created") {
    // event.data has shape { info: Message, parts: Part[] }
  }
}
```

The event hook receives ALL events. Filter by `event.type`.

## Permission Type

```typescript
type Permission = {
  id: string
  type: string        // e.g., "file_write", "bash_execute"
  pattern: string     // glob or command pattern
  sessionID: string
  messageID: string
  callback: string    // callback ID for resolution
}
```

### Permission Flow

1. Tool execution needs permission → `permission.request` event emitted
2. `permission.ask` hook fires → plugin can set `output.status` to `"allow"`, `"ask"`, or `"ask"`
3. If `"ask"` → user sees permission prompt in TUI
4. User response → sent back via callback ID

## Config.experimental.* Fields

```typescript
type Config = {
  // ... standard fields ...
  experimental?: {
    hook?: {
      file_edited?: boolean
      session_completed?: boolean
    }
    chatMaxRetries?: number
    batch_tool?: boolean
    primary_tools?: string[]
  }
}
```

- `hook.file_edited` → triggers event after file edits
- `hook.session_completed` → triggers event when session ends
- `chatMaxRetries` → max retry attempts for LLM API failures (default: 3)
- `batch_tool` → enable batch tool execution
- `primary_tools` → tools shown in primary toolbar

## SSE Client Configuration

```typescript
type SSEConfig = {
  sseMaxRetryAttempts?: number  // default: unlimited
  retryDelay?: number           // default: 3000ms
  maxRetryDelay?: number        // default: 30000ms (30s cap)
}
```

- Exponential backoff: delay doubles each retry, capped at 30s
- Default retry delay: 3s between attempts
- `sseMaxRetryAttempts` can limit total retries

## V2 SDK Params System

V2 SDK uses prefixed parameters for request construction:

```typescript
// $body_ prefix → request body fields
// $headers_ prefix → custom headers
// $path_ prefix → URL path parameters
// $query_ prefix → query string parameters
```

### Under the Hood: Body serializers

Special serialization for non-JSON types:
- `bigint` → converted to `string` (JSON.stringify doesn't handle bigint)
- `Date` → ISO string
- `Uint8Array` → base64 string

## TUI Types (`packages/plugin/src/tui.ts`)

### TuiHostSlotMap

```typescript
type TuiHostSlotMap = {
  app: {}
  home_logo: {}
  home_prompt: {}
  home_prompt_right: {}
  session_prompt: { session_id: string; visible?: boolean; disabled?: boolean; on_submit?: () => void; ref?: TuiPromptRef }
  session_prompt_right: { session_id: string }
  home_bottom: {}
  home_footer: {}
  sidebar_title: {}
  sidebar_content: {}
  sidebar_footer: {}
}
```

### TuiState

```typescript
type TuiState = {
  config: Config
  provider: Provider
  path: string
  vcs: VcsState
  session: {
    count: number
    diff: DiffState
    todo: TodoState
    messages: MessageState
    status: SessionStatus
    permission: PermissionState
    question: QuestionState
  }
  part: PartState
  lsp: LspState
  mcp: McpState
}
```

### TuiThemeCurrent

60+ RGBA color tokens including:
- `text`, `textMuted`, `textSubtle`
- `bg`, `bgMuted`, `bgSubtle`
- `border`, `borderMuted`
- `accent`, `accentMuted`, `accentSubtle`
- `diff.addLine`, `diff.removeLine`, `diff.addText`, `diff.removeText`
- `markdown.code`, `markdown.link`, `markdown.heading`
- `syntax.keyword`, `syntax.string`, `syntax.comment`, `syntax.number`

### TuiPromptRef

```typescript
type TuiPromptRef = {
  focused: boolean
  current: string
  set(value: string): void
  reset(): void
  blur(): void
  focus(): void
  submit(): void
}
```

### TuiRouteCurrent

```typescript
type TuiRouteCurrent =
  | { name: "home" }
  | { name: "session"; params: { sessionID: string; prompt?: string } }
  | { name: string; params?: Record<string, string> }
```

### TuiKeybind

```typescript
type TuiKeybind = {
  name: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  super?: boolean
  leader?: string
}
```

### TuiKeymap (NEW in v1.14.44)

```typescript
import type { Keymap, KeyEvent, Renderable } from "@opentui/keymap"

type TuiKeymap = Keymap<Renderable, KeyEvent>
```

The `TuiKeymap` type wraps `@opentui/keymap`'s `Keymap<Renderable, KeyEvent>` — allowing plugins to register custom keybinding layers with `api.keymap.registerLayer()`.

### TuiCommand

```typescript
type TuiCommand = {
  name: string
  description?: string
  slash?: { name: string; aliases?: string[] }
  handler: () => void | Promise<void>
}
```

### TuiCommandApi (DEPRECATED in v1.14.44)

```typescript
/** @deprecated Use api.keymap.registerLayer({ commands, bindings }) instead. */
type TuiCommandApi = {
  /** @deprecated Use api.keymap.registerLayer({ commands, bindings }) instead. */
  register: (commands: TuiCommand[]) => () => void
  /** @deprecated Use api.keymap.dispatchCommand(name) instead. */
  dispatch: (name: string) => void
  /** @deprecated Use api.keymap.dispatchCommand("command.palette.show") instead. */
  prompt: () => void
}
```

The `api.command` API is kept for backward compatibility with v1 TUI plugins. New plugins should use `api.keymap.registerLayer()` with `{ commands, bindings }` structure. See [TUI v2](tui-v2.md) for migration guide.

### TuiPluginApi (Full Shape — v1.14.44)

```typescript
type TuiPluginApi = {
  app: TuiApp
  command?: TuiCommandApi                         // DEPRECATED
  keys: TuiKeys
  keymap: TuiKeymap                               // NEW v2 keybinding API
  route: {
    register: (routes: TuiRouteDefinition[]) => () => void
    navigate: (name: string, params?: Record<string, unknown>) => void
    readonly current: TuiRouteCurrent
  }
  ui: {
    Dialog, DialogAlert, DialogConfirm, DialogPrompt, DialogSelect,
    Slot, Prompt, toast, dialog
  }
  readonly tuiConfig: Frozen<TuiConfigView>
  kv: TuiKV
  state: TuiState
  theme: TuiTheme
  client: OpencodeClient
  event: TuiEventBus
  renderer: CliRenderer
  slots: TuiSlots
  plugins: {
    list: () => ReadonlyArray<TuiPluginStatus>
    activate: (id: string) => Promise<boolean>
    deactivate: (id: string) => Promise<boolean>
    add: (spec: string) => Promise<boolean>
    install: (spec: string, options?: TuiPluginInstallOptions) => Promise<TuiPluginInstallResult>
  }
  lifecycle: TuiLifecycle
}
```

### TuiPlugin (v1.14.44)

```typescript
type TuiPlugin = (api: TuiPluginApi, options: PluginOptions | undefined, meta: TuiPluginMeta) => Promise<void>
```

### TuiPluginMeta

```typescript
type TuiPluginMeta = {
  state: TuiPluginState          // "first" | "updated" | "same"
  fingerprint: string            // hash of plugin code
  entry: TuiPluginEntry
}
```

### Gotcha: TuiPluginMeta fingerprinting

- `"first"` → plugin first loaded
- `"updated"` → plugin code changed (hot reload)
- `"same"` → plugin unchanged across reload
- `fingerprint` is a hash of the plugin code

## Shell Types (`packages/plugin/src/shell.ts`)

```typescript
type BunShell = {
  (strings: TemplateStringsArray, ...expressions: ShellExpression[]): BunShellPromise
  braces(pattern: string): string[]
  escape(input: string): string
  env(newEnv?: Record<string, string | undefined>): BunShell
  cwd(newCwd?: string): BunShell
  nothrow(): BunShell
  throws(shouldThrow: boolean): BunShell
}

type BunShellOutput = {
  readonly stdout: Buffer
  readonly stderr: Buffer
  readonly exitCode: number
  text(encoding?: BufferEncoding): string
  json(): any
  bytes(): Uint8Array
}

type BunShellError = Error & BunShellOutput
```
