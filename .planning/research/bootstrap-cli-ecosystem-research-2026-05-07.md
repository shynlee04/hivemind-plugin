# Bootstrap CLI — Ecosystem Research Synthesis

**Date:** 2026-05-07 | **Source:** Parallel subagent research + orchestrator synthesis
**Evidence:** L5 — docs-only research. Runtime claims require L1-L3 proof.

## Overview

Research was conducted across three domains to inform the Bootstrap/Init CLI design:

1. **OpenCode ecosystem** — how other plugins handle CLI, config, PTY, sessions
2. **GSD framework** — how GSD handles project initialization and health checking
3. **Existing codebase** — what Phase 40 CLI substrate already provides

## Key Findings

### 1. CLI Pattern Tension

**What exists (Phase 40):** A framework-free CLI router (`src/cli/router.ts`, 177 LOC) with:
- Custom argv parser (`parseArgs()`)
- Command dispatch (`createRouter()`)
- Discovery + validation boundary (`discoverCommands()`)
- Pure renderers (help, table, JSON, error)
- Only one command: `help`
- Deliberately avoids commander/yargs/oclif for bin-surface security
- CJS shim at `bin/hivemind-tools.cjs`

**What the user's package.json suggests:** `commander`, `@clack/prompts`, `ink`/`react`, `@json-render/*`

**Tension:** The Phase 40 design explicitly rejected framework dependencies, but the user's vision includes richer CLI with interactive prompts and potentially TUI output.

### 2. Ecosystem Patterns Worth Adapting

| Source | Pattern | Hivemind Adaptation |
|--------|---------|---------------------|
| **DCP** (`opencode-dynamic-context-pruning`) | Three-layer config: `~/.config/opencode/` → `$OPENCODE_CONFIG_DIR/` → `.opencode/` with deep merge, array union for protected paths | Adopt for `.hivemind/` config bootstrap. Config layers with schema-driven validation. |
| **DCP** | `createDefaultConfig()` — write minimal skeleton on first run, apply full defaults at runtime | Apply to `.hivemind/` structure creation. Never overwrite existing files. |
| **DCP** | JSONC with `jsonc-parser` + `allowTrailingComma` — user-friendly config format | Hivemind's `package.json` already includes `jsonc-parser`. Use for `.hivemind/configs.json`. |
| **DCP** | Schema-driven validation with runtime warnings | Validate `.hivemind/` structure against Zod schema at health check time. |
| **DCP** | `findOpencodeDir()` walk-up for project root discovery | Bootstrap must discover project root to know where to create `.hivemind/`. |
| **opencode-pty** | RingBuffer with paginated read/search (50000 lines default) | Capture bootstrap CLI output for health check reporting. |
| **opencode-pty** | Event-driven session cleanup (`session.deleted` → `cleanupBySession`) | Hivemind's session lifecycle already follows this pattern. |
| **opencode-pty** | Exit notification via `notifyOnExit` + `promptAsync` | Use for async completion signaling during health checks. |
| **opencode-pty** | Plugin signature: `({ client, directory }): Promise<PluginResult>` | Hivemind already follows this pattern. |
| **background-agents** | Disk-persisted delegation results with stable IDs | `.hivemind/state/` already uses this pattern. |
| **background-agents** | Lifecycle: `registered` → `running` → terminal with terminal-state protection | Hivemind's task-status transitions mirror this. |
| **background-agents** | Persistence-before-notification ordering | Ensure `.hivemind/` state is written before reporting success. |
| **awesome-opencode** | Ecosystem standard: plugin as npm package with `@opencode-ai/plugin` peer | Hivemind already follows this. |
| **awesome-opencode** | OCX registry model — `ocx add namespace/name` | Consider future registry for Hivemind extensions. Not bootstrap scope. |

### 3. GSD Patterns — Adapted, Not Copied

| GSD Pattern | GSD Convention | Hivemind Adaptation | Rationale |
|-------------|---------------|---------------------|-----------|
| Init pipeline | 7-step `InitRunner` with Agent SDK | Lifecycle state machine + subagent delegation | Hivemind is a plugin, not agent-based. Init = lifecycle transitions. |
| State storage | STATE.md with YAML frontmatter | `continuity.ts` + `state.ts` (typed JSON + in-memory) | Hivemind is TypeScript — runtime truth is typed, not parsed from markdown. |
| Config | `.planning/config.json` deep merge | `runtime-policy.ts` from `.hivemind/` with Zod validation | Schema-driven validation is required for runtime integrity. |
| Project root | `.planning/` with PROJECT.md | `.hivemind/` with `session-continuity.json` | Q6 locked `.hivemind/` as state root. |
| Health check | `/gsd:health` validating `.planning/` files | `harness-doctor` validating `.hivemind/` + SDK surfaces | Health = runtime integrity, not file existence. |
| Research init | 4 parallel Agent SDK sessions | Parallel `delegate-task` with hm-researcher subagents | Same parallelism, different transport (OpenCode delegation, not Agent SDK). |
| Agent check | `checkAgentsInstalled()` file scan | Tool/hook registration verification | Verify OpenCode discovered the plugin's surfaces. |

