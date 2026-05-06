---
phase: 15-security-quality-remediation-fix-all-26-audit-issues-from-co
plan: 03
subsystem: security
tags: [trigger-phrases, cross-phase-risks, verification, portability, technical-debt]

# Dependency graph
requires:
  - phase: 15-01
    provides: Critical security fixes (C-1, C-2, C-3, W-5, W-6, W-11) that close XPR-1, XPR-3, XPR-4
  - phase: 15-02
    provides: Command/skill quality fixes (W-1, W-2, W-3, W-4, W-9) that close XPR-2, XPR-3
provides:
  - Narrowed multi-word trigger phrases in hm-deep-research and hm-detective (W-10)
  - All 4 cross-phase risks verified as closed (XPR-1 through XPR-4)
  - Remaining 3 command files with absolute paths fixed (extended W-9)
  - W-7 and W-8 documented as src/ technical debt for future phases
  - Complete 26-finding audit closure accounting
affects: [skill-discovery, command-portability, audit-closure]

# Tech tracking
tech-stack:
  added: []
  patterns: [multi-word trigger phrases, project-relative paths in all command files]

key-files:
  created: []
  modified:
    - .opencode/skills/hm-deep-research/SKILL.md
    - .opencode/skills/hm-detective/SKILL.md
    - .opencode/commands/hf-create.md
    - .opencode/commands/hf-stack.md
    - .opencode/commands/hf-audit.md

key-decisions:
  - "Trigger phrases narrowed to multi-word patterns: 'deep research on' not 'research', 'navigate this codebase efficiently' not 'navigate codebase'"
  - "Fixed 3 additional command files with absolute paths that were out of scope in Plan 02 (Rule 2 deviation)"
  - "W-7 (AGENT_TOOLS) and W-8 (task config schema) documented as src/ technical debt — cannot fix without src/ changes"

patterns-established:
  - "Multi-word trigger phrases: Skill triggers require at least 2 words or a specific pattern to avoid false-positive skill loading"
  - "All .opencode/commands/ files now use project-relative paths — zero absolute /Users/apple/ paths remain"

requirements-completed: [W-7, W-8, W-10, XPR-1, XPR-2, XPR-3, XPR-4]

# Metrics
duration: 5min
completed: 2026-04-18
---

# Phase 15 Plan 03: Remaining Fixes + Cross-Phase Risk Verification Summary

**Narrowed trigger phrases in 2 skills, fixed 3 remaining absolute-path commands, verified all 4 cross-phase risks closed, and documented 2 src/ technical debt items — completing all 26 audit findings**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-18T11:20:45Z
- **Completed:** 2026-04-18T11:26:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Narrowed hm-deep-research triggers from 16 single-word/broad phrases to 14 multi-word specific patterns (W-10)
- Narrowed hm-detective triggers from 14 generic phrases to 13 context-qualified patterns (W-10)
- Verified XPR-1 closed: no wildcard `"*": allow` in build.md
- Verified XPR-2 closed: files_to_read in all 5 skills + annotated dangling refs
- Verified XPR-3 closed: fixed remaining 3 command files (hf-create, hf-stack, hf-audit) with absolute paths
- Verified XPR-4 closed: hierarchy comments established across all agents
- Documented W-7 (AGENT_TOOLS in AGENTS.md but not in src/) as src/ technical debt
- Documented W-8 (DelegateTaskInputSchema missing fields) as src/ technical debt
- Confirmed W-12 as intentional overlap (no action needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Narrow trigger phrases** - `e64596e2` (fix)
2. **Task 2: Cross-phase verification + path fixes** - `a5a7a674` (fix)

## Files Created/Modified
- `.opencode/skills/hm-deep-research/SKILL.md` - Trigger phrases narrowed to multi-word patterns
- `.opencode/skills/hm-detective/SKILL.md` - Trigger phrases narrowed to context-qualified patterns
- `.opencode/commands/hf-create.md` - Absolute paths replaced with relative paths
- `.opencode/commands/hf-stack.md` - Absolute paths replaced with relative paths
- `.opencode/commands/hf-audit.md` - Absolute paths replaced with relative paths

## Decisions Made
- Used multi-word trigger phrases like "deep research on" and "comprehensive analysis of" instead of single words like "research" and "analyze" to prevent false-positive skill loading
- Fixed 3 additional command files beyond Plan 02 scope — necessary for XPR-3 closure verification to pass
- W-7 and W-8 require src/ code changes (AGENT_TOOLS constant, DelegateTaskInputSchema fields) which are out of scope for this .opencode/-only phase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed 3 remaining command files with absolute paths (extended W-9)**
- **Found during:** Task 2 (XPR-3 verification)
- **Issue:** XPR-3 verification (`grep -r '/Users/apple/' .opencode/commands/`) found 3 command files (hf-create.md, hf-stack.md, hf-audit.md) still containing hardcoded absolute paths — these were noted as "out of scope" in Plan 02 but block XPR-3 closure
- **Fix:** Replaced all `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/` prefixes with relative paths `.hivefiver-meta-builder/workflows-lab/active/refactoring/`
- **Files modified:** .opencode/commands/hf-create.md, .opencode/commands/hf-stack.md, .opencode/commands/hf-audit.md
- **Verification:** `grep -r '/Users/apple/' .opencode/commands/` returns empty
- **Committed in:** a5a7a674 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — extended W-9 portability fix)
**Impact on plan:** Positive — fully closes XPR-3 cross-phase risk. No scope creep (3 small path replacements).

## Issues Encountered
- C-2 verification grep `"*": allow` falsely matched `"hm-*": allow` due to regex `*` being glob not literal — verified separately with anchored pattern, C-2 is correctly FIXED

## Complete Audit Finding Accounting

| Category | Count | Status |
|----------|-------|--------|
| Critical (C-1, C-2, C-3) | 3 | FIXED (Plans 01, 03) |
| High (W-1 through W-6, W-9, W-11) | 8 | FIXED (Plans 02, 03) |
| Medium (W-7, W-8) | 2 | Documented as src/ technical debt |
| Medium (W-10) | 1 | FIXED (Plan 03) |
| Low (W-12) | 1 | Confirmed intentional — no action |
| Info/acceptable (remaining) | 11 | Confirmed acceptable in audit |
| **Cross-phase risks (XPR-1 through XPR-4)** | 4 | CLOSED (verified in Plan 03) |

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 complete — all 26 audit findings addressed
- 3 plans executed across 3 waves (all committed)
- W-7 and W-8 tracked as src/ technical debt for future phases that modify src/
- No blockers

---
*Phase: 15-security-quality-remediation-fix-all-26-audit-issues-from-co*
*Completed: 2026-04-18*

## Self-Check: PASSED

All 5 modified files exist on disk. Both task commits found in git log. SUMMARY.md exists at expected path.
