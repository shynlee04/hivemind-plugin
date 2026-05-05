<!-- generated-by: gsd-doc-writer -->
# Coding Conventions

**Analysis Date:** 2026-04-28
**Updated:** 2026-05-06

## Naming Patterns

**Files:**
- **kebab-case** for all source and test files: `completion-detector.ts`, `delegation-manager.test.ts`, `tool-response.ts`
- **kebab-case** for directories: `src/lib/`, `tests/tools/`, `tests/lib/`, `src/schema-kernel/`
- Factory/creator files prefixed with `create-`: `create-core-hooks.ts`, `create-session-hooks.ts`
- Leaf modules use simple names: `helpers.ts`, `types.ts`, `state.ts`, `concurrency.ts`
- Test files mirror source names exactly with `.test.ts` suffix: `concurrency.test.ts` for `concurrency.ts`
- Barrel files always `index.ts`

**Functions:**
- **camelCase** for all functions: `buildDelegationQueueKey`, `unwrapData`, `canTransition`, `isTerminal`
- Boolean-returning functions prefixed with `is`, `can`, `has`: `isObject`, `isTerminal`, `canTransition`, `isSuccess`
- Factory/constructor functions prefixed with `create`: `createCoreHooks`, `createDelegateTaskTool`, `createConfigurePrimitiveTool`
- Private methods use `private` keyword (no underscore prefix convention)

**Variables:**
- **camelCase** for local variables and parameters: `sessionID`, `rootID`, `eventType`, `timeoutMs`
- Constants in **UPPER_SNAKE_CASE**: `MAX_DESCENDANTS_PER_ROOT`, `VALID_DELEGATION_CATEGORIES`, `WATCH_TIMEOUT_MS`, `VALID_LIFECYCLE_TRANSITIONS`
- Enum-like const arrays use `as const`: `VALID_DELEGATION_CATEGORIES = [...] as const`

**Types:**
- **PascalCase** for types and interfaces: `TaskStatus`, `CompletionResult`, `HookDependencies`, `DelegationMeta`
- Type aliases preferred over interfaces for simple shapes; interfaces used for dependency bundles (`HookDependencies`, `AutoLoopConfig`)
- Zod-inferred types use `z.infer<>`: `type DelegateTaskInput = z.infer<typeof DelegateTaskInputSchema>`
- Tool context types annotated with `/** @internal */` JSDoc tag when they depend on OpenCode framework injection

**Classes:**
- **PascalCase**: `CompletionDetector`, `TaskStateManager`, `DelegationConcurrencyQueue`, `SdkDelegationHandler`
- Singleton-style export: `export const taskState = new TaskStateManager()` with backward-compatible wrapper functions

## Code Style

**Formatting:**
- No formatter configuration detected — no `.eslintrc*`, `.prettierrc*`, or `biome.json` present
- Consistent 2-space indentation throughout
- Section separators use `// ----` comment blocks with descriptive headings:
  ```typescript
  // ---------------------------------------------------------------------------
  // TaskStateManager — encapsulates all in-process session/budget state.
  // ---------------------------------------------------------------------------
  ```
- Multi-line interface/type members aligned consistently; arguments indented 2 spaces

**Linting:**
- No explicit linter configured; TypeScript strict mode enforces most rules:
  - `strict: true` — all strict checks enabled
  - `noUnusedLocals: true` — unused variables are errors
  - `noUnusedParameters: true` — unused parameters must be removed
  - `noImplicitReturns: true` — all code paths must explicitly return
  - `noFallthroughCasesInSwitch: true` — no accidental switch fallthrough
  - `verbatimModuleSyntax: true` — `import type` required for type-only imports

## Import Organization

**Order:**
1. Node.js built-ins (`node:fs`, `node:os`, `node:path`)
2. External packages (`@opencode-ai/plugin`, `@opencode-ai/sdk`, `zod`, `vitest`)
3. Internal source modules (relative paths with `.js` extension per NodeNext module resolution in `tsconfig.json`)
4. `import type` always separated from runtime imports

**Path Aliases:**
- None used. All imports are relative: `../../src/lib/helpers.js`

**Typical import block from a test file (`tests/lib/continuity.test.ts`):**
```typescript
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { SessionContinuityRecord } from "../../src/lib/types.js"
```

## Error Handling

**Patterns:**
- All thrown errors prefixed with `[Harness]` — distinguishes harness errors from framework/OS errors
  ```typescript
  throw new Error(`[Harness] Root session ${rootID} exceeded descendant budget (${maxDescendantsPerRoot})`)
  ```
- Tool errors wrapped using the `error()` factory from `src/shared/tool-response.ts` — returns a `ToolResponse` envelope rather than throwing:
  ```typescript
  return renderToolResult(error(message))
  ```