**Patterns explicitly rejected:**
1. `.planning/` directory structure — Hivemind is not a planning framework
2. Agent SDK session execution — Hivemind uses OpenCode's delegation
3. CJS bridge (`gsd-tools.cjs`) — Hivemind is pure ESM
4. Interactive questioning via `AskUserQuestion` — Hivemind is a plugin, not a user-facing agent
5. Multi-project workspaces — Hivemind operates in a single project context

### 4. What Already Exists (Phase 40 CLI Substrate)

```
src/cli/
├── index.ts        # runCli(), buildHarnessCli(), CliIO
├── router.ts       # parseArgs(), createRouter(), CliCommand/Context/Result
├── discovery.ts    # discoverCommands(), validateCommand(), CommandSource
├── renderer.ts     # renderError(), renderJson(), renderTable(), renderHelp()
└── commands/
    └── help.ts     # The ONLY built-in command

bin/
└── hivemind-tools.cjs  # CJS shim → dynamic import dist/cli/index.js
```

**Existing capability:**
- `npx opencode-harness help` — lists commands
- Framework-free, ~500 LOC total
- Exit codes: 0 (success), 64 (usage), 70 (software error)
- `[Harness]` prefix policy on all errors
- Testable without spawning subprocess

**Missing commands:**
- `init` — create `.hivemind/` structure
- `doctor` — health check
- `recover` — restore `.opencode/` symlinks
- `config` — view/edit config

### 5. Dependency-to-Feature Reconciliation

| Package | Bootstrap Feature | Priority | Notes |
|---------|------------------|----------|-------|
| *(existing router)* | `init`, `doctor`, `recover` commands | **P0** | Phase 40 router is sufficient. Add commands as `CliCommand` handlers. |
| `@clack/prompts` | Interactive `init` wizard | **P1** | Use within `init` handler for interactive mode. Non-interactive mode via flags. |
| `commander` | **TENSION** — may be unnecessary | **P2** | Router already handles argv parsing. Only add if subcommand nesting becomes complex. |
| `fast-glob` | `.hivemind/` structure scan, `.opencode/` symlink validation | **P0** | Already in package.json. Essential for `doctor` structure checks. |
| `jsonc-parser` | Config bootstrap (following DCP pattern) | **P0** | Use for `.hivemind/configs.json` with `allowTrailingComma`. |
| `gray-matter` + `js-yaml` + `yaml` | Primitives validation (parse agent/skill frontmatter) | **P1** | For `doctor` to validate `.opencode/` primitives integrity. |
| `zod` | Config schema validation | **P0** | Already in package.json. Extend `schema-kernel/` for config validation. |
| `diff` | State change detection | **P2** | For `doctor` to detect drift in `.hivemind/` structure. |
| `tree-sitter-*` | AST analysis for code quality | **P3** | Deferred. Not needed for bootstrap. |
| `@json-render/*` + `ink` + `react` | Rich TUI output | **P3** | Deferred per Q2 (GUI sidecar). Plain text output for now. |
| `@modelcontextprotocol/sdk` | MCP server integration | **P3** | Deferred. Bootstrap doesn't need MCP. |
| `node-pty` + `bun-pty` | Long-running process management | **P2** | Deferred. Bootstrap is one-shot, not interactive. |
| `fast-xml-parser` | Repomix/XML output parsing | **P2** | Deferred. Not needed for bootstrap. |
| `@ast-grep/*` | AST-based code search | **P2** | Deferred. Not needed for bootstrap. |
| `vscode-jsonrpc` | LSP/server communication | **P3** | Deferred. Not needed for bootstrap. |

### 6. Key Architecture Decisions from Ecosystem

1. **Bootstrap is additive, never destructive** — DCP's `createDefaultConfig()` pattern. Never overwrite existing `.hivemind/` or `.opencode/` files.
2. **Config discovery hierarchy** — Global → project. DCP's three-layer model adapted to single-project scope.
3. **Persistence before notification** — background-agents pattern. Write to `.hivemind/` before reporting success.
4. **Framework-free bin surface** — Phase 40 design decision. Keep the CJS shim lean.
5. **CQRS-compliance** — `init`/`doctor` are tools (write-side mutations). Health checks are read-side.
6. **npm as distribution channel** — ecosystem standard. No custom registry.
