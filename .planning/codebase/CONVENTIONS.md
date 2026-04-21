# Coding Conventions

> Generated: 2026-04-21
> Agent: gsd-codebase-mapper (quality-focus)

## TypeScript Configuration

**Config file:** `tsconfig.json`

All code MUST comply with these strict settings:
- `"strict": true` — strict null checks, strict function types, strict bind/apply/call
- `"noUnusedLocals": true` — compiler error on unused local variables
- `"noUnusedParameters": true` — compiler error on unused function parameters
- `"noImplicitReturns": true` — all code paths in functions with return type must return
- `"noFallthroughCasesInSwitch": true` — no implicit fallthrough in switch
- `"verbatimModuleSyntax": true` — use `import type` for type-only imports, NOT regular `import`
- `"target": "ES2022"` — modern JavaScript features available
- `"module": "NodeNext"` / `"moduleResolution": "NodeNext"` — use `.js` extension in imports

```typescript
// ✅ CORRECT: type-only import with verbatimModuleSyntax
import type { TaskStatus } from "./types.js"

// ❌ WRONG: regular import for type-only usage
import { TaskStatus } from "./types.js"
```

**Import path convention:** Always include `.js` extension in relative imports:
```typescript
import { isObject } from "./helpers.js"          // ✅ Correct
import { isObject } from "./helpers"              // ❌ Wrong
import { isObject } from "./helpers.ts"            // ❌ Wrong
```

## Naming Patterns

### Files
- **Source modules:** kebab-case — `task-status.ts`, `completion-detector.ts`, `delegation-manager.ts`
- **Test files:** mirror source path in `tests/` — `tests/lib/task-status.test.ts`
- **Tool directories:** kebab-case directory with `index.ts`, `tools.ts`, `types.ts` — `tools/prompt-skim/`
- **Hooks:** kebab-case with `create-` prefix — `create-core-hooks.ts`, `create-session-hooks.ts`

### Types
- **Type aliases:** PascalCase — `TaskStatus`, `SessionLifecyclePhase`, `DelegationMeta`
- **Interfaces:** PascalCase — `Delegation`, `SpawnReservation`, `HookDependencies`
- **Enums:** Not used — all unions are string literal union types
- **Type suffix convention:** Status types end in `Status`, policy types end in `Policy`, override types end in `Override`

### Functions
- **Pure functions:** camelCase — `isObject()`, `asString()`, `unwrapData()`
- **Factory functions:** `create` prefix — `createCoreHooks()`, `createPromptSkimTool()`
- **Guard functions:** boolean-returning — `canTransition()`, `isTerminal()`, `isSuccess()`
- **Builder functions:** `build` prefix — `buildNotificationMessage()`, `buildDelegationQueueKey()`

### Classes
- **PascalCase** — `TaskStateManager`, `DelegationConcurrencyQueue`, `CompletionDetector`
- **Manager pattern:** Classes named `*Manager` encapsulate state + operations — `TaskStateManager`, `DelegationManager`

### Constants
- **SCREAMING_SNAKE_CASE** for module-level constants — `MAX_DESCENDANTS_PER_ROOT`, `STABILITY_THRESHOLD`, `DEFAULT_SAFETY_CEILING_MS`
- **camelCase** for local constants — `const eventType = ...`

### Variables
- **camelCase** — `sessionID`, `eventType`, `delegationManager`
- **Boolean variables:** use `is`/`has`/`should` prefixes — `isSuccess()`, `settled`

## Code Organization

### Module Size Limit
Max module size: **500 LOC**. Current largest files:
- `src/lib/delegation-manager.ts` — 450 LOC
- `src/lib/continuity.ts` — 401 LOC
- `src/lib/types.ts` — 378 LOC

### Dependency Rules (Non-Negotiable)
```
types.ts (leaf — no imports)
├── task-status.ts → types.ts
├── state.ts → types.ts
├── helpers.ts → types.ts
├── concurrency.ts → types.ts (self-contained otherwise)
├── continuity.ts → types.ts
├── session-api.ts → helpers.ts
├── runtime.ts → helpers.ts + types.ts
├── completion-detector.ts (self-contained — no imports)
├── notification-handler.ts → helpers.ts
└── lifecycle-manager.ts → concurrency.ts + continuity.ts + helpers.ts + session-api.ts + state.ts + types.ts
```
- Max dependency chain: 2 levels
- `types.ts` is always leaf — depends on nothing
- No circular dependencies

### File Structure per Module
Source files in `src/lib/` follow this structure:
1. Import section (types first with `import type`, then values)
2. Type definitions local to module
3. Separator comment: `// ---------------------------------------------------------------------------`
4. Implementation functions/classes
5. Section separators between logical groups

```typescript
// Section separator pattern:
// ---------------------------------------------------------------------------

// Sub-section pattern:
// -------------------------------------------------------------------------
// Sub-section title
// -------------------------------------------------------------------------
```

### Shared Modules
- `src/shared/tool-response.ts` — Standard tool response envelope (`ToolResponse<T>` with `success()`, `error()`, `pending()`)
- `src/shared/tool-helpers.ts` — `renderToolResult()` for JSON serialization
- Use `ToolResponse<T>` as the return type for all tool execute functions

## Error Handling

### `[Harness]` Prefix Pattern
All thrown errors use the `[Harness]` prefix for identification:

```typescript
throw new Error(`[Harness] Root session ${rootID} exceeded descendant budget (${maxDescendantsPerRoot})`)
throw new Error(`[Harness] Invalid concurrency policy: globalLimit must be positive, got ${policy.globalLimit}.`)
throw new Error(`[Harness] Concurrency acquire timed out for key "${key}" after ${timeoutMs}ms.`)
```

