---
name: "hivefiver-specforge"
description: "Convert messy ideas into strict spec candidates with ambiguity gating, domain-aware examples, and clarification loops."
---

# HiveFiver SpecForge

## Purpose
Turn unstructured or mixed-quality inputs into execution-ready specification scaffolds.

## Distillation Stages
1. Signal extraction: goals, actors, constraints, risks, success signals.
2. Requirement clustering:
- functional
- non-functional
- integration/dependency
- compliance/risk
- operations/support
3. Ambiguity map:
- unresolved
- conflicting
- missing assumptions
- unverifiable claims
4. Candidate generation (2-3 spec options).
5. Recommendation with tradeoff rationale.

## Clarification Protocol
- Ask targeted multiple-choice follow-ups before accepting free-text clarification.
- For enterprise lane, block progression on high-impact ambiguity.
- For vibecoder lane, provide examples before asking for decisions.

## DeepWiki-Informed QA Handling
Use the SDK/prompt behavior guidance as policy:
- treat synthetic reminders and transformed context as allowed scaffolding,
- keep output style stable while improving stop/continue decisions,
- track unresolved items in TODO/task graph before handoff.

## Governance Rules
- Do not execute implementation.
- Surface all high-impact unresolved ambiguities.
- Mark confidence impact per unresolved ambiguity.

## Required Checkpoint
```ts
map_context({ level: "action", content: "SpecForge distillation and ambiguity gating" })
save_mem({ shelf: "decisions", content: "Spec candidate selected with ambiguity map", tags: ["hivefiver", "spec"] })
```

## Output Contract
Return:
- `spec_candidate_a`
- `spec_candidate_b`
- `ambiguity_map`
- `assumption_log`
- `clarification_queue`
- `recommended_spec`
- `next_command`: `/hivefiver-research`
