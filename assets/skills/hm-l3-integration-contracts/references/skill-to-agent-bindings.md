# Skill-to-Agent Bindings — Canonical Table

Which agents consume each skill, across all 5 lineages. This is the canonical record used for orphan detection and overlap analysis.

> **Source of truth:** This file. If a skill's consumer list differs from this table, update this table (if consumption changed) or update the skill's `consumed-by` frontmatter (if this table is correct).

## Research Pipeline Skills (L3 depth)

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hm-l3-detective | hm-l2-researcher, hm-l2-scout, hm-l2-investigator | hm-* | STRICT |
| hm-l3-deep-research | hm-l2-researcher, hm-l2-synthesizer | hm-* | STRICT |
| hm-l3-tech-stack-ingest | hm-l2-researcher, hm-l2-scout, hm-l2-technician | hm-* | STRICT |
| hm-l3-research-chain | hm-l2-researcher | hm-* | STRICT |
| hm-l3-synthesis | hm-l2-synthesizer, hf-l2-synthesizer | hm+hf | FLEXIBLE (hf justified) |
| hm-l3-omo-reference | hm-l2-researcher, hm-l2-architect | hm-* | STRICT |
| hm-l3-opencode-platform-reference | hm-l2-researcher, hf-l2-agent-builder, hf-l2-tool-builder | hm+hf | FLEXIBLE (hf justified) |
| hm-l3-opencode-non-interactive-shell | hm-l2-operator, hf-l2-command-builder | hm+hf | FLEXIBLE (hf justified) |
| hm-l3-opencode-project-audit | hm-l2-auditor, hf-l2-auditor | hm+hf | FLEXIBLE (hf justified) |
| hm-l3-subagent-delegation-patterns | hm-l1-coordinator, hm-l2-operator, hm-l2-guardian | hm-* | STRICT |
| hm-l3-tech-context-compliance | hm-l2-technician, hm-l2-integrator | hm-* | STRICT |
| hm-l3-tool-capability-matrix | hm-l2-technician, hf-l2-agent-builder, hf-l2-tool-builder | hm+hf | FLEXIBLE (hf justified) |
| hm-l3-hivemind-state-reference | hm-l1-coordinator, hm-l2-persistor, hm-l2-operator | hm-* | STRICT |
| hm-l3-hivemind-engine-contracts | hm-l2-integrator, hm-l2-architect, hf-l2-tool-builder | hm+hf | FLEXIBLE (hf justified) |
| hm-l3-integration-contracts | hm-l2-auditor, hm-l2-validator, hf-l2-auditor, hf-l2-meta-builder | hm+hf | FLEXIBLE (hf justified) |

## Planning Skills (L2 depth)

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hm-l2-spec-driven-authoring | hm-l2-planner, hm-l2-writer, hm-l2-strategist | hm-* | STRICT |
| hm-l2-planning-persistence | hm-l2-planner, hm-l2-persistor, hm-l2-executor | hm-* | STRICT |
| hm-l2-roadmap-maintainability | hm-l2-strategist, hm-l2-curator, hm-l2-ecologist | hm-* | STRICT |
| hm-l2-feature-ecosystem | hm-l2-ecologist, hm-l2-strategist | hm-* | STRICT |
| hm-l2-product-validation | hm-l2-mentor, hm-l2-assessor | hm-* | STRICT |
| hm-l2-brainstorm | hm-l2-brainstormer, hm-l2-mentor | hm-* | STRICT |
| hm-l2-requirements-analysis | hm-l2-analyst, hm-l2-router | hm-* | STRICT |

## Execution Skills (L2 depth)

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hm-l2-phase-execution | hm-l2-executor, hm-l2-integrator, hm-l2-operator | hm-* | STRICT |
| hm-l2-cross-cutting-change | hm-l2-executor, hm-l2-builder, hm-l2-connector, hm-l2-architect | hm-* | STRICT |
| hm-l2-test-driven-execution | hm-l2-executor, hm-l2-builder, hm-l2-validator, hm-l2-reviewer, hm-l2-critic, hm-l2-finisher | hm-* | STRICT |
| hm-loop-phase | hm-l2-guardian | hm-* | STRICT |
| hm-loop-completion | hm-l2-debugger, hm-l2-finisher, hm-l2-guardian, hm-l2-investigator, hm-l2-operator, hm-l2-persistor | hm-* | STRICT |
| hm-coord-loop | hm-l0-orchestrator, hm-l1-coordinator, hm-l2-connector | hm-* | STRICT |
| hm-l2-production-readiness | hm-l2-integrator, hm-l2-reviewer, hm-l2-assessor, hm-l2-curator | hm-* | STRICT |

