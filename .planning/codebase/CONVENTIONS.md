# Coding Conventions

**Analysis Date:** 2026-05-07

## TypeScript Configuration

**Compiler settings (`tsconfig.json`):**
- Target: `ES2022` with `NodeNext` module and module resolution
- `strict: true` — all strict checks enabled
- `noUnusedLocals: true` — unused local variables cause compilation errors
- `noUnusedParameters: true` — unused function parameters cause compilation errors
- `noImplicitReturns: true` — all code paths in functions must explicitly return
- `noFallthroughCasesInSwitch: true` — switch case fallthrough is forbidden
- `verbatimModuleSyntax: true` — requires `import type` for type-only imports, no automatic elision
- `skipLibCheck: true` — skips type-checking of `.d.ts` files from dependencies

**Module system:** ESM exclusively (`"type": "module"` in `package.json`). All imports use `.js` extensions (e.g., `from "./types.js"`).

## Module Size Limits

- **Hard cap:** 500 LOC per module. No file may exceed this limit.
- **Target:** 300 LOC per module (stated in architecture proposal).
- **Largest current modules:**
  - `src/lib/delegation-manager.ts` — 500 LOC (at cap)
  - `src/lib/continuity.ts` — 465 LOC (under cap, ~401 code)
  - `src/lib/delegation-state-machine.ts` — 426 LOC
- Modules approaching 500 LOC should be split into subdirectory packages with a barrel `index.ts`.

## Naming Patterns

**Files:**
- kebab-case: `delegation-manager.ts`, `session-journal.ts`, `lifecycle-manager.ts`
- Barrel index files: `index.ts` in subdirectory packages
- Test files: mirror source structure with `.test.ts` suffix

**TypeScript types:**
- PascalCase type aliases exclusively: `TaskStatus`, `SessionContinuityRecord`, `PermissionRule`
- No `interface` keyword — all types are `export type PascalCase =`
- Union literal types for enums: `TaskStatus = "pending" | "queued" | "running" | ...`
- Extended/intersected types: `PendingNotification = TaskNotification & { createdAt: number }`
- Branded type aliases: `SpecialistAgent = string`
- `Record<>` for maps: `Record<string, number>`
- Function type signatures: `(from: TaskStatus, to: TaskStatus) => boolean`

**Functions:**
- camelCase: `unwrapData`, `extractAssistantText`, `cloneContinuityRecord`
- Common verb prefixes: `extract*`, `build*`, `make*`, `clone*`, `get*`, `is*` (type guards), `as*` (safe casts), `resolve*`, `ensure*`
- Internal (non-exported) functions: use camelCase without `_` prefix
- Pure utility functions are preferred — side effects must be explicit

**Constants:**
- UPPER_SNAKE_CASE: `MAX_DESCENDANTS_PER_ROOT`, `VALID_DELEGATION_CATEGORIES`, `CONTINUITY_VERSION`
- Read-only arrays use `as const`: `VALID_DELEGATION_CATEGORIES = [...] as const`
- Derived types from constants: `DelegationCategory = (typeof VALID_DELEGATION_CATEGORIES)[number]`

**Skill/Agent prefixes (meta-concepts):**
- `hm-*` — product development (brainstorm, requirements, planning, implementation, testing)
- `hf-*` — meta-builder (skill authoring, agent building, command creation)
- `gate-*` — internal quality gates (lifecycle, spec, evidence)
- `stack-*` — technology reference (vitest, zod, opencode, nextjs, bun-pty, json-render)

## Code Style

**Formatting:**
- Indentation: 2 spaces
- Semicolons: not enforced (inferred from `tsconfig.json` — no explicit `semi` rule)
- Quotes: single quotes preferred (used in most source files)
- Trailing commas: not enforced at config level, but used sparingly

**TypeScript strictness:**
- No `any` types on new code — the `client: any` in SDK wrappers is documented tech debt
- `import type { ... }` for all type-only imports (enforced by `verbatimModuleSyntax: true`)
- Explicit return types on exported functions when non-trivial
- `as const` for literal arrays that should be read-only

