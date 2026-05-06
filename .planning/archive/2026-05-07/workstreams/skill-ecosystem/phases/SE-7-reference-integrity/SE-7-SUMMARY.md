---
phase: SE-7
plan: reference-integrity
subsystem: skill-ecosystem
tags: [audit, cross-references, integrity, dead-refs]
completed: 2026-04-29
---

# Phase SE-7: Reference Integrity Audit Summary

Fixed 4 dead cross-skill references across 51 SKILL.md files; verified 70 unique skill-name references resolve correctly; 0 dead refs remaining; 0 context poisoning violations.

## Audit Results

### Metrics

| Metric | Count |
|--------|-------|
| SKILL.md files scanned | 51 |
| Unique skill-name references found | 70 |
| Live skill references (exist on disk) | 50 |
| Non-skill references (commands, concepts, partial matches) | 20 |
| Dead references found | 4 |
| Dead references fixed | 4 |
| Dead references remaining | 0 |
| Context poisoning violations | 0 |
| Hardcoded absolute path violations | 0 |
| hm-gate-orchestrator resolution points | 18 (all resolved) |

### Dead References Fixed

| # | Dead Ref | Location | Root Cause | Fix Applied |
|---|----------|----------|------------|-------------|
| 1 | `hm-meta-builder` | hm-planning-persistence/SKILL.md:41 | Wrong prefix (`hm-` instead of `hf-`) | Changed to `hf-meta-builder` |
| 2 | `hm-meta-builder` | hm-planning-persistence/SKILL.md:264 | Wrong prefix (`hm-` instead of `hf-`) | Changed to `hf-meta-builder` |
| 3 | `hm-code-review` | hm-planning-persistence/SKILL.md:274 | Non-existent skill; code review is `gsd-code-review` agent | Replaced with `gsd-code-review` + accurate description |
| 4 | `hm-uat-verify` | hm-planning-persistence/SKILL.md:275 | Non-existent skill; marked as "SE-5 skill" but SE-5 created hm-gate-orchestrator | Replaced with `hm-gate-orchestrator` + accurate description |

### Non-Skill References (Verified Clean)

These references were flagged by the regex but are not actual dead skill references:

| Category | Count | Examples |
|----------|-------|---------|
| Gate internal concepts | 9 | gate-type, gate-scorecard, gate-report, gate-enforce, gate-eval, gate-flow |
| Command names (not skills) | 4 | hf-absorb, hf-audit, hf-create, hf-stack |
| Partial string matches | 4 | hm-deep- (truncated ASCII art), hm-tech-, stack-ingest, stack-name |
| Disabled/archived (documented replacement) | 1 | hm-planning-with-files → hm-planning-persistence |
| Future deliverable (marked in NOT Coupled) | 1 | hm-plan-generator |
| Adjective usage | 1 | hm-specific |

### Context Poisoning Check

- **"See metrics/" or "See evals/" in SKILL.md body**: 0 violations
- Only `gate-*` skills reference metrics/evals directories (as designed)
- `hf-skill-synthesis` references "see run-trigger-evals.sh spec" — this references a script that EXISTS on disk at `scripts/run-trigger-evals.sh`. Not a violation.
- `hf-custom-tools-dev` contains `/Users/apple/...` — appears in an anti-pattern example table describing what NOT to do. Intentional.

### Hardcoded Paths Check

- 1 instance found: `hf-custom-tools-dev/SKILL.md:121` — used in anti-pattern detection column, not an actual hardcoded path in operational code. Intentional.

### hm-gate-orchestrator Resolution

- 18 reference points across 7 SKILL.md files
- All resolve correctly to `hm-gate-orchestrator/` on disk
- Created in SE-5, confirmed functional

## Files Modified

| File | Change |
|------|--------|
| `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md` | 4 dead refs fixed: hm-meta-builder→hf-meta-builder (×2), hm-code-review→gsd-code-review, hm-uat-verify→hm-gate-orchestrator |

## Decisions

1. **hm-plan-generator**: Kept as "future deliverable" in NOT Coupled section rather than removing. It may be created in SE-10+.
2. **hm-planning-with-files**: Kept references — they document the replacement relationship, which is valuable context.
3. **Command references** (hf-absorb, hf-audit, hf-create, hf-stack): Not dead refs — they reference commands, not skills.

## Gate Results

| Gate | Result | Evidence |
|------|--------|----------|
| Output | PASS | Audit report generated with full counts |
| Quality | PASS | 0 dead refs, 0 context poisoning violations |
| Scope | PASS | Reference audit only — no functional code changes |
