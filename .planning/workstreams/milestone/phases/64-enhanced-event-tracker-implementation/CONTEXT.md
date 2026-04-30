---
phase: 64-enhanced-event-tracker-implementation
priority: P1
status: pending
created: 2026-04-30
depends_on:
  - 56-trajectory-and-session-v3
blocks: []
gsd_agents:
  - gsd-executor
  - gsd-pattern-mapper
  - gsd-verifier
requirements:
  - EVT-01
  - EVT-02
  - EVT-03
  - EVT-04
---

# Phase 64: Enhanced Event Tracker Implementation

## Goal

Implement the enhanced event tracker with 10 event types, classification pipeline, delegation evidence tracking, and dual persistence (atomic JSON + append-only Markdown).

## Requirements

> **Note:** Phase 56 already delivered v3 metadata, rendering, and basic event-tracker enhancements. This phase adds ONLY the new event types, classification, delegation evidence, and dual persistence.

| ID | Requirement | Source |
|----|-------------|--------|
| EVT-01 | 10 event types: user_message, assistant_output, tool_invocation, delegation_created, delegation_returned, compaction, session_start, session_end, injection, error | product-detox event-tracker |
| EVT-02 | Event classification pipeline — categorize and route events by type | product-detox event-tracker |
| EVT-03 | Delegation evidence tracking: partial/blocked/complete states | product-detox event-tracker |
| EVT-04 | Dual persistence: atomic JSON + append-only Markdown | product-detox event-tracker |

## Scope

- Enhance `src/lib/session-journal.ts`
- New `src/lib/event-tracker/` directory
- Tests in `tests/lib/event-tracker/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| EVT-01 | gsd-executor | hm-l2-test-driven-execution |
| EVT-02 | gsd-pattern-mapper | hm-l2-test-driven-execution |
| EVT-03 | gsd-executor | hm-l2-test-driven-execution |
| EVT-04 | gsd-verifier | hm-l2-cross-cutting-change |

## Key Files

- `src/lib/event-tracker/index.ts`
- `src/lib/event-tracker/event-types.ts`
- `src/lib/event-tracker/classifier.ts`
- `src/lib/event-tracker/delegation-evidence.ts`
- `src/lib/event-tracker/dual-persistence.ts`
- `src/lib/session-journal.ts` (enhance)

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 56: Trajectory and session v3 (trajectory records feed event context)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source reference: product-detox `src/features/event-tracker/` (~3K LOC, needs decomposition to <500 LOC modules)
