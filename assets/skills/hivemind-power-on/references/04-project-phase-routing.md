# Reference 04: Project Phase Routing

**See also:** [03-lineage-routing-tree.md](#)

## Summary

Map task domains to specialist L2 agents. coordinators use these tables to dispatch the correct specialist.

## hm-* Product Development Phases

| Task Category | L2 Specialist | Skills to Load |
|---------------|---------------|----------------|
| **Ideation / Brainstorming** | hm-l2-brainstormer | hm-l2-brainstorm |
| **Requirements Analysis** | hm-l2-analyst | hm-l2-requirements-analysis |
| **Feature Ecosystem Design** | hm-l2-ecologist | hm-l2-feature-ecosystem |
| **Product Validation** | hm-l2-assessor | hm-l2-product-validation |
| **Architecture Design** | hm-l2-architect | hm-l2-spec-driven-authoring |
| **Planning / Spec Authoring** | hm-l2-planner | hm-l2-spec-driven-authoring |
| **Implementation / Execution** | hm-l2-executor | hm-l2-phase-execution + hm-l2-cross-cutting-change |
| **Testing / TDD** | hm-l2-spec-verifier | hm-l2-test-driven-execution |
| **Code Review** | hm-l2-reviewer | gate-lifecycle-integration → gate-spec-compliance → gate-evidence-truth |
| **Debugging** | hm-l2-debugger | hm-l2-debug + hm-l2-completion-looping |
| **Refactoring** | hm-l2-optimizer | hm-l2-refactor + hm-l2-cross-cutting-change |
| **Production Readiness** | hm-l2-curator | hm-l2-production-readiness + gate-evidence-truth |
| **Deep Research** | hm-l2-researcher | hm-l3-detective → hm-l3-deep-research → hm-l3-synthesis |
| **Tech Stack Validation** | hm-l2-technician | hm-l3-tech-context-compliance + hm-l3-tech-stack-ingest |
| **Documentation** | hm-l2-writer | hm-l2-spec-driven-authoring |
| **Risk Assessment** | hm-l2-risk-assessor | hm-l2-product-validation |
| **Completion / Finishing** | hm-l2-finisher | hm-l2-completion-looping |
| **Context Mapping** | hm-l2-context-mapper | hm-l3-detective |
| **Integration / E2E** | hm-l2-integrator | hm-l2-production-readiness + gate-evidence-truth |

## hf-* Meta-Builder Phases

| Task Category | L2 Specialist | Skills to Load |
|---------------|---------------|----------------|
| **Agent Building** | hf-agent-builder | hf-agents-and-subagents-dev + hf-agent-composition |
| **Skill Authoring** | hf-skill-builder | hf-use-authoring-skills + hf-skill-synthesis |
| **Command Building** | hf-command-builder | hf-command-dev + hf-command-parser |
| **Tool Building** | hf-tool-builder | hf-custom-tools-dev |
| **Audit (meta-concept)** | hf-auditor | hf-agents-md-sync + gate-evidence-truth |
| **Refactoring (meta-concept)** | hf-refactorer | hf-agents-md-sync + hm-l2-refactor (cross-lineage) |
| **Synthesis (meta-patterns)** | hf-synthesizer | hf-skill-synthesis + hm-l3-synthesis (cross-lineage) |
| **Prompt Engineering** | hf-prompter | prompt-skim → prompt-analyze |
| **Meta-Concept Workflow** | hf-meta-builder | hf-meta-builder-core |

## Gate Skills (Shared Between Lineages)

| Gate | Skill | Loaded By |
|------|-------|-----------|
| Lifecycle Check | gate-lifecycle-integration | hm-coordinator, hf-coordinator |
| Spec Compliance | gate-spec-compliance | hm-coordinator, hf-coordinator |
| Evidence Truth | gate-evidence-truth | hm-coordinator, hf-coordinator |
| Gate Orchestration | hm-l2-gate-orchestrator | hm-coordinator |

## L0 Orchestrator Routing Logic

```
1. Receive task
2. Classify lineage (hm-* or hf-*) using lineage-routing-tree
3. Classify domain within lineage (from tables above)
4. Select coordinator:
   - hm-* tasks → hm-coordinator
   - hf-* tasks → hf-coordinator
5. Dispatch with: task domain, expected specialist, required gates
6. L1 maps domain to specific specialist (from tables above)
7. L1 dispatches L2 with task envelope
8. L1 monitors, integrates, verifies
```
