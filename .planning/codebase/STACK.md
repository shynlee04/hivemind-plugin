# Technology Stack

**Analysis Date:** 2026-05-08

## Languages

**Primary:**
- TypeScript (strict mode) — Entire codebase. Target ES2022, module NodeNext.

**Secondary:**
- JavaScript (CommonJS) — `bin/hivemind.cjs` CLI shim only
- Shell (bash) — `bin/validate-*.sh` validation scripts
- TSX (React) — `sidecar/src/app/` Next.js dashboard pages
- Markdown — Documentation, skill definitions, agent definitions

## Runtime

**Environment:**
- Node.js >= 20.0.0 (per `package.json` engines field)
- OpenCode >= 1.14.28 (peer dependency, per engines field)

**Package Manager:**
- npm (lockfile: `package-lock.json` present)
- No yarn.lock, pnpm-lock.yaml, or bun.lock detected

## Frameworks

**Core:**
- OpenCode Plugin SDK (`@opencode-ai/plugin` ^1.14.28) — Plugin composition root, hooks, tools, lifecycle integration; imported as `Plugin` type in `src/plugin.ts`
- OpenCode Client SDK (`@opencode-ai/sdk` ^1.14.28) — Session CRUD, agent management, delegation dispatch; wrapped in `src/shared/session-api.ts` and `src/shared/app-api.ts`

**CLI:**
- Commander ^14.0.3 — CLI argument parsing in `src/cli/`
- Ink ^6.8.0 — React-based terminal rendering (CLI)
- @clack/prompts ^1.3.0 — Interactive CLI prompts in `src/cli/commands/init.ts`

**Dashboard (Sidecar):**
- Next.js (unversioned — foundation stub only, not installed) — `sidecar/next.config.ts`, `sidecar/src/app/page.tsx`
- React ^19.2.6 — Sidecar UI rendering
- @json-render/core, @json-render/react, @json-render/next, @json-render/ink, @json-render/react-pdf (all ^0.18.0) — Generative UI framework for the sidecar dashboard

**Testing:**
- Vitest ^4.1.5 — Test runner with globals (`vitest.config.ts`)
- @vitest/coverage-v8 ^4.1.5 — Coverage provider (v8 engine)

**Build/Dev:**
- TypeScript ^5.0.0 — Compiler (`tsc`), strict mode, no bundler
- No ESLint or Prettier configuration detected

## Key Dependencies

**Critical:**
- zod ^4.3.6 — Schema validation for all tool inputs, configs, and domain types in `src/schema-kernel/`
- fast-glob ^3.3.3 — File pattern matching used across tools and features
- yaml ^2.8.3 — YAML parsing for config files and OpenCode primitives
- js-yaml ^4.1.1 — Secondary YAML parser
- gray-matter ^4.0.3 — Frontmatter parsing for markdown files (skills, agents, docs)
- diff ^9.0.0 — Text diffing for session patches and trajctory
- fast-xml-parser ^5.7.3 — XML parsing for prompt analysis
- jsonc-parser ^3.3.1 — JSONC parsing for OpenCode config files
- vscode-jsonrpc ^8.2.1 — JSON-RPC 2.0 protocol implementation

**Infrastructure:**
- @ast-grep/cli ^0.42.1, @ast-grep/napi ^0.42.1 — Structural code search (AST pattern matching)
- tree-sitter-javascript ^0.25.0, web-tree-sitter ^0.26.8 — Syntax tree parsing for code analysis
- @modelcontextprotocol/sdk ^1.29.0 — MCP protocol library (available for future MCP server integration; not yet directly used in src/)

**PTY / Background Commands:**
- bun-pty ^0.4.8 — PTY integration for Bun runtime (optional dependency, lazy-loaded in `src/features/background-command/pty/pty-runtime.ts`)
- node-pty ^1.1.0 — PTY fallback for Node.js runtime
- bun-types ^1.3.13 — Type definitions for Bun runtime APIs

## Configuration

**Environment:**
- `.env` files: Not detected in repository
- Key runtime env vars used in source:
  - `OPENCODE_SESSION_ID` — Current session context (`src/tools/delegation/delegate-task.ts:25`, `src/tools/delegation/delegate-task.ts:46`)
  - `OPENCODE_CONFIG_DIR` — OpenCode config directory (`src/cli/commands/init.ts:58`, `src/cli/commands/doctor.ts:135`, `src/config/compiler.ts:73`, `src/tools/config/configure-primitive-paths.ts:23`, `src/tools/config/bootstrap-init.ts:197`)
  - `OPENCODE_HARNESS_STATE_DIR` — Override harness state directory (`src/tools/delegation/delegate-task.ts:25`)
  - `OPENCODE_HARNESS_CONCURRENCY_LIMIT` — Concurrency control (`src/task-management/lifecycle/index.ts:80`, default: 3)
  - `NODE_ENV` — Test environment detection (`src/shared/session-api.ts:29`)
  - `CI` — Non-interactive mode flag (`src/cli/commands/init.ts:58`)
  - `HOME` — User home directory fallback for config paths

**Build:**
- `tsconfig.json` — Root TS config: ES2022 target, NodeNext module, strict mode, declarations, source maps
- `vitest.config.ts` — Test config: globals enabled, coverage thresholds (85% statements, 72% branches, 85% functions, 85% lines)
- `opencode.json` — OpenCode runtime config: plugin loading order, model provider (Osiris), permissions
- `sidecar/tsconfig.json` — Next.js-specific TS config: ESNext module, JSX preserve, bundler resolution

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- npm (lockfile: `package-lock.json`)
- OpenCode CLI >= 1.14.28 (for runtime plugin execution)
- Git (for workspace operations)

**Production:**
- OpenCode runtime environment (plugin loaded via `opencode.json` `plugin` field)
- File system access for `.hivemind/` state persistence
- Optional: Bun runtime for PTY/background command support

---

*Stack analysis: 2026-05-08*
