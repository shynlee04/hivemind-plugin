# Session Inspection Export

- ses_id: `ses_2d9f21729ffeYKRAH0YeBE4ODV`
- prepared_at: `2026-03-25T17:32:59.199Z`

## Assistant Output

Here is the complete tool creation pattern used in this codebase.

---

## Tool Structure: 3-File Convention

Each tool lives in `src/tools/<name>/` with:

| File | Purpose |
|------|---------|
| `index.ts` | Barrel re-export of types + tools |
| `tools.ts` | Tool definition (Zod args, `execute()`, factory export) |
| `types.ts` | TypeScript interfaces, action unions, pressure contracts |

---

## `index.ts` — Barrel Export

**File:** `src/tools/task/index.ts` (2 lines)

```ts
export * from './types.js'
export * from './tools.js'
```

---

## `tools.ts` — Tool Definition

**File:** `src/tools/task/tools.ts` (42 lines)

The pattern:

```ts
import { tool } from '@opencode-ai/plugin/tool'
import { executeHivemindTaskAction } from '../../features/workflow/task.js'
import { error, success } from '../../shared/tool-response.js'
import { renderToolResult as render } from '../../shared/tool-helpers.js'
import type { HivemindTaskToolArgs } from './types.js'

export function createHivemindTaskTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description: 'Canonical task and subtask authority for HiveMind workflows. ...',
    args: {
      action: tool.schema.enum(['create', 'list', 'get', 'activate', 'rotate', 'verify', 'complete'])
        .describe('Task authority action to perform'),
      workflowId: tool.schema.string().optional().describe('Workflow identifier that owns the task'),
      taskId: tool.schema.string().optional().describe('Task identifier to inspect or mutate'),
      // ... all args use tool.schema (Zod) with .describe() on every field
    },
    async execute(args: HivemindTaskToolArgs, context) {
      // 1. Delegate business logic to a feature module
      const result = executeHivemindTaskAction(projectRoot, args, {
        sessionID: context.sessionID,
      })
      // 2. Error path
      if (result.kind === 'error') {
        return render(error(result.message, result.details))
      }
      // 3. Attach metadata if present
      if (result.metadata) {
        context.metadata(result.metadata)
      }
      // 4. Success path — always JSON
      return render(success(result.message, result.data))
    },
  })
}
```

Key observations:

1. **Factory function** — `createHivemindXxxTool(projectRoot)` returns a `tool()` instance. The `projectRoot` is injected at plugin assembly time.
2. **`tool.schema` IS Zod** — `tool.schema.string()`, `.enum()`, `.number()`, `.optional()`, `.describe()` are all Zod methods re-exported by the SDK.
3. **Every arg has `.describe()`** — Required for agent introspection.
4. **`execute(args, context)` receives `context`** with `sessionID`, `agent`, `directory`, `worktree`, `abort`, `metadata()`, `ask()`.
5. **Return value is always `JSON.stringify()`** — via `renderToolResult()` (2-space indent).
6. **Business logic is delegated** — `executeHivemindTaskAction()` lives in `src/features/workflow/task.js`, keeping the tool file thin (~42 lines).

---

## `types.ts` — TypeScript Contracts

**File:** `src/tools/task/types.ts` (33 lines)

```ts
export type HivemindTaskAction = 'create' | 'list' | 'get' | 'activate' | 'rotate' | 'verify' | 'complete'

export interface HivemindTaskToolArgs {
  action: HivemindTaskAction
  workflowId?: string
  taskId?: string
  title?: string
  kind?: 'task' | 'subtask'
  parentTaskId?: string
  dependencyIds?: string
  verificationContractId?: string
  evidenceRefs?: string
}

export const taskActionPressureContracts: Record<HivemindTaskAction, RuntimePressureContract> = {
  create: getRuntimePressureContract('task-mutation'),
  list: getRuntimePressureContract('steady-state'),
  // ...
}
```

---

## Shared Utilities

| File | Exports | Purpose |
|------|---------|---------|
| `src/shared/tool-response.ts` | `success()`, `error()`, `pending()`, `ToolResponse` | Standard `{ status, message, data }` response envelope |
| `src/shared/tool-helpers.ts` | `parseList()`, `parseJsonArray()`, `renderToolResult()` | Comma parsing, JSON parsing, pretty-print JSON output |

---

## Summary of the Pattern

```
Tool factory(projectRoot) 
  → tool({ description, args: { ...tool.schema.*.describe() }, execute(args, context) })
    → delegates to feature module for business logic
    → returns renderToolResult(success(...)) or renderToolResult(error(...))
    → context.sessionID / context.metadata() used for runtime integration
```