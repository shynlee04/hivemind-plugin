# Agent-to-Skill Bindings — Canonical Table

This is the canonical reference for which skills each agent domain loads. These bindings are non-negotiable — an agent without its required skills is under-equipped.

> **Source of truth:** This file. If an agent's loading list differs from this table, update the table (if the agent behavior changed) or update the agent (if the table is correct).

## Research Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Researcher | hm-l3-detective, hm-l3-deep-research, hm-l3-tech-stack-ingest, hm-l3-research-chain | 1. detective, 2. tech-stack-ingest, 3. deep-research, 4. research-chain |
| Scout | hm-l3-detective, hm-l3-tech-stack-ingest | 1. detective, 2. tech-stack-ingest |
| Investigator | hm-l3-detective, hm-l2-debug, hm-l2-completion-looping | 1. detective, 2. debug, 3. completion-looping |
| Synthesizer | hm-l3-synthesis, hm-l3-deep-research | 1. synthesis, 2. deep-research |
| Technician | hm-l3-tech-stack-ingest, hm-tech-context-compliance | 1. tech-stack-ingest, 2. tech-context-compliance |

## Planning Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Planner | hm-l2-spec-driven-authoring, hm-l2-planning-persistence | 1. spec-driven-authoring, 2. planning-persistence |
| Strategist | hm-l2-spec-driven-authoring, hm-l2-roadmap-maintainability, hm-l2-feature-ecosystem | 1. spec-driven-authoring, 2. feature-ecosystem, 3. roadmap-maintainability |
| Architect | hm-l2-refactor, hm-l2-cross-cutting-change | 1. refactor, 2. cross-cutting-change |
| Ecologist | hm-l2-feature-ecosystem, hm-l2-roadmap-maintainability | 1. feature-ecosystem, 2. roadmap-maintainability |

## Implementation Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Executor | hm-l2-phase-execution, hm-l2-cross-cutting-change, hm-l2-test-driven-execution | 1. phase-execution, 2. test-driven-execution, 3. cross-cutting-change |
| Builder (hm) | hm-l2-test-driven-execution, hm-l2-cross-cutting-change | 1. test-driven-execution, 2. cross-cutting-change |
| Integrator | hm-l2-phase-execution, hm-l2-production-readiness | 1. phase-execution, 2. production-readiness |
| Operator | hm-l2-phase-execution, hm-l2-completion-looping | 1. phase-execution, 2. completion-looping |

## Quality Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Reviewer | hm-l2-test-driven-execution, gate-evidence-truth, hm-l2-production-readiness | 1. test-driven-execution, 2. evidence-truth, 3. production-readiness |
| Auditor | hm-l2-gate-orchestrator, gate-evidence-truth, gate-spec-compliance | 1. gate-orchestrator, 2. evidence-truth, 3. spec-compliance |
| Validator | hm-l2-test-driven-execution, gate-evidence-truth | 1. test-driven-execution, 2. evidence-truth |
| Critic | gate-evidence-truth, hm-l2-test-driven-execution | 1. evidence-truth, 2. test-driven-execution |
| Assessor | hm-l2-production-readiness, gate-evidence-truth | 1. production-readiness, 2. evidence-truth |

## Debug Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Debugger | hm-l2-debug, hm-l2-completion-looping | 1. debug, 2. completion-looping |
| Investigator | hm-l3-detective, hm-l2-debug, hm-l2-completion-looping | 1. detective, 2. debug, 3. completion-looping |

## Orchestration Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Orchestrator (L0) | hm-l2-gate-orchestrator, hm-l2-coordinating-loop | 1. gate-orchestrator, 2. coordinating-loop |
| Coordinator (L1) | hm-l2-coordinating-loop, hm-l2-subagent-delegation-patterns, hm-l2-gate-orchestrator | 1. coordinating-loop, 2. delegation-patterns, 3. gate-orchestrator |
| Guardian | hm-l2-phase-loop, hm-l2-completion-looping | 1. phase-loop, 2. completion-looping |
| Finisher | hm-l2-completion-looping, hm-l2-test-driven-execution | 1. completion-looping, 2. test-driven-execution |
| Persistor | hm-l2-planning-persistence, hm-l2-completion-looping | 1. planning-persistence, 2. completion-looping |

## Meta-Builder Domain (hf-* lineage)

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Orchestrator (hf L0) | hf-agent-composition, hf-agents-and-subagents-dev, hf-delegation-gates | 1. agent-composition, 2. agents-and-subagents-dev, 3. delegation-gates |
| Coordinator (hf) | hf-agent-composition, hf-agents-and-subagents-dev | 1. agent-composition, 2. agents-and-subagents-dev |
| Agent Builder | hf-agent-composition, hf-agents-and-subagents-dev, hf-naming-syndicate | 1. agent-composition, 2. agents-and-subagents-dev, 3. naming-syndicate |
| Skill Builder | hf-skill-synthesis, hf-use-authoring-skills, hf-naming-syndicate | 1. skill-synthesis, 2. use-authoring-skills, 3. naming-syndicate |
| Command Builder | hf-command-dev, hf-command-parser, hf-naming-syndicate | 1. command-dev, 2. command-parser, 3. naming-syndicate |
| Tool Builder | hf-custom-tools-dev, hf-naming-syndicate | 1. custom-tools-dev, 2. naming-syndicate |
| Auditor (hf) | hf-auditor, gate-evidence-truth (FLEXIBLE justified) | 1. hf-auditor, 2. evidence-truth |
| Refactorer (hf) | hf-use-authoring-skills, hm-l2-refactor (FLEXIBLE justified) | 1. use-authoring-skills, 2. hm-refactor |
| Synthesizer (hf) | hf-skill-synthesis, hm-l3-synthesis (FLEXIBLE justified) | 1. skill-synthesis, 2. hm-synthesis |
| Prompter | hf-agent-composition, hf-context-absorb | 1. agent-composition, 2. context-absorb |

## Discovery Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Brainstormer | hm-l2-brainstorm | 1. brainstorm |
| Mentor | hm-l2-brainstorm, hm-l2-product-validation | 1. brainstorm, 2. product-validation |

## Writing Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Writer | hm-l2-spec-driven-authoring | 1. spec-driven-authoring |
| Curator | hm-l2-production-readiness, hm-l2-roadmap-maintainability | 1. production-readiness, 2. roadmap-maintainability |

## Routing Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Router | hm-l2-skill-router, hm-l2-lineage-router | 1. skill-router, 2. lineage-router |
| Connector | hm-l2-cross-cutting-change, hm-l2-coordinating-loop | 1. cross-cutting-change, 2. coordinating-loop |

## Human-Facing Interaction Domain

| Agent Type | Required Skills | Load Priority |
|-----------|----------------|---------------|
| Intent Loop | hm-l2-user-intent-interactive-loop | 1. user-intent-interactive-loop |

## Edge Cases

### Multi-Domain Agents

Agents that span multiple domains (e.g., hm-l2-connector spans Implementation + Orchestration) load the union of their domain skills. Duplicates are resolved by highest priority domain.

### Stack Reference Loading

Stack-* skills are read-only reference packs loaded on-demand, not by default. Agents in any domain may load stack-* skills when the task requires framework-specific knowledge.

### Unprefixed Skill Loading

The single unprefixed skill (`opencode-config-workflow`) is loaded by hf-* orchestrators and coordinators only. It has no hm-* consumers.
