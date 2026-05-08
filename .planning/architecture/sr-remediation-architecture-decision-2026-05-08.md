# SR Remediation Architecture Decision — Source Plane Completion

**Date:** 2026-05-08  
**Status:** Accepted  
**Scope:** SR-04 through SR-10 remediation after aborted SR-04 bulk migration

## Decision

Complete WS-SR with a corrected ownership model instead of retrying the aborted all-at-once `src/features/` move.

## Corrected Ownership

| Surface | Destination | Reason |
|---|---|---|
| PTY/background command, doc intelligence, runtime pressure, agent work contracts, SDK supervisor, prompt packets, bootstrap validators/loaders | `src/features/` | Standalone runtime features and support modules with typed entrypoints |
| Config subscriber/compiler/workflow | `src/config/` | Config is a first-class runtime contract, not a feature module |
| Session entry, behavioral profile, command engine | `src/routing/` | These modules classify and route sessions/commands rather than implement standalone features |
| Hooks | `src/hooks/{lifecycle,guards,observers,transforms,composition}/` | Preserves CQRS read-side boundaries by hook purpose |
| Tools | `src/tools/{delegation,session,config,hivemind,prompt}/` | Keeps write-side tool entrypoints grouped by domain |
| Plugin composition | `src/plugin.ts` | Remains the composition root; no `src/plugin/` directory is created in this remediation cycle |

## Rejected Alternatives

1. Retry the original SR-04 bulk move: rejected because it kept contradictory ownership for `command-engine` and `config-workflow` and previously produced test regressions.
2. Create broad `src/plugin/` during SR-09: rejected because `src/plugin.ts` is already reduced to under 200 LOC and sector governance still makes the file the plugin authority.
3. Roll back SR-01 through SR-03: rejected because those phases were typecheck/test green and compatible with the corrected target model.

## Evidence

- Migration script: `.planning/migrations/sr-restructure-2026-05-08.mjs`
- Typecheck: `npm run typecheck` passed on 2026-05-08
- Tests: `npm test` passed `133` files, `1820` tests, `2` skipped on 2026-05-08
- Build: `npm run build` passed on 2026-05-08

## Guardrails

- No shell `sed`/`perl` import rewrites; path-aware migration script only.
- Source and tests must be rewritten together.
- `.opencode/` remains primitives-only; `.hivemind/` remains runtime state root.
- Any future plugin decomposition must use a separate source-backed decision before creating `src/plugin/`.
