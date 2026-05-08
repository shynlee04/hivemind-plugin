# MCM-01: Agent Migration to .opencode/ — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto-generated (verification phase)

<domain>
## Phase Boundary

MCM-01 verifies that hm-* and hf-* eligible agents from `.hivefiver-meta-builder/agents-lab/active/refactoring/` are properly classified and discoverable in `.opencode/agents/`. This is a verification gate — agents must have correct lineage prefixes, valid frontmatter, and be discoverable by the OpenCode runtime. BOOT-04 symlinks are already in place.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — verification phase using BOOT-08 constitution contracts.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 89 agents in `.opencode/agents/` (BOOT-04 symlinks)
- BOOT-08 Agent Integration Constitution defines lineage rules
- Phase 0 identity taxonomy defines prefix boundaries

### Established Patterns
- Agent frontmatter: name, description, temperature, permission (granular tool access)
- Lineage: hm-* (product), hf-* (meta-authoring), gsd-* (dev-only, never shipped)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — verification phase. Use BOOT-08 constitution as authority.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
