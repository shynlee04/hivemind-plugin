---
phase: SE-3.5
plan: SE-3.5
subsystem: skill-ecosystem
tags: [skill-hardening, rich-gate, feature-skills, hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability]
requires: [SE-2]
provides: [SE-3.6, SE-4]
affects: [hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability]
tech-stack:
  added: []
  patterns: [RICH-8 hardening, progressive disclosure, self-correction, evals]
key-files:
  created:
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/metrics/rich-gate-scorecard.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/evals/evals.json
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-production-readiness/metrics/rich-gate-scorecard.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-production-readiness/evals/evals.json
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/metrics/rich-gate-scorecard.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/evals/evals.json
  modified:
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/SKILL.md
    - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/SKILL.md
    - .planning/workstreams/skill-ecosystem/STATE.md
decisions:
  - D-SE-3.5-01: hm-product-production-readiness Self-Correction already existed (4 modes) — no SKILL.md edit needed
  - D-SE-3.5-02: All 3 skills scored 8/8 RICH-8 (A-grade for D1-D8)
metrics:
  duration: "~15 min"
  completed_date: "2026-04-29"
---

# Phase SE-3.5 Summary: Feature Skill Hardening

**One-liner:** Hardened 3 feature ecosystem skills (hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability) to RICH-8 ≥8/8 with Self-Correction sections, eval scenarios, and metrics scorecards.

## What Was Done

Hardened 3 existing skills following the SE-3 pattern: RICH-8 scoring, Self-Correction sections (4 failure modes each), eval scenarios (3 each in evals.json), metrics scorecards (rich-gate-scorecard.md), and hardcoded path fixes.

### Skill 1: hm-feature-ecosystem (Feature Interdependence Design)
- **Added:** Self-Correction section (4 failure modes: unbreakable cycles, missing requirements, oversized ecosystem, rejected wave plans)
- **Fixed:** 4 hardcoded `.planning/` paths → `<project-root>/.planning/`
- **Created:** metrics/rich-gate-scorecard.md (107/120, Grade A)
- **Created:** evals/evals.json (6 scenarios: 3 positive, 2 negative, 1 boundary + stacked scenario)
- **RICH-8 Score:** 8/8 ✅

### Skill 2: hm-production-readiness (Pre-Deployment Verification)
- **Self-Correction:** Already existed (4 modes: target unclear, insufficient evidence, impractical rollback, adapter switching) — no edit needed
- **Hardcoded paths:** None found requiring fix (example paths in templates, not prescriptive)
- **Created:** metrics/rich-gate-scorecard.md (109/120, Grade A)
- **Created:** evals/evals.json (6 scenarios: 3 positive, 2 negative, 1 boundary + stacked scenario)
- **RICH-8 Score:** 8/8 ✅

### Skill 3: hm-roadmap-maintainability (Long-Term Roadmap Evolution)
- **Added:** Self-Correction section (4 failure modes: inconsistent scores, empty debt register, stale artifacts, optimistic estimates)
- **Fixed:** 2 hardcoded `.planning/` paths → `<project-root>/.planning/`
- **Created:** metrics/rich-gate-scorecard.md (107/120, Grade A)
- **Created:** evals/evals.json (6 scenarios: 3 positive, 2 negative, 1 boundary + stacked scenario)
- **RICH-8 Score:** 8/8 ✅

## RICH-8 Score Summary

| Skill | D1-D8 | Grade | RICH-8 Gates | Status |
|-------|-------|-------|-------------|--------|
| hm-feature-ecosystem | 107/120 (89%) | A | 8/8 | ✅ PASS |
| hm-production-readiness | 109/120 (91%) | A | 8/8 | ✅ PASS |
| hm-roadmap-maintainability | 107/120 (89%) | A | 8/8 | ✅ PASS |

All 3 skills achieved 8/8 RICH-8 gates (target was ≥6/8). D1-D8 scores all A-grade (≥107/120).

## Deviations from Plan

None — plan executed exactly as written.

## File Inventory

### Created (12 files)
```
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/metrics/rich-gate-scorecard.md
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/metrics/.gitkeep
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/evals/evals.json
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/evals/.gitkeep
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-production-readiness/metrics/rich-gate-scorecard.md
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-production-readiness/metrics/.gitkeep
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-production-readiness/evals/evals.json
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-production-readiness/evals/.gitkeep
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/metrics/rich-gate-scorecard.md
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/metrics/.gitkeep
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/evals/evals.json
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/evals/.gitkeep
```

### Modified (3 files)
```
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-feature-ecosystem/SKILL.md
.hivefiver-meta-builder/skills-lab/active/refactoring/hm-roadmap-maintainability/SKILL.md
.planning/workstreams/skill-ecosystem/STATE.md
```

## Gatekeep Verification

- [x] **Output:** 3 skills hardened with metrics, evals, and self-correction
- [x] **Quality:** All ≥6/8 RICH-8 (actual: all 8/8)
- [x] **Scope:** Only these 3 skills

## Artifacts Produced
- `.planning/workstreams/skill-ecosystem/phases/SE-3.5-feature-skill-hardening/SE-3.5-SUMMARY.md` (this file)
