Revise and extend `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` by defining a new independent phase named `CONTEXT-AND-RESEARCH`, and write the result as a precise, implementation-ready playbook update.

Your task is not to implement the system itself. Your task is to produce the phase design, operating logic, structure, scope, and outputs for this new phase so it can become a foundational part of the broader Hivemind harness refactor program.

## Core objective

Create a new standalone phase that formalizes how `context-building`, `research`, `investigation`, `tool-selection`, `evidence gathering`, `synthesis`, and `pre-implementation framing` should happen before any major refactor or new build effort.

This phase must be designed for gradual adoption, iterative trial-and-error, and stacking/chaining behavior across OpenCode meta concepts, while also preparing for Hivemind’s later runtime integration model through config schema, end-user composition, and extensible harness behaviors.

## Historical and architectural context

The system has two important lineages that must both be acknowledged throughout the phase design:

1. `Hivefiver`
    - The module that helps users build and configure meta concepts under the OpenCode engine and SDK.
    - Its concern is authoring, shaping, structuring, and configuring reusable primitives and meta layers.
2. `Hiveminder`
    - The module that uses either:
        - Hivemind’s built-in harness, and/or
        - user-built and user-configured OpenCode meta concepts
    - Its concern is operational use: facilitating actual project execution, intent fulfillment, orchestration, and applied runtime behavior.

The new phase must explicitly support both lineages and avoid bias toward only one of them.

## Strategic framing

This refactor program targets the non-breaking creation, refactoring, and redesign of OpenCode-facing primitives, especially:

- skills
- agents
- commands
- permissions
- configs

However, the immediate priority is `skills`, because:

- skills are the universal glue that shapes the rest of the system
- they influence how agents, commands, workflows, and prompts should eventually behave
- the current agents, commands, workflows, and prompts are not yet stable enough to be treated as final models
- `gsd-*` agents, skills, and commands should be treated as third-party references rather than native final-state architecture
- improving skills first will immediately improve the current project

## Main problem statement

The current skills ecosystem is weak, inconsistent, and not aligned with the intended harness architecture.

The new `CONTEXT-AND-RESEARCH` phase must be designed specifically to address these failures upstream before further implementation continues.

### Current skill problems that must inform the phase design

- Most skills are shallow, fragmented, and often conflict with each other.
- Many skills are not actively invoked by agents.
- When they are invoked, they often create confusion, routing ambiguity, or lower-quality outcomes than third-party installed skills.
- Most skills do not express the true harness model and do not utilize OpenCode advanced configuration capabilities.
- Most skills are not embedded in pipelines or lifecycle-based workflows.
- Most skills do not support coordination, delegation, orchestration, or main/sub-agent collaboration.
- Many skills are confusing in how they present routing, prerequisites, background knowledge, and usage boundaries.
- Existing skills do not adhere to `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/SKILL-CRITERIA-SHORT.md`.
- Existing skills fail to demonstrate proper hierarchy, domain clarity, or specialist implementation behavior.
- Existing skills are not built around metrics, guardrails, gatekeeping, verification loops, or true testable end-to-end completion.
- Many skills are hard-coded around Hivemind-specific primitive terminology without mapping to external frameworks or platform references.
- Skills containing scripts are often broken, inconsistent, non-parameterized, non-variant-friendly, and in some cases context-poisoning.
- Skills containing bundled assets, templates, samples, or references are often shallow, conflicting, poorly routed, hallucination-prone, or non-integrated.

### Tooling and integration problems that must be addressed by this phase

The phase must explicitly account for the fragmented and under-specified use of OpenCode built-ins and related integrations, including questions of `when`, `why`, `how`, and `which` tool to use.

This includes, but is not limited to:

- `apply_patch` vs `edit` vs `write`
- planning tools
- question/clarification tools
- `exa` search vs `webfetch` vs `websearch`
- bash usage
- grep, glob, list, regex, and file discovery patterns
- LSP tools and experimental tools
- OpenCode GitHub integration
- MCP server assumptions and setup dependencies

The phase must also account for essential MCP and external research/tooling dependencies that do not simply “exist by default”, such as:

- Context7
- Repomix
- Deepwiki
- GitMCP
- Exa
- Brave Search
- Tavily

The playbook update must make clear that these require deliberate setup, usage patterns, selection criteria, and chaining strategies.

## Evidence sources to anchor the phase

Use the following as the primary audit and evidence sources for the new phase design:

- `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md`
- `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/SKILL-CRITERIA-SHORT.md`
- `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/skills-lab/active/**/SKILL.md`

## Sector-specific deficiencies that the new phase must directly prepare to solve

The new phase must explicitly frame research and context-building around these weak sectors:

- looping for completion
- guardrails
- non-regression development
- gatekeeping
- self-verification
- task delegation
- sub-agent development
- spec-driven work
- test-driven work
- research
- investigation
- synthesis
- debugging
- refactoring
- planning
- plan execution

