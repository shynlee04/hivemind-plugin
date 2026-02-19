---
name: hivefiver-persona-routing
description: Route users into vibecoder, floppy_engineer, or enterprise_architect lanes with strict governance defaults and domain-aware onboarding.
---

# HiveFiver Persona Routing

Use this skill at onboarding and whenever user intent shifts significantly.

## Workflow
1. Run structured MCQ intake.
2. Score persona/domain signals.
3. Resolve lane (`vibecoder`, `floppy_engineer`, `enterprise_architect`).
4. Assign strictness (`assisted` or `strict`) and workflow.
5. Persist lane decision + next gate requirements.

## Lane Defaults
- `vibecoder`: examples-first, click-by-click flow, hidden TDD rails.
- `floppy_engineer`: chunk cleanup, coherence scoring, strict ambiguity gates.
- `enterprise_architect`: compliance-first, evidence-first, hard risk blockades.

## Domain Lanes
- `dev`
- `marketing`
- `finance`
- `office-ops`
- `hybrid`

## Required Outputs
- `persona_lane`
- `domain_lane`
- `workflow_lane`
- `governance_mode`
- `next_action`

## References
- `references/persona-matrix.md`

## Template
- `templates/intake-questionnaire.md`

## Script
- `scripts/score-persona.sh`
