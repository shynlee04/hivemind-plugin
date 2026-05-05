# CONTEXT: HER-5 — Agent Rationalization

**Workstream:** harness-ecosystem-recovery
**Phase:** HER-5
**Status:** READY
**Parent:** → `workstreams/harness-ecosystem-recovery/ROADMAP.md`

## Purpose

Reduce agent overlap (<50% keyword overlap across all agent pairs), specialize ambiguous agents, and implement role-specific tool access with E2E path validation. The agent-synthesis workstream created 56 hm/hf agents with strong structural quality, but keyword overlap analysis and E2E path testing were deferred.

## Dependencies

- **HER-1 (COMPLETE ✅)**: All 14 broken command agent references fixed. Agent counts synced. validate-restart 0 errors.
- **agent-synthesis (CLOSED 2026-04-30)**: 56 hm/hf agents created — provides the agent inventory to rationalize.
- **skill-ecosystem (CLOSED 2026-04-30)**: 54 active skills with RICH-8 scoring — provides skill quality baseline for agent-to-skill bindings.

## Feature Refs

- f-11 — Role-specific tool access with E2E path validation
- f-03a — Agent registry with permission enforcement (primitive-registry WS-3, PLANNED)

## Key Metrics (Current)

| Metric | Current State |
|--------|---------------|
| Total agents | 89 (33 GSD + 45 hm-* + 11 hf-*) |
| hm-* agents | 45 (2 L0/L1 orchestrators + 28 L2 specialists + 15 core→hm) |
| hf-* agents | 11 (2 L0/L1 orchestrators + 8 L2 specialists) |
| Agent overlap | ⊘ Not yet measured — keyword overlap across agent pairs unknown |
| E2E path validation | ⊘ 16 tools exist, no E2E path test |
| Role-specific tools | ⊘ No formal mapping of agent domain → tool access |

## Requirements

- Measure keyword overlap across all 56 hm/hf agent bodies — target <50% overlap per pair
- Specialize ambiguous agents: agents with >50% overlap require domain refinement or merge
- Map agent domains to appropriate tool access (16 tools in src/tools/)
- Implement E2E path validation: ensure each agent can complete its primary task using only its permitted tools
- Verify no hm-* agent references hf-* skills (lineage boundary enforcement, AS-8 audit confirmed clean)
- Document rationalization decisions for each modified agent

## Blocks

- **primitive-registry (WS-3, PLANNED)**: HER-5's role-to-tool mapping feeds the permission matrix

## Status: READY

Independent of HER-2, HER-3, and HER-4 — depends only on HER-1 (COMPLETE) and the closed agent-synthesis/skill-ecosystem workstreams (both provide stable agent/skill inventories). Can begin immediately when resourced.
