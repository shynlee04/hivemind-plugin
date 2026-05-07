# Phase BOOT-08: Agent + Skill Integration - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure/governance phase)

<domain>
## Phase Boundary

BOOT-08 delivers L5 governance documentation establishing the agent/skill integration constitution and routing contracts. This phase produces the binding rules that govern how agents and skills participate in the Hivemind runtime — lineage classification, permission boundaries, delegation hierarchy contracts, and discovery/validation requirements. It does NOT implement runtime code — it creates the governance documents that MCM-01/MCM-02 will enforce during migration.

Depends on BOOT-07 (E2E proof) confirming the bootstrap/init/doctor pipeline works. Feeds MCM-01 (agent migration) and MCM-02 (skill migration) with the contracts they must validate against.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — pure infrastructure/governance phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key governance artifacts needed:
- Agent integration constitution (lineage rules, permission model, hierarchy contracts)
- Skill integration constitution (trigger conventions, quality gates, discoverability requirements)
- Routing contracts (how agents/skills are discovered, loaded, validated at runtime)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 89 agents in `.opencode/agents/` with hm-*/hf-* lineage classification
- 123 active skill directories in `.opencode/skills/` with lineage prefixes
- `.hivefiver-meta-builder/` source labs for migration reference
- Phase 0 governance artifacts in `.planning/architecture/`

### Established Patterns
- Q6 state root separation: `.opencode/` = primitives only, `.hivemind/` = internal state
- CQRS: tools = write-side, hooks = read-side
- Delegation hierarchy: L0 → L1 → L2 → L3 with CQRS boundaries
- Config contract: 29 fields in configs.json with named consumers

### Integration Points
- BOOT-04 symlinks connect `.opencode/` to `.hivefiver-meta-builder/` source
- BOOT-06 doctor validates `.opencode/` and `.hivemind/` structure
- MCM-01/MCM-02 consume these contracts during migration verification

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure/governance phase. Refer to ROADMAP phase description and success criteria: "L5: constitution + routing contracts."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
