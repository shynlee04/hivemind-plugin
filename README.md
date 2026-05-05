<!-- generated-by: gsd-doc-writer -->

# opencode-harness

Multi-agent checkpoint orchestration framework for OpenCode. `opencode-harness` provides runtime composition — delegated session orchestration, continuity persistence, concurrency control, completion detection, and runtime guardrails — as a TypeScript plugin that wires tools and hooks into OpenCode.

[![npm version](https://img.shields.io/npm/v/opencode-harness?color=blue)](https://www.npmjs.com/package/opencode-harness)
[![license](https://img.shields.io/npm/l/opencode-harness)](./LICENSE)

## Installation

```bash
npm install opencode-harness
```

Requires Node.js `>=20.0.0` and OpenCode `>=1.14.28` (peer dependency).

## Quick Start

1. **Install** the package in your OpenCode project:
   ```bash
   npm install opencode-harness
   npm run build
   ```

2. **Configure** OpenCode to load the plugin. Add a plugin entry in `.opencode/plugins/` that imports from `opencode-harness/plugin`:
   ```ts
   // .opencode/plugins/harness.ts
   export { HarnessControlPlane as default } from "opencode-harness/plugin"
   ```

   The harness will begin managing delegated sessions, persisting state to `.hivemind/state/`, and enforcing runtime guardrails on next OpenCode startup.

3. **Verify** the harness is active by checking that plugins load without errors on startup. Runtime state appears at `.hivemind/state/` after the first delegated session.

## Usage

### Package entrypoints

| Import path | Exported file | Purpose |
|-------------|---------------|---------|
| `opencode-harness` | `./dist/index.js` | Public API: re-exports `HarnessControlPlane`, all `src/lib/` modules (concurrency, continuity, helpers, types, runtime, etc.) |
| `opencode-harness/plugin` | `./dist/plugin.js` | Plugin composition root — the `HarnessControlPlane` export for OpenCode to load |
| `opencode-harness/cli` | `./dist/cli/index.js` | CLI substrate entry — `runCli(argv, io?)` for programmatic CLI dispatch |

### Plugin tools

The harness registers these tools into the OpenCode runtime when the plugin loads:

| Tool | Purpose |
|------|---------|
| `delegate-task` | Dispatch a subagent with WaiterModel concurrency + dual-signal completion |
| `delegation-status` | Poll delegation state and retrieve results |
| `prompt-skim` | Fast scan of prompt content: word/line/token counts, URL extraction, complexity scoring |
| `prompt-analyze` | Analyze prompts for contradictions, vagueness, missing scope, and clarity |
| `session-patch` | Patch specific sections in session files with backup |
| `run-background-command` | Execute CLI commands in shared background PTY sessions with queue-governed dispatch |
| `configure-primitive` | Configure, read, list, or inspect OpenCode primitives (agent, command, skill) |
| `validate-restart` | Validate that compiled OpenCode primitives are discoverable after a restart |
| `session-journal-export` | Export bounded Session Journal and Execution Lineage summaries as JSON or Markdown |
| `hivemind-doc` | Read-only document intelligence (markdown skim, directory skim, read, chunk, search) |
| `hivemind-trajectory` | Inspect and update the Hivemind trajectory ledger |
| `hivemind-pressure` | Classify runtime pressure, inspect tool authority, attach pressure evidence to trajectory |
| `hivemind-agent-work-create` | Create a durable, pressure-aware agent work contract |
| `hivemind-agent-work-export` | Export an agent work contract as bounded JSON or Markdown |
| `hivemind-sdk-supervisor` | Inspect SDK wrapper health, heartbeat, diagnostics, and readiness |
| `hivemind-command-engine` | Discover command bundles, analyze contracts, render bounded context |

### CLI

```bash
npx hivemind-tools --help
```

The CLI substrate (`bin/hivemind-tools.cjs`) discovers commands dynamically and routes them to handlers. Built-in commands include `help`. Requires `npm run build` to have been run first (compiled to `dist/cli/index.js`).

## Runtime state

State is stored in `.hivemind/state/` (canonical per Q6):

| File | Purpose |
|------|---------|
| `session-continuity.json` | Durable session state, delegation records, lifecycle metadata |
| `checkpoints.json` | Compaction checkpoints for long-running sessions |

Optional overrides:

| Variable | Effect |
|----------|--------|
| `OPENCODE_HARNESS_STATE_DIR` | Override the state directory (default: `.hivemind/state/`) |
| `OPENCODE_HARNESS_CONTINUITY_FILE` | Override the continuity file path directly |
| `OPENCODE_HARNESS_CONCURRENCY_LIMIT` | Override max concurrent delegations (default: `3`) |

Legacy path `.opencode/state/opencode-harness/` is supported via a compatibility bridge during migration (one-way to `.hivemind/state/`).

## Build

```bash
npm install          # Install dependencies
npm run build        # Clean + compile TypeScript to dist/
npm run typecheck    # Type-check without emitting
npm test             # Run all tests (vitest)
npm run test:coverage # Coverage report (src/**/*.ts)
```

`prepack` runs `build` automatically, so `npm pack` and `npm publish` use the built `dist/` package surface.

## Branches

| Branch | Role |
|--------|------|
| `main` | Canonical v3 product — runtime composition engine, the `opencode-harness@0.1.x` source |
| `legacy/v2.x` | Frozen v2.x baseline of the original `hivemind-plugin` — forensic reference only |

## License

MIT — see [LICENSE](./LICENSE).
