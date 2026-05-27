# Technology Stack

**Analysis Date:** 2026-05-28

## Languages

**Primary:**
- TypeScript 5.x — All source code in `src/`, strict mode enabled
- Node.js >= 20.0.0 — Runtime requirement (per `package.json` engines)

**Secondary:**
- JavaScript (CommonJS) — CLI entry point `bin/hivemind.cjs`
- Shell (Bash) — Validation scripts in `bin/`

## Runtime

**Environment:**
- Node.js >= 20.0.0 (enforced via `engines.node` in `package.json`)
- ES2022 target (per `tsconfig.json` target field)
- ESM modules (`"type": "module"` in `package.json`)

**Package Manager:**
- npm (lockfile: `package-lock.json` expected)
- No yarn/pnpm/bun lockfiles detected

**Module Resolution:**
- NodeNext (per `tsconfig.json` module + moduleResolution)
- `verbatimModuleSyntax: true` — enforces `import type` for type-only imports

## Frameworks

**Core:**
- `@opencode-ai/plugin` >= 1.15.10 — OpenCode plugin SDK (peer dependency)
- `@opencode-ai/sdk` ^1.15.10 — OpenCode client SDK for session/tool/hook operations

**Testing:**
- Vitest 4.1.7 — Test runner with globals enabled
- `@vitest/coverage-v8` 4.1.7 — Code coverage via V8 provider

**Build/Dev:**
- TypeScript 5.x — Compiler with declarations + source maps
- Custom `scripts/sync-assets.js` — Asset synchronization pre-build

## Key Dependencies

**Critical:**
- `zod` ^4.4.3 — Schema validation for all config types, tool args, and runtime contracts
- `@modelcontextprotocol/sdk` ^1.29.0 — MCP server integration for local/remote tool surfaces
- `@ai-sdk/openai-compatible` ^2.0.47 — AI SDK provider adapter for OpenAI-compatible endpoints
- `@opencode-ai/sdk` ^1.15.10 — OpenCode SDK for session management, tool dispatch, TUI integration

**Infrastructure:**
- `yaml` ^2.9.0 — YAML serialization for config compiler and frontmatter generation
- `gray-matter` ^4.0.3 — Markdown frontmatter parsing for agent/command/skill primitives
- `bun-pty` ^0.4.8 — Optional PTY integration for background command execution (Bun-only)
- `bun-types` ^1.3.14 — TypeScript types for Bun runtime features

**Optional (Sidecar Dashboard):**
- `@json-render/core` ^0.18.0 — JSON render engine for GUI sidecar
- `@json-render/ink` ^0.18.0 — Ink renderer for terminal UI
- `@json-render/next` ^0.18.0 — Next.js adapter for sidecar
- `@json-render/react` ^0.18.0 — React renderer for sidecar dashboard
- `@json-render/react-pdf` ^0.18.0 — PDF export for sidecar
- `react` ^19.2.6 — React runtime for JSON render components

## Configuration

**TypeScript:**
- `tsconfig.json` — Strict mode with additional checks:
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`
  - `skipLibCheck: true`
  - Declaration maps + source maps enabled

**Build:**
- `npm run build` — Clean → sync-assets → tsc → generate JSON schema
- `npm run typecheck` — Type-check without emitting (`tsc --noEmit`)
- `npm run prepack` — Runs build before `npm pack`/`npm publish`

**Test:**
- `vitest.config.ts` — Coverage thresholds:
  - Statements: 85%
  - Branches: 72%
  - Functions: 85%
  - Lines: 85%
  - Provider: V8
  - Reporters: text, lcov, json-summary

## Package Exports

```json
{
  ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
  "./plugin": { "import": "./dist/plugin.js", "types": "./dist/plugin.d.ts" },
  "./cli": { "import": "./dist/cli/index.js", "types": "./dist/cli/index.d.ts" }
}
```

**Binary:**
- `bin/hivemind.cjs` — CLI entry point (CommonJS wrapper)
- `bin/validate-agent-config.sh` — Agent config validation script
- `bin/validate-load-order.sh` — Load order validation script
- `bin/validate-runtime-paths.sh` — Runtime path validation script

## Published Files

```json
{
  "files": ["dist", "bin", "assets", ".hivemind/configs.schema.json"]
}
```

## Code Style

- Strict TypeScript — no `any` types on new code
- `[Harness]` prefix on all thrown errors (error naming convention)
- Max module size target: 500 LOC per module
- ES2022 target with NodeNext module resolution
- `import type` enforced for all type-only imports

---

*Stack analysis: 2026-05-28*
