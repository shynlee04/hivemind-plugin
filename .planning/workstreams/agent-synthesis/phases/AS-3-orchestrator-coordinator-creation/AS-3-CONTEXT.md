---
phase: AS-3
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-2
  - SE-5
blocks:
  - AS-4
  - AS-6
created: 2026-04-29
---

# AS-3: L0/L1 Orchestrator & Coordinator Creation — Context

## Phase Goal
Create the top-level orchestrator (L0) and coordinator (L1) agents for both lineages. These are the agents that all L2 specialists delegate through. Must use XML body standard, correct permissions, and reference the lineage-router and gate-orchestrator from SE-5.

## Starting State
- AS-2 completed: lineage taxonomy, frontmatter schema, depth definitions, permission templates all defined
- SE-5 completed: `hm-gate-orchestrator` and `hm-lineage-router` skills exist
- Current orchestrator agent: `orchestrator.md` is a 16-line stub — must be completely replaced
- Current coordinator agent: `coordinator.md` exists as a core agent — candidate for hm-* migration
- No hf-* orchestrator or coordinator exist
- No hm-phase-loop-manager exists (phase loop coordination currently handled by skills only)
- GSD agents (`gsd-planner`, `gsd-executor`, etc.) are NOT being replaced yet — D-AD-03 says keep gsd-* until AS-7 verification passes

## Deliverables
1. **`hm-orchestrator.md` (L0)** — Front-facing orchestrator for hm-* lineage:
   - Mode: primary, temperature: 0.2-0.3
   - Delegates to: hm-coordinator (L1) only
   - Responsibilities: workflow routing, gate decisions, human-facing communication
   - Skills: hm-lineage-router, hm-gate-orchestrator, hm-skill-router (SE-10)
   - XML body with full execution flow: receives task → classifies intent → routes to L1 coordinator → aggregates results → presents to user
2. **`hm-coordinator.md` (L1)** — Coordination layer for hm-* lineage:
   - Mode: subagent, temperature: 0.1-0.2
   - Delegates to: L2 hm-* specialists only
   - Responsibilities: wave dispatch, checkpoint management, parallel task coordination
   - Skills: hm-coordinating-loop, hm-phase-loop, hm-phase-execution, hm-completion-looping
3. **`hf-orchestrator.md` (L0)** — Front-facing orchestrator for hf-* lineage:
   - Mode: primary, temperature: 0.2-0.3
   - Delegates to: hf-coordinator (L1, implicit or explicit)
   - Responsibilities: meta-concept creation routing, quality gate management
   - Skills: hf-skill-router (SE-10), hm-gate-orchestrator (cross-lineage access per D-AD-01 FLEXIBLE)
4. **`hm-phase-loop-manager.md` (L1)** — Iterative phase loop manager:
   - Mode: subagent, temperature: 0.1-0.2
   - Delegates to: L2 specialists within a phase loop
   - Responsibilities: manage phase iterations, enforce exit criteria, track checkpoint state

## Acceptance Criteria
- [ ] 4 agent files created with full XML-tagged bodies per AS-1 body format standard
- [ ] YAML frontmatter includes all required fields: lineage, depth, domain, permissions, tools, skills
- [ ] Delegation rules reference hm-lineage-router from SE-5
- [ ] Gate orchestration references hm-gate-orchestrator from SE-5
- [ ] Temperature, tool budget, and permission model match AS-2 schema
- [ ] Each agent has ≥100 LOC body with execution flows and output contracts
- [ ] hm-orchestrator routes to hm-coordinator (L0→L1 depth rule enforced)
- [ ] hf-orchestrator has cross-lineage access to hm-skills (D-AD-01 FLEXIBLE)
- [ ] All 4 agents pass AQUAL-01 through AQUAL-08 quality contract
- [ ] Agent files registered with `.gitkeep` in their directories

## Known Risks
- SE-5 must be complete (hm-gate-orchestrator + hm-lineage-router exist) — if SE-5 is delayed, AS-3 is blocked
- SE-10 (skill routers) is listed as blocking AS-3 in ROADMAP but AS-3 is earlier in sequence — dependency may need clarification
- Existing `orchestrator.md` stub must be replaced — don't accidentally keep the thin version
- hf-orchestrator cross-lineage access to hm-skills is architecturally sensitive — must document clearly
- hm-phase-loop-manager is a new concept that touches both agent and skill domains — boundary must be clear
- gsd-* agents (gsd-planner, gsd-executor) remain active — hm-* orchestrators must not conflict

## Skills/Agents Involved
- **Creates:** `hm-orchestrator.md`, `hm-coordinator.md`, `hf-orchestrator.md`, `hm-phase-loop-manager.md`
- **Replaces:** `orchestrator.md` (16-line stub → full hm-orchestrator)
- **References:** SE-5 skills (`hm-lineage-router`, `hm-gate-orchestrator`)
- **References:** SE-10 routers (`hm-skill-router`, `hf-skill-router`) if complete
