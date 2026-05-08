# Coding Conventions

**Analysis Date:** 2026-05-08

## TypeScript Configuration

**Strictness:**
- Full strict mode (`strict: true` in `tsconfig.json`)
- `noUnusedLocals: true` — unused local variables are compile errors
- `noUnusedParameters: true` — unused function parameters are compile errors
- `noImplicitReturns: true` — all code paths in a function must explicitly return
- `noFallthroughCasesInSwitch: true` — switch case fallthrough is forbidden
- `verbatimModuleSyntax: true` — type-only imports MUST use `import type` syntax

**Module System:**
- Target: `ES2022`
- Module resolution: `NodeNext` with `.js` extensions in import paths
- All modules are ESM (`"type": "module"` in `package.json`)
- Source root: `src/` → Output: `dist/`

## File Organization

**File Naming:**
- Use `kebab-case.ts` for all source files: `helpers.ts`, `task-status.ts`, `session-api.ts`
- Schema files use `kebab-case.schema.ts`: `prompt-enhance.schema.ts`, `hivemind-configs.schema.ts`
- Test files mirror source with `.test.ts` suffix: `helpers.test.ts`, `state.test.ts`
- Barrel/index files use `index.ts`
- `AGENTS.md` files provide sector-level guidance in each top-level directory

**Directory Structure:**
```
src/
├── plugin.ts                  # Composition root (thin, no business logic)
├── index.ts                   # Public API re-exports (no default except plugin)
├── shared/                    # Leaf utilities, types, SDK wrappers (no deep imports)
├── coordination/              # Delegation, completion, concurrency, spawner
├── task-management/           # Continuity, journal, event tracker, lifecycle
├── features/                  # Standalone runtime features (bootstrap, PTY, doc-intel)
├── config/                    # Config subscriber/compiler/workflow
├── routing/                   # Session entry, behavioral profile, command engine
├── hooks/                     # Lifecycle, guards, observers, transforms
├── tools/                     # Write-side tool entrypoints
└── schema-kernel/             # Zod schemas and generated config schema support
```

**Module Size:**
- Maximum 500 LOC per module (enforced by architecture contract)
- Modules exceeding this must be split into separate files with clear responsibility boundaries

## Import Organization

**Order:**
1. External/package imports first (`@opencode-ai/plugin`, `node:fs`)
2. Internal relative imports using `.js` extensions (`"../../shared/helpers.js"`)
3. Type-only imports use `import type`

**Path Style:**
- Always use relative imports with `.js` extensions: `"../../shared/types.js"`
- No path aliases (no `@/` or `~/` prefixes)
- `import type` is mandatory for type-only imports per `verbatimModuleSyntax`

**Example:**
```typescript
import { tool } from "@opencode-ai/plugin/tool"
import { existsSync } from "node:fs"
import { join } from "node:path"

import { renderToolResult } from "../../../shared/tool-helpers.js"
import { success } from "../../../shared/tool-response.js"
import { PromptSkimResultSchema } from "../../../schema-kernel/prompt-enhance.schema.js"
import type { PromptSkimResult } from "./types.js"
```

## Naming Patterns

**Functions:**
- `camelCase` for all functions: `unwrapData`, `getNestedValue`, `canTransition`
- Factory/creator functions prefixed with `create`: `createPromptSkimTool`, `createSessionHooks`, `createHarnessLifecycleManager`
- Boolean-returning functions use `is`/`has`/`can`/`should` prefix: `isObject`, `isTerminal`, `canTransition`
- `ensure` prefix for lazy-initialization getters: `ensureStats`, `ensureRootBudget`

**Variables:**
- `camelCase` for all variables
- Constants use `UPPER_SNAKE_CASE` at module top-level: `MAX_DESCENDANTS_PER_ROOT`, `VALID_DELEGATION_CATEGORIES`, `WATCH_TIMEOUT_MS`
- Internal constants in functions use `camelCase`

**Types:**
- `PascalCase` for types, interfaces, and type aliases: `TaskStatus`, `DelegationMeta`, `CompletionResult`
- Union types use `PascalCase`: `type CompletionSignal = "idle" | "error" | "deleted" | "timeout" | "cancelled"`
- `const` arrays use `UPPER_SNAKE_CASE`: `VALID_TASK_STATUSES`, `VALID_TRANSITIONS`

