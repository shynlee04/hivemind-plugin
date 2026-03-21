# Coding Conventions

**Analysis Date:** 2026-03-21

## Naming Patterns

**Files:**
- **Hyphenated lowercase:** `tool-helpers.ts`, `opencode-agent-registry.ts`, `workflow-continuity.ts`
- **Descriptive module names:** `runtime-observability`, `agent-work-contract`, `workflow-management`
- **Type definitions in `types.ts`:** Each tool directory has `tools.ts`, `types.ts`, `index.ts`

**Functions:**
- **camelCase:** `createHivemindRuntimeStatusTool`, `executeHivemindHandoffAction`, `renderToolResult`
- **Verb-noun patterns:** `bootstrapTrajectoryLedger`, `loadRuntimeBindingsSnapshot`, `resolveStartWork`
- **Action-oriented:** `parseList`, `renderToolResult`, `createSnapshot`

**Variables:**
- **camelCase:** `projectRoot`, `sessionId`, `trajectoryId`, `workflowId`
- **Descriptive:** `sessionScope`, `purposeClass`, `lineage`, `readiness`

**Types:**
- **PascalCase for interfaces:** `HivemindRuntimeCommandArgs`, `HivemindHandoffToolArgs`, `RuntimeBindingsSnapshot`
- **Enum values lowercase:** `'create'`, `'read'`, `'list'`, `'update'`, `'close'`

## Code Style

**Formatting:**
- **Tool:** No ESLint config detected (`.eslintrc*` or `eslint.config.*` not found)
- **TypeScript:** `tsconfig.json` with strict mode enabled (`"strict": true`)
- **Indentation:** 2-space JSON output in `renderToolResult()`
- **Line length:** No enforced limit visible, but files typically under 300 LOC

**Linting:**
- **TypeScript compiler gate:** `npm run typecheck` runs `tsc --noEmit` before commit
- **No linter configured:** Code relies on TypeScript compiler for validation
- **Strict mode enabled:** All type errors caught at compile time

**TypeScript Config:**
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true
}
```

## Import Organization

**Order:**
1. Node.js built-ins: `import { mkdtemp, rm } from 'node:fs/promises'`
2. Third-party dependencies: `import { tool } from '@opencode-ai/plugin/tool'`
3. Internal modules: `import { loadTrajectoryLedger } from '../core/index.js'`
4. Types: `import type { RuntimeBindingsSnapshot } from './types.js'`

**Path Aliases:**
- **No path aliases configured:** Direct relative imports used (`../core/index.js`)
- **Consistent relative paths:** All modules use consistent directory structure

**Type imports:**
- **Separate type imports:** `import type { HivemindRuntimeStatusPayload } from './types.js'`
- **Value imports mixed with types:** Common pattern in tool files

## CQRS Enforcement (Critical Pattern)

**Rule:** Tools write, hooks read. No exceptions.

**Tool Side (`src/tools/`):**
- **Write operations only:** All tools perform state mutations via delegated functions
- **No direct file I/O to `.hivemind/`:** Tools delegate to `core/` modules
- **Tool definition pattern:**
```typescript
export function createHivemindXxxTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description: 'Clear agent-facing description',
    args: {
      action: s.enum(['create', 'list', 'get']).describe('Operation'),
      id: s.string().optional().describe('Record identifier'),
    },
    async execute(args, context) {
      // USE context.sessionID, context.agent, context.directory
      // DELEGATE writes to core/ features
      const result = await executeFeatureAction(projectRoot, args, {
        sessionID: context.sessionID,
        agent: context.agent,
      })
      return renderToolResult(result)
    },
  })
}
```

**Hook Side (`src/hooks/`):**
- **Read/inject/intercept only:** No durable writes
- **Context injection via `Part` objects:** Hooks inject context, never return values
- **Event observation:** Hook `event-handler.ts` observes but does not mutate state

**Anti-Patterns:**
- **Never** import from `core/session/kernel.ts` - removed in L1 cutover
- **Never** import from `shared/event-bus.ts` - use SDK `event` hook
- **Never** write to `.hivemind/` in hooks - violates CQRS boundary
- **Never** define hooks as inline in `opencode-plugin.ts` - extract to `src/hooks/`

## JSDoc Standards

**When Required:**
- **All exported functions:** Every export has JSDoc with `@param`, `@returns`, `@example`
- **Tool functions:** Document description, args, context usage
- **Complex helpers:** Document behavior with examples

**Pattern from `src/shared/tool-helpers.ts`:**
```typescript
/**
 * Parse a comma-separated string into a trimmed, non-empty array.
 * @param value - Comma-separated string (e.g. "a, b, c")
 * @returns Array of trimmed non-empty strings
 * @example parseList('a, b, c') // ['a', 'b', 'c']
 */
