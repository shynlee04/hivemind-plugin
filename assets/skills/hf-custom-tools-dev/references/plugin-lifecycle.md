# Plugin Lifecycle — OpenCode Plugin Architecture

## The Lifecycle

```
init → register tools/hooks → event loop → shutdown
```

## Init Phase

The plugin entry point. Create your plugin object and define its metadata:

```typescript
import { Plugin } from "@opencode-ai/plugin";

export const myPlugin: Plugin = {
  name: "my-plugin",
  version: "1.0.0",
  // Tools and hooks registered below
};
```

## Tool Registration

Tools are write-side — they mutate state. Each tool needs a Zod schema:

```typescript
import { z } from "zod";
import { tool } from "@opencode-ai/plugin";

const myTool = tool({
  name: "my-tool",
  description: "Does one thing well",
  parameters: z.object({
    input: z.string().min(1).describe("The input string"),
    options: z.object({
      verbose: z.boolean().optional().describe("Enable verbose output"),
    }).optional(),
  }),
  execute: async ({ input, options }) => {
    // Implementation
    return { content: [{ type: "text", text: `Result: ${input}` }] };
  },
});

export const myPlugin: Plugin = {
  name: "my-plugin",
  tools: [myTool],
};
```

## Hook Registration

Hooks are read-side — they observe events without mutating state:

```typescript
import { hook } from "@opencode-ai/plugin";

const myHook = hook({
  event: "PreToolUse",
  handler: async ({ toolName, toolInput }) => {
    // Observe tool usage, optionally block
    if (toolName === "dangerous-tool") {
      return { blocked: true, reason: "This tool is not allowed" };
    }
    return { blocked: false };
  },
});

export const myPlugin: Plugin = {
  name: "my-plugin",
  hooks: [myHook],
};
```

## Event Loop

Once registered, the plugin runs in the event loop:
- Tools are called by agents → execute → return results
- Hooks fire on events → observe → optionally block
- The plugin layer stays thin — no business logic

## Shutdown

Clean up resources when the plugin is unloaded:
- Close database connections
- Clear temporary files
- Release file locks

## Architecture Rules

1. **Plugin layer is thin (<100 LOC)** — Assembly only, no business logic
2. **Tools have Zod schemas** — No `any` types, no unvalidated input
3. **Hooks are read-side** — Observe events, don't mutate state
4. **Scripts report facts** — Exit 0, no governance, no state mutation
5. **No hardcoded paths** — Use environment variables or config

## Common Patterns

### Tool with File I/O
```typescript
const readFileTool = tool({
  name: "read-file",
  description: "Read a file and return its content",
  parameters: z.object({
    path: z.string().min(1).describe("File path to read"),
  }),
  execute: async ({ path }) => {
    const content = await fs.readFile(path, "utf-8");
    return { content: [{ type: "text", text: content }] };
  },
});
```

### Tool with Validation
```typescript
const createFileTool = tool({
  name: "create-file",
  description: "Create a new file with content",
  parameters: z.object({
    path: z.string().min(1).describe("File path to create"),
    content: z.string().describe("File content"),
    overwrite: z.boolean().optional().describe("Overwrite if exists"),
  }),
  execute: async ({ path, content, overwrite = false }) => {
    if (!overwrite && await fs.exists(path)) {
      return { error: "File already exists" };
    }
    await fs.writeFile(path, content);
    return { content: [{ type: "text", text: `Created ${path}` }] };
  },
});
```

### Hook for Tool Budget
```typescript
const toolBudgetHook = hook({
  event: "PreToolUse",
  handler: async ({ toolName, sessionId }) => {
    const count = await getToolCallCount(sessionId);
    if (count > MAX_TOOL_CALLS) {
      return { blocked: true, reason: `Tool budget exceeded (${count}/${MAX_TOOL_CALLS})` };
    }
    return { blocked: false };
  },
});
```
