# Coding Conventions

**Analysis Date:** 2026-05-15

## Naming Patterns

**Files:**
- Source files use `kebab-case.ts` (e.g., `delegate-task.ts`, `session-entry-consumer.ts`)
- Schema files use `kebab-case.schema.ts` (e.g., `prompt-enhance.schema.ts`, `trajectory.schema.ts`)
- Type-only files use `kebab-case.types.ts` (e.g., `behavioral-profile/types.ts`, `runtime-pressure/types.ts`)
- Test files mirror source with `.test.ts` suffix (e.g., `helpers.test.ts`, `delegation-manager.test.ts`)
- Index files use `index.ts` for barrel exports within feature/tool directories

**Functions:**
- camelCase for all functions (e.g., `extractAssistantText`, `createDelegateTaskTool`, `resolveWorkspaceRuntimePolicy`)
- Factory functions use `create` prefix (e.g., `createCoreHooks`, `createPtyManagerIfSupported`, `createSessionTrackerTool`)
- Type guards use `is`/`has` prefix (e.g., `isObject`, `isValidSessionID`, `hasAssistantWorkEvidence`)
- Action verbs for mutations (e.g., `reserveDescendant`, `registerSubagent`, `forgetSession`)

**Variables:**
- camelCase for variables and parameters (e.g., `sessionTracker`, `runtimePolicy`, `projectDirectory`)
- UPPER_SNAKE_CASE for constants (e.g., `MAX_DESCENDANTS_PER_ROOT`, `WATCH_TIMEOUT_MS`, `TRAJECTORY_LEDGER_VERSION`)
- PascalCase for types, interfaces, and classes (e.g., `DelegationManager`, `SessionTracker`, `ToolResponse`)

**Types:**
- PascalCase for interfaces and type aliases (e.g., `SessionContinuityRecord`, `RuntimePolicy`, `HarnessStatus`)
- `type` preferred over `interface` for unions and mapped types; `interface` for object shapes with extension needs
- Suffix `-Schema` for Zod schema types (e.g., `HivemindConfigs`, `TrajectoryToolInput`)

## Code Style

**Formatting:**
- No external formatter configured (no ESLint, Prettier, or Biome found)
- TypeScript compiler (`tsc`) enforces strict mode as the primary style gate
- 2-space indentation observed throughout codebase
- Line length: ~100-120 characters typical, no hard limit enforced

**Linting:**
- TypeScript strict mode is the lint authority:
  - `strict: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`
  - `verbatimModuleSyntax: true`

**Module size constraint:**
- Max 500 LOC per module (enforced by architecture rules in AGENTS.md)
- Large modules are split (e.g., `src/shared/types.ts` re-exports from `../coordination/delegation/types.js` to stay under limit)

## Import Organization

**Order:**
1. External packages / SDK imports (e.g., `@opencode-ai/plugin`, `@opencode-ai/sdk`, `node:fs`)
2. Internal relative imports (e.g., `../../shared/types.js`, `../coordination/delegation/manager.js`)

**Path Aliases:**
- No path aliases configured — all internal imports use relative paths
- ESM `.js` extensions required on all relative imports (e.g., `import { foo } from "./bar.js"`)
- `import type` used for all type-only imports (enforced by `verbatimModuleSyntax: true`)

**Import style examples:**
```typescript
// Type-only import (verbatimModuleSyntax enforced)
import type { Plugin } from "@opencode-ai/plugin"
import type { DelegationManager } from "../../coordination/delegation/manager.js"

// Value import with .js extension
import { existsSync, rmSync } from "node:fs"
import { createCoreHooks } from "./hooks/lifecycle/core-hooks.js"

// Re-export for backward compatibility
export type { DelegationStatus } from "../coordination/delegation/types.js"
```

## Error Handling

