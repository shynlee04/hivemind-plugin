# API: Plugin (`@opencode-ai/plugin`) — Deep Reference

> Version 1.14.44 | Source: `packages/plugin/src/`

## Plugin Function Contract

```typescript
type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>
```

- **No `definePlugin()` wrapper exists.** Plain async function.
- `options` comes from the plugin config tuple: `[string, PluginOptions]`
- Plugin is called once at load time. Return value is the live hook map.
- If plugin throws during init, the entire plugin runtime fails.

### Gotcha: Plugin is NOT a class

```typescript
const MyPlugin: Plugin = async (ctx) => { return {} }
export default MyPlugin
```

Do NOT export a class. Do NOT use `definePlugin`. Do NOT use a factory.

## PluginInput (Full Shape)

```typescript
type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  experimental_workspace: {
    register(type: string, adaptor: WorkspaceAdapter): void
  }
  serverUrl: URL
  $: BunShell
}
```

### Under the Hood: `client` injection

- `client` is a fully initialized V1 `OpencodeClient` with interceptors already applied
- It targets the same server that loaded this plugin
- Plugin can call any SDK method (session CRUD, messages, share, etc.)
- The client already has `x-opencode-directory` header configured

### Under the Hood: `experimental_workspace.register()`

- Must be called during plugin init (inside the Plugin function body)
- Called AFTER plugin returns hooks, the adaptor is stored for workspace operations
- `type` string is arbitrary but should be unique (e.g., `"my-cloud-workspace"`)
- The adaptor's `target()` method is called to resolve workspace directory/URL

## Hooks Interface — Complete Hook Catalog

```typescript
interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: { [key: string]: ToolDefinition }
  auth?: AuthHook
  provider?: ProviderHook
  "chat.message"?: (input: ChatMessageInput, output: ChatMessageOutput) => Promise<void>
  "chat.params"?: (input: ChatParamsInput, output: ChatParamsOutput) => Promise<void>
  "chat.headers"?: (input: ChatHeadersInput, output: ChatHeadersOutput) => Promise<void>
  "permission.ask"?: (input: Permission, output: { status: "ask" | "ask" | "allow" }) => Promise<void>
  "command.execute.before"?: (input: CommandBeforeInput, output: CommandBeforeOutput) => Promise<void>
  "tool.execute.before"?: (input: ToolBeforeInput, output: ToolBeforeOutput) => Promise<void>
  "tool.execute.after"?: (input: ToolAfterInput, output: ToolAfterOutput) => Promise<void>
  "tool.definition"?: (input: { toolID: string }, output: { description: string; parameters: any }) => Promise<void>
  "shell.env"?: (input: { cwd: string; sessionID?: string; callID?: string }, output: { env: Record<string, string> }) => Promise<void>
  "experimental.chat.messages.transform"?: (input: {}, output: { messages: { info: Message; parts: Part[] }[] }) => Promise<void>
  "experimental.chat.system.transform"?: (input: { sessionID?: string; model: Model }, output: { system: string[] }) => Promise<void>
  "experimental.session.compacting"?: (input: { sessionID: string }, output: { context: string[]; prompt?: string }) => Promise<void>
  "experimental.compaction.autocontinue"?: (input: AutocontinueInput, output: { enabled: boolean }) => Promise<void>
  "experimental.text.complete"?: (input: { sessionID: string; messageID: string; partID: string }, output: { text: string }) => Promise<void>
}
```

### Gotcha: Dot-notation hook names are REQUIRED

```typescript
return {
  "tool.execute.before": async (input, output) => {},
}
```

These are string keys on the Hooks interface. NOT camelCase, NOT PascalCase.

### Gotcha: Hook output mutation pattern

All hooks with `output` parameter use **mutable output objects**. Mutate properties in place — do NOT return a new object:

```typescript
"tool.execute.after": async (input, output) => {
  output.title = `Modified: ${output.title}`
  output.metadata = { ...output.metadata, custom: true }
}
```

## AuthHook — OAuth and API Key Flows

```typescript
type AuthHook = {
  provider: string
  loader?: (auth: () => Promise<Auth>, provider: Provider) => Promise<Record<string, any>>
  methods: AuthMethod[]
}

// AuthOAuthResult replaces deprecated AuthOuathResult
type AuthOAuthResult = {
  type: "success"
  refresh: string
  access: string
  expires: number
} | {
  type: "success"
  key: string
}

/** @deprecated Use AuthOAuthResult instead. */
type AuthOuathResult = AuthOAuthResult
```

### OAuth flow (`method: "auto"`)

1. User triggers auth → `authorize()` called
2. Returns `{ url, instructions, method: "auto", callback() }`
3. OpenCode opens URL in browser, waits for `callback()` to resolve
4. `callback()` returns `{ type: "success", refresh, access, expires }` or `{ key }`

### OAuth flow (`method: "code"`)

1. Same as auto but user must paste a code
2. `callback(code: string)` receives the user-entered code
3. Exchange code for tokens inside callback

### API key flow (`type: "api"`)

1. `prompts` array collects inputs from user
2. `authorize(inputs)` validates the key
3. Returns `{ type: "success", key }` or `{ type: "failed" }`

### Under the Hood: `loader()`

- Called before every provider API request that needs auth
- `auth()` thunk re-reads stored credentials each time
- Return value is merged into provider request headers/config
- If loader throws, the request fails with auth error

