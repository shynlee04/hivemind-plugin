<!-- generated-by: gsd-doc-writer -->
# Technology Stack

**Analysis Date:** 2026-04-28
**Updated:** 2026-05-06

## Languages

**Primary:**
- TypeScript 5.x - All source code (`src/`), tests (`tests/`), and configuration files
- Target: ES2022, Module: NodeNext

**Secondary:**
- Markdown (YAML frontmatter) - Agent/Command/Skill definitions in `.opencode/`
- YAML - Workflow definitions, runtime policies
- JSON - Configuration files (`opencode.json`, `package.json`, `mcp.json`)

## Runtime

**Environment:**
- Node.js >= 20.0.0 (enforced by peer dependency on `@opencode-ai/plugin`)
- Bun (optional — only required for PTY features via `bun-pty`)

**Package Manager:**
- npm (v10+)
- Lockfile: `package-lock.json` present — committed to repo

## Frameworks

**Core:**
- OpenCode Plugin SDK (`@opencode-ai/plugin` ^1.14.28) — Plugin lifecycle, tool registration, hook system. The harness is an OpenCode plugin that registers tools and hooks via the plugin composition root at `src/plugin.ts`.
- OpenCode SDK (`@opencode-ai/sdk` ^1.14.28) — Runtime API for session management (create, prompt, abort, messages, status). Type-only imports for typed wrappers in `src/lib/session-api.ts` and `src/lib/sdk-delegation.ts`.

**Testing:**
- Vitest ^4.1.5 — Test runner with globals enabled. Config at `vitest.config.ts`.
- @vitest/coverage-v8 ^4.1.5 — Coverage provider (v8 engine). Thresholds: 70% statements, 60% branches, 70% functions, 70% lines.

**Build/Dev:**
- TypeScript Compiler (`tsc`) — Build: `tsc` (emits to `dist/`), Typecheck: `tsc --noEmit`. Config at `tsconfig.json`.
- No bundler — TypeScript compiles directly to CommonJS/ESM-compatible output via `NodeNext` module resolution.

## Key Dependencies

**Critical (runtime):**
- `zod` ^4.3.6 — Schema validation for all tool inputs, frontmatter parsing, and configuration. Extensively used in `src/tools/` (delegate-task, delegation-status, configure-primitive, validate-restart) and `src/schema-kernel/` (9 schema files for agent/command/skill/permission/MCP server/tool definitions).
- `yaml` ^2.8.3 — YAML parsing and stringification for primitive compilation/decompilation (`src/lib/config-compiler.ts`, `src/tools/configure-primitive.ts`).
- `gray-matter` ^4.0.3 — Frontmatter parsing for agent/command/skill `.md` files. Used in `src/lib/primitive-loader.ts` and `src/lib/config-compiler.ts`.

**Optional (runtime):**
- `bun-pty` ^0.4.8 — PTY-based background command execution. Lazy-loaded via `src/lib/pty/pty-runtime.ts`. Falls back gracefully to `null` if Bun runtime is unavailable. Powers the `run-background-command` tool (`src/tools/run-background-command.ts`). Not required for core harness operation.

**Dev-only:**
- `@types/node` ^20.0.0 — Node.js type definitions
- `@types/bun` ^1.3.8 — Bun type definitions (for PTY module types)

## Configuration

**Environment:**
- Runtime state path overrides (optional):
  - `OPENCODE_HARNESS_STATE_DIR` — Override default `.hivemind/state/` directory
  - `OPENCODE_HARNESS_CONTINUITY_FILE` — Override continuity file path
  - `OPENCODE_SESSION_ID` — Injected by OpenCode runtime; used by `delegate-task` tool
  - `NODE_ENV` — Controls behavior: `"test"` skips session ID validation
- `.env` file present — contains MCP API keys (never committed; `.env.example` is the template)
- No environment variables required for build or test

**Build:**
- `tsconfig.json` — Strict mode, ES2022 target, NodeNext module resolution, declaration files + sourcemaps, `verbatimModuleSyntax: true`
- `vitest.config.ts` — Globals mode, coverage thresholds, includes `tests/**/*.test.ts` and `eval/**/*.test.ts`

**Package Metadata:**
- `package.json` — npm package `opencode-harness@0.1.0`, ESM (`"type": "module"`), dual entrypoints: `.` and `./plugin`
- `opencode.json` — OpenCode configuration: plugin list, permissions, compaction settings

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- npm >= 10
- Git (for version control)
- Bun (optional — only for PTY commands; harness functions without it)

**Production:**
- OpenCode runtime >= 1.14.28 (specified in `engines.opencode`)
- `@opencode-ai/plugin` >= 1.1.0 as peer dependency
- Local filesystem for state persistence (`.hivemind/state/`)
- No database required
- No external services required for core operation

---

*Stack analysis: 2026-04-28 — updated 2026-05-06 (verified dependency versions)*
