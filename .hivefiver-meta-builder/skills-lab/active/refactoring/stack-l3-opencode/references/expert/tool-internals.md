# Expert: Tool Definition & Schema Validation Internals

> OpenCode SDK v1.14.28 | Source: `packages/plugin/src/tool.ts`, `packages/sdk/js/src/v2/gen/types.gen.ts`
> Classification: BEYOND-DOCS — not in official documentation

## Mental Model: Tool Lifecycle

```
Plugin Load Time:  tool() called → IDENTITY FUNCTION → returns input unchanged (no validation!)
                     ↓
LLM Prompt Time:   tool.definition hook → modifies description/parameters
                     ↓
LLM Generates:     Tool call with JSON args
                     ↓
Go Runtime:        Validates args against JSON Schema (converted from Zod)
                     ↓                  ↓
                  Valid              Invalid → ToolStateError
                     ↓
Before Hook:       tool.execute.before → can mutate args (POST-validation!)
                     ↓
Execution:         execute() runs with typed args
                     ↓
After Hook:        tool.execute.after → can mutate output/title/metadata
                     ↓
Result:            ToolStateCompleted | ToolStateError
```

---

## TS-1: tool() is a Zero-Validation Identity Function

```typescript
export function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>
}) {
  return input  // ← literally just returns input unchanged
}
```

**There is NO runtime validation.** `tool()` is purely a TypeScript branding helper. All type safety is compile-time only. If you pass `{ args: null }` or `{ args: { foo: "not a zod schema" } }`, it passes through silently. The error surfaces later when the Go runtime tries to parse tool arguments.

**What this means for testing:** You can't unit-test `tool()` validation because it doesn't exist. Test your `execute()` function directly by calling it with mock args.

---

## TS-2: Zod Schema → JSON Schema Conversion Has Silent Failures

`tool.schema = z` (full Zod library), but the Go runtime converts Zod schemas to JSON Schema for the LLM's tool-calling API. Not all Zod features convert correctly:

| Zod Type | JSON Schema Conversion | Reliability |
|----------|----------------------|-------------|
| `z.string()` | `{ type: "string" }` | ✅ Reliable |
| `z.number()` | `{ type: "number" }` | ✅ Reliable |
| `z.boolean()` | `{ type: "boolean" }` | ✅ Reliable |
| `z.enum(["a","b"])` | `{ enum: ["a","b"] }` | ✅ Reliable |
| `z.array(z.string())` | `{ type: "array", items: { type: "string" } }` | ✅ Reliable |
| `z.object({...})` | `{ type: "object", properties: {...} }` | ✅ Reliable |
| `z.optional(z.string())` | Property not in `required[]` | ✅ Reliable |
| `z.default(z.string(), "val")` | May or may not set default | ⚠️ Check |
| `z.record(z.string())` | `{ type: "object" }` (loses value type) | ⚠️ Partial |
| `z.union([...])` | `{ oneOf: [...] }` | ⚠️ Partial |
| `z.transform(...)` | **Dropped entirely** | ❌ Silent loss |
| `z.refine(...)` | **Dropped entirely** | ❌ Silent loss |
| `z.lazy(...)` | **Fails or drops** | ❌ Silent loss |
| `z.any()` | `{}` (accepts anything) | ❌ Dangerous |

**Rule:** Only use primitive Zod types in tool args. Put validation logic inside `execute()`, not in the schema.

---

## TS-3: ToolResult Must Be string or {output, metadata}

```typescript
type ToolResult = string | { output: string; metadata?: { [key: string]: any } }
```

**No auto-serialization.** Returning anything else (objects, numbers, undefined, null) produces undefined runtime behavior — likely `[object Object]` or `undefined` as the output string.

```typescript
// ✅ CORRECT
async execute(args) {
  return "Task completed successfully"
}

// ✅ CORRECT (structured)
async execute(args) {
  return { output: "Task completed", metadata: { duration: 1500 } }
}

// ❌ WRONG: returns undefined
async execute(args) {
  const result = doSomething()
  // forgot to return!
}

// ❌ WRONG: raw object
async execute(args) {
  return { success: true, data: [...] }  // not { output: string }
}
```

**Tip:** If you need to return structured data, `JSON.stringify()` it into the `output` field or use the `metadata` dict.

---

## TS-4: context.metadata() — Display Title Setter (Not Persistent)

```typescript
metadata(input: { title?: string; metadata?: Record<string, any> }): void
```

