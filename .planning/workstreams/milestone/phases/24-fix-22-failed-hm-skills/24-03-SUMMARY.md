---
phase: 24-fix-22-failed-hm-skills
plan: 03
subsystem: skills
tags: [hm-skills, self-correction, coordinator-skills, failure-recovery]

# Dependency graph
requires:
  - phase: 24-01
    provides: Structurally clean skills with 6-NON removed and Iron Law repositioned
  - phase: 24-02
    provides: Onboarding headings and clean descriptions in all 25 skills
provides:
  - 5 coordinator skills with domain-specific Self-Correction blocks for failure recovery
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [self-correction-block, failure-recovery-guidance]

key-files:
  created: []
  modified:
    - .opencode/skills/hm-coordinating-loop/SKILL.md
    - .opencode/skills/hm-phase-loop/SKILL.md
    - .opencode/skills/hm-phase-execution/SKILL.md
    - .opencode/skills/hm-completion-looping/SKILL.md
    - .opencode/skills/hm-user-intent-interactive-loop/SKILL.md

key-decisions:
  - "Positioned Self-Correction sections after main workflow content and before reference/appendix sections in all 5 skills"
  - "Tailored self-correction guidance to each skill's specific domain rather than using generic recovery text"

patterns-established:
  - "Self-Correction block: 4 subsections (failing, unsure, user contradiction, edge case) positioned before appendices"

requirements-completed: [FIX-24-04]

# Metrics
duration: 4min
completed: 2026-04-23
---

# Phase 24 Plan 03: Self-Correction Blocks for Coordinator Skills Summary

**Added domain-specific Self-Correction sections to 5 coordinator skills covering failure recovery, uncertainty handling, user contradiction, and edge case strategies**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-23T15:09:24Z
- **Completed:** 2026-04-23T15:13:03Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments
- Added `## Self-Correction` section with 4 subsections to all 5 coordinator skills
- Each subsection contains 3-5 sentences of domain-specific recovery guidance
- Self-Correction blocks positioned after main workflow content, before reference appendices
- All 5 skills remain well under 500 LOC (max: 422, min: 119)
- Zero YAML frontmatter corruption across all files

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Self-Correction blocks to 5 coordinator skills** - `58c4b777` (feat)

## Files Created/Modified
- `.opencode/skills/hm-coordinating-loop/SKILL.md` — Self-Correction for multi-agent dispatch: file existence checks, agent name verification, fallback to sequential, file conflict serialization
- `.opencode/skills/hm-phase-loop/SKILL.md` — Self-Correction for iterative loops: STATE.md cross-referencing, plan re-reading, stalled loop escalation, zero-plan detection
- `.opencode/skills/hm-phase-execution/SKILL.md` — Self-Correction for wave execution: dependency validation, out-of-order execution warnings, same-wave file conflict serialization, partial execution recovery
- `.opencode/skills/hm-completion-looping/SKILL.md` — Self-Correction for completion guardrails: verification command runnability, Nyquist gap flagging, conservative default interpretation, user evidence presentation
- `.opencode/skills/hm-user-intent-interactive-loop/SKILL.md` — Self-Correction for intent probing: multiple-choice fallback, contradiction acknowledgment, document extraction, session reconstruction

## Decisions Made
- Positioned Self-Correction sections consistently after anti-patterns/main workflow and before reference/appendix sections across all 5 skills
- Tailored each Self-Correction block to the specific coordinator domain rather than using generic recovery text — each skill addresses its own failure modes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 5 coordinator skills now have Self-Correction blocks with failure recovery guidance
- Phase 24 is complete (all 3 plans executed: 24-01, 24-02, 24-03)
- Ready for phase completion and next milestone step

## Self-Check: PASSED

- [x] Verification 1: All 5 skills have ## Self-Correction sections (rg confirms)
- [x] Verification 2: All 5 skills have all 4 subsections (4 per file confirmed)
- [x] Verification 3: All skills under 500 LOC (max: 422)
- [x] Verification 4: All 5 YAML frontmatter intact (--- delimiter confirmed)
- [x] Commit 58c4b777 exists in git log

---
*Phase: 24-fix-22-failed-hm-skills*
*Completed: 2026-04-23*
