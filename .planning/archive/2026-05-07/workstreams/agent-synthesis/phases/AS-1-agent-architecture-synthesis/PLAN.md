---
phase: AS-1
plan: 01
type: execute
workstream: agent-synthesis
wave: 1
depends_on:
  - AS-0
autonomous: true
requirements:
  - AQUAL-01
  - AQUAL-04
  - AQUAL-06
  - AD-04
created: 2026-04-29
must_haves:
  truths:
    - "AGENT-ARCHITECTURE-SYNTHESIS.md exists with all 8 required sections"
    - "GSD XML pattern documented with strengths/weaknesses and full tag inventory"
    - "Hivefiver Markdown pattern documented with strengths/weaknesses and section inventory"
    - "Best-of-both synthesis: ADOPT/ADAPT/REJECT/DEFER per pattern"
    - "Body format standard resolves D-AD-04 implementation details"
    - "Frontmatter field mapping defined for hm-* and hf-* lineages"
    - "Migration map covers all 59 agents"
    - "Temperature ranges defined by depth (L0-L2)"
  artifacts:
    - "AGENT-ARCHITECTURE-SYNTHESIS.md"
    - "PLAN.md"
  key_links: []
---

<objective>
Produce AGENT-ARCHITECTURE-SYNTHESIS.md — the canonical agent architecture reference that compares GSD XML, Hivefiver Markdown, and OMO patterns, synthesizes the best-of-both, and publishes the unified body template (D-AD-04 confirmed) with permission model standard, quality baseline, anti-pattern catalog, and migration map.

Purpose: Resolve body format tension and provide the single source of truth for all downstream agent creation (AS-3 through AS-11).
Output: AGENT-ARCHITECTURE-SYNTHESIS.md with 8 required sections.
</objective>

<context>
@.planning/workstreams/agent-synthesis/phases/AS-0-agent-inventory-classification-audit/AGENT-INVENTORY.md
@.planning/workstreams/agent-synthesis/STATE.md
@.planning/workstreams/agent-synthesis/CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create AGENT-ARCHITECTURE-SYNTHESIS.md with all 8 sections</name>
  <files>.planning/workstreams/agent-synthesis/phases/AS-1-agent-architecture-synthesis/AGENT-ARCHITECTURE-SYNTHESIS.md</files>
  <action>
  Write the full synthesis document with these 8 sections:
  1. Pattern Comparison: GSD XML vs Hivefiver Markdown vs OMO vs Enriched Hybrid
  2. Best-of-Both Synthesis: ADOPT/ADAPT/REJECT/DEFER per pattern
  3. Unified Body Template (D-AD-04 confirmed): All required + optional XML tags
  4. Permission Model Standard: deny-all base, explicit allow per tool category
  5. Quality Baseline: HIGH quality criteria (≥200 LOC, 10 XML sections, behavioral contracts)
  6. Anti-Pattern Catalog: 7 documented anti-patterns with detection and correction
  7. Migration Map: gsd-* → hm-* (33 agents), hivefiver-* → hf-* (6 agents), core → hm-* (18 agents)
  8. Temperature Ranges by Depth: L0 (0.2-0.3), L1 (0.1-0.2), L2 (0.0-0.15)
  </action>
  <verify>File exists with all 8 H2 sections present (grep -c "^## " AGENT-ARCHITECTURE-SYNTHESIS.md ≥ 8)</verify>
  <done>AGENT-ARCHITECTURE-SYNTHESIS.md written, committed to git</done>
</task>

</tasks>

<threat_model>
No code execution in this phase — analysis and documentation only. No trust boundaries crossed.
</threat_model>

<verification>
1. File exists: .planning/workstreams/agent-synthesis/phases/AS-1-agent-architecture-synthesis/AGENT-ARCHITECTURE-SYNTHESIS.md
2. All 8 H2 sections present (verified via grep)
3. Migration map covers all 59 agents (verified via count)
4. Body template has all 10 required XML tags
5. Permission model uses deny-all + explicit allow pattern
6. Temperature ranges match depth levels
7. Anti-pattern catalog has 7 documented entries
8. File size: 300-600 lines (AQUAL-06: max 500 LOC for agents, but synthesis doc is not an agent body)
</verification>

<success_criteria>
- [ ] AGENT-ARCHITECTURE-SYNTHESIS.md written with all 8 sections
- [ ] D-AD-04 confirmed: XML-tagged bodies are the standard
- [ ] Format comparison complete: GSD XML, Hivefiver MD, OMO, Enriched Hybrid
- [ ] Best-of-both synthesis actionable: ADOPT/ADAPT/REJECT/DEFER
- [ ] Frontmatter field mapping complete for hm-* and hf-* lineages
- [ ] Migration map covers all 59 agents
- [ ] Temperature ranges defined by depth
- [ ] File committed to git
</success_criteria>

<output>
After completion, produce AS-1-SUMMARY.md and update STATE.md.
</output>
</content>
