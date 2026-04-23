---
phase: 24-fix-22-failed-hm-skills
plan: 02
subsystem: skills
tags: [hm-skills, onboarding-headings, banned-vocabulary, v7-template]

# Dependency graph
requires:
  - phase: 24-01
    provides: ONBOARDING-HEADING-HERE placeholders in 15 skills, structural cleanup
provides:
  - 25 hm-* SKILL.md files with ## Overview onboarding headings (WHAT/WHEN/delivers)
  - 4 hm-* SKILL.md files with clean V.7 descriptions (zero banned vocabulary)
affects: [24-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [onboarding-heading, v7-description-template]

key-files:
  created: []
  modified:
    - .opencode/skills/hm-agent-composition/SKILL.md
    - .opencode/skills/hm-agents-md-sync/SKILL.md
    - .opencode/skills/hm-command-parser/SKILL.md
    - .opencode/skills/hm-completion-looping/SKILL.md
    - .opencode/skills/hm-coordinating-loop/SKILL.md
    - .opencode/skills/hm-debug/SKILL.md
    - .opencode/skills/hm-deep-research/SKILL.md
    - .opencode/skills/hm-detective/SKILL.md
    - .opencode/skills/hm-meta-builder/SKILL.md
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
  - "Replaced ONBOARDING-HEADING-HERE placeholders with ## Overview headings in 15 skills rather than using a different heading format"
  - "Left hm-meta-builder unchanged — already had adequate ## Overview covering WHAT/WHEN/delivers"
  - "Kept file path references containing 'harness' and 'gsd' in hm-opencode-project-audit and hm-agent-composition — renaming would break skill references"

requirements-completed: [FIX-24-02, FIX-24-03]

# Metrics
duration: 9min
completed: 2026-04-23
---

# Phase 24 Plan 02: Onboarding Headings & Banned Vocabulary Removal Summary

**Added ## Overview onboarding headings to all 25 hm-* skills and cleaned banned vocabulary from 4 descriptions following V.7 template**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-23T14:56:35Z
- **Completed:** 2026-04-23T15:05:45Z
- **Tasks:** 2
- **Files modified:** 25 (25 for onboarding headings, 4 overlap for description cleanup)

## Accomplishments
- Replaced 15 ONBOARDING-HEADING-HERE placeholder comments with substantive ## Overview headings
- Inserted new ## Overview headings in 9 skills that had no heading at all
- Verified hm-meta-builder's existing ## Overview was adequate (left unchanged)
- Removed banned vocabulary (GSD, harness) from 4 skill descriptions per V.7 template
- All 25 skills now have onboarding headings within first 20 lines of body content after frontmatter
- Zero banned vocabulary remains in any hm-* description field

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onboarding headings to all 25 skills** - `a5dfea8f` (fix)
2. **Task 2: Remove banned vocabulary from 4 descriptions** - `02822618` (fix)

## Files Created/Modified
- 25 SKILL.md files — onboarding ## Overview headings added
- 4 SKILL.md files — description field cleaned (hm-omo-reference, hm-agent-composition, hm-opencode-platform-reference, hm-opencode-project-audit)
- 4 files received both treatments (heading + description)

## Decisions Made
- Used consistent ## Overview heading format across all 25 skills for uniformity
- Left hm-meta-builder unchanged — already had adequate ## Overview at correct position
- Preserved file path references containing banned words (examples/gsd-performance-auditor.md, harness-audit/) — changing these would break skill functionality

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Git staging required canonical refactoring directory path (.hivefiver-meta-builder/skills-lab/active/refactoring/) instead of symlinked .opencode/skills/ path — consistent with Plan 01 finding

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 25 hm-* SKILL.md files now have clear onboarding headings
- All descriptions follow V.7 template with zero banned vocabulary
- Ready for Plan 03 (remaining cleanup if any)

## Self-Check: PASSED

- [x] Verification 1: All 25 skills have ## Overview (or equivalent) headings
- [x] Verification 2: Zero banned vocabulary in descriptions
- [x] Verification 3: All 25 YAML frontmatter valid
- [x] Commit a5dfea8f exists in git log
- [x] Commit 02822618 exists in git log

---
*Phase: 24-fix-22-failed-hm-skills*
*Completed: 2026-04-23*
