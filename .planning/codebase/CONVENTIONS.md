# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- kebab-case for TypeScript files: `event-classifier.ts`, `consolidated-writer.ts`, `tool-helpers.ts`
- kebab-case for directories: `event-tracker/`, `schema-kernel/`, `agent-work-contract/`
- Test files co-located with source: `formatter.test.ts` next to `formatter.ts`
- Test files in separate root `tests/` for integration/smoke tests: `tests/plugin-assembly-smoke.test.ts`
- Test files always end in `.test.ts` (never `.spec.ts`)
- Red-phase TDD tests may include `.red.test.ts` suffix: `delegation-append.red.test.ts`

**Functions:**
- camelCase: `classifyTurnEvents`, `truncateForDisplay`, `getEffectivePaths`, `createEventHandler`
- Factory pattern for tools: `createHivemindRuntimeStatusTool`, `createHivemindRuntimeCommandTool`
- Handler pattern for hooks: `handleSessionIdleEvent`, `handleCompaction`, `handleTextComplete`
- Builder pattern for test data: `createTestContract`, `makeTurn`, `makeDelegation`

**Variables:**
- camelCase for local variables: `sessionId`, `consolidatedSessionId`, `statusDetail`
- UPPER_SNAKE_CASE for constants: `HIVEMIND_DIR`, `STATE_DIR`, `EVENT_TYPES`, `LOG_PREFIX`
- UPPER_SNAKE_CASE for sentinel ID constants: `HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID`

**Types:**
- PascalCase for interfaces/types: `TrajectoryRecord`, `EventEntry`, `SessionMeta`
- PascalCase for Zod schema objects: `AgentTemplate`, `UserPreferences`, `SkillInjectionRule`
- Union literal types with PascalCase type name: `type EventType = 'user_message' | 'assistant_output' | ...`
- Derived types via `z.infer`: `export type UserExpertLevel = z.infer<typeof UserExpertLevel>`
- Intersection composition for large types: `TrajectoryCore & TrajectoryBindings & TrajectoryEvidence & TrajectoryPlanning`
- Input/output contracts suffixed with `-Input`: `BootstrapTrajectoryInput`, `SessionMetadataInput`
- Read-model projections suffixed with `Synthesis` or `Inspection`: `SynthesisTurnSummary`, `TrajectoryLedgerInspection`

## Code Style

**Formatting:**
- No dedicated formatter config file (no `.prettierrc`, no `.eslintrc`)
- TypeScript strict mode enabled in `tsconfig.json`
- `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`
- 2-space indentation throughout
- Single quotes for string literals
- Semicolons required

**Linting:**
- Custom boundary-guard scripts in `scripts/` (not ESLint-based)
- Scripts enforce architectural rules, not style:
  - `scripts/check-tool-schema.sh` — tools must use `tool.schema` (Zod), not raw TS interfaces
  - `scripts/check-hooks-readonly.sh` — hooks cannot contain direct `writeFile`/`writeFileSync` calls
  - `scripts/check-no-event-bus.sh` — no imports from deleted `shared/event-bus.ts`
  - `scripts/check-no-core-session.sh` — no imports from deleted `core/session/`
  - `scripts/check-sdk-boundary.sh` — SDK-first principle enforcement
  - `scripts/check-plugin-assembly.sh` — plugin entry point must be assembly-only
  - `scripts/check-docs-ownership-boundary.sh` — documentation ownership rules
  - `scripts/check-agents-presence.sh` — agent file presence validation
  - `scripts/check-asset-refs.sh` — shipped asset references validation
- Boundary checks run via `npm run lint:boundary` (part of `npm test`)

**TypeScript Configuration:**
- Config: `tsconfig.json`
- Target: ES2022
- Module: NodeNext with NodeNext resolution
- Strict mode with all flags enabled
- Source root: `./src`
- Output: `./dist`
- JSX: `react-jsx` with `@opentui/react`
- Tests excluded from compilation (`exclude: ["tests"]`)

## Import Organization

**Order:**
1. Node.js built-in modules (`import path from 'node:path'`)
2. External packages (`import { z } from 'zod'`, `import { tool } from '@opencode-ai/plugin'`)
3. Internal cross-sector imports (`import { loadTrajectoryLedger } from '../core/trajectory/index.js'`)
4. Same-sector imports (`import { paths } from './paths.js'`)
5. Type-only imports (`import type { Event } from '@opencode-ai/sdk'`)

**Path Aliases:**
- No path aliases configured
- All imports use relative paths with `.js` extension: `'../shared/tool-helpers.js'`
- `import.meta.dirname` used for directory resolution in test files

