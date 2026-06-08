# audit-05 Skill Quality Redesign — User Decisions

**Date:** 2026-06-08
**Source:** User Q&A on delivery plan §7

## Locked Decisions

| # | Decision | Rationale | Action |
|---|----------|-----------|--------|
| D1 | `marketing-market-research` → ARCHIVE (no replacement) | Vietnamese-only, F-grade, dead weight | Move to `assets/.archive/dev-tooling/skills/` |
| D2 | `user-intent-patterns` → ARCHIVE (router is `hm-coord-router`) | Overlaps with Pattern 2 Navigation skill | Move to archive |
| D3 | `subagent-delegation-patterns` → ARCHIVE (covered by `hm-coord-loop`) | Mostly redundant with Pattern 3 skill | Move to archive |
| D4 | `quality-gate-orchestration` → EVALUATE inlining | If the L1-L5 evidence hierarchy isn't integrated anywhere, the skill fails the integration test. Fold into another skill (likely `hm-gate-triad`) or archive | Decide during Phase 4 |
| D5 | `hm-test-driven` → ADD `## GSD Compatibility` section | It replaced `gsd-test-driven`; document the migration per the gsd-* hybrid rule | Add 1 section in Commit 7 |
| D6 | 22-category prefix taxonomy → APPLY RETROACTIVELY to all 35 skills | User directive: align names with 22-category taxonomy | Rename all 35 skill directories in Commit 0 (preliminary) |
| D7 | Commit planning artifacts NOW | L5 docs are safe to commit; mark as atomic `docs(audit-05)` | Atomic commit before rewrites |

## Net Effect

- **3 skills archived** (D1, D2, D3) → 32 shipped skills
- **1 skill under review** (D4) → 31-32 shipped after D4 decision
- **35 skills get retroactively renamed** (D6) per 22-category taxonomy
- **hm-test-driven gets GSD-Compat section** (D5)

## Active Skill Count After Audit
- Before: 35 shipped + 50 archived = 85 total
- After: 32-33 shipped + 53-54 archived = 85 total