Current interpretations in these areas are fragmented, misleading, superficial, or inferior to third-party GSD-oriented skills. The new phase must establish the groundwork for replacing this with rigorous, evidence-backed, operationally useful design.

## What to produce

Write a high-quality playbook addition or revision that introduces the new `CONTEXT-AND-RESEARCH` phase in a way that is clear, operational, and directly usable.

Your output must include all of the following sections:

1. `Phase Purpose`
    - Define why this phase exists.
    - Explain why it must exist as an independent phase instead of being embedded informally elsewhere.
2. `Phase Position in the Program`
    - Explain where this phase sits relative to discovery, refactor, implementation, validation, and runtime integration.
    - Clarify how it supports gradual rollout and iterative stacking.
3. `Phase Scope`
    - Clearly define what is included and what is excluded.
    - Distinguish between:
        - research for skills-first refactor
        - research for agents/commands/workflows/prompts later
        - research for Hivefiver
        - research for Hiveminder
4. `Architectural Principles`
    - Define the governing principles for this phase.
    - These must include:
        - non-breaking evolution
        - skills-first sequencing
        - evidence before implementation
        - explicit tool-selection reasoning
        - composability
        - chainability
        - stackability
        - end-user config readiness
        - runtime integration preparation
        - cross-framework reference awareness
        - guardrails and anti-hallucination discipline
5. `Required Context Model`
    - Define what “context” means in this project.
    - Break it into categories such as:
        - domain context
        - architectural context
        - tool context
        - workflow context
        - runtime/config context
        - lineage context
        - dependency context
        - quality/risk context
6. `Research Model`
    - Define what types of research must occur in this phase.
    - Include:
        - ecosystem research
        - implementation research
        - tool capability research
        - comparative research
        - workflow and chaining research
        - failure-mode research
        - integration readiness research
7. `Skills-First Research Priorities`
    - Explain why skills are the first target.
    - Define how to audit skills against:
        - `SKILL-CRITERIA-SHORT.md`
        - lifecycle usage
        - routing clarity
        - orchestration support
        - guardrails
        - testability
        - delegation support
        - pipeline placement
        - script integrity
        - asset/reference quality
8. `Hivefiver vs Hiveminder Impact Mapping`
    - Show how this phase serves both lineages.
    - Explicitly identify shared concerns and divergent concerns.
    - Clarify where authoring/configuration concerns differ from runtime/project-execution concerns.
9. `Tooling and MCP Decision Framework`
    - Define how the phase should evaluate OpenCode built-ins, LSP, GitHub integration, bash pathways, and MCP servers.
    - Include a framework for:
        - when to use each class of tool
        - when not to use it
        - sequencing/chaining patterns
        - fallback patterns
        - evidence collection expectations
        - assumptions that must never remain implicit
10. `Expected Deliverables of the Phase`
    - List the concrete outputs this phase must produce before downstream implementation begins.
    - Examples may include:
        - context maps
        - research dossiers
        - dependency maps
        - skill audit tables
        - conflict matrices
        - tool-selection guides
        - refactor readiness reports
        - backlog segmentation
        - lineage impact notes
        - risk register
        - rollout assumptions
        - validation criteria
11. `Exit Criteria`
    - Define what must be true before the team may move from `CONTEXT-AND-RESEARCH` into downstream refactor or build phases.
    - These criteria must be strict, observable, and quality-gated.
12. `Failure Signals`
    - Define how to recognize that the phase has been done poorly or incompletely.
    - Include signals such as:
        - shallow synthesis
        - hidden assumptions
        - tool confusion
        - no explicit sequencing
        - no lineage mapping
        - unresolved conflicts
        - non-testable conclusions
        - implementation starting before evidence exists
13. `Recommended Next Phases`
    - Propose the likely downstream phases after `CONTEXT-AND-RESEARCH`, especially for a skills-first roadmap.
    - Keep them high-level but coherent.
14. `Immediate Application to Current Repository`
    - Translate the phase into immediate relevance for the current repository state.
    - Focus on the existing skills ecosystem and explain what this phase would investigate first.

## Writing requirements

- Write in strong, expert, operational English.
- Be concise but complete.
- Be hierarchical, structured, and easy to follow.
- Use terminology consistently.
- Avoid vague motivational language.
- Avoid generic agile language unless it directly serves this architecture.
- Do not answer implementation tasks beyond the phase-design scope.
- Do not invent capabilities that are not grounded in the described system.
- Treat current skill quality as a serious architectural problem, not a cosmetic one.
- Preserve the long-term direction toward runtime-configurable harness integration.
- Make the resulting phase suitable for both human maintainers and AI-assisted execution.

## Output requirements

Produce the result as a clean playbook-ready document section with headings and subheadings.

If useful, include:

- short policy statements
- audit dimensions
- decision tables
- phase checkpoints
- acceptance criteria bullet lists

Do not produce code.
Do not produce filler.
Do not produce commentary about your own reasoning.
Do not omit the dual-lineage architecture.
Do not downplay the skills-first priority.