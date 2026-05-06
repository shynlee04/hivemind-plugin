# CONTEXT: Bootstrap CLI & Onboarding

**Workstream:** bootstrap-cli-onboarding (WS-2)
**Status:** PLANNED
**Parent Doc:** → `.planning/ROADMAP.md`

## Purpose

Deliver the user-facing `npm install` → `npx init` → first session pathway. Support greenfield (fresh project) and brownfield (existing project) setup. Include doctor/checkup mode for health validation.

## Scope

- npm package installation model: `npm install opencode-harness`
- `npx opencode-harness init` interactive setup wizard
- Greenfield project bootstrap: fresh `.hivemind/` directory + `.opencode/` primitives
- Brownfield project integration: adapt existing OpenCode project to Hivemind
- `configs.json` interactive configuration (language, mode, expertLevel, delegationSystems)
- Doctor/checkup mode: primitive health validation, configuration drift detection, restart verification
- CLI substrate: leverage existing `src/cli/` scaffold (Phase 40 foundation)
- Post-install verification: ensure all primitives are discoverable and healthy

## Feature Refs

- f-05 — CLI installation and bootstrap
- f-05.i — configs.json interactive configuration
- f-05.ii — Greenfield project init
- f-05.iii — Brownfield project onboarding
- BOOTSTRAP-01 — npm package install model
- BOOTSTRAP-02 — Interactive greenfield setup
- BOOTSTRAP-03 — Brownfield project adaptation
- BOOTSTRAP-04 — Doctor/checkup mode

## Dependencies

- **hivemind-state-architecture (WS-1, PLANNED)**: `.hivemind/` structure + `configs.json` schema
- **primitive-registry (WS-3, PLANNED)**: Validating installed primitives during doctor mode
- **Phase 40 (COMPLETE)**: `src/cli/` scaffold foundation

## Status: PLANNED

Current foundation: `src/cli/` directory exists as Phase 40 scaffold. No interactive setup wizard, no `npx init` command, no configs.json, no doctor mode. The 3 new workstreams must complete in dependency order: hivemind-state-architecture → primitive-registry → bootstrap-cli-onboarding.
