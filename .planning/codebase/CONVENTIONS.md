# Coding Conventions

**Analysis Date:** 2026-04-22

## Naming Patterns

**Files:**
- kebab-case for all source and test files: `delegation-manager.ts`, `tool-response.ts`, `in-memory-client.ts`
- `.test.ts` suffix for test files mirroring source: `src/lib/helpers.ts` → `tests/lib/helpers.test.ts`

**Functions:**
- camelCase for all functions: `buildPromptText`, `extractAssistantText`, `reserveSubagentSpawn`
- Factory functions use `create` prefix: `createDelegateTaskTool`, `createCoreHooks`, `createInMemoryClient`
- Guard functions use `is` or `can` prefix: `isObject`, `isTerminal`, `canTransition`, `isSuccess`
- Builders use `build` prefix: `buildPromptText`, `buildDelegationQueueKey`, `buildNotificationMessage`

**Variables:**
- camelCase for local variables and parameters
- UPPER_SNAKE_CASE for constants: `MAX_DESCENDANTS_PER_ROOT`, `DEFAULT_SAFETY_CEILING_MS`, `STABILITY_THRESHOLD`, `VALID_DELEGATION_CATEGORIES`
- camelCase for class properties: `delegations`, `safetyTimers`, `lanes`

**Types:**
- PascalCase for all types and interfaces: `DelegationManager`, `SessionContinuityMetadata`, `ToolResponse`, `SpawnReservation`
- `type` aliases for unions and simple shapes: `type TaskStatus = "pending" | "queued" | ...`
- `interface` for object contracts with methods: `interface SpawnReservation { release(): void; rollback(): void }`

**Classes:**
- PascalCase: `DelegationManager`, `DelegationConcurrencyQueue`, `CompletionDetector`, `TaskStateManager`

## Code Style

**Formatting:**
- No dedicated Prettier or ESLint config detected — relies on TypeScript compiler strictness
- 2-space indentation throughout
- Semicolons: inconsistent — some files use them, some don't
- Trailing commas: used in multi-line arrays and object literals

**TypeScript strictness:**
- `strict: true` in `tsconfig.json`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `verbatimModuleSyntax: true` — use `import type` for type-only imports

**Module size target:** 500 LOC max per file (from AGENTS.md)

## Import Organization

**Order:**
1. External packages (SDK, zod): `import { tool } from "@opencode-ai/plugin/tool"`
2. Relative imports from `../lib/`, `../shared/`: `import type { DelegationManager } from "../lib/delegation-manager.js"`
3. Sibling imports: `import { error, success } from "../shared/tool-response.js"`

**Path conventions:**
- All imports use explicit `.js` extension (ESM requirement with `verbatimModuleSyntax`): `import { unwrapData } from "./helpers.js"`
- `import type` for type-only imports: `import type { PermissionRule } from "./types.js"`
- Namespace imports for module spying in tests: `import * as sessionApi from "../../src/lib/session-api.js"`

**Path aliases:** None configured. All imports are relative.

## Error Handling

**Patterns:**
- **`[Harness]` prefix on all thrown errors** — flow control marker, not bugs:
  ```typescript
  throw new Error("[Harness] Concurrency acquire timed out for key ...")
  throw new Error(`[Harness] Invalid agent: "${agent}". Available: [${names.join(", ")}]`)
  ```
- Error extraction from SDK responses via `extractSdkErrorMessage()` in `src/lib/helpers.ts` — handles multiple SDK error shapes (named errors, validation arrays, direct messages)
- `unwrapData()` in `src/lib/helpers.ts` — unwraps `{ data: ... }` or throws on `{ error: ... }`
- Tool-level try/catch with `renderToolResult(error(message))` pattern in `src/tools/delegate-task.ts` and `src/tools/delegation-status.ts`
- **No `any` types on new code** — `client: any` is known tech debt from SDK

**Error types:**
- All errors use `Error` class — no custom error subclasses
- Error messages are human-readable strings, never raw objects

## Logging

**Framework:** None — no logging library detected

**Patterns:**
- No explicit logging in source code
- Errors surface through tool result envelopes (`kind: "error"`)
- Continuity store persists state to disk — acts as audit trail
- Test output via vitest is the primary feedback mechanism

## Comments

**When to Comment:**
- JSDoc on exported functions with non-obvious behavior: `extractAssistantText`, `reserveSubagentSpawn`
- Section dividers using `// ---` or `// ----` with descriptive labels:
  ```typescript
  // ---------------------------------------------------------------------------
  // Unified lifecycle status model
  // ---------------------------------------------------------------------------
  ```
- Inline comments for non-obvious decisions: `// Bug F3: graceful no-op`, `// Clean up`
- Architecture rationale in mapping tables (see `src/lib/types.ts` lines 117-135)

**JSDoc/TSDoc:**
- Used on key exported functions: `@param`, `@returns` tags
- `@internal` for test-exposed internals: `/** @internal Test compatibility — proxies to ... */`
- `@module` for barrel file documentation: `@module tools/prompt-skim`

## Function Design

**Size:** Most functions are 10-30 lines. Largest: `buildPromptText` (~50 lines), `extractSdkErrorMessage` (~45 lines)

**Parameters:**
- Single object parameter for functions with 3+ args: `buildPromptText(args: { description, prompt, category?, ... })`
- Individual parameters for 1-2 args: `isObject(value: unknown)`, `asString(value: unknown)`
- Optional parameters with `?` and defaults: `timeoutMs?: number`, `maxDescendants: number = MAX_DESCENDANTS_PER_ROOT`

**Return Values:**
- `undefined` for "not found" / "no result" cases: `asString()`, `getNestedValue()`
- Typed envelopes for tool results: `ToolResponse<T>` with `kind: "success" | "error" | "pending"`
- JSON strings for tool execute output: `renderToolResult()` → `JSON.stringify(result, null, 2)`

## Module Design

**Exports:**
- Default export for plugin composition: `export default HarnessControlPlane` in `src/plugin.ts`
- Named exports for all library modules
- Barrel files for tool packages: `src/tools/prompt-skim/index.ts` re-exports from `./tools.js` and `./types.js`

**Factory pattern:**
- Hook factories: `createCoreHooks(deps)`, `createSessionHooks(deps)`, `createToolGuardHooks(deps)`
- Tool factories: `createDelegateTaskTool(manager)`, `createDelegationStatusTool(manager)`
- Manager constructors: `new DelegationManager(client, options)`

**Dependency injection:**
- Constructor injection for managers: `DelegationManager` receives `client` and `options`
- Dependency bundles for hooks: `HookDependencies` object passed to factories
- Callback objects for handler composition: `CommandDelegationHandler` receives callback map

**Singletons:**
- `taskState` — exported singleton in `src/lib/state.ts`
- `storeCache` — module-level cache in `src/lib/continuity.ts` (prevents isolated unit testing)

---

*Convention analysis: 2026-04-22*
