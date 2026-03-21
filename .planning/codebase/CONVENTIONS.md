# Coding Conventions

**Analysis Date:** 2026-03-21

## Language & Build

**TypeScript:** ES2022 target, NodeNext module resolution
- Config: `tsconfig.json`
- Strict mode enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- JSX: react-jsx with `@opentui/react` import source
- ESM throughout — all imports use `.js` extensions

## Naming Conventions

**Files:**
- Type definitions: `*.types.ts` (e.g., `contract-store.types.ts`)
- Test files: `*.test.ts` (co-located with source or in `tests/`)
- Index barrels: `index.ts`
- Tools: `tools.ts` for implementation

**Functions & Variables:**
- camelCase: `createHivemindTaskTool`, `resolveStartWork`, `parseList`
- Factory functions: `create*` prefix (e.g., `createAgentWorkClassifyIntentTool`)

**Types & Classes:**
- PascalCase: `ContractStore`, `ToolResponse<T>`, `AgentWorkContract`
- Interface prefixes avoided (not `IToolResponse`)

**Constants:**
- SCREAMING_SNAKE_CASE for module-level constants: `HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID`
- PascalCase for enum members: `PurposeClass.project-driven`

## Code Style

**Formatting:** Not enforced by automated tools (no ESLint/Prettier/Biome found)
- Manual formatting consistent with TypeScript idioms
- 2-space indentation observed in source

**TypeScript:**
- Always use explicit types for function parameters and return values
- Use `type` alias for simple shapes, `interface` for complex/extensible types
- Generic types preferred: `ToolResponse<T>`, `parseJsonArray<T>`

**Imports:**
- ESM with `.js` extensions: `import { foo } from './foo.js'`
- Absolute imports from package: `import { tool } from '@opencode-ai/plugin/tool'`
- Barrel exports: `export * from './types.js'`
- Sorted logically (stdlib → external → internal)

## JSDoc Standards

**Required on exported functions:**
```typescript
/**
 * Parse a comma-separated string into a trimmed, non-empty array.
 * @param value - Comma-separated string (e.g. "a, b, c")
 * @returns Array of trimmed non-empty strings
 * @example parseList('a, b, c') // ['a', 'b', 'c']
 * @example parseList(undefined)  // []
 */
export function parseList(value?: string): string[] { ... }
```

**File-level docstrings for modules:**
```typescript
/**
 * Contract Store Tests
 *
 * Tests for the contract store engine component.
 * Validates CRUD operations, atomic writes, and persistence.
 *
 * @module agent-work-contract/engine/contract-store.test
 */
```

## Function Design

**Size:** ~300 LOC maximum per tool/hook implementation
- Single responsibility per function
- Complex orchestration split across helper modules (e.g., `start-work-router-helpers.ts`)

**Parameters:**
- Typed inputs required (no `any`)
- Context objects for related params: `execute(args, context)` where context is ToolContext

**Return Values:**
- Tools return `JSON.stringify()` output
- Use `ToolResponse<T>` factory: `success()`, `error()`, `pending()`
- Never return raw objects from tools

## Error Handling

**Pattern:**
```typescript
// For Zod validation failures
const parsed = toolSchema.schema.object(tool.args).safeParse(...)
if (!parsed.success) {
  return render(error('Validation failed', parsed.error))
}

// For operations that may throw
try {
  await store.create(contract)
} catch {
  return []
}
```

**Assertion in tests:**
```typescript
assert.equal(parsed.success, false)
assert.rejects(async () => store.update('non-existent', {...}), /not found/)
```

## Module Patterns

**Barrel exports (index.ts):**
```typescript
export * from './types.js'
export * from './tools.js'
```

**Tool definition pattern (CQRS write-side):**
```typescript
import { tool } from '@opencode-ai/plugin/tool'
const s = tool.schema  // Zod re-export

export function createHivemindTaskTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description: 'Clear, agent-facing description...',
    args: {
      action: s.enum(['create', 'list', 'get']).describe('Operation to perform'),
      id: s.string().optional().describe('Record identifier'),
    },
    async execute(args, context) {
      // Use context.sessionID, context.agent, context.directory
      return JSON.stringify({ status: 'success', data: result })
    },
  })
}
```

**Hook pattern (CQRS read-side):**
```typescript
export function resolveStartWork(input: StartWorkInput): StartWorkDecision {
  // Pure function, no side effects
  // Return decision object with all routing information
}
```

## File Organization

```
src/
├── tools/              # Write-side tools (6 tools)
│   ├── task/
│   │   ├── index.ts    # Barrel export
│   │   ├── tools.ts    # Tool implementation
│   │   └── types.ts    # Args types
│   └── ...
├── hooks/              # Read-side interceptors
│   ├── start-work/
│   │   ├── index.ts
│   │   ├── start-work-router.ts
│   │   └── start-work-router-helpers.ts
│   └── ...
├── shared/             # Cross-cutting utilities
│   ├── tool-helpers.ts # parseList, parseJsonArray, renderToolResult
│   ├── tool-response.ts # ToolResponse<T> factory
│   └── ...
└── plugin/             # Assembly layer only
```

## Quality Gates

**Type checking:** `npx tsc --noEmit`
- Enforced: no unused locals, no unused params, strict returns

**Boundary checks:** `npm run lint:boundary` (custom shell scripts)
- SDK boundary enforcement
- Agent registry parity
- State write boundary

**Tests:** `tsx --test tests/*.test.ts`
- Node's built-in test runner

---

*Convention analysis: 2026-03-21*
