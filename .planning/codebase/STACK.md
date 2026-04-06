# Technology Stack

**Analysis Date:** 2026-04-06

## Languages

**Primary:**
- TypeScript 5.3+ — all source code in `src/**/*.ts`

## Runtime

**Environment:**
- Node.js >= 20.0.0 (enforced via `engines` in `package.json`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

**Module System:**
- ES Modules (`"type": "module"` in `package.json`)

## Language & Compiler

**TypeScript Configuration** (`tsconfig.json`):
- Target: `ES2022`
- Module: `NodeNext`
- Module Resolution: `NodeNext`
- Lib: `["ES2022"]`
- Output: `./dist`
- Source root: `./src`

**Strict Mode** (all enabled):
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `verbatimModuleSyntax: true` — requires `import type` for type-only imports
- `forceConsistentCasingInFileNames: true`

**Output Artifacts:**
- Declarations (`.d.ts`) + declaration maps (`.d.ts.map`)
- Source maps (`.js.map`)
- `types: ["node", "vitest/globals"]`

## Package & Distribution

**Package:** `opencode-harness` v0.1.0
**Description:** Standalone OpenCode harness control plane package for delegated sessions, continuity, and runtime guardrails.

**Entrypoints** (`package.json` exports):
- `opencode-harness` → `./dist/index.js` (with types `./dist/index.d.ts`)
- `opencode-harness/plugin` → `./dist/plugin.js` (with types `./dist/plugin.d.ts`)

**Published Files:** `dist/`, `.opencode/`, `opencode.json`, `README.md`, `LICENSE`

**Peer Dependencies:**
- `@opencode-ai/plugin` >= 1.1.0

## Dependencies

**Production:**
- None (relies on peer dependency `@opencode-ai/plugin`)

**Development:**
- `@types/node` ^20.10.0 — Node.js type definitions
- `typescript` ^5.3.0 — TypeScript compiler
- `vitest` ^4.1.2 — Test runner

**Runtime Contract (peer):**
- `@opencode-ai/plugin` — OpenCode plugin SDK providing:
  - `tool` — tool definition factory
  - `tool.schema` — Zod re-export for type-safe arg definitions
  - Plugin hook system (`event`, `tool.execute.before`, `tool.execute.after`, `system.transform`, `messages.transform`, `shell.env`, `experimental.session.compacting`)
  - `client.*` API surface (`client.session`, `client.tool`, `client.app`, etc.)

**No external runtime dependencies** — all logic is self-contained within the package. No database drivers, no HTTP clients, no external SDKs beyond OpenCode plugin interface.

## Frameworks & Libraries

**Core:**
- OpenCode Plugin SDK — runtime composition engine for tools, hooks, and lifecycle management
- Source: `src/plugin.ts` defines `HarnessControlPlane` as the main plugin

**Testing:**
- Vitest 4.1.2 — test runner with globals mode
- No separate assertion library — uses Vitest built-in `expect`

**No linting/formatting tools detected** — no `.eslintrc`, `.prettierrc`, `biome.json`, or `eslint.config.*` present.

## Build Commands

```bash
npm run clean          # Remove dist/ directory
npm run build          # Clean + compile TypeScript to dist/ with declarations and source maps
npm run typecheck      # Type-check without emitting output (gate before commit)
npm test               # Run all tests via vitest run
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Coverage report (covers src/**/*.ts, excludes src/index.ts)
npm run prepack        # Auto-runs build before npm pack/publish
```

## Test Framework

**Runner:** Vitest 4.1.2
**Config:** `vitest.config.ts`

**Settings:**
- `globals: true` — `describe`, `it`, `expect` available without imports
- `include: ["tests/**/*.test.ts"]`
- `coverage.include: ["src/**/*.ts"]`
- `coverage.exclude: ["src/index.ts"]` (re-export file)
- `typecheck.enabled: false` — type checking done separately via `npm run typecheck`

**Test Files (13 total):**
- `tests/lib/*.test.ts` — unit tests for library modules
- `tests/tools/*.test.ts` — tool-level tests
- `tests/schema-kernel/*.test.ts` — schema validation tests
- `tests/integration/*.test.ts` — integration tests
- `tests/plugins/*.test.ts` — plugin-level tests

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Package manifest, scripts, dependencies, exports |
| `tsconfig.json` | TypeScript compiler configuration |
| `vitest.config.ts` | Test runner configuration |
| `opencode.json` | OpenCode plugin configuration |
| `.gitignore` | Git ignore rules |

**No detected:** `.eslintrc*`, `.prettierrc*`, `biome.json`, `.editorconfig`, `.nvmrc`, `.env*`

## Project Structure Summary

**Source (33 files):**
- `src/plugin.ts` — Main plugin composition (tools + hooks assembly)
- `src/index.ts` — Public API re-exports
- `src/lib/*.ts` — Core library (11 modules: types, helpers, state, concurrency, continuity, lifecycle-manager, session-api, runtime, completion-detector, notification-handler, agent-registry, task-status)
- `src/tools/*/` — Tool implementations (4 tools: prompt-skim, prompt-analyze, context-budget, session-patch)
- `src/hooks/*.ts` — Plugin hooks (system-transform, messages-transform)
- `src/shared/*.ts` — Shared utilities (tool-helpers, tool-response)
- `src/schema-kernel/*.ts` — Schema contracts (prompt-enhance schema)
- `src/plugins/*.ts` — Additional plugins (prompt-enhance)

**Tests (13 files):** Mirror `src/lib/` structure plus tool, schema, integration, and plugin tests.

---

*Stack analysis: 2026-04-06*
