# Reference 04: Project Phase Routing

## hm-* Product Development Phases

Map task domain to the correct specialist workflow. L1 coordinators use this to dispatch L2 specialists.

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
| **Code Review** | hm-l2-reviewer | gate-l3-lifecycle-integration → gate-l3-spec-compliance → gate-l3-evidence-truth |
| **Debugging** | hm-l2-debugger | hm-l2-debug + hm-l2-completion-looping |
| **Refactoring** | hm-l2-optimizer | hm-l2-refactor + hm-l2-cross-cutting-change |
| **Production Readiness** | hm-l2-curator | hm-l2-production-readiness + gate-l3-evidence-truth |
| **Deep Research** | hm-l2-researcher | hm-l3-detective → hm-l3-deep-research → hm-l3-synthesis |
| **Tech Stack Validation** | hm-l2-technician | hm-l3-tech-context-compliance + hm-l3-tech-stack-ingest |
| **Documentation** | hm-l2-writer | hm-l2-spec-driven-authoring |
| **Risk Assessment** | hm-l2-risk-assessor | hm-l2-product-validation |
| **Completion / Finishing** | hm-l2-finisher | hm-l2-completion-looping |
| **Context Mapping** | hm-l2-context-mapper | hm-l3-detective |
| **Integration / E2E** | hm-l2-integrator | hm-l2-production-readiness + gate-l3-evidence-truth |

## hf-* Meta-Builder Phases

| Task Category | L2 Specialist | Skills to Load |
|---------------|---------------|----------------|
| **Agent Building** | hf-l2-agent-builder | hf-l2-agents-and-subagents-dev + hf-l2-agent-composition |
| **Skill Authoring** | hf-l2-skill-builder | hf-l2-use-authoring-skills + hf-l2-skill-synthesis |
| **Command Building** | hf-l2-command-builder | hf-l2-command-dev + hf-l2-command-parser |
| **Tool Building** | hf-l2-tool-builder | hf-l2-custom-tools-dev |
| **Audit (meta-concept)** | hf-l2-auditor | hf-l2-agents-md-sync + gate-l3-evidence-truth |
| **Refactoring (meta-concept)** | hf-l2-refactorer | hf-l2-agents-md-sync + hm-l2-refactor (cross-lineage) |
| **Synthesis (meta-patterns)** | hf-l2-synthesizer | hf-l2-skill-synthesis + hm-l3-synthesis (cross-lineage) |
| **Prompt Engineering** | hf-l2-prompter | prompt-skim → prompt-analyze |
| **Meta-Concept Workflow** | hf-l2-meta-builder | hf-l2-meta-builder-core |

## Gate Skills (Shared Between Lineages)

| Gate | Skill | When to Load | Who Loads It |
|------|-------|-------------|-------------|
| Lifecycle Check | gate-l3-lifecycle-integration | Before accepting any child agent output | hm-l1-coordinator, hf-l1-coordinator |
| Spec Compliance | gate-l3-spec-compliance | After lifecycle gate passes | hm-l1-coordinator, hf-l1-coordinator |
| Evidence Truth | gate-l3-evidence-truth | After spec gate passes (terminal gate) | hm-l1-coordinator, hf-l1-coordinator |
| Gate Orchestration | hm-l2-gate-orchestrator | When running the full triad as a pipeline | hm-l1-coordinator |

## Stack Reference Skills (Any Lineage)

| Stack | Skill | When to Load |
|-------|-------|-------------|
| OpenCode Platform | stack-opencode | Understanding OpenCode SDK, tool registration |
| Zod v4 | stack-l3-zod | Schema validation patterns |
| Vitest | stack-l3-vitest | Test framework reference |
| Bun PTY | stack-l3-bun-pty | PTY integration patterns |
| Next.js | stack-l3-nextjs | GUI sidecar reference |
| json-render | stack-l3-json-render | Generative UI patterns |

## Phase Transition Rules

```
PLANNING → EXECUTION:
  Gate: lifecycle-integration checks that plan is within CQRS boundaries
  Gate: spec-compliance checks that plan traces to requirements
  Pass → dispatch hm-l2-executor

EXECUTION → QUALITY:
  Gate: lifecycle-integration checks implementation surface authority
  Gate: spec-compliance bidirectional traceability
  Gate: evidence-truth checks L1-L5 evidence hierarchy
  Pass → dispatch hm-l2-reviewer

QUALITY → DEPLOYMENT:
  Gate: hm-l2-production-readiness — 8 dimensions
  Gate: evidence-truth — terminal gate
  Pass → ready for deployment

ANY PHASE → RECOVERY:
  Gate: session-tracker check for aborted delegations
  Action: RESUME protocol (hivemind-power-on Section 3.2)
```

## L0 Orchestrator Routing Logic

```
1. Receive task
2. Classify lineage (hm-* or hf-*)
3. Classify domain within lineage (from tables above)
4. Select L1 coordinator:
   - hm-* tasks → hm-l1-coordinator
   - hf-* tasks → hf-l1-coordinator
5. Dispatch with:
   - Task domain
   - Expected L2 specialist type
   - Required quality gates
   - Context budget
6. L1 coordinator maps domain to specific L2 specialist (from tables above)
7. L1 dispatches L2 with task envelope
8. L1 monitors, integrates, verifies
```

## Example: "Audit the session-tracker module"

```
L0: "audit" + "session-tracker module" → hm-* lineage, Audit domain
L0 → hm-l1-coordinator: "Audit session-tracker module, expect hm-l2-auditor"

L1: Session-tracker → source code audit → hm-l2-auditor
L1 → hm-l2-auditor: task envelope with scope, context, verification

L2: Runs code review, produces AUDIT.md
L1: Runs quality gate triad on AUDIT.md → PASS → accepts
L1 → L0: "Audit complete. 12 flaws found. Report at .hivemind/audit/flaw-register-2026-05-10.json"

L0: Reports to user
```

## Example: "Create a skill for session-tracker recovery"

```
L0: "create" + "skill" → hf-* lineage, Skill Authoring domain
L0 → hf-l1-coordinator: "Create skill for session-tracker recovery, expect hf-l2-skill-builder"

L1: Skill authoring → hf-l2-skill-builder
L1 → hf-l2-skill-builder: task envelope with skill name, domain, trigger phrases

L2: Drafts SKILL.md + references/ in .hivefiver-meta-builder/skills-lab/
L1: Runs quality gate triad → PASS → accepts
L1 → L0: "Skill created at .hivefiver-meta-builder/skills-lab/session-tracker-recovery/"

L0: Reports to user, syncs to .opencode/skills/ if needed
```
