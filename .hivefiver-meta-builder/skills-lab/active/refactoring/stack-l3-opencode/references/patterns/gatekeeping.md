# Patterns: Gatekeeping

> OpenCode SDK + Plugin v1.14.44

## Quality Gates for Plugin Code

### Gate 1: Type Safety

**Check:** All plugin code uses proper TypeScript types from `@opencode-ai/plugin`.

```typescript
// ✅ CORRECT: Import and use Plugin type
import type { Plugin, ToolContext, ToolResult } from "@opencode-ai/plugin"
export const MyPlugin: Plugin = async (ctx) => { return {} }

// ❌ WRONG: Using any or missing types
export default async (ctx: any) => { return {} }
```

**Verification:**
- `Plugin` type annotation on exported plugin
- `ToolContext` used in tool execute functions
- `ToolResult` return type from execute
- No `any` types in hook signatures

### Gate 2: Hook Name Correctness

**Check:** Hook names match the `Hooks` interface exactly.

```typescript
// ✅ CORRECT: Dot-notation hook names
return {
  "tool.execute.before": async (input, output) => {},
  "tool.execute.after": async (input, output) => {},
  "chat.params": async (input, output) => {},
  "shell.env": async (input, output) => {},
}

// ❌ WRONG: Old-style or camelCase hook names
return {
  PreToolUse: async () => {},
  postToolExecution: async () => {},
  chatParams: async () => {},
}
```

**Valid hook names (from Hooks interface):**
- `event`
- `config`
- `tool`
- `auth`
- `provider`
- `chat.message`
- `chat.params`
- `chat.headers`
- `permission.ask`
- `command.execute.before`
- `tool.execute.before`
- `tool.execute.after`
- `tool.definition`
- `shell.env`
- `experimental.chat.messages.transform`
- `experimental.chat.system.transform`
- `experimental.session.compacting`
- `experimental.compaction.autocontinue`
- `experimental.text.complete`

### Gate 3: Hook Input/Output Shape

**Check:** Each hook receives and mutates the correct shapes.

| Hook | Input Shape | Output Shape (mutable) |
|------|-------------|----------------------|
| `tool.execute.before` | `{ tool, sessionID, callID }` | `{ args: any }` |
| `tool.execute.after` | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` |
| `chat.params` | `{ sessionID, agent, model, provider, message }` | `{ temperature, topP, topK, maxOutputTokens, options }` |
| `chat.headers` | `{ sessionID, agent, model, provider, message }` | `{ headers }` |
| `shell.env` | `{ cwd, sessionID?, callID? }` | `{ env }` |
| `permission.ask` | `Permission` | `{ status: "ask" \| "deny" \| "allow" }` |

### Gate 4: Tool Registration Compliance

**Check:** Tools follow the `tool()` helper pattern.

```typescript
// ✅ CORRECT: Using tool() helper with Zod schema
tool({
  description: "Clear description of what the tool does",
  args: {
    param1: tool.schema.string().describe("Parameter description"),
    param2: tool.schema.number().optional().describe("Optional parameter"),
  },
  async execute(args, context) {
    const { directory, sessionID } = context
    return "result" satisfies ToolResult
  },
})

// ❌ WRONG: Manual tool definition
{
  description: "my tool",
  args: { param1: { type: "string" } },  // NOT Zod
  execute: (args) => "result",  // Missing context param
}
```

**Checklist:**
- [ ] `description` is non-empty and descriptive
- [ ] `args` uses `tool.schema.*` (Zod) with `.describe()` on each field
- [ ] `execute` takes `(args, context)` with both parameters
- [ ] `execute` returns `string` or `{ output: string, metadata?: object }`
- [ ] `context.metadata()` called for progress indicators
- [ ] `context.abort` checked for long-running operations

### Gate 5: No `definePlugin` Usage

**Check:** Plugin is a plain async function, not wrapped in any factory.

```typescript
// ✅ CORRECT
import type { Plugin } from "@opencode-ai/plugin"
const MyPlugin: Plugin = async (ctx) => { return {} }
export default MyPlugin

