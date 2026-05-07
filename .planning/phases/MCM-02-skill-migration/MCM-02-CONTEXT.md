# MCM-02: Skill Migration to .opencode/ — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto-generated (verification phase)

<domain>
## Phase Boundary

MCM-02 verifies that hm-*, hf-*, gate-*, and stack-* eligible skills from `.hivefiver-meta-builder/skills-lab/active/refactoring/` are properly classified and discoverable in `.opencode/skills/`. This is a verification gate — skills must have correct lineage prefixes, valid SKILL.md files, and be discoverable by the OpenCode runtime. BOOT-04 symlinks are already in place.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
All implementation choices are at the agent's discretion — verification phase using BOOT-08 skill constitution contracts.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- 123 skill directories in `.opencode/skills/` (BOOT-04 symlinks)
- BOOT-08 Skill Integration Constitution defines lineage rules and quality gates
- Phase 0 identity taxonomy defines prefix boundaries

### Established Patterns
- Skill frontmatter: name, description (with trigger phrases)
- SKILL.md in each directory
- Lineage: hm-* (product), hf-* (meta-authoring), gate-* (quality gates), stack-* (reference), gsd-* (dev-only)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — verification phase. Use BOOT-08 constitution as authority.

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>
