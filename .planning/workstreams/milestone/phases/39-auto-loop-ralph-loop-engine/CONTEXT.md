---
phase: 39-auto-loop-ralph-loop-engine
priority: P2
status: pending
created: 2026-04-30
depends_on: [36-lifecycle-state-machine-enforcement, 67-runtime-pressure-control-plane-implementation]
blocks: []
gsd_agents: [gsd-executor, gsd-verifier]
requirements: [PH39-01, PH39-02, PH39-03]
---

# Phase 39: Auto-Loop / Ralph-Loop Engine

## Goal

Implement self-referential development loop (auto-loop) that continues until completion, and the ralph-loop validate-fix-redispatch cycle with a maximum of 3 correction cycles per task.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| PH39-01 | Self-referential dev loop that continues until task completion is detected | Runtime features |
| PH39-02 | Ralph-loop: validate-fix-redispatch cycle for failed delegations | Runtime features |
| PH39-03 | Max 3 correction cycles per task before escalation | Circuit breaker pattern |

## Scope

- New `src/lib/auto-loop.ts` — auto-loop engine
- New `src/lib/ralph-loop.ts` — ralph-loop cycle
- Integration with `completion-detector.ts` and `delegation-manager.ts`
- Tests for both

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| PH39-01 | gsd-executor | hm-test-driven-execution |
| PH39-02 | gsd-executor | hm-test-driven-execution |
| PH39-03 | gsd-verifier | hm-test-driven-execution |

## Key Files

- New `src/lib/auto-loop.ts`
- New `src/lib/ralph-loop.ts`
- `src/lib/completion-detector.ts` — two-signal completion detection
- `src/lib/delegation-manager.ts` — core delegation orchestrator

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- `[Harness]` prefix on all thrown errors
- Deep-clone-on-read in continuity store

## Constraints

- RED-first TDD for all changes
- Atomic scoped commits
- Full test suite must pass after each change
- Max 3 correction cycles enforced with escalation
