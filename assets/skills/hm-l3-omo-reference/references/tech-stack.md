# Technology Stack: oh-my-openagent

> **Loading trigger:** Read when you need to understand what language, runtime, frameworks, or build tools the oh-my-openagent codebase uses. Do NOT load for simple file lookups.

---

## Primary Language

**TypeScript** — 100% of source code in `src/` is TypeScript (`.ts` files). Test files use `.test.ts` suffix.

## Runtime

**Bun** — The `bunfig.toml` and `bun-test.d.ts` indicate Bun is the primary runtime and test runner. Platform-specific packages in `packages/` (darwin-arm64, darwin-x64, linux-arm64, linux-x64, windows-x64) ship native binaries compiled for each target.

## Framework / SDK

**OpenCode Plugin SDK** — This is a plugin system for the OpenCode AI coding assistant. It implements:
- Plugin lifecycle (load, configure, dispose)
- Hook system for extending behavior
- Tool registration and discovery
- Agent composition and delegation
- Skill loading and routing
- Command parsing and execution
- Session management and continuity
- Background task execution
- LSP integration for code intelligence

## Build Tool

- **tsc** (TypeScript compiler) — `tsconfig.json` present at root
- **Bun bundler** — implied by `bunfig.toml` and `bin/` entrypoints
- Platform publish pipeline: `script/publish.ts`, `script/build-binaries.ts`

## Test Framework

**bun:test** — Native Bun test runner. Evidence:
- `bun-test.d.ts` — Bun test type declarations
- Hundreds of `.test.ts` files throughout `src/`
- `test-setup.ts` at root — global test configuration
- Test utilities in `tests/` directory (hashline headless tests)

## Key Dependencies

Inferred from `src/` structure and plugin architecture:

| Category | Technology | Evidence |
|----------|-----------|----------|
| Runtime | Bun | `bunfig.toml`, `bun-test.d.ts` |
| Language | TypeScript | `tsconfig.json`, all `.ts` source |
| Testing | bun:test | `*.test.ts`, `test-setup.ts` |
| Plugin host | OpenCode | `plugin-config.ts`, `plugin-interface.ts` |
| Shell exec | tmux (interactive bash) | `src/tools/interactive-bash/tmux-path-resolver.ts` |
| AST search | ast-grep | `src/tools/ast-grep/` |
| LSP client | Custom LSP manager | `src/tools/lsp/` (20+ LSP-related files) |
| Python scripts | uv (Python runner) | `uvscripts/gh_fetch.py` |

## File Counts

From `project-structure.md` (674 lines, covering full directory tree):

| Category | Approximate Count |
|----------|-------------------|
| TypeScript source files | 300+ |
| Test files | 100+ (`.test.ts`) |
| Tool modules | 15+ subdirectories in `src/tools/` |
| Agent modules | 5 agent families in `src/agents/` |
| Platform packages | 10 (multi-arch/OS) |
| CLI entrypoints | 3 (`bin/oh-my-opencode.js`, `platform.js`, `platform.d.ts`) |

## Architecture Notes

1. **Plugin Architecture** — Core is a plugin system (`src/plugin-interface.ts`, `src/plugin-config.ts`) that loads and orchestrates tools, agents, skills, and commands.
2. **Hook System** — Extensible via hooks (`src/create-hooks.ts`) for customizing behavior without modifying core.
3. **Agent Composition** — Multiple agent families (Atlas, Hephaestus, Prometheus, Sisyphus, Sisyphus Junior) with model-specific variants (GPT, Gemini).
4. **Tool Ecosystem** — 15+ tool categories: bash, ast-grep, background tasks, delegate-task, glob, grep, hashline-edit, LSP, session manager, skill loader, MCP, slash commands, task manager.
5. **Session Continuity** — Session directory resolver, cursor tracking, model state, prompt params, storage — all designed for multi-turn persistence.
6. **Cross-Platform** — Native binaries for Darwin (ARM64/x64), Linux (ARM64/x64, musl), Windows (x64).

## Verification Note

This stack description was derived from `project-structure.md` directory tree analysis and `tsconfig.json`/`bunfig.toml`/`package.json` presence. For exact dependency versions, grep `package.json` in `references/files.md` using `## File: package.json`.
