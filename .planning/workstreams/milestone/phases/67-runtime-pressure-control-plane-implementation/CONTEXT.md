---
phase: 67-runtime-pressure-control-plane-implementation
priority: P1
status: pending
created: 2026-04-30
depends_on:
  - 61-control-plane-primitive-registry
  - 57-runtime-pressure-and-control-plane
blocks:
  - 39-auto-loop-ralph-loop-engine
  - 68-agent-work-contracts-implementation
gsd_agents:
  - gsd-executor
  - gsd-code-reviewer
  - gsd-integration-checker
requirements:
  - PRESSURE-01
  - PRESSURE-02
  - PRESSURE-03
planning_contract: 57-CONTRACT-2026-04-30.md
---

# Phase 67: Runtime Pressure Control Plane Implementation

## Goal

Implement the 10-tier runtime pressure model with control-plane gate decisions and tool catalog authority matrix for adaptive runtime behavior.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| PRESSURE-01 | 10-tier steady→advisory→gated→blocking pressure model | planning-contract 57 |
| PRESSURE-02 | Control-plane detect() gate decisions — integrate with primitive registry | planning-contract 57 |
| PRESSURE-03 | Tool catalog authority matrix — which tools are available at each pressure tier | planning-contract 57 |

## Scope

- New `src/lib/pressure/` directory
- Enhance `src/lib/runtime-policy.ts`
- Tests in `tests/lib/pressure/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| PRESSURE-01 | gsd-executor | hm-l2-test-driven-execution |
| PRESSURE-02 | gsd-code-reviewer | hm-l2-cross-cutting-change |
| PRESSURE-03 | gsd-integration-checker | hm-l2-test-driven-execution |

## Key Files

- `src/lib/pressure/index.ts`
- `src/lib/pressure/pressure-tiers.ts`
- `src/lib/pressure/gate-decisions.ts`
- `src/lib/pressure/tool-authority.ts`
- `src/lib/runtime-policy.ts` (enhance)

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 61: Control plane primitive registry (primitive detection)
- Phase 57: Runtime pressure and control plane (planning contract)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Planning contract: 57-CONTRACT-2026-04-30.md
