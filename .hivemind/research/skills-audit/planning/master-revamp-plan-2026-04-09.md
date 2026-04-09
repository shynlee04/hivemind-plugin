# Master Skills Collection Revamp Plan — 2026-04-09

> **Status:** COMPLETE — all artifacts integrated, awaiting user authorization
> **Source:** 16 research artifacts totaling ~4,500 lines across 2 audit cycles
> **Scope:** 19 live skills (20 minus session-context-manager, already marked FAIL/REMOVED)

---

## Executive Summary

**Current state:** 19 skills, average grade C. 8 PASS, 11 NEEDS_REFACTOR. 34% orphan scripts. 4 critical bugs. 7 skills leak internal vocabulary. Eval coverage 25%.

**Target state:** ~18 skills (merge 1, split 1, create 2), average grade B+. 15+ PASS. 0 critical bugs. 0 vocabulary leaks. Eval coverage 60%+.

**Investment:** 6 phases, ~3-4 execution cycles per phase. Each phase requires explicit user authorization.

---

## 1. Research Artifacts Consumed

| # | Artifact | Lines | Key Finding |
|---|----------|-------|-------------|
| 1 | inventory/skills-inventory-2026-04-09.md | 94 | 20 skills verdicted: 8 PASS, 11 REFACTOR, 1 FAIL |
| 2 | inventory/bundle-scan-meta-concepts-2026-04-09.md | 550 | 7 skills: 32 scripts, 4 stubs, 1 bug |
| 3 | inventory/bundle-scan-orchestration-2026-04-09.md | 441 | 4 skills: duplicate locations, hierarchy issues |
| 4 | inventory/bundle-scan-platform-2026-04-09.md | 321 | 3 skills: phantom refs, massive packs |
| 5 | inventory/bundle-scan-remaining-2026-04-09.md | 395 | 5 skills: heavy refs, stale artifacts |
| 6 | synthesis/cycle1-aggregate-bundle-findings-2026-04-09.md | 153 | Top-line metrics, 4 critical issues, 9 conflict pairs |
| 7 | synthesis/cross-batch-findings-2026-04-09.md | 146 | 4 systemic issues, overlap map, gold standards |
| 8 | planning/pair-mapping-2026-04-09.md | 349 | 6 triple configs, 7 pair configs, 8 red fail cases |
| 9 | planning/refactoring-plan-2026-04-09.md | 144 | 6-phase plan (A-F), skill count changes |
| 10 | planning/cycle-plan-2026-04-09.md | TBD | Cycle execution plan |
| 11 | references/authoring-best-practices-index-2026-04-09.md | 53 | 6 TAB reference, description quality, script design |
| 12 | diagnostic/harness-comprehensive-diagnostic-2026-04-09.md | — | Harness platform diagnostic |
| 13 | diagnostic/delegation-false-success-tool-anomalies-2026-04-09.md | — | Delegation failure forensics |
| 14 | diagnostic/post-fix-diagnostic-update-2026-04-09.md | — | Post-fix validation |
| 15 | forensic-delegation-failures-2026-04-09.md | — | Why delegation fails in this environment |

### Completed Supporting Artifacts (3 — executed directly after swarm failure)

| Artifact | Output File | Status | Key Finding |
|----------|-------------|--------|-------------|
| SKILL.md Body Scanner | inventory/current-state-rescan-2026-04-09.md | ✅ COMPLETE | 5 formulaic openings, 7 vocab leaks, 3 missing triggers |
| Dependency DAG Builder | planning/dependency-dag-2026-04-09.md | ✅ COMPLETE | 6-step critical path, 3 execution waves, risk per op |
| Target Architecture Specifier | planning/target-architecture-2026-04-09.md | ✅ COMPLETE | 20 target skills, B average, bundle standard defined |

---

## 2. Critical Issues (Must Fix Before Any Refactoring)

These block everything. Fix first, test, then proceed.

| ID | Issue | Skill | Impact | Fix |
|----|-------|-------|--------|-----|
| C1 | `validate-gate.sh synthesize` → guaranteed failure | skill-synthesis | Any synthesize-from-GitHub workflow crashes | Add `synthesize` action OR change SKILL.md to use `create` |
| C2 | 4 depth references are stubs | meta-builder | Agent loads empty files when routed | Write real content or remove references |
| C3 | Phantom `tech-stack.md` reference | oh-my-openagent-reference | Agent follows dead link | Generate file or remove from summary.md |
| C4 | Empty `project-structure.md` (4 lines) | oh-my-openagent-reference | No navigation of 276K-line reference | Regenerate with actual directory tree |
| C5 | Duplicate skills across .claude/ and .opencode/ | 5 skills | Source-of-truth ambiguity | Determine canonical, delete duplicates |

---

## 3. Systemic Issues (Affect 3+ Skills)

### S1. Internal Vocabulary Leak (7 skills)
- meta-builder: `/hf-create`, `/hf-audit`, `hivefiver-*`
- harness-audit: "audit harness" → "audit my project"
- harness-delegation-inspection: "GSD execution model"
- oh-my-openagent-reference: "OMO architecture"
- agent-authorization: "hivefiver-skill-author"
- eval-harness: "harness" → "eval-driven-development"
- session-context-manager: `.hivemind/state/` hardcoded paths

