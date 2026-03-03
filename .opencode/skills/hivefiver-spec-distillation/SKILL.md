---
name: hivefiver-spec-distillation
description: Distill messy requirements into structured specs with ambiguity maps, retry-aware clarification loops, and decision checkpoints.
---

# HiveFiver Spec Distillation

Use this skill when inputs are noisy, contradictory, or incomplete.

## Workflow
1. Extract requirement atoms.
2. Classify into functional, non-functional, integration, risk/compliance, and operations buckets.
3. Build ambiguity map and unresolved queue.
4. Generate 2-3 spec candidates with tradeoffs.
5. Recommend one candidate with rationale.

## Clarification Policy
- MCQ-first clarifications before free text.
- Block progression on unresolved high-impact ambiguity.
- Retry policy: up to 10 rounds with progressive hints.
- Vibecoder lane must include examples for every major decision.

## Required Outputs
- `spec_candidates`
- `ambiguity_map`
- `clarification_attempt`
- `max_attempts`
- `assumption_log`

## References
- `references/ambiguity-taxonomy.md`

## Template
- `templates/spec-candidate.md`

## Script
- `scripts/extract-requirements.sh`
