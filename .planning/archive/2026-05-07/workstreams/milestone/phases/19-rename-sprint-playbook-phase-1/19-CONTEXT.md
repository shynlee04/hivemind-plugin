# Phase 19 — Rename Sprint (Playbook Phase 1)

**GSD Phase:** 19
**Playbook Phase:** 1
**Date:** 2026-04-23
**Status:** archived
**Archived reason:** Reclassified to skill-ecosystem workstream (SE-H3)
**Depends on:** Phase 18 (Context & Research — Playbook Phase CR) ✅ COMPLETE

---

## Purpose

Execute the `hm-*` / `hivefiver-*` namespace migration for all 21 skills requiring rename per CR-DECISIONS.md. This phase touches **only** soft meta-concepts — zero `src/` changes, zero agent/command refactors (except `permission.skill` blocks), zero IDE-directory modifications.

## Scope

### In
- Rename 21 skill directories under `.hivefiver-meta-builder/skills-lab/active/refactoring/`
- Update `name:` frontmatter in each renamed skill's SKILL.md
- Update routing-table entries in `meta-builder` → `hm-meta-builder` SKILL.md and workflow files
- Update every agent `permission.skill` block that references old names
- Update command bodies and workflow files under `.opencode/commands/` and `.opencode/get-shit-done/workflows/`
- Update playbook internal references (Appendix F.2)
- Update AGENTS.md canonical location statements

### Out
- No description rewrites (deferred to Phase 21)
- No body edits (deferred to Phase 20/22/23)
- No eval changes (deferred to Phase 23)
- No new skill creation (deferred to Phase 20)
- No split/merge/retire actions (deferred to Phase 20)

## Rename Inventory (from Playbook Appendix F.2)

| # | Current Name | Planned Name | Prefix | Lineage |
|---|--------------|--------------|--------|---------|
| 1 | `meta-builder` | `hm-meta-builder` | `hm-` | shared |
| 2 | `use-authoring-skills` | `hivefiver-use-authoring-skills` | `hivefiver-` | hivefiver-exclusive |
| 3 | `agents-and-subagents-dev` | `hivefiver-agents-and-subagents-dev` | `hivefiver-` | hivefiver-exclusive |
| 4 | `command-dev` | `hivefiver-command-dev` | `hivefiver-` | hivefiver-exclusive |
| 5 | `custom-tools-dev` | `hivefiver-custom-tools-dev` | `hivefiver-` | hivefiver-exclusive |
| 6 | `coordinating-loop` | `hm-coordinating-loop` | `hm-` | shared |
| 7 | `phase-loop` | `hm-phase-loop` | `hm-` | shared |
| 8 | `planning-with-files` | `hm-planning-with-files` | `hm-` | shared |
| 9 | `user-intent-interactive-loop` | `hm-user-intent-interactive-loop` | `hm-` | shared |
| 10 | `opencode-platform-reference` | `hm-opencode-platform-reference` | `hm-` | shared |
| 11 | `opencode-non-interactive-shell` | `hm-opencode-non-interactive-shell` | `hm-` | shared |
| 12 | `oh-my-openagent-reference` | `hm-omo-reference` | `hm-` | shared |
| 13 | `hf-context-absorb` | `hivefiver-context-absorb` | `hivefiver-` | hivefiver-exclusive |
| 14 | `harness-audit` | `hm-opencode-project-audit` | `hm-` | shared |
| 15 | `agent-authorization` | `hivefiver-delegation-gates` | `hivefiver-` | hivefiver-exclusive |
| 16 | `gsd-agent-composition` | `hm-agent-composition` | `hm-` | shared |
| 17 | `command-parser` | `hm-command-parser` | `hm-` | shared |
| 18 | `agents-md-sync` | `hm-agents-md-sync` | `hm-` | shared |
| 19 | `skill-synthesis` | `hm-skill-synthesis` | `hm-` | hivefiver-exclusive |

**Deferred to Phase 20:**
- `harness-delegation-inspection` → split (not rename)
- `session-context-manager` → merge into `hm-planning-with-files` (not rename)

## Call-Site Update Matrix

| Call-site | Files to touch |
|-----------|---------------|
| Routing table | `meta-builder/SKILL.md` + workflow files inside meta-builder/ |
| Agent permissions | `.hivefiver-meta-builder/agents-lab/active/refactoring/*.md` (permission.skill blocks) |
| Command bodies | `.hivefiver-meta-builder/commands-lab/active/refactoring/*.md` |
| Playbook | `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` |
| AGENTS.md | `AGENTS.md` (root) + `.hivefiver-meta-builder/AGENTS.md` |

## Hard Constraints
- Zero `src/` code changes
- Zero agent/command structural refactors (only `permission.skill` name updates)
- Zero IDE-directory modifications (`.trae/`, `.windsurf/`, `.codex/`, `.github/skills/`)
- `.opencode/skills/` is a symlink → renaming in lab auto-reflects

## Exit Criteria
- [ ] All 21 skill directories renamed in lab
- [ ] All SKILL.md `name:` frontmatter updated
- [ ] All agent `permission.skill` blocks updated
- [ ] All command bodies updated
- [ ] Playbook Appendix F.2 updated
- [ ] AGENTS.md canonical references updated
- [ ] `validate-skill.sh` green for all renamed skills
- [ ] `check-overlaps.sh` passes
- [ ] Committed with conventional message

## Verification
- Run `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ | sort` and cross-check against inventory
- Grep for any remaining old-name references in agents/commands/playbook
