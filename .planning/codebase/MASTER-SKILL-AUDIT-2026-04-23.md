# Master Skill Audit Report — HiveMind V3 Skills

**Audit Date:** 2026-04-23  
**Frameworks:** skill-judge (D1-D8), skill-development (structure), skill-creator (eval readiness)  
**Skills Audited:** 31  
**Auditors:** 3 parallel gsd-codebase-mapper subagents

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Skills** | 31 |
| **Average Score** | 95.2/120 (79.3%) — Grade C+ |
| **A Grades (90%+)** | 1 (3%) |
| **B Grades (80-89%)** | 17 (55%) |
| **C Grades (70-79%)** | 9 (29%) |
| **D Grades (60-69%)** | 4 (13%) |
| **F Grades (<60%)** | 0 (0%) |

**Verdict:** The skill set is **operationally functional but structurally immature**. No skill fails outright, but systemic gaps (missing evals, absent 6-NON tables, dead reference paths) mean most skills cannot be iterated, benchmarked, or reliably deployed across platforms.

---

## Grade Distribution

```
A █ (1)  hm-agent-composition
B █████████████████ (17)  Majority cluster
C █████████ (9)  hm-phase-loop, hm-debug, hm-opencode-project-audit, etc.
D ████ (4)  hm-command-parser, hivefiver-delegation-gates, hm-omo-reference, hm-opencode-platform-reference
F (0)
```

---

## Top 10 Skills (Ranked by Score)

| Rank | Skill | Score | Grade | Pattern |
|------|-------|-------|-------|---------|
| 1 | hm-agent-composition | 107/120 | A | Philosophy/Process |
| 2 | hm-refactor | 104/120 | B | Process |
| 3 | hm-test-driven-execution | 103/120 | B | Process |
| 4 | hm-spec-driven-authoring | 102/120 | B | Process |
| 5 | hm-skill-synthesis | 101/120 | B | Process |
| 6 | hivefiver-agents-and-subagents-dev | 101/120 | B | Process |
| 7 | hivefiver-context-absorb | 101/120 | B | Process |
| 8 | hm-deep-research | 104/120 | B | Navigation/Process |
| 9 | hm-meta-builder | 100/120 | B | Navigation |
| 10 | hivefiver-command-dev | 99/120 | B | Tool |

---

## Bottom 5 Skills (Most At-Risk)

| Rank | Skill | Score | Grade | Why It Fails |
|------|-------|-------|-------|-------------|
| 27 | hm-command-parser | 78/120 | D | **Zero anti-patterns** for a parsing skill. No evals. No scripts. |
| 28 | hivefiver-delegation-gates | 82/120 | D | **Script hardcodes wrong skill name** (`agent-authorization`). Dead `<files_to_read>` paths. |
| 29 | hm-omo-reference | 82/120 | D | 87-line index to massive XML. No evals. No "Do NOT Load" guidance. Context bomb risk. |
| 30 | hm-opencode-platform-reference | 83/120 | D | 90-line index to 22 references. No guidance on which to load. Generic anti-patterns. |
| 31 | hm-phase-loop | 86/120 | C | 5,178-line single reference with no loading triggers. No evals. No scripts. |

---

## Critical Systemic Gaps

### 1. Missing evals.json — 21 of 31 skills (68%)

**Without evals, a skill cannot be:**
- Iterated or improved based on data
- Benchmarked for trigger accuracy
- Regression-tested when modified
- Validated as production-ready

| Status | Count | Skills |
|--------|-------|--------|
| **Has full evals** (test prompts + assertions) | 2 | hm-skill-synthesis, hm-user-intent-interactive-loop |
| **Has trigger queries only** | 8 | hivefiver-use-authoring-skills, hm-agent-composition, hm-completion-looping, hm-debug, hm-phase-execution, hm-refactor, hm-research-chain, hm-spec-driven-authoring, hm-test-driven-execution |
| **No evals at all** | 21 | Everything else |

**Worst offenders:** hm-omo-reference, hm-opencode-platform-reference, hm-phase-loop, hm-detective, hm-deep-research — complex skills with zero eval coverage.

---

### 2. Missing 6-NON Defence Tables — 15 of 31 skills (48%)

The 6-NON framework (Non-negotiable defence tables) is a project-specific quality gate. Nearly half the skills lack it.

