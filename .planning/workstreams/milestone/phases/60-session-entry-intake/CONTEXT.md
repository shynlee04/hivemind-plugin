---
phase: 60-session-entry-intake
priority: P0
status: pending
created: 2026-04-30
depends_on:
  - 57-runtime-pressure-and-control-plane
blocks:
  - 61-control-plane-primitive-registry
gsd_agents:
  - gsd-executor
  - gsd-framework-selector
  - gsd-verifier
requirements:
  - SEI-01
  - SEI-02
  - SEI-03
  - SEI-04
---

# Phase 60: Session Entry Intake

## Goal

Implement the session entry intake system that classifies user intent into 8 purpose classes and resolves language/profile before routing to the appropriate workflow.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| SEI-01 | 8 purpose classes: discovery→brainstorming→research→planning→implementation→gatekeeping→tdd→course-correction | product-detox session-entry |
| SEI-02 | Multi-language detection via Unicode ranges | product-detox session-entry |
| SEI-03 | Intake gate resolution — classify and route before agent dispatch | product-detox session-entry |
| SEI-04 | Profile resolution — match session context to developer profile | product-detox session-entry |

## Scope

- New `src/lib/session-entry/` directory
- New `src/lib/purpose-classifier.ts`
- New `src/lib/language-resolution.ts`
- Tests in `tests/lib/session-entry/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| SEI-01 | gsd-executor | hm-l2-test-driven-execution |
| SEI-02 | gsd-framework-selector | hm-l2-test-driven-execution |
| SEI-03 | gsd-executor | hm-l2-test-driven-execution |
| SEI-04 | gsd-verifier | hm-l2-test-driven-execution |

## Key Files

- `src/lib/session-entry/index.ts`
- `src/lib/session-entry/purpose-classifier.ts`
- `src/lib/session-entry/language-resolution.ts`
- `src/lib/session-entry/intake-gate.ts`
- `src/lib/session-entry/profile-resolver.ts`
- `src/lib/purpose-classifier.ts`
- `src/lib/language-resolution.ts`

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 57: Runtime pressure and control plane (planning contract must be resolved)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source reference: product-detox `src/features/session-entry/` (~1.2K LOC)
