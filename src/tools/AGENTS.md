# src/tools/ — Agent-Callable Tools (Write-Side CQRS)

Custom tools exposed to agents during sessions. These are the **only** write-side surfaces.

## Boundary

Each tool subdirectory follows: `tools.ts` (implementation), `types.ts` (args + contracts), `index.ts` (barrel).

## Audit Findings (2026-03-16)

> [!NOTE]
> The six current tool implementations now define `args` with `tool.schema`. The remaining contract-quality work is consistency and coverage, not initial Zod adoption.

> [!NOTE]
> Common helper duplication was removed by extracting shared JSON/list helpers into `src/shared/tool-helpers.ts`. Keep future helper reuse there instead of reintroducing per-tool copies.

> [!NOTE]
> Direct tool instantiation and runtime-tool assertions are local evidence. They do not, by themselves, prove behavior through the live OpenCode server/client/plugin boundary.

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
| `context` | `string` | Manual worktree resolution |
| `context.abort` | `AbortSignal` | Custom timeout logic |
| `context.metadata()` | `function` | Manual metadata attachment |
| `context.ask()` | `function` | Custom permission patterns |

## Tool Inventory

| Tool | Directory | Status |
|------|-----------|--------|
| `hivemind_task` | `task/` | ✅ Structured, `tool.schema` args live in `tools.ts` |
| `hivemind_trajectory` | `trajectory/` | ✅ Structured, `tool.schema` args live in `tools.ts` |
| `hivemind_handoff` | `handoff/` | ✅ Structured, `tool.schema` args live in `tools.ts` |
| `hivemind_doc` | `doc/` | ✅ Read-only markdown-first doc tool |
| `hivemind_runtime_status` | `runtime/` | ✅ Extracted runtime tool |
| `hivemind_runtime_command` | `runtime/` | ✅ Extracted runtime tool |

## Rules

- ~300 LOC limit per tool implementation
- Every arg must have `.describe()` for agent introspection
- Return `JSON.stringify()` — tools speak JSON, agents parse
- No direct file I/O to `.hivemind/` — delegate to `core/` modules
- Runtime tools are the durable gateway that future supervisor actions must call instead of mutating state directly
- `hivemind_runtime_status` is now the additive inspection seam for schema-kernel lifecycle records and sdk-supervisor health summaries
- Keep readiness/status tooling distinct from live OpenCode contract probes in docs, plans, and completion claims
