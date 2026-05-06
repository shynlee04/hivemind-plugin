---
phase: SE-10
workstream: skill-ecosystem
status: NOT STARTED
depends_on:
  - SE-9
blocks:
  - AS-3
  - AS-7
created: 2026-04-29
---

# SE-10: Skill Routing & Agent Dispatch Bindings — Context

## Phase Goal
Create router skills (`hm-skill-router`, `hf-skill-router`) that map task classification to skill loading lists, bridging the hm/hf lineage gap so agents can discover cross-lineage skills without manual wiring. Formalize all 49 skill trigger conditions for machine-parseable agent consumption.

## Starting State
- SE-9 completed: all 49 active skills pass RICH gates, cross-references clean
- All 49 skills have trigger conditions but no aggregation or classification mechanism
- hf-agents lack hm-skill awareness for cross-lineage work (e.g., hf-skill-author needs hm-detective but has no way to discover it)
- AGENTS.md skill-router section exists but is simplistic (text-only, no binding rules)
- No router mechanism exists — agents rely on manual skill loading

## Deliverables
1. **`hm-skill-router` SKILL.md** — Maps task classification → skill loading list for product-dev tasks (brainstorm → requirements → spec → TDD → artifacts → gate orchestration → triad → production readiness). Declares which hm-* skills load per workflow stage.
2. **`hf-skill-router` SKILL.md** — Maps meta-concept intent → skill + hm-fallback for meta-builder tasks (create agent/command/skill/tool, audit, enrich, wire). Declares which hf-* skills load, plus hm-fallback path for codebase investigation.
3. **Updated `AGENTS.md` skill router section** — Dispatcher binding rules: which agents use which router, how cross-lineage bridging works.
4. **Trigger condition validation** — Ensure all 49 skills have clear, parseable trigger phrases that routers can match against task classifications.

## Acceptance Criteria
- [ ] `hm-skill-router` SKILL.md created, passes RICH-8 scorecard (≥ 6/8)
- [ ] `hf-skill-router` SKILL.md created, passes RICH-8 scorecard (≥ 6/8)
- [ ] AGENTS.md skill-router section updated with dispatcher binding rules
- [ ] Cross-lineage bridge verified: hf-agent → hf-skill-router → hm-skill (fallback) path works end-to-end
- [ ] Both routers declare all 49 skills with task classification mapping
- [ ] All 49 skills have trigger conditions that are machine-parseable by the routers
- [ ] hm-skill-router covers full product workflow chain: brainstorm → requirements → spec → TDD → artifacts → gate orchestration → triad → production readiness
- [ ] hf-skill-router covers full meta-builder chain: create → audit → enrich → wire → verify

## Known Risks
- SE-9 must be complete before routing can be built — routing against unstable skills creates fragile bindings
- Cross-lineage bridging is architecturally complex: hf-agents need hm-skills without breaking lineage boundary rules (D-AD-01: hm STRICT, hf FLEXIBLE)
- Trigger condition parsing may reveal that some existing skills lack clear, parseable triggers (may require back-pressure to SE-9)
- Router skills themselves need to be discoverable — they create a bootstrapping problem (who routes the routers?)

## Skills/Agents Involved
- **Creates:** `hm-skill-router` (new), `hf-skill-router` (new)
- **References:** All 49 active skills (trigger validation)
- **Modifies:** `AGENTS.md` (skill-router section)
