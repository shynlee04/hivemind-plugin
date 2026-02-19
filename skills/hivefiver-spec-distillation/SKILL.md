---
name: hivefiver-spec-distillation
description: Distill messy requirements into structured specs with ambiguity maps, assumptions, and decision checkpoints across technical and non-technical domains.
---

# HiveFiver Spec Distillation

Use this skill when inputs are noisy, contradictory, or incomplete.

## Workflow
1. Extract requirement atoms.
2. Classify into functional, non-functional, integration, risk/compliance, and operations.
3. Build ambiguity map and unresolved queue.
4. Generate 2-3 candidate specs with tradeoffs.
5. Recommend one candidate with justification.

## Clarification Policy
- Ask MCQ-style clarifying questions before free text.
- Block progression on unresolved high-impact ambiguity.
- For vibecoder, provide examples for each key decision.

## References
- `references/ambiguity-taxonomy.md`

## Template
- `templates/spec-candidate.md`

## Script
- `scripts/extract-requirements.sh`
