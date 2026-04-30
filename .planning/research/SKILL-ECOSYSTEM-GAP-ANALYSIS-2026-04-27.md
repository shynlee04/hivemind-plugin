# Skill Ecosystem Gap Analysis & Reclassification

**Date:** 2026-04-27
**Source:** 4 parallel RICH-gate audits of all 36 skills + user directives
**Status:** Synthesis complete — ready for phase planning

---

## Executive Summary

**Finding:** 0 of 36 skills pass full RICH gates. The ecosystem is fragmented with broken cross-references, missing lineage routing, and no GSD-style artifact hierarchy. Major reclassification needed: skills that are actually internal-use, hf-* meta-builder, or candidates for replacement/removal must be identified and actioned.

---

## Part 1: Skill Reclassification Matrix

Based on audit findings + user directives, every skill must be classified into one of:

| Classification | Meaning | Action |
|---------------|---------|--------|
| **SHIP (hm-*)** | Ships with harness, runs in end-user projects | Keep, harden to RICH gates |
| **SHIP (hf-*)** | Ships as meta-builder tools | Keep/rename, harden to RICH gates |
| **INTERNAL-USE** | Runtime creation, serves THIS project only | Keep as-is (no shipping burden) |
| **REPLACE** | Not worth modifying, needs complete rewrite | Create replacement, then archive old |
| **REMOVE** | Overlapping, irrelevant, or no longer needed | Archive/deprecate |
| **RENAME** | Wrong prefix (hm→hf or hf→hm) | Rename and update all references |

### Classification of ALL 36 Skills

| # | Current Name | New Classification | Reason |
|---|-------------|-------------------|--------|
| 1 | `gate-evidence-truth` | **INTERNAL-USE** | Serves THIS project's quality gatekeeping, not shipped to end users |
| 2 | `gate-lifecycle-integration` | **INTERNAL-USE** | Serves THIS project's quality gatekeeping |
| 3 | `gate-spec-compliance` | **INTERNAL-USE** | Serves THIS project's quality gatekeeping |
| 4 | `hm-agent-composition` | **RENAME → `hf-agent-composition`** | Meta-builder concern: teaches agents how to compose other agents |
| 5 | `hm-agents-md-sync` | **RENAME → `hf-agents-md-sync`** | Meta-builder maintenance: syncs AGENTS.md with codebase |
| 6 | `hm-command-parser` | **RENAME → `hf-command-parser`** | Meta-builder utility: parses propositional command syntax |
| 7 | `hm-completion-looping` | **SHIP (hm-*)** | Core harness feature: guardrails against premature completion |
| 8 | `hm-coordinating-loop` | **SHIP (hm-*)** | Core harness feature: multi-agent coordination — BUT needs refactor |
| 9 | `hm-debug` | **SHIP (hm-*)** | End-user need: systematic debugging with persistence |
| 10 | `hm-deep-research` | **SHIP (hm-*)** | End-user need: version-matched deep research |
| 11 | `hm-detective` | **SHIP (hm-*)** | End-user need: codebase investigation with reading modes |
| 12 | `hm-meta-builder` | **INTERNAL-USE** | Internal routing hub for this project's meta-concept creation |
| 13 | `hm-omo-reference` | **REMOVE** | Outdated/static reference; replaced by `hm-opencode-platform-reference` |
| 14 | `hm-opencode-non-interactive-shell` | **INTERNAL-USE** | Shell safety for agent execution in THIS project |
| 15 | `hm-opencode-platform-reference` | **INTERNAL-USE** | Platform reference for THIS project's development |
| 16 | `hm-opencode-project-audit` | **INTERNAL-USE** | Audits THIS project's OpenCode setup |
| 17 | `hm-opencode-project-inspection` | **REMOVE** | Overlaps with `hm-opencode-project-audit` (95% same scope) |
| 18 | `hm-phase-execution` | **SHIP (hm-*)** | End-user need: wave-based phase execution |
| 19 | `hm-phase-loop` | **SHIP (hm-*)** | End-user need: iterative phase loops |
| 20 | `hm-refactor` | **SHIP (hm-*)** | End-user need: surgical vs structural refactoring |
| 21 | `hm-research-chain` | **SHIP (hm-*)** | End-user need: canonical research pipeline |
| 22 | `hm-skill-synthesis` | **RENAME → `hf-skill-synthesis`** | Meta-builder: synthesizes skills from repos |
| 23 | `hm-spec-driven-authoring` | **SHIP (hm-*)** | End-user need: spec-locking from PRD |
| 24 | `hm-subagent-delegation-patterns` | **SHIP (hm-*)** | Core harness feature: delegation patterns |
| 25 | `hm-synthesis` | **SHIP (hm-*)** | End-user need: research compression/artifact export |
| 26 | `hm-test-driven-execution` | **SHIP (hm-*)** | End-user need: RED/GREEN/REFACTOR with runtime truth |
| 27 | `hm-user-intent-interactive-loop` | **SHIP (hm-*)** | End-user need: intent clarification before delegation |
| 28 | `hivefiver-agents-and-subagents-dev` | **SHIP (hf-*)** | Meta-builder: agent creation/audit |
| 29 | `hivefiver-command-dev` | **SHIP (hf-*)** | Meta-builder: command creation/audit |
| 30 | `hivefiver-context-absorb` | **SHIP (hf-*)** | Meta-builder: multi-wave context absorption |
| 31 | `hivefiver-custom-tools-dev` | **SHIP (hf-*)** | Meta-builder: custom tool creation |
| 32 | `hivefiver-delegation-gates` | **INTERNAL-USE** | Serves THIS project's delegation gatekeeping |
| 33 | `hivefiver-use-authoring-skills` | **SHIP (hf-*)** | Meta-builder: skill authoring/audit/validation |
| 34 | `opencode-config-workflow` | **REPLACE** | Single-file skill with zero bundled resources, zero cross-references |
| 35 | `donotusethis-hm-planning-with-files` | **REPLACE** | Already disabled. 9 skills still reference it. Need GSD-style replacement. |
| 36 | `hm-skill-synthesis` (22) | **RENAME → `hf-skill-synthesis`** | Already counted above |

