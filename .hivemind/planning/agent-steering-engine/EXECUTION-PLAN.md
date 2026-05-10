---
plan: agent-steering-engine-execution
created: 2026-05-10
status: active
mode: auto-loop
strategy: sequential-gated
---

# Agent Steering Engine — Execution Plan

## Auto-Loop Strategy

```
Phase 03 ──→ Phase 04 ──→ Phase 05 ──→ Phase 06 ──→ Phase 07 ──→ Phase 08
    │                              ↑                                      │
    └── converge at 05 ────────────┘                                      │
                                                                          │
                    FINAL GATE: lifecycle → spec → evidence                │
```

Each phase:
1. L0 hm-orchestrator delegates to L1 hm-coordinator
2. L1 dispatches L2 specialists (executor, reviewer, validator)
3. L0 monitors delegation, runs quality gates
4. Atomic git commit on phase completion
5. STATE.md updated at checkpoint
6. Proceed to next phase

## Per-Phase Pattern

| Step | Action | Agent | Output |
|------|--------|-------|--------|
| 1 | Write CONTEXT.md | hm-l2-writer (via L1) | Phase scope & boundaries |
| 2 | Break into 3-4 atomic plans | hm-l2-planner (via L1) | PLAN-01 through PLAN-04 |
| 3 | Implement (RED→GREEN→REFACTOR) | hm-l2-executor (via L1) | src/ code + tests |
| 4 | Code review | hm-l2-reviewer (via L1) | REVIEW.md |
| 5 | Spec validation | hm-l2-validator (via L1) | VERIFICATION.md |
| 6 | Gate check by L0 | hm-orchestrator | Gate verdict |
| 7 | Git commit | hm-orchestrator | Atomic commit |

## Critical Constraints (from RESEARCH.md validation)

| Constraint | Source | Action |
|-----------|--------|--------|
| messages.transform MUST use in-place mutation (push/splice) | Issue #25754 | Enforced in all injection code |
| Hook firing order: messages.transform FIRST, system.transform SECOND | Issue #19960 | Handle current order; prepare for swap |
| CQRS: hooks read only, tools write | ARCHITECTURE.md | Enforced in steering-state.ts |
| C6: no hook conflicts — append, never replace | REQUIREMENTS.md | All injection targets |

## Phase Dependency Map

```
03-Core-Engine (standalone, no side effects)
    │
    ├──→ 04-Primitive-Registration (reads .opencode/, writes cache)
    │         │
    │         └──→ 05-Injection-Wiring (depends on 03 + 04)
    │                   │
    │                   └──→ 06-Artifact-Steering (needs wired surfaces)
    │                             │
    │                             └──→ 07-Integration (all modules wired)
    │                                       │
    │                                       └──→ 08-Progressive-Enrichment (MVP validated)
    │
    └── 03 can proceed immediately (pure logic, no runtime deps)
```

## Gate Checklist Per Phase

| Phase | Gate | Check |
|-------|------|-------|
| 03 | Unit tests pass | `npx vitest run tests/features/steering-engine/` |
| 03 | Spec compliance | Bidirectional traceability to SPEC.md |
| 03 | Typecheck passes | `npx tsc --noEmit` |
| 04 | Unit tests pass | Primitive scanner tests |
| 04 | Integration test | Scanner outputs correct inventory from .opencode/ |
| 05 | Integration test | No hook conflicts with existing governance |
| 05 | E2E test | Subagent receives role marker on dispatch |
| 06 | E2E test | Steering reminder fires on persistence gap |
| 07 | Full E2E | Delegation → role marker → compaction recovery → reminder |
| 07 | Phase 02 SPEC.md full traceability | All REQ-01 through REQ-06 verified |
| 08 | Progressive enrichment | REQ-07 through REQ-12 validated |
| FINAL | Quality triad | lifecycle → spec → evidence |

## Session Continuity

All delegations tracked in `.hivemind/state/delegations.json`.
Execution progress written to `.hivemind/planning/agent-steering-engine/EXECUTION-PLAN.md` (this file).
If auto-compact occurs, resume from last completed phase checkpoint.
