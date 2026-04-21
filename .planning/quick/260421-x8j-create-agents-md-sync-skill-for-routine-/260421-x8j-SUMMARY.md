---
phase: quick
plan: 01
subsystem: documentation-sync
tags: [skill, command, agents-md, drift-detection, scan-diff-apply]
dependency_graph:
  requires: [existing-skill-conventions, existing-command-conventions]
  provides: [agents-md-sync-skill, sync-agents-md-command]
  affects: [AGENTS.md, src/lib/AGENTS.md]
tech_stack:
  added: [agents-md-sync skill]
  patterns: [scan-diff-apply, edit-only-enforcement, drift-reporting]
key_files:
  created:
    - .opencode/skills/agents-md-sync/SKILL.md
    - .opencode/commands/sync-agents-md.md
  modified: []
decisions:
  - Single-file skill (no references/ subdirectory) — skill scope is narrow enough for one file
  - Edit-only enforcement — both AGENTS.md files exist, never regenerate
  - 9 scan targets covering src/ directories and .opencode/ meta-concepts
  - Thin command wrapper following harness-doctor pattern — skill does the heavy lifting
metrics:
  duration: 2 min
  completed: "2026-04-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Quick Task 260421-x8j: Create agents-md-sync Skill Summary

Scan→diff→apply skill for AGENTS.md drift detection with thin command wrapper entry point.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create agents-md-sync skill file | `bc26b387` | `.opencode/skills/agents-md-sync/SKILL.md` (152 lines) |
| 2 | Create sync-agents-md command wrapper | `25e2aa7a` | `.opencode/commands/sync-agents-md.md` (16 lines) |

## Key Outcomes

- **Skill file** (152 lines): Complete scan→diff→apply workflow with YAML frontmatter containing 6 trigger phrases, Iron Law constraint, On Load verification, 9 scan targets with extraction commands, 16 diff checks (12 root + 4 src/lib/), Edit-only apply rules, 5 quality gates, and 5 anti-patterns
- **Command wrapper** (16 lines): Thin entry point following harness-doctor convention — loads the skill and delegates to its workflow
- Both files follow project conventions verified against meta-builder (403 lines), harness-audit (158 lines), and harness-doctor (18 lines) patterns
- Skill addresses all 25 drift categories identified in the 260421-u9n research (17 root + 8 src/lib/)

## Design Decisions

1. **Single-file skill** — no `references/` subdirectory needed given the skill's narrow scan→diff→apply scope
2. **Edit-only enforcement** — both AGENTS.md files exist and must be preserved; Write tool is forbidden
3. **Drift report before apply** — two-pass approach ensures user visibility and prevents blind edits
4. **harness-doctor command pattern** — thin wrapper with `agent: conductor` and `subtask: false`, consistent with existing commands
5. **File written to `.hivefiver-meta-builder/` lab directory** — `.opencode/skills/` and `.opencode/commands/` are symlinks to the lab; git tracks the real path

## Verification

- [x] Skill file exists with all 8 required sections (Iron Law, On Load, Phase 1-3, Quality Gates, Anti-Patterns)
- [x] Skill description contains all trigger phrases: 'sync agents md', 'update agents md', 'fix agents md drift', 'check documentation drift', 'agents md out of date', 'sync documentation'
- [x] Skill enforces Edit-only (no Write on existing files)
- [x] Command file exists with valid YAML frontmatter (description, agent, subtask)
- [x] Command references the agents-md-sync skill
- [x] Both files committed to git

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

All files verified present and all commits verified in git log.
