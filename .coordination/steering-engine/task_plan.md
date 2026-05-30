# Steering Engine — Task Inventory (auto-loop)

**Session:** steering-engine-auto-2026-05-10
**Mode:** batch-sequential (one phase at a time, gate between phases)
**Strategy per AGENTS.md:** sequential, max 2 parallel within phase

## Task Inventory

| # | Task | Phase | Depends On | Status |
|---|------|-------|------------|--------|
| T-01 | Core Engine Implementation (types, schemas, evaluator, builder, state) | 03 | Phase 02 SPEC+PATTERNS | pending |
| T-02 | Dynamic Primitive Registration (scanner, YAML parser, inventory) | 04 | Phase 03 (types) | pending |
| T-03 | Injection Surfaces Wiring (hook integration, conflict detection) | 05 | Phase 03 + 04 | pending |
| T-04 | Artifact Persistence Steering (persistence-gap detection, reminders) | 06 | Phase 05 | pending |
| T-05 | Integration And Validation (E2E tests, spec compliance) | 07 | Phase 03-06 | pending |
| T-06 | Progressive Enrichment Layer (REQ-07 through REQ-12) | 08 | Phase 07 validation | pending |

## Dispatch Rules

1. Sequential by phase (03→04→05→06→07→08)
2. Within each phase: max 2 parallel L2 specialists
3. Gate check after each phase before proceeding
4. 3 retry max per phase, then escalate
5. Atomic git commit per phase

## Artifact Locations

- Coordination: `.coordination/steering-engine/`
- Planning: `.hivemind/planning/agent-steering-engine/`
- Code: `src/features/steering-engine/`
- Tests: `tests/features/steering-engine/`
