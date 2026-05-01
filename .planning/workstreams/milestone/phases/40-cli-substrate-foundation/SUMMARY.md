---
phase: 40-cli-substrate-foundation
status: complete
completed: 2026-05-01
requirements: [PH40-01, PH40-02, PH40-03]
---

# Phase 40 — CLI Substrate Foundation (SUMMARY)

## Outcome

The CLI substrate is in place. `npx hivemind-tools` (after build) routes
to a registry-driven command set with deterministic terminal output and
sysexits-aligned exit codes. The substrate is **framework-free** (no
commander / yargs / oclif) by design — see "Why no CLI framework"
below.

## Architecture

```
bin/hivemind-tools.cjs              # CommonJS shim — argv pipe to runCli
        │
        ▼ (dynamic import)
src/cli/index.ts                    # runCli entrypoint
        │
        ├─ src/cli/discovery.ts     # flatten CommandSources → CliCommand[]
        ├─ src/cli/router.ts        # parseArgs + createRouter dispatch
        ├─ src/cli/renderer.ts      # renderError / renderJson / renderTable / renderHelp
        └─ src/cli/commands/help.ts # canonical built-in command
```

Module sizes (all well under the 500 LOC ceiling):

| File | LOC | Role |
|------|-----|------|
| `bin/hivemind-tools.cjs` | ~40 | CJS shim; one dynamic import + exit-code propagation |
| `src/cli/index.ts` | ~95 | `buildHarnessCli`, `runCli` IO piping |
| `src/cli/router.ts` | ~165 | `parseArgs`, `createRouter` (PH40-01, PH40-02) |
| `src/cli/discovery.ts` | ~80 | `validateCommand`, `discoverCommands` (PH40-02) |
| `src/cli/renderer.ts` | ~115 | `renderError`, `renderJson`, `renderTable`, `renderHelp` (PH40-03) |
| `src/cli/commands/help.ts` | ~35 | Built-in `help` exemplar |

## Requirement coverage

### PH40-01 — `bin/hivemind-tools.cjs` central router for all CLI commands

- `bin/hivemind-tools.cjs` is a tiny CommonJS shim. It dynamically
  imports the compiled ESM `dist/cli/index.js`, calls
  `runCli(process.argv.slice(2))`, and propagates the resolved exit
  code.
- Failure modes are explicit: missing `runCli` export → `[Harness]`
  message + exit 70; uncaught error inside `runCli` → `[Harness]`
  message + exit 70.
- Wired through `package.json` so `npm install` registers the
  `hivemind-tools` binary system-wide:
  ```json
  "bin": { "hivemind-tools": "./bin/hivemind-tools.cjs" },
  "files": ["dist", "bin"]
  ```

### PH40-02 — Command discovery and routing system

- `src/cli/router.ts` owns argv parsing (`parseArgs`) and dispatch
  (`createRouter`). Argument forms: bare command, `--flag` (boolean),
  `--flag value`, `--flag=value`, positional args.
- Exit codes follow BSD `sysexits.h`:
  - `0` — success
  - `64` (`EX_USAGE`) — unknown command, missing command
  - `70` (`EX_SOFTWARE`) — handler threw
- `src/cli/discovery.ts` owns the registration boundary:
  `validateCommand` (non-empty name/summary, no whitespace in name,
  function handler) and `discoverCommands` (flatten ordered
  `CommandSource[]` → `CliCommand[]`, reject duplicate names with a
  source-attributed error message).
- Both `createRouter` and `discoverCommands` reject duplicate command
  names and alias collisions at construction time, not at dispatch
  time, so misconfiguration surfaces during `buildHarnessCli()`.

### PH40-03 — Context renderer for terminal output

- `renderError` enforces the `[Harness]` prefix policy (single prefix,
  never doubled, prepended only when missing).
- `renderJson` produces deterministic indented JSON.
- `renderTable` renders fixed-width ASCII tables with right-padded
  columns separated by two spaces; rejects shape mismatches with
  `[Harness]` errors; emits a `(no rows)` marker when given empty
  data.
- `renderHelp` formats the registered command set with inline alias
  hints and a `(no commands registered)` placeholder.
- All output is ASCII-only (no boxing characters) so it remains
  readable in CI logs and redirected files.

## Why no CLI framework

The harness is an npm package whose `bin` surface ships into other
projects' `node_modules`. Pulling in commander / yargs / oclif would:

- Add a transitive dependency tree we'd need to security-audit (and
  re-audit on every dependabot bump).
- Couple the substrate to a particular framework's argv conventions
  when the harness's needs are intentionally narrow (one-level command
  routing, flags, positionals, exit codes).
- Make the substrate harder to unit-test — the current router runs
  fully in-process without spawning a subprocess.

The custom router is well under the 500 LOC ceiling and covers every
contract in the CONTEXT.md.

## Tests

18 new tests across 4 files, all RED → GREEN:

| Test file | Tests | Coverage |
|-----------|-------|----------|
| `tests/cli/router.test.ts` | 12 | `parseArgs` (5) + `createRouter` registry/dispatch (7) including alias dispatch, exit-code propagation, handler-exception capture, duplicate-name rejection, alias-collision rejection |
| `tests/cli/discovery.test.ts` | 9 | `validateCommand` (5) + `discoverCommands` (4) including registration order, duplicate rejection across sources, malformed-entry rejection |
| `tests/cli/renderer.test.ts` | 9 | `renderError` prefix policy (2), `renderJson` (2), `renderTable` (3), `renderHelp` (3) |
| `tests/cli/runCli.test.ts` | 8 | `buildHarnessCli` registration semantics (3) + `runCli` IO + exit code (5) |

Plus end-to-end smoke verification:

```
$ node bin/hivemind-tools.cjs help
Available commands:

  help (--help, -h)  List every registered CLI command and its summary.
```

Full suite: **1205 / 1205 passing** (was 1187 + 18 new).

## Gates

- `npm run typecheck` — clean
- `npm test` — 1205/1205 passing
- `npm run build` — clean (compiles `dist/cli/`)

## Public API

- `package.json#bin.hivemind-tools` → `bin/hivemind-tools.cjs`
- `package.json#exports["./cli"]` → `dist/cli/index.js` (so plugins /
  test suites can `import { runCli, buildHarnessCli } from "<package>/cli"`)

## Out of scope (explicit non-goals)

- No actual harness commands (other than `help`). This phase delivers
  the *substrate*. Domain commands (delegation status, journal query,
  trajectory inspect, …) are follow-up phases each owning their own
  command modules in `src/cli/commands/`.
- No interactive prompts, TTY detection, color output, or progress
  indicators. Output is plain ASCII so it stays correct in CI logs and
  redirected files.
- No subcommand nesting (e.g. `hivemind-tools journal query`). The
  substrate dispatches one level deep; nested verbs (if needed) are a
  future phase.
- No shell completion script generation. Future phase if there's
  demand.
