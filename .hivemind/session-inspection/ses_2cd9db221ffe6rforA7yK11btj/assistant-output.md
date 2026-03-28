# Session Inspection Export

- ses_id: `ses_2cd9db221ffe6rforA7yK11btj`
- prepared_at: `2026-03-28T03:25:09.022Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** Cross-reference audit across 15 skills in `.developing-skills/refactored-skills/`
**Question:** Find stale references, broken internal links, terminology inconsistencies, missing cross-references, and organization issues
**Investigation commit:** 28663df
**Date:** 2026-03-28

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | 12 stale skill name references | Multiple files | See stale_references table above | 2 | No broken internal links | all references/ | verified on disk | 0 | 6 terminology inconsistencies across 5 concept clusters | 0 | 8 missing cross-references between related skills | 8 missing cross-references | 7 organization issues (4 skills with 10+ flat refs + 1 numbering gap in skill-authoring |

### Reference File Counts
| Skill | Ref Count |
|---|------|----------|
| hivemind-atomic-commit | 6 |
| hivemind-codemap | 6 |
| hivemind-gatekeeping | 6 |
| hivemind-patterns | 2 |
| hivemind-refactor | 5 |
| hivemind-spec-driven | 3 |
| hivemind-system-debug | 2 |
| use-hivemind | 5 |
| use-hivemind-context | 9 |
| use-hivemind-delegation | 17 |
| use-hivemind-git-memory | 12 |
| use-hivemind-planning | 11 |
| use-hivemind-research | 8 |
| use-hivemind-skill-authoring | 8 |
| use-hivemind-tdd | 10 |

### Stale References ( 12 found)

| ID | Name | Severity | Locations |
|---|------|----------|-----------|
| SR-01 | context-intelligence | HIGH | 6 files in skill-authoring (27+ occurrences) |
| SR-02 | context-intelligence-entry | LOW | 1 file (historical note) |
| SR-03 | context-entry-verify | LOW | 1 file (historical note) |
| SR-04 | use-hivemind-detox-refactor | MEDIUM | 2 files in delegation artifacts |
| SR-05 | spec-distillation | MEDIUM | 2 files in delegation artifacts |
| SR-06 | context-rot-recovery | MEDIUM | 4 files in skill-authoring |
| SR-07 | workflow-hierarchy | MEDIUM | 5 files in skill-authoring |
| SR-08 | delegation-scope | LOW | 4 files (skill-authoring |
| SR-09 | git-continuity-memory | LOW | 1 file ( delegation artifact |
| SR-10 | hivemind-ownership | LOW | 1 file ( atomic-commit |
| SR-11 | hivemind-secret-allow | LOW | 1 file ( atomic-commit |
| SR-12 | hivemind-classify | LOW | 2 files ( atomic-commit |

### Terminology Inconsistencies ( 6 found)
| ID | Concept | Severity | Variants |
|---|------|----------|-----------|
| TI-01 | delegation packet | LOW | 3 terms: "delegation packet", "handoff packet", "dispatch packet" |
| TI-02 | carry-forward | INFO | 2 variants: prose vs code convention ( acceptable) |
| TI-03 | subagent | LOW | 3 terms: "subagent", "child agent", "delegated agent" |
| TI-04 | orchestrator | LOW | 3 terms: "orchestrator", "hiveminder", "front-facing agent" |
| TI-05 | depth skill | MEDIUM | 4 terms: "depth skill", "depth partner", "depth companion", "depth specialist" |
| TI-06 | verification-before-completion | MEDIUM | Identical file duplicated in 7 skills |
### Missing Cross-References ( 8 found)
| ID | From | To | Severity |
|---|------|----------|------|----------|
| MX-01 | hivemind-patterns | hivemind-refactor | MEDIUM | Bidirectional reference missing |
| MX-02 | hivemind-codemap | hivemind-system-debug | LOW | Unidirectional reference missing |
| MX-03 | use-hivemind-research | hivemind-gatekeeping | LOW | Research doesn't reference gatekeeping |
| MX-04 | use-hivemind-tdd | hivemind-atomic-commit | MEDIUM | TDD doesn't reference atomic-commit |
| MX-05 | hivemind-spec-driven | use-hivemind-research | LOW | Spec-driven doesn't reference research |
| MX-06 | hivemind-spec-driven | use-hivemind-tdd | MEDIUM | Spec-driven doesn't reference TDD |
| MX-07 | use-hivemind-tdd | hivemind-gatekeeping | LOW | TDD doesn't reference gatekeeping |
| MX-08 | hivemind-refactor | hivemind-system-debug | LOW | Refactor doesn't reference system-debug |
### Organization Issues ( 7 found)
| ID | Skill | Ref Count | Issue |
|---|------|----------|-----------|------|
| OR-01 | use-hivemind-delegation | 17 | Flat files, no sub-folders |
| OR-02 | use-hivemind-git-memory | 12 | Flat files, no sub-folders |
| OR-03 | use-hivemind-planning | 11 | Flat files, no sub-folders |
| OR-04 | use-hivemind-tdd | 10 | Flat files, no sub-folders |
| OR-05 | use-hivemind-context | 9 | Flat files, no sub-folders |
| OR-06 | use-hivemind-research | 8 | At threshold, no sub-folders |
| OR-07 | use-hivemind-skill-authoring | 8 | Numbered prefix, no 06-* gap |

### Gaps
- No broken internal links found (all referenced files exist on disk)
 - No missing `06-*` reference file in skill-authoring
### Top 3 Priority Actions
1. **SR-01**: Replace `context-intelligence` with `use-hivemind-context` in skill-authoring examples
2. **TI-05**: Standardize on ONE canonical term for "depth skill" concept
3. **TI-06**: Extract duplicated `verification-before-completion.md` to a shared location or link once
### Git Context
 Investigated at commit 28663df