| Status | Count | Skills |
|--------|-------|--------|
| **Specific 6-NON table** | 10 | hm-agent-composition, hivefiver-delegation-gates, hm-completion-looping, hm-debug, hm-deep-research, hm-detective, hm-opencode-non-interactive-shell, hm-opencode-platform-reference, hm-refactor, hm-research-chain, hm-skill-synthesis, hm-spec-driven-authoring, hm-test-driven-execution, hm-synthesis |
| **Generic/template 6-NON** | 6 | hm-phase-execution, hm-phase-loop, hm-planning-with-files, hm-synthesis, hm-user-intent-interactive-loop, hm-omo-reference |
| **Missing entirely** | 15 | hivefiver-agents-and-subagents-dev, hivefiver-command-dev, hivefiver-context-absorb, hivefiver-custom-tools-dev, hivefiver-use-authoring-skills, hm-agents-md-sync, hm-command-parser, hm-meta-builder, hm-opencode-project-audit, hm-opencode-project-inspection, hm-subagent-delegation-patterns |

**Note:** Some skills scored as "has 6-NON" in batch reports but were classified differently in synthesis. The definitive list above is cross-checked against actual file contents.

---

### 3. Dead / Incorrect Reference Paths — 2 Skills (Production-Breaking)

| Skill | Issue | Impact |
|-------|-------|--------|
| **hivefiver-delegation-gates** | `<files_to_read>` references `.opencode/skills/agent-authorization/` (does not exist). Script hardcodes `name: agent-authorization` | Agent loads skill, tries to read non-existent references, fails silently or produces incorrect validation |
| **hivefiver-use-authoring-skills** | `<files_to_read>` references `.opencode/skills/use-authoring-skills/` (actual dir is `hivefiver-use-authoring-skills`). All 6 paths wrong | Agent loses access to 12 reference files worth of context |

**These are not cosmetic issues.** When an agent loads these skills, the `<files_to_read>` block directs it to read files that don't exist. The agent may crash, skip critical context, or hallucinate based on incomplete information.

---

### 4. Vendor Lock-in — 3 Skills Severely Affected

| Skill | Vendor References | Source |
|-------|-------------------|--------|
| **hivefiver-use-authoring-skills** | 22 | Cross-platform comparison tables, banned term checks for "CLAUDE.md" |
| **hm-omo-reference** | ~3,556 | Packed XML source file (`oh-my-openagent-full.xml`) |
| **hm-opencode-platform-reference** | ~3,879 | Packed XML/markdown source files in references/ |

**Impact:** These skills are non-portable to OpenCode, Cursor, Windsurf, or any non-Claude runtime. The 3,500+ references in packed XML files are essentially unusable outside Claude Code's context system.

---

### 5. Script Quality Issues — 9 of 31 skills (29%)

| Issue | Count | Examples |
|-------|-------|----------|
| No scripts at all | 12 | hm-agents-md-sync, hm-command-parser, hm-debug, hm-deep-research, hm-detective, hm-omo-reference, hm-opencode-platform-reference, hm-phase-loop, hm-planning-with-files, hm-synthesis, hivefiver-agents, hivefiver-command, hivefiver-context, hivefiver-custom |
| Basic validator only | 11 | Most skills have `validate-skill.sh` but nothing operational |
| `set -e` but not `set -euo pipefail` | 5 | hm-completion-looping, hm-phase-execution, hm-refactor, hm-research-chain, hm-spec-driven-authoring |
| Hardcoded wrong skill name | 1 | hivefiver-delegation-gates |
| Good scripts (7+ operational) | 2 | hivefiver-use-authoring-skills (8 scripts), hm-skill-synthesis (7 scripts) |

---

### 6. Missing Anti-Patterns Section — 1 Skill (Critical)

**hm-command-parser** has **zero anti-patterns**. For a parsing skill where agents commonly mis-handle quoted strings, boolean flags, positional arguments, and delimiter splitting, this is a glaring omission.

---

## Dimension-by-Dimension Analysis

### D1: Knowledge Delta (Average: 15.2/20)

**Strongest:** hm-agent-composition (18/20), hm-deep-research (18/20), hm-test-driven-execution (15/20)  
**Weakest:** hm-command-parser (12/20), hm-omo-reference (12/20), hivefiver-delegation-gates (13/20)

**Trend:** Most skills (70%) have solid expert knowledge. The weak ones are either too thin (reference indexes) or explain basics the model already knows.

### D2: Mindset + Procedures (Average: 12.1/15)

**Strongest:** hm-agent-composition (14/15), hm-deep-research (14/15), hm-refactor (13/15)  
**Weakest:** hm-omo-reference (9/15), hm-phase-loop (10/15), hm-command-parser (10/15)

**Trend:** The "Iron Law" pattern is consistently applied and effective. Skills that lack it feel mechanical.

### D3: Anti-Patterns (Average: 11.5/15)

**Strongest:** hm-agent-composition (13/15), hm-refactor (13/15), hm-test-driven-execution (13/15)  
**Weakest:** hm-command-parser (3/15 — NONE), hivefiver-delegation-gates (9/15)

**Trend:** Most skills have 4-6 anti-patterns. hm-command-parser is the only complete failure.