**Patterns:**
- All thrown errors use `[Harness]` prefix: `throw new Error("[Harness] <message>")`
- Error messages include context: `"[Harness] Invalid agent: \"not-real\". Available: [researcher, builder, critic]"`
- Recovery errors include error codes: `"[Harness] recovery REC-04: sessionId must be a non-empty string"`
- SDK errors are unwrapped via `unwrapData()` helper in `src/shared/helpers.js` — throws `[Harness]` prefixed messages
- `describeError()` helper in `src/shared/helpers.js` converts unknown errors to strings
- Best-effort pattern: fire-and-forget async operations wrap in `void` with `.catch()` for non-critical paths (e.g., session tracker init, migration cleanup)

**Error handling example:**
```typescript
// Standard error with [Harness] prefix
throw new Error("[Harness] Canonical delegation queue-key drift detected.")

// SDK error unwrapping
function unwrapData<T = unknown>(response: unknown): T {
  if (isObject(response) && "error" in response && response.error) {
    const message = extractSdkErrorMessage(response.error)
    throw new Error(`[Harness] ${message}`)
  }
  // ...
}

// Best-effort (never fail the tool call)
try {
  await sessionTracker.handleToolExecuteAfter(input, output)
} catch {
  // Best-effort: never fail the tool call.
}
```

## Logging

**Framework:** OpenCode SDK `client.app.log` via structured body objects

**Patterns:**
- Service tag identifies the subsystem: `service: "session-tracker"`
- Log levels: `info`, `warn`, `error`
- All log messages use `[Harness]` prefix for consistency
- Error details passed via `extra: { error: err.message }` pattern
- `void` prefix on log calls — logging never blocks execution

**Logging example:**
```typescript
void client.app?.log?.({
  body: {
    service: "session-tracker",
    level: "warn",
    message: "[Harness] Session tracker: init+cleanup failed",
    extra: { error: err instanceof Error ? err.message : String(err) },
  },
})
```

## Comments

**When to Comment:**
- JSDoc blocks (`/** ... */`) on all public functions, classes, and exported types
- Inline section separators using `// ---` or `// ----` with descriptive labels
- Inline comments explain WHY, not WHAT (especially for non-obvious patterns)
- Phase/audit references in comments for traceability (e.g., `// Phase 48.4.1 (audit 2026-04-30)`)

**JSDoc/TSDoc:**
- Extensive JSDoc usage — 1,524+ JSDoc blocks across `src/`
- Standard format: description, `@param`, `@returns`
- Cross-references via `{@link}` syntax
- Example from `src/shared/helpers.ts`:
```typescript
/**
 * Extract the text content of the last assistant message from an array of
 * session messages.
 *
 * Searches backward from the end of the array...
 * Returns `""` when no assistant message is found...
 */
export function extractAssistantText(messages: unknown[]): string { ... }
```

## Function Design

**Size:**
- Target: under 500 LOC per module (architecture constraint)
- Functions are typically 10-50 lines; complex handlers up to ~100 lines
- Large functions split into named sub-functions with descriptive names

**Parameters:**
- Named object parameters for 3+ arguments (e.g., `buildPromptText(args: { description, prompt, category?, ... })`)
- Single positional parameters for simple functions
- Optional parameters use `?` with defaults at call site

**Return Values:**
- Explicit return types on all functions (TypeScript `noImplicitReturns`)
- `ToolResponse<T>` envelope for tool outputs (kind: success | error | pending)
- `undefined` for optional/missing values (not `null`)
- Discriminated unions where appropriate (e.g., `HarnessStatus`)

## Module Design

**Exports:**
- Named exports preferred (no default exports except `plugin.ts`)
- Barrel files (`index.ts`) for feature directories re-export types and implementations
- `export type` for type-only re-exports
- Factory pattern: `createXxxTool()`, `createXxxHooks()` for plugin composition

**Barrel Files:**
- Used in `src/schema-kernel/index.ts`, `src/routing/session-entry/index.ts`, `src/features/*/index.ts`
- Re-export types and implementations for clean consumer imports
- `src/index.ts` re-exports public API surfaces

**Architecture patterns:**
- CQRS: hooks (read-side) vs tools (write-side) — strictly separated
- Dependency injection: factories receive deps objects, not globals
- Plugin composition: `src/plugin.ts` is thin — wires factories, no business logic
- Leaf constraint: `src/shared/` imports from nothing deeper than itself

---

*Convention analysis: 2026-05-15*
