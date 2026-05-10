---
phase: 15-security-quality-remediation-fix-all-26-audit-issues-from-co
plan: 01
subsystem: security
tags: [permissions, agent-definitions, skill-paths, yaml-schema, hierarchy]

# Dependency graph
requires:
  - phase: 14
    provides: Codebase audit findings that identified 26 issues
provides:
  - Professional build.md with explicit skill allowlist (no wildcards)
  - ask-by-default conductor.md permissions scoped to minimum access
  - Coordinator.md asserted as sole primary orchestrator
  - hivefiver.md disambiguated as meta-concept specialist
  - orchestrator.md using standard YAML schema with subagent mode
  - Portable harness-delegation-inspection with project-relative paths
affects: [agent-definitions, skill-definitions, gsd-execution]

# Tech tracking
tech-stack:
  added: []
  patterns: [ask-by-default permissions, explicit skill allowlists, hierarchy comments, project-relative paths]

key-files:
  created: []
  modified:
    - .opencode/agents/build.md
    - .opencode/agents/conductor.md
    - .opencode/agents/coordinator.md
    - .opencode/agents/hivefiver.md
    - .opencode/agents/orchestrator.md
    - .opencode/skills/harness-delegation-inspection/SKILL.md
    - .opencode/skills/harness-delegation-inspection/references/gsd-execution-patterns.md

key-decisions:
  - "Replaced MUST_FUCKING_READ_AND_OBEY with MANDATORY_COMPLIANCE_REQUIRED (D-01, D-02)"
  - "Replaced wildcard skill:*:allow with explicit allowlist of 6 skill patterns (D-10)"
  - "Conductor changed from skill:allow to ask-by-default with only coordinating-loop, use-authoring-skills, planning-with-files (D-11)"
  - "Coordinator asserted as SINGLE PRIMARY ORCHESTRATOR — all others are specialists (D-03)"
  - "Orchestrator changed from mode:primary to mode:subagent — coordinator is sole primary (D-04)"
  - "Replaced $HOME/.claude/ paths with .opencode/ project-relative paths (D-08, D-09)"

patterns-established:
  - "ask-by-default permissions: All agent permissions start with ask-all, then allow only what's needed"
  - "Hierarchy comments: Every agent .md has an HTML comment declaring its role under coordinator"
  - "Project-relative paths: Skills use .opencode/ instead of $HOME for portability"

requirements-completed: [C-1, C-2, C-3, W-5, W-6, W-11]

# Metrics
duration: 8min
completed: 2026-04-17
---

# Phase 15 Plan 01: Critical Security Fixes Summary

**Eliminated wildcard permissions, profanity, hardcoded paths, and hierarchy confusion across 6 agent/skill files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-17T14:05:04Z
- **Completed:** 2026-04-17T14:13:47Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Removed all profanity from build.md and replaced with professional MANDATORY_COMPLIANCE_REQUIRED tag
- Replaced wildcard `skill: "*": allow` in build.md with explicit allowlist of 6 skill patterns
- Converted conductor.md from overly-permissive `skill: allow` to ask-by-default with 3 scoped skills
- Established coordinator.md as sole primary orchestrator with hierarchy comments on all agents
- Fixed all 6 hardcoded `$HOME/.claude/` paths in harness-delegation-inspection skill to `.opencode/`
- Fixed orchestrator.md: removed non-standard textVerbosity, moved skill under permission, changed mode to subagent

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix build.md** - `4f034d1f` (fix)
2. **Task 2: Fix conductor + hierarchy** - `8a882c56` (fix)
3. **Task 3: Fix hardcoded paths + orchestrator schema** - `961396fc` (fix)

## Files Created/Modified
- `.opencode/agents/build.md` - Professional agent definition with explicit skill allowlist, no profanity
- `.opencode/agents/conductor.md` - ask-by-default permissions, delegation routing specialist role
- `.opencode/agents/coordinator.md` - Added SINGLE PRIMARY ORCHESTRATOR hierarchy comment
- `.opencode/agents/hivefiver.md` - Disambiguated as meta-concept workflow specialist
- `.opencode/agents/orchestrator.md` - Standard YAML schema, subagent mode, hierarchy comment
- `.opencode/skills/harness-delegation-inspection/SKILL.md` - Project-relative paths (no $HOME)
- `.opencode/skills/harness-delegation-inspection/references/gsd-execution-patterns.md` - All 6 path references fixed

## Decisions Made
- Used `MANDATORY_COMPLIANCE_REQUIRED` as the professional replacement for the profane tag name
- Allowed 6 specific skill patterns in build.md (hm-*, gsd-*, coordinating-loop, planning-with-files, use-authoring-skills, harness-audit) — sufficient for this orchestrator's needs
- Scoped conductor to only 3 skills (coordinating-loop, use-authoring-skills, planning-with-files) — minimum for delegation routing
- Changed orchestrator from `mode: primary` to `mode: subagent` since coordinator is the sole primary
- Updated gsd-execution-patterns.md path conversion docs to reflect `.opencode/` as canonical base

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed hardcoded paths in gsd-execution-patterns.md**
- **Found during:** Task 3 (harness-delegation-inspection path fixes)
- **Issue:** Plan only mentioned fixing SKILL.md line 45, but gsd-execution-patterns.md in references/ had 6 additional `$HOME/.claude/` paths that would break portability
- **Fix:** Replaced all 6 occurrences with `.opencode/get-shit-done/` equivalents and updated the path conversion documentation section
- **Files modified:** `.opencode/skills/harness-delegation-inspection/references/gsd-execution-patterns.md`
- **Verification:** `grep -rn '\$HOME' .opencode/skills/harness-delegation-inspection/` returns empty
- **Committed in:** 961396fc (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — extended path fix to reference files)
**Impact on plan:** Positive — more thorough path portability fix than planned. No scope creep.

## Issues Encountered
- Git add fails on `.opencode/agents/` due to symlink — resolved by using real path under `.hivefiver-meta-builder/agents-lab/active/refactoring/`
- Grep for `"*": allow` initially matched all skill allowlist entries — resolved with proper regex anchored to line start

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All C-1, C-2, C-3, W-5, W-6, W-11 issues resolved
- Ready for 15-02-PLAN.md (next set of audit findings)
- No blockers

---
*Phase: 15-security-quality-remediation-fix-all-26-audit-issues-from-co*
*Completed: 2026-04-17*
