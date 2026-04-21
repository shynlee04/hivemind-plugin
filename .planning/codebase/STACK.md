# Technology Stack

**Analysis Date:** 2026-04-22

## Languages

**Primary:**
- TypeScript 5.0+ — All source code in `src/`, tests in `tests/`

**Secondary:**
- JavaScript (ESM via `"type": "module"` in `package.json`)

## Runtime

**Environment:**
- Node.js >= 20.0.0 (ES2022 target)
- Bun (optional) — PTY support via `bun-pty`, detected at runtime with graceful fallback

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- OpenCode Plugin SDK (`@opencode-ai/plugin` ^1.14.19) — Plugin composition framework
- OpenCode SDK (`@opencode-ai/sdk` ^1.14.19) — Typed API client for session orchestration

**Testing:**
- Vitest ^1.0.0 — Unit test runner with globals, coverage via `--coverage`

**Build/Dev:**
- TypeScript compiler (tsc) — ES2022 → NodeNext, declarations + source maps
- `@types/node` ^20.0.0 — Node.js type definitions
- `@types/bun` ^1.3.8 — Bun type definitions (optional PTY)

## Key Dependencies

**Critical:**
- `zod` ^4.3.6 — Schema validation for prompt-enhance pipeline (`src/schema-kernel/`)
- `bun-pty` ^0.4.8 — PTY session management for background command execution (optional, lazy-loaded)

**Infrastructure:**
- `@opencode-ai/plugin` ^1.14.19 (peer) — Plugin interface, hooks, tool registration
- `@opencode-ai/sdk` ^1.14.19 — Session CRUD, messaging, event streaming

## Configuration

**Environment:**
- No required env vars for build/test
- Runtime state path: `.opencode/state/opencode-harness/`
- Override via `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`
- `.env` / `.env.example` present — MCP API keys for external services (search, GitHub, Notion, etc.)

**Build:**
- `tsconfig.json` — ES2022 target, NodeNext module resolution, strict mode
- `vitest.config.ts` — Test config with coverage on `src/**/*.ts`, excludes index files
- `opencode.json` — Plugin registration (`./dist/plugin.js`), permission model, compaction settings

**TypeScript Compiler Options:**
- `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `verbatimModuleSyntax: true` — Requires `import type` for type-only imports
- `skipLibCheck: true`
- Output: `dist/` with declarations (`.d.ts`) and source maps (`.js.map`)

## Module Architecture

**Package Entrypoints:**
- `opencode-harness` → `./dist/index.js` (library API)
- `opencode-harness/plugin` → `./dist/plugin.js` (OpenCode plugin)

**Internal Module Structure:**
| Layer | Location | Purpose |
|-------|----------|---------|
| Plugin (composition root) | `src/plugin.ts` | Wires hooks + tools, instantiates managers |
| Hooks | `src/hooks/` | Event observers, session lifecycle, tool guards |
| Tools | `src/tools/` | `delegate-task`, `delegation-status`, `run-background-command`, `prompt-skim`, `prompt-analyze`, `session-patch` |
| Core Library | `src/lib/` | Delegation, concurrency, continuity, completion detection, runtime policy |
| Spawner | `src/lib/spawner/` | Session creation, PTY setup, concurrency key resolution |
| PTY | `src/lib/pty/` | PTY manager, buffer, types (lazy-loaded, Bun-only) |
| Shared | `src/shared/` | Tool response envelope, tool helpers |
| Schema Kernel | `src/schema-kernel/` | Zod schemas for prompt-enhance pipeline |

**Dependency Rules:**
- `types.ts` is leaf — depends on nothing, imported by most modules
- `helpers.ts`, `concurrency.ts`, `completion-detector.ts` — leaf or near-leaf
- `lifecycle-manager.ts` depends on most modules (deepest chain: 2 levels)
- No circular dependencies
- Max module size: 500 LOC

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- npm
- TypeScript 5.0+
- Bun (optional, for PTY support)

**Production:**
- Deployed as npm package (`opencode-harness`)
- Loaded as OpenCode plugin via `opencode.json` → `./dist/plugin.js`
- Requires OpenCode runtime >= 1.14.19
- State persisted to `.opencode/state/opencode-harness/session-continuity.json`

## CI/CD

**GitHub Actions:**
- `.github/workflows/opencode.yml` — OpenCode integration on PR/issue comments (`/oc`, `/opencode`)
- Uses `anomalyco/opencode/github@latest` with `zai-coding-plan/glm-5.1` model
- Runs on `ubuntu-latest`
- Additional Qwen workflows: `qwen-triage.yml`, `qwen-invoke.yml`, `qwen-scheduled-triage.yml`, `qwen-review.yml`, `qwen-dispatch.yml`

---

*Stack analysis: 2026-04-22*
