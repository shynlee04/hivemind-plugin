---
version: 4.0
pipeline: prompt-enhance-repackage
generated: 2026-04-23
complexity: 10
confidence: high
phases_completed: [skim, bridge, investigation, clarification, repackage]
parent_session: multi-session
prompt_lineage: v1(original) → v2(2026-04-06) → v3(2026-04-10) → v4(this)

# GSD Mapping
gsd_project_active: true
gsd_current_phase: 16
playbook_phases: "0-5 mapped as continuation phases"
continuation_offset: 17

# Verification (Lane 2 findings)
skills_on_disk: 23
skills_with_evals: 5
skills_with_scripts: 7
symlinks_are_real_dirs: true
audit_artifacts_age_days: 14

# Risk flags (from Lane 3)
scope_creep: resolved_by_gsd_decomposition
context_poisoning: mitigated_by_progressive_disclosure
parallel_collision: resolved_by_gsd_continuation
oh_my_openagent_xml: 11MB_context_bomb
eval_coverage_gap: 19_of_23_missing_evals

# hm-* Rename Mandate
rename_mandate: true
rename_scope: 19 builtin skills
rename_excluded: gsd-agent-composition (third-party)
merged_skills: session-context-manager → planning-with-files

# Pipeline Metadata
investigation_lanes: [critic, context-mapper, risk-assessor]
critical_blockers_resolved: 2
high_findings: 5
user_concerns_covered_by_playbook: "10/12"
new_scope_not_in_playbook: [MCP-integration, debug-execution, research-investigation-synthesis]
---

# Enhanced Session Context Prompt v4

GSD phase-planning specification for the Hivemind Skills Refactor. This prompt
supersedes v3's tiered audit approach with a structurally grounded plan that
maps the HIVEMIND-SKILLS-REFACTOR-PLAYBOOK's 6 phases into continuation phases
within the user's existing GSD project.

---

## Section 1: Resolved Intent

Plan and execute GSD phases for skills refactoring in the HiveMind framework,
targeting skills first as universal glue between the soft meta-concepts layer
and the hard harness. The refactoring acknowledges both Hivefiver (meta-builder
lineage) and Hiveminder (project-builder lineage) while enforcing a single
canonical location for all skill artifacts. The HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md
at `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` is the
authoritative reference for constitution, philosophy, quality gates, and
phase ordering.

**What this cycle delivers:**

- All 23 live skills renamed to `hm-*` prefix (19 renames + 1 merge + 1 kept + 2 new)
- All skills audited against the 6-criterion gate (Playbook Part V §V.2)
- All skills scored by `skill-judge` to target grade or documented exception
- Eval coverage raised from 22% (5/23) to 60%+ (14/23)
- Critical bugs (C1–C5 from Playbook §VI.2) resolved
- GSD phase-planning documents written for each continuation phase

**What this cycle does NOT deliver:**

- Hard harness `src/` code changes (separate GSD milestone)
- Agent or command refactoring (subsequent cycle after skills are locked)
- New skill creation beyond the 2 identified gaps (MCP integration, debug-execution)

---

## Section 2: Scope Boundaries

### IN Scope

- All 23 skills currently in `.opencode/skills/` (verified on disk 2026-04-23)
- The skills lab at `.hivefiver-meta-builder/skills-lab/active/refactoring/`
- Rename operations (`hm-*` prefix mandate)
- Merge operation (`session-context-manager` → `planning-with-files`)
- Eval creation for skills lacking evals (19 of 23)
- Description rewrites for vocabulary leaks and formulaic patterns
- Script hardening (fallback procedures for 6 skills with scripts)
- Progressive disclosure enforcement across all skill bodies

### OUT of Scope

- Hard harness source code (`src/` — tools, hooks, plugin, lib)
- Agent definitions (`.opencode/agents/` — subsequent cycle)
- Command definitions (`.opencode/commands/` — subsequent cycle)
- Workflow definitions (`.hivefiver-meta-builder/workflows-lab/` — subsequent cycle)
- Greenfield skill creation (only 2 new skills identified as gaps)
- Runtime compilation model implementation (design only in this cycle)