### Summary Counts

| Classification | Count | Skills |
|---------------|-------|--------|
| **SHIP (hm-*)** | 14 | completion-looping, coordinating-loop, debug, deep-research, detective, phase-execution, phase-loop, refactor, research-chain, spec-driven-authoring, subagent-delegation-patterns, synthesis, test-driven-execution, user-intent-interactive-loop |
| **SHIP (hf-*)** | 5+4=9 | agents-and-subagents-dev, command-dev, context-absorb, custom-tools-dev, use-authoring-skills + 4 renamed from hm (agent-composition, agents-md-sync, command-parser, skill-synthesis) |
| **INTERNAL-USE** | 9 | gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance, hm-meta-builder, hm-opencode-non-interactive-shell, hm-opencode-platform-reference, hm-opencode-project-audit, hivefiver-delegation-gates |
| **REMOVE** | 2 | hm-omo-reference, hm-opencode-project-inspection |
| **REPLACE** | 2 | opencode-config-workflow, hm-planning-with-files |

---

## Part 2: Critical Integration Gaps (From Audit Cross-Reference Analysis)

### GAP-CR-01: `hm-planning-with-files` is disabled but 9 skills depend on it
- 9 skills reference it as active dependency
- 2 agent definitions permit it
- Impact: All coordination, debugging, phase execution lose persistence layer
- **Fix:** Create `hm-artifact-hierarchy` as GSD-style replacement (see Part 3)

### GAP-CR-02: 17 of 19 skill pair references are one-directional
- Only 11% of skill pairs have bidirectional references
- Most skills don't know who consumes them

### GAP-CR-03: 8 name prefix inconsistencies
- `agents-and-subagents-dev` should be `hivefiver-agents-and-subagents-dev`
- `user-intent-interactive-loop` should be `hm-user-intent-interactive-loop`
- etc.

### GAP-CR-04: Gate skills have no agent permissions
- No agent is authorized to load `gate-spec-compliance`, `gate-evidence-truth`, or `gate-lifecycle-integration`

### GAP-CR-05: No lineage routing skill
- No skill determines whether a task is hiveminder (product) or hivefiver (meta) and routes accordingly

### GAP-CR-06: hm-* planning skills lack hierarchy, guardrails, quality integration
- Per user directive: current planning skills give no hierarchy, no granular control, no guardrails, no quality checking, no workflows integration, no artifact hierarchy like GSD

---

## Part 3: Proposed NEW Skills

### 3A. SHIP (hm-*) Skills — End-user facing

