---
phase: AS-2
plan: lineage-classification-schema-design
workstream: agent-synthesis
type: auto
status: IN-PROGRESS
depends_on:
  - AS-1
blocks:
  - AS-3
  - AS-4
  - AS-5
created: 2026-04-29
requirements:
  - D-AD-01
  - D-AD-02
  - D-AD-04
  - AQUAL-01
  - AQUAL-03
  - AQUAL-04
  - AQUAL-05
  - AQUAL-08
---

# AS-2: Lineage Classification Schema Design — Plan

> **Goal:** Create LINEAGE-CLASSIFICATION-SCHEMA.md — the definitive schema document that all subsequent agent authoring phases (AS-3 through AS-11) follow.

**Context:** AS-1 delivered the body template, permission model, temperature ranges, anti-patterns, and migration map. AS-2 formalizes these into a machine-verifiable schema with YAML frontmatter spec, depth definitions, and domain routing rules.

---

## Task 1: YAML Frontmatter Schema & Zod Extensions

**Files:**
- Create: `.planning/workstreams/agent-synthesis/phases/AS-2-lineage-classification-schema-design/LINEAGE-CLASSIFICATION-SCHEMA.md`

**Section:** 1. YAML Frontmatter Schema

Define all required and optional fields with constraints, types, and examples. Reference the existing `src/schema-kernel/agent-frontmatter.schema.ts` as the base that must be extended. Include:

- **Required fields:** name (lineage-domain-role pattern), description, mode (primary|subagent), temperature (float, depth-bound), depth (L0|L1|L2), lineage (hm|hf)
- **Optional fields:** tools (array), skills (array, lineage-scoped), permissions (read/write/delegate arrays), domain (hm: 11 domains, hf: 7 domains), instruction (array of paths), model, color, steps
- **Zod schema pseudocode** for each field showing validation rules
- **Complete YAML example** for each lineage × depth combination (6 examples: hm-L0, hm-L1, hm-L2, hf-L0, hf-L1, hf-L2)

---

## Task 2: 2-Lineage Taxonomy

**Section:** 2. Two-Lineage Taxonomy

Formalize the hm-* and hf-* lineages:

- **hm-* (Product Development):** 11 domains with descriptions, skill binding (STRICT: hm + gate + stack only), depth distribution (1-2 L0, 3-5 L1, 20-25 L2)
- **hf-* (Meta Builder):** 7 domains with descriptions, skill binding (FLEXIBLE: hf + hm + gate + stack), depth distribution (1 L0, 1-2 L1, 4-6 L2)
- **Cross-lineage matrix:** hm→hm+gate+stack (STRICT), hf→hf+hm+gate+stack (FLEXIBLE)
- **Lineage membership rules:** what qualifies an agent for hm vs hf

---

## Task 3: Depth Level Definitions

**Section:** 3. Depth Level Definitions (L0/L1/L2)

Define L0 (Orchestrator), L1 (Coordinator), L2 (Specialist) with:

| Property | L0 | L1 | L2 |
|----------|-----|-----|-----|
| Mode | primary | subagent | subagent |
| Temperature | 0.2–0.3 | 0.1–0.2 | 0.0–0.15 |
| Delegates to | L1 only | L2 only | Nobody |
| Implements | Never | Never | Always |
| Manages | Workflow routing | Wave dispatch | Single-domain execution |
| Returns | Summary | Wave results | Domain results |

Include delegation rules (5 rules from D-AD-02) and temperature guidelines (creative exceptions for L2 documentation/UI agents at 0.15–0.25).

---

## Task 4: Permission Model Templates

**Section:** 4. Permission Model Templates

Define deny-all + explicit allow templates for all 6 depth × lineage combinations:

- **hm-L0:** Broad read, delegate-task only, hm + gate + stack skills
- **hm-L1:** Scoped read, delegate-task + delegation-status, specific hm skills
- **hm-L2:** Domain-scoped write, no delegation tools, domain-specific hm skills
- **hf-L0:** Broad read, delegate-task only, hf + hm + gate + stack skills
- **hf-L1:** Scoped read, delegate-task + delegation-status, hf coordination skills
- **hf-L2:** Domain-scoped write, no delegation tools, domain-specific hf skills

Include: native OpenCode tools (read, edit, write, bash, glob, grep), Hivemind custom tools (task, delegate-task, delegation-status, etc.), MCP/web tools, skill patterns. Use inheritance rules (4 rules from Section 4 of AS-1 Synthesis).

---

## Task 5: Domain Routing Rules

**Section:** 5. Domain Routing Rules

Define which tasks map to which domains and which agents serve which domains:

- **11 hm-* domains:** Research, Planning, Implementation, Quality, Domain, Documentation, Phase Lifecycle, Audit, UI, Intelligence, Debug — with task-to-domain mapping
- **7 hf-* domains:** Orchestration, Agent Building, Command Building, Skill Authoring, Tool Building, Context/Audit, Prompt Engineering — with task-to-domain mapping
- **Domain → Agent type mapping:** which agent roles serve each domain
- **Cross-domain routing:** when a task spans multiple domains, how L0/L1 route

---

## Task 6: Frontmatter Validation Rules

**Section:** 6. Frontmatter Validation Rules

Define machine-verifiable constraints:

- **AQUAL-01:** All required fields present (name, description, mode, temperature, depth, lineage)
- **AQUAL-03:** Lineage match (hm agents have zero hf skills)
- **AQUAL-04:** Depth declared (L0, L1, or L2 — no other values)
- **AQUAL-05:** Granular permissions (read, write, delegate arrays explicit)
- **AQUAL-08:** Temperature within depth range
- **Name format:** `<lineage>-<domain>-<role>` pattern validation (regex)
- **Cross-reference:** skill names resolve to existing .opencode/skills/ entries
- **Validation checklist:** step-by-step manual + automated checks

---

## Task 7: Old→New Agent Mapping

**Section:** 7. Complete Migration Map

From AS-1 Synthesis Section 7, tabulate the full 59-agent mapping:

- **33 gsd-* → hm-*** (internal build tools as quality benchmarks)
- **6 hivefiver-* → hf-*** (rename + enrich)
- **18 core → hm-*** (rename + enrich)
- **1 ghost → hm-*** (explore → hm-explore, create file)
- **1 unchanged** (hf-prompter)

Include: mapping table, target naming convention, depth assignment, migration action (create/rename/enrich), and summary counts.

---

## Verification Checklist

- [ ] Document exists at `LINEAGE-CLASSIFICATION-SCHEMA.md`
- [ ] 7 sections all present with substantive content
- [ ] YAML frontmatter schema has all required fields with valid constraints
- [ ] 2 lineages defined with 11+7 domains
- [ ] Depth levels have delegation rules and temperature ranges
- [ ] Permission templates cover all 6 depth+lineage combinations
- [ ] 59-agent mapping is complete
- [ ] 6 example frontmatters provided (each lineage × depth)
- [ ] Cross-lineage access rules documented (hm STRICT, hf FLEXIBLE)
- [ ] Machine-verifiable constraints listed

## Gatekeep Criteria

- **Output Gate:** LINEAGE-CLASSIFICATION-SCHEMA.md with 7 sections
- **Quality Gate:** Schema machine-verifiable, all combinations covered, AQUAL compliance demonstrated
- **Scope Gate:** Schema + classification only, no agent creation, no code changes to src/
