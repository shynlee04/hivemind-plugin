---
phase: 37-async-result-harvesting
priority: P1
status: complete
completion_note: "PH37-01 + PH37-02 verified implemented 2026-05-01: SDK path harvests via sdk-delegation.ts:248-249 (extractAllAssistantText), command path via command-delegation.ts:281, delegation-status tool returns redacted result at delegation-status.ts:31. Phase 36 PH36-03 dependency closed by PR #72."
created: 2026-04-30
completed: 2026-05-01
depends_on: [36-lifecycle-state-machine-enforcement]
blocks: []
gsd_agents: [gsd-executor, gsd-code-reviewer]
requirements: [PH37-01, PH37-02]
---

# Phase 37: Async Result Harvesting

## Goal

Extract child session results into `delegation.result` and update the `delegation-status` tool to return harvested results for completed delegations.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| PH37-01 | Extract child session results into `delegation.result` for completed delegations | Delegation revamp |
| PH37-02 | Update `delegation-status` tool to return harvested results | Delegation revamp |

## Scope

- `src/lib/sdk-delegation.ts` — result extraction from child sessions
- `src/tools/delegation-status.ts` — return harvested results
- Tests for both

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| PH37-01 | gsd-executor | hm-test-driven-execution |
| PH37-02 | gsd-executor | hm-test-driven-execution |

## Key Files

- `src/lib/sdk-delegation.ts` — child session result extraction
- `src/tools/delegation-status.ts` — status polling and result retrieval
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