### BRIDGE (Soft → Hard)

Skills serve as the bridge between soft meta-concepts and the hard harness.
The soft→hard graduation path:

1. Skills START as soft meta-concepts in the lab (`.hivefiver-meta-builder/skills-lab/`)
2. Skills are symlinked into `.opencode/skills/` for live testing
3. Validated skills enable limited non-breaking config extensions in the hard harness
4. MCP/guardrails/pipeline skills serve BOTH Hivefiver and Hiveminder lineages

**Bridge constraint:** Skills may reference hard harness types (from `src/lib/types.ts`)
but must not import them. Runtime probes (`ls`/`test -f`) gate harness-specific paths.

---

## Section 3: Architectural Decisions

### Decision 1: hm-* Suffix Mandate

**Status:** APPROVED by user (clarification Q3)

ALL Hivemind-builtin skills rename to `hm-*` prefix. This provides:
- Clear namespace separation from third-party skills (GSD, etc.)
- Single-command management (`ls .opencode/skills/hm-*`)
- Graduation path from soft to hard without name collision
- Third-party skills (e.g., `gsd-agent-composition`) retain their native prefix

### Decision 2: Runtime Compilation Model

**Status:** APPROVED by user (clarification Q3)

Skills register third-party frameworks as selectable options. Users pick one
consistent framework or use native `hm-*` alternatives. Skills serve as
adapters. This means:

- `hm-*` skills never hard-depend on GSD, BMAD, or OMO
- Each `hm-*` skill that has a third-party equivalent documents both paths
- The runtime compilation selector lives in the harness config (`opencode.json`)
- Skills use `probe-don't-assume` pattern (Playbook §V.1)

### Decision 3: Soft→Hard Bridge Model

**Status:** APPROVED by user (clarification Q2)

Skills bridge soft→hard. They START as soft meta-concepts serving both Hivefiver
and Hiveminder. Once validated, they enable limited non-breaking config extensions
to the hard harness. This means:

- No skill may modify `src/` files directly
- Skills may define configuration schemas that the hard harness reads
- Validated skills earn a `metadata.requires-harness: true` frontmatter flag
- The graduation gate requires: eval coverage ≥ 60%, skill-judge score ≥ B+, no dead references

### Decision 4: GSD Phase Mapping

**Status:** APPROVED by user (clarification Q1)

The playbook's 6-phase plan (Phase 0–5) maps into continuation phases within
the user's existing GSD project (currently at phase 16). Playbook phases become
GSD continuation phases, not independent phases:

```
Playbook Phase 0 (Critical Fixes)      → GSD Phase 17
Playbook Phase 1 (Canonical Location)  → GSD Phase 18
Playbook Phase 2 (Structural Changes)  → GSD Phase 19
Playbook Phase 3 (Description Rewrite) → GSD Phase 20
Playbook Phase 4 (Script Hardening)    → GSD Phase 21
Playbook Phase 5 (Body Quality + Eval) → GSD Phase 22
```

Each continuation phase requires explicit user authorization before execution,
following the GSD discuss→plan→execute cycle.

---

## Section 4: Phase Decomposition (GSD Continuation Numbering)

### Phase 17: Critical Fixes (Playbook Phase 0)

**Goal:** Resolve all critical bugs before any structural work begins.
**Depends on:** GSD Phase 16 completion
**Scope:** 5 critical issues (C1–C5)

| ID | Issue | Skill | Fix |
|----|-------|-------|-----|
| C1 | `validate-gate.sh synthesize` guaranteed failure | `hm-skill-synthesis` | Add `synthesize` action OR change SKILL.md to use `create` |
| C2 | 4 depth references are stubs | `hm-meta-builder` | Write real content or remove references |
| C3 | Phantom `tech-stack.md` reference | `hm-omo-reference` | Generate file or remove from `summary.md` |
| C4 | Empty `project-structure.md` (4 lines) | `hm-omo-reference` | Regenerate with actual directory tree |
| C5 | Duplicate skills across `.claude/` and `.opencode/` | 5 skills | Determine canonical, delete duplicates |

