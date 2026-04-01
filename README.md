# opencode-harness

`opencode-harness` is a standalone OpenCode harness repository for delegated session orchestration, continuity persistence, routing, and runtime guardrails.

The root package is buildable and publishable as a standalone pack. Runtime code is authored in `src/`, emitted to `dist/`, and loaded by the root OpenCode shell through the thin wrapper at `.opencode/plugins/harness-control-plane.ts`.

## What it contains

- The harness control-plane plugin implementation
- Runtime modules for delegation, routing, continuity, session API compatibility, and in-memory state
- Standalone OpenCode config, commands, skills, rules, and tools under `.opencode/`
- A package entrypoint and a dedicated plugin entry export

## Build and publish

- `npm run build` emits distributable JavaScript and declarations into `dist/`
- `npm run typecheck` validates the root package without emitting files
- `npm pack` and `npm publish` use the built `dist/` package surface through `prepack`

## Package entrypoints

- `opencode-harness` -> `./dist/index.js`
- `opencode-harness/plugin` -> `./dist/plugin.js`

## Runtime state path

Runtime state is stored outside the package source tree by default:

- Default continuity file: `.opencode/state/opencode-harness/session-continuity.json`
- Default checkpoint file: `.opencode/state/opencode-harness/checkpoints.json`
- Base path source: `process.cwd()`

Optional overrides:

- `OPENCODE_HARNESS_STATE_DIR`
- `OPENCODE_HARNESS_CONTINUITY_FILE`

This keeps the package publish-safe and avoids writes into an installed package directory.

## Current integration shell

The OpenCode shell still loads `./.opencode/plugins/harness-control-plane.ts`.
That file is now only a thin wrapper which re-exports the built plugin from `dist/`.
