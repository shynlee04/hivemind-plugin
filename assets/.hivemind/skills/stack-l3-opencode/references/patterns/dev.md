# Patterns: Feature Development

> OpenCode SDK + Plugin v1.14.28

## Pattern: Minimal Plugin

```typescript
import type { Plugin } from "@opencode-ai/plugin"

const MyPlugin: Plugin = async (ctx) => {
  // ctx.client — SDK client
  // ctx.directory — project path
  // ctx.worktree — worktree root
  // ctx.$ — BunShell
  // ctx.serverUrl — server URL
  return {}  // empty hooks = no-op plugin
}

export default MyPlugin
```

## Pattern: Custom Tool Registration

```typescript
import { type Plugin, tool } from "@opencode-ai/plugin"

export const ToolPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      "my-search": tool({
        description: "Search files in the project",
        args: {
          query: tool.schema.string().describe("Search query"),
          maxResults: tool.schema.number().optional().default(10),
        },
        async execute(args, context) {
          const { directory, sessionID } = context

          // Use metadata to show progress
          context.metadata({ title: `Searching: ${args.query}` })

          // Return string result
          return `Found results for: ${args.query}`
        },
      }),

      "my-rich-tool": tool({
        description: "Returns structured metadata",
        args: { input: tool.schema.string() },
        async execute(args, context) {
          // Return object with metadata
          return {
            output: `Processed: ${args.input}`,
            metadata: {
              processedAt: new Date().toISOString(),
              sessionId: context.sessionID,
            },
          }
        },
      }),
    },
  }
}
```

## Pattern: Pre-Tool Execution Hook (Security Guard)

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const SecurityPlugin: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        const command = output.args?.command as string
        if (command?.includes("rm -rf")) {
          throw new Error("Destructive commands blocked by security plugin")
        }
      }
    },
  }
}
```

## Pattern: Post-Tool Execution Hook (Logging/Transformation)

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const LoggingPlugin: Plugin = async () => {
  return {
    "tool.execute.after": async (input, output) => {
      // Modify tool output
      if (input.tool === "bash") {
        output.title = `Bash: ${output.title}`
        output.metadata = {
          ...output.metadata,
          loggedAt: Date.now(),
        }
      }
    },
  }
}
```

## Pattern: Environment Variable Injection

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const EnvPlugin: Plugin = async () => {
  return {
    "shell.env": async (input, output) => {
      // Inject environment variables for all shell executions
      output.env.MY_API_KEY = "secret"
      output.env.PROJECT_ROOT = input.cwd

      // Conditional injection based on session
      if (input.sessionID) {
        output.env.SESSION_ID = input.sessionID
      }
    },
  }
}
```

## Pattern: LLM Parameter Modification

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const ModelPlugin: Plugin = async () => {
  return {
    "chat.params": async (input, output) => {
      // Lower temperature for code generation agents
      if (input.agent === "coder") {
        output.temperature = 0.2
        output.topP = 0.9
      }

      // Set max tokens for specific models
      if (input.model.id.includes("claude")) {
        output.maxOutputTokens = 8192
      }
    },
  }
}
```

## Pattern: Session Compaction Customization

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const CompactionPlugin: Plugin = async () => {
  return {
    // Add context to compaction prompt
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`
## Harness State
- Active delegations: check .hivemind/state/delegations.json
- Session continuity: check .hivemind/state/session-continuity.json
- Current phase: check .planning/STATE.md
`)
    },
  }
}
```

## Pattern: Custom Compaction Prompt (Full Override)

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const CustomCompactionPlugin: Plugin = async () => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Setting `prompt` replaces the default compaction prompt entirely
      output.prompt = `
You are summarizing a multi-agent orchestration session.

Preserve:
1. Active delegations and their status
2. Session continuity state
3. Phase progress and checkpoints
4. Any blocked or pending work items
5. The last 3 user messages verbatim
`
    },
  }
}
```

## Pattern: Permission Control

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const PermissionPlugin: Plugin = async () => {
  return {
    "permission.ask": async (input, output) => {
      // Auto-approve read operations
      if (input.tool === "file_read") {
        output.status = "allow"
        return
      }

      // Auto-ask destructive operations
      if (input.tool === "bash" && input.args?.command?.includes("DROP TABLE")) {
        output.status = "ask"
        return
      }

      // Default: ask user
      output.status = "ask"
    },
  }
}
```

## Pattern: Tool Definition Modification

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const ToolDefPlugin: Plugin = async () => {
  return {
    "tool.definition": async (input, output) => {
      // Modify a tool's description sent to the LLM
      if (input.toolID === "bash") {
        output.description += "\n\nIMPORTANT: Always use non-interactive flags (-y, --yes, etc.)"
      }
    },
  }
}
```

## Pattern: Event Subscription

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const EventPlugin: Plugin = async () => {
  return {
    event: async ({ event }) => {
      // Events include: session.created, message.updated,
      // tool.execute.before, tool.execute.after, etc.
      console.log(`[Event] ${event.type}:`, event)
    },
  }
}
```

## Pattern: Authentication Provider

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const AuthPlugin: Plugin = async () => {
  return {
    auth: {
      provider: "my-service",
      methods: [
        {
          type: "api",
          label: "My Service API Key",
          prompts: [
            {
              type: "text",
              key: "apiKey",
              message: "Enter your API key",
              placeholder: "sk-...",
              validate: (value) => {
                if (!value.startsWith("sk-")) return "API key must start with sk-"
              },
            },
          ],
          authorize: async (inputs) => {
            const key = inputs?.apiKey
            if (!key) return { type: "failed" }
            // Validate key with service...
            return { type: "success", key }
          },
        },
      ],
    },
  }
}
```

## Pattern: Using Shell in Plugin

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const ShellPlugin: Plugin = async ({ $ }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool === "bash") {
        // Run a quick shell command
        const gitBranch = await $`git branch --show-current`.quiet().text()
        output.metadata = { ...output.metadata, gitBranch: gitBranch.trim() }
      }
    },
  }
}
```

## Pattern: SDK Client Usage in Plugin

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const ClientPlugin: Plugin = async ({ client }) => {
  return {
    "tool.execute.after": async (input, output) => {
      // Use SDK client to query session info
      const session = await client.session.get({ sessionID: input.sessionID })
      output.metadata = {
        ...output.metadata,
        sessionTitle: session.title,
      }
    },
  }
}
```

## Anti-Patterns

### ❌ Using `definePlugin` (doesn't exist)

```typescript
// WRONG — definePlugin doesn't exist
import { definePlugin } from "@opencode-ai/plugin"
export default definePlugin({ /* ... */ })
```

### ✅ Correct: Plugin is just an async function

```typescript
import type { Plugin } from "@opencode-ai/plugin"
const MyPlugin: Plugin = async (ctx) => { return {} }
export default MyPlugin
```

### ❌ Using old hook names

```typescript
// WRONG — these hook names don't exist
return {
  PreToolUse: async () => {},
  PostToolUse: async () => {},
}
```

### ✅ Correct: Use dot-notation hook names

```typescript
return {
  "tool.execute.before": async () => {},
  "tool.execute.after": async () => {},
}
```
