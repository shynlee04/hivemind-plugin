# Technology Stack

> Generated: 2026-04-21
> Agent: gsd-codebase-mapper (tech-focus)

## Languages

**Primary:**
- TypeScript 5.x (`^5.0.0`) — All source code in `src/`, strict mode enabled

**Secondary:**
- Not applicable — pure TypeScript project, no embedded languages

## Runtime

**Environment:**
- Node.js `>=20.0.0` (specified in `engines` field)
- ES2022 target compilation
- ESM modules (`"type": "module"` in `package.json`, `"module": "NodeNext"` in tsconfig)

**Package Manager:**
- npm (inferred from `package.json` — no `pnpm-lock.yaml` or `yarn.lock`)
- Lockfile: Not verified in worktree

## Frameworks

**Core:**
- `@opencode-ai/sdk` `^1.4.2` — OpenCode client SDK for session management, delegation, and event handling
- `@opencode-ai/plugin` `>=1.1.0` (peer dependency) — OpenCode plugin API for tool/hook registration

**Schema Validation:**
- `zod` `^4.0.0` — Runtime schema validation for tool inputs, pipeline contracts, and config validation

**Testing:**
- `vitest` `^1.0.0` — Test runner with globals mode enabled
- Config: `vitest.config.ts` — globals: true, includes `tests/**/*.test.ts`

**Build/Dev:**
- `typescript` `^5.0.0` (dev) — TypeScript compiler
- `@types/node` `^20.0.0` (dev) — Node.js type definitions

## Key Dependencies

**Critical:**
- `@opencode-ai/sdk` `^1.4.2` — Provides `createOpencodeClient`, session CRUD, prompt sending, event subscription. Used throughout `src/lib/session-api.ts`, `src/lib/delegation-manager.ts`
- `zod` `^4.0.0` — Schema definitions for all tool inputs (`src/tools/delegate-task.ts`, `src/tools/delegation-status.ts`) and pipeline contracts (`src/schema-kernel/prompt-enhance.schema.ts`)
- `@opencode-ai/plugin` `>=1.1.0` (peer) — Provides `Plugin` type, `tool()` factory, `tool.schema` builder. Used in `src/plugin.ts` and all tool files

**Infrastructure:**
- `node:fs` — File persistence for continuity store (`src/lib/continuity.ts`) and delegations (`src/lib/delegation-manager.ts`)
- `node:path` — Path utilities for storage locations
- `node:crypto` — UUID generation for delegation IDs (`crypto.randomUUID()`)

## TypeScript Configuration

**Strict Mode (all enabled):**
- `strict: true` — Full strict mode
- `noUnusedLocals: true` — Error on unused local variables
- `noUnusedParameters: true` — Error on unused function parameters
- `noImplicitReturns: true` — Error on missing return statements
- `noFallthroughCasesInSwitch: true` — Error on switch fallthrough
- `verbatimModuleSyntax: true` — Must use `import type` for type-only imports

**Compilation:**
- Target: `ES2022`
- Module: `NodeNext` (ESM with `.js` extension imports)
- Module Resolution: `NodeNext`
- Output: `./dist/` (from `./src/`)
- Declarations: enabled (`declaration: true`, `declarationMap: true`)
- Source Maps: enabled (`sourceMap: true`)
- Skip lib check: enabled (`skipLibCheck: true`)

**Important:** Import paths must use `.js` extensions (e.g., `import { X } from "./module.js"`) due to `NodeNext` module resolution, even though source files are `.ts`.

## Build System

**Scripts:**
| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript (`tsc`) — outputs to `dist/` |
| `npm run typecheck` | Type-check only (`tsc --noEmit`) |
| `npm run test` | Run all tests (`vitest run`) |
| `npm run test:watch` | Watch mode (`vitest`) |
| `npm run test:coverage` | Coverage report (`vitest run --coverage`) |
| `npm run prepack` | Auto-build before `npm pack` / `npm publish` |

**Package Entrypoints:**
- `opencode-harness` → `./dist/index.js` (main + types)
- `opencode-harness/plugin` → `./dist/plugin.js` (import + types)

**File inclusion:** Only `dist/` directory is published (via `files` field)

## Tooling

**Test Framework:**
- Vitest `^1.0.0` with globals enabled (no imports needed for `describe`, `it`, `expect`)
- Config: `vitest.config.ts`
- Test location: `tests/` directory (mirrors `src/` structure)
- Coverage: `src/**/*.ts`, excludes `src/index.ts` and `src/**/index.ts`
- Coverage reporters: text, lcov

**Linting/Formatting:**
- No dedicated linter config detected (no `.eslintrc`, `eslint.config.*`, `biome.json`)
- TypeScript strict mode serves as primary code quality enforcement
- No `.prettierrc` or formatting config detected

**CLI Tools:**
- None — this is a library package, not a CLI

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- npm (for dependency management)
- No external services required for build/test

**Production:**
- OpenCode runtime environment (provides the `@opencode-ai/plugin` peer dependency)
- File system access for continuity store and delegation persistence
- Default state directory: `.opencode/state/opencode-harness/`

---

*Stack analysis: 2026-04-21*