export function parseList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
```

**Module-level JSDoc:**
```typescript
/**
 * Runtime tools — extracted from inline definitions in opencode-plugin.ts
 *
 * These tools provide runtime status inspection and command execution
 * against HiveMind revamp runtime.
 */
```

## Error Handling

**Patterns:**
- **Tool responses:** Use `{ status: 'success' | 'error', message, data }` pattern
- **Shared helpers:** `error()` and `success()` from `src/shared/tool-response.js`
- **Early returns:** Hooks use early returns to skip processing
- **No silent failures:** All errors surface with messages

**Error response pattern:**
```typescript
if (result.kind === 'error') {
  return render(error(result.message))
}
return render(success(result.message, result.data))
```

## Logging

**Framework:** Mixed approach
- **Console:** `console.log()` used in feature modules
- **Client logging:** `client.app.log()` for structured server-side logging
- **TUI notifications:** `client.tui.showToast()` with cooldown tracking in hooks

**Logging convention:**
- **Dev logging:** Custom `log()` functions in `src/shared/logging.ts`
- **Production:** Use `client.app.log()` for persistence
- **Toast notifications:** Lightweight, non-blocking user feedback

## Comments

**When to Comment:**
- **Module headers:** Every major file has header comment describing purpose
- **Complex logic:** Algorithm explanations for readability
- **Migration markers:** Comments explaining removed/deprecated patterns

**Inline documentation:**
```typescript
// Use SDK hooks for event handling - no custom EventBus needed
// See Authority Principle: each concern has ONE owner
```

## Function Design

**Size:** Target ~300 LOC limit per module
- **Tools:** Most tool files under 100 lines (max: 111 lines for types)
- **Hooks:** Typically under 200 lines
- **Helpers:** Concise utilities (44 lines in `tool-helpers.ts`)

**Parameters:**
- **Context object:** Every hook/tool receives `ToolContext` with `sessionID`, `agent`, `directory`
- **Project root:** Passed as `projectRoot` to avoid hardcoded paths
- **No direct path construction:** Use `getEffectivePaths()` from `src/shared/paths.ts`

**Return Values:**
- **Tools:** Always return `JSON.stringify()` output for LLM parsing
- **Hooks:** Never return values - inject via side effects only
- **Feature modules:** Return `{ kind: 'success' | 'error', ... }` result objects

## Module Design

**Exports:**
- **Named exports preferred:** `export function createXxxTool()`, `export function parseList()`
- **Barrel files:** Each directory has `index.ts` re-exporting all public exports
- **Type-only exports:** `export type { XxxArgs } from './types.js'`

**Barrel pattern:**
```typescript
// src/tools/index.ts
export { createHivemindTaskTool } from './task/index.js'
export { createHivemindTrajectoryTool } from './trajectory/index.js'
export { createHivemindHandoffTool } from './handoff/index.js'
```

## Cross-Cutting Concerns

**Path Resolution:**
- **Authority:** `src/shared/paths.ts` owns all path constants
- **Helper:** `getEffectivePaths(projectRoot)` derives all runtime paths from single root
- **Never hardcode:** `.hivemind/`, `.opencode/` paths - use path builders

**Context Injection:**
- **Governance layer:** `src/context/` compiles prompt packets
- **System transforms:** `src/hooks/context-injection/` builds governance packets
- **Part objects:** Hooks create `Part` objects for message history injection

**SDK Usage Authority:**
- **Tools:** Must use `tool.schema` (Zod re-export) for args
- **Context:** Use `context.sessionID`, `context.agent`, `context.directory` from `ToolContext`
- **No custom session tracking:** Never implement custom session resolution - use SDK

---

*Convention analysis: 2026-03-21*
