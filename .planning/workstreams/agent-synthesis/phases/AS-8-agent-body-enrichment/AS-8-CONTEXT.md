---
phase: AS-8
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-4
  - AS-5
  - AS-6
blocks:
  - AS-9
  - AS-10
  - AS-11
created: 2026-04-29
---

# AS-8: Agent Body Enrichment (Superior to OMO + GSD) — Context

## Phase Goal
Elevate ALL hm-* and hf-* agent bodies beyond existing quality benchmarks. Each agent body must include enriched XML sections beyond the standard 5-tag template (AQUAL-02) — adding 5 new sections for a total of 10. Quality baseline: body content ≥ 200 LOC, equal or superior to `gsd-planner` (1248 lines, 22 steps) and `gsd-debugger` (1445 lines, 9 steps).

## Starting State
- AS-4 completed: 17 hm-* L2 agents created with standard 5 XML sections
- AS-5 completed: 17 hm-* L2 agents created with standard 5 XML sections
- AS-6 completed: 7 hf-* L2 agents created with standard 5 XML sections
- AS-3 completed: 4 L0/L1 agents created with standard 5 XML sections
- Total: ~45 agents (34 hm-* + 7 hf-* + 4 L0/L1)
- All agents currently have AQUAL-02 minimum (5 XML sections): `<role>`, `<depth>`, `<lineage>`, `<task>`, `<scope>`, `<context>`, `<expected_output>`, `<verification>`
- GSD reference quality: `gsd-planner` (1248 lines, 22 execution steps), `gsd-debugger` (1445 lines, 9 steps)
- Enrichment target: 10 XML sections, ≥200 LOC body content per agent

## Deliverables

### 5 New XML Sections Added to ALL ~45 Agents

9. **`<behavioral_contract>`** — What the agent WILL and WON'T do, with edge case handling:
   - ≥5 explicit will/won't clauses per agent
   - Edge case handling for common failure modes
   - Machine-verifiable (deterministic rules where possible)
10. **`<anti_patterns>`** — Self-correction triggers and forbidden behaviors:
   - ≥3 self-correction triggers per agent
   - Each trigger includes: condition → correction action
   - Testable against known failure modes
11. **`<delegation_boundary>`** — L0→L1→L2 dispatch rules, known specialist mapping:
   - Explicit delegation rules matching depth level
   - L2 declares zero delegation (cannot spawn subagents)
   - Known specialist names for delegation routing
12. **`<skill_loading>`** — Which skills to load for which task categories:
   - Task category → skill list mapping
   - Cross-lineage access documented (hf-* agents only)
   - Trigger phrases for automatic skill loading
13. **`<session_continuity>`** — How to persist/resume state across sessions:
   - References `.hivemind/state/` paths
   - Checkpoint protocol for mid-task interruption
   - Recovery steps when resuming a previous session

### Quality Baseline Targets
- Body content ≥ 200 LOC per agent (excluding YAML frontmatter)
- Behavioral contracts are machine-verifiable (deterministic rules)
- Anti-pattern detection is testable against known failure modes
- Delegation boundaries are explicit and unambiguous
- Skill loading rules reference existing skill names (not future/planned skills)
- Session continuity references actual `.hivemind/` paths

## Acceptance Criteria
- [ ] All ~45 agents have all 10 XML sections present (AQUAL-02 extended from 5 to 10)
- [ ] Each `<behavioral_contract>` has ≥5 explicit will/won't clauses
- [ ] Each `<anti_patterns>` section has ≥3 self-correction triggers
- [ ] `<delegation_boundary>` matches depth level: L2 declares zero delegation authority
- [ ] `<skill_loading>` rules reference existing skill names (post-SE-14)
- [ ] `<session_continuity>` section references `.hivemind/state/` paths
- [ ] No agent body < 200 LOC (excluding frontmatter)
- [ ] Enriched agent bodies are equal or superior in quality to gsd-planner and gsd-debugger
- [ ] All agents still pass AQUAL-01 through AQUAL-08 after enrichment

## Known Risks
- 45 agents × 5 new sections = 225 new XML section bodies to write — massive content generation
- Quality consistency across 45 agents is difficult to maintain
- Behavioral contracts may conflict between agents (e.g., two agents claim ownership of the same task)
- Session continuity paths may not be finalized — `.hivemind/` structure is still evolving
- Enrichment increases agent file sizes — must stay under AQUAL-06 max of 500 LOC
- gsd-planner/gsd-debugger are benchmarks but their quality is uneven — "superior" must be objectively defined

## Skills/Agents Involved
- **Enriches:** All ~45 hm-* and hf-* agent files (add 5 new XML sections)
- **References:** gsd-planner.md, gsd-debugger.md (quality benchmarks)
- **References:** SE-13 hivemind-state-reference (for session continuity paths)
- **Output feeds:** AS-9 (tool integration needs enriched bodies), AS-10 (workflow awareness), AS-11 (naming)
