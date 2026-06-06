# Technology Stack

**Analysis Date:** 2026-06-06

## Languages

**Primary:**
- TypeScript 5.x (ES2022 target, NodeNext modules) — All application code in `src/`, `tests/`, `eval/`, and the sidecar workspace at `sidecar/src/`. Strict mode is enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`).

**Secondary:**
- JavaScript (Node ESM) — Build orchestration and runtime helpers: `scripts/sync-assets.js`, `scripts/transform-gsd-to-hm.js`, `scripts/generate-registry.cjs`. The CJS `bin/hivemind.cjs` shim forwards argv into the compiled ESM CLI.
- POSIX Shell (`sh`/`bash`) — Local lint-style validation scripts: `bin/validate-agent-config.sh`, `bin/validate-load-order.sh`, `bin/validate-runtime-paths.sh`, `scripts/sync-oss.sh`, `scripts/verify-sr11.sh`, plus test shells in `tests/scripts/`.
- Markdown + YAML frontmatter — Configuration for OpenCode agents, skills, commands, and rules (e.g. `opencode.json`, `.opencode/agents/*.md`, `.hivemind/configs.json`).
- JSON / JSONC — Schema definitions in `src/schema-kernel/*.schema.ts` (Zod), runtime state files under `.hivemind/state/`, and the sidecar catalog in `src/sidecar/catalog/json-render-catalog.json`.

## Runtime

**Environment:**
- Node.js >= 20.0.0 (LTS line 20.x; CI matrix tests 20 and 22 in `.github/workflows/ci.yml`). Enforced by the `engines.node` field in `package.json`.
- Bun — Optional host runtime for `bun-pty` (`^0.4.8`) and PTY-backed commands. `isSupported()` in `src/features/background-command/pty/pty-manager.ts` gates on `typeof Bun !== "undefined"`. `bun-types` is a dev dependency for type completion.
- TypeScript 5.x compiler (`^5.0.0`) — `tsconfig.json` emits ES2022 modules to `dist/` with declarations and source maps.
- No browser runtime required — this is a server-side plugin package. The sidecar (Next.js 16) renders in a browser but is a separate workspace.

**Package Manager:**
- npm (lockfile `package-lock.json` present, 217 KB at audit time). The sidecar has its own `sidecar/package-lock.json` and `sidecar/node_modules/`.
- Two workspaces coexist at the repo root: the npm package at the project root and the private `@opencode-harness/sidecar` workspace under `sidecar/`.

## Frameworks

**Core:**
- OpenCode Plugin SDK (`@opencode-ai/plugin` `^1.16.2`, peer+dev dependency) — Provides the `Plugin` type and `tool()` factory used by every tool in `src/tools/`. The composition root is `src/plugin.ts` (function `HarnessControlPlane`).
- OpenCode Client SDK (`@opencode-ai/sdk` `^1.16.2`) — Typed `createOpencodeClient()` used by `src/shared/session-api.ts` to drive session lifecycle, message sending, and child-session creation. Re-exported type `OpenCodeClient = ReturnType<typeof createOpencodeClient>`.
- AI SDK — Vercel AI SDK's OpenAI-compatible provider (`@ai-sdk/openai-compatible` `^2.0.47`) is declared as a dependency even though it is currently consumed indirectly through the OpenCode provider config in `opencode.json`.
- Model Context Protocol — `@modelcontextprotocol/sdk` `^1.29.0` is declared for any consumer wiring MCP servers into the harness; the workspace MCP roster itself lives in `.mcp.json` / `mcp.json`.
- Hivemind runtime composition engine — Plugin/hooks/tools all sit on this in-house framework (the `src/` tree itself). Hivemind is the product, not a third-party framework.

**Sidecar UI (separate workspace):**
- Next.js 16.2 (`^16.2.2`, declared in `sidecar/package.json`) — App-Router frontend (see `sidecar/src/app/`). `sidecar/next.config.ts` uses `output: "standalone"` and binds to `127.0.0.1:3099` by default.
- React 19 (`react` / `react-dom` `^19.0.0`).
- Tailwind CSS 4 (`tailwindcss` `^4.0.0` with `@tailwindcss/postcss` `^4.0.0`).
- Shadcn component set via `@json-render/shadcn` `^0.19.0`.
- Generative UI rendering via `@json-render/core` `^0.19.0` and `@json-render/react` `^0.19.0` (state store at `sidecar/src/lib/state-store.ts`).

**Testing:**
- Vitest 4.1.7 — Unit, integration, smoke, and evals. `vitest.config.ts` uses `globals: true` and the `v8` coverage provider; coverage floors live in `vitest.config.ts` (75% statements, 62% branches, 80% functions, 77% lines). `vitest.setup.ts` isolates harness state to a per-process `mkdtempSync` dir.
- Bats (`^1.13.0`) — Bash-script tests for the `bin/` shell helpers and similar.
- @testing-library/react `^16.0.0` + jsdom `^25.0.0` (sidecar only) — Component-level tests in `sidecar/tests/`.

**Build/Dev:**
- TypeScript compiler (`tsc`) — `npm run build` chain: clean → `scripts/sync-assets.js` → `tsc` → `scripts/sync-assets.js` post-step → `dist/schema-kernel/generate-config-json-schema.js`.
- ESLint 10.4.1 — Listed under `dependencies` (note: it appears in the runtime `dependencies` block, not `devDependencies`, in the current `package.json`).
- Custom asset sync — `scripts/sync-assets.js` (ESM) and `scripts/transform-gsd-to-hm.js` (ESM) reflect authored assets from `assets/` and `.hivefiver-meta-builder/` into `.opencode/`.

## Key Dependencies

**Critical (runtime contract):**
- `@opencode-ai/plugin` `^1.16.2` — **peer dependency**; the host OpenCode runtime must provide this version. The plugin entrypoint `src/plugin.ts` implements the `Plugin` type from this package.
- `@opencode-ai/sdk` `^1.16.2` — Provides `createOpencodeClient()`; every session, prompt, and child-session wrapper in `src/shared/session-api.ts` is typed against this SDK.
- `zod` `^4.4.3` — Schema-first validation. Used heavily in `src/schema-kernel/` (every `*.schema.ts` is a Zod schema) and across tool parameter validation.
- `@clack/prompts` `^1.4.0` — Interactive CLI prompts in `src/cli/ui/prompts.ts` (e.g. `src/cli/commands/init.ts`, `doctor.ts`).
- `@modelcontextprotocol/sdk` `^1.29.0` — MCP SDK surface area for harnesses that want to expose tools through MCP.
- `yaml` `^2.9.0` — YAML parsing for configs and frontmatter.
- `gray-matter` `^4.0.3` — Frontmatter parsing for Markdown-based primitive definitions.
- `eslint` `^10.4.1` — Lint runtime (currently declared under `dependencies`).

**Optional / capability-gated:**
- `bun-pty` `^0.4.8` — Lazy-loaded PTY backend (`src/features/background-command/pty/pty-manager.ts`). Falls back to headless `node:child_process` when Bun is absent.
- `@json-render/core`, `/next`, `/react`, `/react-pdf`, `/ink` `^0.19.0` — Generative UI for sidecar (`sidecar/`) and TUI variants. Marked optional so consumers who only want the plugin layer do not pull them in.
- `react` `^19.2.6` — Required by the sidecar workspace (declared as optional in the root `package.json`; direct dep in `sidecar/package.json`).
- `ws` `^8.18.0` — WebSocket transport for sidecar WebSocket pool (`src/sidecar/server/ws/pool.ts`).

**Infrastructure:**
- Node.js built-ins only — `node:fs`, `node:path`, `node:os`, `node:crypto`, `node:child_process`, `node:net`, `node:http`, `node:url`, `node:util`. The harness deliberately avoids third-party I/O libraries; the SDK is the only outbound transport.

**Type packages:**
- `@types/bun` `^1.3.8`, `@types/node` `^20.0.0`, `bun-types` `^1.3.14` (devDeps).
- `@vitest/coverage-v8` `^4.1.7` (devDep).

## Configuration

**Environment:**
- `.env` (gitignored) — Developer-local secret store. `vitest.setup.ts` does **not** load it; tests instead use a fresh `mkdtempSync` directory for `OPENCODE_HARNESS_STATE_DIR`. The OpenCode runtime reads MCP server keys from here.
- `opencode.json` (root, committed) — Provider configuration (`opencode` and `CrofAI` providers via `@ai-sdk/openai-compatible`), plugin entry, server port (`4096`), and compaction policy.
- `.opencode/opencode.json` (committed) — Project-level permission grants for `get-shit-done/` and `gsd-core/` directories.
- `tsconfig.json` — TypeScript compiler options, ES2022 target, NodeNext modules, includes only `src/**/*`.
- `vitest.config.ts` — Test runner config, coverage provider (`v8`), reporters (`text`, `lcov`, `json-summary`), and threshold floors.
- `vitest.setup.ts` — Per-process temp state dir for harness.
- `sidecar/next.config.ts` — Sidecar-specific Next.js options: standalone output, `127.0.0.1:3099`, CORS for plugin↔sidecar.
- `sidecar/tsconfig.json` — Sidecar TypeScript config (mirrors root but with Next.js plugin types).
- `sidecar/vitest.config.ts` — Sidecar Vitest config with jsdom env.

**Build:**
- `package.json#scripts`:
  - `clean` — `node --eval "import { rmSync } from 'node:fs'; rmSync('dist', { recursive: true, force: true });"`
  - `build` — `npm run clean && node scripts/sync-assets.js && tsc && node dist/schema-kernel/generate-config-json-schema.js`
  - `postinstall` — `node scripts/sync-assets.js --mode=install`
  - `typecheck` — `tsc --noEmit`
  - `test` — `vitest run`
  - `test:watch` — `vitest`
  - `test:coverage` — `vitest run --coverage`
  - `prepack` — `npm run build`

