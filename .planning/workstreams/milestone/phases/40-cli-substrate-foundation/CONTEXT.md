---
phase: 40-cli-substrate-foundation
priority: P2
status: complete
created: 2026-04-30
completed: 2026-05-01
completion_note: "PH40-01 satisfied by bin/hivemind-tools.cjs (CommonJS shim) + src/cli/index.ts (runCli entrypoint with stdout/stderr piping). PH40-02 satisfied by src/cli/router.ts (parseArgs, createRouter — name + alias dispatch, sysexits exit codes) + src/cli/discovery.ts (CommandSource flattening + duplicate detection). PH40-03 satisfied by src/cli/renderer.ts (renderError [Harness] policy, renderJson, renderTable with column alignment, renderHelp). Built-in `help` command included as canonical exemplar. Wired through package.json bin field. 18 new tests, framework-free, well under 500 LOC ceiling."
depends_on: []
blocks: []
gsd_agents: [gsd-executor, gsd-framework-selector]
requirements: [PH40-01, PH40-02, PH40-03]
---

# Phase 40: CLI Substrate Foundation

## Goal

Establish the `bin/` CLI substrate with a central router (`bin/hivemind-tools.cjs`), command discovery and routing, and context rendering for terminal output.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| PH40-01 | `bin/hivemind-tools.cjs` central router for all CLI commands | Architecture proposal |
| PH40-02 | Command discovery and routing system | Architecture proposal |
| PH40-03 | Context renderer for terminal output formatting | Architecture proposal |

## Scope

- New `bin/` directory with CLI substrate
- `bin/hivemind-tools.cjs` — central router
- Command discovery module
- Context renderer
- Tests for CLI substrate

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| PH40-01 | gsd-executor | hm-test-driven-execution |
| PH40-02 | gsd-framework-selector | hm-test-driven-execution |
| PH40-03 | gsd-executor | hm-test-driven-execution |

## Key Files

- New `bin/` directory
- `bin/hivemind-tools.cjs` — central router
- New `src/cli/` modules (discovery, routing, rendering)

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- `[Harness]` prefix on all thrown errors
- CLI substrate target: ~500 LOC

## Constraints

- RED-first TDD for all changes
- Atomic scoped commits
- Full test suite must pass after each change
- Currently has placeholder `.gitkeep` in bin/
