# Coding Conventions

**Analysis Date:** 2026-04-06

## TypeScript Configuration

**Compiler settings** (`tsconfig.json`):
- Target: `ES2022`
- Module: `NodeNext` with `NodeNext` resolution
- `strict: true` — all strict checks enabled
- `verbatimModuleSyntax: true` — enforces `import type` for type-only imports
- `noUnusedLocals: true` — dead imports/vars are compile errors
- `noUnusedParameters: true` — unused params are compile errors
- `noImplicitReturns: true` — all code paths must return
- `noFallthroughCasesInSwitch: true` — no implicit fallthrough
- `forceConsistentCasingInFileNames: true` — case-sensitive imports
- `declaration: true`, `declarationMap: true`, `sourceMap: true` — full type emit
- Types array: `["node", "vitest/globals"]` — vitest globals available without import

**Package constraints** (`package.json`):
- Node.js `>=20.0.0`
- Peer dependency: `@opencode-ai/plugin >=1.1.0`
- Package type: `"module"` (ESM only)
- Dev deps: `typescript ^5.3.0`, `vitest ^4.1.2`, `@types/node ^20.10.0`

## Module Size Limits

**Hard constraint:** Max 500 LOC per module. Current violations:
- `src/lib/lifecycle-manager.ts` — **705 lines** (exceeds 500 by 205)
- `src/lib/continuity.ts` — **638 lines** (exceeds 500 by 138)
- `src/plugin.ts` — **477 lines** (under limit but target is <100)

**Target:** Total codebase ~4,000–5,000 LOC. Current: 3,878 LOC across `src/`.

## Naming Patterns

**Files:**
- kebab-case for directories: `src/tools/prompt-skim/`, `src/tools/session-patch/`
- kebab-case for source files: `completion-detector.ts`, `notification-handler.ts`
- `.test.ts` suffix for test files: `tests/lib/helpers.test.ts`
- `index.ts` for barrel exports: `src/tools/prompt-skim/index.ts`
- `types.ts` for type definitions co-located with implementation: `src/tools/prompt-skim/types.ts`
- `tools.ts` for tool implementation: `src/tools/prompt-skim/tools.ts`
- `.schema.ts` for schema-kernel Zod contracts: `src/schema-kernel/prompt-enhance.schema.ts`

**Functions:**
- camelCase: `buildPromptText`, `canTransition`, `makeToolSignature`
- Factory functions use `create` prefix: `createHarnessLifecycleManager`, `createPromptSkimTool`
- Guard functions use `is`/`has` prefix: `isObject`, `isTerminal`, `canTransition`
- Normalizer functions use `normalize` prefix: `normalizeCategory`, `normalizePermissionRule`
- Clone functions use `clone` prefix: `cloneContinuityRecord`, `cloneLifecycleState`

**Types:**
- PascalCase for interfaces and type aliases: `SessionContinuityRecord`, `TaskStatus`
- `Core` suffix for base interfaces, extended via intersection: `TrajectoryCore & TrajectoryBindings`
- Const arrays use UPPER_SNAKE_CASE: `VALID_AGENTS`, `VALID_DELEGATION_CATEGORIES`, `VALID_TASK_STATUSES`

**Classes:**
- PascalCase: `DelegationConcurrencyQueue`, `HarnessLifecycleManager`, `CompletionDetector`

**Constants:**
- UPPER_SNAKE_CASE for module-level constants: `MAX_DEPTH`, `CIRCUIT_BREAKER_THRESHOLD`, `CONTINUITY_VERSION`
- `as const` for readonly literals: `const CONTINUITY_VERSION = 1 as const`

## Code Style

**Formatting:**
- No dedicated Prettier or Biome config detected — rely on TypeScript compiler for correctness
- 2-space indentation observed throughout
- Trailing commas on multi-line structures
- Semicolons on all statements

**Import Organization:**
1. External packages first: `import type { Plugin } from "@opencode-ai/plugin"`
2. Node built-ins with `node:` prefix: `import { existsSync } from "node:fs"`
3. Relative imports last, with `.js` extension (ESM): `import type { PermissionRule } from "./types.js"`
4. `import type` used for type-only imports (enforced by `verbatimModuleSyntax`)

**Path Aliases:**
- None configured — all imports use relative paths with `.js` extension

## Error Handling

**Error prefix convention:**
- All thrown errors use `[Harness]` prefix:
  ```typescript
  throw new Error(`[Harness] Invalid category "${value}". Allowed categories: ${VALID_DELEGATION_CATEGORIES.join(", ")}.`)
  ```
- Seen in: `src/plugin.ts` (lines 84, 130, 137, 155, 307, 317), `src/lib/session-api.ts` (line 111)

