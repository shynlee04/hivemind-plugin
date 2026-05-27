---
description: "Planning workflow: research → pattern map → spec authoring → plan → verify → iterate. Routes through hm-phase-researcher, hm-pattern-mapper, hm-planner, hm-plan-checker, hm-intent-loop, and hm-specifier agents."
---

# hm-plan

## Goal
Create executable phase plans (`PLAN.md` files) for a roadmap phase with integrated research, pattern mapping, and verification.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Intent loop | hm-intent-loop | Clarify requirements and intent before research |
| Research | hm-phase-researcher | Research implementation approach, produce RESEARCH.md |
| Pattern map | hm-pattern-mapper | Extract patterns from codebase, produce PATTERNS.md |
| Spec author | hm-specifier | Write acceptance criteria, produce SPEC.md |
| Planner | hm-planner | Decompose phase into tasks and waves, write PLAN.md |
| Verifier | hm-plan-checker | Goal-backward validation of plan must-haves |

## Execution Phases
1. **Intent loop**: If intent is unclear, ask user.
2. **Research**: Spawn `hm-phase-researcher` to write `RESEARCH.md`.
3. **Pattern map**: Spawn `hm-pattern-mapper` to write `PATTERNS.md`.
4. **Spec author**: Spawn `hm-specifier` to write `SPEC.md`.
5. **Planner**: Spawn `hm-planner` to write `PLAN.md`.
6. **Plan check**: Spawn `hm-plan-checker` to verify. Loop back to planner if fails.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Choose whether to skip research or replan |
| `human-verify` | Review generated PLAN.md before proceeding |

## Exit Criteria
- `PLAN.md` contains wave structure, file-to-edit maps, and exact verification commands.
- `SPEC.md` contains Zod schemas, API signatures, and test specs.
- `RESEARCH.md` contains stack information, package validation, and findings.