**Exit criteria:** All 5 criticals resolved, `npm run typecheck` passes (if applicable), no dead references in affected skills.

### Phase 18: Canonical Location + Duplicate Resolution (Playbook Phase 1)

**Goal:** Establish single source of truth, eliminate `.claude/` vs `.opencode/` drift.
**Depends on:** Phase 17

- Verify all `.opencode/skills/` directories are real copies (Lane 2 confirmed: NOT symlinks)
- Determine canonical location: `.hivefiver-meta-builder/skills-lab/active/refactoring/` as source
- For each duplicate: compare content, merge unique parts, delete the non-canonical copy
- Update AGENTS.md and playbook references to reflect canonical paths

**Exit criteria:** Zero duplicates, canonical location documented, all skill paths resolve correctly.

### Phase 19: Structural Changes (Playbook Phase 2)

**Goal:** Execute renames, merges, splits, and create new skills.
**Depends on:** Phase 18

#### Rename Operations (19 skills → `hm-*` prefix)

| Current Name | New Name | Layer | Task Group |
|-------------|----------|-------|------------|
| `meta-builder` | `hm-meta-builder` | 0 | How-to-Process |
| `use-authoring-skills` | `hm-skill-authoring` | 4 | How-to-Process |
| `coordinating-loop` | `hm-coordinating-loop` | 1 | How-to-Process |
| `planning-with-files` | `hm-planning-with-files` | 1 | How-to-Process |
| `user-intent-interactive-loop` | `hm-user-intent-loop` | 1 | How-to-Process |
| `agents-and-subagents-dev` | `hm-agent-development` | 2 | How-to-Implement |
| `command-dev` | `hm-command-dev` | 2 | How-to-Implement |
| `custom-tools-dev` | `hm-custom-tools` | 2 | How-to-Implement |
| `opencode-platform-reference` | `hm-platform-reference` | 3 | Reference |
| `opencode-non-interactive-shell` | `hm-shell-safety` | 2 | How-to-Implement |
| `oh-my-openagent-reference` | `hm-omo-reference` | 3 | Reference |
| `phase-loop` | `hm-phase-loop` | 2 | How-to-Process |
| `hf-context-absorb` | `hm-context-absorb` | 1 | How-to-Process |
| `harness-audit` | `hm-project-audit` | 2 | How-to-Process |
| `harness-delegation-inspection` | `hm-delegation-patterns` | 2 | How-to-Implement |
| `agent-authorization` | `hm-delegation-gates` | 2 | How-to-Process |
| `agents-md-sync` | `hm-agents-sync` | 2 | How-to-Implement |
| `command-parser` | `hm-command-parser` | 2 | How-to-Implement |
| `hm-deep-research` | `hm-deep-research` (already prefixed) | 2 | How-to-Implement |
| `hm-detective` | `hm-detective` (already prefixed) | 2 | How-to-Implement |
| `hm-synthesis` | `hm-synthesis` (already prefixed) | 2 | How-to-Implement |

#### Merge Operations

| Source | Into | Rationale |
|--------|------|-----------|
| `session-context-manager` (FAIL grade) | `hm-planning-with-files` | Functional overlap — one cross-session persistence system |

#### Skills Unchanged

| Name | Reason |
|------|--------|
| `gsd-agent-composition` | Third-party skill (GSD lineage), retains native prefix |

#### New Skills (Gaps)

| New Name | Domain | Template | Justification |
|----------|--------|----------|---------------|
| `hm-mcp-integration` | MCP server wiring for skills | `hm-deep-research` (methodology) | No skill covers MCP integration patterns — genuinely new scope |
| `hm-debug-execution` | Debug-to-fix workflow for agents | `hm-command-dev` (lean pattern) | Debug/refactor/planning sector not covered — genuinely new scope |