**Error patterns:**
- Throw `Error` with descriptive messages — never bare strings
- Graceful catch blocks for non-critical failures:
  ```typescript
  try {
    if (this.options.client?.session?.abort) {
      await this.options.client.session.abort({ path: { id: sessionID } })
    }
  } catch {
    // Graceful handling — harness-internal state cleanup proceeds
  }
  ```
  (`src/lib/lifecycle-manager.ts`, line 200)

- Best-effort notifications that swallow errors: `notifyParentSession` in `src/lib/notification-handler.ts`

**`any` type usage (known exceptions):**
- `src/plugin.ts` line 58: `const tool = (OpenCodePlugin as { tool?: any }).tool as any` — workaround for SDK tool extraction
- Test files: `mockClient()` returns `as any` in `tests/lib/session-api.test.ts`

## JSDoc

**Usage:**
- Sparse — most functions lack JSDoc comments
- Present on: `src/shared/tool-helpers.ts` (`renderToolResult`), `src/tools/prompt-skim/index.ts` (module-level)
- Convention when used:
  ```typescript
  /**
   * Render an arbitrary tool result as a JSON string for returning
   * from a tool's execute function.
   * @param result - Any serializable value
   * @returns JSON string representation
   */
  export function renderToolResult(result: unknown): string {
    return JSON.stringify(result, null, 2)
  }
  ```

**Expected tags:** `@param`, `@returns`, `@example`, `@module`

## Module Design

**Exports:**
- Barrel re-exports in `src/index.ts` — exposes all `lib/` modules publicly:
  ```typescript
  export * from "./lib/concurrency.js"
  export * from "./lib/continuity.js"
  ```
- Tool modules use `index.ts` barrel: `src/tools/prompt-skim/index.ts` re-exports from `tools.js` and `types.js`

**CQRS pattern:**
- Tools (write-side): `src/tools/` — LLM-facing, Zod schemas required
- Hooks (read-side): `src/hooks/` — read-only context injection, no durable writes
- Plugin (assembly): `src/plugin.ts` — wires tools + hooks, zero business logic
- Core library: `src/lib/` — state management, helpers, types

**Dependency rules** (from `AGENTS.md`):
- `src/lib/types.ts` is leaf — depends on nothing
- `src/lib/helpers.ts`, `src/lib/concurrency.ts`, `src/lib/completion-detector.ts` — leaf or near-leaf
- `src/lib/lifecycle-manager.ts` depends on most modules (deepest chain: 2 levels)
- No circular dependencies allowed

**Dual-layer state:**
- Durable JSON file: `src/lib/continuity.ts` — persists to `.opencode/state/opencode-harness/session-continuity.json`
- In-memory Maps: `src/lib/state.ts` — `sessionStats`, `rootBudgets`

**Deep-clone-on-read:** `continuity.ts` clones all records returned from disk to prevent mutation of cached state.

## Tool Definition Pattern

All tools use `tool.schema` (Zod re-export) for argument definitions:

```typescript
"delegate-task": tool({
  description: "Create a restricted child session...",
  args: {
    description: tool.schema.string().describe("Short task description"),
    prompt: tool.schema.string().describe("Full task prompt for the delegated agent"),
    agent: tool.schema.string().optional().describe("Optional explicit specialist agent..."),
    run_in_background: tool.schema.boolean().describe("Run asynchronously..."),
  },
  async execute(args, context) {
    // context.sessionID, context.agent, context.directory, context.worktree, context.abort
    return JSON.stringify({ ... })
  }
})
```

**Never:**
- Define tool args as raw TypeScript interfaces — use `tool.schema` (Zod)
- Define tools inline in `plugin.ts` — extract to `src/tools/`
- Duplicate helpers across tool files — use shared utilities

## AGENTS.md Governance Rules

From `AGENTS.md` — these are project-level conventions:
- **Script rule:** Scripts should REPORT FACTS and leave judgment to the agent. Pure helpers only (exit 0, no governance).
- **Anti-patterns:** No static `.md` files as agent definitions, no bash scripts outside `bin/`, no governance scripts that block progression.
- **Feature bloat:** Keep modules under 500 LOC.
- **Terminology:** Use "Harness" not "Framework", "Agent" not "Claude/AI/model", "Skill" not "Prompt".
- **Git commit discipline:** `phase: what changed — why it matters`. Commit after each meaningful change.

## Build Commands

```bash
npm run build        # Clean + compile TypeScript to dist/
npm run typecheck    # Type-check without emitting (gate before commit)
npm run test         # Run all tests (vitest)
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report (src/**/*.ts)
```

**Pre-commit gate:** Must run `npm run typecheck` before committing.

---

*Convention analysis: 2026-04-06*
