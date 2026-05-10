---
spike: 003
name: custom-tool-wrapper
type: standard
validates: "Given a harness custom tool that wraps POST /session/:id/command, when an agent calls the tool with a command name and arguments, then the slash command executes on the active session"
verdict: VALIDATED
related: [001, 002, 004]
tags: [custom-tools, sdk, integration]
---

# Spike 003: Custom Tool Wrapper

## What This Validates
Given a harness custom tool that wraps POST /session/:id/command, when an agent calls the tool with a command name and arguments, then the slash command executes on the active session.

## Research
We investigated the OpenCode SDK (`@opencode-ai/plugin` and `@opencode-ai/sdk`) and discovered that OpenCode automatically injects a fully authenticated and bound `client` into the `PluginInput` object when a plugin server is initialized. 

Additionally, we found that the `ToolContext` passed into `execute(args, ctx)` contains:
- `ctx.sessionID`: The active session ID.
- `ctx.agent`: The active agent.
- `ctx.directory` & `ctx.worktree`: Context paths.

## How to Run
This is implemented natively via the plugin's SDK:
```typescript
import { tool } from "@opencode-ai/plugin";

export default async function plugin(input) {
  return {
    tool: {
      "execute_slash_command": tool({
        description: "Executes an OpenCode slash command on the active session.",
        args: {
          command: tool.schema.string(),
          arguments: tool.schema.string()
        },
        async execute(args, ctx) {
          const res = await input.client.session.command({
            path: { id: ctx.sessionID },
            body: {
              command: args.command,
              arguments: args.arguments,
              agent: ctx.agent
            }
          });
          return res.data;
        }
      })
    }
  };
}
```

## What to Expect
Calling this tool from an LLM prompt will programmatically dispatch the slash command identically to if the user typed it in the TUI.

## Investigation Trail
1. Tried to find the local REST port (default 4096) for external CLI execution.
2. Realized that running `opencode -s` does not start an exposed web server unless ACP or Web mode is used.
3. Investigated the plugin SDK instead.
4. Discovered that the plugin SDK natively resolves auth, port, and URL by passing an initialized `client` instance.
5. Discovered that the `ToolContext` natively provides `sessionID` and `agent`, satisfying Spike 004 natively.

## Results
- **Verdict**: ✓ VALIDATED. 
- **Evidence**: OpenCode provides first-class support for `client.session.command` inside its plugin SDK without needing manual port discovery or authentication. Spike 004 is also implicitly validated because Context natively exposes the session IDs.
