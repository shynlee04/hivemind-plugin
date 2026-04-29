# OpenCode SDK Surface Compliance

Extracted from `SKILL.md` for reference. Source: ingested `@opencode-ai/plugin` SDK v1.14.28 docs.

Validate implementations against the **real** `@opencode-ai/plugin` v1.14.28 API surface documented in `hm-tech-stack-ingest` ingest. Do not use imaginary signatures. For additional context, see `stack-opencode` skill.

## tool() Factory Compliance

Verify against the real signature from `@opencode-ai/plugin`:

```typescript
// REAL signature — reference from ingested docs
tool({
  description: string,                   // Required: describes what the tool does
  args: ZodSchema,                       // Required: Zod schema from tool.schema
  execute: async (args, context) => string  // Required: returns string (JSON convention)
})
```

Check each tool:
- [ ] Uses `tool()` with `description`, `args` (Zod), and `execute` — all required
- [ ] `args` uses `tool.schema` (Zod re-export) — no `any` types
- [ ] `execute` returns a `string` (typically `JSON.stringify()`)
- [ ] Tool registered in `plugin.ts` return object under `tool.{name}`
- [ ] Tool name matches the key in `plugin.ts` tool map

## Hook Handler Compliance

Verify against the real hook signatures. There are exactly four hooks available in the OpenCode SDK:

| Hook | Signature | Return | Purpose |
|------|-----------|--------|---------|
| `tool.execute.before` | `(input: { tool: string, args: Record<string,unknown> }, output: { args: Record<string,unknown> }) => void` | void | Mutate args before tool runs |
| `tool.execute.after` | `(output: { result: string }) => void` | void | Observe/modify tool results |
| `experimental.session.compacting` | `(input: CompactionInput, output: { context: string[], prompt: string }) => void` | void | Inject context during compaction |
| `shell.env` | `(input: { cwd: string }, output: { env: Record<string,string> }) => void` | void | Inject environment variables |

Check each hook:
- [ ] Hook signature matches the real SDK signature exactly
- [ ] `tool.execute.before` mutates `output.args` — never modifies `input.args`
- [ ] `tool.execute.after` mutates `output.result` — returns void
- [ ] `experimental.session.compacting` pushes to `output.context` array
- [ ] `shell.env` sets keys on `output.env` object
- [ ] Hook is async — all SDK hooks return `Promise<void>`

## Plugin Composition Compliance

Verify the composition root (`src/plugin.ts`):
- [ ] Exports an async function matching `Plugin` type: `(ctx: PluginContext) => Promise<PluginReturn>`
- [ ] Uses `import type { Plugin }` for type safety (type-only import)
- [ ] Uses `import { tool }` from `@opencode-ai/plugin` for runtime tool helper
- [ ] `ctx` destructuring: `{ project, client, $, directory, worktree }`
- [ ] Returns object with hook handlers and `tool` map
- [ ] NO business logic inline in plugin.ts — all logic in factories
- [ ] PTY subsystem loaded lazily (`import("bun-pty")` with graceful fallback)
