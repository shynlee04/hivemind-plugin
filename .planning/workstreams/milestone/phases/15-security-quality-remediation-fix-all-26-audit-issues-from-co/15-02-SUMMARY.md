---
phase: 15-security-quality-remediation-fix-all-26-audit-issues-from-co
plan: 02
subsystem: security
tags: [commands, frontmatter, quoting, files-to-read, skill-references, yaml]

# Dependency graph
requires:
  - phase: 15-01
    provides: Critical security fixes (permissions, hierarchy, paths) that established the agent permission patterns
provides:
  - YAML frontmatter added to deep-init.md command
  - All $ARGUMENTS in bash context properly double-quoted across 4 command files
  - No hardcoded absolute paths in the 5 target command files
  - files_to_read blocks added to 5 skills declaring their referenced scripts/references
  - All skill-judge and skill-creator references annotated with global skill locations
affects: [command-discovery, skill-loading, agent-authorization]

# Tech tracking
tech-stack:
  added: []
  patterns: [files_to_read blocks for skill dependency declaration, global skill annotation comments]

key-files:
  created: []
  modified:
    - .opencode/commands/deep-init.md
    - .opencode/commands/hf-absorb.md
    - .opencode/commands/hf-prompt-enhance.md
    - .opencode/commands/hf-prompt-enhance-to-plan.md
    - .opencode/commands/ultrawork.md
    - .opencode/skills/coordinating-loop/SKILL.md
    - .opencode/skills/harness-audit/SKILL.md
    - .opencode/skills/use-authoring-skills/SKILL.md
    - .opencode/skills/user-intent-interactive-loop/SKILL.md
    - .opencode/skills/agent-authorization/SKILL.md
    - .opencode/agents/hivefiver-skill-author.md
    - .opencode/agents/hivefiver-orchestrator.md

key-decisions:
  - "files_to_read blocks reference only files that actually exist — plan suggested nonexistent GSD reference files which were replaced with real paths"
  - "coordinating-loop already had files_to_read in .opencode/ but needed sync to .hivefiver-meta-builder/ (git-tracked path)"
  - "Global skill references (skill-judge, skill-creator) verified to exist at ~/.agents/skills/ — annotated with comments, no local stubs created"

patterns-established:
  - "files_to_read blocks: Reference own skill references/, scripts/, and relevant GSD thinking-models-*.md files"
  - "Global skill annotation: skill refs to ~/.agents/skills/ get inline comments for discoverability"

requirements-completed: [W-1, W-2, W-3, W-4, W-9]

# Metrics
duration: 5min
completed: 2026-04-18
---

# Phase 15 Plan 02: Command & Skill Quality Fixes Summary

**Command frontmatter, $ARGUMENTS quoting, files_to_read blocks for 5 skills, and annotated global skill references across 12 files**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-18T11:10:33Z
- **Completed:** 2026-04-18T11:16:31Z
- **Tasks:** 3 (1 pre-completed + 2 executed)
- **Files modified:** 12

## Accomplishments
- Added YAML frontmatter with description to deep-init.md (W-1)
- Double-quoted all bare $ARGUMENTS in bash context across 4 command files (W-2)
- Verified no absolute /Users/apple/ paths in the 5 target command files (W-9)
- Added files_to_read blocks to 5 skills: harness-audit, use-authoring-skills, user-intent-interactive-loop, agent-authorization (coordinating-loop already had one) (W-3)
- Annotated all skill-judge and skill-creator references with global skill locations in 2 agent files (W-4)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix command frontmatter + quote $ARGUMENTS + fix absolute paths** - `7b9b1fd4` (fix) — pre-completed
2. **Task 2: Add files_to_read blocks to 4 skills** - `cdf42889` (fix)
3. **Task 3: Annotate global skill refs + sync coordinating-loop** - `afc77c3f` (fix)

**Plan metadata:** pending

## Files Created/Modified
- `.opencode/commands/deep-init.md` - Added YAML frontmatter with description field
- `.opencode/commands/hf-absorb.md` - Quoted bare $ARGUMENTS in bash context
- `.opencode/commands/hf-prompt-enhance.md` - Quoted bare $ARGUMENTS in bash context
- `.opencode/commands/hf-prompt-enhance-to-plan.md` - Quoted bare $ARGUMENTS, removed absolute paths
- `.opencode/commands/ultrawork.md` - Quoted bare $ARGUMENTS in bash context
- `.opencode/skills/coordinating-loop/SKILL.md` - Synced files_to_read block to git-tracked path
- `.opencode/skills/harness-audit/SKILL.md` - Added files_to_read block with references/pointers.md, scripts/compile-bundle.sh, scripts/validate-skill.sh
- `.opencode/skills/use-authoring-skills/SKILL.md` - Added files_to_read with 7 reference/script files + GSD thinking-models
- `.opencode/skills/user-intent-interactive-loop/SKILL.md` - Added files_to_read with 6 reference/script files + GSD thinking-models
- `.opencode/skills/agent-authorization/SKILL.md` - Added files_to_read with references/gates.md
- `.opencode/agents/hivefiver-skill-author.md` - Annotated skill-judge and skill-creator with global path comments
- `.opencode/agents/hivefiver-orchestrator.md` - Annotated skill-judge with global path comment

## Decisions Made
- Replaced plan-suggested nonexistent GSD reference files (wave-execution.md, agent-delegation.md, etc.) with actually-existing files from the skill's own references/ and scripts/ directories
- coordinating-loop already had files_to_read in .opencode/ but git tracked a stale copy in .hivefiver-meta-builder/ — synced both

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced nonexistent GSD reference file paths with real files**
- **Found during:** Task 2 (Add files_to_read blocks)
- **Issue:** Plan suggested files like `.opencode/get-shit-done/references/wave-execution.md` and `audit-protocol.md` that don't exist
- **Fix:** Listed actual files in each skill's references/ and scripts/ directories, plus the existing `thinking-models-execution.md` GSD reference
- **Files modified:** All 4 skill SKILL.md files (harness-audit, use-authoring-skills, user-intent-interactive-loop, agent-authorization)
- **Verification:** All 10 referenced files confirmed to exist on disk
- **Committed in:** cdf42889 (Task 2 commit)

**2. [Rule 3 - Blocking] Synced coordinating-loop files_to_read to git-tracked path**
- **Found during:** Task 3 (commit staging)
- **Issue:** .opencode/ and .hivefiver-meta-builder/ (git-tracked) copies were out of sync — .opencode/ had files_to_read but git didn't
- **Fix:** Staged and committed the .hivefiver-meta-builder/ version
- **Files modified:** .hivefiver-meta-builder/skills-lab/active/refactoring/coordinating-loop/SKILL.md
- **Verification:** git diff confirms sync
- **Committed in:** afc77c3f (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking — nonexistent reference paths and out-of-sync git paths)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- Git tracks files under `.hivefiver-meta-builder/` rather than `.opencode/` — requires staging from the git-tracked path

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All W-1, W-2, W-3, W-4, W-9 requirements resolved
- Ready for 15-03-PLAN.md (remaining audit findings)
- Note: 3 other command files (hf-audit.md, hf-create.md, hf-stack.md) still have absolute /Users/apple/ paths but were out of scope for this plan

---
*Phase: 15-security-quality-remediation-fix-all-26-audit-issues-from-co*
*Completed: 2026-04-18*

## Self-Check: PASSED

All 6 key files exist on disk. All 3 commits found in git log. SUMMARY.md exists at expected path.
