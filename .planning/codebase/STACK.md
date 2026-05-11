# Technology Stack

**Analysis Date:** 2026-05-12

## Languages

**Primary:**
- TypeScript 5.x — All source code in `src/`, compiled via `tsc` to `dist/`. Strict mode with `ES2022` target, `NodeNext` module resolution, `verbatimModuleSyntax`.

**Secondary:**
- JavaScript (CommonJS) — Single CJS shim file `bin/hivemind.cjs` for npm `bin` resolution forwarding to compiled ESM CLI entrypoint.

## Runtime

**Environment:**
- Node.js >=20.0.0 (enforced by `package.json` `engines.node`). CI matrix tests Node 20 and 22.
- Bun (optional runtime) — Used only for PTY support via `bun-pty` optional dependency. Falls back gracefully to `node:child_process` when absent or unavailable.
- OpenCode >=1.14.28 (peer runtime environment constraint).

**Package Manager:**
- npm (lockfile: `package-lock.json` present)

## Frameworks

**Core:**
- `@opencode-ai/plugin` ^1.14.48 — Peer dependency providing the Plugin type, tool registration, hook system, lifecycle APIs. Composition root at `src/plugin.ts`.
- `@opencode-ai/sdk` ^1.14.48 — SDK client for session management (`session.create`, `session.get`, `session.prompt`, etc.). Wrapped in `src/shared/session-api.ts`.

**CLI:**
- `commander` ^14.0.3 — CLI argument parsing for `hivemind` binary. Used in `src/cli/commands/`.
- `ink` ^6.8.0 — React-based CLI rendering framework. Paired with React 19. Used in `src/cli/renderer.ts`.
- `@clack/prompts` ^1.3.0 — Interactive CLI prompts (used in bootstrap commands).

**Testing:**
- `vitest` ^4.1.5 — Test runner with global test APIs (`describe`, `it`, `expect`).
- `@vitest/coverage-v8` ^4.1.5 — V8-based coverage collection.
- Config: `vitest.config.ts` — Coverage thresholds: statements 85%, branches 72%, functions 85%, lines 85%.

**Build/Dev:**
- TypeScript compiler (`tsc`) — No bundler. Compiles `src/` → `dist/` with declarations and source maps.
- `@opencode-ai/plugin` — Loaded as both peer and dev dependency for type-checking during development.

## Key Dependencies

**Critical:**
- `zod` ^4.3.6 — Schema validation used pervasively across all tool implementations and the `src/schema-kernel/` (17 schema modules). All tool inputs validated against Zod schemas.
- `@opencode-ai/plugin` ^1.14.48 — Plugin system framework. Provides `tool()`, hook factories, and SDK client types.
- `@modelcontextprotocol/sdk` ^1.29.0 — MCP server protocol support. Used for MCP server schema definitions in `src/schema-kernel/mcp-server.schema.ts`.

**Infrastructure:**
- `bun-pty` ^0.4.8 — PTY (pseudo-terminal) support for background command execution. Optional dependency — gracefully falls back.
- `node-pty` ^1.1.0 — Alternative PTY library (also optional).
- `web-tree-sitter` ^0.26.8 + `tree-sitter-javascript` ^0.25.0 — Code parsing for AST-based analysis in document intelligence and prompt enhancement features.
- `@ast-grep/cli` ^0.42.1 + `@ast-grep/napi` ^0.42.1 — AST pattern matching for codebase scanning.
- `fast-glob` ^3.3.3 — File globbing for bootstrap and primitive discovery.
- `yaml` ^2.8.3 + `js-yaml` ^4.1.1 + `fast-xml-parser` ^5.7.3 — Multi-format parsing (YAML, XML).
- `gray-matter` ^4.0.3 — Frontmatter parsing for markdown files (skills, agents, commands).
- `jsonc-parser` ^3.3.1 — JSON with comments parsing for config files.
- `diff` ^9.0.0 — Text diff computation (used in config workflow).
- `vscode-jsonrpc` ^8.2.1 — JSON-RPC protocol support.

**UI/Sidecar:**
- `react` ^19.2.6 — UI framework for both CLI rendering (Ink) and sidecar dashboard (Next.js).
- `@json-render/react` ^0.18.0 — Generative UI/structured content rendering for sidecar.
- `@json-render/core` ^0.18.0, `@json-render/ink` ^0.18.0, `@json-render/next` ^0.18.0, `@json-render/react-pdf` ^0.18.0 — JSON Render ecosystem for sidecar dashboard components.

**Sidecar (separate package):**
- `next` ^15.0.0 — Next.js app in `sidecar/` for the read-only dashboard.
- `react-dom` ^19.0.0 — DOM rendering for sidecar.

## Configuration

**Environment:**
- Runtime config file: `.hivemind/configs.json` — JSON schema defined in `src/schema-kernel/hivemind-configs.schema.ts` (version 2.0.0).
- Schema validated config fields: `conversation_language`, `documents_and_artifacts_language`, `mode`, `user_expert_level`, `delegation_systems`, `parallelization`, `atomic_commit`, `commit_docs`, `workflow` (with 13 sub-toggles).
- `.env` file present — contains environment configuration (contents not inspected).
- No environment variables required for build or test.

**Build:**
- `tsconfig.json` — Strict mode, ES2022 target, NodeNext module, source maps, declarations.
- `vitest.config.ts` — Test config with coverage thresholds.

**OpenCode:**
- `opencode.json` — Plugin loader, provider configuration (opencode-go with deepseek-v4-pro/flash), permission model, MCP server registrations.

**MCP:**
- `mcp.json` — 18 MCP server configurations for development tooling (not production dependencies).

## Platform Requirements

**Development:**
- Node.js >=20.0.0
- npm (lockfile `package-lock.json` committed)
- TypeScript 5.x
- Git (for state persistence, session recovery)

**Production:**
- npm package distributed as `hivemind` on npm
- Peer dependency: consuming project must have `@opencode-ai/plugin` >=1.14.48

---

*Stack analysis: 2026-05-12*