**Post-Phase 19 inventory:** 21 `hm-*` skills + 1 third-party = 22 total

**Exit criteria:** All renames committed atomically, all cross-references updated, merge complete, new skills scaffolded, `skill-judge` scores documented for all.

### Phase 20: Description Rewrite Sprint (Playbook Phase 3)

**Goal:** Fix all vocabulary leaks and formulaic descriptions.
**Depends on:** Phase 19

- Rewrite 7 skills with internal vocabulary leaks (harness, OMO, GSD, /hf-*, hivefiver-*)
- Rewrite 5 skills with formulaic "This skill should be used when..." openers
- Enforce description template: `<active verb> <what it does ≤10 words>. Use when <5-8 triggers>. NOT for <1-2 exclusions>.`
- Run `check-overlaps.sh` after every rewrite to catch trigger-phrase collisions
- Verify no description contains banned keywords: "grep", "glob", "quick-search"

**Exit criteria:** Zero vocabulary leaks, zero formulaic openers, all descriptions use active voice, trigger phrases unique per skill.

### Phase 21: Script Dependency Hardening (Playbook Phase 4)

**Goal:** Ensure all scripts have real validation logic and fallback procedures.
**Depends on:** Phase 20

- 6 skills with scripts need fallback procedures in SKILL.md body
- Remove stub scripts that exit 0 unconditionally
- Add inline fallback procedure in body for every script call
- Verify `validate-gate.sh` and `validate-skill.sh` work for all 22 skills

**Exit criteria:** All scripts have real validation logic, all script calls have body fallbacks, zero stub scripts.

### Phase 22: Body Quality + Eval Expansion (Playbook Phase 5)

**Goal:** Raise all skills to target grade, fill eval coverage gap.
**Depends on:** Phase 21

- Run `skill-judge` on all 22 skills
- For each skill below target grade: iterative refinement (up to 3 cycles)
- Create evals for 9 additional skills (target: 14/22 = 64% coverage)
- Progressive disclosure enforcement: ≤500 LOC body, references for >200 LOC detail
- Cross-reference integrity verification across all skills

**Exit criteria:** All skills at target grade or documented exception, eval coverage ≥60%, no dead references, no body exceeds 500 LOC.

---

## Section 5: Skill Inventory & Renaming Map

### Current State (verified 2026-04-23)

| # | Current Name | Has SKILL.md | Has Evals | Has Scripts | MCP Refs | Rename Target |
|---|-------------|:---:|:---:|:---:|:---:|-------------|
| 1 | `meta-builder` | Yes | No | No | Exa | `hm-meta-builder` |
| 2 | `use-authoring-skills` | Yes | No | Yes | — | `hm-skill-authoring` |
| 3 | `agents-and-subagents-dev` | Yes | No | No | Exa | `hm-agent-development` |
| 4 | `command-dev` | Yes | No | No | Exa | `hm-command-dev` |
| 5 | `custom-tools-dev` | Yes | No | No | Exa | `hm-custom-tools` |
| 6 | `coordinating-loop` | Yes | No | No | — | `hm-coordinating-loop` |
| 7 | `phase-loop` | Yes | No | No | — | `hm-phase-loop` |
| 8 | `planning-with-files` | Yes | No | No | — | `hm-planning-with-files` |
| 9 | `user-intent-interactive-loop` | Yes | No | No | — | `hm-user-intent-loop` |
| 10 | `opencode-platform-reference` | Yes | No | No | — | `hm-platform-reference` |
| 11 | `opencode-non-interactive-shell` | Yes | No | No | — | `hm-shell-safety` |
| 12 | `oh-my-openagent-reference` | Yes | No | No | Exa (615 refs) | `hm-omo-reference` |
| 13 | `hm-deep-research` | Yes | Yes | Yes | Tavily, Exa | (already prefixed) |
| 14 | `hm-detective` | Yes | Yes | No | Exa, Context7 | (already prefixed) |
| 15 | `hm-synthesis` | Yes | Yes | No | Repomix | (already prefixed) |
| 16 | `hf-context-absorb` | Yes | No | No | — | `hm-context-absorb` |
| 17 | `harness-audit` | Yes | No | No | — | `hm-project-audit` |
| 18 | `harness-delegation-inspection` | Yes | No | No | — | `hm-delegation-patterns` |
| 19 | `agent-authorization` | Yes | No | No | — | `hm-delegation-gates` |
| 20 | `gsd-agent-composition` | Yes | No | No | — | (unchanged — third-party) |
| 21 | `command-parser` | Yes | No | No | — | `hm-command-parser` |
| 22 | `agents-md-sync` | Yes | No | No | — | `hm-agents-sync` |
| 23 | `session-context-manager` | Yes | No | No | — | MERGE → `hm-planning-with-files` |

