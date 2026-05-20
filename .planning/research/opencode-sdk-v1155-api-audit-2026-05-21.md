# @opencode-ai/plugin SDK v1.15.5 API Surface Audit

> **Date:** 2026-05-21
> **Scope:** Comprehensive comparison of the installed `@opencode-ai/plugin@1.15.5` + `@opencode-ai/sdk@1.15.5` against Hivemind implementation (`src/plugin.ts`, `src/tools/`, `src/hooks/`, `src/coordination/`)
> **Evidence:** L1 — installed node_modules type definitions; L2 — DeepWiki source; L3 — Context7 official docs
> **Sources:** `node_modules/@opencode-ai/plugin/dist/index.d.ts`, `node_modules/@opencode-ai/plugin/dist/tool.d.ts`, `node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts`, `node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.d.ts`, DeepWiki `anomalyco/opencode`, Context7 `/websites/opencode_ai_plugins`

---

## 1. Plugin Factory Signature

### SDK Contract (v1.15.5)

```typescript
// @opencode-ai/plugin/dist/index.d.ts

export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>    // OpencodeClient instance
  project: Project
  directory: string                                    // Project root directory
  worktree: string                                     // Worktree root
  experimental_workspace: {
    register(type: string, adapter: WorkspaceAdapter): void
  }
  serverUrl: URL
  $: BunShell                                          // Bun shell instance
}

export type PluginOptions = Record<string, unknown>

export type Plugin = (
  input: PluginInput,
  options?: PluginOptions,
) => Promise<Hooks>

export type PluginModule = {
  id?: string
  server: Plugin       // The plugin factory
  tui?: never
}
```

### Hivemind Implementation

```typescript
// src/plugin.ts:219
export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  // ...
  return { /* Hooks shape */ }
}

// src/plugin.ts:493
export default { server: HarnessControlPlane }
```

### Verdict: ✅ MATCH

| Aspect | SDK Expects | Hivemind | Status |
|--------|-------------|----------|--------|
| `Plugin` type | `(input: PluginInput) => Promise<Hooks>` | `async ({ client, directory }) => {...}` — destructures PluginInput | ✅ |
| `PluginModule` export | `{ server: Plugin }` | `export default { server: HarnessControlPlane }` | ✅ |
| Type annotation | `Plugin` type applied | `export const HarnessControlPlane: Plugin = ...` | ✅ |
| `options` param | Optional second arg | Not used (correct — optional) | ✅ |
| Return value | `Promise<Hooks>` | Returns `{ config, event, tool, ...hooks }` | ✅ |

---

## 2. Tool Registration (`tool()` helper + ToolDefinition)

### SDK Contract (v1.15.5)

```typescript
// @opencode-ai/plugin/dist/tool.d.ts

export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  directory: string           // Current project directory — prefer over process.cwd()
  worktree: string            // Stable relative path root
  abort: AbortSignal          // Cancellation signal
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void
  ask(input: AskInput): Promise<void>
}

export type ToolResult = string | {
  title?: string
  output: string
  metadata?: { [key: string]: any }
  attachments?: ToolAttachment[]
}

export declare function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(
    args: z.infer<z.ZodObject<Args>>,
    context: ToolContext
  ): Promise<ToolResult>
}): {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>
}

export declare namespace tool {
  var schema: typeof z
}

export type ToolDefinition = ReturnType<typeof tool>
```

And in `Hooks`:
```typescript
tool?: {
  [key: string]: ToolDefinition
}
```

### Hivemind Implementation

```typescript
// src/tools/delegation/delegate-task.ts
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

type ToolContext = {
  sessionID: string
  directory?: string
  worktree?: string
}

export function createDelegateTaskTool(...): ReturnType<typeof tool> {
  const s = tool.schema
  return tool({
    description: "...",
    args: {
      agent: s.string().describe("Agent name..."),
      prompt: s.string().describe("Task prompt..."),
      context: s.string().optional().describe("Optional context packet..."),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      // implementation
    },
  })
}

// src/plugin.ts:397-425
tool: {
  "delegate-task": createDelegateTaskTool(delegationManager, hivemindConfig),
  "delegation-status": createDelegationStatusTool(delegationManager, deps),
  // ... 21 more tools
}
```

### Verdict: ✅ MATCH