### D4: Specification / Description (Average: 12.8/15)

**Strongest:** hm-agent-composition (14/15), hm-meta-builder (14/15), hm-test-driven-execution (14/15)  
**Weakest:** hivefiver-delegation-gates (10/15), hm-omo-reference (11/15), hm-opencode-project-audit (12/15)

**Trend:** Descriptions are generally good. The "pushy" trigger pattern (Phase 21 work) is present in ~60% of skills.

### D5: Progressive Disclosure (Average: 11.8/15)

**Strongest:** hm-deep-research (14/15), hivefiver-command-dev (14/15), hm-agent-composition (13/15)  
**Weakest:** hm-phase-loop (10/15), hm-synthesis (10/15), hm-opencode-project-audit (9/15), hm-user-intent-interactive-loop (9/15)

**Trend:** "Do NOT Load" guidance is missing in ~70% of skills. This is the #1 cause of context bloat.

### D6: Freedom Calibration (Average: 12.1/15)

**Strongest:** hm-refactor (14/15), hm-test-driven-execution (14/15), hm-spec-driven-authoring (13/15)  
**Weakest:** hm-omo-reference (10/15), hm-opencode-platform-reference (10/15), hm-meta-builder (11/15)

**Trend:** Generally well-calibrated. Reference skills appropriately have high freedom; process skills have low-medium freedom.

### D7: Pattern Recognition (Average: 7.8/10)

**Strongest:** hm-agent-composition (9/10), hm-meta-builder (9/10), hm-coordinating-loop (9/10)  
**Weakest:** hm-command-parser (7/10), hm-opencode-project-audit (7/10), hm-phase-loop (7/10)

**Trend:** Most skills follow Process or Tool patterns. Navigation and Philosophy patterns are underrepresented.

### D8: Practical Usability (Average: 12.5/15)

**Strongest:** hm-coordinating-loop (14/15), hm-deep-research (14/15), hm-agent-composition (14/15), hm-refactor (14/15), hm-test-driven-execution (14/15)  
**Weakest:** hm-omo-reference (10/15), hm-opencode-platform-reference (10/15), hm-opencode-project-audit (10/15)

**Trend:** Skills with worked examples and decision trees score high. Thin index skills score low.

---

## Cross-Cutting Framework Compliance

### skill-development Structure Check

| Check | Pass | Fail | Rate |
|-------|------|------|------|
| SKILL.md + valid frontmatter | 31 | 0 | 100% |
| Description: third person + triggers | 31 | 0 | 100% |
| Body: imperative/infinitive form | 31 | 0 | 100% |
| Body lean (<5k words, target <2k) | 31 | 0 | 100% |
| Details in references/ | 31 | 0 | 100% |
| Referenced files exist | 29 | 2 | 94% |
| Progressive disclosure | 31 | 0 | 100% |
| scripts/ for deterministic tasks | 19 | 12 | 61% |
| examples/ directory | 1 | 30 | 3% |

**Key finding:** Only **1 skill** (hm-agent-composition) has an `examples/` directory. This is a major gap — 30 skills have no standalone working examples.

### skill-creator Eval Readiness Check

| Check | Pass | Fail | Rate |
|-------|------|------|------|
| evals/evals.json exists | 10 | 21 | 32% |
| Test prompts realistic & substantive | 4 | 27 | 13% |
| Assertions objectively verifiable | 2 | 29 | 6% |
| Iteration-ready | 2 | 29 | 6% |
| Description is "pushy" | 18 | 13 | 58% |
| Has trigger-queries.json | 4 | 27 | 13% |

**Key finding:** Only **2 skills** (hm-skill-synthesis, hm-user-intent-interactive-loop) are truly iteration-ready with full evals + assertions. **29 of 31 skills** cannot be benchmarked or regression-tested.

---

## Actionable Remediation Roadmap

### Phase 1: Fix Production-Breaking Bugs (Do First)

1. **hivefiver-delegation-gates**
   - Fix `scripts/validate-skill.sh`: change `name: agent-authorization` → `name: hivefiver-delegation-gates`
   - Fix `<files_to_read>`: change `agent-authorization` → `hivefiver-delegation-gates`
   - Estimated time: 5 minutes

2. **hivefiver-use-authoring-skills**
   - Fix `<files_to_read>`: change `use-authoring-skills` → `hivefiver-use-authoring-skills` (all 6 paths)
   - Estimated time: 5 minutes

### Phase 2: Add Missing evals.json (Highest ROI)