### Summary

- **23 skills** on disk, all with SKILL.md
- **5/23** have evals (21.7% — target: 60%+)
- **7/23** have scripts
- **19** need `hm-*` rename
- **1** needs merge (`session-context-manager`)
- **1** unchanged (`gsd-agent-composition`)
- **3** already prefixed (`hm-deep-research`, `hm-detective`, `hm-synthesis`)
- **16/23** reference Exa MCP; 4 reference Context7; 6 reference Repomix

---

## Section 6: Gaps Requiring New Skills

### Gap 1: MCP Integration

**Severity:** High
**Justification:** Lane 2 found 16/23 skills reference Exa MCP, 4 reference Context7, 6 reference Repomix. No skill teaches MCP server wiring patterns for skill authors. This is genuinely new scope not covered by the playbook.
**Proposed skill:** `hm-mcp-integration`
**Template:** `hm-deep-research` (methodology pattern)
**Content:** MCP server registration, tool selection patterns, probe-don't-assume for MCP availability, fallback when MCP is offline

### Gap 2: Debug-to-Execution Pipeline

**Severity:** High
**Justification:** The debug/refactor/planning sector has no skill coverage. Agents need a structured debug→hypothesize→fix→verify workflow that integrates with the 3-level-depth coordination model.
**Proposed skill:** `hm-debug-execution`
**Template:** `hm-command-dev` (lean pattern)
**Content:** Hypothesis-driven debugging, isolation strategies, fix-verify-commit cycles, subagent dispatch for parallel investigation

### Gap 3: Research-Investigation-Synthesis Pipeline

**Severity:** Medium
**Justification:** `hm-deep-research`, `hm-detective`, and `hm-synthesis` form a natural pipeline but have no orchestration skill connecting them. Currently users must manually chain these three.
**Recommendation:** Extend `hm-planning-with-files` with a R-I-S pipeline reference rather than creating a new skill. The three skills already exist; the gap is orchestration, not capability.

### Gap 4: Spec-Driven Development

**Severity:** Medium
**Justification:** No skill enforces spec-first development (write spec → verify spec → implement → verify implementation). The playbook's `validate-gate.sh` pattern partially addresses this but is script-only, not a skill.
**Recommendation:** Extend `hm-skill-authoring` with a spec-driven development reference rather than creating a new skill. The authoring skill already gates on `validate-gate.sh`; the gap is documentation of the spec-first pattern, not a new capability.

---

## Section 7: Blockers to Resolve First

### Blocker 1: Symlinks Are Real Directories (DRIFT RISK)

**Source:** Lane 2 (Context Mapper)
**Finding:** `.opencode/skills/` directories are REAL COPIES, not symlinks to labs. The playbook (§I.4) assumes symlinks. Changes in `.opencode/` will NOT propagate to labs.
**Impact:** HIGH — editing `.opencode/skills/` directly creates drift from the canonical lab source.
**Resolution required:** Phase 18 must either:
  (a) Re-establish symlinks from `.opencode/skills/` → `.hivefiver-meta-builder/skills-lab/active/refactoring/`, OR
  (b) Accept real copies as canonical and update playbook to match reality