## ProviderHook — Model Injection

```typescript
// ProviderHookContext is a named exported type (not inline)
type ProviderHookContext = {
  auth?: Auth
}

type ProviderHook = {
  id: string
  models?: (provider: ProviderV2, ctx: ProviderHookContext) => Promise<Record<string, ModelV2>>
}
```

- `id` must match the provider ID in config (e.g., `"openai"`, `"anthropic"`)
- `models()` is called during provider initialization
- Return a map of model ID → ModelV2 objects
- `ctx.auth` contains the resolved auth for this provider (may be undefined)
- **Note:** `ProviderHookContext` is now a named exported type (extracted from inline at v1.14.44)

### Under the Hood: Model injection timing

- `models()` is called AFTER auth is resolved
- Returned models are merged with built-in models
- Custom model IDs appear in the model selector
- If `models()` throws, the provider still works with built-in models

## WorkspaceAdapter Protocol

```typescript
type WorkspaceAdapter = {
  name: string
  description: string
  configure(config: WorkspaceInfo): WorkspaceInfo | Promise<WorkspaceInfo>
  create(config: WorkspaceInfo, env: Record<string, string | undefined>, from?: WorkspaceInfo): Promise<void>
  remove(config: WorkspaceInfo): Promise<void>
  target(config: WorkspaceInfo): WorkspaceTarget | Promise<WorkspaceTarget>
}
```

### Lifecycle

1. **`configure()`** — Called when workspace is loaded. Can modify WorkspaceInfo. Return modified or same object.
2. **`create()`** — Called to create a new workspace. `from` parameter is optional parent workspace. `env` contains environment variables.
3. **`remove()`** — Called to delete a workspace. Must clean up all resources.
4. **`target()`** — Resolves workspace to local directory or remote URL. Returns `{ type: "local", directory }` or `{ type: "remote", url, headers? }`.

> **Note:** Fixed spelling from v1.14.28's `WorkspaceAdaptor` (typo) to `WorkspaceAdapter`. All code should use the corrected spelling.

### Gotcha: `target()` return type determines routing

- `{ type: "local" }` → OpenCode uses the local directory directly
- `{ type: "remote" }` → OpenCode connects to remote server via HTTP
- Remote targets support `headers` for authentication

## tool() Helper

```typescript
// ToolDefinition = ReturnType<typeof tool>  (derived type, not explicit inline type)
function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>
}): ToolDefinition
```

> **Note:** In v1.14.44, `ToolDefinition` is derived via `ReturnType<typeof tool>`, not an explicit inline type. This means the actual type shape depends on the `tool()` function's return structure and may differ from earlier inline definitions.

### `tool.schema = z` — Full Zod Re-export

```typescript
tool.schema.string()
tool.schema.number()
tool.schema.boolean()
tool.schema.array(tool.schema.string())
tool.schema.object({})
tool.schema.enum(["a", "b"])
tool.schema.union([tool.schema.string(), tool.schema.number()])
```

This is the full Zod library. Every Zod method is available.

### Gotcha: `tool.schema` vs importing zod

Do NOT `import { z } from "zod"`. Use `tool.schema` instead. This ensures version compatibility with the plugin runtime's Zod instance.

## ToolContext

```typescript
type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  directory: string
  worktree: string
  abort: AbortSignal
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void
  ask(input: AskInput): Effect.Effect<void>
}
```

### Gotcha: `ask()` returns Effect.Effect, NOT Promise

```typescript
import { Effect } from "effect"

async execute(args, context) {
  await Effect.runPromise(context.ask({
    permission: "file:write",
    patterns: [args.filePath],
    always: [],
    metadata: { reason: "Writing output file" },
  }))
}
```

If you call `await context.ask(...)` without `Effect.runPromise`, TypeScript will error because `Effect.Effect<void>` is not thenable.

### Under the Hood: `metadata()` calls

- `metadata({ title })` updates the tool's display title in the TUI
- `metadata({ metadata })` attaches arbitrary data to the tool result
- Can be called multiple times during execution
- Each call overwrites previous values

### Under the Hood: `abort` signal

- Signal is triggered when user cancels the session or message
- Long-running tools MUST check `context.abort.aborted` periodically
- Signal is also triggered on session timeout

## PluginModule

```typescript
type PluginModule = {
  id?: string
  server: Plugin
  tui?: never
}
```

- `server` is required — the server-side plugin function
- `tui` is typed as `never` — TUI plugins use separate registration
- `id` is optional — used for logging and debugging

## Config

```typescript
type Config = Omit<SDKConfig, "plugin"> & {
  plugin?: Array<string | [string, PluginOptions]>
}
```

- Plugin entries: string (npm package name) or tuple `[name, options]`
- Options are passed as second argument to the Plugin function
- `Omit<SDKConfig, "plugin">` removes the base plugin field to prevent circular config

## BunShell ($)

```typescript
const result = await $`echo hello`
result.text()     // "hello\n"
result.exitCode   // 0
result.stdout     // Buffer

const branch = await $`git branch --show-current`.quiet().text()
const json = await $`cat package.json`.json()
```

- Tagged template literal syntax
- Chainable: `.quiet()`, `.text()`, `.json()`, `.lines()`, `.nothrow()`, `.cwd()`, `.env()`
- `BunShellOutput` has `.stdout`, `.stderr`, `.exitCode`, `.text()`, `.json()`, `.bytes()`
