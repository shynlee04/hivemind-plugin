---
phase: AS-7
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-4
  - AS-5
  - AS-6
  - AS-8
  - AS-9
  - AS-10
  - AS-11
  - SE-5.5
  - SE-10
  - SE-14
blocks: [] (terminal phase for agent-synthesis)
created: 2026-04-29
---

# AS-7: Capability Matrix Wiring & Integration Verification — Context

## Phase Goal
Wire all agent-to-skill mappings, agent-to-tool mappings, and depth delegation rules. Run the quality gate triad (lifecycle → spec → evidence) on all agents. Verify cross-references. Create `AGENT-CAPABILITY-MATRIX.md`. Delete gsd-* agents ONLY after verification passes (D-AD-03 transition safety). This is the terminal verification phase for the agent-synthesis workstream.

## Starting State
- AS-4 completed: 17 hm-* L2 agents (batch 1)
- AS-5 completed: 17 hm-* L2 agents (batch 2) — total 34 hm-* agents
- AS-6 completed: 7 hf-* L2 agents — total 41+ agents
- AS-8 completed: all agents have enriched XML bodies (≥200 LOC, 10 XML sections)
- AS-9 completed: TOOL-CAPABILITY-MATRIX.md published, tool declarations in all agents
- AS-10 completed: WORKFLOW-AWARENESS.md published, workflow awareness in all agents
- AS-11 completed: all agents renamed to hm-/hf- pattern, gsd-* agents deleted
- SE-5.5 completed: internal gate skills (gate-*) hardened and ready
- SE-10 completed: skill routers (hm-skill-router, hf-skill-router) exist
- SE-14 completed: INTEGRATION-CONTRACTS.md published, bidirectional skill↔agent contracts
- 33 GSD agents STILL EXIST (D-AD-03 requires verification before deletion)
- Core agents (build, conductor, coordinator, critic, general, test-router) remain unchanged

## Deliverables
1. **`AGENT-CAPABILITY-MATRIX.md`** — Complete agent × capability matrix:
   - All 41+ hm-/hf- agents listed with depth, lineage, domain
   - Agent-to-skill mapping: which skills each agent loads (from AS-7 wiring + SE-14 contracts)
   - Agent-to-tool mapping: which tools each agent has access to (from AS-9)
   - Depth delegation rules: L0→L1→L2 dispatch chains verified
   - Cross-lineage bridging: hf→hm access points documented with justification
2. **Quality Gate Triad Report** — Run all three gates on ALL 41+ shipped agents:
   - **gate-lifecycle-integration:** Verify CQRS boundaries, mutation authority, actor hierarchy
   - **gate-spec-compliance:** Bidirectional traceability (agent ↔ spec ↔ requirements)
   - **gate-evidence-truth:** Evidence hierarchy verification (L1-L5)
3. **Migration verification** — gsd-* → hm-* capability mapping confirmed:
   - Every gsd-* capability has an hm-* equivalent (no capability regression)
   - Cross-reference check: all gsd-* agents that were referenced in skills/commands now point to hm-* equivalents
4. **`MIGRATION-COMPLETE.md`** — Sign-off document authorizing gsd-* deletion.
5. **gsd-* agent deletion** — Remove all 33 gsd-* agent files (ONLY after all verifications pass).

## Acceptance Criteria
- [ ] All 41+ hm-* and hf-* agents pass quality gate triad (lifecycle, spec compliance, evidence truth)
- [ ] Agent-to-skill wiring verified: zero broken references (all skills in `skills:` array exist)
- [ ] Agent-to-tool permissions match AS-2 schema (no blanket `*`, L2 write restrictions enforced)
- [ ] Depth delegation rules tested: L0→L1→L2 dispatch works end-to-end
- [ ] Cross-lineage bridging verified: hf-agents can access hm-skills, hm-agents cannot access hf-skills
- [ ] `AGENT-CAPABILITY-MATRIX.md` published with complete mappings
- [ ] `MIGRATION-COMPLETE.md` sign-off document committed
- [ ] All 33 gsd-* agents DELETED (D-AD-03 satisfied)
- [ ] Ghost agent `explore` resolved: either created or AGENTS.md reference removed
- [ ] AGENTS.md agent inventory updated to reflect post-migration state
- [ ] Core agents (build, conductor, test-router, etc.) verified unchanged

## Known Risks
- This is the MOST COMPLEX phase — depends on 10 other phases completing successfully
- Quality gate triad on 41+ agents is context-heavy — may require multi-wave execution
- gsd-* deletion is irreversible (though git revert possible) — must be 100% confident before deleting
- Ghost `explore` agent must be resolved — creating it may introduce scope creep
- AGENT-CAPABILITY-MATRIX.md must stay in sync with TOOL-CAPABILITY-MATRIX.md (AS-9) — bidirectional consistency check
- INTEGRATION-CONTRACTS.md (SE-14) may have declared bindings that don't match actual agent implementations

## Skills/Agents Involved
- **Creates:** `AGENT-CAPABILITY-MATRIX.md`, `MIGRATION-COMPLETE.md`
- **Deletes:** 33 gsd-* agent files (post-verification)
- **Runs:** gate-lifecycle-integration, gate-spec-compliance, gate-evidence-truth (quality gate triad)
- **References:** SE-10 routers, SE-14 integration contracts, AS-9 TOOL-CAPABILITY-MATRIX.md