- `unwrapData()` in `src/lib/helpers.ts` extracts data from SDK response shapes, throws on error
- `extractSdkErrorMessage()` handles multiple SDK error shapes (named errors, validation arrays, direct messages)
- `describeError()` for generic error-to-string conversion: `error instanceof Error ? error.message : String(error)`
- Best-effort operations wrapped in try/catch with silent consumption (e.g., `plugin.ts` line 78-80, eventTracker artifacts projection)

**Error propagation:**
- Tools return `renderToolResult(error(...))` rather than throwing — errors are serialized in tool response envelope
- Delegation manager throws on dispatch failure; caller catches and wraps
- Concurrency queue rejections use `[Harness]` prefix: `queue.acquire()` rejects with timed-out errors including key name

## Logging

**Framework:** No logging library — uses `console.log` sparingly (eval metrics only) and `process.env`-gated debug output

**Patterns:**
- `console.log` used only in eval tests for metric reporting: `console.log(`[Coherence] Primary agent overlaps: ${overlaps.length}`)`
- No structured logging, no log levels, no log files in production code
- Warnings accumulated in `TaskStateManager.addWarning()` — capped at 25 per session
- Error details embedded in thrown Error messages, not separate log calls

## Comments

**When to Comment:**
- File-level JSDoc description blocks on major modules and architecture-entry points
- Section-separator comments before logical groupings within files
- Inline comments explaining non-obvious decisions, gap documentation, and runtime requirements

**JSDoc/TSDoc:**
- JSDoc used on public API functions exported from `shared/`, `lib/`, and `tools/`:
  ```typescript
  /**
   * Result shape from the prompt-skim tool. Captures quantitative metrics
   * (word/token counts), structural markers (urls, paths), and qualitative
   * assessments (complexity, flooding risk) for triage decisions.
   */
  export const PromptSkimResultSchema = z.object({...})
  ```
- `@param` tags used on parameterized functions:
  ```typescript
  /**
   * Create a success response.
   * @param message - Human-readable status message
   * @param data - Optional payload data
   */
  export function success<T>(message: string, data?: T, metadata?: Record<string, unknown>): ToolResponse<T>
  ```
- `@internal` tags mark runtime-injected types not available outside OpenCode plugin context
- `@returns` tags used for return value descriptions
- JSDoc on factory functions describes what they create, not just what they return

**Gap/Issue Documentation:**
- Test files document known behavioral gaps with detailed comment blocks:
  ```typescript
  /**
   * GAP G-2: False completion detection when agent crashes
   * ...
   * These tests DOCUMENT the behavioral gap and verify the stability-timer
   * heuristic works correctly as a potential mitigation path.
   */
  ```

## Function Design

**Size:** Small, focused functions — most under 50 lines. The largest function is `buildPromptText` at ~50 lines. Classes like `TaskStateManager` and `CompletionDetector` each ~130-250 lines with many small methods.

**Parameters:** Single object parameters for functions with 3+ arguments:
```typescript
export function buildDelegationQueueKey(args: {
  provider?: string
  model?: string
  agent?: string
  category?: string
}): string
```

**Return Values:**
- Never return `null` — use `undefined` for absent values (`Map.get()` pattern)
- Boolean-returning guards for predicates
- Tool results always wrapped in `ToolResponse` envelope with `kind: "success" | "error" | "pending"`

## Module Design

**Exports:**
- Named exports only (`export function`, `export class`, `export const`) — no default exports except `src/index.ts` which provides `HarnessControlPlane` as both named and default export
- Barrel files (`index.ts`) re-export from submodules using `export * from` for library modules
- Tool modules export both factory functions and input schemas: `export { createDelegateTaskTool, DelegateTaskInputSchema }`

**Barrel Files:**
- `src/index.ts` — public API surface for the `opencode-harness` npm package
- `src/schema-kernel/index.ts` — re-exports all Zod schemas
- `src/lib/event-tracker/index.ts` — re-exports event tracker submodules
- Test directories use flat file structure, no barrel files needed

**Module boundaries:**
- `src/lib/types.ts` is the leaf node — depends on nothing, imported by most modules
- Max dependency chain depth: 2 levels (enforced by architecture spec)
- Dual-layer state: `continuity.ts` (durable JSON) + `state.ts` (in-memory Maps)
- `src/shared/` contains cross-cutting tool utilities with no business logic
- `src/plugin.ts` is the composition root — thin, wires dependencies, no business logic
- Module size cap: 500 LOC (currently monitored; `continuity.ts` at ~455 LOC, `delegation-manager.ts` at ~468 LOC)

## Zod Schema Conventions

- Schemas declared as `const` variables with explicit names and `.strict()` calls:
  ```typescript
  export const PromptSkimResultSchema = z.object({...}).strict()
  ```
- Types inferred with `z.infer<>`:
  ```typescript
  export type PromptSkimResult = z.infer<typeof PromptSkimResultSchema>
  ```
- All Zod schemas live in `src/schema-kernel/` directory

---

*Convention analysis: 2026-04-28 — updated 2026-05-06 (module size verification)*
