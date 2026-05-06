---
phase: SE-3.6
plan: SE-3.6
subsystem: skill-ecosystem
tags: [RICH-8, skill-hardening, self-correction, evals, metrics, hm-product-validation]
key_decisions:
  - D-SE-3.6-01: Self-Correction covers 4 domain-specific failure modes (anti-solution, RICE miscalibration, stakeholder misalignment, metric-vs-value)
  - D-SE-3.6-02: RICH-8 scored 8/8 with D1-D8 at 106/120 (A-grade)
metrics:
  duration: 1 session
  tasks_completed: 8
  files_modified: 2
  files_created: 4
---

# Phase SE-3.6: Product Validation Hardening Summary

**One-liner:** Hardened hm-product-validation with Self-Correction (4 failure modes), metrics scorecard (8/8 RICH-8), eval scenarios (3), and verified no hardcoded paths — all disk-only artifacts per spec.

## What Was Done

Hardened the existing `hm-product-validation` skill following the established SE-3 pattern: Self-Correction section with 4 failure modes, metrics/RICH-8 scorecard, eval scenarios in `evals/evals.json`, and hardcoded path audit.

### Changes Made

| Change | File | Details |
|--------|------|---------|
| Added Self-Correction section | `SKILL.md` | 4 failure modes: anti-solution-check, RICE miscalibration, stakeholder misalignment, metric-vs-value confusion |
| Created RICH-8 scorecard | `metrics/rich-gate-scorecard.md` | 8/8 RICH gates PASS, D1-D8 score 106/120 (A-grade) |
| Created evals | `evals/evals.json` | 3 eval scenarios covering anti-solution-check, RICE scoring, and anecdotal-evidence rejection |
| Hardcoded path audit | N/A | No hardcoded paths found — skill already uses relative paths |
| Updated workstream state | `STATE.md` | SE-3.6 → COMPLETE, phases 7/17 |

## Self-Correction Failure Modes

1. **Anti-solution-check failure** — Building the wrong feature well: Phase 1 skipped, problem never validated. Recovery: halt scoring, return to Phase 1.1.
2. **RICE miscalibration** — Scores clustered, confidence inflated, effort estimates unexamined. Recovery: force rank, demand evidence for confidence ≥ 0.8, break effort into sub-tasks.
3. **Stakeholder misalignment** — Assumed needs without validation, generic language in briefs. Recovery: flag as DRAFT, require stakeholder confirmation before implementation.
4. **Metric-vs-value confusion** — Measuring what's easy (clicks, page views) not what matters (outcomes, task completion). Recovery: ask "would a user notice and care?", replace with outcome metrics, always pair counter-metric.

## RICH-8 Score

| Gate | Score | Evidence |
|------|-------|----------|
| RICH-1 | PASS | 3 third-party sources synthesized with adopt/adapt/transform |
| RICH-2 | PASS | Pattern alternatives compared, rejected full-PM-workflow |
| RICH-3 | PASS | Cross-refs to 6+ sibling skills with boundary rules |
| RICH-4 | PASS | Routing table (7 routes) + decision tree + boundary rules |
| RICH-5 | PASS | 4 domain-specific references |
| RICH-6 | PASS | No hardcoded paths; relative paths throughout |
| RICH-7 | PASS | Router table documents all destinations; missing skill documented |
| RICH-8 | PASS | Scorecard + evals + self-correction all present |

**RICH-8 Score:** 8/8 ✅
**D1-D8:** 106/120 (88%) — Grade A

## Files

| File | Action | Path |
|------|--------|------|
| SKILL.md | Modified | `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-product-validation/SKILL.md` |
| rich-gate-scorecard.md | Created | `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-product-validation/metrics/rich-gate-scorecard.md` |
| evals.json | Created | `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-product-validation/evals/evals.json` |
| STATE.md | Modified | `.planning/workstreams/skill-ecosystem/STATE.md` |
| SE-3.6-SUMMARY.md | Created | `.planning/workstreams/skill-ecosystem/phases/SE-3.6-product-validation-hardening/SE-3.6-SUMMARY.md` |

## Deviations from Plan

None — plan executed exactly as specified.

## Gatekeep

| Gate | Status | Evidence |
|------|--------|----------|
| Output (1 skill) | ✅ PASS | hm-product-validation hardened — SKILL.md modified, no new skills created |
| Quality (≥6/8 RICH-8) | ✅ PASS | 8/8 RICH-8, D1-D8 score 106/120 (A-grade) |
| Scope (only this skill) | ✅ PASS | Only hm-product-validation touched; no cross-contamination |

## Self-Check

- [x] `SKILL.md` exists at skill directory with Self-Correction section
- [x] `metrics/rich-gate-scorecard.md` exists with 8/8 PASS scores
- [x] `evals/evals.json` exists with 3 eval scenarios
- [x] `STATE.md` updated with SE-3.6 → COMPLETE
- [x] No hardcoded paths in SKILL.md (verified via grep)
- [x] SKILL.md does NOT reference metrics/ or evals/ (disk-only per spec)
