---
phase: SE-3-pre-gate-skills
plan: SE-3
subsystem: skill-ecosystem
tags: [RICH-8, skill-hardening, evals, self-correction, metrics, hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance]

# Dependency graph
requires:
  - phase: SE-2
    provides: Planning pipeline backbone (hm-planning-persistence), 20+ reference fixes across 12 skills
provides:
  - 4 pre-gate skills hardened to RICH-8 score ≥6/8
  - hm-brainstorm: evals (3 scenarios), self-correction (4 modes), metrics scorecard (D1-D8: 106/120, A)
  - hm-requirements-analysis: evals (3), self-correction (4), metrics scorecard (D1-D8: 109/120, A)
  - hm-cross-cutting-change: evals (3), self-correction (4), metrics scorecard (D1-D8: 114/120, A)
  - hm-tech-context-compliance: evals (3), self-correction (4), metrics scorecard (D1-D8: 106/120, A)
affects: [SE-3.5, SE-3.6, SE-4, SE-5]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RICH-8 hardening pattern: evals/ + metrics/ + self-correction section per skill"
    - "Framework-agnostic path pattern: <project-root>/ with adapter notes for HiveMind/GSD/generic"
    - "Cross-ref gap documentation pattern: [Future: SE-X deliverable — not yet created]"

key-files:
  created:
    - .opencode/skills/hm-brainstorm/evals/evals.json
    - .opencode/skills/hm-brainstorm/metrics/rich-gate-scorecard.md
    - .opencode/skills/hm-requirements-analysis/evals/evals.json
    - .opencode/skills/hm-requirements-analysis/metrics/rich-gate-scorecard.md
    - .opencode/skills/hm-cross-cutting-change/evals/evals.json
    - .opencode/skills/hm-cross-cutting-change/metrics/rich-gate-scorecard.md
    - .opencode/skills/hm-tech-context-compliance/evals/evals.json
    - .opencode/skills/hm-tech-context-compliance/metrics/rich-gate-scorecard.md
    - .planning/workstreams/skill-ecosystem/phases/SE-3-pre-gate-skills/SE-3-PLAN.md
  modified:
    - .opencode/skills/hm-brainstorm/SKILL.md
    - .opencode/skills/hm-requirements-analysis/SKILL.md
    - .opencode/skills/hm-cross-cutting-change/SKILL.md
    - .opencode/skills/hm-tech-context-compliance/SKILL.md

key-decisions:
  - "RICH-8 threshold set at ≥6/8 per skill — all 4 skills passed"
  - "hm-gate-orchestrator cross-ref documented as [Future: SE-5] gap — does not block RICH-8 pass"
  - "Paths de-hardcoded with framework adapter pattern: <project-root>/ with ecosystem-specific notes"
  - "Self-correction pattern: 4 failure modes per skill (detection + recovery for each)"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-04-29
---

# Phase SE-3: Pre-Gate Skill Hardening Summary

**Hardened 4 pre-gate skills (hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance) to RICH-8 score ≥6/8 with evals, self-correction, metrics scorecards, and framework-agnostic paths**

## RICH-8 Final Scores

| Skill | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | **Total** | D1-D8 |
|-------|----|----|----|----|----|----|----|-----|-----------|-------|
| hm-brainstorm | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **8/8** | 106/120 (A) |
| hm-requirements-analysis | ✅ | ✅ | ✅ | ✅* | ✅ | ✅ | ✅ | ✅ | **8/8** | 109/120 (A) |
| hm-cross-cutting-change | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **8/8** | 114/120 (A) |
| hm-tech-context-compliance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **8/8** | 106/120 (A) |

\* hm-requirements-analysis: hm-gate-orchestrator reference documented as "[Future: SE-5 deliverable — not yet created]" — gap fully documented, resolves when SE-5 delivers.

## Accomplishments

- Created `evals/` directories with 3 realistic eval scenarios for each of the 4 skills
- Added `## Self-Correction` sections with 4 failure modes + detection + recovery per skill
- Created `metrics/rich-gate-scorecard.md` with complete D1-D8 and RICH gate evidence
- De-hardcoded project-specific paths (`.planning/`, `.hivemind/evidence/`) to framework-agnostic `<project-root>/` with adapter notes
- Documented cross-ref gap for `hm-gate-orchestrator` (SE-5 deliverable) in hm-requirements-analysis
- All 4 skills now meet RICH-8 threshold (≥6/8) — baseline was 3-4/8

## Task Commits

