# SE-3 PLAN: Pre-Gate Skill Hardening

**Phase:** SE-3 | **Workstream:** skill-ecosystem | **Date:** 2026-04-29

## Objective
Harden 4 existing Pre-Gate skills (hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance) to achieve RICH-8 score ≥ 6/8 each.

## Research Baseline (RICH-8 Scorecard)

| Criteria | hm-brainstorm | hm-req-analysis | hm-cross-cutting | hm-tech-context |
|---|---|---|---|---|
| 1. Progressive disclosure | PASS | PASS | PASS | PASS |
| 2. Trigger phrases (≥3) | PASS | PASS | PASS | PASS |
| 3. Lineage prefix match | PASS | PASS | PASS | PASS |
| 4. Cross-refs resolve | PASS | FAIL (hm-gate-orchestrator) | PASS | PASS |
| 5. No hardcoded paths | FAIL (.planning/) | PASS | WARN (npm cmds) | FAIL (.hivemind/) |
| 6. Evals (≥3 scenarios) | FAIL | FAIL | FAIL | FAIL |
| 7. Self-correction section | FAIL | FAIL | FAIL | FAIL |
| 8. RICH-8 scorecard (metrics/) | FAIL | FAIL | FAIL | FAIL |
| **BASELINE** | **4/8** | **3/8** | **4/8** | **3/8** |

## Tasks

### T1: Create evals/ directories with ≥3 eval scenarios (all 4 skills)
**Targets:** RICH-8-6
For each skill, create `evals/` directory with `evals.json` containing ≥3 realistic eval scenarios.
**Verification:** Each skill has `evals/evals.json` with ≥3 entries.

### T2: Add Self-Correction sections (all 4 skills)
**Targets:** RICH-8-7
Add a ## Self-Correction section to each SKILL.md with:
- When the skill produces wrong results
- How to detect the failure
- Recovery steps for each failure mode
**Verification:** Each SKILL.md contains a Self-Correction section with ≥2 failure modes.

### T3: Create metrics/ directories with RICH-8 scorecards (all 4 skills)
**Targets:** RICH-8-8
For each skill, create `metrics/rich-gate-scorecard.md` with D1-D8 scores + RICH gate evidence.
**Verification:** Each skill has `metrics/rich-gate-scorecard.md` with complete scoring.

### T4: Fix hardcoded paths in hm-brainstorm
**Targets:** RICH-8-5
Replace `.planning/requirements/YYYY-MM-DD-<topic>-brief.md` with framework-agnostic adapter note.
**Verification:** No hardcoded `.planning/` paths in SKILL.md body.

### T5: Fix hardcoded paths in hm-tech-context-compliance
**Targets:** RICH-8-5
Replace `.hivemind/evidence/tech-compliance-report-<timestamp>.md` with adapter note + portable default.
**Verification:** No hardcoded `.hivemind/` paths without adapter context.

### T6: Document cross-ref gap in hm-requirements-analysis
**Targets:** RICH-8-4
`hm-gate-orchestrator` is SE-5 deliverable. Add gap documentation noting it as future reference.
**Verification:** Cross-ref either documented as gap or replaced with existing skill reference.

## Execution Order
T4 → T5 → T6 → T1 → T2 → T3

## Success Criteria
- All 4 skills score ≥ 6/8 on RICH-8
- Only SE-3 target skills modified (no scope creep)
- Each task committed atomically
