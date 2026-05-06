# Phase SE-1 Plan 1: Skill Reclassification & Cleanup Summary

---
phase: SE-1-skill-reclassification-cleanup
plan: 1
subsystem: skill-ecosystem
tags: [reclassification, rename, cleanup, skills, agents, commands]
dependency_graph:
  requires: []
  provides: [renamed-skill-directories, updated-cross-references, gate-permissions]
  affects: [skills, agents, commands, AGENTS.md]
tech_stack:
  added: []
  patterns: [symlink-aware-renaming, batch-sed-replacement]
key_files:
  created: []
  modified:
    - .opencode/skills/ (10 directories renamed, 1 removed)
    - .opencode/agents/coordinator.md (skill permissions + gate permissions)
    - .opencode/agents/conductor.md (skill permissions + gate permissions)
    - .opencode/agents/hivefiver.md (skill references)
    - .opencode/agents/hivefiver-orchestrator.md (skill permissions + routing table)
    - .opencode/agents/hivefiver-agent-builder.md (skill references + paths)
    - .opencode/agents/hivefiver-command-builder.md (skill references + paths)
    - .opencode/agents/hivefiver-skill-author.md (skill references + paths)
    - .opencode/agents/hivefiver-tool-builder.md (skill references + paths)
    - .opencode/agents/hf-prompter.md (skill permissions)
    - .opencode/agents/phase-guardian.md (skill permissions)
    - .opencode/agents/intent-loop.md (skill permissions + references)
    - .opencode/agents/spec-verifier.md (skill permissions)
    - .opencode/agents/meta-synthesis-agent.md (skill references)
    - .opencode/commands/hf-absorb.md (skill reference)
    - .opencode/commands/sync-agents-md.md (skill reference)
    - .opencode/skills/hm-subagent-delegation-patterns/SKILL.md (boundary reference)
    - .opencode/skills/hf-delegation-gates/evals/evals.json (skill name)
    - .opencode/skills/hf-delegation-gates/scripts/validate-skill.sh (skill name)
    - AGENTS.md (skill count and name list)
decisions:
  - Discovered .opencode/skills/ is symlinked to lab — only needed to stage lab paths
  - Retired skill references in .hivefiver-meta-builder/skills-lab/retired/ left unchanged (historical)
  - HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md left unchanged (documents original→new mapping)
metrics:
  duration: ~15 minutes
  completed_date: 2026-04-27
  tasks_total: 8
  tasks_completed: 8
  commits: 3
  files_changed: 139
---

Renamed 10 skill directories (6 hivefiver→hf + 4 hm→hf), removed 1 obsolete skill, fixed all cross-references across 139 files, and added gate permissions to coordinator/conductor agents.

## What Changed

### Wave 1: Directory Renames (commit e114cdb8)
- **6 hivefiver→hf renames**: agents-and-subagents-dev, command-dev, context-absorb, custom-tools-dev, delegation-gates, use-authoring-skills
- **4 hm→hf renames**: agent-composition, agents-md-sync, command-parser, skill-synthesis
- **1 removal**: hm-opencode-project-inspection (95% overlap with hm-opencode-project-audit)
- Updated all SKILL.md `name:` frontmatter fields (including dual-name fields in hf-agents-and-subagents-dev and hf-use-authoring-skills)
- Updated internal path references in hf-delegation-gates (evals, scripts, references)
- Updated references/rich-resource-rationale.md title lines in hf-command-parser and hf-agents-md-sync

### Wave 2: Cross-Reference Fixes (commit f0c785db)
- Fixed 1 stale skill reference in hm-subagent-delegation-patterns/SKILL.md
- Updated skill permissions and instruction text in 13 agent files
- Added gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance permissions to coordinator.md and conductor.md
- Fixed 2 command files (hf-absorb.md, sync-agents-md.md)
- Fixed evals.json and validate-skill.sh in hf-agents-md-sync and hf-command-parser

### Wave 3: AGENTS.md Update (commit 01f1ccd1)
- Updated skill count from 22 to 21
- Replaced all old skill names with new names in skill list
- Removed hm-opencode-project-inspection from list

## Verification Results

| Check | Result |
|-------|--------|
| Zero old hivefiver-* directories | PASS |
| Zero old hm→hf directories | PASS |
| hm-opencode-project-inspection removed | PASS |
| All 10 new hf-* directories exist | PASS (10/10) |
| Skill count correct (34 total) | PASS |
| Zero stale references in .opencode/skills/ | PASS (0) |
| Zero stale references in .opencode/agents/ | PASS (0) |
| Zero stale references in .opencode/commands/ | PASS (0) |
| Gate permissions in coordinator.md | PASS (3 entries) |
| Gate permissions in conductor.md | PASS (3 entries) |
| AGENTS.md updated | PASS |

## Deviations from Plan

### Discovery: Symlinked Directories
- **Found during:** Wave 1 Task A
- **Issue:** Plan assumed two independent directory trees. In this worktree, `.opencode/skills/`, `.opencode/agents/`, and `.opencode/commands/` are all symlinks to the `.hivefiver-meta-builder/` lab directories.
- **Fix:** Applied all operations through the symlink (which writes to the lab). Only staged lab paths for git commits.
- **Impact:** Reduced redundant operations but required careful staging.

### Additional fixes (Deviation Rule 2 — missing critical functionality)
- **Found during:** Wave 3 Task H
- **Issue:** evals.json and validate-skill.sh in hf-agents-md-sync and hf-command-parser still referenced old `hm-*` names
- **Fix:** Updated evals.json skill fields and validate-skill.sh echo strings
- **Files modified:** hf-agents-md-sync/evals/evals.json, hf-agents-md-sync/scripts/validate-skill.sh, hf-command-parser/evals/evals.json, hf-command-parser/scripts/validate-skill.sh

### Not modified (intentional)
- `.hivefiver-meta-builder/skills-lab/retired/` — historical archived skills, not active
- `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` — documents the original→new mapping, should preserve original names for traceability

## Completion Criteria

- [x] 6 hivefiver-* directories renamed to hf-* (both locations via symlink)
- [x] 4 hm→hf directories renamed (both locations via symlink)
- [x] hm-opencode-project-inspection removed (both locations via symlink)
- [x] All SKILL.md name: fields updated to new names
- [x] All SKILL.md internal references updated
- [x] All agent .md skill permissions updated to new names
- [x] All agent .md instruction text updated to new names
- [x] All command .md skill references updated to new names
- [x] gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance added to coordinator.md and conductor.md skill permissions
- [x] AGENTS.md counts and skill lists updated
- [x] Zero stale references remain in .opencode/ or .hivefiver-meta-builder/ active directories
- [x] All changes committed in 3 atomic commits

## Self-Check: PASSED

All 10 new hf-* directories confirmed present. All 3 commit hashes verified in git log. Zero stale references confirmed via grep.