**Package exports** (defined in `package.json#exports`):
- `hivemind` → `./dist/index.js` (default + re-exports for queues, lifecycle, journal, etc.)
- `hivemind/plugin` → `./dist/plugin.js` (the `HarnessControlPlane` Plugin implementation)
- `hivemind/cli` → `./dist/cli/index.js` (the `runCli(argv)` entrypoint consumed by `bin/hivemind.cjs`)

**MCP server roster** (`.mcp.json` and `mcp.json` — both committed, both refer to identical sets):
- HTTP-transport servers: `notion`, `stitch`, `gitmcp`, `web-search-prime`, `web-reader`, `zread`, `context7`, `deepwiki`, `tavily`.
- stdio-transport servers: `fetcher`, `desktop-commander`, `exa`, `fetch`, `github`, `mcp-playwright`, `memory`, `netlify`, `repomix`, `sequential-thinking`, `brave-search`.

## Platform Requirements

**Development:**
- macOS / Linux / Windows (with WSL) — `process.platform` branches exist in `src/features/tmux/integration.ts` (`process.platform === "win32"` uses `where`, others use `which`). All non-PTY code paths are platform-agnostic.
- Node.js >= 20.0.0 (CI matrix: Node 20 and Node 22 per `.github/workflows/ci.yml`).
- Bun optional — only required for `bun-pty`-backed features (`createPtyManagerIfSupported` in `src/features/background-command/pty/pty-runtime.ts` gracefully returns `null` when Bun is absent).
- tmux optional — `src/features/tmux/integration.ts` checks `process.env.TMUX` and binary presence via `which`/`where`. Falls back silently when unavailable.
- Bats (`npm i -g bats`) optional — only needed to run the shell-script test suite.
- OpenCode runtime (`@opencode-ai/plugin` peer dep `>=1.16.2`) — required at runtime; plugin cannot be loaded without it.
- No Docker / no external database / no message broker required for development.

**Production:**
- Distributed as an npm package (`hivemind-3.0`, published to `https://registry.npmjs.org/`, see `publishConfig` in `package.json`). Release pipeline in `.github/workflows/publish.yml` is triggered on `v*` tags or `workflow_dispatch` and uses `NPM_TOKEN` from repo secrets.
- `engines` field pins runtime expectations: `node >= 20.0.0`, `opencode >= 1.16.2`.
- Sidecar (`sidecar/`) is private (`"private": true`) and is **not** part of the published package; it is a local dev/dashboard tool, but its `next.config.ts` is configured for `output: "standalone"` for self-hosted production.
- The shipped `dist/` is ESM (`"type": "module"` in `package.json`); the CLI shim at `bin/hivemind.cjs` is CJS so npm `bin` resolution works across Node majors without depending on `type: module` semantics.

---

*Stack analysis: 2026-06-06*
*Update after major dependency changes*
