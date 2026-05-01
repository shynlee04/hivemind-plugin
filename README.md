# opencode-harness

`opencode-harness` is a standalone OpenCode harness repository for delegated session orchestration, continuity persistence, routing, and runtime guardrails.

The root package is buildable and publishable as a standalone pack. Runtime code is authored in `src/`, emitted to `dist/`, and loaded by the root OpenCode shell through the thin wrapper at `.opencode/plugins/harness-control-plane.ts`.

## Branches

| Branch | Role |
|---|---|
| `main` | **Canonical v3 product** — runtime composition engine, the actual `opencode-harness@0.1.x` source. All open PRs target `main`. (Pre-rename name: `feature/harness-implementation`.) |
| `legacy/v2.x` | **Frozen v2.x baseline** of the original `hivemind-plugin` — kept for forensic reference. Not maintained, not released. Pinned by tag `legacy/v2.x-baseline`. |

The decision and full rename procedure are recorded in [`.planning/decisions/ADR-2026-04-30-branch-strategy.md`](./.planning/decisions/ADR-2026-04-30-branch-strategy.md) (Phase 16.4.1, audit-remediation gate G7).

If you have an existing checkout of the pre-rename name, update with:

```bash
git fetch origin --prune
git branch -m feature/harness-implementation main
git branch -u origin/main main
git remote set-head origin -a
git branch -D master 2>/dev/null || true
```

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