- **Synchronous** — fire and forget, no await needed
- **Sets the TUI title** in real-time during tool execution
- **Only affects current invocation** — does not persist
- **`metadata` dict is stored** in the session event stream (keep it small)

```typescript
async execute(args, context) {
  context.metadata({ title: `Searching: ${args.query}` })
  // ... do work ...
  context.metadata({ title: `Found ${results.length} results` })
  return results.join("\n")
}
```

**Anti-pattern:** Don't put large payloads in metadata — it bloats the session SSE stream.

---

## TS-5: context.ask() Returns Effect, NOT Promise — Common Bug

```typescript
ask(input: AskInput): Effect.Effect<void>  // ← Effect, not Promise!
```

This returns an `Effect.Effect<void>` from the `effect` library. **You CANNOT `await` it directly.**

```typescript
// ❌ WRONG: Effect is not a Promise — nothing happens
await context.ask({ permission: "bash", patterns: ["**"] })

// ✅ CORRECT: Run through Effect runtime
import { Effect } from "effect"
await Effect.runPromise(context.ask({ permission: "bash", patterns: ["**"] }))
```

**What it triggers:** The **permission request** flow (not the question flow). The permission reply is `"once" | "always" | "reject"`. If rejected, the Effect fails with an error.

**Note:** The richer `QuestionRequest` API (multiple-choice, custom answers) is a separate system — `context.ask()` only triggers the simpler permission flow.

---

## TS-6: tool.execute.before Runs AFTER Schema Validation

```
Go runtime validates args against JSON Schema → PASS
  → tool.execute.before fires → can mutate args (bypassing type checks!)
    → execute() receives possibly-invalid args
```

This means plugins can inject args via `tool.execute.before` that **bypass schema validation**. Your `execute()` function should not assume args always match the TypeScript types.

```typescript
// ✅ Defensive: validate again inside execute if needed
async execute(args, context) {
  if (typeof args.query !== "string") {
    return "Error: query must be a string"
  }
  // ... proceed with validated args
}
```

---

## TS-7: Abort Signal is Cooperative (Not Forced)

```typescript
interface ToolContext {
  abort: AbortSignal  // ← standard AbortSignal
  // ...
}
```

**When triggered:** Session abort (user cancels, timeout, `POST /session/{id}/abort`).

**What it kills:** Child processes via SIGTERM→SIGKILL fallback. In-flight HTTP requests.

**What it does NOT kill:** Your async operations inside `execute()`. You must cooperatively check:

```typescript
async execute(args, context) {
  for (const item of largeList) {
    if (context.abort.aborted) {
      return "Cancelled by user"  // cooperative check
    }
    await processItem(item)
  }
}
```

**Anti-pattern:** Ignoring the abort signal leaves zombie processes running after session cancellation.

---

## TS-8: ToolState 4-State Machine

```
ToolStatePending (input, raw)
  ↓
ToolStateRunning (input, title?)
  ↓
ToolStateCompleted (input, output, title, metadata, time)  ← metadata is REQUIRED
  or
ToolStateError (input, error, metadata?, time)
```

**Key detail:** `ToolStateCompleted.metadata` is **required** (always provided by runtime, even if empty `{}`). Don't detect failure by checking for absent metadata.

**Time tracking:** `time: { start: number, end: number }` — epoch milliseconds. Enables accurate duration display.

---

## TS-9: tool.execute.after Can Rewrite Tool Output

```typescript
"tool.execute.after": async (input, output) => {
  // output.title — can rewrite display title
  // output.output — can rewrite tool result string
  // output.metadata — can add/modify metadata

  // Example: truncate long output
  if (output.output.length > 5000) {
    output.output = output.output.slice(0, 5000) + "\n... (truncated)"
  }

  // Example: redact secrets
  output.output = output.output.replace(/sk-[a-zA-Z0-9]+/g, "sk-***REDACTED***")
}
```

**This is how OpenCode implements output truncation** (`tool_output.max_lines` / `tool_output.max_bytes` config). Other plugins can read your tool output — don't put secrets in it.

---

## Cross-Stack References

- **For hook composition patterns:** → `references/expert/hook-composition.md`
- **For client-server protocol:** → `references/expert/client-server.md`
- **For Zod schema patterns:** → `../../stack-zod/` (reliable vs unreliable types)
- **For testing tool behavior:** → `../../stack-vitest/` (mock ToolContext)
- **For gate-lifecycle integration:** → `../../gate-lifecycle-integration/` (CQRS boundary checks)
