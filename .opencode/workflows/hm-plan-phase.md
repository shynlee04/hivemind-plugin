---
description: "Phase planning workflow: research → pattern map → plan → verify → iterate. Routes through hm-phase-researcher, hm-pattern-mapper, hm-planner, hm-plan-checker, hm-intent-loop, and hm-specifier agents."
---

# hm-plan-phase

## Goal

Create executable phase plans (PLAN.md files) for a roadmap phase with integrated research, pattern mapping, and verification.

## Agent Routing Table

| Role | Agent | Responsibility |
|------|-------|---------------|
| Intent clarification | hm-intent-loop | Q&A to clarify requirements before research |
| Phase research | hm-phase-researcher | Research implementation approach, produce RESEARCH.md |
| Pattern mapping | hm-pattern-mapper | Extract code patterns from codebase for new file conventions |
| Spec authoring | hm-specifier | Lock requirements into falsifiable acceptance criteria |
| Planning | hm-planner | Task breakdown, dependency analysis, PLAN.md creation |
| Verification | hm-plan-checker | Goal-backward validation of plan completeness |

## Execution Phases

1. **Intent clarification** (hm-intent-loop): Q&A with user to clarify phase requirements, surface assumptions, and scope boundaries. Produces INTENT.md.

2. **Phase research** (hm-phase-researcher): Research implementation approach, identify relevant code areas, dependencies, patterns, and potential blockers. Produces RESEARCH.md.

3. **Pattern mapping** (hm-pattern-mapper): Extract code patterns from existing codebase for new file conventions, style consistency, and architectural alignment. Produces PATTERNS.md.

4. **Spec authoring** (hm-specifier): Lock phase requirements into falsifiable acceptance criteria using spec-driven authoring methodology. Produces SPEC.md.

5. **Planning** (hm-planner): Transform research outputs and spec into detailed executable plan (PLAN.md) with task decomposition, dependency analysis, wave assignment, and effort estimation.

6. **Plan verification** (hm-plan-checker): Goal-backward validation of plan completeness. If FAIL, iterate back to planning (max 2 revision cycles). Produces PASS/FAIL verdict.

## Checkpoint Protocol

| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Present options table to user, wait for selection before continuing |
| `human-verify` | Run automation first, then present results for user confirmation |
| `human-action` | Surface required manual step (secrets, credentials, approvals) and wait |

## Output Contract

- PLAN.md files in the phase directory
- RESEARCH.md (if research phase executed)
- PATTERNS.md (if pattern mapping executed)
- SPEC.md (if spec authoring executed)
- Plan verification verdict (PASS/FAIL)
- INTENT.md (if intent clarification was needed)

<!-- Phase 24.5 TODO: Full workflow implementation with agent dispatch logic, checkpoint handling, and error recovery -->