**Why:** `[Harness]` prefix distinguishes harness-originated errors from SDK errors and user errors. Tools catch these and return structured error responses.

### Error Propagation
- **Helpers:** `unwrapData()` throws `[Harness]` errors for SDK error responses
- **Guards:** Budget exceeded, concurrency timeout, policy validation — throw immediately
- **Tools:** Catch errors in try/catch, return `ToolResponse` with `kind: "error"`
- **Best-effort operations:** `notifyParentSession()` swallows errors, returns `false`

```typescript
// Tool error handling pattern:
try {
  const result = await manager.dispatch(args)
  return renderToolResult(success("Dispatched", result))
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  return renderToolResult(error(message))
}
```

### Input Validation
- Use **Zod schemas** for tool input validation — `DelegateTaskInputSchema`, `DelegationStatusInputSchema`
- Reject invalid inputs with ZodError (thrown by `.parse()`)
- Validate ranges with explicit checks and `[Harness]`-prefixed errors

## State Management

### Dual-Layer State
- **Durable layer:** `continuity.ts` — JSON file persistence at `.opencode/state/opencode-harness/`
- **In-memory layer:** `state.ts` — `TaskStateManager` class with Maps for session stats, budgets, delegation meta
- **Hydration:** On startup, `hydrateFromContinuity()` loads durable state into in-memory Maps

### Deep-Clone-on-Read
The continuity store deep-clones all data on read to prevent mutation aliasing:
```typescript
// All getSessionContinuity calls return a fresh clone
const data = getSessionContinuity(sessionID)  // Safe to mutate
```

### Warning Cap
`addWarning()` in `state.ts` caps warnings at 25 per session — prevents unbounded memory growth.

## Patterns

### CQRS for Tools
- **Write-side tools:** `delegate-task` — dispatches via `DelegationManager`, returns immediately
- **Read-side tools:** `delegation-status` — polls status, returns current state
- Tools never mix read and write operations

### Factory Function Pattern
Hook and tool creation uses factory functions, not classes:
```typescript
export function createCoreHooks(deps: HookDependencies): CoreHooks { ... }
export function createPromptSkimTool(cwd: string): Tool { ... }
export function createDelegateTaskTool(manager: DelegationManager): Tool { ... }
```

### Singleton Pattern
`state.ts` exports both a class and a singleton instance:
```typescript
export class TaskStateManager { ... }
export const taskState = new TaskStateManager()  // Singleton

// Backward-compatible wrapper functions
export function ensureSessionStats(sessionID: string): SessionStats {
  return taskState.ensureStats(sessionID)
}
```

### Guard Pattern
Boolean guard functions for state machine transitions:
```typescript
export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}
export function isTerminal(status: TaskStatus): boolean {
  return status === "completed" || status === "failed" || ...
}
```

### Idempotent Operations
Release and rollback functions are idempotent — double-calls are safe:
```typescript
private makeRelease(key: string, lane: Lane): () => void {
  let released = false
  return () => {
    if (released) return  // Idempotent guard
    released = true
    // ... actual release logic
  }
}
```

## Documentation

### JSDoc Usage
- **Public functions:** JSDoc on all exported functions with `@param` and `@returns`
- **Types:** JSDoc `/** */` comments on non-obvious type fields
- **Private methods:** No JSDoc required — code should be self-documenting

```typescript
/**
 * Resolve the effective runtime policy for a specific session.
 *
 * Per-session overrides take precedence over workspace-level defaults.
 * @param workspacePolicy - Workspace-level policy (already validated or default).
 * @param sessionOverride - Optional per-session overrides from delegation metadata.
 * @returns Fully-resolved policy for this session.
 * @throws [Harness]-prefixed Error when session override values are invalid.
 */
```

### Inline Comments
- Use `// Bug F3: ...` pattern for bug-fix comments with reference IDs
- Use `// RESEARCH D-16: ...` pattern for design-decision references
- Use section separators (`// ----...`) for visual grouping

### Module-Level AGENTS.md
`src/lib/AGENTS.md` documents module responsibilities, dependency graph, and where-to-find table. This is for developer navigation, not runtime.

## Import Organization

**Order:**
1. External package types — `import type { Plugin } from "@opencode-ai/plugin"`
2. External package values — `import { defineConfig } from "vitest/config"`
3. Internal types — `import type { HookDependencies } from "./types.js"`
4. Internal values — `import { isObject } from "./helpers.js"`

**Path aliases:** None — all imports use relative paths with `.js` extension.

## Code Style

### Formatting
- No Prettier or ESLint config detected — consistent formatting by convention
- **Indentation:** 2 spaces
- **Semicolons:** Not used (not enforced, but consistent)
- **Trailing commas:** Not used
- **String quotes:** Double quotes for strings

### Control Flow
- Early returns for guard conditions — no deep nesting
- `for...of` for iteration, `.map()/.filter()` for transforms
- `async/await` — no raw Promise chains

### `noUnusedParameters` Handling
Use underscore prefix for intentionally unused parameters:
```typescript
"system.transform": async (_input: SystemInput, _output: SystemOutput): Promise<void> => {
  // No-op stub during clean slate
},
```

## Git Discipline

- **Commit message format:** `phase: what changed — why it matters`
- **Commit frequency:** After each meaningful change (subagent returns, phase completes)
- **Never accumulate** changes across multiple phases without committing

## Anti-Patterns to Avoid

1. **No `any` types** on new code — `client: any` is known tech debt from SDK
2. **No static `.md` files** acting as agent definitions
3. **No governance scripts** that block progression — scripts report facts only
4. **No feature bloat** — modules under 500 LOC, codebase target ~4,000-5,000 LOC
5. **No hardcoded paths** — use `process.cwd()` or parameters
6. **No state mutation** outside CQRS tools

---

*Convention analysis: 2026-04-21*
