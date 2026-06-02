# OpenCode SDK Surface Compliance

Extracted from `SKILL.md` for reference. Source: ingested `@opencode-ai/plugin` SDK v1.14.44 docs from `anomalyco/opencode` (verified against repomix output).

Validate implementations against the **real** `@opencode-ai/plugin` v1.14.44 API surface documented in `hm-tech-stack-ingest` ingest. Do not use imaginary signatures. For additional context, see `stack-opencode` skill.

## tool() Factory Compliance

Verify against the real signature from `@opencode-ai/plugin` v1.14.44:

```typescript
// REAL signature — reference from ingested docs (anomalyco/opencode)
// NOTE: ToolDefinition is now a derived type: ReturnType<typeof tool>
tool({
  description: string,                   // Required: describes what the tool does
  args: ZodSchema,                       // Required: Zod schema from tool.schema
  execute: async (args, context) => string  // Required: returns string (JSON convention)
})
```

Type change (v1.14.28→v1.14.44): `ToolDefinition` is no longer an explicit inline type. It is now derived via `ReturnType<typeof tool>`. This means the actual shape depends on the tool() function return, not a manually maintained type alias.

Check each tool:
- [ ] Uses `tool()` with `description`, `args` (Zod), and `execute` — all required
- [ ] `args` uses `tool.schema` (Zod re-export) — no `any` types
- [ ] `execute` returns a `string` (typically `JSON.stringify()`)
- [ ] Tool registered in `plugin.ts` return object under `tool.{name}`
- [ ] Tool name matches the key in `plugin.ts` tool map
- [ ] Does NOT hardcode an old inline `ToolDefinition` type — uses inferred types

## Hook Handler Compliance

Verify against the real hook signatures. Core hooks available in the OpenCode SDK v1.14.44:

| Hook | Signature | Return | Purpose |
|------|-----------|--------|---------|
| `tool.execute.before` | `(input: { tool: string, args: Record<string,unknown> }, output: { args: Record<string,unknown> }) => void` | void | Mutate args before tool runs |
| `tool.execute.after` | `(output: { result: string }) => void` | void | Observe/modify tool results |
| `experimental.session.compacting` | `(input: CompactionInput, output: { context: string[], prompt: string }) => void` | void | Inject context during compaction |
| `shell.env` | `(input: { cwd: string }, output: { env: Record<string,string> }) => void` | void | Inject environment variables |

**v1.14.44 type refinements (verified against repomix):**
- `chat.params` input: `model: Model` is now **required** (not optional). Previously `model?`.
- `ProviderHookContext` is now a named exported type (was inline in v1.14.28).
- `AuthOAuthResult` replaces deprecated `AuthOuathResult` (typo fix — backward compatible).
- `WorkspaceAdapter` spelling corrected (was `WorkspaceAdaptor` in v1.14.28 docs).
- `experimental.chat.messages.transform`, `experimental.chat.system.transform` hooks available.
- `experimental.compaction.autocontinue`, `experimental.text.complete` hooks available.
- `command.execute.before`, `permission.ask` hooks available.

Check each hook:
- [ ] Hook signature matches the real SDK signature exactly
- [ ] `chat.params` handler does NOT assume `model` is optional — must handle required `model: Model`
- [ ] Uses correct type name: `WorkspaceAdapter` (not the old misspelling `WorkspaceAdaptor`)
- [ ] Uses `ProviderHookContext` as named type if referencing provider hook context
- [ ] Uses `AuthOAuthResult` if referencing OAuth results (not deprecated `AuthOuathResult`)
- [ ] `tool.execute.before` mutates `output.args` — never modifies `input.args`
- [ ] `tool.execute.after` mutates `output.result` — returns void
- [ ] `experimental.session.compacting` pushes to `output.context` array
- [ ] `shell.env` sets keys on `output.env` object
- [ ] Hook is async — all SDK hooks return `Promise<void>`

## ACP Protocol Awareness (NEW in v1.14.44)

The Agent Client Protocol (ACP) is a JSON-RPC based protocol over stdio for IDE integration (Zed, VS Code). Key awareness points for lifecycle gate:

- [ ] Harness hooks must NOT intercept or modify ACP stdio transport messages
- [ ] `chat.params` and `chat.headers` hooks must be ACP-safe — model/provider params come from ACP sessions
- [ ] ACP sessions map to internal OpenCode sessions: `acp/session/new` → Session, `acp/session/prompt` → SessionPrompt.prompt()
- [ ] `ACPSessionManager` tracks session state independently — harness must not mutate ACP session state
- [ ] `command.execute.before` hook should verify it's not running inside an ACP-managed session (if wrapping commands)

## Plugin Composition Compliance

Verify the composition root (`src/plugin.ts`):
- [ ] Exports an async function matching `Plugin` type: `(ctx: PluginContext) => Promise<PluginReturn>`
- [ ] Uses `import type { Plugin }` for type safety (type-only import)
- [ ] Uses `import { tool }` from `@opencode-ai/plugin` for runtime tool helper
- [ ] `ctx` destructuring: `{ project, client, $, directory, worktree }`
- [ ] Returns object with hook handlers and `tool` map
- [ ] NO business logic inline in plugin.ts — all logic in factories
- [ ] PTY subsystem loaded lazily (`import("bun-pty")` with graceful fallback)
- [ ] Does NOT import deprecated types: `AuthOuathResult`, `WorkspaceAdaptor`, inline `ToolDefinition`
