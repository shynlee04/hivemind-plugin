# Coding Conventions

**Analysis Date:** 2026-05-12

## Naming Patterns

**Files:**
- Kebab-case for all source files: `kebab-case.ts` — e.g., `tool-response.ts`, `delegation-persistence.ts`, `session-api.ts`
- Schema files: `kebab-case.schema.ts` — e.g., `hivemind-configs.schema.ts`, `prompt-enhance.schema.ts`
- Test files: `<module-name>.test.ts` — e.g., `helpers.test.ts`, `delegation-manager.test.ts`
- Barrel exports: `index.ts` for subdirectory modules
- Tool files: `src/tools/{tool-name}.ts` single file, or `src/tools/{tool-name}/index.ts` for multi-file tools
- Feature files: `src/features/{feature-name}/index.ts` barrel + `{feature-name}/types.ts` for contracts
- Hivemind tools prefixed: `hivemind-doc.ts`, `hivemind-trajectory.ts`, etc.
- Exception: `run-background-command.ts` (no hivemind- prefix)

**Classes:**
- PascalCase: `TaskStateManager` (`src/shared/state.ts:8`), `DelegationManager` (`src/coordination/delegation/manager.ts:73`), `CompletionDetector`, `SdkDelegationHandler`
- Factory functions use `create*` prefix: `createCoreHooks`, `createDelegateTaskTool`, `createHivemindDocTool`

**Functions:**
- camelCase: `isObject`, `getNestedValue`, `stableStringify`, `makeToolSignature`, `describeError` (all in `src/shared/helpers.ts`)
- Private module-level functions are camelCase: `extractSdkErrorMessage`, `buildDelegationPromptTools`, `resolveAcquireArgs`

**Variables:**
- camelCase: `runtimePolicy`, `projectDirectory`, `stateDir`, `ptyManager`
- Constants: UPPER_SNAKE_CASE — `DEFAULT_MAX_CHARACTERS` (`src/features/doc-intelligence/chunker.ts:4`), `WATCH_TIMEOUT_MS` (`src/plugin.ts:56`), `VALID_TASK_STATUSES` (`src/shared/task-status.ts:3`)
- Boolean flags: `isObject`, `requireEvidence` pattern

**Types:**
- PascalCase for interfaces and type aliases: `TaskStatus`, `ToolResponse<T>`, `PermissionRule`, `DelegationPacket`, `SessionContinuityRecord`
- Type params use single capital letter: `T` in `ToolResponse<T>`
- Inline types for small results: `type QueueContext = { ... }` (`src/coordination/delegation/manager.ts:32`)
- Type-only imports use `import type` syntax throughout

## Code Style

**TypeScript Config** (`tsconfig.json`):
- `strict: true` — full strict mode enabled
- `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`
- `verbatimModuleSyntax: true` — requires `import type` for type-only imports
- `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`
- `declaration: true`, `declarationMap: true`, `sourceMap: true`
- No `any` types on new code

**Formatting:**
- No Prettier or Biome detected — relies on TypeScript compiler and manual formatting discipline
- 2-space indentation observed throughout
- Semicolons required
- Trailing commas in multiline objects and arrays

**Linting:**
- No ESLint detected — type checking via `tsc` is the primary lint mechanism
- No Biome detected
- Run `npm run typecheck` (`tsc --noEmit`) for validation

**JSDoc/TSDoc:**
- Required on all exported functions and classes
- Uses `@param`, `@returns`, `@example` tags
- Module-level description with `@module` tag for barrel files
- Multi-line JSDoc with `/** ... */` style

```typescript
// From src/shared/tool-response.ts
/**
 * Create a success response.
 * @param message - Human-readable status message
 * @param data - Optional payload data
 * @param metadata - Optional diagnostic metadata
 */
export function success<T>(
  message: string,
  data?: T,
  metadata?: Record<string, unknown>,
): ToolResponse<T> {
  return { kind: "success", message, data, metadata }
}
```

## Import Organization

**Order:**
1. External/third-party imports (e.g., `@opencode-ai/plugin`, `node:fs`, `vitest`)
2. Internal project imports from `../../src/...` paths
3. Relative imports from sibling files

**Path Aliases:**
- No path aliases/barrels — all imports use relative ESM paths with `.js` extensions

**Patterns:**
- Type-only imports use `import type`:
```typescript
import type { Plugin } from "@opencode-ai/plugin"
import type { PermissionRule } from "./types.js"
```
- Value imports use regular `import`:
```typescript
import { DelegationManager } from "./manager.js"
import { vi } from "vitest"
```
- Wildcard imports for module-spying in tests:
```typescript
import * as configSubscriber from "../../src/config/subscriber.js"
```

**ESM imports:**
- All local imports include `.js` extension: `from "./helpers.js"`, not `from "./helpers"`
- Required by `verbatimModuleSyntax` + `NodeNext` module resolution

## Error Handling

**Pattern:**
1. **Tool-level try/catch**: Tools wrap `execute()` in try/catch, return error via `ToolResponse` envelope
```typescript
// From src/tools/hivemind/hivemind-doc.ts
async execute(rawArgs, _context): Promise<string> {
  try {
    const args = DocIntelligenceInputSchema.parse(rawArgs)
    return renderToolResult(success("Done", executeDocIntelligenceAction(args)))
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
    return renderToolResult(error(message))
  }
}
```