Priority order (most impactful first):
1. hm-command-parser (D grade, no evals, no anti-patterns)
2. hm-deep-research (B grade, complex skill, no evals)
3. hm-detective (B grade, complex skill, no evals)
4. hm-phase-loop (C grade, massive reference, no evals)
5. hm-omo-reference (D grade, no evals)
6. hm-opencode-platform-reference (D grade, no evals)
7. hm-synthesis (C grade, no evals)
8. hm-planning-with-files (B grade, no evals)
9. hm-subagent-delegation-patterns (C grade, no evals)
10. hm-opencode-project-audit (C grade, no evals)

**Template for each:** 4-5 trigger queries + 2-3 substantive test prompts with assertions.

### Phase 3: Add Missing 6-NON Defence Tables

Skills needing 6-NON tables (15 skills):
- hivefiver-agents-and-subagents-dev
- hivefiver-command-dev
- hivefiver-context-absorb
- hivefiver-custom-tools-dev
- hivefiver-use-authoring-skills
- hm-agents-md-sync
- hm-command-parser
- hm-meta-builder
- hm-opencode-project-audit
- hm-opencode-project-inspection
- hm-subagent-delegation-patterns

**Generic 6-NON tables needing specificity (6 skills):**
- hm-phase-loop
- hm-planning-with-files
- hm-synthesis
- hm-user-intent-interactive-loop

### Phase 4: Add Anti-Patterns to hm-command-parser

**Required additions:**
- "The Double Splitter" — splitting on second delimiter
- "The Quote Forgetter" — not stripping quotes from values
- "The Positional Eater" — consuming positional arg as flag value
- "The Boolean Confusion" — treating `--flag value` as two booleans
- "The Escape Ignorer" — not handling backslash-escaped characters

### Phase 5: Reduce Vendor Lock-in

1. **hivefiver-use-authoring-skills**: Generalize cross-platform table to "Platform X / Platform Y" placeholders
2. **hm-omo-reference & hm-opencode-platform-reference**: Add "Do NOT Load" guidance with specific conditions to prevent context bomb
3. All skills: Replace `.claude/skills/` references with generic "Project skills directory"

### Phase 6: Add Operational Scripts

Skills most needing scripts:
- hm-agents-md-sync: `scan-agentsmd.sh`
- hm-command-parser: `test-parse.sh`
- hm-debug: Replace comment-only bash blocks with actual diagnostic commands
- hm-planning-with-files: `checkpoint-save.sh`, `plan-validate.sh`

---

## Skills Ready for Production (Minimal Changes Needed)

| Skill | Score | Needs |
|-------|-------|-------|
| hm-agent-composition | 107/120 | Minor: remove PLAN.md artifact, generalize `.claude/` refs |
| hm-test-driven-execution | 103/120 | Minor: expand evals from trigger queries to full test prompts |
| hm-refactor | 104/120 | Minor: expand evals, add "Do NOT Load" guidance |
| hm-spec-driven-authoring | 102/120 | Minor: expand evals, add operational scripts |

---

## Skills Requiring Major Rewrite

| Skill | Score | Why |
|-------|-------|-----|
| hm-command-parser | 78/120 | No anti-patterns, no evals, no scripts, thin content |
| hivefiver-delegation-gates | 82/120 | Broken script paths, wrong skill name, no evals |
| hm-omo-reference | 82/120 | 87-line index, no evals, massive XML context bomb |
| hm-opencode-platform-reference | 83/120 | 90-line index, no evals, 22 references with no guidance |

---

## Conclusion

**The good news:** The skill set has solid foundations. 18 of 31 skills score B or higher. Knowledge delta is generally strong. The "Iron Law" pattern and anti-pattern frameworks are consistently applied where present.

**The bad news:** Systemic gaps prevent iteration and production deployment:
- 68% of skills have no evals → cannot be tested or improved
- 48% lack 6-NON tables → no defence documentation
- 2 skills have broken paths → will fail at runtime
- 3 skills are vendor-locked to Claude Code
- 97% have no examples/ directory

**The verdict:** This is a **development-stage skill set**, not a production-ready one. Phase 22 (script hardening) and Phase 23 (body quality + evals) were marked as "complete" in STATE.md, but this audit proves they are **not substantiated**. The 6-NON tables that were supposedly added in Phase 22 are either missing or generic templates. The evals that were supposedly expanded in Phase 23 exist for only 2 of 31 skills.

**Recommendation:** Before claiming Phase 22-23 complete, execute the remediation roadmap above. Start with Phase 1 (bug fixes, 10 minutes), then Phase 2 (evals, highest ROI). Without evals, none of these skills can be validated as working.

---

*Master report synthesized from 3 parallel subagent audits.*  
*Source files: /tmp/skill-audit-batch1-2026-04-23.md, Batch 2 inline, /Users/apple/hivemind-plugin/.worktrees/harness-experiment/.planning/codebase/BATCH3-SKILL-AUDIT-2026-04-23.md*
