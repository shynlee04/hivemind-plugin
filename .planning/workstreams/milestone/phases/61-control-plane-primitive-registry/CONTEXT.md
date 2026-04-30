---
phase: 61-control-plane-primitive-registry
priority: P0
status: complete_conditional_runway
completion_note: "Primitive registry, gate decisions, blocking enforcement implemented. Conditional on final integration testing."
created: 2026-04-30
depends_on:
  - 60-session-entry-intake
blocks:
  - 67-runtime-pressure-control-plane-implementation
gsd_agents:
  - gsd-executor
  - gsd-integration-checker
  - gsd-code-reviewer
requirements:
  - CP-01
  - CP-02
  - CP-03
  - CP-04
---

# Phase 61: Control Plane Primitive Registry

## Goal

Implement the control plane primitive registry that detects OpenCode primitives (agents, skills, commands, tools) and enforces gatekeeper decisions before user messages reach the agent.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| CP-01 | Gatekeeper running BEFORE user messages — intercept and route | product-detox control-plane |
| CP-02 | Primitive detection: hm-init, hm-doctor, hm-harness, hm-settings | product-detox control-plane |
| CP-03 | Blocking vs non-blocking gate decisions — classify and enforce | product-detox control-plane |
| CP-04 | manualStateWritesForbidden enforcement — prevent raw state mutation | product-detox control-plane |

## Scope

- New `src/lib/control-plane/` directory
- New `src/lib/primitive-registry.ts`
- Tests in `tests/lib/control-plane/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| CP-01 | gsd-executor | hm-l2-test-driven-execution |
| CP-02 | gsd-integration-checker | hm-l2-cross-cutting-change |
| CP-03 | gsd-executor | hm-l2-test-driven-execution |
| CP-04 | gsd-code-reviewer | hm-l2-test-driven-execution |

## Key Files

- `src/lib/control-plane/index.ts`
- `src/lib/control-plane/primitive-registry.ts`
- `src/lib/control-plane/gatekeeper.ts`
- `src/lib/control-plane/gate-decision.ts`
- `src/lib/primitive-registry.ts`

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 60: Session entry intake (purpose classification feeds gatekeeper)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source reference: product-detox `src/control-plane/` (~1K LOC)
