[LANGUAGE: Write this file in en per Language Governance.]
# Landscape — Audit & Rework of Session Management / Coordination / Delegation Tools

**Date:** 2026-06-04
**Owner:** hm-l0-orchestrator
**Status:** WAVE 1 dispatching

## User intent (verbatim summary)

Audit and rework tools related to session management, coordination, and delegation. The user identified that:

- Tools (especially query/read tools) for orchestrators gaining intelligence about sub vs main sessions, cross-session classification, owner-of-session, and context are extremely conflicting, flawed, overlapping, and confusing
- Tools must be traced to engines, libs, hooks, and integrated features nested under `src/**`
- Major flaws (not exhaustive):
  1. Orchestrator doesn't know which tool for which situation
  2. Schema conflicts — especially `status` field hallucinating between `active`/`running`/`aborted`/`canceled`/`completed`
  3. Stackable and resumable must ALWAYS be true when using OpenCode SDK for sessions
  4. Fragmented everywhere
  5. No progressive disclosure for query context; need unified delegation-status with: title (brief), purpose, agents, status, tools, messages — across native, delegate-task, execute-slash-command
  6. Edge case: user can fork session (same main, shared child)
  7. Edge case: multiple main sessions in parallel (no leak between neighbors)
  8. Some tools should be migrated/consolidated/removed
  9. Delegation intelligence is shallow — main agent cannot query tools called, assistant messages, compactions, last actions

## Domain decomposition (9 audit tracks)

| Track | Domain | Specialist | Wave |
|---|---|---|---|
| T1 | Tool surface map (27 tools) | gsd-codebase-mapper | 1 |
| T2 | Session-tracker ecosystem (hierarchy, continuity, project continuity, trajectory, agent-work-contract) | gsd-codebase-mapper | 1 |
| T3 | Tmux integration deep dive (P58.8/P58.9) | gsd-codebase-mapper | 2 |
| T4 | Engine/lib/hook/feature topology under src/** | gsd-codebase-mapper | 1 |
| T5 | Schema unification (status field, SDK vs custom) | gsd-codebase-mapper | 2 |
| T6 | Progressive disclosure design for query context | gsd-architect (planning wave) | 3 |
| T7 | Edge cases: session forking, multiple main sessions | gsd-architect | 3 |
| T8 | Tool migration/consolidation/removal | gsd-architect | 3 |
| T9 | Delegation intelligence (tools/messages/compactions query) | gsd-architect | 3 |

## Wave plan (max 2 parallel per AGENTS.md)

### Wave 1 — Foundational (2 parallel, READ-ONLY)
- **Agent 1A:** Tracks T1 + T2 + T5 (tool surface + session-tracker + status schema) — interconnected, single agent
- **Agent 1B:** Track T4 (engine/lib/hook/feature topology) — broader scope

Output paths:
- `.planning/debug/audit-2026-06-04/wave-1-agent-A-tool-surface-sessions-schema.md`
- `.planning/debug/audit-2026-06-04/wave-1-agent-B-engine-topology.md`

### Wave 2 — Mid-layer (2 parallel after Wave 1, READ-ONLY)
- **Agent 2A:** Track T3 (tmux integration)
- **Agent 2B:** Track T8 (tool consolidation candidates) — needs Wave 1 tool surface

Output paths:
- `.planning/debug/audit-2026-06-04/wave-2-agent-A-tmux-integration.md`
- `.planning/debug/audit-2026-06-04/wave-2-agent-B-tool-consolidation.md`

### Wave 3 — Design (2 parallel after Wave 2, L5 documentation)
- **Agent 3A:** Track T6 (progressive disclosure for delegation-status) + Track T7 (edge cases) — design phase
- **Agent 3B:** Track T9 (delegation intelligence — query tools/messages/compactions) — design phase

Output paths:
- `.planning/debug/audit-2026-06-04/wave-3-agent-A-progressive-disclosure-edge-cases.md`
- `.planning/debug/audit-2026-06-04/wave-3-agent-B-delegation-intelligence.md`

### Wave 4 — Synthesis (1 agent)
- **Agent 4:** Cross-track synthesis — unified picture, prioritized reworks, top 20 issues, recommended phase plan
- Output: `.planning/debug/audit-2026-06-04/wave-4-synthesis-and-rework-plan.md`

## Path decisions

- **Fast-path criteria not met** — multi-specialist, dependent waves, cross-domain → COORDINATED-PATH via L1 not applicable here, dispatching directly to specialists per AGENTS.md "max 2 parallel"
- **Cross-lineage not needed** — all work is hm-* (gsd-codebase-mapper, gsd-architect)
- **Tool choice:** `delegate-task` per user preference ("not using task tool"); S5b fix should now make panel-spawn visible

## Artifact expectations per wave

Each agent must produce:
1. Disk-written markdown at the specified path
2. File:line citations for every claim
3. L5 documentation level (no source code changes in audit phase)
4. Top critical issues with severity ranking
5. Cross-track conflict callouts

## Gate expectations (per return)

- `gate-lifecycle-integration` — does the audit cover all 9 surfaces correctly?
- `gate-spec-compliance` — does each track meet the user's stated criteria?
- `gate-evidence-truth` — is every claim backed by file:line evidence?

## Active dispatches

| Wave | Agent | Delegation ID | Status |
|---|---|---|---|
| 1A | gsd-codebase-mapper (T1+T2+T5) | TBD | dispatching |
| 1B | gsd-codebase-mapper (T4) | TBD | dispatching |