**Section dividers:**
- `// ----...` separator comments with descriptive headers between logical sections
- ASCII tables in JSDoc for dense metadata (e.g., lifecycle phase tables in `types.ts`)

## Import Organization

**Order (observed convention):**
1. Node.js built-in modules (`node:crypto`, `node:fs`, `node:path`)
2. Third-party / npm packages
3. Workspace-relative imports (`../../src/lib/types.js`)
4. `import type` imports (can be mixed with runtime imports or separate)

**Path conventions:**
- Always use `.js` extension in imports (ESM resolution)
- Relative paths from the importing file: `from "./types.js"`, `from "../../src/lib/helpers.js"`
- Path aliases: not used. All imports are relative or bare specifiers.
- Barrel re-exports: `src/index.ts` re-exports public API from multiple internal modules

**Leaf module rule:**
- `src/lib/types.ts` is the leaf module — it imports nothing from other `src/lib/` modules (only `import type` from `delegation-types.ts`)
- All other modules depend on `types.ts` directly or transitively
- Circular dependencies: zero detected — verified by audit

## JSDoc Requirements

**When to document:**
- All exported functions and classes must have JSDoc
- Internal helper functions should have JSDoc if non-trivial (>5 lines or multiple branches)
- Type definitions should have JSDoc when the semantics aren't obvious from the name

**Format:**
```typescript
/**
 * Extract a human-readable error message from OpenCode SDK error objects.
 *
 * SDK error structures vary — this function checks all known shapes:
 *   - String error: used as-is
 *   - Named errors (UnknownError, MessageAbortedError): `error.data.message`
 *   - BadRequestError: `error.errors[]` array with `.message` or `.reason`
 *   - Fallback: includes error name if available
 *
 * @param error - The raw error value from an SDK response.
 * @returns A string description suitable for throwing or logging.
 */
function extractSdkErrorMessage(error: unknown): string {
```

**Key tags:**
- `@param` — parameter descriptions (present in newer modules: 586 matches across `src/lib/`)
- `@returns` — return value description
- `@throws` — when the function explicitly throws
- `@example` — usage examples (used sparingly)
- `@see` / `{@link ...}` — cross-references to related functions
- `@future-consumer` — marks code that is pre-built for a planned future phase (e.g., toggle gates, sidecar)

**Style:**
- Prose descriptions embedded in the JSDoc body
- Complete sentences with punctuation
- Multi-paragraph structure: summary line → detailed description → parameter list

## Error Handling

**Error prefix:**
- ALL thrown errors in the core library MUST use the `[Harness]` prefix: `throw new Error("[Harness] <message>")`
- This is used in 151 locations across `src/`
- Exception (non-compliance): a few throw messages in schema files lack the prefix — these are known gaps

**Sub-patterns:**
- Base: `[Harness] <description>`
- Recovery module: `[Harness] recovery REC-NN: <description>` (e.g., `"[Harness] recovery REC-03: sessionId must be a non-empty string"`)
- Sidecar module: `[Harness] sidecar SIDECAR-NN: <description>` (e.g., `"[Harness] sidecar SIDECAR-03: read denied for non-canonical path"`)

**Testing errors:**
```typescript
expect(() => unwrapData({ error: "Something went wrong" })).toThrow(
  "[Harness] Something went wrong"
)
```
Use exact `[Harness]` prefix string matching when testing error messages.

**Patterns:**
- Errors are for flow control, not bugs — the `[Harness]` prefix identifies harness-originated errors
- `console.error('[Harness] ...')` for non-throwing error-level logging
- State warnings: `addWarning()` in `state.ts` caps at 25 per session
- Corrupt state files: quarantined to `<path>.corrupt-<timestamp>-<pid>-<uuid>` for auditability

## Logging

**Framework:** `console` (no logging library used)
- `console.error('[Harness] ...')` for error conditions
- Warning accumulation via `addWarning()` in `state.ts` (25 per session cap)
- No structured logging framework — bare `console` with `[Harness]` prefix