**Module Pattern:**
- ESM only (`"type": "module"` in package.json)
- Explicit `.js` extension in all import paths (required by NodeNext resolution)
- Barrel exports via `index.ts` files: `export * from './trajectory/index.js'`

## Error Handling

**Patterns:**
- Structured error hierarchy rooted at `RuntimeError extends Error` in `src/shared/errors.ts`
- Domain-specific subclasses: `ValidationError`, `NotFoundError`, `SchemaMigrationError`, `CorruptionError`, `DelegationError`, `SyncError`
- All errors carry structured metadata: `code`, `context`, `timestamp`
- `Result<T, E>` type for explicit error states (discriminated union with `ok: true/false`)
- Helper functions `ok(value)` and `err(error)` for Result construction
- Zod `.parse()` throws on validation failure; `.safeParse()` for controlled handling
- Errors surfaced (not silently swallowed) per governance principle: "CorruptionError should be surfaced so repair flows can run"

```typescript
// Pattern: structured error with metadata
export class RuntimeError extends Error {
  public readonly code: string
  public readonly context: Record<string, unknown>
  public readonly timestamp: string
  constructor(message: string, code: string, context: Record<string, unknown> = {}) {
    super(message)
    this.code = code
    this.context = context
    this.timestamp = new Date().toISOString()
  }
}

// Pattern: Result type for controlled error handling
export type Result<T, E extends RuntimeError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

## Logging

**Framework:** Dual-path logging via `src/shared/logging.ts`

**Patterns:**
- `log.info(msg, ...args)` — standard info logging
- `log.warn(msg, ...args)` — warning conditions
- `log.error(msg, ...args)` — error conditions
- `log.debug(msg, ...args)` — only when `HIVEMIND_DEBUG` env var is set
- All messages prefixed with `[HiveMind]` and level indicator
- Best-effort SDK logging via `client.app.log()` (falls back silently if SDK unavailable)
- Direct `console.warn` used in hot paths for performance (e.g., `event-handler.ts` unknown event types)

```typescript
import { log } from '../shared/logging.js'

log.info('Session initialized', { sessionId })
log.warn('Unknown event type', { eventType })
log.error('Failed to write event', { error: err.message })
```

## Comments

**When to Comment:**
- Module-level JSDoc on every file: `@module shared/errors`
- Purpose description on exported functions and classes
- Inline comments for architectural decisions and non-obvious behavior
- Section separators using `// ───` or `// ---` dividers

**JSDoc/TSDoc:**
- `@param` and `@returns` on all exported functions in `src/shared/`
- `@example` on utility functions: `@example parseList('a, b, c') // ['a', 'b', 'c']`
- `@module` tag on all file headers
- No JSDoc on test helper functions (only on module headers)

## Function Design

**Size:** ~300 LOC hard limit for tool implementations (enforced by AGENTS.md governance)

**Parameters:**
- Options objects for functions with >2 parameters: `handleCompaction({ sessionID }, { context, prompt }, projectRoot)`
- `ToolContext` from SDK used as-is: `async execute(args, context)`
- Zod-validated args via `tool.schema` for all tool definitions

**Return Values:**
- Tools return `JSON.stringify()` — agents parse JSON
- Store operations return typed results: `Promise<T | null>` for gets, `Promise<void>` for mutations
- Validation functions return Zod parse results (throws on invalid)

## Module Design

**Exports:**
- Named exports only; no default exports on module files
- `export type` for type-only exports to enable tree-shaking
- Barrel files re-export via `export * from './module.js'`

**Barrel Files:**
- Every directory has an `index.ts` barrel: `src/tools/index.ts`, `src/core/index.ts`
- Root barrel: `src/index.ts` exports all sectors
- Plugin entry: separate from barrel — `dist/plugin/opencode-plugin.js`

**File Organization per Directory:**
- `types.ts` — type/interface definitions (when not co-located)
- `tools.ts` — tool implementation
- `index.ts` — barrel exports
- `.test.ts` — co-located tests
- Sector `AGENTS.md` — governance charter for the directory

## Architectural Rules (Enforced by Boundary Scripts)

1. **CQRS**: Tools write, hooks are read-only, plugin assembles
2. **SDK-First**: Use `tool.schema` (Zod), `client.app.log()`, `context.ask()` — never reimplement
3. **Interface Decomposition**: No type exceeds 10 fields at core level; use intersection composition
4. **Authority Principle**: Each concern has ONE owner (one file, one module)
5. **Projection-Not-Authority**: Root markdown commands are projections; behavior lives in TypeScript
6. **Path Authority**: All `.hivemind/` paths resolved via `getEffectivePaths()` in `src/shared/paths.ts`

---

*Convention analysis: 2026-03-27*
