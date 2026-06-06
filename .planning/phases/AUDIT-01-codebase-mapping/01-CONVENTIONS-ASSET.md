# Coding Conventions

**Analysis Date:** 2026-06-06

## Naming Patterns

**Files:**
- kebab-case for all source files: `task-status.ts`, `session-naming.ts`, `tool-response.ts`, `contract-enforcement.ts`, `policy-mapper.ts`
- Barrel files use `index.ts` (e.g., `src/index.ts`, `src/shared/index.ts`)
- Test files mirror source path: `src/shared/runtime.ts` → `tests/lib/runtime.test.ts`
- Generated/synthesized types: `*.schema.ts` (Zod schemas), `*.types.ts` (type-only modules)
- No path aliases — every import is relative (`./`, `../`, `../../`)

**Functions:**
- camelCase for all functions: `inferContinuityStatusFromEvent`, `getCanonicalStateDir`, `extractAssistantText`, `asString`
- Factory functions prefixed with `create`: `createSessionTrackerConsumer`, `createContractEnforcementHook`, `createPromptSkimTool`, `createGatekeeper`
- Reader/parser functions use verb-noun: `parseSessionTitle`, `unwrapData`, `extractSdkErrorMessage`, `sanitizePurpose`
- Lifecycle getters use `get*` prefix: `getConfig`, `getFreshConfig`, `getCanonicalStateDir`
- Dependency-injection setters use `set*` prefix: `setSendPrompt`, `setSessionManagerAdapter`, `setGetSessionMessages`
- No special prefix for async functions

**Variables:**
- camelCase for local variables and parameters
- UPPER_SNAKE_CASE for module-level constants: `MAX_DESCENDANTS_PER_ROOT`, `HARNESS_PREFIX`, `CONTINUITY_VERSION`, `VALID_TASK_STATUSES`, `POLL_INTERVAL_ACTIVE_MS`, `WATCH_TIMEOUT_MS`
- Const arrays use `as const` for literal types: `export const READ_ONLY_TOOLS = ["read", "glob", "grep"] as const`
- `Set<string>` and `Map<string, *>` for in-memory caches (private members)

**Types:**
- PascalCase for interfaces and type aliases, **no `I` prefix**: `TaskStatus`, `ToolResponse`, `ContractEnforcementDeps`, `HookDependencies`, `NamingInput`
- Interfaces: `interface` (not `type`) when defining object shapes
- Type aliases: `type` for unions, intersections, and primitive-derived types
- No enums — use union string literal types: `type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "error" | "cancelled" | "interrupt"`
- Zod-derived types: `type Foo = z.infer<typeof FooSchema>`
- Generic factories return `ReturnType<typeof tool>`: `createPromptSkimTool(...): ReturnType<typeof tool>`

**Private Members:**
- Use TypeScript `private` keyword on class members: `private readonly lanes = new Map<string, Lane>()`
- `private readonly` for immutable dependencies injected via constructor
- `readonly` keyword on immutable class properties (e.g., `readonly name = "CommandNotFoundError" as const`)

## Code Style

