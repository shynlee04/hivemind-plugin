# Session Inspection Export

- ses_id: `ses_2df460d38ffedvAEXOWgI2oCDv`
- prepared_at: `2026-03-24T16:43:28.822Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** `.developing-skills/refactored-skills/` — all skill directories
**Question:** Classify each skill as RICH (has bundled resources) or THIN (SKILL.md only)

### Git Context
- Working tree: `product-detox` worktree
- Commit at investigation time: checked via directory listing (no uncommitted structural changes)

---

### Complete Audit Table

| # | Skill Directory | SKILL.md | references/ | templates/ | tests/ | scripts/ | schemas/ | Classification |
|---|----------------|----------|-------------|------------|--------|----------|----------|---------------|
| 1 | `agent-role-boundary` | ✓ | 1 | 1 | ✗ | ✗ | ✗ | **RICH** |
| 2 | `context-entry-verify` | ✓ | 2 | ✗ | 1 | 1 | ✗ | **RICH** |
| 3 | `context-intelligence-entry` | ✓ | 7 | ✗ | 1 | 1 | 1 | **RICH** |
| 4 | `course-correction-delegation` | ✓ | 4 | 3 | 1 | ✗ | ✗ | **RICH** |
| 5 | `git-continuity-memory` | ✓ | 5 | 3 | 1 | ✗ | ✗ | **RICH** |
| 6 | `git-memory-enforce` | ✓ | 7 | 3 | 1 | ✗ | ✗ | **RICH** |
| 7 | `hierarchy-retrace` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 8 | `hivemind-atomic-commit` | ✓ | 5 | 4 | 1 | 3 | ✗ | **RICH** |
| 9 | `hivemind-codemap` | ✓ | 6 | 5 | 1 | 1 | ✗ | **RICH** |
| 10 | `hivemind-gatekeeping` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 11 | `hivemind-gatekeeping-delegation` | ✓ | 4 | 2 | 2 | ✗ | ✗ | **RICH** |
| 12 | `hivemind-patterns` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 13 | `hivemind-refactor` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 14 | `hivemind-research-framework` | ✓ | 3 | 2 | ✗ | 1 | ✗ | **RICH** |
| 15 | `hivemind-research-tools` | ✓ | 5 | 1 | ✗ | 1 | ✗ | **RICH** |
| 16 | `hivemind-skill-doctor` | ✓ | 4 | ✗ | ✗ | ✗ | ✗ | **RICH** |
| 17 | `hivemind-skill-write` | ✓ | 4 | ✗ | ✗ | ✗ | ✗ | **RICH** |
| 18 | `hivemind-spec-driven` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 19 | `hivemind-system-debug` | ✓ | 1 | ✗ | 1 | ✗ | ✗ | **RICH** |
| 20 | `plan-breakdown` | ✓ | 4 | 2 | 3 | ✗ | ✗ | **RICH** |
| 21 | `plan-engineering` | ✓ | 1 | 1 | ✗ | ✗ | ✗ | **RICH** |
| 22 | `research-delegation` | ✓ | 3 | 2 | 1 | ✗ | ✗ | **RICH** |
| 23 | `skill-conflict-detect` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 24 | `skill-universal-design` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 25 | `spec-distillation` | ✓ | 1 | 1 | 1 | 1 | ✗ | **RICH** |
| 26 | `tdd-delegation` | ✓ | 3 | 2 | 1 | ✗ | ✗ | **RICH** |
| 27 | `tdd-phase-execution` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 28 | `test-gatekeeping-flow` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 29 | `use-hivemind` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 30 | `use-hivemind-context` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 31 | `use-hivemind-delegation` | ✓ | 5 | 3 | 3 | ✗ | ✗ | **RICH** |
| 32 | `use-hivemind-detox-refactor` | ✓ | 10 | 10 | 1 | ✗ | ✗ | **RICH** |
| 33 | `use-hivemind-git-memory` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 34 | `use-hivemind-planning` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 35 | `use-hivemind-research` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 36 | `use-hivemind-skill-authoring` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 37 | `use-hivemind-skill-writer` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |
| 38 | `use-hivemind-tdd` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | **THIN** |

---

### Top-Level Non-Skill Files

| File | Description |
|------|-------------|
| `AGENTS.md` | Agent governance document (9,289 bytes) |
| `README.md` | Project overview (7,134 bytes) |
| `batch-context-integrity.md` | Batch operation doc (3,702 bytes) |
| `batch-hivemind-context.md` | Batch operation doc (6,125 bytes) |
| `batch-skill-judge.md` | Batch operation doc (4,775 bytes) |
| `batch-skill-review.md` | Batch operation doc (5,139 bytes) |
| `batch-writing-skill.md` | Batch operation doc (4,684 bytes) |
| `use-cases-audit.md` | Use-case audit doc (11,292 bytes) |

---

### Non-Standard Directories (not in standard pattern)

| Skill | Extra Directory | Notes |
|-------|----------------|-------|
| `use-hivemind-delegation` | `_artifacts/` | Legacy/artifact storage |
| `use-hivemind-research` | `_artifacts/` | Legacy/artifact storage |

---

### Summary Statistics

| Metric | Count |
|--------|-------|
| Total skill directories | **38** |
| All have SKILL.md | **38/38 (100%)** |
| RICH (has bundled resources) | **21** |
| THIN (SKILL.md only) | **17** |
| Skills with `references/` | 21 |
| Skills with `templates/` | 16 |
| Skills with `tests/` | 16 |
| Skills with `scripts/` | 8 |
| Skills with `schemas/` | 1 (context-intelligence-entry only) |
| Top-level non-skill files | 8 |
| Non-standard subdirectories | 2 (`_artifacts/`) |

### Gaps

- **schemas/** is near-absent: only `context-intelligence-entry` has a `schemas/` directory. If schemas are intended as a standard resource type, 37 of 38 skills lack them.
- 17 skills are THIN — no bundled resources beyond the SKILL.md. These may be stubs, legacy entries, or skills that were never fleshed out with supporting material.
- `_artifacts/` directories in `use-hivemind-delegation` and `use-hivemind-research` are non-standard and may contain stale/generated content.