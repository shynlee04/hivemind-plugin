# Architecture — OpenCode SDK + Plugin

> Version 1.14.44 | Source: [anomalyco/opencode](https://github.com/anomalyco/opencode)

## System Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Plugin System                            │
│  `packages/plugin/src/index.ts`                                 │
│                                                                  │
│  Plugin = async (PluginInput) => Promise<Hooks>                 │
│                                                                  │
│  Hooks define: tools, hooks (events), auth, providers           │
├──────────┬──────────┬──────────┬──────────┬────────────────────┤
│  tool()  │ Hooks    │ AuthHook │ Provider │  BunShell ($)      │
│ tool.ts  │ index.ts │ index.ts │ Hook     │  shell.ts          │
│          │          │          │ index.ts │                    │
└──────────┴──────────┴──────────┴──────────┴────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SDK Layer                                │
│  `packages/sdk/js/src/`                                         │
│                                                                  │
│  createOpencodeClient() — HTTP client to OpenCode server         │
│  createOpencodeServer() — Spawn standalone OpenCode server       │
│  createOpencode()      — Combined client+server factory          │
├───────────────┬─────────────────┬───────────────────────────────┤
│  client.ts    │  server.ts      │  gen/ (auto-generated)        │
│  Client init  │  Server spawn   │  OpencodeClient class         │
│  + intercept  │  + TUI spawn    │  + types.gen.ts (68KB)        │
└───────────────┴─────────────────┴───────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode Runtime                              │
│  (Go binary — not part of this SDK)                             │
│                                                                  │
│  HTTP API on localhost:4096 (default)                           │
│  OpenAPI spec: packages/sdk/openapi.json                        │
│  Plugin loading via Node.js worker                              │
└─────────────────────────────────────────────────────────────────┘
```

## Two Contexts

| Context | Entry Point | Pattern | State |
|---------|-------------|---------|-------|
| **Server-side Plugin** | `Plugin` function | Effect-based async | Access to tools, hooks, auth, providers, SDK client, BunShell |
| **TUI Plugin** | `TuiPluginApi` | Solid.js + imperative | Access to terminal UI slots, routes, keybinds, theme, state |

Server-side plugins run in Node.js worker. TUI plugins run in the terminal renderer process. They NEVER share memory.

## Module Dependency Graph

```text
packages/plugin/src/
├── index.ts ──imports──→ @opencode-ai/sdk (types only)
│                  ──imports──→ ./tool.js (ToolDefinition type)
│                  ──imports──→ ./shell.js (BunShell type)
├── tool.ts ──imports──→ zod, effect
│       └── exports: tool(), tool.schema, ToolDefinition type
├── shell.ts ──imports──→ (none — pure types)
├── tui.ts  ──imports──→ @opentui/core, @opentui/solid (optional peers)
│       └── 300+ lines of TUI type definitions
└── example.ts ──imports──→ ./index.js, ./tool.js

packages/sdk/js/src/
├── index.ts ──imports──→ ./client.js, ./server.js
├── client.ts ──imports──→ ./gen/types.gen.js, ./gen/client/client.gen.js, ./gen/sdk.gen.js
│       └── Request interceptor (header→query rewrite), response interceptor (text/html guard)
├── server.ts ──imports──→ cross-spawn, ./gen/types.gen.js, ./process.js
│       └── Server spawn, stdout URL detection, OPENCODE_CONFIG_CONTENT injection
├── process.ts ──imports──→ (Node.js builtins)
│       └── stop() + bindAbort() — cross-platform process management
├── v2/
│   ├── client.ts ── Same pattern + workspace header injection
│   ├── server.ts ── Identical to V1 server
│   └── data.ts ── data.message.user() helper with stub IDs
└── gen/ ──auto-generated──→ from openapi.json via @hey-api/openapi-ts
    ├── sdk.gen.ts ──the OpencodeClient class (~auto-generated)
    ├── types.gen.ts ──all generated types (68KB)
    └── client/client.gen.ts ──HTTP client base
```

## Key Design Decisions

1. **Plugins are functions, not classes.** `async (input) => Hooks`. No `definePlugin()` wrapper.
2. **Hooks use dot-notation names.** `"tool.execute.before"`, NOT `PreToolUse`.
3. **SDK is auto-generated.** From OpenAPI spec via `@hey-api/openapi-ts`. `gen/` is read-only.
4. **Two SDK versions coexist.** v1 at `gen/`, v2 at `v2/gen/`. v2 adds workspace scoping.
5. **Plugin receives `client` in input.** Fully initialized `OpencodeClient`.
6. **`tool.schema` exposes Zod.** Full library re-export. Don't import zod separately.
7. **Shell access via `$`.** `BunShell` tagged template for subprocess execution.
8. **Effect is used internally.** `ToolContext.ask()` returns `Effect.Effect<void>`, not Promise. Use `Effect.runPromise()`.

## Package Exports

### `@opencode-ai/plugin`

```json
{
  ".": "./src/index.ts",
  "./tool": "./src/tool.ts",
  "./tui": "./src/tui.ts"
}
```

### `@opencode-ai/sdk`

```json
{
  ".": "./src/index.ts",
  "./client": "./src/client.ts",
  "./server": "./src/server.ts",
  "./v2": "./src/v2/index.ts",
  "./v2/client": "./src/v2/client.ts",
  "./v2/gen/client": "./src/v2/gen/client/index.ts",
  "./v2/server": "./src/v2/server.ts"
}
```

## Peer Dependencies

| Package | Peer | Version | Required |
|---------|------|---------|----------|
| `@opencode-ai/plugin` | `@opentui/core` | >=0.1.105 | Optional (TUI only) |
| `@opencode-ai/plugin` | `@opentui/solid` | >=0.1.105 | Optional (TUI only) |
| `@opencode-ai/plugin` | `effect` | — | Implicit (used by ToolContext.ask) |
| `@opencode-ai/sdk` | — | — | None |

## Plugin Runtime Lifecycle

```text
1. OpenCode server starts (Go binary)
2. Plugin loader discovers plugins from config
3. Each plugin function called with PluginInput
4. Plugin returns Hooks object
5. Hooks registered in runtime:
   - tool → added to tool registry
   - auth → registered for provider
   - provider → models merged
   - hooks → added to hook chain
6. Plugin lives for server lifetime
7. Hooks called on matching events
```

## Effect.Effect Internals

`ToolContext.ask()` returns `Effect.Effect<void>`:

- Effect is a lazy computation — nothing happens until run
- `Effect.runPromise(effect)` executes and returns Promise<void>
- If permission denied, the Effect fails → `runPromise` rejects
- Use `Effect.catchAll()` or try/catch around `runPromise` for graceful handling

## Auto-generated gen/ Directory

- `types.gen.ts` — 68KB of types from OpenAPI spec
- `sdk.gen.ts` — OpencodeClient class with all API methods
- `client/client.gen.ts` — Base HTTP client
- **Never edit gen/ files** — regenerated from openapi.json
- Generated by `@hey-api/openapi-ts`

## Two SDK Versions: Coexistence Strategy

| Feature | V1 | V2 |
|---------|----|----|
| Client | `packages/sdk/js/src/client.ts` | `packages/sdk/js/src/v2/client.ts` |
| Server | `packages/sdk/js/src/server.ts` | `packages/sdk/js/src/v2/server.ts` |
| Directory header | `x-opencode-directory` | `x-opencode-directory` |
| Workspace header | Not supported | `x-opencode-workspace` |
| URL encoding | Basic | `pick()` comparison function |
| Data helpers | None | `data.message.user()` |
| Types | `gen/types.gen.ts` | `v2/gen/types.gen.ts` |

Both versions share the same process management (`process.ts`) and same OpenAPI spec.
