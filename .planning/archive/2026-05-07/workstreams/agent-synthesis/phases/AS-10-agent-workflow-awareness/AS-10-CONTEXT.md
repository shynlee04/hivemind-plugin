---
phase: AS-10
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-8
  - SE-13
blocks:
  - AS-7
created: 2026-04-29
---

# AS-10: Agent Workflow Awareness — Context

## Phase Goal
Make ALL agents aware of the project's workflow infrastructure. Create `WORKFLOW-AWARENESS.md` reference document and add a `<workflow_awareness>` XML section to all agent bodies. Agents must understand `.planning/` structure, dependency chains, wave-based execution, 3-gate verification protocol, and session continuity.

## Starting State
- AS-8 completed: all ~45 agents have enriched XML bodies with behavioral contracts, anti-patterns, delegation boundaries, skill loading, and session continuity
- SE-13 completed: Hivemind engine contracts (`hm-hivemind-state-reference`, `hf-hivemind-state-reference`) exist, documenting `.hivemind/` structure and custom engines
- Agents currently have NO awareness of project workflow infrastructure:
  - Agents don't know how to read ROADMAP.md or STATE.md
  - Agents don't understand phase dependencies or wave-based execution
  - Agents don't know the 3-gate verification protocol
  - Session continuity exists (AS-8 `<session_continuity>` section) but agents don't know how workflow state fits in
- Project workflow infrastructure exists but is undocumented from an agent's perspective

## Deliverables
1. **`WORKFLOW-AWARENESS.md`** — Reference document covering 6 awareness domains:

   **Awareness Domain 1: `.planning/` Structure**
   - ROADMAP.md: phase table, dependency chains, thin-frame phase descriptions
   - STATE.md: current workstream status, active phases, blocked phases
   - Workstreams: skill-ecosystem, agent-synthesis, milestone
   - Phases: directory structure, CONTEXT.md, PLAN.md, SUMMARY.md conventions

   **Awareness Domain 2: Wave-Based Execution**
   - hm-phase-execution protocol: wave dispatch, parallel task coordination
   - Wave identification: how to find which wave a task belongs to
   - Wave dependencies: pre-wave/post-wave ordering rules

   **Awareness Domain 3: Checkpoint Recovery**
   - hm-phase-loop: iterative phase management with entry/exit gates
   - hm-completion-looping: non-completion detection and automatic loop-back
   - Checkpoint state: `.hivemind/state/planning/<session-id>/`

   **Awareness Domain 4: 3-Gate Verification Protocol**
   - Gate 1 (Output): verify the agent produced what was asked
   - Gate 2 (Quality): verify the output meets quality standards
   - Gate 3 (Scope): verify the output stays within authorized boundaries

   **Awareness Domain 5: Session Continuity**
   - `.hivemind/state/continuity.json` — durable JSON persistence
   - `.hivemind/state/delegations.json` — delegation record persistence
   - `.hivemind/state/planning/` — task-level persistence
   - Session journal export: `session-journal-export` tool

   **Awareness Domain 6: Dependency Chain Navigation**
   - Reading ROADMAP.md to find phase dependencies
   - Understanding `depends_on` and `blocks` in phase frontmatter
   - Cross-workstream dependency navigation (skill-ecosystem ↔ agent-synthesis)

2. **`<workflow_awareness>` XML section** added to all ~45 agent bodies:
   - Which workflow artifacts the agent reads (ROADMAP.md, STATE.md, CONTEXT.md)
   - How the agent finds its dependencies
   - How the agent self-verifies through the 3 gates
   - How the agent reports completion
   - How the agent handles mid-task interruption and recovery

3. **Permission model updates:**
   - All agents get `.planning/` read access (to read ROADMAP, STATE, deps)
   - Coordinators (L1) get `.planning/` write access (to update STATE.md)
   - Orchestrators (L0) get `.hivemind/` read access (to read state)

## Acceptance Criteria
- [ ] `WORKFLOW-AWARENESS.md` published with all 6 awareness domains documented
- [ ] All ~45 agents have `<workflow_awareness>` XML section in their body
- [ ] Agents can navigate project structure by reading ROADMAP/STATE (documented in their workflow section)
- [ ] Dependency chains are discoverable by agents (know how to read `depends_on`/`blocks`)
- [ ] 3-gate verification semantics are understood by all agents (documented per agent)
- [ ] Permission models include `.planning/` read access for all agents
- [ ] L1 agents have `.planning/` write permission for STATE.md updates
- [ ] Workflow awareness is consistent across lineages (hm-* and hf-* agents both understand the same workflow)
- [ ] Cross-references to SE-13 engine contracts verified

## Known Risks
- Workflow infrastructure is evolving — WORKFLOW-AWARENESS.md may drift if not maintained
- Adding `.planning/` read access to all agents increases permission scope — must verify no security risk
- L1 STATE.md write access is a mutation capability — must be tightly scoped
- Agents that are not part of workflow execution (e.g., pure research agents) may have minimal workflow awareness — must define "awareness minimal viable content"
- Cross-workstream dependency navigation is complex — agents need clear instructions to not get lost

## Skills/Agents Involved
- **Creates:** `WORKFLOW-AWARENESS.md`
- **Modifies:** All ~45 agent body files (add `<workflow_awareness>` XML section)
- **References:** SE-13 (`hm-hivemind-state-reference`, `hf-hivemind-state-reference`)
- **References:** `.planning/` structure (ROADMAP.md, STATE.md, phase directories)
- **Output feeds:** AS-7 (capability wiring verification must check workflow awareness)
