# Phase 03 — Core Engine Implementation Task Inventory

**Session:** phase-03-steering-engine
**Started:** 2026-05-10
**Coordinator:** hm-l1-coordinator

## Wave 1 — Independent Foundation (Parallel)

- [ ] PLAN-01: `types.ts` + `steering-state.ts` — types, SteeringContext, SteeringDecision, turn counter, CQRS read-side | ~150 LOC
- [ ] PLAN-02: `schema/steering-policy.schema.ts` — Zod schemas from SPEC.md §1 | ~200 LOC

## Wave 2 — Dependent Logic (Sequential after Wave 1 validation)

- [ ] PLAN-03: `policy-evaluator.ts` — condition evaluation + priority cascade | ~250 LOC
- [ ] PLAN-04: `injection-builder.ts` + `index.ts` — template rendering + barrel export | ~250 LOC

## Wave 3 — Review & Validation

- [ ] CODE REVIEW: hm-l2-reviewer — security, performance, bug analysis
- [ ] VALIDATION: hm-l2-validator — spec compliance check
- [ ] VERIFICATION: `npx tsc --noEmit` + `npx vitest run tests/features/steering-engine/`