| Aspect | SDK Expects | Hivemind | Status |
|--------|-------------|----------|--------|
| `tool()` helper | From `@opencode-ai/plugin/tool` | `import { tool } from "@opencode-ai/plugin/tool"` | ✅ |
| `tool.schema` | Exposes Zod via `tool.schema` | `const s = tool.schema` then `s.string().describe(...)` | ✅ |
| Tool registration | Via `Hooks.tool` record | `tool: { "delegate-task": ..., ... }` | ✅ |
| Tool return type | `Promise<ToolResult>` | `Promise<string>` (string is valid `ToolResult`) | ✅ |
| Tool names | String keys | All 23 tools use string keys | ✅ |
| `ToolContext.task` | **NOT in SDK** — no `task` field | Cleaned — current code uses `{ sessionID, directory?, worktree? }` only | ✅ |

---

## 3. Hook Registration

### SDK Contract — Complete `Hooks` Interface (v1.15.5)

```typescript
// @opencode-ai/plugin/dist/index.d.ts (verified from node_modules)

export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: { [key: string]: ToolDefinition }
  auth?: AuthHook
  provider?: ProviderHook

  "chat.message"?: (input: {
    sessionID: string
    agent?: string
    model?: { providerID: string; modelID: string }
    messageID?: string
    variant?: string
  }, output: {
    message: UserMessage
    parts: Part[]
  }) => Promise<void>

  "chat.params"?: (input: { sessionID: string; agent: string; model: Model;
    provider: ProviderContext; message: UserMessage }, output: {
    temperature: number; topP: number; topK: number;
    maxOutputTokens: number | undefined; options: Record<string, any>
  }) => Promise<void>

  "chat.headers"?: (input: { sessionID: string; agent: string; model: Model;
    provider: ProviderContext; message: UserMessage }, output: {
    headers: Record<string, string>
  }) => Promise<void>

  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>

  "command.execute.before"?: (input: { command: string; sessionID: string; arguments: string },
    output: { parts: Part[] }) => Promise<void>

  "tool.execute.before"?: (input: { tool: string; sessionID: string; callID: string },
    output: { args: any }) => Promise<void>

  "tool.execute.after"?: (input: { tool: string; sessionID: string; callID: string; args: any },
    output: { title: string; output: string; metadata: any }) => Promise<void>

  "shell.env"?: (input: { cwd: string; sessionID?: string; callID?: string },
    output: { env: Record<string, string> }) => Promise<void>

  "experimental.chat.messages.transform"?: (input: {}, output: {
    messages: { info: Message; parts: Part[] }[]
  }) => Promise<void>

  "experimental.chat.system.transform"?: (input: { sessionID?: string; model: Model },
    output: { system: string[] }) => Promise<void>

  "experimental.session.compacting"?: (input: { sessionID: string }, output: {
    context: string[]; prompt?: string
  }) => Promise<void>

  "experimental.compaction.autocontinue"?: (input: {
    sessionID: string; agent: string; model: Model; provider: ProviderContext;
    message: UserMessage; overflow: boolean
  }, output: { enabled: boolean }) => Promise<void>

  "experimental.text.complete"?: (input: { sessionID: string; messageID: string; partID: string },
    output: { text: string }) => Promise<void>

  "tool.definition"?: (input: { toolID: string }, output: {
    description: string; parameters: any
  }) => Promise<void>
}
```

### Hivemind Hook Return Shape

```typescript
// src/plugin.ts:353-452 (what HarnessControlPlane returns)
return {
  config: async () => {},
  event: ...,                              // from createCoreHooks()
  "system.transform": ...,                 // NOT in SDK Hooks (legacy)
  "experimental.chat.system.transform": ..., // ✅ matches
  "messages.transform": ...,               // NOT in SDK Hooks (legacy)
  "shell.env": ...,                        // ✅ matches
  "chat.message": ...,                     // ✅ registered
  "tool.execute.before": ...,              // ✅ registered
  "tool.execute.after": ...,               // ✅ registered
  "experimental.session.compacting": ...,  // ✅ matches (from session-hooks.ts)
  tool: { ... },                           // ✅ matches
}
```

### Verdict Per Hook

