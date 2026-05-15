# Technology Stack

**Analysis Date:** 2026-05-15

## Languages

**Primary:**
- TypeScript 5.0+ — all runtime source (`src/`), schemas (`src/schema-kernel/`), tools (`src/tools/`), hooks (`src/hooks/`), CLI (`src/cli/`)

**Secondary:**
- JavaScript (CommonJS shim) — `bin/hivemind.cjs` only (argv forwarder to compiled ESM)
- JSX/TSX — sidecar dashboard (`sidecar/src/app/`)

## Runtime

**Environment:**
- Node.js >= 20.0.0 (tested on 20 and 22 via CI matrix)
- OpenCode >= 1.14.28 (peer runtime requirement)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- `@opencode-ai/plugin` ^1.14.41 — OpenCode plugin SDK (composition root, tool/hook registration)
- `@opencode-ai/sdk` ^1.14.41 — OpenCode client SDK (session API, delegation)

**Testing:**
- Vitest ^4.1.5 — test runner with globals, V8 coverage provider
- `@vitest/coverage-v8` ^4.1.5 — coverage reporting (thresholds: 85/72/85/85)

**Build/Dev:**
- TypeScript 5.0+ — compiler (ES2022 target, NodeNext modules, strict mode)
- `@types/node` ^20.0.0 — Node.js type definitions
- `@types/bun` ^1.3.8 — Bun type definitions (optional PTY backend)
- `bun-types` ^1.3.13 — Bun runtime types (optional dependency)

**UI (Sidecar — deferred):**
- Next.js ^15.0.0 — read-only dashboard (App Router, `sidecar/`)
- React ^19.2.6 — UI framework (main package) + ^19.0.0 (sidecar)
- `react-dom` ^19.0.0 — sidecar rendering

## Key Dependencies

**Schema Validation:**
- `zod` ^4.3.6 — all runtime schemas (`src/schema-kernel/`), config validation, tool input contracts

**PTY / Terminal:**
- `bun-pty` ^0.4.8 — optional PTY backend (graceful fallback to headless `node:child_process`)
- `node-pty` ^1.1.0 — native PTY fallback when `bun-pty` unavailable

**CLI / Prompting:**
- `commander` ^14.0.3 — CLI argument parsing (`src/cli/`)
- `@clack/prompts` ^1.3.0 — interactive CLI prompts

**File/Text Processing:**
- `fast-glob` ^3.3.3 — glob pattern matching (codebase scanning, primitive loading)
- `gray-matter` ^4.0.3 — YAML frontmatter parsing (skills, agents, commands, workflows)
- `yaml` ^2.8.3 — YAML serialization (config compilation, session persistence)
- `js-yaml` ^4.1.1 — YAML parsing
- `jsonc-parser` ^3.3.1 — JSON with comments parsing
- `diff` ^9.0.0 — diff generation (session patch, config changes)
- `fast-xml-parser` ^5.7.3 — XML parsing (doc intelligence)

**Code Analysis:**
- `@ast-grep/napi` ^0.42.1 — AST-based code analysis (structural search)
- `@ast-grep/cli` ^0.42.1 — AST-grep CLI integration
- `web-tree-sitter` ^0.26.8 — incremental parsing
- `tree-sitter-javascript` ^0.25.0 — JavaScript grammar for tree-sitter

**JSON-RPC / MCP:**
- `@modelcontextprotocol/sdk` ^1.29.0 — Model Context Protocol SDK
- `vscode-jsonrpc` ^8.2.1 — JSON-RPC protocol support

**UI Rendering (Generative):**
- `@json-render/core` ^0.18.0 — JSON-to-UI rendering core
- `@json-render/react` ^0.18.0 — React component renderer
- `@json-render/ink` ^0.18.0 — terminal UI renderer
- `@json-render/next` ^0.18.0 — Next.js integration
- `@json-render/react-pdf` ^0.18.0 — PDF output generation

**Terminal UI:**
- `ink` ^6.8.0 — React-based CLI UI framework

## Configuration

**Environment:**
- No environment variables required for build/test
- Runtime state override: `OPENCODE_HARNESS_STATE_DIR` (custom state directory)
- Runtime state override: `OPENCODE_HARNESS_CONTINUITY_FILE` (custom continuity file)
- Session context: `OPENCODE_SESSION_ID` (fallback for session identification)

**Build:**
- `tsconfig.json` — ES2022 target, NodeNext modules, strict mode, verbatim module syntax
- `vitest.config.ts` — test config with V8 coverage, thresholds (85/72/85/85)
- `sidecar/tsconfig.json` — sidecar TypeScript config
- `sidecar/next.config.ts` — Next.js config (reactStrictMode, read-only enforcement)

**Schema Generation:**
- `src/schema-kernel/generate-config-json-schema.ts` — post-build JSON Schema generation for configs
- `.hivemind/configs.schema.json` — shipped config schema

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- npm for package management
- `npm run build` — compiles `src/` → `dist/` with declarations + source maps
- `npm run typecheck` — type-check without emitting
- Bun runtime optional (for PTY backend; falls back gracefully)

**Production:**
- npm package entrypoints: `hivemind` → `./dist/index.js`, `hivemind/plugin` → `./dist/plugin.js`, `hivemind/cli` → `./dist/cli/index.js`
- CLI binary: `hivemind` → `./bin/hivemind.cjs`
- Prepack runs build automatically: `npm pack` / `npm publish`
- Runtime state path: `.hivemind/state/` (canonical per Q6)
- Peer dependency: `@opencode-ai/plugin` >= 1.1.0

**CI/CD:**
- GitHub Actions — `ci.yml` (build + test on Node 20/22, typecheck on Node 22)
- Branches: `oss-dev`, `main`
- Coverage report generated on Node 22 matrix

---

*Stack analysis: 2026-05-15*
