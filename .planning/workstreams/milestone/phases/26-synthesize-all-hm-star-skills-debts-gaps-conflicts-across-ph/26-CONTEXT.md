# Phase 26: Synthesize hm-* Skill Debts into Unified Quality Requirements - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Synthesize ALL hm-* skill deficits, gaps, and conflicts across Phases 17-24 into a unified quality playbook and execution roadmap. The G-B cluster (hm-spec-driven-authoring, hm-test-driven-execution) serves as the demonstration template — proving the quality framework before applying it to the full hm-* ecosystem (G-A through G-D).

**In scope:**
- Full hm-* ecosystem audit: inventory all 24+ skills, catalog quality gaps against defined benchmarks
- Unified quality PLAYBOOK.md: standards for trigger accuracy, body depth, 6-NON defence, eval coverage, reference completeness, meta-concept integration
- G-B demonstration SPECs: per-skill falsifiable requirements for hm-spec-driven-authoring and hm-test-driven-execution
- Integration wiring specification: how these skills connect to agents, tools, commands, plugins SDK, and runtime state routers
- Phase 27-30 execution roadmap: sequenced improvement plan for G-C, G-D, and remaining lineages
- Archive artifacts: formal closure of Phase 22 (NOT SUBSTANTIATED) and Phase 23 (PARTIAL) with scope absorption

**Out of scope:**
- Any skill file mutations (this is a read-only synthesis phase — per Phase 18 D-01 inheritance)
- Actual skill rewrites (deferred to Phase 27+)
- New skill creation beyond the SPEC and PLAYBOOK artifacts
- src/ code changes (hard harness untouched)
- IDE-directory modifications

</domain>

<decisions>
## Implementation Decisions

### Benchmark Strategy
- **D-01:** hm-* skills must be standalone-superior — independently valuable without GSD dependency, comparable in quality to GSD's battle-tested skill ecosystem (gsd-spec-phase, gsd-add-tests, gsd-verify-work). Designed as an opt-in cohesive "quality assurance" lineage that works in any project regardless of what other frameworks exist.
- **D-02:** Benchmark quality bar = GSD skill ecosystem output quality. Each hm-* skill must produce artifacts as concrete and actionable as GSD counterparts (SPEC.md with falsifiable REQ-*, verification reports with pass/fail gates, eval bundles with stacked scenarios).

### Output Artifacts
- **D-03:** Phase 26 delivers a unified quality PLAYBOOK.md covering ALL hm-* skills across all lineages (G-A through G-D). This is the canonical quality standard — every future hm-* skill improvement is measured against it.
- **D-04:** The G-B cluster (hm-spec-driven-authoring, hm-test-driven-execution) receives full SPEC files as the demonstration template. These SPECs prove the PLAYBOOK standards are actionable and serve as the pattern for G-C, G-D, and remaining lineages.
- **D-05:** Phase 26 also produces: (a) an ecosystem audit catalog (all 24+ hm-* skills scored against PLAYBOOK dimensions), (b) a Phase 27-30 execution roadmap sequencing the remaining improvement waves, (c) updated `.planning/REQUIREMENTS.md` entries for hm-* skill quality standards.

### Integration Mandate
- **D-06:** Skills are runtime components, not standalone `.md` files. Each PLAYBOOK quality dimension must address: agent integration (allowed-tools, permissions, temperature), command integration (!bash injection, $ARGUMENTS parsing), tool integration (Zod schema alignment), plugins SDK hooks (PreToolUse, PostToolUse), and runtime state routers (continuity, lifecycle-manager).
- **D-07:** Skills must be platform-agnostic — designed for OpenCode native, Hivemind harness runtime, and arbitrary end-user project environments. No hardcoded assumptions about available tools, file paths, or project structure.

### Conflict Resolution
- **D-08:** Phase 22 (Script Hardening + 6-NON tables) is ARCHIVED as NOT SUBSTANTIATED. STATE.md confirms the commit doesn't match claims. Its intended scope (6-NON defence tables) is absorbed into the PLAYBOOK.md quality standards with proper evidence requirements.
- **D-09:** Phase 23 (Body Quality + Eval) scope is ABSORBED. Its eval bundle work (only 1/9 skills has stacked scenarios) is subsumed into PLAYBOOK standards that require complete eval bundles with stacked scenarios for every skill. No separate Phase 23 re-execution needed.