// ❌ WRONG: No definePlugin exists in the API
import { definePlugin } from "@opencode-ai/plugin"
export default definePlugin({})
```

### Gate 6: Effect.Effect Handling

**Check:** `ToolContext.ask()` returns `Effect.Effect<void>`, not `Promise<void>`.

```typescript
// ✅ CORRECT: ask() returns an Effect — handle with Effect.runPromise
import { Effect } from "effect"

async execute(args, context) {
  // If you need to call ask(), use Effect.runPromise
  await Effect.runPromise(context.ask({
    permission: "file:write",
    patterns: [args.path],
    always: [],
    metadata: {},
  }))
}

// ❌ WRONG: Treating ask() as a Promise
await context.ask({ /* ... */ })  // TypeScript error: not a Promise
```

### Gate 7: Error Handling in Hooks

**Check:** Hooks don't throw unhandled exceptions that crash the plugin runtime.

```typescript
// ✅ CORRECT: Catch and handle errors
"tool.execute.before": async (input, output) => {
  try {
    if (input.tool === "bash") {
      // Safe transformation
      output.args.command = sanitize(output.args.command)
    }
  } catch (error) {
    console.error("[MyPlugin] tool.execute.before failed:", error)
    // Don't rethrow — let execution continue
  }
},

// ❌ WRONG: Unhandled throw crashes the hook chain
"tool.execute.before": async (input, output) => {
  if (input.tool === "bash") {
    throw new Error("blocked")  // Crashes plugin runtime
  }
},
```

### Gate 8: Import Correctness

**Check:** Correct import paths for the plugin package.

```typescript
// ✅ CORRECT imports
import type { Plugin, Hooks, PluginInput, AuthHook } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"           // tool() helper
import { tool } from "@opencode-ai/plugin/tool"       // alternative entry
import type { Plugin } from "@opencode-ai/plugin"     // type-only import

// ✅ CORRECT SDK imports
import { createOpencodeClient } from "@opencode-ai/sdk"
import { createOpencodeClient } from "@opencode-ai/sdk/client"  // alternative entry
import type { Session, Message, Part } from "@opencode-ai/sdk"

// ❌ WRONG: Non-existent exports
import { definePlugin } from "@opencode-ai/plugin"    // doesn't exist
import { Plugin } from "@opencode-ai/plugin"          // Plugin is a type, use import type
```

## Architecture Compliance Gates

### Plugin Assembly Gate

When assembling multiple tools and hooks into a plugin:

- [ ] Single plugin function exports all tools via `Hooks.tool` map
- [ ] Hook names match the `Hooks` interface exactly
- [ ] No duplicate tool names in the `tool` map
- [ ] Plugin returns `Promise<Hooks>` (async function)
- [ ] Plugin handles missing `PluginInput` properties gracefully

### Dependency Gate

- [ ] Only depends on `@opencode-ai/plugin` and `@opencode-ai/sdk`
- [ ] `effect` is a valid dependency (used by `ToolContext.ask()`)
- [ ] `zod` is provided via `tool.schema` — don't import separately
- [ ] No runtime dependencies on `@opentui/*` (optional peers for TUI only)

### File Location Gate

- [ ] Plugin source files in project's configured plugin directory
- [ ] Usually: `.opencode/plugins/` or as an npm package
- [ ] Plugin referenced in `opencode.json` config

## Integration Verification

### Smoke Test: Plugin Loads

```typescript
import { describe, it, expect } from "vitest"
import { MyPlugin } from "./my-plugin"

describe("Plugin smoke test", () => {
  it("returns Hooks object", async () => {
    const hooks = await MyPlugin({
      client: {} as any,
      directory: "/test",
      worktree: "/test",
      serverUrl: new URL("http://localhost:4096"),
      $: {} as any,
      experimental_workspace: { register: vi.fn() },
    } as any)

    // Verify Hooks interface compliance
    expect(hooks).toBeTypeOf("object")
    expect(hooks).not.toBe(null)

    // If tools are registered, verify structure
    if (hooks.tool) {
      for (const [name, def] of Object.entries(hooks.tool)) {
        expect(def).toHaveProperty("description")
        expect(def).toHaveProperty("args")
        expect(def).toHaveProperty("execute")
        expect(typeof def.execute).toBe("function")
      }
    }
  })
})
```