**Fix:** Description rewrite for all 7. Remove internal terms. Use universal trigger phrases.

### S2. Formulaic Description Pattern (5 skills)
All start with "This skill should be used when..." — identical first 6 words.

**Fix:** Active-voice lead. Unique opening per skill. Max 40 words.

### S3. Source-of-Truth Duplication (5+ skills)
coordinating-loop, phase-loop, planning-with-files, session-context-manager, user-intent-interactive-loop exist in both `.claude/` and `.opencode/` with diverging content.

**Fix:** Choose `.claude/skills/` as canonical. Merge unique content. Delete `.opencode/` duplicates.

### S4. Script Dependencies Without Fallbacks (6 skills)
If any script is missing, the skill's enforcement breaks silently.

**Fix:** Add inline fallback documentation for every script call.

---

## 4. Structural Changes (Merge / Split / Rename / Create)

### Merges (−1 skill)

| Source | Target | Rationale |
|--------|--------|-----------|
| session-context-manager | planning-with-files | Functional overlap — one cross-session persistence system. session-context-manager already FAIL. |

### Splits (+1 skill)

| Source | Result A | Result B | Rationale |
|--------|----------|----------|-----------|
| harness-delegation-inspection | subagent-delegation-patterns | opencode-project-inspection | Identity crisis — covers 4+ distinct concerns |

### Renames (0 net change)

| Current | Target | Rationale |
|---------|--------|-----------|
| eval-harness | eval-driven-development | Name collision with harness-writing external skill |
| harness-audit | opencode-project-audit | Remove internal vocabulary |
| agent-authorization | delegation-gates | Match actual purpose (gate checks, not authorization) |

### New Skills to Create (+2 skills)

| Name | Domain | Rationale |
|------|--------|-----------|
| eval-execution | Eval/Benchmarking | eval-harness is F-grade, unimplemented. Need working eval runner. |
| agent-lifecycle-events | Subagent Management | No skill covers spawn/inherit/progress/complete/fail/timeout events. |

### Net Change: 19 → 20 skills (+1 merge, +1 split, +2 create)

---

## 5. Execution Phases (Dependency Order)

```
Phase 0: CRITICAL FIXES (C1-C5)
    ↓
Phase 1: CANONICAL LOCATION + DUPLICATE RESOLUTION (S3)
    ↓
Phase 2: STRUCTURAL CHANGES (merge/split/rename/create)
    ↓
Phase 3: DESCRIPTION REWRITE SPRINT (S1, S2) — 11 skills
    ↓
Phase 4: SCRIPT DEPENDENCY HARDENING (S4) — 6 skills
    ↓
Phase 5: BODY QUALITY ENHANCEMENT + EVAL EXPANSION — 3-5 skills
```

Each phase requires **explicit user authorization** before execution.

---

## 6. Phase Details

### Phase 0: Critical Fixes
**Effort:** S (1-2 hours)
**Dependencies:** None
**Changes:** Fix C1-C5 bugs. No structural changes.

| Step | Action | Files |
|------|--------|-------|
| 0.1 | Add `synthesize` action to validate-gate.sh (or change SKILL.md) | skill-synthesis/scripts/validate-gate.sh or SKILL.md |
| 0.2 | Write real content for 4 depth references OR remove from SKILL.md | meta-builder/references/depth-*.md |
| 0.3 | Generate tech-stack.md for OMO reference | oh-my-openagent-reference/references/tech-stack.md |
| 0.4 | Regenerate project-structure.md with actual tree | oh-my-openagent-reference/references/project-structure.md |
| 0.5 | Determine canonical location (.claude/) and document decision | This plan |

**Verification:** Run each script manually. Confirm no phantom references.

### Phase 1: Canonical Location + Duplicate Resolution
**Effort:** M (2-4 hours)
**Dependencies:** Phase 0 complete
**Changes:** Structural only, no content changes.

| Step | Action |
|------|--------|
| 1.1 | Confirm `.claude/skills/` as canonical |
| 1.2 | Merge unique content from `.opencode/` versions |
| 1.3 | Delete `.opencode/` duplicates |
| 1.4 | Move eval-harness from `.agents/skills/` to `.claude/skills/` |

**Verification:** Grep for any remaining references to `.opencode/skills/` in SKILL.md files.

### Phase 2: Structural Changes
**Effort:** L (4-8 hours)
**Dependencies:** Phase 1 complete
**Changes:** Merge, split, rename, create.

| Step | Action | Risk |
|------|--------|------|
| 2.1 | Merge session-context-manager → planning-with-files | LOW — one is FAIL |
| 2.2 | Split harness-delegation-inspection → 2 new skills | MEDIUM — must preserve all content |
| 2.3 | Rename eval-harness → eval-driven-development | LOW — just directory rename |
| 2.4 | Rename harness-audit → opencode-project-audit | LOW — just directory rename |
| 2.5 | Rename agent-authorization → delegation-gates | LOW — just directory rename |
| 2.6 | Create eval-execution skill | MEDIUM — new skill from scratch |
| 2.7 | Create agent-lifecycle-events skill | MEDIUM — new skill from scratch |

