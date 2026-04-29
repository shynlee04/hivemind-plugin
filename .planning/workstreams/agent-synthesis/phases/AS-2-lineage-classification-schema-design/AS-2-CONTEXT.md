---
phase: AS-2
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-1
blocks:
  - AS-3
created: 2026-04-29
---

# AS-2: Lineage Classification & Schema Design — Context

## Phase Goal
Design the 2-lineage taxonomy (hm-* and hf-*), YAML frontmatter schema extending schema-kernel, depth level definitions (L0/L1/L2), and permission model templates. This is the schema that all subsequent agent authoring phases (AS-3 through AS-11) will follow.

## Starting State
- AS-1 completed: body format standard published, frontmatter field mapping defined
- Schema-kernel exists at `src/schema-kernel/` with Zod schemas (from Phase 16.5) — provides base validation patterns
- Lineage concept exists: hm-* for product dev, hf-* for meta builder (from skill-ecosystem workstream)
- Depth levels informally discussed but not formally defined
- Permission model is ad-hoc: each existing agent has its own `tools:` array with no pattern
- Domain classification exists in skill ecosystem but not mapped to agents

## Deliverables
1. **`AGENT-LINEAGE-SCHEMA.md`** — Complete taxonomy and schema document:
   - 2-lineage taxonomy: hm-* (product development) and hf-* (meta builder)
   - Lineage membership rules: what qualifies an agent for hm vs hf
   - Cross-lineage rules: hm STRICT (no hf-skill access), hf FLEXIBLE (hm-skill access when needed)
2. **YAML frontmatter schema** — Extending `src/schema-kernel/`:
   - All required fields: name, description, mode (primary|subagent), temperature, depth (L0|L1|L2), lineage (hm|hf)
   - Optional fields: tools, skills, permissions (read/write/delegate), domain category, meta-concept-type
   - Zod validation schemas for all fields
   - Frontmatter example for each lineage and depth level
3. **Depth level definitions:**
   - **L0 Orchestrator** — temperature 0.2-0.3, mode: primary, delegates to L1 only, never implements
   - **L1 Coordinator** — temperature 0.1-0.2, mode: subagent, delegates to L2 only, manages waves
   - **L2 Specialist** — temperature 0.0-0.15, mode: subagent, never delegates, always implements
4. **Permission model templates** — Tool allow/deny patterns per depth and lineage:
   - L0: broad read access, delegate-task only custom tool
   - L1: scoped read, delegate-task + delegation-status custom tools
   - L2: domain-scoped read/write, no delegation tools
   - hm-* read permissions: `src/**`, `.opencode/**`, `.hivemind/**`
   - hf-* read permissions: same + `.planning/**` (for workflow awareness)
5. **Domain classification matrix** — Agent domain → authorized skills/tools:
   - 11 hm-* categories: Research, Planning, Implementation, Quality, Domain, Documentation, Phase Lifecycle, Audit, UI, Intelligence, Debug
   - 7 hf-* categories: Orchestration, Agent Building, Command Building, Skill Authoring, Tool Building, Context/Audit, Prompt Engineering

## Acceptance Criteria
- [ ] 2-lineage taxonomy defined with clear membership rules
- [ ] YAML frontmatter schema extending schema-kernel defined and documented
- [ ] Depth levels L0/L1/L2 defined with temperature ranges and delegation rules
- [ ] Permission model templates: tool allow/deny, temperature, budget per depth
- [ ] Domain classification matrix: agent domain → authorized skills/tools
- [ ] Zod validation schemas written for all required frontmatter fields
- [ ] Example frontmatter provided for each lineage × depth combination (6 examples)
- [ ] Cross-lineage access rules documented (hm STRICT, hf FLEXIBLE)
- [ ] `AGENT-LINEAGE-SCHEMA.md` published and committed

## Known Risks
- Schema-kernel (Phase 16.5) may need extension to support agent-specific fields — cross-workstream dependency
- 11 hm-* categories + 7 hf-* categories = 18 total — risk of over-categorization leading to single-agent categories
- Temperature ranges are design decisions, not empirically determined — may need tuning
- Permission model templates are templates, not enforcement — actual enforcement is in OpenCode's permission system
- Domain classification must stay in sync with skill-ecosystem taxonomy (SE-11 naming syndicate)

## Skills/Agents Involved
- **Creates:** `AGENT-LINEAGE-SCHEMA.md`
- **Extends:** `src/schema-kernel/` (Zod validation schemas)
- **Output feeds:** AS-3 through AS-11 (all agent authoring phases follow this schema)