## Quality Skills (L2 depth)

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hm-l2-gate-orchestrator | hm-l0-orchestrator, hm-l1-coordinator, hm-l2-auditor, hm-l2-reviewer | hm-* | STRICT |

## Debug & Refactor Skills (L2 depth)

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hm-l2-debug | hm-l2-debugger, hm-l2-investigator | hm-* | STRICT |
| hm-l2-refactor | hm-l2-architect, hf-l2-refactorer | hm+hf | FLEXIBLE (hf justified) |

## Routing Skills (L2 depth)

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hm-l2-skill-router | hm-l2-router | hm-* | STRICT |
| hf-l2-skill-router | hf-l1-coordinator, hf-l2-meta-builder | hf-* | STRICT |
| hm-l2-lineage-router | hm-l2-router | hm-* | STRICT |

## Internal Gate Skills (L3 depth) — THIS PROJECT ONLY

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| gate-l3-evidence-truth | hm-l2-reviewer, hm-l2-auditor, hm-l2-validator, hm-l2-critic, hm-l2-assessor, hf-l2-auditor | gate (hm+hf) | FLEXIBLE (hf justified) |
| gate-l3-spec-compliance | hm-l2-auditor | gate-* | STRICT (internal only) |
| gate-l3-lifecycle-integration | hm-l2-auditor | gate-* | STRICT (internal only) |

## Meta-Builder Skills (L2 depth) — hf-* lineage

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hf-l2-agent-composition | hf-l0-orchestrator, hf-l1-coordinator, hf-l2-agent-builder, hf-l2-prompter | hf-* | STRICT |
| hf-l2-agents-and-subagents-dev | hf-l0-orchestrator, hf-l1-coordinator, hf-l2-agent-builder | hf-* | STRICT |
| hf-l2-delegation-gates | hf-l0-orchestrator | hf-* | STRICT |
| hf-l2-skill-synthesis | hf-l2-skill-builder, hf-l2-synthesizer | hf-* | STRICT |
| hf-l2-use-authoring-skills | hf-l2-skill-builder, hf-l2-refactorer | hf-* | STRICT |
| hf-l2-naming-syndicate | hf-l2-agent-builder, hf-l2-skill-builder, hf-l2-command-builder, hf-l2-tool-builder | hf-* | STRICT |
| hf-l2-command-dev | hf-l2-command-builder | hf-* | STRICT |
| hf-l2-command-parser | hf-l2-command-builder | hf-* | STRICT |
| hf-l2-custom-tools-dev | hf-l2-tool-builder | hf-* | STRICT |
| hf-l2-context-absorb | hf-l2-prompter | hf-* | STRICT |
| hf-l2-agents-md-sync | hf-l2-auditor | hf-* | STRICT |
| hf-l2-meta-builder | hf-l0-orchestrator, hf-l1-coordinator | hf-* | STRICT |

## Human-Facing Interaction Skills (L2 depth)

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| hm-l2-user-intent-interactive-loop | hm-l2-mentor, hm-l0-orchestrator | hm-* | STRICT |

## Stack Reference Skills (L3 depth) — Read-Only, Both Lineages

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| stack-l3-bun-pty | hf-l2-tool-builder, hm-l2-researcher | stack | OPEN (both) |
| stack-l3-json-render | hf-l2-tool-builder, hm-l2-researcher | stack | OPEN (both) |
| stack-l3-nextjs | hf-l2-tool-builder, hm-l2-researcher | stack | OPEN (both) |
| stack-l3-opencode | hf-l2-agent-builder, hf-l2-tool-builder, hm-l2-researcher | stack | OPEN (both) |
| stack-l3-vitest | hm-l2-executor, hm-l2-builder, hf-l2-tool-builder | stack | OPEN (both) |
| stack-l3-zod | hf-l2-tool-builder, hm-l2-executor | stack | OPEN (both) |

## Unprefixed

| Skill | Consumed By | Lineage Scope | Access |
|-------|------------|--------------|--------|
| opencode-config-workflow | hf-l0-orchestrator, hf-l1-coordinator | both | OPEN |

## Orphan Status

The following skills have zero consumers and are flagged:

| Skill | Status | Reason |
|-------|--------|--------|
| (none currently) | — | All 51 active skills have documented consumers |

*Last verified: 2026-04-30.*