### Scope Boundary
- **D-10:** Full hm-* ecosystem scope for audit (all 24+ skills across Phases 17-24). G-B cluster is the first improvement wave and demonstration template. G-C (research lineage) and G-D (execution lineage) are deferred to Phases 27-30 with explicit dependency on the PLAYBOOK standards.
- **D-11:** Two lineages identified: the "Quality Assurance" lineage (G-B: spec-driven + test-driven + hm-phase-loop + hm-planning-with-files) forms a self-contained unit users can opt into independently. The "Research + Execution" lineage (G-C + G-D) forms the complementary set.

### the agent's Discretion
- Exact PLAYBOOK structure and dimension count (minimum: trigger accuracy, body depth, 6-NON, eval coverage, reference completeness, integration wiring, cross-platform compatibility)
- Benchmark comparison methodology (side-by-side output quality vs. GSD equivalents)
- Phase 27-30 sequencing order and phase count
- Archive metadata format for Phase 22 and Phase 23 closure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture and Decisions
- `.planning/PROJECT.md` — Project vision, non-negotiables, dual-half architecture (hard harness vs. soft meta-concepts)
- `.planning/STATE.md` — Current milestone state, Phase 22/23 gap status, 6-NON audit findings
- `.planning/REQUIREMENTS.md` — Project-level requirements, acceptance criteria
- `.planning/ROADMAP.md` §Phase 17-26 — Full hm-* skill lineage genesis and planning history

### hm-* Skills Ecosystem
- `.planning/phases/17-hivemind-skills-refactor/17-CONTEXT.md` — C1-C5 critical fixes, hm-* naming mandate, soft→hard bridge model
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/18-CONTEXT.md` — Read-only audit posture, 6-NON grid, differential cluster model
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/CR-GAP-MAP.md` — Differential cluster gap map: G-A through G-D clusters, severity, owning phases, recommended actions
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/CR-DECISIONS.md` — Tooling decision table per skill (no-change/description/body/bundle/rename/split/merge/create/retire)
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/CR-AUDIT-ECOSYSTEM.md` — Full 6-NON audit of 24 skills with EXPOSED/PARTIAL/DEFENDED cells

### Target Skills (Current State)
- `.opencode/skills/hm-spec-driven-authoring/SKILL.md` — 107 lines, created Phase 20 Wave 4, minimum viable, no 6-NON, partial evals
- `.opencode/skills/hm-test-driven-execution/SKILL.md` — 119 lines, created Phase 20 Wave 4, minimum viable, no 6-NON, partial evals
- `.opencode/skills/hm-spec-driven-authoring/references/spec-to-req-mapping.md` — Reference: spec decomposition patterns
- `.opencode/skills/hm-spec-driven-authoring/references/acceptance-test-patterns.md` — Reference: test patterns by domain
- `.opencode/skills/hm-test-driven-execution/references/red-green-refactor.md` — Reference: canonical TDD cycle
- `.opencode/skills/hm-test-driven-execution/references/coverage-verification.md` — Reference: coverage claim verification

### GSD Quality Benchmarks (Reference Standards)
- `.opencode/skills/gsd-spec-phase/SKILL.md` — GSD spec refinement: ambiguity scoring, falsifiable requirements (if available)
- `.opencode/skills/gsd-add-tests/SKILL.md` — GSD test generation: UAT criteria derivation (if available)
- `.opencode/skills/gsd-verify-work/SKILL.md` — GSD verification: conversational UAT validation (if available)
- `.opencode/skills/gsd-eval-auditor/SKILL.md` — GSD eval audit: COVERED/PARTIAL/MISSING scoring (if available)