**Recommendation:** (b) — the worktree has evolved past symlinks. Update documentation.

### Blocker 2: Stale Audit Artifacts (14 days old)

**Source:** Lane 2 (Context Mapper)
**Finding:** Audit artifacts in `.hivemind/research/skills-audit/` are dated 2026-04-09 (14 days old). Skill inventory may have drifted.
**Impact:** MEDIUM — baseline data for planning may be inaccurate.
**Resolution required:** Phase 17 pre-flight must verify current skill state against audit artifacts. Re-audit if significant drift detected.

### Blocker 3: Eval Coverage Gap (78.3% missing)

**Source:** Lane 2 (Context Mapper)
**Finding:** 19 of 23 skills have no evals. The target is 60%+ coverage.
**Impact:** HIGH — cannot validate skill quality without evals.
**Resolution required:** Phase 22 must create evals for ≥9 additional skills. Each eval needs trigger queries + evaluation datasets.

### Blocker 4: Context Bomb (oh-my-openagent-full.xml)

**Source:** v3 prompt, confirmed by Lane 2
**Finding:** `.opencode/skills/oh-my-openagent-reference/references/oh-my-openagent-full.xml` is 11MB (615 Exa references). Full read blows context window.
**Impact:** CRITICAL — any agent that reads this file fully will crash.
**Resolution required:** Maintain constraint: NEVER read fully. Use grep/chunked reads only. Add `metadata.context-bomb: true` to SKILL.md frontmatter as a warning signal.

### Blocker 5: `.claude/` vs `.opencode/` Duplicates

**Source:** Playbook §VI.2 (C5)
**Finding:** 5+ skills exist in both `.claude/skills/` and `.opencode/skills/`. Content may differ between locations.
**Impact:** HIGH — agents may load different versions depending on platform.
**Resolution required:** Phase 18 resolves this. Choose `.opencode/skills/` as canonical; delete `.claude/skills/` duplicates after merge.

---

## Section 8: Success Criteria (Measurable, Per Phase)

### Phase 17 (Critical Fixes)

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| C1–C5 resolved | Each critical has fix committed | 5/5 |
| No dead references | `grep -r "tech-stack.md"` in affected skills | 0 matches |
| validate-gate.sh works | `bash scripts/validate-gate.sh` for each affected skill | exit 0 |

### Phase 18 (Canonical Location)

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| Zero duplicates | `diff <(.claude/skills/) <(.opencode/skills/)` | 0 diffs |
| Canonical documented | AGENTS.md updated with single source | Yes/No |
| Skill paths resolve | All 23 SKILL.md files readable from canonical path | 23/23 |

### Phase 19 (Structural Changes)

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| Renames complete | `ls .opencode/skills/hm-*/SKILL.md` | 21 files |
| Merge complete | `session-context-manager` dir removed, `hm-planning-with-files` has merged content | Yes/No |
| Cross-refs updated | `grep -r "session-context-manager" .opencode/` | 0 matches |
| New skills scaffolded | `hm-mcp-integration` and `hm-debug-execution` exist with SKILL.md | 2/2 |
| Atomic commits | One commit per rename/merge/create | Yes/No |

### Phase 20 (Description Rewrite)

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| Zero vocabulary leaks | `grep -E "harness\|OMO\|GSD\|/hf-\*\|hivefiver-" .opencode/skills/*/SKILL.md frontmatter` | 0 in descriptions |
| Zero formulaic openers | Descriptions start with unique active verb | 22/22 |
| Unique triggers | `check-overlaps.sh` passes | exit 0 |
| No banned keywords | `grep -E "\"grep\"\|\"glob\"\|\"quick-search\"" .opencode/skills/*/SKILL.md` | 0 matches |

