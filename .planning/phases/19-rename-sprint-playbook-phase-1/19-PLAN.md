# Phase 19 — Rename Sprint Plan

**Phase:** 19
**Playbook Phase:** 1
**Date:** 2026-04-23

---

## Wave 1: Directory Renames + Frontmatter Updates

**Tasks:**
1. Rename all 21 skill directories in `.hivefiver-meta-builder/skills-lab/active/refactoring/`
2. Update `name:` frontmatter in each SKILL.md to match new directory name
3. Update any internal `references/` or `scripts/` that hardcode the old skill name

**Acceptance Criteria:**
- `ls .hivefiver-meta-builder/skills-lab/active/refactoring/` shows only planned names
- Every SKILL.md frontmatter `name:` matches directory name

## Wave 2: Call-Site Updates

**Tasks:**
1. Update `meta-builder` (now `hm-meta-builder`) SKILL.md routing table entries
2. Update all agent `.md` files' `permission.skill` blocks
3. Update all command `.md` files' bodies
4. Update playbook Appendix F.2 and all internal references
5. Update root `AGENTS.md` and `.hivefiver-meta-builder/AGENTS.md`

**Acceptance Criteria:**
- Zero occurrences of old skill names in agent permission blocks
- Zero occurrences of old skill names in routing tables
- Playbook inventory matches reality

## Wave 3: Validation

**Tasks:**
1. Run `validate-skill.sh` for each renamed skill
2. Run `check-overlaps.sh` across full catalogue
3. Grep for any remaining stale references

**Acceptance Criteria:**
- All validators exit 0
- No stale old-name references in agents/commands/playbook/docs

## Commit

**Message:** `phase: 19 — rename sprint: 21 skills migrated to hm-*/hivefiver-* namespace`

**Scope:** All changes in `.hivefiver-meta-builder/` (lab + playbook + AGENTS.md)
