# Table of Contents — OpenCode SDK + Plugin Stack

> Version 1.14.44 | Source: [anomalyco/opencode](https://github.com/anomalyco/opencode)

## Package Structure

```
anomalyco/opencode/
├── packages/
│   ├── plugin/              @opencode-ai/plugin
│   │   ├── src/
│   │   │   ├── index.ts     ← All types: Plugin, Hooks, AuthHook, ProviderHook, PluginInput
│   │   │   ├── tool.ts      ← tool() helper, ToolContext, ToolResult, ToolDefinition
│   │   │   ├── shell.ts     ← BunShell, BunShellPromise, BunShellOutput types
│   │   │   ├── tui.ts       ← TUI plugin API: TuiPluginApi, TuiApp, TuiCommand, etc.
│   │   │   ├── example.ts   ← Minimal example plugin
│   │   │   └── example-workspace.ts ← Workspace adaptor example
│   │   └── package.json     ← v1.14.44, exports: ".", "./tool", "./tui"
│   └── sdk/
│       └── js/              @opencode-ai/sdk
│           ├── src/
│           │   ├── index.ts       ← createOpencode() (client+server factory)
│           │   ├── client.ts      ← createOpencodeClient()
│           │   ├── server.ts      ← createOpencodeServer(), createOpencodeTui()
│           │   ├── process.ts     ← Process management utilities
│           │   ├── gen/           ← Auto-generated SDK (v1)
│           │   │   ├── sdk.gen.ts       ← OpencodeClient class (34.7KB)
│           │   │   ├── types.gen.ts     ← All generated types (68.3KB)
│           │   │   ├── client.gen.ts    ← createClient() factory
│           │   │   ├── client/          ← Client internals
│           │   │   └── core/            ← Core HTTP utilities
│           │   └── v2/            ← SDK v2 (recommended)
│           │       ├── index.ts
│           │       ├── client.ts
│           │       ├── server.ts
│           │       ├── data.ts
│           │       └── gen/           ← Generated v2 SDK
│           └── package.json     ← v1.14.44, exports: ".", "./client", "./server", "./v2", "./v2/client"
```

## Expert Knowledge (BEYOND-DOCS)

These files contain knowledge extracted from source code that is NOT in official documentation.

| File | Topics | Key Insights |
|------|--------|--------------|
| [Expert: Hook Composition](references/expert/hook-composition.md) | Multi-plugin ordering, output mutation, event types (32-40+), compaction flow, permission override, env injection | No priority system; last-write-wins; event hook receives ALL events; compaction has overflow flag |
| [Expert: Tool Internals](references/expert/tool-internals.md) | tool() zero-validation, Zod→JSON Schema failures, ToolResult shape, context.ask() returns Effect, ToolState machine, abort cooperative | tool() is identity function; z.transform/refine/lazy silently break; ask() is NOT awaitable |
| [Expert: Client-Server](references/expert/client-server.md) | SSE event bus, session lifecycle, prompt_async, part mutations, v1 vs v2 differences, HTTP endpoints | 3 session states (no completed); SSE for events; v2 adds workspace isolation |

## Cross-Cutting References (NEW in v1.14.44 rebuild)

| File | Topics | Purpose |
|------|--------|---------|
| [Pipeline Patterns](references/pipeline-patterns.md) | Skill composition in dev workflows, pipeline diagrams, loading order | Maps how stack-opencode composes with sibling skills |
| [Stack Chains](references/stack-chains.md) | Dependency graph between stack-* skills, version compatibility | Defines loading order and dependency rules |
| [Department Bundles](references/department-bundles.md) | Role-based bundles for Plugin Dev, Infra, TUI, Gate Audit, IDE Integration | Role-optimized loading to minimize context cost |

## New API References (v1.14.44)

| File | Topics | Purpose |
|------|--------|---------|
| [API: ACP](references/api/acp.md) | Agent Client Protocol, JSON-RPC over stdio, session/fork/prompt methods, IDE integration | Building IDE plugins (Zed, VS Code), ACP agent implementation |
| [API: TUI v2](references/api/tui-v2.md) | Keymap API, api.keymap.registerLayer, keybinding layers, migration from api.command | TUI plugin development, custom keybindings |

## API Reference Jump Links

### Plugin API (`@opencode-ai/plugin`)

| Symbol | Type | File | Section |
|--------|------|------|---------|
| `Plugin` | Type | `index.ts` | [Plugin Type](references/api/plugin.md#plugin-type) |
| `PluginInput` | Type | `index.ts` | [PluginInput](references/api/plugin.md#plugininput) |
| `PluginOptions` | Type | `index.ts` | [PluginOptions](references/api/plugin.md#pluginoptions) |
| `PluginModule` | Type | `index.ts` | [PluginModule](references/api/plugin.md#pluginmodule) |
| `Config` | Type | `index.ts` | [Config](references/api/plugin.md#config) |
| `Hooks` | Interface | `index.ts` | [Hooks Interface](references/api/plugin.md#hooks-interface) |
| `AuthHook` | Type | `index.ts` | [AuthHook](references/api/plugin.md#authhook) |
| `AuthOAuthResult` | Type | `index.ts` | [AuthOAuthResult](references/api/plugin.md#authoauthresult) |
| `AuthOAuthResult` | Type | `index.ts` | [AuthOAuthResult](references/api/plugin.md#authoauthresult) |
| `ProviderHook` | Type | `index.ts` | [ProviderHook](references/api/plugin.md#providerhook) |
| `ProviderHookContext` | Type | `index.ts` | [ProviderHookContext](references/api/plugin.md#providerhookcontext) |
| `ProviderContext` | Type | `index.ts` | [ProviderContext](references/api/plugin.md#providercontext) |
| `WorkspaceInfo` | Type | `index.ts` | [Workspace Types](references/api/plugin.md#workspace-types) |
| `WorkspaceTarget` | Type | `index.ts` | [Workspace Types](references/api/plugin.md#workspace-types) |
| `WorkspaceAdapter` | Type | `index.ts` | [Workspace Types](references/api/plugin.md#workspace-types) |
| `tool()` | Function | `tool.ts` | [tool() Helper](references/api/plugin.md#tool-helper) |
| `tool.schema` | Property | `tool.ts` | [tool.schema](references/api/plugin.md#toolschema) |
| `ToolContext` | Type | `tool.ts` | [ToolContext](references/api/plugin.md#toolcontext) |
| `ToolResult` | Type | `tool.ts` | [ToolResult](references/api/plugin.md#toolresult) |
| `ToolDefinition` | Type | `tool.ts` | [ToolDefinition](references/api/plugin.md#tooldefinition) |
| `BunShell` | Interface | `shell.ts` | [BunShell](references/api/plugin.md#bunshell) |
| `BunShellPromise` | Interface | `shell.ts` | [BunShellPromise](references/api/plugin.md#bunshellpromise) |
| `BunShellOutput` | Interface | `shell.ts` | [BunShellOutput](references/api/plugin.md#bunshelloutput) |

### Hook Names (in `Hooks` interface)

| Hook Name | Purpose | Input Shape | Output Shape |
|-----------|---------|-------------|--------------|
| `event` | System event subscriber | `{ event: Event }` | void |
| `config` | Configuration hook | `Config` | void |
| `tool` | Tool registration | — | `{ [key: string]: ToolDefinition }` |
| `auth` | Authentication provider | — | `AuthHook` |
| `provider` | Provider customization | — | `ProviderHook` |
| `chat.message` | New message received | `{ sessionID, agent?, model?, messageID?, variant? }` | `{ message, parts }` |
| `chat.params` | Modify LLM parameters | `{ sessionID, agent, model, provider, message }` | `{ temperature, topP, topK, maxOutputTokens, options }` |
| `chat.headers` | Modify request headers | `{ sessionID, agent, model, provider, message }` | `{ headers }` |
| `permission.ask` | Permission decision | `Permission` | `{ status: "ask" \| "ask" \| "allow" }` |
| `command.execute.before` | Pre-command processing | `{ command, sessionID, arguments }` | `{ parts }` |
| `tool.execute.before` | Pre-tool execution | `{ tool, sessionID, callID }` | `{ args }` |
| `tool.execute.after` | Post-tool execution | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` |
| `tool.definition` | Modify tool definitions | `{ toolID }` | `{ description, parameters }` |
| `shell.env` | Inject env vars | `{ cwd, sessionID?, callID? }` | `{ env }` |
| `experimental.chat.messages.transform` | Transform messages | `{}` | `{ messages: {info, parts}[] }` |
| `experimental.chat.system.transform` | Transform system prompt | `{ sessionID?, model }` | `{ system: string[] }` |
| `experimental.session.compacting` | Session compaction | `{ sessionID }` | `{ context: string[], prompt? }` |
| `experimental.compaction.autocontinue` | Auto-continue control | `{ sessionID, agent, model, provider, message, overflow }` | `{ enabled }` |
| `experimental.text.complete` | Text completion | `{ sessionID, messageID, partID }` | `{ text }` |

### SDK API (`@opencode-ai/sdk`)

| Symbol | Type | File | Section |
|--------|------|------|---------|
| `createOpencode()` | Function | `index.ts` | [createOpencode](references/api/sdk.md#createopencode) |
| `createOpencodeClient()` | Function | `client.ts` | [createOpencodeClient](references/api/sdk.md#createopencodeclient) |
| `createOpencodeServer()` | Function | `server.ts` | [createOpencodeServer](references/api/sdk.md#createopencodeserver) |
| `createOpencodeTui()` | Function | `server.ts` | [createOpencodeTui](references/api/sdk.md#createopencodetui) |
| `OpencodeClient` | Class | `gen/sdk.gen.ts` | [OpencodeClient](references/api/sdk.md#opencodeclient) |
| `client.session.create()` | Method | `gen/sdk.gen.ts` | [Session Create](references/api/sdk.md#sessioncreate) |
| `client.session.list()` | Method | `gen/sdk.gen.ts` | [Session List](references/api/sdk.md#sessionlist) |
| `client.session.get()` | Method | `gen/sdk.gen.ts` | [Session Get](references/api/sdk.md#sessionget) |
| `client.session.update()` | Method | `gen/sdk.gen.ts` | [Session Update](references/api/sdk.md#sessionupdate) |
| `client.session.delete()` | Method | `gen/sdk.gen.ts` | [Session Delete](references/api/sdk.md#sessiondelete) |
| `client.session.prompt()` | Method | `gen/sdk.gen.ts` | [Session Prompt](references/api/sdk.md#sessionprompt) |
| `client.session.share()` | Method | `gen/sdk.gen.ts` | [Session Share](references/api/sdk.md#sessionshare) |
| `client.session.abort()` | Method | `gen/sdk.gen.ts` | [Session Abort](references/api/sdk.md#sessionabort) |
