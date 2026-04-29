---
workstream: skill-ecosystem
created: 2026-04-29
status: ACTIVE
phase_count: 17
---

# Skill Ecosystem Workstream — Requirements

## Purpose

The skill-ecosystem workstream owns ALL SKILL.md files in `.opencode/skills/`. It ensures:
1. Every skill has correct frontmatter, clear triggers, and lineage classification
2. Skills are hardened through RICH-8 scorecard validation
3. Lineage boundaries are respected (hm-*, hf-*, gate-*, stack-*)
4. Dead references and orphan skills are eliminated
5. Integration between skills and agents is clean

## Scope

### In Scope
- All 49 active skills in `.opencode/skills/`
- 1 disabled skill (`donotusethis-hm-planning-with-files`) pending archival
- 5 lineage groups: hm-* (28), hf-* (11), gate-* (3), stack-* (6), unprefixed (1)
- Frontmatter schema compliance for all skills
- Cross-reference integrity between skills and agents
- RICH-8 quality scorecard validation

### Out of Scope
- Agent definitions (owned by agent-synthesis workstream)
- Code changes in `src/` (owned by milestone workstream)
- GSD workflow routing (owned by GSD framework, not this project)
- State persistence in `.hivemind/` (owned by milestone workstream)

## Lineage Definitions

| Lineage | Purpose | Who Uses | Boundary Rule |
|---------|---------|----------|---------------|
| **hm-*** | Product development skills | hm-agents ONLY | hm-agents → hm-skills. No cross to hf-skills. |
| **hf-*** | Meta-builder skills | hf-agents (primary), hm-agents when needed for shared workflows | hf-agents → hf-skills + hm-skills when needed. No cross to gate-* skills. |
| **gate-*** | Internal quality gate triad | Internal only (NOT shipped) | Used by quality gate workflows only. Never shipped to end users. |
| **stack-*** | Technology reference packs | Both hm-* and hf-* agents | Read-only reference. No mutation. |
| **unprefixed** | Transitional skills awaiting reclassification | All agents | Must be resolved: either prefixed or removed. |

## Quality Contract (HMQUAL-01 through HMQUAL-08)

All skills MUST comply with the project-level quality contract:

| ID | Requirement | Verification |
|----|------------|--------------|
| HMQUAL-01 | Progressive disclosure structure (short description → detailed sections) | SKILL.md has description < 200 chars, full content below |
| HMQUAL-02 | Clear trigger phrases (at least 3) | Grep for trigger keywords in description |
| HMQUAL-03 | Lineage prefix matches directory name | Frontmatter `name:` matches directory prefix |
| HMQUAL-04 | Cross-references resolve to existing files | Grep all @file references, verify paths exist |
| HMQUAL-05 | No hardcoded absolute paths | Grep for hardcoded paths, flag violations |
| HMQUAL-06 | Evaluation scenarios defined (evals.json) | evals/ directory exists with at least 3 scenarios |
| HMQUAL-07 | Self-correction section present | Section exists with anti-patterns table |
| HMQUAL-08 | RICH-8 scorecard score ≥ 6/8 | Manual audit against scorecard criteria |

## Phase Delivery Requirements

| Phase | Must Deliver | Acceptance Criteria |
|-------|-------------|-------------------|
| SE-1 | Skill reclassification + cleanup | 10 renames done, 1 removal, cross-refs fixed |
| SE-2 | Planning persistence backbone | hm-planning-persistence SKILL.md + 11 ref fixes + disabled skill archived |
| SE-3 | Pre-gate skill hardening (4 skills) | RICH-8 score ≥ 6 for hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance |
| SE-3.5 | Feature skill hardening (3 skills) | RICH-8 score ≥ 6 for hm-feature-ecosystem, hm-production-readiness, hm-roadmap-maintainability |
| SE-3.6 | Product validation hardening (1 skill) | RICH-8 score ≥ 6 for hm-product-validation |
| SE-4 | Research pipeline hardening | Bidirectional references fixed across hm-tech-stack-ingest, hm-detective, hm-deep-research, hm-synthesis, hm-research-chain |
| SE-5 | New skills: gate-orchestrator + lineage-router | Both skills created, passing RICH-8, referenced by existing skills |
| SE-5.5 | Gate skill hardening (3 skills) | RICH-8 score ≥ 6 for gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance |
| SE-6 | Meta-builder skill migration | opencode-config-workflow replaced by hf-config-workflow, hf-agent-synthesizer created |
| SE-7 | Integration verification | All 49 skills pass RICH-8, cross-refs clean, E2E workflow test passes |
| SE-8 | Orphan skill hardening (25 skills) | All 25 orphan skills pass RICH-8, no skills without phase coverage |
| SE-9 | Final integrity verification | Full RICH audit, cross-ref integrity, gate-orchestrator references verified |
| SE-10 | Skill routing & agent dispatch | hm-skill-router + hf-skill-router created; AGENTS.md router section updated; both pass RICH-8; cross-lineage bridge verified |
| SE-11 | Naming syndicate formalization | NAMING-SYNDICATE.md documented; all 49 skills validated for `[lineage]-[domain]-[function]`; validation script passes; zero unprefixed skills |
| SE-12 | Tool capability matrix (skill side) | TOOL-CAPABILITY-MATRIX.md with all 3 tool categories; all 49 skills declare tool requirements; scan script confirms no undeclared tool references |
| SE-13 | Hivemind engine contracts | hm-hivemind-state-reference + hf-hivemind-state-reference created; `.hivemind/` directory structure documented; delegation protocols and custom engines documented; both pass RICH-8 |
| SE-14 | Skill-agent integration contracts | INTEGRATION-CONTRACTS.md documented; all 49 skills have agent-binding declarations; all hm-/hf- agents have skill-loading declarations; zero orphan skills; zero unnecessary loads |

## Dependencies on Other Workstreams

| Dependency | Workstream | Phase | Type |
|-----------|-----------|-------|------|
| Agent definitions reference skills | agent-synthesis | AS-5 | Bidirectional |
| Skills used in harness code | milestone | Phases 35+ | Read-only |
| Quality contract alignment | milestone | HMQUAL decisions | Shared |

## Non-Regression Rules

1. **No skill deletion without replacement** — if a skill is renamed, all references must be updated first
2. **No frontmatter field removal** — fields can be added but never removed without migration
3. **Lineage prefix is immutable** — once a skill is classified hm-*, it stays hm-*
4. **RICH scores never decrease** — if a skill scores 6/8, subsequent changes must not lower it
5. **Historical phases are immutable** — SE-H1 through SE-H14 are closed, never reopened