### Phase 21 (Script Hardening)

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| No stub scripts | All scripts exit non-zero on failure | 7/7 verified |
| Body fallbacks present | Every script call in SKILL.md has inline fallback | 100% |
| validate-skill.sh passes | Per-skill validation | exit 0 for all |

### Phase 22 (Body Quality + Eval Expansion)

| Criterion | Measurement | Target |
|-----------|-------------|--------|
| skill-judge scores | All skills at target grade or documented exception | 22/22 |
| Eval coverage | Skills with evals / total skills | ≥14/22 (64%) |
| Progressive disclosure | No SKILL.md body exceeds 500 LOC | 0 violations |
| Cross-reference integrity | All internal references resolve on disk | 100% |
| No dead references | `grep` for missing file paths | 0 matches |

---

## Section 9: Risk Mitigations

### Risk 1: Context Bomb (oh-my-openagent-full.xml)

**Severity:** CRITICAL
**Mitigation:** NEVER read the full 11MB XML file. Use `grep` with targeted patterns or read SKILL.md (metadata only). If deep patterns are needed, chunked offset reads of max 200 lines. Add `metadata.context-bomb: true` frontmatter warning.
**Status:** MITIGATED — carried forward from v3, confirmed by Lane 2

### Risk 2: Scope Creep Across GSD Phases

**Severity:** HIGH → RESOLVED
**Original risk:** Skills refactoring could expand to agents, commands, workflows.
**Mitigation:** Decomposed into 6 sequential GSD continuation phases (17–22) with explicit scope per phase. Each phase gates the next. Agent/command refactoring explicitly deferred to subsequent GSD milestone.
**Status:** RESOLVED by GSD phase decomposition

### Risk 3: Context Poisoning from v3 Session State

**Severity:** HIGH → MITIGATED
**Original risk:** v3 prompt at `.hivemind/state/session-context-prompt.md` is 865 lines with stale data from 2026-04-07 through 2026-04-10.
**Mitigation:** v4 is a clean specification document, not an append-only log. v3 is preserved for reference but v4 is the active specification. Progressive disclosure enforced.
**Status:** MITIGATED by clean rewrite

### Risk 4: Parallel Plan Collision

**Severity:** HIGH → RESOLVED
**Original risk:** Playbook phases could collide with other active GSD work.
**Mitigation:** Playbook phases mapped into GSD continuation numbering (17–22). No parallel execution across phases. Sequential dependency chain enforced.
**Status:** RESOLVED by mapping into GSD continuation

### Risk 5: Rename Cascade Breaking References

**Severity:** HIGH
**Risk:** Renaming 19 skills could break references in agents, commands, and other skills.
**Mitigation:**
  - Phase 19 executes renames atomically with per-rename commits
  - Cross-reference update pass follows each rename
  - `grep -r "<old-name>" .opencode/` verification after each rename
  - Rollback via `git revert` if cascade detected
**Status:** MITIGATED by atomic commits + verification

### Risk 6: Eval Creation Bottleneck

**Severity:** MEDIUM
**Risk:** Creating 9+ eval sets is labor-intensive and could delay Phase 22.
**Mitigation:**
  - Use `skill-creator` eval scaffolding for initial datasets
  - Prioritize skills with highest usage (Lane 2 MCP ref counts as proxy)
  - Accept 50% coverage as minimum viable if 60% is blocked
**Status:** ACCEPTED — Phase 22 may partially complete

---

## Section 10: Canonical References

### Primary References (on disk)