| Hook Name | SDK Signature | Hivemind Signature | Status |
|-----------|---------------|-------------------|--------|
| `event` | `(input: { event: Event }) => Promise<void>` | `(input: EventInput) ⇒ void` where `EventInput = { event?: unknown }` | ✅ MATCH — uses `{ event }` destructure, `event` is typed as `unknown` but SDK `Event` is a discriminated union |
| `config` | `(input: Config) => Promise<void>` | `config: async () => {}` — **no-op** | ⚠️ NO-OP — not actively harmful but mis-typed (ignores `Config` input) |
| `tool` | `{ [key: string]: ToolDefinition }` | `tool: { "delegate-task": ..., "delegation-status": ..., ... }` | ✅ MATCH — 23 tools registered |
| `chat.message` | `(input: { sessionID, agent?, model?, messageID?, variant? }, output: { message, parts }) ⇒ void` | `async (input: unknown, output: unknown): Promise<void>` | ⚠️ LOOSE TYPES — uses `unknown` instead of typed input/output. Functionally correct but loses compile-time type safety |
| `tool.execute.before` | `(input: { tool, sessionID, callID }, output: { args }) ⇒ void` | `(input: unknown, output: unknown) ⇒ Promise<void>` | ⚠️ LOOSE TYPES — functionally correct, typed `(unknown, unknown)` |
| `tool.execute.after` | `(input: { tool, sessionID, callID, args }, output: { title, output, metadata }) ⇒ void` | `async (input: { tool, sessionID?, callID?, args? }, _output?: { metadata?, ... }) ⇒ void` | ⚠️ PARTIAL TYPING — casts in function signature but args are optional/maybe vs SDK's `any` |
| `experimental.session.compacting` | `(input: { sessionID }, output: { context: string[], prompt? }) ⇒ void` | `async (input: CompactingInput, output: CompactingOutput) ⇒ void` where `CompactingInput = { sessionID?: unknown }` | ✅ MATCH — uses typed wrapper, correctly manipulates `output.context` |
| `shell.env` | `(input: { cwd, sessionID?, callID? }, output: { env }) ⇒ void` | `async (_input, output) ⇒ { output.env = { CI: "true", ... } }` | ✅ MATCH — ignores input (fine), sets env vars |
| `experimental.chat.system.transform` | `(input: { sessionID?, model }, output: { system: string[] }) ⇒ void` | `async (input: SystemInput, output: SystemOutput) ⇒ void` | ✅ MATCH |
| `system.transform` | **NOT in SDK Hooks** | Registered and dispatched | ⚠️ EXTRA — silently ignored by runtime (SDK doesn't dispatch non-standard hook names) |
| `messages.transform` | **NOT in SDK Hooks** | Registered (functionally no-op) | ⚠️ EXTRA — silently ignored |

---

## 4. Session API (OpencodeClient)

### SDK Contract (v1.15.5)

```typescript
// node_modules/@opencode-ai/sdk/dist/gen/sdk.gen.d.ts
export declare class OpencodeClient extends _HeyApiClient {
  session: Session     // Namespace with REST methods
  tui: Tui             // TUI interaction methods
  app: App             // Application-level operations
  global: Global       // Global/system operations
  project: Project     // Project operations
  file: File           // File operations
  config: Config       // Config operations
  // ... (20+ namespaces)
}

// node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts
export type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string
  title: string
  version: string
  time: { created: number; updated: number; compacting?: number }
  summary?: { additions: number; deletions: number; files: number; diffs?: FileDiff[] }
  share?: { url: string }
  revert?: { messageID: string; partID?: string; snapshot?: string; diff?: string }
}

// Event types reference the Session type:
type EventSessionCreated = { type: "session.created"; properties: { info: Session } }
type EventSessionUpdated = { type: "session.updated"; properties: { info: Session } }
type EventSessionDeleted = { type: "session.deleted"; properties: { info: Session } }
type EventSessionError = { type: "session.error"; properties: { sessionID?: string; error?: ... } }
type EventSessionIdle = { type: "session.idle"; properties: { sessionID: string } }
```

### Key Session API Methods (from generated SDK client)

The `OpencodeClient`'s `session` namespace exposes REST-style methods:
- `client.session.create(request)` — creates a new session (returns `Session`)
- `client.session.get(request)` — gets session by ID
- `client.session.prompt(request)` — sends prompt, waits for response
- `client.session.promptAsync(request)` — sends prompt, returns immediately
- `client.session.messages(request)` — gets session messages
- `client.session.status()` — gets all session statuses
- `client.session.abort(request)` — aborts a session

The `tui` namespace:
- `client.tui.appendPrompt(request)` — appends text to active TUI prompt

The `app` namespace:
- `client.app.log(request)` — writes to app log

### Hivemind Implementation

```typescript
// src/shared/session-api.ts
export type OpenCodeClient = ReturnType<typeof createOpencodeClient>

// Uses:
client.session.create(request)      // session-api.ts:53
client.session.get(request)         // session-api.ts:58
client.session.prompt(request)      // session-api.ts:157
client.session.promptAsync(request)  // session-api.ts:194
client.session.messages(request)    // session-api.ts:89
client.session.status()             // session-api.ts:66
client.session.abort(request)       // session-api.ts:75
client.tui.appendPrompt(request)    // session-api.ts:205
client.tui.showToast(request)       // session-api.ts:218
client.app.log(request)             // plugin.ts:223-228
```

### Verdict: ✅ MATCH

| SDK Method | Hivemind Usage | Status |
|------------|---------------|--------|
| `session.create()` | Used in `sdk-child-session-starter.ts:23` | ✅ |
| `session.get()` | Used in `session-api.ts:56` | ✅ |
| `session.prompt()` | Used as fallback sync prompt | ✅ |
| `session.promptAsync()` | Used for background delegation dispatch | ✅ |
| `session.messages()` | Used for completion detection, message counts | ✅ |
| `session.status()` | Used by CompletionDetector | ✅ |
| `session.abort()` | Used by delegation-status tool | ✅ |
| `tui.appendPrompt()` | Used for parent notification replay | ✅ |
| `tui.showToast()` | Used for delegation toast notifications | ✅ |
| `app.log()` | Used for startup diagnostics, warnings | ✅ |

---

## 5. `context.task` — Root Cause of CP-DT-01 Issue

### Finding: `context.task` DOES NOT EXIST in SDK

The SDK `ToolContext` type in `@opencode-ai/plugin@1.15.5` (`/dist/tool.d.ts`) defines exactly **8 properties**:

```
sessionID: string         ✅ exists
messageID: string         ✅ exists
agent: string             ✅ exists
directory: string         ✅ exists
worktree: string          ✅ exists
abort: AbortSignal        ✅ exists
metadata(): void          ✅ exists
ask(): Promise<void>      ✅ exists
```

**`task` is NOT present.** This was verified at:
- Installed npm types `@opencode-ai/plugin@1.15.5` (`tool.d.ts`)
- Installed npm types `@opencode-ai/plugin@1.15.4` (previous version — also absent)
- Context7 official docs (`opencode.ai/docs/plugins`)
- DeepWiki `anomalyco/opencode` source code

### Root Cause Chain

1. **CP-DT-01 spec assumed** a native Task invocation seam from custom tools (`sdk.task()` or `context.task`)
2. **Hivemind code created a LOCAL extended `ToolContext` type** adding `task?: NativeTask` (delegate-task.ts historical versions)
3. **Unit tests validated the extended/seam** by injecting `options.nativeTask` — these were L3/L4 test seams, not L1 runtime proof
4. **Review gates missed runtime verification** — passed on code review + test evidence without OpenCode smoke test
5. **Current code has been cleaned** — `delegate-task.ts` no longer references `context.task`; it uses `coordinator.dispatch()` which calls `createSdkChildSessionStarter` → `client.session.create()` + `client.session.promptAsync()`

### Current Status: ❌ CONFIRMED ABSENT (documented in planning artifacts)

The codebase planning docs correctly mark this as **RE-OPENED / RUNTIME BLOCKED** since 2026-05-18. Source code has been partially remediated (delegate-task.ts no longer depends on `context.task`), but the runtime dispatch path still needs L1 proof.

---

## 6. Other SDK API Surfaces Not Covered

### Permissions

The SDK exposes:
```typescript
"permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
```

Hivemind uses this indirectly through `tool()`'s `context.ask()` method. No custom `permission.ask` hook is registered. ✅ Not needed.

### Agent Discovery

The SDK's `client.session.create()` accepts an `agent` parameter. OpenCode discovers agents from `.opencode/agents/` YAML frontmatter definitions. Hivemind's `AgentResolver` in `src/coordination/delegation/agent-resolver.ts` resolves agent names at runtime. Not audited in detail.

### Command System

Hivemind's `execute-slash-command` tool calls `client.session.prompt({ body: { text: `/command args` } })` — it prepends a `/` to dispatch via TUI prompt pipeline rather than using an explicit command API. The SDK's `command.execute.before` hook exists but Hivemind doesn't register one. Functionally correct.

### SDK v1 vs v2

Both `@opencode-ai/sdk` and `@opencode-ai/plugin` v1.15.5 export from `./v2` entrypoints:
- `@opencode-ai/sdk/v2` — enhanced `createOpencodeClient` with `experimental_workspaceID`
- `@opencode-ai/sdk/v2/client` — re-exports `OpencodeClient` same class
- `@opencode-ai/plugin` — imports `ProviderV2`, `ModelV2` from `@opencode-ai/sdk/v2`
- The v2 client is the **default** — both `@opencode-ai/sdk` and `@opencode-ai/sdk/v2` re-export the same `OpencodeClient` class

Hivemind imports from `@opencode-ai/sdk` (non-v2 path) and uses the returned `OpencodeClient`. This is correct — both paths return the same class.

---

## 7. Summary of All Findings

### ✅ Confirmed MATCHES

| # | Surface | Details |
|---|---------|---------|
| 1 | Plugin factory signature | `Plugin = (input: PluginInput) => Promise<Hooks>` — correctly implemented |
| 2 | PluginModule export | `export default { server: HarnessControlPlane }` — matches |
| 3 | `tool()` helper usage | Uses `tool()` from `@opencode-ai/plugin/tool` with `tool.schema` Zod |
| 4 | Tool registration shape | Returns `tool: { [key: string]: ToolDefinition }` with 23 tools |
| 5 | Tool return type | Returns `string` which is valid `ToolResult` |
| 6 | Tool names | All 23 tools use valid string keys |
| 7 | No `context.task` dependency | Current code is clean — uses `coordinator.dispatch()` and SDK session APIs |
| 8 | `event` hook | Receives `{ event }` shape, routes to lifecycle manager |
| 9 | `experimental.session.compacting` | Correctly manipulates `output.context` array |
| 10 | `experimental.chat.system.transform` | Correctly appends to `output.system` array |
| 11 | `shell.env` | Correctly sets env vars in `output.env` |
| 12 | `chat.message` | Registered and handles input (though loose-typed) |
| 13 | SDK session API usage | All 9 used SDK methods (create, get, prompt, promptAsync, messages, status, abort, appendPrompt, showToast) match available SDK surface |

### ⚠️ Minor Mismatches

| # | Surface | Issue | Impact |
|---|---------|-------|--------|
| 1 | `chat.message` hook | Uses `(input: unknown, output: unknown)` instead of typed SDK shape | Low — functionally correct, loses type safety |
| 2 | `tool.execute.before` hook | Uses `(input: unknown, output: unknown)` instead of typed SDK shape | Low — functionally correct, loses type safety |
| 3 | `tool.execute.after` hook | Uses inline casting with optional properties | Low — functionally correct |
| 4 | `config` hook | No-op `async () => {}` ignoring Config input | Low — not harmful |
| 5 | `system.transform` hook | Not in SDK Hooks interface — legacy extra | None — silently ignored by runtime |
| 6 | `messages.transform` hook | Not in SDK Hooks interface — legacy no-op | None — silently ignored by runtime |
| 7 | No `command.execute.before` | SDK exposes it but Hivemind doesn't register one | Low — Hivemind uses TUI prompt path instead |

### ❌ Confirmed Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | `context.task` is NOT in SDK `ToolContext` (v1.15.4 or v1.15.5) | **CRITICAL** (historical — CP-DT-01 block) | DOCUMENTED — planning artifacts updated. Source code cleaned. |
| 2 | No type-level constraint on hook names | LOW | Hivemind returns extra non-SDK hooks (`system.transform`, `messages.transform`). Runtime ignores them. |

---

## 8. Recommendations

1. **Hook type safety improvement**: Replace `(input: unknown, output: unknown)` with properly typed SDK shapes in `plugin.ts`:
   - `chat.message`: use `Hooks["chat.message"]` type
   - `tool.execute.before`: use `Hooks["tool.execute.before"]` type
   - `tool.execute.after`: use `Hooks["tool.execute.after"]` type

2. **Remove legacy extra hooks**: `system.transform` and `messages.transform` are not dispatched by SDK. Remove them from return value to reduce noise.

3. **Maintain no-`context.task` contract**: SDK `ToolContext` will NOT gain a `task` field (not in roadmap, not in upstream). The SDK session API is the correct dispatch path.

4. **Verify permissions/agent discovery surfaces**: Surface not deeply audited in this pass. Recommend dedicated research for `permission.ask` hook, agent resolution from `.opencode/agents/`, and command dispatch path.