## Module Design

**Exports:**
- Named exports only — no `export default` observed in core library
- Barrel files: `index.ts` re-exports from sibling modules
- Public API: `src/index.ts` (27 lines) defines the package's public surface
- Plugin entry: `src/plugin.ts` (183 lines) is the composition root — imports and wires all runtime modules

**Dependency rules:**
- Kill chain: max 2 levels deep (`plugin.ts` → `delegation-manager.ts` → `types.ts`)
- No circular dependencies (verified by audit)
- Leaf modules: `types.ts`, `helpers.ts`, `concurrency.ts` — near-zero imports
- `continuity.ts` has a `storeCache` singleton at module level (documented code smell)

**Module structure pattern for subdirectory packages:**
```
src/lib/<package>/
├── index.ts           # Barrel re-exports
├── types.ts           # Package-specific types
├── <primary-module>.ts   # Main implementation
└── ...
tests/lib/<package>/
├── <primary-module>.test.ts
└── ...
```

## Git Workflow

**Commit format:**
```
type(scope): description — extended detail

Uses conventional commits:
- `feat(scope): ...` — new functionality
- `fix(scope): ...` — bug fix
- `docs(scope): ...` — documentation and planning
- `test(scope): ...` — test additions or fixes
```

**Scope naming:** Phase-based scopes matching ROADMAP.md phase IDs (e.g., `CA-03`, `CA-03-01`, `CA-03-02`).

**Atomic commits:**
- Each commit represents one logical change
- TDD commits: `test(CA-03-02): add failing tests for atomic_commit toggle` followed by `feat(CA-03-02): implement atomic_commit toggle gate`
- No accumulation: commit after each meaningful change (subagent return, phase completion, gate pass)

**Force push:**
- NEVER force push to main/master
- NEVER run `--no-verify` or `--no-gpg-sign` without explicit user request

**Git structure is NOT managed by agents:** Agents may only manage commits for their own work — they do not constrain or override commits from other development activity.

## File Organization

**Canonical directories:**
- `.opencode/` — ONLY for OpenCode primitives (agents, commands, skills, rules, permissions). NO runtime state.
- `.hivemind/` — Internal deep module state (journals, lineage, runtime state, graph/vector memory). Canonical per Q6.
- `.planning/` — GSD planning artifacts (codebase maps, audits, plans, specs)

**No generated files in source:** `dist/` is gitignored, generated by `tsc`.

## TODO / FIXME Conventions

**Result of full codebase scan:** Zero occurrences of `TODO`, `FIXME`, `HACK`, or `XXX` in source files.

Code smells and known issues are documented in `src/lib/AGENTS.md` CODE SMELLS section, not inline:
1. `continuity.ts` (401 LOC) — under split threshold but monitored
2. `delegation-manager.ts` (450 LOC) — largest functional module
3. `asString` duplicated in `helpers.ts` and `continuity.ts` — consolidation pending
4. `continuity.ts:26` module-level `storeCache` singleton — prevents isolated unit testing

## Deep-Clone Conventions

**Location:** `src/lib/continuity.ts` lines 87-152

**Pattern:** 8 inline `clone*()` functions that perform recursive spread + array copy:
```typescript
function cloneDelegationMeta(meta: DelegationMeta | null): DelegationMeta | null {
  if (!meta) return null
  return { ...meta }
}

function cloneContinuityRecord(record: SessionContinuityRecord): SessionContinuityRecord {
  return {
    ...record,
    metadata: {
      ...record.metadata,
      delegation: cloneDelegationMeta(record.metadata.delegation),
      constraints: [...record.metadata.constraints],
      pendingNotifications: clonePendingNotifications(record.metadata.pendingNotifications),
      // ... more sub-cloners
    },
  }
}
```

**Principle:** Deep-clone-on-read — all data read from the continuity store is cloned before return to prevent mutation aliasing. The composable `cloneContinuityRecord()` chains all sub-cloners.

---

*Convention analysis: 2026-05-07*