**Formatting:**
- TypeScript strict mode (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`) — see `tsconfig.json`
- ES2022 target, NodeNext module resolution
- `verbatimModuleSyntax: true` — type-only imports MUST use `import type`
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line argument lists
- No ESLint config file (`.eslintrc*` or `eslint.config.*` not present)
- **Max module size: 500 LOC** (enforced by harness governance; when approaching, extract to a sub-file with re-export — see `src/shared/types.ts` re-exporting `delegation/types.js`)

**Linting:**
- No `.eslintrc` / `eslint.config.*` file present in repo (lint config is deferred to CI defaults)
- Lint dependency exists in `package.json` (`eslint: ^10.4.1`) but is not configured
- Use `npm run typecheck` (`tsc --noEmit`) for type enforcement
- Coverage thresholds enforced by `vitest.config.ts` (see TESTING.md)

**Comments:**
- Block comments use `// ---` separators for section dividers
- TSDoc tags: `@param`, `@returns`, `@throws`, `@example`, `@module`, `@phase`, `@deprecated`
- Section banners: `// ---------------------------------------------------------------------------` followed by capitalized title and `// ---------------------------------------------------------------------------`
- Inline comments explain "why" not "what" — business rules, edge cases, non-obvious algorithms
- JSDoc is **required for public API functions**, optional for internal helpers
- Multi-line `/** ... */` style (not `/* */`)

## Import Organization

**Order:**
1. `node:` built-ins: `node:fs`, `node:path`, `node:crypto`, `node:os`, `node:child_process`
2. External packages: `@opencode-ai/sdk`, `@opencode-ai/plugin`, `zod`, etc.
3. Internal relative imports (alphabetized within group): `./helpers.js`, `../types.js`
4. Type-only imports: `import type { ... }` (placed at the same level as the value import or grouped at the end)

**Grouping:**
- Blank line between each import group
- Alphabetical within each group
- File extensions are **required** in import specifiers: `from "./helpers.js"` (even though source is `.ts` — required by NodeNext ESM)

**Path Aliases:**
- None. All imports are relative. Module IDs always end with `.js` extension.

**Type-only Imports (verbatimModuleSyntax):**
```typescript
import type { DelegationRecoveryGuarantee, DelegationSignalSource } from "../coordination/delegation/types.js"
import type { Plugin } from "@opencode-ai/plugin"
```

## Error Handling

**Patterns:**
- **All thrown errors are prefixed with `[Harness]`** — non-negotiable convention enforced by the harness
- Custom Error subclasses for typed errors: extend `Error`, set `readonly name = "ClassName" as const`, accept optional `message` with a default
- Throw at boundaries; let call sites decide whether to catch

**Custom Error Classes (from `src/shared/errors/commands.ts`):**
```typescript
export class CommandNotFoundError extends Error {
  readonly name = "CommandNotFoundError" as const
  constructor(message?: string) {
    super(message ?? "Command not found")
  }
}
```
Other typed errors follow this pattern: `AgentNotFoundError`, `DelegationTimeoutError`, `InvalidCommandError`, `DelegationContextError`.

**When to Throw (vs Return):**
- Throw `[Harness]` errors on invalid input, missing dependencies, invariant violations
- Example from `src/shared/runtime-policy.ts:49`: `throw new Error("[Harness] Invalid concurrency policy: globalLimit must be positive, got ${policy.globalLimit}.")`
- Tool responses use the **standard envelope** (not thrown) — see `src/shared/tool-response.ts`

**Standard Tool-Response Envelope (`src/shared/tool-response.ts`):**
```typescript
export type ToolResponse<T = unknown> = {
  kind: "success" | "error" | "pending"
  message: string
  data?: T
  metadata?: Record<string, unknown>
}
```
Use the helpers: `success(msg, data?, meta?)`, `error(msg, data?, meta?)`, `pending(msg, data?, meta?)`. Type guards: `isSuccess()`, `isError()`.

**SDK Error Unwrapping (`src/shared/helpers.ts`):**
- `unwrapData<T>(response)` throws `Error("[Harness] ${message}")` on `response.error`
- `extractSdkErrorMessage(error)` handles 3 SDK error shapes (named errors, validation arrays, direct message)
- `describeError(error: unknown): string` — safe conversion to string message

**Async Error Handling:**
- Use `try/catch` blocks, not `.catch()` chains
- Contract enforcement hard-blocks via thrown error (D-23): `throw new Error("[Harness] contract violation: ...")` from `src/hooks/transforms/contract-enforcement.ts`
- Use `await expect(...).rejects.toThrow("[Harness] ...")` in tests

## Logging

**Framework:**
- **No structured logger** (no pino/winston dependency)
- Use `console.error`, `console.warn`, `console.log` directly
- All runtime log lines are prefixed with `[Harness]` for grep-ability

**Patterns:**
- `console.error("[Harness] ${context}: ${error.message}")` for caught-then-logged errors
- `console.warn("[Harness] ${message}")` for non-fatal conditions
- `console.log` is reserved for CLI output in `src/cli/commands/` and `src/cli/commands/recover.ts`, `version.ts`, `init.ts` — these are intentional user-facing output, not logs
- No `console.log` in library code (`src/shared/`, `src/coordination/`, `src/features/`) — those modules throw instead
- Observers and consumers expose a `logWarn` injection point (e.g., `ContractEnforcementDeps.logWarn?`) rather than calling `console` directly — this makes hook warnings testable

## Comments

**When to Comment:**
- **Required**: JSDoc on every exported function/class/interface/type
- **Required**: Block comment explaining the "why" on non-obvious logic, business rules, design constraints
- **Optional**: Inline `//` comments on simple logic
- **Discouraged**: Obvious comments like `// increment counter`

**JSDoc/TSDoc Style:**
- Multi-line `/** ... */` block
- Tags used: `@param`, `@returns`, `@throws`, `@example`, `@module`, `@phase`, `@deprecated`
- Description on first line (no tag), then blank line, then tags
- Example from `src/shared/session-naming.ts:54-73`:
  ```typescript
  /**
   * Generates a machine-parsable session title from structured input.
   *
   * Format: `{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}`
   *
   * @param input - Structured naming input parameters.
   * @returns Formatted session title string.
   *
   * @example
   * generateSessionTitle({ framework: "hm", workflow: "governance", ... })
   * // Returns: "hm/governance/root/gsd-auditor/audit-phase23@0"
   */
  ```

**Section Dividers:**
```typescript
// ---------------------------------------------------------------------------
// Section Title
// ---------------------------------------------------------------------------
```

**Mapping Tables (use ASCII art):**
```typescript
// ┌─────────────┬────────────────────────┬──────────────────────────┐
// │ HarnessStatus│ SessionLifecyclePhase  │ DelegationPacketStatus   │
// ├─────────────┼────────────────────────┼──────────────────────────┤
// │ pending     │ created                │ pending                  │
// ...
```

## Function Design

**Size:**
- Most functions <50 lines
- Complex logic split into private helpers within the same module
- Module-level guard: keep modules under 500 LOC (extract to a sibling file with re-export)

**Parameters:**
- ≤3 parameters for simple functions: `function getNestedValue(value: unknown, path: string[])`
- Object parameter for ≥3 options: `function buildPromptText(args: { description: string; prompt: string; category?: string; ... })`
- Destructured options object: `function createContractEnforcementHook(deps: ContractEnforcementDeps)`
- Dependency injection via typed `Deps` interface: `ContractEnforcementDeps`, `HookDependencies`, `SessionTrackerConsumerDeps`

**Return Values:**
- Explicit return statements (no implicit `undefined` returns)
- Early-return guard clauses preferred over nested `if/else`
- Discriminated unions for multi-state returns: `{ kind: "success" | "error" | "pending"; ... }`
- `null` returned for parse failures with documented "Returns `null` if invalid input" in JSDoc

**Factories (preferred over classes for stateless services):**
```typescript
export function createSessionTrackerConsumer(
  deps: SessionTrackerConsumerDeps,
): (input: { event: unknown }) => Promise<void> {
  return async (input) => { ... }
}
```

**Class Design (for stateful services):**
- Constructor takes injected dependencies: `constructor(stabilityTimeoutMs: number = 30000)`
- `private readonly` for injected deps and caches: `private readonly lanes = new Map<string, Lane>()`
- Public methods are the only mutation surface

## Module Design

**Exports:**
- **Named exports only** — no `export default` anywhere in the codebase
- Re-exports for backward compatibility live in `src/shared/types.ts` and `src/index.ts` (barrel files)
- `import type` for type re-exports: `export type { Delegation, DelegationResult } from "../coordination/delegation/types.js"`

**Barrel Files:**
- `src/index.ts` — package public API
- `src/shared/index.ts` — shared module re-exports
- `src/shared/types.ts` — re-exports delegation and workflow types from sibling modules
- Pattern: types/values stay in leaf files; barrel re-exports keep the public surface stable

**Circular Dependency Prevention:**
- Leaf modules (no internal imports) live in `src/shared/` and `src/coordination/concurrency/queue.ts`
- `src/shared/types.ts` is treated as leaf-like; avoid adding deep runtime imports
- `src/shared/helpers.ts`, `src/coordination/concurrency/queue.ts`, `src/coordination/completion/detector.ts` are near-leaf
- Dependency direction: tools → coordination → shared; tools never imported by shared

**Backwards-Compat Re-export Pattern:**
```typescript
// src/shared/types.ts (line 374-399)
export type { DelegationStatus, Delegation, ... } from "../coordination/delegation/types.js"
export { MAX_DELEGATION_DEPTH, TASK_CLEANUP_DELAY_MS, ... } from "../coordination/delegation/types.js"
```

**Dual-Layer State (Continuity Pattern):**
- Durable JSON file (atomic write, corrupt-file quarantine) in `src/task-management/continuity/index.ts`
- In-memory `Map<string, *>` in `src/shared/state.ts` (TaskStateManager)
- **Deep-clone on read** in continuity store: `cloneDelegationMeta`, `cloneCompactionCheckpoint` helpers — prevents callers from mutating stored state
- See `src/task-management/continuity/store-cache.ts` for the cache layer

---

*Convention analysis: 2026-06-06*
*Update when patterns change*
