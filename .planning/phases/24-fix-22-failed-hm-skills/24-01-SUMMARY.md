---
phase: 24-fix-22-failed-hm-skills
plan: 01
subsystem: skills
tags: [hm-skills, 6-non-removal, iron-law-reorder, structural-cleanup]

# Dependency graph
requires:
  - phase: 22
    provides: Skills with 6-NON Defence Tables injected (to be removed)
provides:
  - 18 hm-* SKILL.md files with 6-NON Defence Tables completely removed
  - 15 hm-* SKILL.md files with Iron Law/HARD GATES repositioned after onboarding placeholder
  - ONBOARDING-HEADING-HERE placeholder comments for Plan 02 to fill
affects: [24-02, 24-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [onboarding-placeholder-comment]

key-files:
  created: []
  modified:
    - .opencode/skills/hm-agent-composition/SKILL.md
    - .opencode/skills/hm-agents-md-sync/SKILL.md
    - .opencode/skills/hm-completion-looping/SKILL.md
    - .opencode/skills/hm-coordinating-loop/SKILL.md
    - .opencode/skills/hm-debug/SKILL.md
    - .opencode/skills/hm-deep-research/SKILL.md
    - .opencode/skills/hm-detective/SKILL.md
    - .opencode/skills/hm-omo-reference/SKILL.md
    - .opencode/skills/hm-opencode-non-interactive-shell/SKILL.md
    - .opencode/skills/hm-opencode-platform-reference/SKILL.md
    - .opencode/skills/hm-opencode-project-audit/SKILL.md
    - .opencode/skills/hm-opencode-project-inspection/SKILL.md
    - .opencode/skills/hm-phase-execution/SKILL.md
    - .opencode/skills/hm-phase-loop/SKILL.md
    - .opencode/skills/hm-planning-with-files/SKILL.md
    - .opencode/skills/hm-refactor/SKILL.md
    - .opencode/skills/hm-research-chain/SKILL.md
    - .opencode/skills/hm-skill-synthesis/SKILL.md
    - .opencode/skills/hm-spec-driven-authoring/SKILL.md
    - .opencode/skills/hm-subagent-delegation-patterns/SKILL.md
    - .opencode/skills/hm-synthesis/SKILL.md
    - .opencode/skills/hm-test-driven-execution/SKILL.md
    - .opencode/skills/hm-user-intent-interactive-loop/SKILL.md

key-decisions:
  - "Used Python script for 6-NON removal: regex-based section extraction was cleaner than sed for multi-line markdown tables"
  - "Used ONBOARDING-HEADING-HERE placeholder comment instead of creating actual headings — Plan 02 will insert proper onboarding headings"
  - "hm-meta-builder left unchanged for Iron Law reordering — it already had Overview heading before Iron Law at correct position"

patterns-established:
  - "ONBOARDING-HEADING-HERE: HTML comment placeholder for onboarding heading insertion by subsequent plans"

requirements-completed: [FIX-24-01, FIX-24-05]

# Metrics
duration: 8min
completed: 2026-04-23
---

# Phase 24 Plan 01: Remove 6-NON Defence Tables & Reorder Iron Law Summary

**Removed 6-NON Defence Tables from 18 hm-* skills and repositioned Iron Law/HARD GATES sections after onboarding heading placeholders in 16 skills**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-23T14:41:59Z
- **Completed:** 2026-04-23T14:50:36Z
- **Tasks:** 2
- **Files modified:** 23 (18 for 6-NON removal, 15 for Iron Law reorder; 10 overlap)

## Accomplishments
- Completely removed all 6-NON Defence Table sections (NON-1 through NON-6) from 18 hm-* SKILL.md files — zero grep matches remain
- Repositioned Iron Law/HARD GATES sections in 15 skills to appear after ONBOARDING-HEADING-HERE placeholder comments
- Verified all 25 hm-* files maintain valid YAML frontmatter and correct file count
- All Iron Law content preserved — only position changed, no content modified

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove 6-NON Defence Tables from 18 skills** - `28e83a02` (fix)
2. **Task 2: Reorganize Iron Law/HARD GATES sections** - `096ec179` (fix)

## Files Created/Modified
- 18 SKILL.md files — 6-NON Defence Table sections removed (231 lines deleted)
- 15 SKILL.md files — Iron Law/HARD GATES sections repositioned with ONBOARDING-HEADING-HERE placeholder
- 10 files received both treatments (6-NON removal + Iron Law reorder)

## Decisions Made
- Used Python regex script for 6-NON removal — markdown table extraction across line boundaries was cleaner than sed/awk
- Inserted `<!-- ONBOARDING-HEADING-HERE -->` HTML comment as placeholder rather than creating actual headings — Plan 02 will insert proper onboarding content
- hm-meta-builder was already correctly structured (Overview at line 24, Iron Law at line 91) — left unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Git staging initially failed because `.opencode/skills/hm-*/` files are hardlinks to `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-*/` — resolved by staging via the canonical refactoring directory path

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 24 hm-* SKILL.md files are structurally clean — no 6-NON tables, Iron Law/HARD GATES after onboarding position
- Ready for Plan 02 (onboarding heading insertion) — ONBOARDING-HEADING-HERE placeholders mark insertion points
- Ready for Plan 03 (banned vocab, self-correction blocks)

## Self-Check: PASSED

- [x] Verification 1: Zero grep matches for 6-NON/NON-[1-6]/Defence Table
- [x] Verification 2: Iron Law/HARD GATES exist in all 16 files (content preserved)
- [x] Verification 3: All 25 files have valid YAML frontmatter
- [x] Verification 4: Total file count unchanged at 25
- [x] Commit 28e83a02 exists in git log
- [x] Commit 096ec179 exists in git log

---
*Phase: 24-fix-22-failed-hm-skills*
*Completed: 2026-04-23*
