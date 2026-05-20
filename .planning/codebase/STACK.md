---
mapped_date: 2026-05-20
last_mapped_commit: 906b21a055352fdeca3b7a1209c7c7be3f529cf7
---

# Technology Stack

**Analysis Date:** 2026-05-20

## Languages

**Primary:**
- TypeScript 5.x — production harness source under `src/`, schemas under `src/schema-kernel/`, tools under `src/tools/`, hooks under `src/hooks/`, and CLI source under `src/cli/`.

**Secondary:**
- JavaScript CommonJS — npm binary shim at `bin/hivemind.cjs`; it dynamically imports compiled ESM from `dist/cli/index.js`.
- TSX — read-only sidecar UI shell under `sidecar/src/app/`.

## Runtime

**Environment:**
- Node.js `>=20.0.0` is required by `package.json` and `sidecar/package.json`.
- OpenCode `>=1.14.28` is required by `package.json` engines; plugin peer package is `@opencode-ai/plugin` `^1.15.5`.
- Bun is optional for PTY execution only; `src/features/background-command/pty/pty-manager.ts` checks for `globalThis.Bun` before using `bun-pty`.

**Package Manager:**
- npm.
- Lockfile: `package-lock.json` present with lockfile version 3.

## Package Entry Points

- Main package: `hivemind` via `package.json` export `.` → `./dist/index.js` with types `./dist/index.d.ts`.
- Plugin entry: `hivemind/plugin` → `./dist/plugin.js` with types `./dist/plugin.d.ts`.
- CLI entry: `hivemind/cli` → `./dist/cli/index.js` with types `./dist/cli/index.d.ts`.
- Binary: `hivemind` → `bin/hivemind.cjs`.
- Published files: `dist`, `bin`, `assets`, and `.hivemind/configs.schema.json` from `package.json`.

## Frameworks

**Core Runtime:**
- `@opencode-ai/plugin` `^1.15.5` — OpenCode plugin and tool registration used by `src/plugin.ts` and `src/tools/**`.
- `@opencode-ai/sdk` `^1.15.5` — OpenCode client/session/app/TUI API wrapper types used by `src/shared/session-api.ts` and `src/shared/app-api.ts`.

**Validation and Configuration:**
- `zod` `^4.3.6` — validation authority for schemas in `src/schema-kernel/`.
- `yaml` `^2.8.3`, `js-yaml` `^4.1.1`, `gray-matter` `^4.0.3`, `jsonc-parser` `^3.3.1` — config, frontmatter, and JSONC parsing for primitives/config workflows.

**Testing:**
- Vitest `^4.1.5` — test runner configured in `vitest.config.ts`.
- `@vitest/coverage-v8` `^4.1.5` — V8 coverage provider with thresholds in `vitest.config.ts`.

**Build/Dev:**
- TypeScript `^5.0.0` — strict compiler configured by `tsconfig.json` with ES2022 target and NodeNext modules.
- `@types/node` `^20.0.0`, `@types/bun` `^1.3.8`, `bun-types` `^1.3.13` — runtime type surfaces.

**Sidecar UI:**
- `sidecar/package.json` uses Next.js `^15.0.0`, React `^19.0.0`, React DOM `^19.0.0`, and `@json-render/react` `^0.1.0`.
- Root `package.json` also includes React `^19.2.6` and the `@json-render/*` `^0.18.0` family for future JSON-rendered UI/terminal/PDF outputs.

## Key Dependencies

**OpenCode and AI Provider:**
- `@ai-sdk/openai-compatible` `^2.0.47` — OpenAI-compatible provider package referenced by `opencode.json` provider configuration.
- `@opencode-ai/plugin` `^1.15.5` — plugin SDK peer and dev dependency.
- `@opencode-ai/sdk` `^1.15.5` — client SDK dependency.

**MCP / JSON-RPC:**
- `@modelcontextprotocol/sdk` `^1.29.0` — MCP server/client contract dependency; schema support is in `src/schema-kernel/mcp-server.schema.ts`.
- `vscode-jsonrpc` `^8.2.1` — JSON-RPC support package.

**PTY / Process Execution:**
- `bun-pty` `^0.4.8` — optional Bun PTY backend used in `src/features/background-command/pty/pty-manager.ts`.
- `node-pty` `^1.1.0` — native PTY package declared in `package.json`; command fallback logic uses `node:child_process` in `src/coordination/command-delegation/handler.ts`.

**CLI / Terminal UI:**
- `commander` `^14.0.3` — CLI routing under `src/cli/`.
- `@clack/prompts` `^1.3.0` — interactive init prompts in `src/cli/commands/init.ts`.
- `ink` `^6.8.0` — React-based terminal UI rendering dependency.

**Code and Document Analysis:**
- `@ast-grep/cli` `^0.42.1` and `@ast-grep/napi` `^0.42.1` — AST search/analysis dependencies.
- `web-tree-sitter` `^0.26.8` and `tree-sitter-javascript` `^0.25.0` — parser dependencies.
- `fast-glob` `^3.3.3` — file discovery for bootstrap/config workflows.
- `fast-xml-parser` `^5.7.3` and `diff` `^9.0.0` — document parsing and patch/diff utilities.

## Scripts

```bash
npm install                    # Install dependencies
npm run clean                  # Remove dist/
npm run build                  # Clean, compile TypeScript, generate config JSON schema
npm run typecheck              # Type-check without emitting
npm test                       # Run Vitest once
npm run test:watch             # Run Vitest in watch mode
npm run test:coverage          # Run Vitest with V8 coverage
npm pack                       # Runs prepack, which runs npm run build
```

## TypeScript Configuration

- `tsconfig.json` targets `ES2022`, uses `module: NodeNext`, `moduleResolution: NodeNext`, `rootDir: ./src`, and `outDir: ./dist`.
- Strictness is enabled in `tsconfig.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, and `noFallthroughCasesInSwitch`.
- `verbatimModuleSyntax: true` means use type-only imports for type-only usage and `.js` extensions for local ESM imports.
- Build emits declarations, declaration maps, and source maps via `tsconfig.json`.

## Test Configuration

- `vitest.config.ts` enables Vitest globals and includes `tests/**/*.test.ts` plus `eval/**/*.test.ts`.
- Coverage includes `src/**/*.ts` and excludes `src/index.ts` plus barrel `src/**/index.ts` files.
- Coverage reporters: `text`, `lcov`, and `json-summary`.
- Coverage thresholds: statements 85, branches 72, functions 85, lines 85.

## CI Configuration

- Main CI workflow: `.github/workflows/ci.yml`.
- CI runs on pushes and pull requests to `oss-dev` and `main`.
- Matrix uses Node 20 and Node 22 for install, typecheck, build, and test.
- Coverage runs on Node 22 only; lint-check currently repeats `npm run typecheck`.
- Additional GitHub workflows exist for OpenCode/Qwen/sync automation under `.github/workflows/`.

## Platform Requirements

**Development:**
- Use Node.js 20+ and npm.
- Run `npm run typecheck` before claiming type safety.
- Run `npm test` or focused `npx vitest run ...` for runtime changes.

**Production:**
- Ship compiled `dist/` through npm package files listed in `package.json`.
- Load the OpenCode plugin through `opencode.json` plugin path `./dist/plugin.js` after building.
- Runtime state/config surfaces are project-local files under `.hivemind/`; OpenCode primitive configuration is under `.opencode/`.

---

*Stack analysis: 2026-05-20*
