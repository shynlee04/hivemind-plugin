# src/tools/ — Agent-Callable Tools (Write-Side CQRS)

Custom tools exposed to agents during sessions. These are the **only** write-side surfaces.

## Boundary

Each tool subdirectory follows: `tools.ts` (implementation), `types.ts` (args + contracts), `index.ts` (barrel).

## Audit Findings (2026-03-15)

> [!CAUTION]
> **Zero Zod validation** exists in any tool. All args use raw TypeScript interfaces. The SDK provides `tool.schema` (re-exported Zod) specifically for this — it MUST be used.

> [!WARNING]
> `parseList()` and `render()` helper functions are **duplicated** identically across `handoff/tools.ts`, `task/tools.ts`, and `trajectory/tools.ts`. Extract to `shared/tool-helpers.ts`.

### Required Pattern (Every Tool)

```typescript
import { tool } from '@opencode-ai/plugin'
const s = tool.schema  // this IS zod

export function createHivemindXxxTool(projectRoot: string) {
  return tool({
    description: 'Clear, agent-facing description of what this tool does',
    args: {
      action: s.enum(['create', 'list', 'get']).describe('Operation to perform'),
      id: s.string().optional().describe('Record identifier'),
      // ... all args with .describe() for agent introspection
    },
    async execute(args, context) {
      // USE context.sessionID, context.agent, context.directory
      // NOT custom session resolution
      return JSON.stringify({ status: 'success', data: result })
    }
  })
}
```

### What `ToolContext` Gives You (Use It)

| Property | Type | Use Instead Of |
|----------|------|----------------|
| `context.sessionID` | `string` | Custom session tracking |
| `context.agent` | `string` | Agent name resolution |
| `context.directory` | `string` | `process.cwd()` or hardcoded paths |
| `context.worktree` | `string` | Manual worktree resolution |
| `context.abort` | `AbortSignal` | Custom timeout logic |
| `context.metadata()` | `function` | Manual metadata attachment |
| `context.ask()` | `function` | Custom permission patterns |

## Tool Inventory

| Tool | Directory | Status |
|------|-----------|--------|
| `hivemind_task` | `task/` | ✅ Structured, needs Zod migration |
| `hivemind_trajectory` | `trajectory/` | ✅ Structured, needs Zod migration |
| `hivemind_handoff` | `handoff/` | ✅ Structured, needs Zod migration |
| `hivemind_runtime_status` | ⚠️ `plugin/` (inline) | Extract to `runtime/` |
| `hivemind_runtime_command` | ⚠️ `plugin/` (inline) | Extract to `runtime/` |

## Rules

- ~300 LOC limit per tool implementation
- Every arg must have `.describe()` for agent introspection
- Return `JSON.stringify()` — tools speak JSON, agents parse
- No direct file I/O to `.hivemind/` — delegate to `core/` modules
