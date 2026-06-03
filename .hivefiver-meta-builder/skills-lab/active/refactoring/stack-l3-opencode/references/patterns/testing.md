# Patterns: Testing

> OpenCode SDK + Plugin v1.14.28

## Pattern: Plugin Unit Test

Test a plugin's hook behavior in isolation:

```typescript
import { describe, it, expect, vi } from "vitest"

// Import your plugin
import { MyPlugin } from "./my-plugin"

describe("MyPlugin", () => {
  it("registers expected tools", async () => {
    const mockInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test",
      worktree: "/test",
      serverUrl: new URL("http://localhost:4096"),
      $: {} as any,
      experimental_workspace: { register: vi.fn() },
    }

    const hooks = await MyPlugin(mockInput)

    expect(hooks.tool).toBeDefined()
    expect(Object.keys(hooks.tool!)).toContain("my-tool")
  })
})
```

## Pattern: Tool Execute Test

Test a tool's execute function directly:

```typescript
import { describe, it, expect } from "vitest"

describe("my-tool execute", () => {
  it("returns expected output", async () => {
    // Access the tool definition from the plugin
    const plugin = await MyPlugin({} as any)
    const toolDef = plugin.tool!["my-tool"]

    const mockContext: ToolContext = {
      sessionID: "test-session",
      messageID: "test-message",
      agent: "test-agent",
      directory: "/test/project",
      worktree: "/test/project",
      abort: new AbortController().signal,
      metadata: vi.fn(),
      ask: vi.fn() as any,
    }

    const result = await toolDef.execute({ query: "test" }, mockContext)

    expect(result).toBe("Found results for: test")
    expect(mockContext.metadata).toHaveBeenCalledWith({
      title: "Searching: test",
    })
  })
})
```

## Pattern: Hook Behavior Test

Test hook input/output mutation:

```typescript
import { describe, it, expect } from "vitest"

describe("tool.execute.before hook", () => {
  it("blocks destructive bash commands", async () => {
    const plugin = await SecurityPlugin({} as any)
    const hook = plugin["tool.execute.before"]!

    const input = { tool: "bash", sessionID: "test", callID: "test" }
    const output = { args: { command: "rm -rf /" } }

    await expect(hook(input, output)).rejects.toThrow("Destructive commands blocked")
  })
})
```

## Pattern: shell.env Hook Test

Test environment injection:

```typescript
import { describe, it, expect } from "vitest"

describe("shell.env hook", () => {
  it("injects environment variables", async () => {
    const plugin = await EnvPlugin({} as any)
    const hook = plugin["shell.env"]!

    const input = { cwd: "/test", sessionID: "s1" }
    const output = { env: {} as Record<string, string> }

    await hook(input, output)

    expect(output.env.MY_API_KEY).toBe("secret")
    expect(output.env.SESSION_ID).toBe("s1")
  })
})
```

## Pattern: chat.params Hook Test

Test LLM parameter modification:

```typescript
import { describe, it, expect } from "vitest"

describe("chat.params hook", () => {
  it("lowers temperature for coder agent", async () => {
    const plugin = await ModelPlugin({} as any)
    const hook = plugin["chat.params"]!

    const input = {
      sessionID: "s1",
      agent: "coder",
      model: { id: "claude-3" } as any,
      provider: {} as any,
      message: {} as any,
    }
    const output = {
      temperature: 0.7,
      topP: 1.0,
      topK: 40,
      maxOutputTokens: undefined,
      options: {},
    }

    await hook(input, output)

    expect(output.temperature).toBe(0.2)
    expect(output.topP).toBe(0.9)
  })
})
```

## Pattern: ToolResult Type Testing

```typescript
import { describe, it, expect } from "vitest"
import type { ToolResult } from "@opencode-ai/plugin"

describe("ToolResult type handling", () => {
  it("handles string results", () => {
    const result: ToolResult = "simple output"
    expect(typeof result).toBe("string")
  })

  it("handles object results with metadata", () => {
    const result: ToolResult = {
      output: "rich output",
      metadata: { timestamp: Date.now() },
    }
    expect(result).toHaveProperty("output")
    expect(result).toHaveProperty("metadata")
  })
})
```

## Pattern: Mocking the SDK Client

When testing plugins that use the SDK client:

```typescript
import { describe, it, expect, vi } from "vitest"

function createMockClient() {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ id: "mock-session" }),
      get: vi.fn().mockResolvedValue({ id: "mock-session", title: "Test" }),
      list: vi.fn().mockResolvedValue([]),
      prompt: vi.fn().mockResolvedValue({
        info: { id: "msg-1", role: "assistant" },
        parts: [{ type: "text", text: "response" }],
      }),
      delete: vi.fn().mockResolvedValue(true),
      abort: vi.fn().mockResolvedValue(undefined),
      messages: vi.fn().mockResolvedValue([]),
    },
  } as any
}

describe("Plugin using SDK client", () => {
  it("queries session after tool execution", async () => {
    const mockClient = createMockClient()
    const plugin = await ClientPlugin({
      client: mockClient,
      directory: "/test",
      worktree: "/test",
      serverUrl: new URL("http://localhost:4096"),
      $: {} as any,
      experimental_workspace: { register: vi.fn() },
    } as any)

    await plugin["tool.execute.after"]!(
      { tool: "bash", sessionID: "s1", callID: "c1", args: {} },
      { title: "done", output: "ok", metadata: {} },
    )

    expect(mockClient.session.get).toHaveBeenCalledWith({ sessionID: "s1" })
  })
})
```

## Pattern: Zod Schema Validation in Tests

Test tool argument schemas:

```typescript
import { describe, it, expect } from "vitest"
import { z } from "zod"
import { tool } from "@opencode-ai/plugin"

describe("Tool argument validation", () => {
  const myTool = tool({
    description: "Test tool",
    args: {
      name: tool.schema.string().min(1),
      count: tool.schema.number().int().positive().optional(),
    },
    async execute(args) {
      return `Hello ${args.name} (${args.count ?? 1}x)`
    },
  })

  it("validates required args", () => {
    const schema = z.object(myTool.args)
    expect(() => schema.parse({})).toThrow()
  })

  it("accepts valid args", () => {
    const schema = z.object(myTool.args)
    const result = schema.parse({ name: "test", count: 5 })
    expect(result).toEqual({ name: "test", count: 5 })
  })

  it("allows optional args to be omitted", () => {
    const schema = z.object(myTool.args)
    const result = schema.parse({ name: "test" })
    expect(result).toEqual({ name: "test" })
  })
})
```

## Testing Checklist

For every plugin:

- [ ] Plugin function returns `Hooks` object (no missing return)
- [ ] Tool schemas validate with valid and invalid inputs
- [ ] Hook functions handle the correct input/output shapes
- [ ] `tool.execute.before` correctly mutates `output.args`
- [ ] `tool.execute.after` correctly sets `output.title`, `output.output`, `output.metadata`
- [ ] `shell.env` correctly sets `output.env` keys
- [ ] `chat.params` correctly sets output parameters
- [ ] Permission hook returns valid status: `"ask" | "deny" | "allow"`
- [ ] Compaction hook sets `output.context` array and/or `output.prompt` string
- [ ] Error handling: hooks don't throw unhandled exceptions
