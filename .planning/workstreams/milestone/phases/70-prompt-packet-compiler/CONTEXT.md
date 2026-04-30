---
phase: 70-prompt-packet-compiler
priority: P2
status: pending
created: 2026-04-30
depends_on:
  - 60-session-entry-intake
blocks: []
gsd_agents:
  - gsd-executor
  - gsd-verifier
requirements:
  - PPC-01
  - PPC-02
  - PPC-03
---

# Phase 70: Prompt Packet Compiler

## Goal

Implement the prompt packet compiler that produces hivemind-kernel-packets for main sessions and hivemind-delegation-packets for sub-sessions with compaction-safe context preservation.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| PPC-01 | hivemind-kernel-packet for main sessions: 33 normalized fields | product-detox prompt-packet |
| PPC-02 | hivemind-delegation-packet for sub-sessions: adds parent_session_id, delegation_inheritance, todo_authority, return_contract | product-detox prompt-packet |
| PPC-03 | Compaction-safe context preservation — survive context window compaction | product-detox prompt-packet |

## Scope

- New `src/lib/prompt-packet/` directory
- Enhance `src/hooks/messages-transform.ts`
- Tests in `tests/lib/prompt-packet/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| PPC-01 | gsd-executor | hm-l2-test-driven-execution |
| PPC-02 | gsd-executor | hm-l2-test-driven-execution |
| PPC-03 | gsd-verifier | hm-l2-test-driven-execution |

## Key Files

- `src/lib/prompt-packet/index.ts`
- `src/lib/prompt-packet/kernel-packet.ts`
- `src/lib/prompt-packet/delegation-packet.ts`
- `src/lib/prompt-packet/compaction-preservation.ts`
- `src/hooks/messages-transform.ts` (enhance)

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 60: Session entry intake (purpose classification feeds packet compilation)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source reference: product-detox `src/context/prompt-packet/` (~200 LOC)