1. **Commit: `6dc9fe9e`** — `feat(SE-3): harden 4 pre-gate skills to RICH-8 score ≥6/8`
   - All 13 files: 4 SKILL.md modified, 4 evals/ created, 4 metrics/ created, 1 PLAN.md
   - path fixes, cross-ref documentation, self-correction sections, eval scenarios, scorecards

## Files Created/Modified

**Created:**
- `.opencode/skills/hm-brainstorm/evals/evals.json` — 3 eval scenarios for intent→requirements workflow
- `.opencode/skills/hm-brainstorm/metrics/rich-gate-scorecard.md` — D1-D8: 106/120, RICH gates: all PASS
- `.opencode/skills/hm-requirements-analysis/evals/evals.json` — 3 eval scenarios for gap analysis
- `.opencode/skills/hm-requirements-analysis/metrics/rich-gate-scorecard.md` — D1-D8: 109/120, RICH gates: all PASS
- `.opencode/skills/hm-cross-cutting-change/evals/evals.json` — 3 eval scenarios for cross-pan governance
- `.opencode/skills/hm-cross-cutting-change/metrics/rich-gate-scorecard.md` — D1-D8: 114/120, RICH gates: all PASS
- `.opencode/skills/hm-tech-context-compliance/evals/evals.json` — 3 eval scenarios for stack validation
- `.opencode/skills/hm-tech-context-compliance/metrics/rich-gate-scorecard.md` — D1-D8: 106/120, RICH gates: all PASS
- `.planning/workstreams/skill-ecosystem/phases/SE-3-pre-gate-skills/SE-3-PLAN.md` — Execution plan

**Modified:**
- `.opencode/skills/hm-brainstorm/SKILL.md` — Path de-hardcoded, self-correction section added (4 modes)
- `.opencode/skills/hm-requirements-analysis/SKILL.md` — Cross-ref gap documented, self-correction section added (4 modes)
- `.opencode/skills/hm-cross-cutting-change/SKILL.md` — Self-correction section added (4 modes)
- `.opencode/skills/hm-tech-context-compliance/SKILL.md` — Paths de-hardcoded with adapter notes, self-correction section added (4 modes)

## Decisions Made

- **RICH-8 threshold ≥6/8**: All 4 skills surpassed this threshold. hm-cross-cutting-change is the strongest at 114/120 D1-D8.
- **hm-gate-orchestrator gap**: Documented as [Future: SE-5] rather than removing the reference — the reference is correct, just not yet built. This is proper gap documentation (RICH-7).
- **Framework adapter pattern**: Paths use `<project-root>/` with multi-framework notes (HiveMind → `.hivemind/`, GSD → `.planning/`, generic → relative path). This satisfies RICH-6 independence audit.
- **4-mode self-correction pattern**: Each skill got 4 failure modes with clear detection signals and recovery steps. This is the minimal viable self-correction depth.

## Deviations from Plan

None — plan executed exactly as written. All 6 tasks completed in order: T4 → T5 → T6 → T1 → T2 → T3.

## Gatekeep Verification

### Output Gate: PASS ✅
All 4 skills modified with RICH improvements:
- evals/ directories created with ≥3 scenarios each
- metrics/rich-gate-scorecard.md created with complete scoring
- Self-correction sections added (4 failure modes each)
- Hardcoded paths de-hardcoded
- Cross-ref gap documented

### Quality Gate: PASS ✅
All 4 skills score ≥6/8 on RICH-8:
- hm-brainstorm: 8/8 ✅
- hm-requirements-analysis: 8/8 ✅
- hm-cross-cutting-change: 8/8 ✅
- hm-tech-context-compliance: 8/8 ✅

### Scope Gate: PASS ✅
Only the 4 SE-3 pre-gate skills modified. No scope creep to SE-3.5 (hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability) or SE-3.6 (hm-product-validation).

## Known Stubs

None — all RICH-8 dimensions have concrete evidence. The only forward reference is hm-gate-orchestrator (SE-5) which is properly documented as a gap.

## Next Phase Readiness

- SE-3 complete. Ready for SE-3.5 (Feature skill hardening: hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability)
- SE-3.6 (hm-product-validation hardening) depends on SE-3
- SE-4 (Research pipeline hardening) can run in parallel with SE-3.5
- Pattern established: RICH-8 hardening = evals/ + metrics/ + self-correction + path cleanup

---
*Phase: SE-3-pre-gate-skills*
*Completed: 2026-04-29*