| # | Proposed Name | Replaces/Occupies Gap | Purpose |
|---|--------------|----------------------|---------|
| **N1** | `hm-artifact-hierarchy` | Replaces `hm-planning-with-files` | GSD-style artifact management with hierarchy: task_plan → findings → progress → state. Layers of artifacts with promotion gates. Routes to quality gate triad at each stage. |
| **N2** | `hm-brainstorm` | Gap: no ideation-to-requirements skill | Pre-gate: ideation, context gathering, requirements surfacing. Routes to `hm-spec-driven-authoring`. |
| **N3** | `hm-cross-cutting-change` | Gap: no governance for cross-pane changes | Governs modifications across pans/layers when features are cross-cutting. Verifies red-first, handles lifecycle impacts, coordinates spec+TDD modifications. |
| **N4** | `hm-tech-stack-ingest` | Gap: no tech stack synthesis skill | Downloads entire repos via repomix/deepwiki as bundled assets with progressive disclosure. Stores as `references/tech-stacks/<name>/`. Maintains TOC, metadata, version tracking. |
| **N5** | `hm-gate-orchestrator` | Gap: no unified gate entry point | Single entry for the triad gate pipeline: lifecycle → spec → evidence. Produces unified PASS/FAIL/REMEDIATE verdict. Routes to `hm-coordinating-loop` on FAIL. |
| **N6** | `hm-lineage-router` | Gap: no product-vs-meta routing | Classifies task intent as hiveminder (product dev) or hivefiver (meta builder) and routes to correct lineage skills. |
| **N7** | `hm-requirements-analysis` | Gap: no formal requirements skill | Diagnoses requirements problems, guides discovery of real needs. Routes to `hm-spec-driven-authoring`. |
| **N8** | `hm-tech-context-compliance` | Gap: no tech stack validation | Validates tech stack choices against project constraints during feature design. Consumed by `hm-brainstorm` and `hm-spec-driven-authoring`. |

### 3B. SHIP (hf-*) Skills — Meta-builder facing

| # | Proposed Name | Purpose |
|---|--------------|---------|
| **N9** | `hf-config-workflow` | REPLACES `opencode-config-workflow`. Full 8-turn workflow with bundled resources: turn templates, primitive schemas, validation scripts. |
| **N10** | `hf-agent-synthesizer` | Synthesizes agent definitions from GSD and OMO patterns with YAML frontmatter, hierarchical classification, 3-level-depth wiring. |

### 3C. Key Design Principles for New Skills

1. **Every shipped skill must pass full RICH-1 through RICH-8 gates** — no exceptions
2. **Bidirectional cross-references** — if A references B, B must reference A
3. **Artifact hierarchy** — `hm-artifact-hierarchy` provides GSD-style layered artifacts with promotion gates
4. **Quality gate integration** — every "how-to-implement" skill must route output through `hm-gate-orchestrator` → triad gates
5. **Lineage awareness** — `hm-lineage-router` determines correct lineage at entry; all skills declare their lineage in frontmatter
6. **Progressive disclosure** — bundled assets (tech stacks, references) loaded on demand, not at skill load time

---

## Part 4: Implementation Plan — Proposed GSD Phases

### Phase 49: Skill Reclassification & Cleanup (Foundational)
**Priority:** P0 — must happen first
**Scope:**
1. Rename 4 skills: hm→hf (agent-composition, agents-md-sync, command-parser, skill-synthesis)
2. Remove 2 skills: hm-omo-reference, hm-opencode-project-inspection
3. Fix 8 name prefix inconsistencies in cross-references
4. Add gate-* agent permissions to coordinator/conductor agents
5. Update AGENTS.md skill/agent counts
**Depends on:** Phases 48.4-48.5 completion
**Gates:** All renames verified, no broken references remain

### Phase 50: `hm-artifact-hierarchy` — GSD-Style Planning Replacement
**Priority:** P0 — 9 skills blocked without it
**Scope:**
1. Design artifact hierarchy: task_plan → findings → progress → state → promotion gates
2. Create `hm-artifact-hierarchy` SKILL.md with full RICH gates
3. Update all 9 dependent skills to reference new artifact skill
4. Archive `donotusethis-hm-planning-with-files`
**Depends on:** Phase 49
**Gates:** RICH-1 through RICH-8 for new skill; all 9 dependents verified

