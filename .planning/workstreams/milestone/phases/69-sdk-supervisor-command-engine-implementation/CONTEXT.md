---
phase: 69-sdk-supervisor-command-engine-implementation
priority: P2
status: pending
created: 2026-04-30
depends_on:
  - 67-runtime-pressure-control-plane-implementation
  - 59-sdk-supervisor-and-command-engine
blocks: []
gsd_agents:
  - gsd-executor
  - gsd-integration-checker
  - gsd-verifier
requirements:
  - SUP-01
  - SUP-02
  - SUP-03
  - SUP-04
planning_contract: 59-CONTRACT-2026-04-30.md
---

# Phase 69: SDK Supervisor Command Engine Implementation

## Goal

Implement the SDK supervisor with health/heartbeat/diagnostics, command bundle discovery/routing/contracts, context renderer, and messages transform enhancement.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| SUP-01 | Health/heartbeat/diagnostics — monitor runtime health and report status | planning-contract 59 |
| SUP-02 | Command bundle discovery/routing/contracts — discover and route command bundles | planning-contract 59 |
| SUP-03 | Context renderer — render session context for supervisor consumption | planning-contract 59 |
| SUP-04 | Messages transform enhancement — enhance message transformation pipeline | planning-contract 59 |

## Scope

- New `src/lib/supervisor/` directory
- Enhance `src/lib/config-compiler.ts`
- Tests in `tests/lib/supervisor/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| SUP-01 | gsd-executor | hm-l2-test-driven-execution |
| SUP-02 | gsd-integration-checker | hm-l2-cross-cutting-change |
| SUP-03 | gsd-executor | hm-l2-test-driven-execution |
| SUP-04 | gsd-verifier | hm-l2-test-driven-execution |

## Key Files

- `src/lib/supervisor/index.ts`
- `src/lib/supervisor/health.ts`
- `src/lib/supervisor/command-bundle.ts`
- `src/lib/supervisor/context-renderer.ts`
- `src/lib/supervisor/messages-transform.ts`
- `src/lib/config-compiler.ts` (enhance)

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 67: Runtime pressure control plane implementation (pressure-aware supervisor)
- Phase 59: SDK supervisor and command engine (planning contract)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source reference: product-detox `src/sdk-supervisor/` (~8 files)
- Planning contract: 59-CONTRACT-2026-04-30.md
