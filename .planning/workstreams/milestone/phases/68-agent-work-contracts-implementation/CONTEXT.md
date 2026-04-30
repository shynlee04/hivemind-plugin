---
phase: 68-agent-work-contracts-implementation
priority: P1
status: pending
created: 2026-04-30
depends_on:
  - 67-runtime-pressure-control-plane-implementation
  - 58-agent-work-contracts
blocks: []
gsd_agents:
  - gsd-executor
  - gsd-pattern-mapper
  - gsd-verifier
requirements:
  - AWC-01
  - AWC-02
  - AWC-03
  - AWC-04
planning_contract: 58-CONTRACT-2026-04-30.md
---

# Phase 68: Agent Work Contracts Implementation

## Goal

Implement agent work contracts with Zod schemas, intent classification, chain execution with event-driven handlers, and compaction preservation packets.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| AWC-01 | AgentWorkContract Zod schema — typed contract between orchestrator and executor | planning-contract 58 |
| AWC-02 | IntentClassifier with keyword matching — classify user intent for contract routing | planning-contract 58 |
| AWC-03 | ChainExecutor with event-driven handlers — execute contract chains with events | planning-contract 58 |
| AWC-04 | CompactionPreservationPacket — preserve critical context across compaction | planning-contract 58 |

## Scope

- New `src/lib/work-contract/` directory
- Enhance `src/schema-kernel/`
- Tests in `tests/lib/work-contract/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| AWC-01 | gsd-executor | hm-l2-test-driven-execution |
| AWC-02 | gsd-pattern-mapper | hm-l2-test-driven-execution |
| AWC-03 | gsd-executor | hm-l2-test-driven-execution |
| AWC-04 | gsd-verifier | hm-l2-test-driven-execution |

## Key Files

- `src/lib/work-contract/index.ts`
- `src/lib/work-contract/agent-work-contract.ts`
- `src/lib/work-contract/intent-classifier.ts`
- `src/lib/work-contract/chain-executor.ts`
- `src/lib/work-contract/compaction-packet.ts`
- `src/schema-kernel/work-contract.schema.ts`

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side
- Zod v4 for schema validation

## Dependencies

- Phase 67: Runtime pressure control plane implementation (pressure-aware contracts)
- Phase 58: Agent work contracts (planning contract)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source reference: product-detox `src/features/agent-work-contract/` (~3K LOC, needs decomposition)
- Planning contract: 58-CONTRACT-2026-04-30.md