**Verification:** All pair-of-3 and pair-of-2 configurations still work. Run `validate-gate.sh` on each modified skill.

### Phase 3: Description Rewrite Sprint
**Effort:** M (2-4 hours)
**Dependencies:** Phase 2 complete (names must be final)
**Changes:** Description field only in SKILL.md frontmatter.

11 skills need rewrite (ordered by priority):
1. use-authoring-skills — Zero trigger phrases (self-contradiction)
2. delegation-gates (was agent-authorization) — Internal vocab
3. opencode-project-audit (was harness-audit) — Internal vocab
4. subagent-delegation-patterns (from split) — New skill, new description
5. oh-my-openagent-reference — Assumes domain knowledge
6. eval-driven-development (was eval-harness) — No triggers
7. meta-builder — Trigger collision with children
8. skill-synthesis — Too narrow
9. agents-and-subagents-dev — Formulaic 68-word sentence
10. opencode-project-inspection (from split) — New skill
11. phase-loop — Search-index style

**Template for all rewrites:**
```
<active verb> <what it does>. Use when <5-10 natural trigger phrases separated by commas>. 
NOT for <when not to use>.
```

**Verification:** Run trigger-queries.json evals on each rewritten skill. Target: 80%+ pick-rate on should-trigger queries.

### Phase 4: Script Dependency Hardening
**Effort:** M (2-4 hours)
**Dependencies:** Phase 3 complete
**Changes:** Add inline fallback documentation to SKILL.md bodies.

6 skills with script dependencies:
1. coordinating-loop — 8 scripts → inline fallbacks for gate checks
2. user-intent-interactive-loop — 5 scripts → Gate 3 soft dependency
3. skill-synthesis — 7 scripts → prerequisite check
4. use-authoring-skills — 8+ scripts → hierarchy as warning not blocker
5. opencode-project-audit — 2 scripts → graceful degradation
6. planning-with-files — merged script from session-context-manager

**Also in Phase 4:**
- Resolve 11 orphan scripts (integrate into SKILL.md workflow or delete)
- Deduplicate byte-identical scripts across skills (shared-scripts/ or intentional duplication)

### Phase 5: Body Quality + Eval Expansion
**Effort:** XL (8-16 hours)
**Dependencies:** Phase 4 complete
**Changes:** Content enhancement for 3-5 skills, eval creation for 15 skills.

| Enhancement | Skills |
|-------------|--------|
| Add worked example | phase-loop |
| Add domain synthesis section | oh-my-openagent-reference |
| Explain agentskills.io inline | skill-synthesis |
| Create evals.json + trigger-queries.json | 15 skills currently without evals |
| Reduce meta-builder from 403L → ~200L | meta-builder |
| Expand phase-loop from 117L → ~200L | phase-loop |

**Target eval coverage:** 60% (12 of 20 skills with evals)

---

## 7. Expected Outcomes

### Before (Current)
- 19 skills (1 FAIL, 11 NEEDS_REFACTOR, 8 PASS)
- Average grade: C
- 34% orphan scripts, 25% eval coverage
- 7 skills with internal vocabulary leak
- 5+ duplicate locations
- 4 critical bugs, 8 red fail cases

### After (Target)
- 20 skills (0 FAIL, ≤3 NEEDS_REFACTOR, 17+ PASS)
- Average grade: B+
- 0% orphan scripts, 60% eval coverage
- 0 skills with internal vocabulary in descriptions
- Single canonical location (.claude/skills/)
- 0 critical bugs, 0 red fail cases from known issues

---

## 8. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Rename breaks agent definitions in .opencode/agents/ | MEDIUM | HIGH | Update agent skill references simultaneously |
| Split loses content from harness-delegation-inspection | LOW | HIGH | Full content inventory before split, compare after |
| New skills (eval-execution, agent-lifecycle-events) are low quality | MEDIUM | MEDIUM | Use gold-standard templates (hm-deep-research, command-dev) |
| Description rewrite reduces trigger accuracy | LOW | MEDIUM | Run trigger-queries.json before/after comparison |
| Shared scripts create coupling between skills | MEDIUM | MEDIUM | Keep intentional duplication for standalone operation |

---

## 9. Swarm Integration Points

When the 3 background swarms complete, their outputs integrate here:

### From: current-state-rescan-2026-04-09.md
> [PENDING — swarm running] Will validate that research data matches live state.

### From: dependency-dag-2026-04-09.md
> [PENDING — swarm running] Will refine Phase 0-5 ordering and identify parallelizable work.

### From: target-architecture-2026-04-09.md
> [PENDING — swarm running] Will validate skill count targets and naming conventions.

---

_Initial draft: 2026-04-09_
_Status: COMPLETE — all artifacts integrated_
_Author: Orchestrator (front-facing coordinator)_
_Sources: 19 research artifacts (16 prior + 3 direct execution)_
