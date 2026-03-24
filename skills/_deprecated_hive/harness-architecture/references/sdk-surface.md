# OpenCode SDK Client & Plugin API Surface Examples

## 1. The JavaScript SDK (`@opencode-ai/sdk`)
This SDK operates in the **Control Plane**. Use it in CLI wrappers, Electron main processes, or external orchestrators.

### Server Lifecycle & Control
```typescript
import { createOpencodeServer, createOpencodeClient } from "@opencode-ai/sdk"

// 1. Boot up the background server process
await createOpencodeServer({ cwd: process.cwd() });

// 2. Connect a client to it
const client = createOpencodeClient();

// 3. Spawning a headless execution session
const session = await client.session.create({
  cwd: process.cwd(),
});

// 4. Executing an external command against a session
const result = await client.session.prompt(session.id, {
  prompt: "Refactor the authentication module",
});
```

## 2. The Plugin System (`@opencode-ai/plugin`)
This SDK operates in the **Execution Plane**. Use it for extending the behavior of the engine at runtime. **NEVER** use `@opencode-ai/sdk` inside a plugin, as the server is already running.

### Hard Governance via `permission.ask`
Intercept all tool calls and enforce strict rules natively. Prompting LLMs to follow rules is an anti-pattern.
```typescript
import { PluginInput, Hooks } from "@opencode-ai/plugin";

export default async function governancePlugin({ client }: PluginInput): Promise<Hooks> {
  return {
    "permission.ask": async (output) => {
      // Example: Prevent deleting critical files regardless of LLM intent
      if (output.permission.operation === "delete" && output.permission.context.includes("package.json")) {
        output.status = "deny";
      }
    }
  };
}
```

### Zero-Trust Delegation via `tool.execute.after`
When subagents return, an orchestrator blinded by a standard tool call will corrupt the session tree. We must implement zero-trust delegation via AST/schema checks.
```typescript
import { PluginInput, Hooks } from "@opencode-ai/plugin";

export default async function delegationValidationPlugin(): Promise<Hooks> {
  return {
    "tool.execute.after": async (output) => {
      if (output.tool.name === "task") {
        // Assume output.output contains the raw string from the subagent
        try {
          const parsed = JSON.parse(output.output);
          if (!parsed.success) {
            output.output = "Task failed validation: missing success boolean.";
          }
        } catch {
          output.output = "Task failed validation: output must be valid JSON.";
        }
      }
    }
  };
}
```
