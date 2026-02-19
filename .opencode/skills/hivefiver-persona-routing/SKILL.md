---
name: hivefiver-persona-routing
description: Route users to vibecoder or enterprise lanes with domain-aware onboarding, strict governance defaults, and bilingual guidance.
---

# HiveFiver Persona Routing

Use this skill to classify user mode and enforce the right governance posture from the first turn.

## Workflow
1. Run structured MCQ intake.
2. Score persona and domain signals.
3. Confirm lane (`vibecoder` or `enterprise`) and strictness (`assisted` or `strict`).
4. Persist routing decision and next gate requirements.

## Lane Defaults
- `vibecoder`: guided explanations, examples-first, hidden TDD safety rails.
- `enterprise`: strict clarification, evidence-first gating, ambiguity blockade.

## Domain Lanes
- `dev`
- `marketing`
- `finance`
- `office-ops`
- `hybrid`

## References
- `references/persona-matrix.md`

## Template
- `templates/intake-questionnaire.md`

## Script
- `scripts/score-persona.sh`