2. **`[Harness]` prefix**: All thrown errors from harness code use `[Harness]` prefix
```typescript
// From src/shared/helpers.ts
throw new Error(`[Harness] ${message}`)
```

3. **`describeError` helper**: Uniform error→string conversion
```typescript
// From src/shared/helpers.ts
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
```

4. **Standardized ToolResponse**: Tools communicate results via shared envelope
```typescript
// From src/shared/tool-response.ts
export type ToolResponse<T = unknown> = {
  kind: "success" | "error" | "pending"
  message: string
  data?: T
  metadata?: Record<string, unknown>
}
```

5. **Zod validation errors**: Schema parsing before tool execution, caught and returned as user-facing error messages

6. **Graceful fallback**: Config loading falls back to defaults on parse failure (`src/config/subscriber.ts`):
```typescript
// Missing or invalid config files return defaults (never crashes).
```

## Logging

**Framework:** No structured logging library detected — uses `console` in some modules, but primary feedback is via `ToolResponse` message field.

**Patterns:**
- Tool outputs rendered via `renderToolResult()` from `src/shared/tool-helpers.ts`
- Some modules use inline comments for debug documentation
- Runtime pressure tracking uses structured scoring, not logging

## Comments

**When to Comment:**
- JSDoc on all exported functions and classes
- `//` section dividers using `// ----` comment blocks:
```typescript
// ---------------------------------------------------------------------------
// TaskStateManager — encapsulates all in-process session/budget state.
// ---------------------------------------------------------------------------
```
- Inline comments for non-obvious logic, error shape patterns, design decisions
- Comments on config values with audit trail information (phase numbers, dates):
```typescript
// Phase 48.4.1 (audit 2026-04-30): added 'json-summary' so CI and
// future automation can parse coverage without scraping text output.
```

**JSDoc/TSDoc:**
- JSDoc on all public exports
- `@param` with types described after hyphen: `@param projectRoot - Absolute path to the project root directory.`
- `@returns` with description
- `@example` with TypeScript code block for usage
- `@module` tag on barrel/index files
- File header comment explaining module purpose

## Function Design

**Size:** No hard limit specified beyond module-level 500 LOC cap. Functions typically handle one responsibility.

**Parameters:**
- Named parameters via destructured objects for 3+ params or config bundles:
```typescript
export function buildPromptText(args: {
  description: string
  prompt: string
  category?: string
  scope?: string
  // ...
}): string
```
- 1-2 positional params for simple cases:
```typescript
export function stableStringify(value: unknown): string
```

**Return Values:**
- Synchronous functions for pure computation
- `async` functions for I/O, SDK calls, or tool execution
- Discriminated union return types (`ToolResponse.kind` as discriminator)
- `Promise<T>` for async operations
- `| undefined` return for nullable results (never `null`)

## Module Design

**Exports:**
- Named exports exclusively — no default exports in source files
- Barrel re-exports via `export { ... } from "./module.js"` or `export * from "./module.js"`
- Default export only for the plugin entry point: `export { HarnessControlPlane as default } from "./plugin.js"` (`src/index.ts:2`)

**Barrel Files:**
- `index.ts` in each subdirectory re-exports public API
- Used for multi-file tools: `src/tools/prompt/prompt-skim/index.ts`
- Used for features: `src/features/doc-intelligence/index.ts`

**Module Size:**
- Max 500 LOC per module (hard constraint from project rules)
- `src/coordination/delegation/manager.ts` at ~500 LOC is the reference upper bound
- `src/shared/helpers.ts` at 295 LOC, `plugin.ts` at 242 LOC

**Dependency Rules:**
- No circular imports
- `src/shared/` is leaf-like — never imports from tools, hooks, or deep modules
- Tools call features/delegation/state owners — never the reverse
- Hooks are read-only, never write state

## Tool Design Patterns

**Factory functions:**
```typescript
export function createHivemindDocTool(projectRoot: string): ReturnType<typeof tool> {
  // ...
  return tool({
    description: "...",
    args: { ... },
    async execute(rawArgs, context): Promise<string> {
      // schema parse → execute → render
    },
  })
}
```
- Tools import Zod schema from `src/schema-kernel/`
- Tools call feature/delegation modules — never duplicate deep logic
- Tools use `renderToolResult()` + `success()`/`error()` from `src/shared/`

## Test Conventions

**Setup/Teardown:**
- `beforeEach` for test setup (env vars, temp dirs, mock resets)
- `afterEach` for cleanup (mock restoration, temp dir removal, env var cleanup)
- `vi.resetModules()` / `vi.unmock()` for module isolation (`tests/lib/continuity.test.ts`)
- `vi.restoreAllMocks()` in `afterEach` for tool tests

**Assertions:**
- `expect()` from Vitest
- `.toBe()` for primitives, `.toEqual()` for objects/arrays
- `.resolves`/`.rejects` for async expectations
- `.toThrow()` with regex pattern for error messages: `toThrow(/^\[Harness\]/)`
- `expect.objectContaining()` for partial object matching
- `.toBeUndefined()`, `.toBe(true/false)`, `.toContain()`

---

*Convention analysis: 2026-05-12*
