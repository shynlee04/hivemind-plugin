# Technology Stack

**Analysis Date:** 2026-05-26

## Overview

Hivemind is a runtime composition engine for OpenCode, built as a TypeScript npm package that provides tools, hooks, and a plugin for multi-agent orchestration, session continuity, delegation management, and concurrent task execution. The project follows a plugin architecture pattern and integrates with the OpenCode AI coding platform.

## Languages

**Primary:**
- TypeScript — Core language for all source code in `src/` directory. Enforced via `tsconfig.json` with strict mode and `verbatimModuleSyntax: true`.

**Secondary:**
- JavaScript (ES2022) — Runtime environment via Node.js >= 20.0.0. Some CLI scripts may use `.cjs` extensions.

## Runtime

**Environment:**
- Node.js >= 20.0.0 — Primary runtime for the plugin
- Bun — Optional runtime support via `bun-pty` dependency (lazy-loaded, gracefully falls back to Node's `child_process` on environments without Bun)

**Package Manager:**
- npm — Version control and dependency management
- Lockfile: `package-lock.json` (present, 58 lines)

## Frameworks

**Core:**
- OpenCode Plugin SDK (@opencode-ai/plugin v1.15.10) — Plugin composition framework providing tools, hooks, agent orchestration, and delegation capabilities. Entry point: `src/plugin.ts`, `src/index.ts`.

**SDK/Integration:**
- @opencode-ai/sdk (@opencode-ai/sdk v1.15.10) — Low-level SDK for client operations, used in `src/shared/session-api.ts` for creating OpencodeClient instances.

**AI/LLM Integration:**
- @ai-sdk/openai-compatible (v2.0.47) — AI SDK provider for OpenAI-compatible endpoints, used for LLM interactions.

**MCP Integration:**
- @modelcontextprotocol/sdk (v1.29.0) — Model Context Protocol SDK for MCP server/tool integrations.

**Schema Validation:**
- Zod (v4.4.3) — TypeScript-first schema validation library. Used throughout `src/schema-kernel/` for config schema validation.

**Data Serialization:**
- gray-matter (v4.0.3) — Markdown frontmatter parsing for session artifacts and documentation.
- yaml (v2.9.0) — YAML parsing/generation for configuration files.

**Build/Dev:**
- Vitest (v4.1.7) — Testing framework with built-in coverage support. Config: `vitest.config.ts`.
- TypeScript Compiler (v5.0.0) — Build-time compilation.
- tsc — Type checking via `npm run typecheck`.

## Key Dependencies

### Core Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @opencode-ai/plugin | ^1.15.10 | Plugin SDK providing tool/hook/agent infrastructure |
| @opencode-ai/sdk | ^1.15.10 | Low-level SDK client for OpenCode operations |
| zod | ^4.4.3 | Schema validation for configs and inputs |
| bun-pty | ^0.4.8 | Bun pseudo-terminal integration (optional, fallback to Node child_process) |
| bun-types | ^1.3.14 | Type definitions for Bun runtime |

### AI & LLM Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @ai-sdk/openai-compatible | ^2.0.47 | AI provider for OpenAI-compatible endpoints |
| @modelcontextprotocol/sdk | ^1.29.0 | MCP SDK for context protocol integration |

### Data & Configuration

| Package | Version | Purpose |
|---------|---------|---------|
| yaml | ^2.9.0 | YAML parsing for config files |
| gray-matter | ^4.0.3 | Markdown frontmatter processing |

### Optional Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @json-render/react | ^0.18.0 | UI rendering for dashboard (sidecar) |
| @json-render/ink | ^0.18.0 | Terminal UI rendering |
| @json-render/next | ^0.18.0 | Next.js integration |
| @json-render/react-pdf | ^0.18.0 | PDF rendering capabilities |
| react | ^19.2.6 | React for UI components |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @opencode-ai/plugin | ^1.15.10 | Peer dependency for plugin development |
| @types/bun | ^1.3.8 | Bun type definitions |
| @types/node | ^20.0.0 | Node.js type definitions |
| @vitest/coverage-v8 | ^4.1.7 | Vitest coverage reporter |
| typescript | ^5.0.0 | TypeScript compiler |
| vitest | ^4.1.7 | Testing framework |

## Configuration

### Environment
- `.env` file present — Contains environment variables (contents not exposed in documentation)
- No `.env` contents quoted in documents per security policy

### Build Configuration
- `tsconfig.json` — TypeScript compiler configuration:
  - Target: ES2022
  - Module: NodeNext
  - ModuleResolution: NodeNext
  - Strict mode: enabled
  - verbatimModuleSyntax: true
  - Output: `./dist/`
  - Root: `./src/`
- `vitest.config.ts` — Vitest testing configuration:
  - Test include: `tests/**/*.test.ts`, `eval/**/*.test.ts`
  - Coverage reporter: text, lcov, json-summary
  - Coverage thresholds: statements 85%, branches 72%, functions 85%, lines 85%

### Plugin Configuration
- `opencode.json` — OpenCode plugin configuration
- `src/schema-kernel/generate-config-json-schema.js` — Generates JSON schema for configs
- `.hivemind/configs.schema.json` — Generated configuration schema

### CLI Configuration
- `bin/hivemind.cjs` — CLI entry point
- `src/cli/commands/` — CLI command implementations

## Platform Requirements

### Development

**Required:**
- Node.js >= 20.0.0
- npm >= 9.0.0
- TypeScript >= 5.0.0

**Optional:**
- Bun runtime (for PTY features)
- Visual Studio Code with TypeScript extensions

**Build Commands:**
```bash
npm run build          # Clean + compile TypeScript to dist/
npm run typecheck      # Type-check without emitting
npm test               # Run all tests (vitest)
npm run test:coverage  # Coverage report
```

### Production

**Deployment Target:**
- Node.js >= 20.0.0 runtime environments
- npm package distribution via `npm publish`
- Plugin installation via OpenCode plugin system

**Package Structure:**
- `dist/` — Compiled TypeScript output
- `bin/` — CLI executable
- `assets/` — Plugin assets
- `./dist/index.js` — Main package entry
- `./dist/plugin.js` — Plugin export
- `./dist/cli/index.js` — CLI export

## Architecture Summary

This is a **runtime plugin** architecture, not a web application. Key architectural patterns:

- **CQRS Model** — Command/Query separation for state management
- **9-Surface Authority** — Distinct surfaces for code, docs, planning, runtime, etc.
- **CQRS + Event-Driven** — Session journal as append-only event timeline
- **Plugin Composition** — Thin wrapper re-exporting from `dist/`
- **Delegation System** — WaiterModel dispatch with dual-signal completion

**No database layer** — Uses JSON file persistence in `.hivemind/state/` for state management.

**No traditional API layer** — Plugin hooks and tools provide the interface.

---

*Stack analysis: 2026-05-26*