**Classes:**
- `PascalCase` for classes: `TaskStateManager`, `CompletionDetector`, `DelegationManager`
- Private fields use `private readonly` pattern with Maps: `private readonly rootBudgets = new Map<string, RootBudget>()`

**Exports:**
- Named exports only in source modules — zero default exports in implementation files
- `src/index.ts` uses `export * from` for public API re-exports plus `export { X as default }` only for the plugin
- No barrel files in internal directories; `index.ts` only at top-level `src/`

## Code Style

**Error Handling:**
- All thrown errors use the `[Harness]` prefix: `throw new Error("[Harness] Invalid session ID...")`
- Assertion helpers validate inputs and throw with `[Harness]` prefix: `assertValidSessionID`
- Graceful fallbacks: `try/catch` with `// Best-effort...` comment when non-critical
- Empty catch blocks require explicit justification comment

**Error Shape Extraction:**
- `unwrapData` in `src/shared/helpers.ts` handles multiple SDK error shapes consistently
- Error extraction checks: string errors → named errors (`error.data.message`) → validation arrays (`error.errors[]`) → direct message → fallback with JSON

**Logging:**
- No dedicated logging framework — `console.error` used sparingly, always with `vi.spyOn(console, "error")` in tests
- Runtime feedback uses the `ToolResponse` envelope (`kind: "success" | "error" | "pending"`)

**Comments:**
- Section separators use `// ----` (40+ dashes) with descriptive labels
- Module-level JSDoc block comments for public modules and classes
- Inline `//` comments for implementation rationale, NOT for stating what code does
- Phase reference comments for architectural wiring: `// Phase 36.1 R-COMPLETION-DETECTOR-05: complete the dual-signal...`

**JSDoc:**
- Used on all exported functions and classes
- Standard tags: `@param`, `@returns`, `@throws`, `@example`
- Functions returning `undefined` document the condition: `@returns undefined when not provided`
- `@module` tag on barrel/index files

**Type System:**
- No `any` types on new code (architecture contract)
- Type guards are preferred for narrowing: `isObject(value): value is Record<string, unknown>`
- `unknown` for external inputs, narrowed via type guards before use
- Zod schemas validate all external/tool input boundaries

**Response Envelope:**
- All tool outputs use `ToolResponse<T>` from `src/shared/tool-response.ts`: `{ kind: "success" | "error" | "pending", message, data?, metadata? }`
- Factory functions: `success()`, `error()`, `pending()` for consistent response construction
- Type guards: `isSuccess()`, `isError()` for response discrimination

## Function Design

**Size:** Functions are small and focused — typically under 30 lines. Complex functions extract private helpers.

**Parameters:**
- Destructured object parameters for 3+ args
- Optional params use `?:` syntax
- Reserved parameters prefixed with underscore: `_projectRoot`, `_context`

**Return Values:**
- Explicit return types on all exported functions
- `undefined` returned for "not found" cases (not `null`)
- Async functions always return `Promise<T>`

**Pure vs. Impure:**
- Leaf utilities in `src/shared/` are pure (no side effects)
- State mutation confined to Classes with Maps and dedicated persistence modules
- Tools are the CQRS mutation boundary — hooks are read-only observers

## Module Design

**Dependency Rules (enforced by architecture):**
- `src/shared/` is leaf-like — must not import from tools, hooks, or plugin
- `src/schema-kernel/` owns validation contracts — no runtime side effects
- `src/hooks/` observes read-side events — must not perform durable writes
- `src/tools/` owns write-side mutations — validated inputs through schemas
- `src/plugin.ts` is composition root — thin, no business logic (currently 187 lines)

**Circular Dependencies:** Zero tolerance. Architecture contract explicitly forbids circular imports.

## Testing Conventions

See `TESTING.md` for full testing patterns. Quick reference:

- Vitest with `globals: true` — `describe`, `it`, `expect` imported explicitly
- Relative ESM imports from `src/` with `.js` extensions
- `vi.mock` at module level for external dependencies
- Factory functions for test data (`makeValidMeta`, `makeRecord`)
- One behavior per `it()` block with descriptive names

## Git & Commit

**Commit Format:** `phase: what changed — why it matters`
- Examples: `phase 36.1: rewire completion detector — dual-signal polling loop`
- Atomic commits — one logical change per commit
- No accumulating changes across multiple phases without committing

---

*Convention analysis: 2026-05-08*
