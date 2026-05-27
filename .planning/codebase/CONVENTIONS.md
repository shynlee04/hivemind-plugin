# Coding Conventions

**Analysis Date:** 2026-05-28

## Naming Patterns

**Files:**
- Kebab-case for all source files: `src/shared/helpers.ts`, `src/tools/delegation/delegate-task.ts`
- Test files match source with `.test.ts` suffix: `tests/lib/helpers.test.ts`
- Index files for module exports: `src/shared/index.ts`, `src/tools/index.ts`

**Functions:**
- camelCase for all functions: `getNestedValue`, `unwrapData`, `createDelegateTaskTool`
- Factory functions prefixed with `create`: `createCoreHooks`, `createDelegateTaskTool`
- Private helper functions prefixed with underscore or kept unexported: `extractSdkErrorMessage`

**Classes:**
- PascalCase for class names: `DelegationManager`, `CompletionDetector`, `SessionTracker`
- Single responsibility: each class owns one domain concern

**Types:**
- PascalCase for type aliases: `TaskStatus`, `PendingNotification`, `DelegationMeta`
- PascalCase for interfaces: `DelegationModuleSetupOptions`, `DelegationModuleSetup`
- Suffix type unions with `Type` when ambiguous: `SessionStatusType`, `DelegationNotificationType`

**Variables:**
- camelCase for variables: `sessionTracker`, `delegationManager`
- UPPER_SNAKE_CASE for constants: `MAX_DESCENDANTS_PER_ROOT`, `WATCH_TIMEOUT_MS`

## Code Style

**Formatting:**
- No Prettier/ESLint config detected — follow existing patterns
- 2-space indentation (observed in source files)
- Single quotes for strings in TypeScript, double quotes in JSON
- Trailing commas in multi-line arrays/objects

**Linting:**
- TypeScript strict mode enforced via `tsconfig.json`: `"strict": true`
- Additional strictness: `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noImplicitReturns": true`
- `"verbatimModuleSyntax": true` — use `import type` for type-only imports

## Import Organization

**Order:**
1. External packages: `@opencode-ai/plugin`, `@modelcontextprotocol/sdk`, `zod`
2. Node built-ins: `node:fs`, `node:path`
3. Internal shared modules: `./shared/types.js`, `./shared/helpers.js`
4. Feature modules: `./coordination/delegation/manager.js`
5. Type-only imports: `import type { ... } from "..."`

**Path Aliases:**
- None — all imports use relative paths with `.js` extensions
- Example: `import { createHarnessLifecycleManager } from "./task-management/lifecycle/index.js"`

## Error Handling

**Patterns:**
- All thrown errors prefixed with `[Harness]`: `throw new Error(\`[Harness] ${message}\`)`
- Error extraction from SDK responses via `unwrapData()` function
- Best-effort operations use try/catch with silent failures: `try { ... } catch { break }`
- Logging via `client.app?.log?.()` with service name and level

**Example:**
```typescript
// From src/shared/helpers.ts
export function unwrapData<T = unknown>(response: unknown): T {
  if (isObject(response) && "error" in response && response.error) {
    const error = response.error
    const message = extractSdkErrorMessage(error)
    throw new Error(`[Harness] ${message}`)
  }
  // ...
}
```

## Documentation

**JSDoc Patterns:**
- All exported functions have JSDoc comments with `@param` and `@returns`
- Complex functions include usage examples
- Module-level comments describe purpose and architecture

**Example:**
```typescript
/**
 * Extract the text content of the last assistant message from an array of
 * session messages.
 *
 * Searches backward from the end of the array. The first message whose role
 * is `"assistant"` (checked at `info.role` first, then top-level `role`) is
 * selected.
 *
 * @param messages - Array of session messages
 * @returns The extracted assistant text, or empty string if none found
 */
export function extractAssistantText(messages: unknown[]): string {
```

## Git Commit Discipline

**Format:** `phase: what changed — why it matters`
- Examples: `phase: add delegation status tool — enables monitoring of child sessions`
- Atomic commits: one logical change per commit
- Documentation changes committed separately

## Module Design

**Exports:**
- Barrel files (`index.ts`) re-export public API from each module
- `src/index.ts` aggregates all public exports from the package
- Plugin entry point: `src/plugin.ts` exports `HarnessControlPlane`

**Module Size:**
- Target: max 500 LOC per module
- Larger modules split into subdirectories: `src/coordination/delegation/` contains multiple focused files

## Type Constraints

**No `any` types:**
- Use `unknown` for untyped data: `function isObject(value: unknown)`
- Explicit type assertions with `as`: `return response.data as T`
- Generic type parameters for flexible APIs: `unwrapData<T = unknown>(response: unknown): T`

**TypeScript Features:**
- ES2022 target with NodeNext module resolution
- Declaration files generated for package consumers
- Source maps for debugging

## Special Patterns

**Dependency Injection:**
- Classes accept dependencies via constructor options: `new DelegationManager(client, options)`
- Factory functions receive dependencies as parameters: `createCoreHooks(deps)`

**Async Patterns:**
- Fire-and-forget for non-blocking operations: `void sessionTracker.initialize().catch(...)`
- Explicit `Promise<void>` return types for async functions
- `AbortController` for cancellation support

**State Management:**
- Dual-layer state: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`)
- Deep-clone-on-read for continuity store
- Session continuity via `getSessionContinuity`, `patchSessionContinuity`

---

*Convention analysis: 2026-05-28*