### Phase 51: Pre-Gate Skills — Brainstorming, Requirements, Cross-Cutting
**Priority:** P1 — fills workflow gaps before quality gates
**Scope:**
1. Create `hm-brainstorm` (ideation → requirements surfacing → handoff to spec-driven)
2. Create `hm-requirements-analysis` (formal requirements diagnosis)
3. Create `hm-cross-cutting-change` (cross-pane governance, red-first verification)
4. Create `hm-tech-context-compliance` (tech stack validation)
**Depends on:** Phase 50
**Gates:** RICH-1 through RICH-8 for all 4 new skills

### Phase 52: Research & Tech Stack Pipeline Enhancement
**Priority:** P1 — fills research-to-features gap
**Scope:**
1. Create `hm-tech-stack-ingest` (repo download, storage, progressive disclosure)
2. Enhance `hm-research-chain` with bidirectional references to detective/deep-research/synthesis
3. Add cross-architecture research routing to `hm-deep-research`
4. Research pipeline integration with quality gates
**Depends on:** Phase 51
**Gates:** RICH-1 through RICH-8; integration tests with research chain

### Phase 53: Gate Orchestration & Lineage Routing
**Priority:** P1 — unifies quality gates and lineage system
**Scope:**
1. Create `hm-gate-orchestrator` (single entry for triad gate pipeline)
2. Create `hm-lineage-router` (product vs meta classification + routing)
3. Wire both into `hm-meta-builder` and coordinator routing
4. Ensure all shipped hm-* and hf-* skills declare lineage in frontmatter
**Depends on:** Phase 52
**Gates:** Full triad gate pipeline integration; lineage routing verified

### Phase 54: Meta-Builder Skills Enhancement
**Priority:** P2 — hivefiver lineage completion
**Scope:**
1. Replace `opencode-config-workflow` with `hf-config-workflow` (full bundled resources)
2. Create `hf-agent-synthesizer` (GSD+OMO agent synthesis with YAML config)
3. Add bidirectional references between all hf-* skills
4. Bridge remaining hivefiver→hiveminder references
**Depends on:** Phase 53
**Gates:** RICH-1 through RICH-8 for new/replaced skills

### Phase 55: Integration Verification & Ecosystem Coherence
**Priority:** P2 — final validation
**Scope:**
1. Run full RICH gate audit on all shipped skills (target: 100% PASS)
2. Cross-reference integrity verification (target: 100% bidirectional)
3. End-to-end workflow test: brainstorm → spec → TDD → artifact hierarchy → gate orchestration → triad gates
4. Lineage routing test: product task routes through hm-*, meta task routes through hf-*
5. Produce final ecosystem coherence report
**Depends on:** Phase 54
**Gates:** All shipped skills pass RICH gates; zero broken references; full pipeline tested

---

## Part 5: Dependency Graph

```
Phase 48.4-48.5 (Production Evidence + LOC Cleanup)
    │
    ▼
Phase 49 (Skill Reclassification & Cleanup) — FOUNDATIONAL
    │
    ▼
Phase 50 (hm-artifact-hierarchy) — BLOCKS 9 DEPENDENT SKILLS
    │
    ▼
Phase 51 (Pre-Gate Skills) ────┐
    │                          │
    ▼                          ▼
Phase 52 (Research Pipeline)   Phase 53 (Gate Orchestration + Lineage)
    │                          │
    └──────────┬───────────────┘
               ▼
        Phase 54 (Meta-Builder Enhancement)
               │
               ▼
        Phase 55 (Integration Verification)
```

---

## Part 6: Immediate Next Actions

1. **Validate this analysis with user** — confirm classifications, replacements, removals
2. **Insert Phase 49 into ROADMAP.md** — after Phase 48.5
3. **Begin Phase 49 execution** — renames first (safest, atomic, verify with typecheck)
4. **Hold Phase 50 until planning design is approved** — `hm-artifact-hierarchy` design needs GSD-style pattern review

---

*Synthesized from 4 parallel audit agents (gsd-code-reviewer ×2, gsd-pattern-mapper, explore) + user directives*
*Audit artifacts: .planning/RICH-AUDIT-HM-SKILLS-REPORT.md, RICH-AUDIT-HF-SKILLS-REPORT (inline), Gate Skills Audit (inline), Cross-Reference Gap Report (inline)*
