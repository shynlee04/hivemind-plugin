# Phase 17: Hivemind Skills Refactor — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in 17-CONTEXT.md — this log preserves the discussion.

**Date:** 2026-04-23
**Phase:** 17-hivemind-skills-refactor
**Mode:** discuss (interactive)

## Discussion Flow

### C1 Fix Strategy — validate-gate.sh + missing hm-skill-synthesis

**Options presented:**
1. Restore from retired lab
2. Merge synthesis into hm-synthesis
3. Remove 'synthesize' action from validate-gate.sh

**User selection:** Audit-first approach — load `skill-creator`, `skill-judge`, review the retired skill, THEN decide restore/refactor/migrate. Research-first decision.

**Rationale:** User wants to understand what the retired skill contains before committing to a fix approach. The decision is deferred to the researcher/planner phase.

---

### C3+C4 Fix Strategy — oh-my-openagent-reference phantom files

**Options presented:**
1. Generate tech-stack.md
2. Mark as resolved / non-issue
3. Full audit of oh-my-openagent-reference

**User selection:** Full audit of oh-my-openagent-reference

**Rationale:** The `context-bomb: true` flag means this skill loads heavy content. Any dead reference wastes agent context. Full audit surfaces all issues, not just the known one.

**Verification findings:**
- C4 (empty project-structure.md): RESOLVED — file has 674 lines, not 4-line stub
- C3 (phantom tech-stack.md): CONFIRMED — file missing from references/ directory

---

### C5 Fix Strategy — duplicate skills across IDE directories

**Options presented:**
1. Gitignore IDE skill dirs
2. Delete IDE skill directories
3. Document canonical location only
4. Analyze overlap before deciding

**User selection:** IDE directories contain third-party skills, NOT project deliverables. Leave untouched. Gitignore to prevent accidental commits.

**Clarification:** User stated that skills found in IDE directories (.trae, .windsurf, .codex, .github) that duplicate .opencode/skills/ are "not the project's builtin" — they're third-party sync artifacts. If any are useful, they must be integrated into hm-skills as new entries.

---

### C2 Fix — Meta-builder stub depth files

**Options presented:**
1. Fill in all 4 depth files
2. Remove stub depth files
3. Partial fill + partial remove

**User selection:** Fill in all 4 depth files with real content

**Evidence:** All 4 files confirmed as stubs with "Content (to be filled in SECTION X)" placeholders:
- depth-built-in-tools.md: 17 lines (stub)
- depth-github-stacks.md: 12 lines (stub)
- depth-repo-analysis.md: 13 lines (stub)
- depth-skill-synthesis.md: 13 lines (stub)

---

### Tech-Stack Synthesis Integration

**Options presented:**
1. Distributed across 3 skills
2. Single skill (hm-synthesis) only
3. Core in one + references in others

**User selection:** Distributed across hm-synthesis, hm-deep-research, and hm-detective

**Additional request:** User also requested hm-* naming mandate for all skills, following GSD's gsd-* pattern.

---

### Scope Management — Naming Mandate

**Options presented:**
1. Expand Phase 17 to include naming + synthesis
2. Keep naming for Phase 18
3. Audit now, execute later

**User selection:** Keep naming for Phase 18 (as originally planned in ROADMAP)

**Rationale:** The hm-* naming mandate is mapped to Playbook Phase 1 → GSD Phase 18. Keeping it there maintains the phase decomposition and prevents Phase 17 from becoming too large.