| Purpose | Path |
|---------|------|
| **Skills Refactor Playbook** (canonical) | `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` |
| Hivemind Philosophy | `docs/draft/HIVEMIND-PHILOSOPHY-2026-04-10.md` |
| Hivemind Architecture | `docs/draft/HIVEMIND-ARCHITECTURE-2026-04-10.md` |
| Hivemind Agents Ecosystem | `docs/draft/HIVEMIND-AGENTS-2026-04-10.md` |
| Current Situations | `docs/draft/CURRENT-SITUATIONS-2026-04-10.md` |
| Hivefiver Root AGENTS | `.hivefiver-meta-builder/AGENTS.md` |
| Onboarding Protocol | `.hivefiver-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md` |
| Skill Criteria Short | `.hivefiver-meta-builder/SKILL-CRITERIA-SHORT.md` |
| Skills Audit Master Plan | `.hivemind/research/skills-audit/planning/master-revamp-plan-2026-04-09.md` |
| Target Architecture | `.hivemind/research/skills-audit/planning/target-architecture-2026-04-09.md` |
| Cross-Batch Findings | `.hivemind/research/skills-audit/synthesis/cross-batch-findings-2026-04-09.md` |
| Skills Lab (canonical source) | `.hivefiver-meta-builder/skills-lab/active/refactoring/` |
| Hard Harness Source | `src/` |
| Live Skill Directories | `.opencode/skills/` |
| Project AGENTS.md | `AGENTS.md` |
| v3 Session Context (historical) | `.hivemind/state/session-context-prompt.md` |

### Global Tools (runtime-probed)

| Tool | Location | Purpose |
|------|----------|---------|
| `skill-creator` | `~/.agents/skills/skill-creator/` | Scaffold new skills |
| `skill-judge` | `~/.agents/skills/skill-judge/` | Grade skills against rubrics |
| `skill-writing` | `use-authoring-skills` (in-repo) | Author/refactor skills in lab |

### Investigation Lane Sources

| Lane | Agent | Key Finding |
|------|-------|-------------|
| Critic | `context-mapper` subagent | 2 critical blockers resolved, 5 high findings, 10/12 user concerns covered |
| Context Mapper | `context-mapper` subagent | 23 skills verified, 5 with evals, symlinks are real dirs, 14-day-old audit |
| Risk Assessor | `risk-assessor` subagent | Scope creep resolved, context poisoning mitigated, 5-phase decomposition recommended |

---

## Execution Protocol

This specification is consumed by GSD discuss→plan→execute cycle. For each continuation phase (17–22):

1. **Discuss:** Load this section + the relevant playbook part via `/gsd-discuss-phase`
2. **Plan:** Generate PLAN.md via `/gsd-plan-phase` with task breakdown
3. **Execute:** Run via `/gsd-execute-phase` with wave-based parallelization
4. **Verify:** Run `/gsd-verify-work` against phase success criteria
5. **Review:** Run `/gsd-code-review` on all changed files

**Loading order for each phase:**
1. This v4 prompt (specification)
2. Playbook relevant part (constitution + phase-specific section)
3. `hm-skill-authoring` (the skill that does the actual work)
4. `skill-judge` (quality gate)

**Max 3 skills per agent turn** (Iron Law #2). Stack: `hm-skill-authoring` + `skill-judge` + `hm-platform-reference`.

---

## Status

- Status: **DONE_WITH_CONCERNS**
  - All 10 sections assembled from investigation lane findings
  - 4 architectural decisions grounded in user clarifications
  - 6 GSD continuation phases mapped (17–22)
  - Concerns: 5 blockers require resolution before Phase 17 begins; eval coverage gap (78.3% missing) is the most resource-intensive concern
- Artifacts: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivemind/state/session-context-prompt-v4.md`
- Summary: This enhanced prompt specifies the complete GSD phase-planning for the Hivemind Skills Refactor, mapping the playbook's 6-phase plan into continuation phases 17–22 within the user's existing GSD project. It covers the hm-* rename mandate for 19 builtin skills, 1 merge, 2 new skill gaps (MCP integration, debug-execution), a soft→hard bridge model, and a runtime compilation model for third-party framework coexistence. Five blockers are identified for pre-flight resolution: symlink drift, stale audit artifacts, eval coverage gaps, context bomb in oh-my-openagent XML, and .claude/.opencode duplicates.
