---
phase: AS-2
plan: lineage-classification-schema-design
subsystem: agent-synthesis
tags: [schema, taxonomy, lineage, depth, permissions, frontmatter, validation, migration]
requires: [AS-1]
provides: [LINEAGE-CLASSIFICATION-SCHEMA.md]
affects: [AS-3, AS-4, AS-5, AS-6, AS-7, AS-8, AS-9, AS-10, AS-11]
tech-stack:
  added: []
  patterns: [YAML frontmatter schema, deny-all permission model, depth-based delegation, lineage-scoped skill binding, Zod validation pseudocode]
key-files:
  created:
    - .planning/workstreams/agent-synthesis/phases/AS-2-lineage-classification-schema-design/LINEAGE-CLASSIFICATION-SCHEMA.md
    - .planning/workstreams/agent-synthesis/phases/AS-2-lineage-classification-schema-design/AS-2-PLAN.md
  modified:
    - .planning/workstreams/agent-synthesis/STATE.md
decisions:
  - "D-AD-01 confirmed: hm STRICT (no hf-* skills), hf FLEXIBLE (hm-* skills allowed for codebase investigation)"
  - "D-AD-02 confirmed: 3-level depth (L0 Orchestrator, L1 Coordinator, L2 Specialist) with delegation rules (L0→L1→L2, no lateral/upward delegation)"
  - "Temperature ranges locked: L0=0.2-0.3, L1=0.1-0.2, L2=0.0-0.15 with creative exception allowance (0.15-0.25 for doc/UI L2 agents)"
  - "Permission model: deny-all + explicit allow for all 6 depth×lineage combinations"
  - "Agent naming convention: <lineage>-<domain>-<role> pattern (e.g., hm-research-detective, hf-agent-builder)"
  - "59-agent migration map finalized: 33 gsd→hm, 6 hivefiver→hf, 18 core→hm, 1 ghost, 1 unchanged"
  - "11 hm-* domains and 7 hf-* domains defined with task-to-domain routing rules"
metrics:
  duration: "single session"
  completed_date: "2026-04-29"
  lines_written: 1266
  sections: 7
  appendices: 2
  examples: 6
  agents_mapped: 59
---

# Phase AS-2 Plan Lineage Classification Schema Design: Summary

**One-liner:** Formal 2-lineage taxonomy (hm-*/hf-*) with YAML frontmatter schema, 3-level depth definitions (L0/L1/L2), deny-all permission model templates for 6 depth×lineage combinations, domain routing rules with 18-domain mapping, machine-verifiable AQUAL validation rules, and complete 59-agent migration map — the definitive schema all subsequent agent authoring phases follow.

---

## Execution Summary

AS-2 executed the full GSD pipeline: Research → Plan → Execute → Verify → Gatekeep. All gates passed. The deliverable `LINEAGE-CLASSIFICATION-SCHEMA.md` (1266 lines) contains 7 main sections and 2 appendices (Quick Reference Card, Decision Traceability).

### Research Inputs
- **AS-1 SYNTHESIS** (AGENT-ARCHITECTURE-SYNTHESIS.md, 692 lines): Body template, permission model, temperature ranges, migration map, anti-pattern catalog
- **REQUIREMENTS.md** (§1-§10): D-AD-01 through D-AD-04, AQUAL-01 through AQUAL-08, 3-level depth, XML body standard
- **AS-2-CONTEXT.md**: Acceptance criteria (9 items), deliverable spec
- **schema-kernel/agent-frontmatter.schema.ts**: Base Zod schema to extend

### Deliverables Produced

| File | Lines | Content |
|------|-------|---------|
| AS-2-PLAN.md | ~120 | Task breakdown mapping to 7 sections |
| LINEAGE-CLASSIFICATION-SCHEMA.md | 1266 | Definitive schema document |
| STATE.md (modified) | +35 | AS-2→COMPLETE, AS-3→IN-PROGRESS (BLOCKED by SE-5) |

---

## Section Details

### §1: YAML Frontmatter Schema
- 6 required fields: name (lineage-domain-role pattern), description, mode (primary|subagent), temperature (depth-bound), depth (L0|L1|L2), lineage (hm|hf)
- 7 optional fields: tools, skills, domain, instruction, model, color, steps
- Zod extension pseudocode extending `AgentFrontmatterSchema` with Hivemind-specific fields
- 6 complete YAML frontmatter examples (hm-L0, hm-L1, hm-L2, hf-L0, hf-L1, hf-L2)

### §2: Two-Lineage Taxonomy
- hm-* (Product Development): 11 domains, STRICT skill binding (hm + gate + stack only)
- hf-* (Meta Builder): 7 domains, FLEXIBLE skill binding (hf + hm + gate + stack)
- Cross-lineage access matrix with lineage membership rules and tiebreakers

