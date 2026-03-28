# Master Plan: 15-Skill Ecosystem Improvement

**Date:** 2026-03-28
**Branch:** v2.9.5-detox-dev
**Skills root:** `.developing-skills/refactored-skills/`
**Methodology:** investigate (DONE) → audit (DONE) → plan (THIS) → validate → action → implement sequentially

---

## Audit Summary (Waves 1 + 2 Complete)

| Wave | Scope | Status | Output |
|------|-------|--------|--------|
| Wave 1a | 5 use-hivemind* skills | ✅ Complete | `.hivemind/activity/codescan/wave-1a/` |
| Wave 1b | 5 hivemind-* skills | ✅ Complete | `.hivemind/activity/codescan/wave-1b/` |
| Wave 1c | 5 remaining + guidelines | ✅ Complete | `.hivemind/activity/codescan/wave-1c/` |
| Wave 2 | Cross-skill conflicts | ✅ Complete | `.hivemind/activity/codescan/wave-2/` |

**Aggregate: 106 passes, 32 failures, 1 critical, 5 high, 23 medium, 7 low**

---

## Fix Batches (Sequential Execution)

### Batch 1 — Critical Fixes (3 skills)

| # | Skill | Issue | Severity | Fix |
|---|-------|-------|----------|-----|
| 1.1 | `use-hivemind-git-memory` | Self-referential routing (3/4 ops → itself) | CRITICAL | Rewrite routing table to dispatch to actual operations inline (monolithic approach — no sub-specialists exist). Add proper Load Position. Add Bundled Resources table listing 14 refs + 6 templates. |
| 1.2 | `use-hivemind-delegation` | 476 lines + 4 duplicate sections + threshold inconsistency | HIGH | Remove 2nd copy of: Granularity Gate, Parallel Dispatch Safety, Hierarchical Packet Construction, Context Window Management. Fix threshold: canonical is >50%. Update Bundled Resources table to list all files. Target: <450 lines. |
| 1.3 | `use-hivemind-skill-authoring` | Self-references 5 times in consolidates field | HIGH | Remove nonsensical `consolidates` field or list actual consolidated skills. Fix Deprecation Notice. Add Bundled Resources table (8 refs). |

### Batch 2 — Systemic Fixes (2 skills, parallel-safe)

| # | Scope | Issue | Fix |
|---|-------|-------|-----|
| 2.1 | 13 skills | Missing `parent` field in frontmatter | Add `parent: use-hivemind` or appropriate parent to: hivemind-atomic-commit, hivemind-codemap, hivemind-gatekeeping, hivemind-patterns, hivemind-refactor, hivemind-spec-driven, hivemind-system-debug, use-hivemind-delegation, use-hivemind-git-memory, use-hivemind-research, use-hivemind-skill-authoring, use-hivemind-tdd, use-hivemind-planning |
| 2.2 | 12 skills | Missing/incomplete Bundled Resources tables | Add complete tables listing ALL files in references/, templates/, scripts/, tests/, schemas/ directories |

### Batch 3 — Alignment Fixes (4 tasks)

| # | Scope | Issue | Fix |
|---|-------|-------|-----|
| 3.1 | hivemind-refactor + hivemind-patterns | Terminology mismatch | Canonical terms: **God Function** (>50 lines), **God Component** (>300 lines or >10 fields), **Tight Coupling**. Update hivemind-refactor to use canonical terms. Update code-smell-taxonomy.md thresholds to match. |
| 3.2 | 3 skills | Invalid cross-references | Fix: hivemind-atomic-commit `git-advanced-workflows` → remove or replace. hivemind-refactor `clean-code` → `hivemind-patterns`. hivemind-spec-driven `review-and-refactor` → `hivemind-refactor`. |
| 3.3 | hivemind-system-debug | No Load Position section | Add explicit Load Position: Slot 3, requires use-hivemind in Slot 1. |
| 3.4 | use-hivemind-research | No Load Position + 5 missing resources | Add Load Position: Slot 2, requires use-hivemind. Update Bundled Resources table with templates/ and scripts/. |

### Batch 4 — Finalization (2 tasks)

| # | Task | Description |
|---|------|-------------|
| 4.1 | Create `hiveminder-operation-guidelines.md` as proper SKILL.md | Convert orphaned .md to SKILL.md with frontmatter, load position, content from current file + cross-skill operational patterns. Document how all 15 skills work together. |
| 4.2 | Verification pass | Re-run 9-phase checklist on ALL 15 skills. Confirm: 0 critical, 0 high, all Bundled Resources complete, all cross-references valid, terminology aligned. |

---

## Execution Constraints

1. **Sequential within batch.** No parallel writes to the same skill.
2. **Batches are sequential.** Batch 1 → Gate → Batch 2 → Gate → Batch 3 → Gate → Batch 4.
3. **Each fix agent returns evidence:** modified file paths, `wc -l` output, grep verification.
4. **No how-to-implement in packets.** Each agent gets process guidance, not code.
5. **Verification agent checks ALL skills after ALL fixes complete.**

## Success Criteria

- [ ] 0 critical issues
- [ ] 0 high issues
- [ ] All 15 skills have `parent` field
- [ ] All 15 skills have complete Bundled Resources tables
- [ ] All cross-references valid (no non-existent sibling skills)
- [ ] Terminology aligned: God Function, God Component, Tight Coupling
- [ ] use-hivemind-git-memory functional as router
- [ ] use-hivemind-delegation <450 lines, no duplicates
- [ ] hiveminder-operation-guidelines.md is a proper SKILL.md
- [ ] 9-phase checklist passes on all 15 skills