### Integration Specifications
- `.opencode/agents/` — All 57 agent definitions: allowed-tools patterns, permission models, temperature configs
- `.opencode/commands/` — All 13 command definitions: $ARGUMENTS parsing, !bash injection patterns
- `src/tools/` — Hard harness tool implementations: Zod schema patterns, hook integration
- `src/plugin.ts` — Composition root: AGENT_DEFAULTS, AGENT_TOOLS, circuit breaker config
- `AGENTS.md` — Project-level agent instructions, non-negotiable rules, subagent delegation patterns

### Gap-Stage Phase Records (for archival reference)
- `.planning/phases/22-script-hardening-playbook-phase-4/22-PLAN.md` — Phase 22 plan (NOT SUBSTANTIATED per STATE.md)
- `.planning/phases/23-body-quality-eval-playbook-phase-5/23-PLAN.md` — Phase 23 plan (PARTIAL per STATE.md)
- `.planning/phases/20-structural-changes-playbook-phase-2/20-23-SUMMARY.md` — Phase 20-23 cross-phase summary

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.opencode/skills/` directory: 22 existing skills with established directory structure (SKILL.md + references/ + evals/ + scripts/)
- `.opencode/agents/` directory: 57 agent definitions with proven YAML frontmatter patterns for allowed-tools, permissions, temperature
- `src/schema-kernel/`: Zod schemas for prompt-enhance pipeline that hm-* skills can align with

### Established Patterns
- Skill structure: YAML frontmatter (name, description, metadata, allowed-tools) → body with trigger words, step-by-step workflows, reference maps, cross-references, anti-pattern tables
- 6-NON defence pattern: NON-1 (Audit Trail), NON-2 (Context Grounding), NON-3 (Entry/Exit Gates), NON-4 (Scope Containment), NON-5 (Eval Coverage), NON-6 (Freshness)
- Eval bundle pattern: evals/evals.json + evals/trigger-queries.json (Phase 23 partial standard)
- All hm-* skills share the same skeleton but vary in body depth (0-5 references, 0-3 evals, 0-6 NON cells)

### Integration Points
- Skills are referenced by agents via `allowed-tools: [Skill]` in agent frontmatter
- Skills are invoked by commands via `Skill(skill="...", args="...")` in command bodies
- Skills load at session start via OpenCode plugin's skill loader
- The hard harness (`src/`) provides runtime tools that skills can use (delegate-task, prompt-skim, etc.)

### Quality Regression Patterns (from audit)
- Template-driven creation (Phase 20) produced structurally valid but substantively hollow skills
- Phase 21 rewrote descriptions only — body quality untouched
- Phase 22 (6-NON) was claimed but unsubstantiated — no verifiable defence tables in skill files
- Phase 23 (evals) was partial — evals.json exists but only hm-completion-looping has stacked scenario
- The "minimum viable" creation pattern became the ceiling, not the floor

</code_context>

<specifics>
## Specific Ideas

- "Skills must work as standalone superior sets — when GSD isn't available at users' spaces, these are the go-to quality assurance lineage"
- "Users must distinctly opt for these as their of-choice set as oneness" — the G-B lineage (spec-driven + test-driven + phase-loop + planning-with-files) should form a recognizable, cohesive package
- "Integration so that these skills work for OpenCode as for Hivemind harness when shipped and when integrated with other meta concepts" — platform-agnostic design, no hardcoded assumptions
- "When used under wide scopes of users' projects (different purposes, use cases, high automation and collaborative work on client-side)" — skills must be parameterizable, not prescriptive about project structure

</specifics>

<deferred>
## Deferred Ideas

- Full hm-* skill rewrites (G-B execution) — Phase 27
- G-C lineage (research chain: hm-deep-research, hm-detective, hm-synthesis, hm-research-chain) improvement — Phase 28
- G-D lineage (execution: hm-debug, hm-refactor, hm-phase-execution, hm-planning-with-files) improvement — Phase 29
- G-A lineage (guardrails: hm-completion-looping, hm-subagent-delegation-patterns, hm-user-intent-interactive-loop) improvement — Phase 30
- Cross-lineage integration testing and end-to-end meta-concept validation — Phase 31
- Third-party skill registry benchmarking beyond GSD ecosystem — deferred until PLAYBOOK baseline is established

</deferred>

---

*Phase: 26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph*
*Context gathered: 2026-04-25*