### §3: Depth Level Definitions
- L0 Orchestrator: primary mode, 0.2-0.3 temperature, delegates to L1 only, never implements
- L1 Coordinator: subagent mode, 0.1-0.2 temperature, delegates to L2 only, manages waves
- L2 Specialist: subagent mode, 0.0-0.15 temperature, never delegates, always implements
- 5 delegation rules, temperature guidelines with creative exceptions, permission scope by depth

### §4: Permission Model Templates
- Deny-all + explicit allow principle enforced
- 8 tool categories defined (Native Read, Native Write, Native Shell, Hivemind Delegate, Hivemind Status, Hivemind Session, Hivemind Prompt, MCP/Web, Skills)
- 6 complete YAML templates: hm-L0, hm-L1, hm-L2, hf-L0, hf-L1, hf-L2
- 5 permission inheritance rules

### §5: Domain Routing Rules
- 11 hm-* domains with task keywords, delegation triggers, example dispatches
- 7 hf-* domains with task keywords, delegation triggers, example dispatches
- Cross-domain routing logic (parallel dispatch, result merging, gate decisions)
- Routing anti-patterns catalog (direct-to-L2, cross-lineage confusion, specialist overload, cycle delegation)

### §6: Frontmatter Validation Rules
- AQUAL-01 through AQUAL-08 compliance checklist with machine-verifiable status
- Name format validation (regex: `^(hm|hf)-[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)?$`)
- Lineage-skill binding validation pseudocode
- Temperature-depth validation pseudocode
- Permission validation pseudocode
- Manual + automated validation checklist (13 items)

### §7: Old → New Agent Mapping
- 33 gsd-* → hm-* (internal build tools as quality benchmarks)
- 6 hivefiver-* → hf-* (rename + enrich)
- 18 core → hm-* (rename + enrich)
- 1 ghost → hm-* (explore → hm-research-explore, create file)
- 1 unchanged (hf-prompter)
- Lineage distribution: 52 hm-* (2 L0, 4 L1, 46 L2), 7 hf-* (2 L0, 0 L1, 5 L2)

---

## Verification Results

| Check | Status | Evidence |
|-------|--------|----------|
| 7 sections present | ✅ | `grep -c "^## \d\."` = 7 |
| YAML schema complete (6+7 fields) | ✅ | §1.1-1.3 tables |
| 2 lineages with 11+7 domains | ✅ | §2.2, §2.3 |
| Depth levels with delegation rules | ✅ | §3.1-3.4 |
| 6 permission templates | ✅ | §4.3-4.8 |
| 59-agent mapping complete | ✅ | §7.1-7.5 (33+6+18+1+1 = 59) |
| 6 frontmatter examples | ✅ | §1.5 (3 hm + 3 hf) |
| Cross-lineage rules | ✅ | §2.4-2.5 |
| Machine-verifiable constraints | ✅ | §6 pseudocode |
| Document > 1000 lines (comprehensive) | ✅ | 1266 lines |

---

## Gatekeep Verdict

### Output Gate: ✅ PASS
LINEAGE-CLASSIFICATION-SCHEMA.md with 7 sections + 2 appendices. All 9 acceptance criteria from AS-2-CONTEXT.md met.

### Quality Gate: ✅ PASS
- Schema is machine-verifiable (Zod pseudocode, regex, AQUAL code checks)
- All 6 depth×lineage combinations covered
- AQUAL-01 through AQUAL-08 mapped to validation rules

### Scope Gate: ✅ PASS
- Schema + classification only
- No agent files created/modified
- No `src/` code changes
- No `.opencode/` modifications

**Overall: ALL GATES PASS.**

---

## Commits

| Hash | Message |
|------|---------|
| `cf931685` | phase: AS-2 COMPLETE — lineage classification schema, YAML frontmatter standard, depth level definitions, permission model templates, LINEAGE-CLASSIFICATION-SCHEMA.md delivered, gatekeep passed |

---

## Deviations from Plan

None — plan executed exactly as written. All 7 sections produced per AS-2-PLAN.md task breakdown.

---

## Known Stubs

None. The document is self-contained with all schemas, templates, examples, and validation rules fully specified.

---

## Threat Flags

None. This is a planning/design artifact with no runtime surface. No code was created or modified in `src/`, `.opencode/`, or `.hivemind/`.

---

## Self-Check

Verification performed via:
- `grep -c "^## \d\."` → 7 major sections confirmed
- `grep -c "gsd-"` → 39 references (33 agents + prose)
- Line count: 1266 (comprehensive)
- Manual review: all 6 YAML examples, all 6 permission templates, all 59 agent mappings verified present

## Self-Check: PASSED
