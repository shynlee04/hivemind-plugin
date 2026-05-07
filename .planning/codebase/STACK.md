# Technology Stack

**Analysis Date:** 2026-05-07

## Languages

**Primary:**
- TypeScript ^5.0.0 — All source code in `src/`, tests in `tests/`

**Configuration/Meta:**
- JSON (`opencode.json`, `mcp.json`, `package.json`, `tsconfig.json`)
- YAML (runtime policies, skill/agent frontmatter in `.opencode/`)
- Markdown (all skills, agents, commands documentation in `.opencode/`)

## Runtime

**Environment:**
- Node.js >= 20.0.0 (enforced in `package.json` engines)
- OpenCode >= 1.14.28 (enforced in `package.json` engines.opencode)
- ESM module system (`"type": "module"` in `package.json`)

**Package Manager:**
- npm (detected from `package-lock.json` / npm scripts)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- OpenCode Plugin SDK (`@opencode-ai/plugin` ^1.14.28) — Plugin lifecycle, tool/hook registration
- OpenCode SDK (`@opencode-ai/sdk` ^1.14.28) — Session management, prompt dispatch

**Schema Validation:**
- Zod ^4.3.6 — All tool I/O schemas in `src/schema-kernel/` (16 schema files)
- MCP SDK (`@modelcontextprotocol/sdk` ^1.29.0) — MCP client/server protocol

**Testing:**
- Vitest ^4.1.5 — Test runner with globals enabled
- @vitest/coverage-v8 ^4.1.5 — V8-based coverage provider
- Config: `vitest.config.ts` — includes `tests/**/*.test.ts`, `eval/**/*.test.ts`
- Coverage thresholds: statements 85%, branches 72%, functions 85%, lines 85%

**Build/Dev:**
- TypeScript Compiler (`tsc`) — Build pipeline (`npm run build`)
- Config: `tsconfig.json` — strict, ES2022 target, NodeNext module resolution
- Prepack runs build automatically (`npm run prepack` → `npm run build`)

**CLI:**
- Commander ^14.0.3 — CLI framework for `hivemind` binary
- @clack/prompts ^1.3.0 — Interactive CLI prompts
- Ink ^6.8.0 + React ^19.2.6 — Terminal UI components

## Key Dependencies

**Critical (runtime):**
- `@opencode-ai/sdk` ^1.14.28 — Session lifecycle, prompt API, message retrieval
- `@opencode-ai/plugin` ^1.14.28 — Plugin type, hook signatures (peer dependency)
- `zod` ^4.3.6 — Runtime schema validation for all 15+ plugin tools
- `fast-glob` ^3.3.3 — File system glob operations
- `yaml` ^2.8.3 — YAML parsing for runtime policies and config
- `js-yaml` ^4.1.1 — Additional YAML support
- `diff` ^9.0.0 — Text diffing (session-patch tool)
- `commander` ^14.0.3 — CLI entry point structure

**Optional Runtime Dependencies:**
- `bun-pty` ^0.4.8 — PTY integration (for `run-background-command` tool); gracefully falls back to headless `node:child_process` when unavailable
- `node-pty` ^1.1.0 — Alternative PTY provider
- `bun-types` ^1.3.13 — Bun type definitions

**Infrastructure / State:**
- `@modelcontextprotocol/sdk` ^1.29.0 — MCP client for external tool integration
- `vscode-jsonrpc` ^8.2.1 — JSON-RPC protocol
- `fast-xml-parser` ^5.7.3 — XML parsing
- `jsonc-parser` ^3.3.1 — JSONC parsing (config files)
- `gray-matter` ^4.0.3 — Frontmatter parsing

**Code Analysis:**
- `@ast-grep/cli` ^0.42.1 + `@ast-grep/napi` ^0.42.1 — AST-based code search
- `tree-sitter-javascript` ^0.25.0 — JS/TS parsing
- `web-tree-sitter` ^0.26.8 — Tree-sitter WASM bindings

**UI/Generative:**
- `@json-render/core` ^0.18.0 — Generative UI core
- `@json-render/react` ^0.18.0 — React bindings
- `@json-render/next` ^0.18.0 — Next.js integration
- `@json-render/ink` ^0.18.0 — Ink CLI integration
- `@json-render/react-pdf` ^0.18.0 — PDF rendering

**Dev Dependencies:**
- `typescript` ^5.0.0 — Compiler
- `vitest` ^4.1.5 — Test runner
- `@vitest/coverage-v8` ^4.1.5 — Coverage provider
- `@types/node` ^20.0.0 — Node.js type definitions
- `@types/bun` ^1.3.8 — Bun type definitions
- `@opencode-ai/plugin` ^1.14.28 — Plugin SDK (also peer dependency, installed as dev dep for compilation)

## Configuration

**Environment:**
- `.env` file present — contains environment variables (API keys, tokens)
- Required env vars for MCP servers (documented in `mcp.json` via `$VAR` syntax):
  - `$NOTION_API_TOKEN`, `$ZAI_API_KEY`, `$SMITHERY_CLI_KEY`, `$EXA_API_KEY`, `$GITHUB_PAT`, `$NETLIFY_PAT`, `$TAVILY_API_KEY`, `$BRAVE_API_KEY`
- Runtime state overrides: `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`

**Build:**
- `tsconfig.json` — TypeScript strict mode, ES2022, NodeNext, declarations + sourcemaps, verbatimModuleSyntax
- `vitest.config.ts` — Globals mode, V8 coverage, threshold enforcement
- Prepack hook: `npm run build` (builds before pack/publish)

**Project Config:**
- `opencode.json` — OpenCode platform config: provider (Osiris), model (claude-opus-4-6), permissions, plugins
- `mcp.json` — MCP server definitions (20 servers)

## Package Structure

**Package name:** `hivemind` v0.1.0

**Entry points (via `exports`):**
| Import path | Target | Purpose |
|-------------|--------|---------|
| `hivemind` | `./dist/index.js` | Public API re-exports |
| `hivemind/plugin` | `./dist/plugin.js` | Plugin composition root |
| `hivemind/cli` | `./dist/cli/index.js` | CLI tools |

**Binary:** `hivemind` → `./bin/hivemind.cjs`

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- npm (any modern version)
- No build-time environment variables required

**Production (OpenCode Runtime):**
- OpenCode >= 1.14.28
- Plugin loaded via `opencode.json` plugin array
- File system write access for `.hivemind/` state directory
- Network access for MCP servers (if configured)

---

*Stack analysis: 2026-05-07*
