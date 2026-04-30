---
phase: 18
slug: context-and-research-phase-cr-for-skills-refactor-playbook-v
status: planned
plans: 4
waves: 4
deliverables: 8
created: 2026-04-23
---

# Phase 18 Master Orchestration Plan

**Phase:** 18 — Context & Research (Playbook Phase CR)
**Type:** Research / Audit only (zero skill edits, zero src/ changes)
**Goal:** Produce the evidence base and audit posture that Phases 19–23 consume

## Wave Structure

| Wave | Plan | Deliverables | Depends On | Autonomous |
|------|------|-------------|------------|------------|
| 1 | [18-01-PLAN.md](18-01-PLAN.md) | CR-CONTEXT.md, CR-RESEARCH.md | — | Yes |
| 2 | [18-02-PLAN.md](18-02-PLAN.md) | CR-AUDIT-ECOSYSTEM.md, CR-GAP-MAP.md | Wave 1 | Yes |
| 3 | [18-03-PLAN.md](18-03-PLAN.md) | CR-THIRD-PARTY-HARVEST.md, CR-RUNTIME-READINESS.md | Wave 1 | Yes |
| 4 | [18-04-PLAN.md](18-04-PLAN.md) | CR-DECISIONS.md, CR-VERIFICATION.md, CR-DISCUSSION-LOG.md | Waves 2-3 | No (checkpoint) |

## Deliverable Mapping (8 CR deliverables)

| # | Deliverable | File | Produced By | Wave |
|---|-------------|------|-------------|------|
| CR-01 | Phase context envelope | `CR-CONTEXT.md` | 18-01 Task 1 | 1 |
| CR-02 | Grounded research document | `CR-RESEARCH.md` | 18-01 Task 2 | 1 |
| CR-03 | Per-skill 6-NON audit grid | `CR-AUDIT-ECOSYSTEM.md` | 18-02 Task 1 | 2 |
| CR-04 | Differential cluster gap map | `CR-GAP-MAP.md` | 18-02 Task 2 | 2 |
| CR-05 | Third-party pattern harvest | `CR-THIRD-PARTY-HARVEST.md` | 18-03 Task 1 | 3 |
| CR-06 | Runtime-readiness map | `CR-RUNTIME-READINESS.md` | 18-03 Task 2 | 3 |
| CR-07 | Tooling decision table | `CR-DECISIONS.md` | 18-04 Task 1 | 4 |
| CR-08 | Verification report | `CR-VERIFICATION.md` | 18-04 Task 2 | 4 |

## Conceptual Wave → Executable Plan Mapping

The user's 7 conceptual waves map to 4 executable plans for context efficiency:

- **Conceptual Waves 1 (Ecosystem Audit)** → **Executable Wave 1** (18-01)
  - Sub-wave 1a: Runtime probe of all 24 skills
  - Sub-wave 1b: check-overlaps.sh + trigger collision report
  - Sub-wave 1c: Call-site audit (rg skill: references)

- **Conceptual Wave 2 (6-NON Defence Grid)** → **Executable Wave 2** (18-02 Task 1)

- **Conceptual Wave 3 (Differential Cluster Gap Mapping)** → **Executable Wave 2** (18-02 Task 2)

- **Conceptual Wave 4 (Third-Party Pattern Harvest)** → **Executable Wave 3** (18-03 Task 1)

- **Conceptual Wave 5 (Runtime-Readiness Assessment)** → **Executable Wave 3** (18-03 Task 2)

- **Conceptual Wave 6 (Tooling Decision Table)** → **Executable Wave 4** (18-04 Task 1)

- **Conceptual Wave 7 (Verification + Sign-off)** → **Executable Wave 4** (18-04 Task 2)

## Execution Order

```
Wave 1 (18-01) ──→ Wave 2 (18-02) ─┐
                    Wave 3 (18-03) ─┤
                                     └──→ Wave 4 (18-04)
```

- Waves 2 and 3 can run in parallel (both depend only on Wave 1)
- Wave 4 requires Waves 2 and 3 to complete
- Wave 4 has a human checkpoint for sign-off

## Phase Context

See: [18-CONTEXT.md](18-CONTEXT.md)

## Supporting Artifacts

- [18-RESEARCH.md](18-RESEARCH.md) — Research base with ecosystem data and per-skill inventory
- [18-VALIDATION.md](18-VALIDATION.md) — Validation strategy with per-task verification map

## Exit Criteria

- [ ] All 8 deliverables committed in phase directory
- [ ] check-overlaps.sh run and results attached
- [ ] Stacked-workflow eval run (coordinating-loop + planning-with-files + phase-loop)
- [ ] User signs off in CR-DISCUSSION-LOG.md
- [ ] npm run typecheck passes (no regressions from Phase 17)
- [ ] npm test passes (351 tests)

## Failure Signals (abort and redesign if any appear)

1. Any finding that cannot be mapped to a 6-NON mode AND a differential cluster
2. Any deliverable that restores a third-party skill verbatim (I.6 violation)
3. Any deliverable that assumes `.md` staging is the final form (I.3 violation)
4. Decision table with more than 20% "no change" rows (indicates shallow audit)
