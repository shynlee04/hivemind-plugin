---
phase: SE-14
workstream: skill-ecosystem
status: NOT STARTED
depends_on:
  - SE-13
  - SE-11
blocks:
  - AS-7
created: 2026-04-29
---

# SE-14: Skill-Agent Integration Contracts — Context

## Phase Goal
Create formal bidirectional contracts between skills and agents. Every skill declares which agent types should load it; every agent declares which skills it loads per task category. No orphan skills, no unnecessary loads. This phase closes the loop between SE-10 (routing), SE-11 (naming), and SE-13 (engine contracts).

## Starting State
- SE-13 completed: Hivemind engine contracts exist, documenting state and engine APIs for both lineages
- SE-11 completed: NAMING-SYNDICATE.md formalized, all skill names are consistent and predictable
- There is currently NO bidirectional binding between skills and agents:
  - Skills don't declare their intended agent audience (which lineages, which depth levels)
  - Agents' skill-loading behavior is undocumented (no per-agent skill list)
  - Cross-lineage bridging rules exist in theory (D-AD-01: hm STRICT, hf FLEXIBLE) but no skill enforces them
  - No orphan detection — skills with zero agent bindings are invisible
  - No overlap detection — multiple agents loading the same skill unnecessarily
- SE-10 routers exist but only map task→skill; they don't map skill→agent

## Deliverables
1. **`INTEGRATION-CONTRACTS.md`** — Central contract document defining:
   - **Skill→Agent binding rules:** Each skill declares target lineage (hm/hf/both/gate/stack) and agent depth level (L0/L1/L2)
   - **Agent→Skill binding rules:** Each agent declares skill loading list per task category
   - **Cross-lineage bridging rules:** When hm-agents may load hf-skills (never per D-AD-01 STRICT) and when hf-agents may load hm-skills (when needed for codebase investigation per D-AD-01 FLEXIBLE)
   - **Orphan detection rules:** Skills with zero agent bindings → flagged for review
   - **Overlap detection rules:** Same skill loaded by multiple agents unnecessarily → flagged
   - **gate-* skill binding:** Only internal quality workflows, never shipped agents
   - **stack-* skill binding:** Read-only, available to both lineages
2. **Contract declarations in all 49 SKILL.md files** — Each skill gets an agent-binding declaration (in frontmatter or `<agent_binding>` body section).
3. **Contract declarations in all hm-* and hf-* agent .md files** — Each agent declares its skill loading list per task category.
4. **Verification:** Zero orphan skills, zero unnecessary cross-lineage loads.

## Acceptance Criteria
- [ ] `INTEGRATION-CONTRACTS.md` published with complete binding rules
- [ ] All 49 SKILL.md files have agent-binding declarations (lineage + depth level)
- [ ] All hm-* and hf-* agent .md files have skill-loading declarations
- [ ] Zero orphan skills: every skill has at least one agent binding
- [ ] Zero hm→hf cross-lineage loads (D-AD-01 STRICT enforced)
- [ ] hf→hm cross-lineage loads documented with justification (D-AD-01 FLEXIBLE)
- [ ] gate-* skills bound only to internal quality workflows (not to hm-/hf- shipped agents)
- [ ] stack-* skills declared as read-only, available to both lineages
- [ ] Contract is machine-verifiable: script can parse declarations and detect violations
- [ ] SE-10 routers updated to consume integration contracts for routing decisions

## Known Risks
- Bidirectional contracts are fragile — adding a new skill or agent requires updating both sides of the contract
- Agent-synthesis (AS-0 through AS-11) may not have created all hm-* and hf-* agents yet — contracts will reference agents that don't exist
- Gate-* skills MUST NOT be bound to shipped agents (D-02) — strict verification required
- Orphan detection may flag skills that are legitimately standalone (e.g., stack-* reference packs may have no direct agent binding)
- Cross-referencing with SE-11 naming syndicate: skill names in contracts must match post-SE-11 names

## Skills/Agents Involved
- **Creates:** `INTEGRATION-CONTRACTS.md`
- **Modifies:** All 49 SKILL.md files (add agent-binding declarations)
- **Modifies:** All hm-* and hf-* agent .md files (add skill-loading declarations)
- **References:** SE-10 routers (must consume contracts), SE-11 NAMING-SYNDICATE.md (names must match)
