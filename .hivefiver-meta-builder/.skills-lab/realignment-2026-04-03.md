# Realignment Document: use-authoring-skills Rebuild

**Date:** 2026-04-03
**Session:** ses_2b07 (continuation after ses_2b05 disaster + ses_2b06 recovery)
**Status:** ACTIVE — governs all future work on this package

**ALWAYS READ this file before touching anything in `.skills-lab/`.**

---

## What Happened

Session `ses_2b05` (9,990 lines) ran 4 waves of subagents, produced audit reports, architecture design, and file edits — then committed NONE of it. The compact context was a hallucination. Session `ses_2b06` recovered by:
1. Committing all untracked work (`4df504e6`)
2. Extracting every locked decision from session history (5 parallel agents)
3. Writing realignment + SOT docs
4. Fixing C5 (compatibility refs in 02-frontmatter-standard.md)

This session (`ses_2b07`) completed the rebuild:
1. Rewrote SKILL.md body with ALL locked decisions encoded
2. Removed all HiveMind/Claude terminology from 6 reference files
3. Updated SOT docs to current verified state

---

## Hard Constraints (MUST follow)

1. NEVER skip git commit after meaningful action
2. NEVER delete from refactoring-skills/ — always archive to .skills-lab/.archive/
3. NEVER edit skill files directly as coordinator — delegate
4. ALWAYS verify file state with git before claiming "done"
5. ALWAYS use planning-with-files discipline: read-before-decide
6. ALWAYS write-to-disk every turn — coherence is lost by default
7. ALWAYS commit before starting new phase
8. ALWAYS maintain hierarchical strategy — no flat structures

---

## Current State (git: be29b812)

### SKILL.md: DONE
- Body rewritten with all locked decisions encoded
- 337 lines (under 500 limit)
- Contains: operating discipline, terminology mandate, frontmatter standard, pattern selection, phase gate system, TDD workflow, quality scoring, iteration protocol, conflict detection, recovery protocol, anti-patterns, cross-package integration
- Frontmatter: name + description only (spec-compliant)

### Reference Files: DONE (terminology)
- All 7 reference files cleaned of HiveMind/Claude terminology
- Verified: 0 matches for "HiveMind|hivemind|Claude|CLAUDE.md"
- Cross-references preserved

### Reference Files: NOT YET CREATED
- `06-cross-platform-activation.md` — referenced in SKILL.md but doesn't exist
- `09-script-authoring.md` — referenced in SKILL.md but doesn't exist
- `10-eval-lifecycle.md` — referenced in SKILL.md but doesn't exist
- `11-description-optimization.md` — referenced in SKILL.md but doesn't exist
- `12-anti-deception.md` — referenced in SKILL.md but doesn't exist

### Templates: STALE
- `templates/skill-audit.json` — old, needs replacement with evals.json, grading-rubric.json, benchmark.json, trigger-queries.json, skill-scaffold/

### Scripts: NOT YET CREATED
- `scripts/validate-skill.sh`
- `scripts/check-overlaps.sh`
- `scripts/test-triggers.sh`

### Examples: NOT YET CREATED
- `examples/example-p1-simple.md`
- `examples/example-p2-technique.md`
- `examples/example-p3-routed.md`

---

## Remaining Work (PRIORITY ORDER)

1. **Create missing reference files** (06, 09-12) — HIGH
2. **Create templates** (evals.json, grading-rubric.json, benchmark.json, trigger-queries.json, skill-scaffold/) — MEDIUM
3. **Create scripts** (validate-skill.sh, check-overlaps.sh, test-triggers.sh) — MEDIUM
4. **Create examples** (P1, P2, P3 walkthroughs) — MEDIUM
5. **Validation gate** — test against real skill creation scenario
6. **Cross-package bridging** — document connections to agent/tool/command/workflow authoring
7. **OpenCode platform docs** — consume 20 reference files in users resources

---

## Session Recovery

1. Read `.skills-lab/realignment-2026-04-03.md` — hard constraints
2. Read `.skills-lab/findings.md` — locked decisions with exact quotes
3. Read `.skills-lab/task_plan.md` — current phase
4. Run `git log --oneline -5` — verify recent commits
5. Run `git status` — verify actual file state
6. Resume from current phase
