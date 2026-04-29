---
phase: SE-8
plan: SE-8
type: auto
autonomous: true
wave: 1
depends_on:
  - SE-2
requirements:
  - SE-8-ALL-25
created: 2026-04-29
---

# SE-8: Orphan Skill Hardening — Execution Plan

## Objective
Harden all 25 orphan skills to RICH-8 score ≥6/8. These skills exist on disk but have never had a dedicated RICH audit or metrics scorecard.

## Context
- **Phase SE-2** completed: planning-persistence backbone, 20+ reference fixes, disabled skill archived
- **Phase SE-3** completed: 4 pre-gate skills hardened to ≥6/8 with established pattern
- **25 orphan skills** = 15 hm-* + 10 hf-* (+ 1 unprefixed `opencode-config-workflow`)
- **6 stack-*** reference skills evaluated against applicable RICH-8 criteria only

## RICH-8 Hardening Pattern (from SE-3)

For each skill:
1. **metrics/rich-gate-scorecard.md** — D1-D8 scoring table + RICH gate evidence (8 dimensions)
2. **Self-Correction section** — 4 failure modes with detection + recovery per mode
3. **evals/evals.json** — 3 realistic evaluation scenarios
4. **Cross-reference audit** — verify all @file references resolve to existing files
5. **Trigger phrase audit** — ensure ≥3 distinct trigger phrases in description
6. **Path de-hardcoding** — framework-agnostic `<project-root>/` paths with adapter notes
7. **Progressive disclosure** — cross-refs section with related skills
8. **RICH score** — target ≥6/8 for hm-* and hf-*, documented exceptions for stack-*

## Task Batches

### Batch 1: MINOR Skills — Add Metrics + Self-Correction (10 skills)
Skills that already have evals and self-correction sections, just need metrics scorecards.
Estimated effort: 5-10 min per skill.

| # | Skill | Has Evals | Has Self-Corr | Gap |
|---|-------|-----------|---------------|-----|
| 1 | hm-completion-looping | YES | YES | metrics scorecard |
| 2 | hm-coordinating-loop | YES | YES | metrics scorecard |
| 3 | hm-phase-execution | YES | YES | metrics scorecard |
| 4 | hm-phase-loop | YES | YES | metrics scorecard, more refs |
| 5 | hm-spec-driven-authoring | YES | YES | metrics scorecard |
| 6 | hm-test-driven-execution | YES | YES | metrics scorecard |
| 7 | hm-user-intent-interactive-loop | YES | YES | metrics scorecard |
| 8 | hf-delegation-gates | YES | NO | metrics + self-correction |
| 9 | hf-skill-synthesis | YES | NO | metrics + self-correction |
| 10 | hf-use-authoring-skills | YES | NO | metrics + self-correction |

### Batch 2: MINOR Skills — Add Self-Correction + Metrics (7 skills)
Skills that have evals but need both metrics AND self-correction sections.
Estimated effort: 10-15 min per skill.

| # | Skill | Has Evals | Has Self-Corr | Gap |
|---|-------|-----------|---------------|-----|
| 11 | hm-debug | YES | NO | metrics + self-correction |
| 12 | hm-opencode-non-interactive-shell | YES | NO | metrics + self-correction |
| 13 | hm-opencode-platform-reference | YES | NO | metrics + self-correction |
| 14 | hm-refactor | YES | NO | metrics + self-correction |
| 15 | hf-agent-composition | YES | NO | metrics + self-correction |
| 16 | hf-agents-md-sync | YES | NO | metrics + self-correction |
| 17 | hf-command-parser | YES | NO | metrics + self-correction |

### Batch 3: MAJOR Skills — Full RICH-8 Package (8 skills)
Skills missing evals, metrics, AND self-correction — need complete hardening.
Estimated effort: 15-25 min per skill.

| # | Skill | Has Evals | Has Self-Corr | Gap |
|---|-------|-----------|---------------|-----|
| 18 | hm-omo-reference | NO | NO | evals + metrics + self-correction (thin: 76 LOC) |
| 19 | hm-opencode-project-audit | NO | NO | evals + metrics + self-correction |
| 20 | hm-subagent-delegation-patterns | NO | NO | evals + metrics + self-correction |
| 21 | hm-planning-persistence | NO | NO | evals + metrics + self-correction (SE-2 verify) |
| 22 | hf-agents-and-subagents-dev | NO | NO | evals + metrics + self-correction |
| 23 | hf-command-dev | NO | NO | evals + metrics + self-correction (thin: 81 LOC) |
| 24 | hf-context-absorb | NO | NO | evals + metrics + self-correction |
| 25 | hf-custom-tools-dev | NO | NO | evals + metrics + self-correction |

### Batch S: Stack Reference Skills — Documented RICH Exceptions (6 skills)
Stack skills are reference documents (not workflow skills). Evaluate against APPLICABLE RICH-8 criteria only.
| # | Skill | Action |
|---|-------|--------|
| S1 | stack-bun-pty | Applicable RICH-8 scoring + documented exceptions |
| S2 | stack-json-render | Applicable RICH-8 scoring + documented exceptions |
| S3 | stack-nextjs | Applicable RICH-8 scoring + documented exceptions |
| S4 | stack-opencode | Applicable RICH-8 scoring + documented exceptions |
| S5 | stack-vitest | Applicable RICH-8 scoring + documented exceptions |
| S6 | stack-zod | Applicable RICH-8 scoring + documented exceptions |

## Verification Criteria

- [ ] All 15 hm-* skills have metrics/rich-gate-scorecard.md with D1-D8 scoring
- [ ] All 10 hf-* skills have metrics/rich-gate-scorecard.md with D1-D8 scoring
- [ ] All 25 skills have self-correction sections (4 failure modes each)
- [ ] All 25 skills have evals/ with ≥3 scenarios
- [ ] All 25 skills score ≥6/8 on RICH-8 (hm-* and hf-*)
- [ ] 6 stack-* skills documented with applicable RICH-8 scores + exception rationale
- [ ] Zero broken cross-references across all 25 skills
- [ ] Zero remaining references to `donotusethis-hm-planning-with-files`
- [ ] `hm-planning-persistence` verified against SE-2 deliverables (already partially done)
- [ ] Paths use framework-agnostic patterns (`<project-root>/`, adapter notes)

## Success Criteria

- All hm-* skills: RICH-8 ≥6/8
- All hf-* skills: RICH-8 ≥6/8
- Stack-* skills: documented applicable RICH-8 score with exception rationale
- No skill left without full hardening package (metrics + evals + self-correction)
- Cross-references clean across all 25 skills
