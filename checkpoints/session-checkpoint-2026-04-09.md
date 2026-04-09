# Session Checkpoint — Skills Refactoring Audit

> **Date:** 2026-04-09
> **Session ID:** `ses_skill_audit_2026_04_09`
> **Project:** HiveMind V3 (opencode-harness)
> **Working Directory:** `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
> **Status:** Cycle 2 COMPLETE — ready for Cycle 3 (Remediation Planning)

---

## Session Summary

Two cycles completed in the skills refactoring audit:

- **Cycle 1: Bundle Deep Scan** — Cataloged all scripts/, references/, assets/ across 20 skills. Found 32 scripts (34% orphaned), 77 references (4 stubs, 1 phantom, 1 empty), 10 assets. 9 cross-skill conflict pairs identified.
- **Cycle 2: Edge Case Analysis** — Identified 38 red fail cases across all 20 skills, mapped domain coverage gaps, produced 13 missing skill recommendations, and created a 20-skill health scorecard.

**Pair mapping** was completed as part of Cycle 2 planning output (agent↔skill matrix, pair-of-3 and pair-of-2 configurations documented in the cycle plan).

---

## Files Produced (7 total)

### Cycle 1 — Inventory (5 files)

| File | Location | Lines | Content |
|------|----------|-------|---------|
| `skills-inventory-2026-04-09.md` | `.hivemind/research/skills-audit/inventory/` | — | Master inventory of all 20 skills |
| `bundle-scan-meta-concepts-2026-04-09.md` | `.hivemind/research/skills-audit/inventory/` | 550 | Bundle scan: meta-builder, use-authoring-skills, agents-and-subagents-dev, command-dev, custom-tools-dev, skill-synthesis, agent-authorization |
| `bundle-scan-orchestration-2026-04-09.md` | `.hivemind/research/skills-audit/inventory/` | 441 | Bundle scan: coordinating-loop, phase-loop, planning-with-files, user-intent-interactive-loop |
| `bundle-scan-platform-2026-04-09.md` | `.hivemind/research/skills-audit/inventory/` | 321 | Bundle scan: opencode-platform-reference, opencode-non-interactive-shell, oh-my-openagent-reference |
| `bundle-scan-remaining-2026-04-09.md` | `.hivemind/research/skills-audit/inventory/` | 395 | Bundle scan: harness-audit, harness-delegation-inspection, command-parser, hm-deep-research, eval-harness |

### Cycle 1 — Synthesis (2 files)

| File | Location | Content |
|------|----------|---------|
| `cross-batch-findings-2026-04-09.md` | `.hivemind/research/skills-audit/synthesis/` | 4 systemic issues (internal vocab leak, formulaic descriptions, duplicate locations, script dependency risks), overlap/conflict map, architecture alignment issues, gold standard skills, removal/migration recommendations |
| `cycle1-aggregate-bundle-findings-2026-04-09.md` | `.hivemind/research/skills-audit/synthesis/` | Quantitative bundle health, 4 critical issues, 6 high-impact gaps, 9 conflict pairs, location sanity report |

### Cycle 2 — Planning (2 files)

| File | Location | Lines | Content |
|------|----------|-------|---------|
| `cycle-plan-2026-04-09.md` | `.hivemind/research/skills-audit/planning/` | — | 3-cycle execution plan with delegation patterns, pair-of-3/pair-of-2 configs, agent↔skill matrix template |
| `edge-case-analysis-2026-04-09.md` | `planning/` | 702 | 38 red fail cases (7 meta-concept, 4 orchestration, 3 platform, 5 remaining), uncovered domain gaps, 13 missing skills |

### Pre-existing (referenced)

| File | Location | Content |
|------|----------|---------|
| `refactoring-plan-2026-04-09.md` | `.hivemind/research/skills-audit/planning/` | 6-phase refactoring plan (A: structural cleanup → F: body quality enhancement) |

---

## Critical Issues (4 items — must fix before Stable)

| ID | Issue | Skill | Impact | Fix |
|----|-------|-------|--------|-----|
| **CRITICAL-1** | `validate-gate.sh` broken `synthesize` action — script only accepts `create|edit|audit` | skill-synthesis | Guaranteed runtime failure when agent reaches synthesis stage | Add `synthesize` action to script OR change SKILL.md call |
| **CRITICAL-2** | 4 stub references with "Content to be filled in" placeholder | meta-builder | SKILL.md claims detailed guidance but agents find stubs (12-17 lines each) | Write real content or remove references from SKILL.md |
| **CRITICAL-3** | Phantom reference — `tech-stack.md` listed in summary.md but file doesn't exist | oh-my-openagent-reference | Agent following guidance will fail | Generate the file or remove row from summary.md |
| **CRITICAL-4** | `check-overlaps.sh` always exits 0 — unconditional `exit 0` on line 130 | agent-authorization | Overlap detection is advisory only; never blocks progression | Fix exit code to reflect findings |

**Note:** CRITICAL-1 also exists as a duplicate bug in `use-authoring-skills` (identical script copy).

---

## Skill Health Distribution

### Bundle Grade Distribution

| Grade | Count | Skills |
|-------|-------|--------|
| **A (Production)** | 0 | — |
| **B (Needs Fixes)** | 7 | coordinating-loop, user-intent-interactive-loop, meta-builder, use-authoring-skills, harness-audit, hm-deep-research, opencode-platform-reference |
| **C (Needs Rebuild)** | 6 | skill-synthesis, harness-delegation-inspection, agent-authorization, opencode-non-interactive-shell, command-parser, command-dev |
| **D (Stub)** | 6 | phase-loop, oh-my-openagent-reference, planning-with-files, custom-tools-dev, agents-and-subagents-dev, session-context-manager |
| **F (Dead)** | 1 | eval-harness |

### Additional Health Metrics

| Metric | Value |
|--------|-------|
| Total scripts | 32 |
| Orphan scripts (not called from SKILL.md) | 11 (34%) |
| Total reference files | 77 |
| Stub references | 4 |
| Phantom references | 1 |
| Empty references | 1 |
| Cross-skill conflict pairs | 9 |
| Skills with evals | 5 (25%) |
| Skills without evals | 15 |
| Red fail cases identified | 38 |
| Systemic issues | 4 |
| Missing skills recommended | 13 |

---

## Systemic Issues (affecting 3+ skills)

| ID | Issue | Affected | Severity |
|----|-------|----------|----------|
| S1 | Internal vocabulary leak in descriptions (harness, GSD, OMO, hivefiver) | 7 skills | CRITICAL |
| S2 | Formulaic description pattern ("This skill should be used when") | 5 skills | HIGH |
| S3 | Duplicate skills across `.claude/` and `.opencode/` locations | 5+ skills | CRITICAL |
| S4 | Script dependencies without fallbacks | 6 skills | MEDIUM |

---

## Pending Work

### Cycle 3: Remediation Planning (NEXT)

Planned outputs:
- `synthesis/final-skills-status-2026-04-09.md` — Every skill gets STABLE/NEEDS_WORK/REMOVED status
- Fix critical issues (4 items) with owners and execution timeline
- Bundle health summary (quantitative)
- Handoff brief for agents+commands audit

### 6-Phase Refactoring Plan (awaiting authorization)

| Phase | Name | Status | Dependencies |
|-------|------|--------|-------------|
| A | Structural Cleanup (canonical locations, dedup, merge) | NOT STARTED | None |
| B | Description Rewrite Sprint (11 skills) | NOT STARTED | Phase A |
| C | Structural Refactoring (merge 1, split 1, rename 1) | NOT STARTED | Phase B |
| D | Naming Cleanup (4 renames) | NOT STARTED | Phase C |
| E | Script Dependency Hardening (6 skills) | NOT STARTED | Phase D |
| F | Body Quality Enhancement (3 skills) | NOT STARTED | Phase E |

### End State Targets

| Metric | Current | Target |
|--------|---------|--------|
| Total skills | 20 | 20 (merge 1, split 1, rename 1) |
| PASS skills | 8 | 18+ |
| NEEDS_REFACTOR | 11 | ≤3 |
| FAIL | 1 | 0 |
| Duplicate locations | 5+ | 0 (single canonical) |
| Internal vocab in descriptions | 7 | 0 |
| Phantom commands | 1 | 0 |
| Scripts with inline fallbacks | 0 | All |

---

## Key Decisions Made

1. **Canonical skill location:** `.claude/skills/` is the primary location (20 skills found). `.opencode/skills/` has zero skills. `.agents/skills/` has 1 outlier (eval-harness).
2. **session-context-manager:** Recommended for merge into planning-with-files (functional overlap).
3. **harness-delegation-inspection:** Recommended for split into 2 skills (delegation patterns + project inspection).
4. **eval-harness:** Recommended rename to eval-driven-development (name collision with HiveMind harness).
5. **session-context-manager:** Marked as REMOVED in Cycle 1 aggregate (pending merge into planning-with-files).

---

## Recovery Instructions

### To Resume This Session

1. **Read this checkpoint first:** `checkpoints/session-checkpoint-2026-04-09.md`
2. **Read Cycle 1 aggregate:** `.hivemind/research/skills-audit/synthesis/cycle1-aggregate-bundle-findings-2026-04-09.md`
3. **Read Cycle 2 edge cases:** `planning/edge-case-analysis-2026-04-09.md`
4. **Read cross-batch synthesis:** `.hivemind/research/skills-audit/synthesis/cross-batch-findings-2026-04-09.md`
5. **Read refactoring plan:** `.hivemind/research/skills-audit/planning/refactoring-plan-2026-04-09.md`

### Next Action

Start **Cycle 3: Final Synthesis**. The synthesizer subagent should:

1. Read all Cycle 1 + Cycle 2 output files (listed above)
2. Produce `synthesis/final-skills-status-2026-04-09.md` with:
   - Every skill's final status (STABLE/NEEDS_WORK/REMOVED) with confidence score
   - Bundle health metrics (quantitative summary)
   - What was lacking (for future cycles, not this one)
   - Handoff brief for agents+commands audit
3. Formally CLOSE the skills audit
4. Prepare handoff to agents+commands audit

### Critical Fix Priority

Before any refactoring phases, fix the 4 critical issues:
1. `skill-synthesis/scripts/validate-gate.sh` — add `synthesize` action
2. `meta-builder/references/` — fill 4 stub files or remove references
3. `oh-my-openagent-reference/references/tech-stack.md` — create or remove from summary.md
4. `agent-authorization/scripts/check-overlaps.sh` — fix exit code logic

### Important Context

- This is a **worktree** at `.worktrees/harness-experiment/` — changes are isolated
- The main repo is at `/Users/apple/hivemind-plugin/`
- Skills live in `.claude/skills/` (primary) — NOT `.opencode/skills/`
- The product is the **harness** (TypeScript plugin), not the skills (user-configurable meta-concepts)
- Never confuse the "Hard Harness" (`src/`) with "Soft Meta-Concepts" (`.opencode/`)

---

_Checkpoint written: 2026-04-09_
_Next session should read this file and resume at Cycle 3_
